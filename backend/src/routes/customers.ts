import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { connectDatabase } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AnalyticsService } from '../services/analyticsService';

const prisma = connectDatabase();
const analyticsService = new AnalyticsService();

const router = express.Router();

// Get all customers (now returns organizations from analytics data)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get organizations from analytics data (uploaded CSV files)
    const organizations = await analyticsService.getOrganizations();
    
    // Transform organizations into customer-like format for the frontend
    const customersData = await Promise.all(
      organizations.map(async (orgName) => {
        try {
          // Get ticket breakdown to calculate metrics
          const ticketBreakdown = await analyticsService.getTicketBreakdown(orgName);
          const totalTickets = ticketBreakdown.reduce((sum, area) => sum + area.totalTickets, 0);
          const criticalTickets = ticketBreakdown.reduce((sum, area) => sum + area.severityCounts.CRITICAL, 0);
          
          // Calculate health score based on ticket data
          let healthScore = 10; // Start with perfect score
          if (criticalTickets > 10) healthScore -= 4;
          else if (criticalTickets > 5) healthScore -= 2;
          else if (criticalTickets > 0) healthScore -= 1;
          
          if (totalTickets > 100) healthScore -= 3;
          else if (totalTickets > 50) healthScore -= 2;
          else if (totalTickets > 20) healthScore -= 1;
          
          healthScore = Math.max(1, Math.min(10, healthScore));
          
          // Determine status based on health score
          let status: 'ACTIVE' | 'INACTIVE' | 'TRIAL' = 'ACTIVE';
          if (healthScore <= 3) status = 'INACTIVE';
          else if (healthScore <= 6) status = 'TRIAL';
          
          return {
            id: orgName.toLowerCase().replace(/\s+/g, '-'),
            name: orgName,
            email: `contact@${orgName.toLowerCase().replace(/\s+/g, '')}.com`,
            company: orgName,
            status,
            healthScore,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            totalTickets,
            criticalTickets,
            productAreas: ticketBreakdown.length
          };
        } catch (error) {
          console.warn(`Failed to get analytics for ${orgName}:`, error);
          return {
            id: orgName.toLowerCase().replace(/\s+/g, '-'),
            name: orgName,
            email: `contact@${orgName.toLowerCase().replace(/\s+/g, '')}.com`,
            company: orgName,
            status: 'ACTIVE' as const,
            healthScore: 5,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            totalTickets: 0,
            criticalTickets: 0,
            productAreas: 0
          };
        }
      })
    );

    res.json({
      success: true,
      data: customersData,
      count: customersData.length,
    });
  } catch (error) {
    console.error('Error fetching customers/organizations:', error);
    
    // Fallback to database customers if analytics fails
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { interactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: customers,
      count: customers.length,
    });
  }
}));

// Get customer by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  return res.json({
    success: true,
    data: customer,
  });
}));

// Create new customer
router.post('/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('company').notEmpty().withMessage('Company is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, company, healthScore } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        company,
        healthScore: healthScore || 5,
      },
    });

    return res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  })
);

// Delete customer endpoint
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Try to delete from database first
    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (customer) {
      await prisma.customer.delete({
        where: { id }
      });
      
      return res.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    }
    
    // If not found in database, it might be an organization from analytics data
    // For now, just return success since we can't actually delete analytics data
    return res.json({
      success: true,
      message: 'Organization data cannot be deleted (sourced from uploaded files)',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

export default router;
