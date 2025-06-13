import express from 'express';
import { prisma } from '../server';
import { analyticsService } from '../services/analyticsService';
import { technicalDebtService } from '../services/technicalDebtService';

const router = express.Router();

// Test route to verify backend is working
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Backend is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Test route failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    console.log('📋 Fetching organizations...');
    const organizations = await analyticsService.getOrganizations();
    
    // If no organizations found, return demo data
    const finalOrganizations = organizations.length > 0 ? organizations : [
      'Demo Organization 1',
      'Demo Organization 2',
      'Sample Corp',
      'Test Company'
    ];

    console.log(`✅ Found ${finalOrganizations.length} organizations:`, finalOrganizations);

    res.json({
      success: true,
      data: finalOrganizations,
    });
  } catch (error) {
    console.error('❌ Error fetching organizations:', error);
    
    // Return demo data even on error
    const demoOrganizations = [
      'Demo Organization 1',
      'Demo Organization 2',
      'Sample Corp',
      'Test Company'
    ];
    
    res.json({
      success: true,
      data: demoOrganizations,
      warning: 'Using demo data due to database connection issues'
    });
  }
});

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total customers
    const totalCustomers = await prisma.customer.count();

    // Get average health score
    const healthScoreResult = await prisma.customer.aggregate({
      _avg: {
        healthScore: true,
      },
    });

    // Get customers created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newCustomersThisMonth = await prisma.customer.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Get total interactions
    const totalInteractions = await prisma.customerInteraction.count();

    // Calculate churn rate (mock data for now)
    const churnRate = 2.1;

    res.json({
      success: true,
      data: {
        totalCustomers,
        averageHealthScore: healthScoreResult._avg.healthScore || 0,
        newCustomersThisMonth,
        totalInteractions,
        churnRate,
        monthlyRevenue: 405091, // Mock data
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get customer health distribution
router.get('/health-distribution', async (req, res) => {
  try {
    const healthDistribution = await prisma.customer.groupBy({
      by: ['healthScore'],
      _count: {
        healthScore: true,
      },
      orderBy: {
        healthScore: 'asc',
      },
    });

    res.json({
      success: true,
      data: healthDistribution,
    });
  } catch (error) {
    console.error('Error fetching health distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health distribution',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get technical debt analysis for a specific organization and product area
router.get('/technical-debt/:organization/:productArea', async (req, res) => {
  try {
    const { organization, productArea } = req.params;

    if (!organization || !productArea) {
      res.status(400).json({
        success: false,
        message: 'Organization and product area are required',
      });
      return;
    }

    const result = await technicalDebtService.calculateTechnicalDebt(
      decodeURIComponent(organization),
      decodeURIComponent(productArea)
    );

    // Store the analysis result
    await technicalDebtService.storeTechnicalDebtAnalysis(result);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error calculating technical debt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate technical debt',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get technical debt analysis for all product areas in an organization
router.get('/technical-debt/:organization', async (req, res) => {
  try {
    const { organization } = req.params;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
      return;
    }

    const results = await technicalDebtService.calculateOrganizationTechnicalDebt(
      decodeURIComponent(organization)
    );

    // Store all analysis results
    for (const result of results) {
      await technicalDebtService.storeTechnicalDebtAnalysis(result);
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error calculating organization technical debt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate organization technical debt',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get historical technical debt analysis
router.get('/technical-debt-history/:organization', async (req, res) => {
  try {
    const { organization } = req.params;
    const { productArea, limit } = req.query;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
      return;
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 10;
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        message: 'Limit must be a number between 1 and 100',
      });
      return;
    }

    const history = await technicalDebtService.getHistoricalAnalysis(
      decodeURIComponent(organization),
      productArea ? decodeURIComponent(productArea as string) : undefined,
      limitNum
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching technical debt history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technical debt history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get ticket breakdown by product area and severity
router.get('/tickets/:organization', async (req, res) => {
  try {
    const { organization } = req.params;
    const { startDate, endDate } = req.query;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
      return;
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    // Validate dates
    if (start && isNaN(start.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid start date format',
      });
      return;
    }

    if (end && isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid end date format',
      });
      return;
    }

    if (start && end && start > end) {
      res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
      return;
    }

    const breakdown = await analyticsService.getTicketBreakdown(
      decodeURIComponent(organization),
      start,
      end
    );

    // Calculate summary statistics
    const totalTickets = breakdown.reduce((sum, area) => sum + area.totalTickets, 0);
    const averageResolutionTime = breakdown
      .filter(area => area.averageResolutionTime !== undefined)
      .reduce((sum, area, _, arr) => sum + (area.averageResolutionTime! / arr.length), 0);

    const severityTotals = breakdown.reduce(
      (totals, area) => ({
        CRITICAL: totals.CRITICAL + area.severityCounts.CRITICAL,
        SEVERE: totals.SEVERE + area.severityCounts.SEVERE,
        MODERATE: totals.MODERATE + area.severityCounts.MODERATE,
        LOW: totals.LOW + area.severityCounts.LOW,
      }),
      { CRITICAL: 0, SEVERE: 0, MODERATE: 0, LOW: 0 }
    );

    res.json({
      success: true,
      data: {
        organization: decodeURIComponent(organization),
        dateRange: {
          startDate: start?.toISOString(),
          endDate: end?.toISOString(),
        },
        summary: {
          totalTickets,
          totalProductAreas: breakdown.length,
          averageResolutionTime: Math.round(averageResolutionTime),
          severityTotals,
        },
        breakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching ticket breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket breakdown',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get usage correlation analysis
router.get('/usage-correlation/:organization', async (req, res) => {
  try {
    const { organization } = req.params;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
      return;
    }

    const correlations = await analyticsService.getUsageCorrelation(
      decodeURIComponent(organization)
    );

    // Calculate summary metrics
    const highRiskAreas = correlations.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL');
    const averageCorrelationScore = correlations.reduce((sum, c) => sum + c.correlationScore, 0) / correlations.length;
    const totalTickets = correlations.reduce((sum, c) => sum + c.ticketCount, 0);
    const totalCurrentUsage = correlations.reduce((sum, c) => sum + c.currentUsage, 0);

    res.json({
      success: true,
      data: {
        organization: decodeURIComponent(organization),
        summary: {
          totalProductAreas: correlations.length,
          highRiskAreas: highRiskAreas.length,
          averageCorrelationScore: Math.round(averageCorrelationScore * 100) / 100,
          totalTickets,
          totalCurrentUsage,
        },
        correlations,
        highRiskAreas,
      },
    });
  } catch (error) {
    console.error('Error fetching usage correlation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage correlation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


// Get historical trend analysis
router.get('/trends/:organization', async (req, res) => {
  try {
    const { organization } = req.params;
    const { months } = req.query;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
      return;
    }

    const monthsNum = months ? parseInt(months as string, 10) : 6;
    if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 24) {
      res.status(400).json({
        success: false,
        message: 'Months must be a number between 1 and 24',
      });
      return;
    }

    const trends = await analyticsService.getTrendAnalysis(
      decodeURIComponent(organization),
      monthsNum
    );

    // Calculate summary statistics
    const decliningAreas = trends.filter(t => t.trendIndicator === 'DECLINING').length;
    const improvingAreas = trends.filter(t => t.trendIndicator === 'IMPROVING').length;
    const stableAreas = trends.filter(t => t.trendIndicator === 'STABLE').length;

    const averageTicketChange = trends.reduce((sum, t) => sum + t.monthOverMonth.ticketChange, 0) / trends.length;
    const averageUsageChange = trends.reduce((sum, t) => sum + t.monthOverMonth.usageChange, 0) / trends.length;

    res.json({
      success: true,
      data: {
        organization: decodeURIComponent(organization),
        analysisMonths: monthsNum,
        summary: {
          totalProductAreas: trends.length,
          decliningAreas,
          improvingAreas,
          stableAreas,
          averageTicketChange: Math.round(averageTicketChange * 100) / 100,
          averageUsageChange: Math.round(averageUsageChange * 100) / 100,
        },
        trends,
      },
    });
  } catch (error) {
    console.error('Error fetching trend analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trend analysis',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
