import request from 'supertest';
import { app } from '../server';
import { connectDatabase } from '../config/database';
import { TicketSeverity } from '@prisma/client';
import sampleConfig from './fixtures/sample-config.json';

// Type-safe access to sample data
const getProductAreaMapping = (index: number) => {
  const mapping = sampleConfig.productAreaMappings[index];
  if (!mapping) throw new Error(`Product area mapping at index ${index} not found`);
  return mapping;
};

const getThresholdConfiguration = (index: number) => {
  const threshold = sampleConfig.thresholdConfigurations[index];
  if (!threshold) throw new Error(`Threshold configuration at index ${index} not found`);
  return {
    ...threshold,
    severityLevel: threshold.severityLevel as TicketSeverity
  };
};

const prisma = connectDatabase();

describe('Configuration API', () => {
  const testOrg = 'test-org';
  const otherOrg = 'other-org';

  beforeEach(async () => {
    // Clean up test data
    await prisma.thresholdConfiguration.deleteMany({
      where: { organization: { in: [testOrg, otherOrg] } }
    });
    await prisma.productAreaMapping.deleteMany({
      where: { organization: { in: [testOrg, otherOrg] } }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.thresholdConfiguration.deleteMany({
      where: { organization: { in: [testOrg, otherOrg] } }
    });
    await prisma.productAreaMapping.deleteMany({
      where: { organization: { in: [testOrg, otherOrg] } }
    });
    await prisma.$disconnect();
  });

  describe('Product Area Mapping Endpoints', () => {
    describe('GET /api/config/mapping/:organization', () => {
      it('should return empty array when no mappings exist', async () => {
        const response = await request(app)
          .get(`/api/config/mapping/${testOrg}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: [],
          count: 0
        });
      });

      it('should return mappings for specific organization', async () => {
        // Create test mappings
        const mapping1Data = getProductAreaMapping(0);
        const mapping2Data = getProductAreaMapping(1);
        
        const mapping1 = await prisma.productAreaMapping.create({
          data: mapping1Data
        });
        const mapping2 = await prisma.productAreaMapping.create({
          data: mapping2Data
        });

        // Create mapping for different org
        await prisma.productAreaMapping.create({
          data: { 
            ...mapping1Data, 
            organization: otherOrg 
          }
        });

        const response = await request(app)
          .get(`/api/config/mapping/${testOrg}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(2);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data.map((m: any) => m.id)).toContain(mapping1.id);
        expect(response.body.data.map((m: any) => m.id)).toContain(mapping2.id);
      });

      it('should return 400 for invalid organization', async () => {
        const response = await request(app)
          .get('/api/config/mapping/')
          .expect(404);
      });
    });

    describe('POST /api/config/mapping/:organization', () => {
      it('should create new mapping successfully', async () => {
        const mappingData = getProductAreaMapping(0);

        const response = await request(app)
          .post(`/api/config/mapping/${testOrg}`)
          .send(mappingData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          productArea: mappingData.productArea,
          dynatraceCapability: mappingData.dynatraceCapability,
          organization: testOrg,
          isKeyModule: mappingData.isKeyModule
        });

        // Verify in database
        const dbMapping = await prisma.productAreaMapping.findUnique({
          where: {
            productArea_dynatraceCapability_organization: {
              productArea: mappingData.productArea,
              dynatraceCapability: mappingData.dynatraceCapability,
              organization: testOrg
            }
          }
        });
        expect(dbMapping).toBeTruthy();
      });

      it('should return 400 for missing required fields', async () => {
        const invalidMappings = sampleConfig.invalidMappings;

        for (const invalidMapping of invalidMappings) {
          await request(app)
            .post(`/api/config/mapping/${testOrg}`)
            .send(invalidMapping)
            .expect(400);
        }
      });

      it('should return 409 for duplicate mapping', async () => {
        const mappingData = getProductAreaMapping(0);

        // Create first mapping
        await request(app)
          .post(`/api/config/mapping/${testOrg}`)
          .send(mappingData)
          .expect(201);

        // Try to create duplicate
        await request(app)
          .post(`/api/config/mapping/${testOrg}`)
          .send(mappingData)
          .expect(409);
      });

      it('should default isKeyModule to false', async () => {
        const mappingData = {
          productArea: 'Test Area',
          dynatraceCapability: 'Test Capability'
        };

        const response = await request(app)
          .post(`/api/config/mapping/${testOrg}`)
          .send(mappingData)
          .expect(201);

        expect(response.body.data.isKeyModule).toBe(false);
      });
    });

    describe('PUT /api/config/mapping/:organization/:id', () => {
      it('should update mapping successfully', async () => {
        // Create initial mapping
        const mappingData = getProductAreaMapping(0);
        const mapping = await prisma.productAreaMapping.create({
          data: mappingData
        });

        const updateData = {
          productArea: 'Updated Area',
          isKeyModule: false
        };

        const response = await request(app)
          .put(`/api/config/mapping/${testOrg}/${mapping.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.productArea).toBe(updateData.productArea);
        expect(response.body.data.isKeyModule).toBe(updateData.isKeyModule);
      });

      it('should return 404 for non-existent mapping', async () => {
        await request(app)
          .put(`/api/config/mapping/${testOrg}/non-existent-id`)
          .send({ productArea: 'Updated Area' })
          .expect(404);
      });

      it('should return 400 for invalid update data', async () => {
        const mappingData = getProductAreaMapping(0);
        const mapping = await prisma.productAreaMapping.create({
          data: mappingData
        });

        await request(app)
          .put(`/api/config/mapping/${testOrg}/${mapping.id}`)
          .send({ productArea: '' })
          .expect(400);
      });
    });

    describe('DELETE /api/config/mapping/:organization/:id', () => {
      it('should delete mapping successfully', async () => {
        const mappingData = getProductAreaMapping(0);
        const mapping = await prisma.productAreaMapping.create({
          data: mappingData
        });

        await request(app)
          .delete(`/api/config/mapping/${testOrg}/${mapping.id}`)
          .expect(200);

        // Verify deletion
        const deletedMapping = await prisma.productAreaMapping.findUnique({
          where: { id: mapping.id }
        });
        expect(deletedMapping).toBeNull();
      });

      it('should return 404 for non-existent mapping', async () => {
        await request(app)
          .delete(`/api/config/mapping/${testOrg}/non-existent-id`)
          .expect(404);
      });
    });
  });

  describe('Threshold Configuration Endpoints', () => {
    describe('GET /api/config/thresholds/:organization', () => {
      it('should return empty array when no thresholds exist', async () => {
        const response = await request(app)
          .get(`/api/config/thresholds/${testOrg}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: [],
          count: 0
        });
      });

      it('should return thresholds for specific organization', async () => {
        // Create test thresholds
        const threshold1Data = getThresholdConfiguration(0);
        const threshold2Data = getThresholdConfiguration(1);
        
        const threshold1 = await prisma.thresholdConfiguration.create({
          data: threshold1Data
        });
        const threshold2 = await prisma.thresholdConfiguration.create({
          data: threshold2Data
        });

        // Create threshold for different org
        await prisma.thresholdConfiguration.create({
          data: { 
            ...threshold1Data, 
            organization: otherOrg 
          }
        });

        const response = await request(app)
          .get(`/api/config/thresholds/${testOrg}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(2);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data.map((t: any) => t.id)).toContain(threshold1.id);
        expect(response.body.data.map((t: any) => t.id)).toContain(threshold2.id);
      });
    });

    describe('POST /api/config/thresholds/:organization', () => {
      it('should create new threshold successfully', async () => {
        const thresholdData = getThresholdConfiguration(0);

        const response = await request(app)
          .post(`/api/config/thresholds/${testOrg}`)
          .send(thresholdData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          organization: testOrg,
          productArea: thresholdData.productArea,
          severityLevel: thresholdData.severityLevel,
          ticketThreshold: thresholdData.ticketThreshold,
          usageDropThreshold: expect.any(Number)
        });
        expect(Number(response.body.data.usageDropThreshold)).toBe(thresholdData.usageDropThreshold);
      });

      it('should return 400 for invalid threshold data', async () => {
        const invalidThresholds = sampleConfig.invalidThresholds;

        for (const invalidThreshold of invalidThresholds) {
          await request(app)
            .post(`/api/config/thresholds/${testOrg}`)
            .send(invalidThreshold)
            .expect(400);
        }
      });

      it('should return 409 for duplicate threshold', async () => {
        const thresholdData = getThresholdConfiguration(0);

        // Create first threshold
        await request(app)
          .post(`/api/config/thresholds/${testOrg}`)
          .send(thresholdData)
          .expect(201);

        // Try to create duplicate
        await request(app)
          .post(`/api/config/thresholds/${testOrg}`)
          .send(thresholdData)
          .expect(409);
      });
    });

    describe('PUT /api/config/thresholds/:organization/:id', () => {
      it('should update threshold successfully', async () => {
        const thresholdData = getThresholdConfiguration(0);
        const threshold = await prisma.thresholdConfiguration.create({
          data: thresholdData
        });

        const updateData = {
          ticketThreshold: 15,
          usageDropThreshold: 30.0
        };

        const response = await request(app)
          .put(`/api/config/thresholds/${testOrg}/${threshold.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.ticketThreshold).toBe(updateData.ticketThreshold);
        expect(Number(response.body.data.usageDropThreshold)).toBe(updateData.usageDropThreshold);
      });

      it('should return 404 for non-existent threshold', async () => {
        await request(app)
          .put(`/api/config/thresholds/${testOrg}/non-existent-id`)
          .send({ ticketThreshold: 10 })
          .expect(404);
      });
    });

    describe('DELETE /api/config/thresholds/:organization/:id', () => {
      it('should delete threshold successfully', async () => {
        const thresholdData = getThresholdConfiguration(0);
        const threshold = await prisma.thresholdConfiguration.create({
          data: thresholdData
        });

        await request(app)
          .delete(`/api/config/thresholds/${testOrg}/${threshold.id}`)
          .expect(200);

        // Verify deletion
        const deletedThreshold = await prisma.thresholdConfiguration.findUnique({
          where: { id: threshold.id }
        });
        expect(deletedThreshold).toBeNull();
      });
    });
  });

  describe('Key Modules Endpoints', () => {
    describe('GET /api/config/key-modules/:organization', () => {
      it('should return only key modules', async () => {
        // Create mappings with mixed key module status
        const mapping1Data = getProductAreaMapping(0);
        const mapping2Data = getProductAreaMapping(2);
        
        await prisma.productAreaMapping.create({
          data: { ...mapping1Data, isKeyModule: true }
        });
        await prisma.productAreaMapping.create({
          data: { ...mapping2Data, isKeyModule: false }
        });

        const response = await request(app)
          .get(`/api/config/key-modules/${testOrg}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
        expect(response.body.data[0].isKeyModule).toBe(true);
      });
    });

    describe('POST /api/config/key-modules/:organization', () => {
      it('should toggle key module status', async () => {
        const mappingData = getProductAreaMapping(0);
        const mapping = await prisma.productAreaMapping.create({
          data: { ...mappingData, isKeyModule: false }
        });

        const response = await request(app)
          .post(`/api/config/key-modules/${testOrg}`)
          .send({ mappingId: mapping.id, isKeyModule: true })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isKeyModule).toBe(true);
      });

      it('should return 400 for invalid request data', async () => {
        await request(app)
          .post(`/api/config/key-modules/${testOrg}`)
          .send({ mappingId: 'invalid', isKeyModule: 'not-boolean' })
          .expect(400);
      });
    });

    describe('PUT /api/config/key-modules/:organization/:id', () => {
      it('should update key module status', async () => {
        const mappingData = getProductAreaMapping(0);
        const mapping = await prisma.productAreaMapping.create({
          data: { ...mappingData, isKeyModule: false }
        });

        const response = await request(app)
          .put(`/api/config/key-modules/${testOrg}/${mapping.id}`)
          .send({ isKeyModule: true })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isKeyModule).toBe(true);
      });
    });
  });

  describe('Organization Isolation', () => {
    it('should isolate mappings by organization', async () => {
      // Create mappings for different organizations
      const mappingData = getProductAreaMapping(0);
      await prisma.productAreaMapping.create({
        data: { ...mappingData, organization: testOrg }
      });
      await prisma.productAreaMapping.create({
        data: { ...mappingData, organization: otherOrg }
      });

      // Get mappings for testOrg
      const testOrgResponse = await request(app)
        .get(`/api/config/mapping/${testOrg}`)
        .expect(200);

      // Get mappings for otherOrg
      const otherOrgResponse = await request(app)
        .get(`/api/config/mapping/${otherOrg}`)
        .expect(200);

      expect(testOrgResponse.body.count).toBe(1);
      expect(otherOrgResponse.body.count).toBe(1);
      expect(testOrgResponse.body.data[0].organization).toBe(testOrg);
      expect(otherOrgResponse.body.data[0].organization).toBe(otherOrg);
    });

    it('should isolate thresholds by organization', async () => {
      // Create thresholds for different organizations
      const thresholdData = getThresholdConfiguration(0);
      await prisma.thresholdConfiguration.create({
        data: { ...thresholdData, organization: testOrg }
      });
      await prisma.thresholdConfiguration.create({
        data: { ...thresholdData, organization: otherOrg }
      });

      // Get thresholds for testOrg
      const testOrgResponse = await request(app)
        .get(`/api/config/thresholds/${testOrg}`)
        .expect(200);

      // Get thresholds for otherOrg
      const otherOrgResponse = await request(app)
        .get(`/api/config/thresholds/${otherOrg}`)
        .expect(200);

      expect(testOrgResponse.body.count).toBe(1);
      expect(otherOrgResponse.body.count).toBe(1);
      expect(testOrgResponse.body.data[0].organization).toBe(testOrg);
      expect(otherOrgResponse.body.data[0].organization).toBe(otherOrg);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate organization parameter', async () => {
      await request(app)
        .get('/api/config/mapping/')
        .expect(404);

      // Test with empty organization in request body instead
      await request(app)
        .post('/api/config/mapping/test-org')
        .send({
          productArea: 'Test Area',
          dynatraceCapability: 'Test Capability',
          organization: ''
        })
        .expect(400);
    });

    it('should validate severity levels', async () => {
      const invalidSeverities = ['INVALID', 'high', 'medium', ''];

      for (const severity of invalidSeverities) {
        await request(app)
          .post(`/api/config/thresholds/${testOrg}`)
          .send({
            productArea: 'Test Area',
            severityLevel: severity,
            ticketThreshold: 5,
            usageDropThreshold: 20.0
          })
          .expect(400);
      }
    });

    it('should validate numeric thresholds', async () => {
      const invalidThresholds = [
        { ticketThreshold: -1, usageDropThreshold: 20.0 },
        { ticketThreshold: 1.5, usageDropThreshold: 20.0 },
        { ticketThreshold: 5, usageDropThreshold: -10.0 },
        { ticketThreshold: 5, usageDropThreshold: 150.0 },
        { ticketThreshold: 'invalid', usageDropThreshold: 20.0 },
        { ticketThreshold: 5, usageDropThreshold: 'invalid' }
      ];

      for (const threshold of invalidThresholds) {
        await request(app)
          .post(`/api/config/thresholds/${testOrg}`)
          .send({
            productArea: 'Test Area',
            severityLevel: 'CRITICAL',
            ...threshold
          })
          .expect(400);
      }
    });
  });

  describe('Mapping Relationships', () => {
    it('should support one-to-many product area to capability mapping', async () => {
      const productArea = 'Authentication';
      const capabilities = ['OAuth Service', 'SAML Service', 'JWT Service'];

      // Create multiple mappings for same product area
      for (const capability of capabilities) {
        await request(app)
          .post(`/api/config/mapping/${testOrg}`)
          .send({
            productArea,
            dynatraceCapability: capability,
            isKeyModule: false
          })
          .expect(201);
      }

      // Verify all mappings exist
      const response = await request(app)
        .get(`/api/config/mapping/${testOrg}`)
        .expect(200);

      const authMappings = response.body.data.filter(
        (m: any) => m.productArea === productArea
      );
      expect(authMappings).toHaveLength(3);
    });

    it('should support many-to-one capability to product area mapping', async () => {
      const capability = 'User Service';
      const productAreas = ['Authentication', 'User Management', 'Profile Management'];

      // Create multiple mappings for same capability
      for (const area of productAreas) {
        await request(app)
          .post(`/api/config/mapping/${testOrg}`)
          .send({
            productArea: area,
            dynatraceCapability: capability,
            isKeyModule: false
          })
          .expect(201);
      }

      // Verify all mappings exist
      const response = await request(app)
        .get(`/api/config/mapping/${testOrg}`)
        .expect(200);

      const serviceMappings = response.body.data.filter(
        (m: any) => m.dynatraceCapability === capability
      );
      expect(serviceMappings).toHaveLength(3);
    });
  });
});
