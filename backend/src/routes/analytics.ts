import express from 'express';
import { prisma } from '../server';

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

export default router;
