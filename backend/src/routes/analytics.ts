import express from 'express';
import { prisma } from '../server';
import { technicalDebtService } from '../services/technicalDebtService';

const router = express.Router();

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
      return res.status(400).json({
        success: false,
        message: 'Organization and product area are required',
      });
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
      return res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
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
      return res.status(400).json({
        success: false,
        message: 'Organization is required',
      });
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 10;
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be a number between 1 and 100',
      });
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

export default router;
