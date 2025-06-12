import { prisma } from '../server';
import { TicketSeverity } from '@prisma/client';
import { calculateTechnicalDebtScore, generateRecommendations, getScoreCategory, ScoreCategory } from '../utils/scoringUtils';

export interface TicketCounts {
  CRITICAL: number;
  SEVERE: number;
  MODERATE: number;
  LOW: number;
}

export interface UsageMetrics {
  currentUsage: number;
  previousUsage: number;
  usageDropPercentage: number;
  isZeroUsage: boolean;
}

export interface TechnicalDebtResult {
  organization: string;
  productArea: string;
  debtScore: number;
  category: ScoreCategory;
  ticketCounts: TicketCounts;
  usageMetrics: UsageMetrics;
  recommendations: string[];
  isKeyModule: boolean;
}

export class TechnicalDebtService {
  /**
   * Calculate technical debt for a specific organization and product area
   */
  async calculateTechnicalDebt(
    organization: string,
    productArea: string,
    analysisDate: Date = new Date()
  ): Promise<TechnicalDebtResult> {
    // Get ticket counts by severity for the last 30 days
    const ticketCounts = await this.getTicketCountsBySeverity(organization, productArea, analysisDate);
    
    // Get usage metrics
    const usageMetrics = await this.getUsageMetrics(organization, productArea, analysisDate);
    
    // Check if it's a key module
    const isKeyModule = await this.isKeyModule(organization, productArea);
    
    // Calculate technical debt score
    const debtScore = calculateTechnicalDebtScore(ticketCounts, usageMetrics, isKeyModule);
    
    // Generate recommendations
    const recommendations = generateRecommendations(debtScore, ticketCounts, usageMetrics, isKeyModule);
    
    // Determine score category
    const category = getScoreCategory(debtScore);
    
    return {
      organization,
      productArea,
      debtScore,
      category,
      ticketCounts,
      usageMetrics,
      recommendations,
      isKeyModule
    };
  }

  /**
   * Calculate technical debt for all product areas in an organization
   */
  async calculateOrganizationTechnicalDebt(organization: string): Promise<TechnicalDebtResult[]> {
    // Get all product areas for the organization
    const productAreas = await prisma.productAreaMapping.findMany({
      where: { organization },
      select: { productArea: true },
      distinct: ['productArea']
    });

    const results: TechnicalDebtResult[] = [];
    
    for (const { productArea } of productAreas) {
      try {
        const result = await this.calculateTechnicalDebt(organization, productArea);
        results.push(result);
      } catch (error) {
        console.error(`Error calculating debt for ${organization}/${productArea}:`, error);
      }
    }

    return results;
  }

  /**
   * Store technical debt analysis results
   */
  async storeTechnicalDebtAnalysis(result: TechnicalDebtResult): Promise<void> {
    await prisma.technicalDebtAnalysis.create({
      data: {
        organization: result.organization,
        productArea: result.productArea,
        analysisDate: new Date(),
        ticketCountBySeverity: result.ticketCounts as any,
        usageMetrics: result.usageMetrics as any,
        debtScore: result.debtScore,
        recommendations: result.recommendations.join('\n')
      }
    });
  }

  /**
   * Get historical technical debt analysis
   */
  async getHistoricalAnalysis(
    organization: string,
    productArea?: string,
    limit: number = 10
  ) {
    const where: any = { organization };
    if (productArea) {
      where.productArea = productArea;
    }

    return prisma.technicalDebtAnalysis.findMany({
      where,
      orderBy: { analysisDate: 'desc' },
      take: limit
    });
  }

  private async getTicketCountsBySeverity(
    organization: string,
    productArea: string,
    analysisDate: Date
  ): Promise<TicketCounts> {
    const thirtyDaysAgo = new Date(analysisDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tickets = await prisma.supportTicket.groupBy({
      by: ['severity'],
      where: {
        organization,
        productArea,
        requested: {
          gte: thirtyDaysAgo,
          lte: analysisDate
        }
      },
      _count: {
        severity: true
      }
    });

    const counts: TicketCounts = {
      CRITICAL: 0,
      SEVERE: 0,
      MODERATE: 0,
      LOW: 0
    };

    tickets.forEach(ticket => {
      counts[ticket.severity] = ticket._count.severity;
    });

    return counts;
  }

  private async getUsageMetrics(
    organization: string,
    productArea: string,
    analysisDate: Date
  ): Promise<UsageMetrics> {
    // Get current usage (last 30 days)
    const currentUsageData = await prisma.dynatraceUsage.findMany({
      where: {
        organization,
        productAreaMapping: {
          some: {
            productArea,
            organization
          }
        },
        uploadDate: {
          lte: analysisDate
        }
      },
      orderBy: { uploadDate: 'desc' },
      take: 1
    });

    // Get previous usage (30-60 days ago)
    const sixtyDaysAgo = new Date(analysisDate);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const thirtyDaysAgo = new Date(analysisDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const previousUsageData = await prisma.dynatraceUsage.findMany({
      where: {
        organization,
        productAreaMapping: {
          some: {
            productArea,
            organization
          }
        },
        uploadDate: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      },
      orderBy: { uploadDate: 'desc' },
      take: 1
    });

    const currentUsage = typeof currentUsageData[0]?.last30DaysCost === 'object' 
      ? currentUsageData[0]?.last30DaysCost.toNumber() || 0
      : currentUsageData[0]?.last30DaysCost || 0;
    const previousUsage = typeof previousUsageData[0]?.last30DaysCost === 'object'
      ? previousUsageData[0]?.last30DaysCost.toNumber() || 0
      : previousUsageData[0]?.last30DaysCost || 0;

    let usageDropPercentage = 0;
    if (previousUsage > 0) {
      usageDropPercentage = ((previousUsage - currentUsage) / previousUsage) * 100;
    }

    return {
      currentUsage,
      previousUsage,
      usageDropPercentage: Math.max(0, usageDropPercentage),
      isZeroUsage: currentUsage === 0
    };
  }

  private async isKeyModule(organization: string, productArea: string): Promise<boolean> {
    const mapping = await prisma.productAreaMapping.findFirst({
      where: {
        organization,
        productArea,
        isKeyModule: true
      }
    });

    return !!mapping;
  }

}

export const technicalDebtService = new TechnicalDebtService();
