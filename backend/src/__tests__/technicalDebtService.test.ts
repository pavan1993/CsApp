import { TechnicalDebtService } from '../services/technicalDebtService';
import { TicketSeverity } from '@prisma/client';

// Mock the entire server module
const mockPrisma = {
  supportTicket: {
    groupBy: jest.fn(),
  },
  dynatraceUsage: {
    findMany: jest.fn(),
  },
  productAreaMapping: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  technicalDebtAnalysis: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('../server', () => ({
  prisma: mockPrisma,
}));

describe('TechnicalDebtService', () => {
  let service: TechnicalDebtService;

  beforeEach(() => {
    service = new TechnicalDebtService();
    jest.clearAllMocks();
  });

  describe('calculateTechnicalDebt', () => {
    it('should calculate technical debt for a product area', async () => {
      // Mock ticket counts
      mockPrisma.supportTicket.groupBy.mockResolvedValue([
        { severity: TicketSeverity.CRITICAL, _count: { severity: 2 } },
        { severity: TicketSeverity.SEVERE, _count: { severity: 1 } },
        { severity: TicketSeverity.MODERATE, _count: { severity: 3 } },
        { severity: TicketSeverity.LOW, _count: { severity: 1 } },
      ]);

      // Mock usage data
      mockPrisma.dynatraceUsage.findMany
        .mockResolvedValueOnce([
          {
            id: '1',
            capability: 'test',
            annualBudgetCost: 1000,
            last30DaysCost: 500,
            organization: 'test-org',
            uploadDate: new Date(),
            createdAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([
          {
            id: '2',
            capability: 'test',
            annualBudgetCost: 1000,
            last30DaysCost: 600,
            organization: 'test-org',
            uploadDate: new Date(),
            createdAt: new Date(),
          },
        ]);

      // Mock key module check
      mockPrisma.productAreaMapping.findFirst.mockResolvedValue(null);

      const result = await service.calculateTechnicalDebt('test-org', 'test-area');

      expect(result).toMatchObject({
        organization: 'test-org',
        productArea: 'test-area',
        isKeyModule: false,
      });

      expect(result.ticketCounts).toEqual({
        CRITICAL: 2,
        SEVERE: 1,
        MODERATE: 3,
        LOW: 1,
      });

      expect(result.usageMetrics.currentUsage).toBe(500);
      expect(result.usageMetrics.previousUsage).toBe(600);
      expect(result.debtScore).toBeGreaterThan(0);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle zero tickets', async () => {
      mockPrisma.supportTicket.groupBy.mockResolvedValue([]);
      mockPrisma.dynatraceUsage.findMany.mockResolvedValue([]);
      mockPrisma.productAreaMapping.findFirst.mockResolvedValue(null);

      const result = await service.calculateTechnicalDebt('test-org', 'test-area');

      expect(result.ticketCounts).toEqual({
        CRITICAL: 0,
        SEVERE: 0,
        MODERATE: 0,
        LOW: 0,
      });

      expect(result.usageMetrics.currentUsage).toBe(0);
      expect(result.usageMetrics.isZeroUsage).toBe(true);
    });

    it('should identify key modules', async () => {
      mockPrisma.supportTicket.groupBy.mockResolvedValue([]);
      mockPrisma.dynatraceUsage.findMany.mockResolvedValue([]);
      mockPrisma.productAreaMapping.findFirst.mockResolvedValue({
        id: '1',
        productArea: 'test-area',
        dynatraceCapability: 'test-capability',
        organization: 'test-org',
        isKeyModule: true,
        createdAt: new Date(),
      });

      const result = await service.calculateTechnicalDebt('test-org', 'test-area');

      expect(result.isKeyModule).toBe(true);
    });
  });

  describe('calculateOrganizationTechnicalDebt', () => {
    it('should calculate debt for all product areas in organization', async () => {
      mockPrisma.productAreaMapping.findMany.mockResolvedValue([
        { productArea: 'area1' },
        { productArea: 'area2' },
      ]);

      // Mock the individual calculations
      mockPrisma.supportTicket.groupBy.mockResolvedValue([]);
      mockPrisma.dynatraceUsage.findMany.mockResolvedValue([]);
      mockPrisma.productAreaMapping.findFirst.mockResolvedValue(null);

      const results = await service.calculateOrganizationTechnicalDebt('test-org');

      expect(results).toHaveLength(2);
      expect(results[0]?.productArea).toBe('area1');
      expect(results[1]?.productArea).toBe('area2');
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.productAreaMapping.findMany.mockResolvedValue([
        { productArea: 'area1' },
        { productArea: 'area2' },
      ]);

      // Mock one successful and one failed calculation
      mockPrisma.supportTicket.groupBy
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Database error'));

      mockPrisma.dynatraceUsage.findMany.mockResolvedValue([]);
      mockPrisma.productAreaMapping.findFirst.mockResolvedValue(null);

      const results = await service.calculateOrganizationTechnicalDebt('test-org');

      // Should only return successful results
      expect(results).toHaveLength(1);
      expect(results[0]?.productArea).toBe('area1');
    });
  });

  describe('storeTechnicalDebtAnalysis', () => {
    it('should store analysis results', async () => {
      const mockResult = {
        organization: 'test-org',
        productArea: 'test-area',
        debtScore: 75,
        category: 'Moderate Risk' as const,
        ticketCounts: {
          CRITICAL: 1,
          SEVERE: 2,
          MODERATE: 1,
          LOW: 0,
        },
        usageMetrics: {
          currentUsage: 500,
          previousUsage: 600,
          usageDropPercentage: 16.67,
          isZeroUsage: false,
        },
        recommendations: ['Test recommendation'],
        isKeyModule: false,
      };

      mockPrisma.technicalDebtAnalysis.create.mockResolvedValue({
        id: '1',
        organization: 'test-org',
        productArea: 'test-area',
        analysisDate: new Date(),
        ticketCountBySeverity: mockResult.ticketCounts,
        usageMetrics: mockResult.usageMetrics,
        debtScore: 75,
        recommendations: 'Test recommendation',
        createdAt: new Date(),
      });

      await service.storeTechnicalDebtAnalysis(mockResult);

      expect(mockPrisma.technicalDebtAnalysis.create).toHaveBeenCalledWith({
        data: {
          organization: 'test-org',
          productArea: 'test-area',
          analysisDate: expect.any(Date),
          ticketCountBySeverity: mockResult.ticketCounts,
          usageMetrics: mockResult.usageMetrics,
          debtScore: 75,
          recommendations: 'Test recommendation',
        },
      });
    });
  });

  describe('getHistoricalAnalysis', () => {
    it('should retrieve historical analysis data', async () => {
      const mockHistoricalData = [
        {
          id: '1',
          organization: 'test-org',
          productArea: 'test-area',
          analysisDate: new Date(),
          ticketCountBySeverity: { CRITICAL: 1, SEVERE: 0, MODERATE: 2, LOW: 1 },
          usageMetrics: { currentUsage: 500, previousUsage: 600 },
          debtScore: 50,
          recommendations: 'Test recommendations',
          createdAt: new Date(),
        },
      ];

      mockPrisma.technicalDebtAnalysis.findMany.mockResolvedValue(mockHistoricalData);

      const result = await service.getHistoricalAnalysis('test-org', 'test-area', 5);

      expect(mockPrisma.technicalDebtAnalysis.findMany).toHaveBeenCalledWith({
        where: {
          organization: 'test-org',
          productArea: 'test-area',
        },
        orderBy: { analysisDate: 'desc' },
        take: 5,
      });

      expect(result).toEqual(mockHistoricalData);
    });

    it('should retrieve organization-wide historical data when no product area specified', async () => {
      mockPrisma.technicalDebtAnalysis.findMany.mockResolvedValue([]);

      await service.getHistoricalAnalysis('test-org', undefined, 10);

      expect(mockPrisma.technicalDebtAnalysis.findMany).toHaveBeenCalledWith({
        where: {
          organization: 'test-org',
        },
        orderBy: { analysisDate: 'desc' },
        take: 10,
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle realistic data scenarios', async () => {
      // Simulate a high-risk scenario
      mockPrisma.supportTicket.groupBy.mockResolvedValue([
        { severity: TicketSeverity.CRITICAL, _count: { severity: 5 } },
        { severity: TicketSeverity.SEVERE, _count: { severity: 8 } },
        { severity: TicketSeverity.MODERATE, _count: { severity: 12 } },
        { severity: TicketSeverity.LOW, _count: { severity: 15 } },
      ]);

      // Zero usage scenario
      mockPrisma.dynatraceUsage.findMany.mockResolvedValue([]);

      // Key module
      mockPrisma.productAreaMapping.findFirst.mockResolvedValue({
        id: '1',
        productArea: 'critical-service',
        dynatraceCapability: 'core-capability',
        organization: 'enterprise-org',
        isKeyModule: true,
        createdAt: new Date(),
      });

      const result = await service.calculateTechnicalDebt('enterprise-org', 'critical-service');

      expect(result.category).toBe('Critical');
      expect(result.debtScore).toBeGreaterThan(200);
      expect(result.recommendations.some((r: string) => r.includes('URGENT'))).toBe(true);
      expect(result.recommendations.some((r: string) => r.includes('CRITICAL'))).toBe(true);
    });

    it('should handle healthy module scenario', async () => {
      // Low ticket counts
      mockPrisma.supportTicket.groupBy.mockResolvedValue([
        { severity: TicketSeverity.LOW, _count: { severity: 2 } },
      ]);

      // Stable usage
      mockPrisma.dynatraceUsage.findMany
        .mockResolvedValueOnce([
          {
            id: '1',
            capability: 'stable-service',
            annualBudgetCost: 10000,
            last30DaysCost: 1000,
            organization: 'test-org',
            uploadDate: new Date(),
            createdAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([
          {
            id: '2',
            capability: 'stable-service',
            annualBudgetCost: 10000,
            last30DaysCost: 950,
            organization: 'test-org',
            uploadDate: new Date(),
            createdAt: new Date(),
          },
        ]);

      mockPrisma.productAreaMapping.findFirst.mockResolvedValue(null);

      const result = await service.calculateTechnicalDebt('test-org', 'stable-service');

      expect(result.category).toBe('Good');
      expect(result.debtScore).toBeLessThan(51);
      expect(result.recommendations.some((r: string) => r.includes('good health'))).toBe(true);
    });
  });
});
