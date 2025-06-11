import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all customers
router.get('/', asyncHandler(async (req: Request, res: Response) => {
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

  res.json({
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

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  })
);

export default router;
