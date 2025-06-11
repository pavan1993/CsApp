import request from 'supertest';
import { app, server } from '../server';
import { prisma } from '../server';

describe('Tickets API', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.supportTicket.deleteMany({});
  });

  afterAll(async () => {
    await prisma.supportTicket.deleteMany({});
    await prisma.$disconnect();
    server.close();
  });

  describe('POST /api/tickets/upload', () => {
    it('should upload valid CSV file successfully', async () => {
      const csvContent = `ID,Status,Requested,Organization,Subject,Updated,Assignee,Requester,Product Area,Reason for Contact,Severity
TICKET-001,Open,01/15/2024 10:30,Acme Corp,Login Issue,01/15/2024 11:00,john.doe,jane.smith,Authentication,Bug Report,CRITICAL
TICKET-002,Closed,01/16/2024 14:20,Acme Corp,Feature Request,01/17/2024 09:15,alice.johnson,bob.wilson,Dashboard,Enhancement,MODERATE`;

      const response = await request(app)
        .post('/api/tickets/upload')
        .attach('file', Buffer.from(csvContent), 'tickets.csv')
        .expect(201);

      expect(response.body.message).toBe('Tickets uploaded successfully');
      expect(response.body.inserted).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('should reject file with missing required fields', async () => {
      const csvContent = `ID,Status,Organization
TICKET-001,Open,Acme Corp`;

      const response = await request(app)
        .post('/api/tickets/upload')
        .attach('file', Buffer.from(csvContent), 'tickets.csv')
        .expect(400);

      expect(response.body.error).toBe('CSV validation failed');
      expect(response.body.details[0]).toContain('Missing required field: Requested');
    });

    it('should reject invalid date format', async () => {
      const csvContent = `ID,Status,Requested,Organization,Subject,Updated,Assignee,Requester,Product Area,Reason for Contact,Severity
TICKET-001,Open,invalid-date,Acme Corp,Login Issue,01/15/2024 11:00,john.doe,jane.smith,Authentication,Bug Report,CRITICAL`;

      const response = await request(app)
        .post('/api/tickets/upload')
        .attach('file', Buffer.from(csvContent), 'tickets.csv')
        .expect(400);

      expect(response.body.error).toBe('CSV validation failed');
      expect(response.body.details[0]).toContain('Invalid Requested date format');
    });

    it('should reject non-CSV files', async () => {
      const response = await request(app)
        .post('/api/tickets/upload')
        .attach('file', Buffer.from('not a csv'), 'file.txt')
        .expect(500);

      expect(response.body.error).toContain('Only CSV files are allowed');
    });

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/tickets/upload')
        .expect(400);

      expect(response.body.error).toBe('No file uploaded');
    });
  });
});
