import { prisma } from '../server';
import { TicketSeverity } from '@prisma/client';

export interface TicketBreakdown {
  productArea: string;
  severityCounts: {
    CRITICAL: number;
    SEVERE: number;
    MODERATE: number;
    LOW: number;
  };
  totalTickets: number;
  averageResolutionTime?: number;
}

export interface UsageCorrelation {
  productArea: string;
  ticketCount: number;
  currentUsage: number;
  previousUsage: number;
  usageDropPercentage: number;
  correlationScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TrendData {
  date: string;
  ticketCount: number;
  usageAmount: number;
  debtScore?: number;
}

export interface TrendAnalysis {
  productArea: string;
  trends: TrendData[];
  monthOverMonth: {
    ticketChange: number;
    usageChange: number;
    debtScoreChange?: number;
  };
  trendIndicator: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export class AnalyticsService {
  constructor() {
    // Constructor can be empty for now
  }

  /**
   * Get ticket breakdown by product area and severity
   */
  async getTicketBreakdown(
    organization: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TicketBreakdown[]> {
    const whereClause: any = { organization };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Get all tickets for the organization
    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        productAreaMapping: true,
      },
    });

    // Group by product area
    const productAreaMap = new Map<string, TicketBreakdown>();

    for (const ticket of tickets) {
      // Use the productArea field directly from the ticket
      const productArea = ticket.productArea || 'Unknown';
      
      if (!productAreaMap.has(productArea)) {
        productAreaMap.set(productArea, {
          productArea,
          severityCounts: {
            CRITICAL: 0,
            SEVERE: 0,
            MODERATE: 0,
            LOW: 0,
          },
          totalTickets: 0,
        });
      }

      const breakdown = productAreaMap.get(productArea)!;
      breakdown.severityCounts[ticket.severity as TicketSeverity]++;
      breakdown.totalTickets++;
    }

    // Calculate average resolution times
    for (const [productArea, breakdown] of productAreaMap) {
      const resolvedTickets = tickets.filter(
        (t: any) => 
          t.productArea === productArea && 
          t.status === 'RESOLVED' && 
          t.updated // Use updated field as resolution time
      );

      if (resolvedTickets.length > 0) {
        const totalResolutionTime = resolvedTickets.reduce((sum: number, ticket: any) => {
          const resolutionTime = ticket.updated.getTime() - ticket.createdAt.getTime();
          return sum + resolutionTime;
        }, 0);
        
        breakdown.averageResolutionTime = Math.round(
          totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60 * 24)
        ); // Convert to days
      }
    }

    return Array.from(productAreaMap.values()).sort((a, b) => b.totalTickets - a.totalTickets);
  }

  /**
   * Correlate ticket data with usage data
   */
  async getUsageCorrelation(organization: string): Promise<UsageCorrelation[]> {
    // Get product areas for the organization
    const productAreas = await prisma.productAreaMapping.findMany({
      where: { organization },
      select: { productArea: true, dynatraceCapability: true },
      distinct: ['productArea'],
    });

    const correlations: UsageCorrelation[] = [];

    for (const { productArea, dynatraceCapability } of productAreas) {
      // Get ticket count for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const ticketCount = await prisma.supportTicket.count({
        where: {
          organization,
          productArea,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Get actual usage data from Dynatrace usage table
      const currentUsage = await prisma.dynatraceUsage.findFirst({
        where: {
          organization,
          capability: dynatraceCapability,
        },
        orderBy: { uploadDate: 'desc' },
      });

      // Get previous usage data (from 30-60 days ago)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const previousUsage = await prisma.dynatraceUsage.findFirst({
        where: {
          organization,
          capability: dynatraceCapability,
          uploadDate: { lt: thirtyDaysAgo, gte: sixtyDaysAgo },
        },
        orderBy: { uploadDate: 'desc' },
      });

      const currentUsageAmount = currentUsage?.last30DaysCost ? Number(currentUsage.last30DaysCost) : 0;
      const previousUsageAmount = previousUsage?.last30DaysCost ? Number(previousUsage.last30DaysCost) : currentUsageAmount;
      
      const usageDropPercentage = previousUsageAmount > 0 
        ? ((previousUsageAmount - currentUsageAmount) / previousUsageAmount) * 100
        : 0;

      // Calculate correlation score (high tickets + low usage = high risk)
      const normalizedTickets = Math.min(ticketCount / 10, 1); // Normalize to 0-1
      const normalizedUsageDrop = Math.min(Math.max(usageDropPercentage / 100, 0), 1);
      const correlationScore = (normalizedTickets * 0.6) + (normalizedUsageDrop * 0.4);

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (correlationScore >= 0.8) riskLevel = 'CRITICAL';
      else if (correlationScore >= 0.6) riskLevel = 'HIGH';
      else if (correlationScore >= 0.4) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';

      correlations.push({
        productArea,
        ticketCount,
        currentUsage: currentUsageAmount,
        previousUsage: previousUsageAmount,
        usageDropPercentage,
        correlationScore,
        riskLevel,
      });
    }

    return correlations.sort((a, b) => b.correlationScore - a.correlationScore);
  }

  /**
   * Get comprehensive technical debt analysis
   */
  async getTechnicalDebtAnalysis(organization: string) {
    // Mock implementation for now
    return {
      organization,
      totalProductAreas: 5,
      averageDebtScore: 75.5,
      criticalAreas: 1,
      highRiskAreas: 2,
      checklist: [
        {
          priority: 1,
          productArea: 'Authentication',
          debtScore: 95,
          category: 'Critical',
          recommendations: ['Urgent refactoring needed'],
          isKeyModule: true,
        }
      ],
    };
  }

  /**
   * Get historical trend analysis
   */
  async getTrendAnalysis(
    organization: string,
    months: number = 6
  ): Promise<TrendAnalysis[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get product areas
    const productAreas = await prisma.productAreaMapping.findMany({
      where: { organization },
      select: { productArea: true },
      distinct: ['productArea'],
    });

    const trends: TrendAnalysis[] = [];

    for (const { productArea } of productAreas) {
      // Get monthly data points
      const monthlyData: TrendData[] = [];
      
      for (let i = 0; i < months; i++) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        // Get ticket count for the month
        const ticketCount = await prisma.supportTicket.count({
          where: {
            organization,
            productArea,
            createdAt: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        });

        // Mock usage data for now
        const totalUsage = Math.floor(Math.random() * 500);

        monthlyData.push({
          date: monthStart.toISOString().substring(0, 7), // YYYY-MM format
          ticketCount,
          usageAmount: totalUsage,
          debtScore: undefined, // Skip debt score for now
        });
      }

      // Calculate month-over-month changes
      const currentMonth = monthlyData[0];
      const previousMonth = monthlyData[1];
      
      const ticketChange = previousMonth && currentMonth
        ? ((currentMonth.ticketCount - previousMonth.ticketCount) / Math.max(previousMonth.ticketCount, 1)) * 100
        : 0;
      
      const usageChange = previousMonth && currentMonth
        ? ((currentMonth.usageAmount - previousMonth.usageAmount) / Math.max(previousMonth.usageAmount, 1)) * 100
        : 0;

      const debtScoreChange = previousMonth && currentMonth && currentMonth.debtScore && previousMonth.debtScore
        ? ((currentMonth.debtScore - previousMonth.debtScore) / previousMonth.debtScore) * 100
        : undefined;

      // Determine trend indicator
      let trendIndicator: 'IMPROVING' | 'STABLE' | 'DECLINING';
      const ticketTrend = ticketChange < -10 ? 1 : ticketChange > 10 ? -1 : 0;
      const usageTrend = usageChange > 10 ? 1 : usageChange < -10 ? -1 : 0;
      const debtTrend = debtScoreChange !== undefined 
        ? (debtScoreChange < -10 ? 1 : debtScoreChange > 10 ? -1 : 0)
        : 0;

      const overallTrend = ticketTrend + usageTrend + debtTrend;
      if (overallTrend > 0) trendIndicator = 'IMPROVING';
      else if (overallTrend < 0) trendIndicator = 'DECLINING';
      else trendIndicator = 'STABLE';

      trends.push({
        productArea,
        trends: monthlyData.reverse(), // Oldest to newest
        monthOverMonth: {
          ticketChange,
          usageChange,
          debtScoreChange,
        },
        trendIndicator,
      });
    }

    return trends.sort((a, b) => {
      // Sort by trend indicator priority (declining first)
      const priorityMap = { DECLINING: 0, STABLE: 1, IMPROVING: 2 };
      return priorityMap[a.trendIndicator] - priorityMap[b.trendIndicator];
    });
  }

  /**
   * Get all organizations
   */
  async getOrganizations(): Promise<string[]> {
    try {
      // Get unique organizations from support tickets
      const ticketOrgs = await prisma.supportTicket.findMany({
        select: { organization: true },
        distinct: ['organization'],
        orderBy: { organization: 'asc' },
      });

      // For now, just use ticket organizations
      const allOrgs = new Set(ticketOrgs.map(t => t.organization));

      return Array.from(allOrgs).filter(Boolean);
    } catch (error) {
      console.error('Error getting organizations:', error);
      // Return empty array if there's an error
      return [];
    }
  }

  /**
   * Get last upload date for an organization
   */
  async getLastUploadDate(organization: string): Promise<{ tickets?: Date; usage?: Date }> {
    const lastTicket = await prisma.supportTicket.findFirst({
      where: { organization },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const lastUsage = await prisma.dynatraceUsage.findFirst({
      where: { organization },
      orderBy: { uploadDate: 'desc' },
      select: { uploadDate: true },
    });

    return {
      tickets: lastTicket?.createdAt,
      usage: lastUsage?.uploadDate,
    };
  }

  /**
   * Clean up old data for an organization
   */
  async cleanupOldData(organization: string, daysToKeep: number = 90): Promise<{
    ticketsDeleted: number;
    usageDeleted: number;
    analysisDeleted: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const ticketsDeleted = await prisma.supportTicket.deleteMany({
      where: {
        organization,
        createdAt: { lt: cutoffDate },
      },
    });

    // Mock cleanup for now
    return {
      ticketsDeleted: ticketsDeleted.count,
      usageDeleted: 0,
      analysisDeleted: 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
