import request from 'supertest';
import { app, server } from '../server';
import { prisma } from '../server';

describe('Usage API', () => {
  const testOrganization = 'Test Corp';

  beforeEach(async () => {
    // Clean up test data
    await prisma.dynatraceUsage.deleteMany({});
  });

  afterAll(async () => {
    await prisma.dynatraceUsage.deleteMany({});
    await prisma.$disconnect();
    server.close();
  });

  describe('GET /api/usage/check-upload-eligibility/:organization', () => {
    it('should return eligible when no previous uploads exist', async () => {
      const response = await request(app)
        .get(`/api/usage/check-upload-eligibility/${testOrganization}`)
        .expect(200);

      expect(response.body.eligible).toBe(true);
      expect(response.body.message).toBe('No previous uploads found for this organization');
      expect(response.body.lastUploadDate).toBeNull();
    });

    it('should return not eligible when last upload was within 30 days', async () => {
      // Create a recent upload
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15); // 15 days ago

      await prisma.dynatraceUsage.create({
        data: {
          capability: 'Test Capability',
          annualBudgetCost: 1000,
          last30DaysCost: 100,
          organization: testOrganization,
          uploadDate: recentDate,
        },
      });

      const response = await request(app)
        .get(`/api/usage/check-upload-eligibility/${testOrganization}`)
        .expect(200);

      expect(response.body.eligible).toBe(false);
      expect(response.body.message).toBe('It has NOT been 30 days since the last upload. Do you want to overwrite?');
      expect(response.body.daysSinceLastUpload).toBe(15);
    });

    it('should return eligible when last upload was over 30 days ago', async () => {
      // Create an old upload
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      await prisma.dynatraceUsage.create({
        data: {
          capability: 'Test Capability',
          annualBudgetCost: 1000,
          last30DaysCost: 100,
          organization: testOrganization,
          uploadDate: oldDate,
        },
      });

      const response = await request(app)
        .get(`/api/usage/check-upload-eligibility/${testOrganization}`)
        .expect(200);

      expect(response.body.eligible).toBe(true);
      expect(response.body.message).toBe('Upload is allowed');
      expect(response.body.daysSinceLastUpload).toBe(35);
    });
  });

  describe('POST /api/usage/upload', () => {
    it('should upload valid CSV file successfully', async () => {
      const csvContent = `Capability,Annual budget-to-date cost (USD),Last 0-30 days cost (USD)
Application Performance Monitoring,5000.50,450.25
Infrastructure Monitoring,3000.75,300.10`;

      const response = await request(app)
        .post('/api/usage/upload')
        .field('organization', testOrganization)
        .attach('file', Buffer.from(csvContent), 'usage.csv')
        .expect(201);

      expect(response.body.message).toBe('Usage data uploaded successfully');
      expect(response.body.inserted).toBe(2);
      expect(response.body.organization).toBe(testOrganization);
    });

    it('should reject upload within 30 days without force parameter', async () => {
      // Create a recent upload
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15);

      await prisma.dynatraceUsage.create({
        data: {
          capability: 'Test Capability',
          annualBudgetCost: 1000,
          last30DaysCost: 100,
          organization: testOrganization,
          uploadDate: recentDate,
        },
      });

      const csvContent = `Capability,Annual budget-to-date cost (USD),Last 0-30 days cost (USD)
New Capability,2000.00,200.00`;

      const response = await request(app)
        .post('/api/usage/upload')
        .field('organization', testOrganization)
        .attach('file', Buffer.from(csvContent), 'usage.csv')
        .expect(409);

      expect(response.body.error).toBe('Upload not allowed');
      expect(response.body.message).toBe('It has NOT been 30 days since the last upload. Do you want to overwrite?');
    });

    it('should allow upload within 30 days with force=true parameter', async () => {
      // Create a recent upload
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15);

      await prisma.dynatraceUsage.create({
        data: {
          capability: 'Old Capability',
          annualBudgetCost: 1000,
          last30DaysCost: 100,
          organization: testOrganization,
          uploadDate: recentDate,
        },
      });

      const csvContent = `Capability,Annual budget-to-date cost (USD),Last 0-30 days cost (USD)
New Capability,2000.00,200.00`;

      const response = await request(app)
        .post('/api/usage/upload?force=true')
        .field('organization', testOrganization)
        .attach('file', Buffer.from(csvContent), 'usage.csv')
        .expect(201);

      expect(response.body.message).toBe('Usage data uploaded successfully');
      expect(response.body.inserted).toBe(1);

      // Verify old data was archived/deleted
      const remainingData = await prisma.dynatraceUsage.findMany({
        where: { organization: testOrganization }
      });
      expect(remainingData).toHaveLength(1);
      expect(remainingData[0]?.capability).toBe('New Capability');
    });

    it('should reject file with invalid numeric values', async () => {
      const csvContent = `Capability,Annual budget-to-date cost (USD),Last 0-30 days cost (USD)
Test Capability,invalid-number,200.00`;

      const response = await request(app)
        .post('/api/usage/upload')
        .field('organization', testOrganization)
        .attach('file', Buffer.from(csvContent), 'usage.csv')
        .expect(400);

      expect(response.body.error).toBe('CSV validation failed');
      expect(response.body.details[0]).toContain('Invalid Annual budget-to-date cost (USD) - must be a number');
    });

    it('should return 400 when organization is missing', async () => {
      const csvContent = `Capability,Annual budget-to-date cost (USD),Last 0-30 days cost (USD)
Test Capability,1000.00,100.00`;

      const response = await request(app)
        .post('/api/usage/upload')
        .attach('file', Buffer.from(csvContent), 'usage.csv')
        .expect(400);

      expect(response.body.error).toBe('Organization is required in request body');
    });
  });
});
