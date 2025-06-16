import express from 'express';
import { connectDatabase } from '../config/database';
import { AnalyticsService } from '../services/analyticsService';
import { TechnicalDebtService } from '../services/technicalDebtService';

// Get database connection
const prisma = connectDatabase();

// Create service instances
const analyticsService = new AnalyticsService();
const technicalDebtService = new TechnicalDebtService();

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
    
    console.log(`✅ Found ${organizations.length} organizations:`, organizations);

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('❌ Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get executive summary for a specific organization
router.get('/executive-summary', async (req, res) => {
  try {
    const { organization } = req.query;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization query parameter is required',
      });
      return;
    }

    const orgName = decodeURIComponent(organization as string);

    // Get ticket breakdown for the organization
    const ticketBreakdown = await analyticsService.getTicketBreakdown(orgName);
    
    // Get technical debt analysis for the organization
    const technicalDebtResults = await technicalDebtService.calculateOrganizationTechnicalDebt(orgName);

    // Calculate executive summary metrics
    const totalTickets = ticketBreakdown.reduce((sum, area) => sum + area.totalTickets, 0);
    const totalProductAreas = ticketBreakdown.length;
    const criticalTickets = ticketBreakdown.reduce((sum, area) => sum + area.severityCounts.CRITICAL, 0);
    const severeTickets = ticketBreakdown.reduce((sum, area) => sum + area.severityCounts.SEVERE, 0);
    
    const averageTechnicalDebtScore = technicalDebtResults.length > 0 
      ? technicalDebtResults.reduce((sum, result) => sum + result.debtScore, 0) / technicalDebtResults.length
      : 0;

    // Risk distribution
    const riskDistribution = technicalDebtResults.reduce(
      (dist, result) => {
        switch (result.category) {
          case 'Good':
            dist.good++;
            break;
          case 'Moderate Risk':
            dist.moderate++;
            break;
          case 'High Risk':
            dist.high++;
            break;
          case 'Critical':
            dist.critical++;
            break;
        }
        return dist;
      },
      { good: 0, moderate: 0, high: 0, critical: 0 }
    );

    // Calculate average usage score (mock calculation)
    const averageUsageScore = 75; // This would come from actual usage data

    res.json({
      success: true,
      data: {
        totalProductAreas,
        totalTickets,
        criticalIssues: criticalTickets + severeTickets,
        averageUsageScore,
        technicalDebtScore: Math.round(averageTechnicalDebtScore * 10) / 10,
        riskDistribution,
        organization: orgName,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching executive summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch executive summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get dashboard analytics for a specific organization
router.get('/dashboard', async (req, res) => {
  try {
    const { organization } = req.query;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization query parameter is required',
      });
      return;
    }

    const orgName = decodeURIComponent(organization as string);

    // Get ticket breakdown for the organization
    const ticketBreakdown = await analyticsService.getTicketBreakdown(orgName);
    
    // Get technical debt analysis for the organization
    const technicalDebtResults = await technicalDebtService.calculateOrganizationTechnicalDebt(orgName);

    // Calculate dashboard metrics
    const totalTickets = ticketBreakdown.reduce((sum, area) => sum + area.totalTickets, 0);
    const totalProductAreas = ticketBreakdown.length;
    const criticalTickets = ticketBreakdown.reduce((sum, area) => sum + area.severityCounts.CRITICAL, 0);
    
    const averageTechnicalDebtScore = technicalDebtResults.length > 0 
      ? technicalDebtResults.reduce((sum, result) => sum + result.debtScore, 0) / technicalDebtResults.length
      : 0;

    const highRiskAreas = technicalDebtResults.filter(result => 
      result.category === 'High Risk' || result.category === 'Critical'
    ).length;

    // Get all organizations count
    const allOrganizations = await analyticsService.getOrganizations();
    const totalOrganizations = allOrganizations.length;

    res.json({
      success: true,
      data: {
        totalOrganizations,
        totalProductAreas,
        totalTickets,
        criticalTickets,
        averageTechnicalDebtScore: Math.round(averageTechnicalDebtScore * 10) / 10,
        highRiskAreas,
        organization: orgName,
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

// Get dashboard summary for a specific organization
router.get('/dashboard/:organization', async (req, res) => {
  try {
    const { organization } = req.params;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
      return;
    }

    const orgName = decodeURIComponent(organization);

    // Get ticket breakdown for the organization
    const ticketBreakdown = await analyticsService.getTicketBreakdown(orgName);
    
    // Get technical debt analysis for the organization
    const technicalDebtResults = await technicalDebtService.calculateOrganizationTechnicalDebt(orgName);

    // Calculate dashboard metrics
    const totalTickets = ticketBreakdown.reduce((sum, area) => sum + area.totalTickets, 0);
    const totalProductAreas = ticketBreakdown.length;
    const criticalTickets = ticketBreakdown.reduce((sum, area) => sum + area.severityCounts.CRITICAL, 0);
    
    const averageTechnicalDebtScore = technicalDebtResults.length > 0 
      ? technicalDebtResults.reduce((sum, result) => sum + result.debtScore, 0) / technicalDebtResults.length
      : 0;

    const highRiskAreas = technicalDebtResults.filter(result => 
      result.category === 'High Risk' || result.category === 'Critical'
    ).length;

    // Get all organizations count
    const allOrganizations = await analyticsService.getOrganizations();
    const totalOrganizations = allOrganizations.length;

    res.json({
      success: true,
      data: {
        totalOrganizations,
        totalProductAreas,
        totalTickets,
        criticalTickets,
        averageTechnicalDebtScore: Math.round(averageTechnicalDebtScore * 10) / 10,
        highRiskAreas,
        organization: orgName,
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
router.get('/tickets/breakdown', async (req, res) => {
  try {
    const { organization, startDate, endDate } = req.query;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization query parameter is required',
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
      decodeURIComponent(organization as string),
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
        organization: decodeURIComponent(organization as string),
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

// Get tickets for a specific organization (legacy route)
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

// Get technical debt analysis (general endpoint with query params)
router.get('/technical-debt', async (req, res) => {
  try {
    const { organization, productArea } = req.query;

    if (!organization) {
      res.status(400).json({
        success: false,
        message: 'Organization query parameter is required',
      });
      return;
    }

    const orgName = decodeURIComponent(organization as string);

    if (productArea) {
      // Get technical debt for specific product area
      const result = await technicalDebtService.calculateTechnicalDebt(
        orgName,
        decodeURIComponent(productArea as string)
      );

      // Store the analysis result
      await technicalDebtService.storeTechnicalDebtAnalysis(result);

      res.json({
        success: true,
        data: result,
      });
    } else {
      // Get technical debt for all product areas in organization
      const results = await technicalDebtService.calculateOrganizationTechnicalDebt(orgName);

      // Store all analysis results
      for (const result of results) {
        await technicalDebtService.storeTechnicalDebtAnalysis(result);
      }

      res.json({
        success: true,
        data: results,
      });
    }
  } catch (error) {
    console.error('Error fetching technical debt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technical debt',
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
