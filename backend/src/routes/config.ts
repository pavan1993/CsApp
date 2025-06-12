import express from 'express';
import { PrismaClient, TicketSeverity } from '@prisma/client';
import { connectDatabase } from '../config/database';

// Create a simple error class since AppError import is having issues
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const router = express.Router();
const prisma = connectDatabase();

// Validation helpers
function validateOrganization(organization: string): void {
  if (!organization || typeof organization !== 'string' || organization.trim() === '' || organization.trim() === ' ') {
    throw new AppError('Organization parameter is required', 400);
  }
}

function validateTicketSeverity(severity: string): TicketSeverity {
  const validSeverities = Object.values(TicketSeverity);
  if (!validSeverities.includes(severity as TicketSeverity)) {
    throw new AppError(`Invalid severity level. Must be one of: ${validSeverities.join(', ')}`, 400);
  }
  return severity as TicketSeverity;
}

function validateThreshold(threshold: number): void {
  if (typeof threshold !== 'number' || threshold < 0 || !Number.isInteger(threshold)) {
    throw new AppError('Threshold must be a non-negative integer', 400);
  }
}

function validateUsageDropThreshold(threshold: number): void {
  if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
    throw new AppError('Usage drop threshold must be a number between 0 and 100', 400);
  }
}

// GET /api/config/mapping/:organization - Get product area mappings
router.get('/mapping/:organization', async (req, res, next) => {
  try {
    const { organization } = req.params;
    validateOrganization(organization);

    const mappings = await prisma.productAreaMapping.findMany({
      where: { organization },
      orderBy: [
        { productArea: 'asc' },
        { dynatraceCapability: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: mappings,
      count: mappings.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/config/mapping/:organization - Create product area mapping
router.post('/mapping/:organization', async (req, res, next) => {
  try {
    const { organization } = req.params;
    validateOrganization(organization);

    const { productArea, dynatraceCapability, isKeyModule = false } = req.body;

    if (!productArea || typeof productArea !== 'string' || productArea.trim() === '') {
      throw new AppError('Product area is required', 400);
    }

    if (!dynatraceCapability || typeof dynatraceCapability !== 'string' || dynatraceCapability.trim() === '') {
      throw new AppError('Dynatrace capability is required', 400);
    }


    if (typeof isKeyModule !== 'boolean') {
      throw new AppError('isKeyModule must be a boolean', 400);
    }

    const mapping = await prisma.productAreaMapping.create({
      data: {
        organization,
        productArea: productArea.trim(),
        dynatraceCapability: dynatraceCapability.trim(),
        isKeyModule
      }
    });

    res.status(201).json({
      success: true,
      data: mapping
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      next(new AppError('Mapping already exists for this product area and capability combination', 409));
    } else {
      next(error);
    }
  }
});

// PUT /api/config/mapping/:organization/:id - Update product area mapping
router.put('/mapping/:organization/:id', async (req, res, next) => {
  try {
    const { organization, id } = req.params;
    validateOrganization(organization);

    if (!id || typeof id !== 'string') {
      throw new AppError('Mapping ID is required', 400);
    }

    const { productArea, dynatraceCapability, isKeyModule } = req.body;
    const updateData: any = {};

    if (productArea !== undefined) {
      if (typeof productArea !== 'string' || productArea.trim() === '') {
        throw new AppError('Product area must be a non-empty string', 400);
      }
      updateData.productArea = productArea.trim();
    }

    if (dynatraceCapability !== undefined) {
      if (typeof dynatraceCapability !== 'string' || dynatraceCapability.trim() === '') {
        throw new AppError('Dynatrace capability must be a non-empty string', 400);
      }
      updateData.dynatraceCapability = dynatraceCapability.trim();
    }

    if (isKeyModule !== undefined) {
      if (typeof isKeyModule !== 'boolean') {
        throw new AppError('isKeyModule must be a boolean', 400);
      }
      updateData.isKeyModule = isKeyModule;
    }

    const mapping = await prisma.productAreaMapping.update({
      where: { id },
      data: updateData
    });

    // Verify the mapping belongs to the organization
    if (mapping.organization !== organization) {
      throw new AppError('Mapping not found', 404);
    }

    res.json({
      success: true,
      data: mapping
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      next(new AppError('Mapping not found', 404));
    } else if (error.code === 'P2002') {
      next(new AppError('Mapping already exists for this product area and capability combination', 409));
    } else {
      next(error);
    }
  }
});

// DELETE /api/config/mapping/:organization/:id - Delete product area mapping
router.delete('/mapping/:organization/:id', async (req, res, next) => {
  try {
    const { organization, id } = req.params;
    validateOrganization(organization);

    if (!id || typeof id !== 'string') {
      throw new AppError('Mapping ID is required', 400);
    }

    const mapping = await prisma.productAreaMapping.findUnique({
      where: { id }
    });

    if (!mapping || mapping.organization !== organization) {
      throw new AppError('Mapping not found', 404);
    }

    await prisma.productAreaMapping.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Mapping deleted successfully'
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      next(new AppError('Mapping not found', 404));
    } else {
      next(error);
    }
  }
});

// GET /api/config/thresholds/:organization - Get threshold configurations
router.get('/thresholds/:organization', async (req, res, next) => {
  try {
    const { organization } = req.params;
    validateOrganization(organization);

    const thresholds = await prisma.thresholdConfiguration.findMany({
      where: { organization },
      orderBy: [
        { productArea: 'asc' },
        { severityLevel: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: thresholds,
      count: thresholds.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/config/thresholds/:organization - Create threshold configuration
router.post('/thresholds/:organization', async (req, res, next) => {
  try {
    const { organization } = req.params;
    validateOrganization(organization);

    const { productArea, severityLevel, ticketThreshold, usageDropThreshold } = req.body;

    if (!productArea || typeof productArea !== 'string' || productArea.trim() === '') {
      throw new AppError('Product area is required', 400);
    }

    if (!severityLevel) {
      throw new AppError('Severity level is required', 400);
    }

    const validSeverity = validateTicketSeverity(severityLevel);
    validateThreshold(ticketThreshold);
    validateUsageDropThreshold(usageDropThreshold);

    const threshold = await prisma.thresholdConfiguration.create({
      data: {
        organization,
        productArea: productArea.trim(),
        severityLevel: validSeverity,
        ticketThreshold,
        usageDropThreshold
      }
    });

    res.status(201).json({
      success: true,
      data: threshold
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      next(new AppError('Threshold configuration already exists for this product area and severity level', 409));
    } else {
      next(error);
    }
  }
});

// PUT /api/config/thresholds/:organization/:id - Update threshold configuration
router.put('/thresholds/:organization/:id', async (req, res, next) => {
  try {
    const { organization, id } = req.params;
    validateOrganization(organization);

    if (!id || typeof id !== 'string') {
      throw new AppError('Threshold ID is required', 400);
    }

    const { productArea, severityLevel, ticketThreshold, usageDropThreshold } = req.body;
    const updateData: any = {};

    if (productArea !== undefined) {
      if (typeof productArea !== 'string' || productArea.trim() === '') {
        throw new AppError('Product area must be a non-empty string', 400);
      }
      updateData.productArea = productArea.trim();
    }

    if (severityLevel !== undefined) {
      updateData.severityLevel = validateTicketSeverity(severityLevel);
    }

    if (ticketThreshold !== undefined) {
      validateThreshold(ticketThreshold);
      updateData.ticketThreshold = ticketThreshold;
    }

    if (usageDropThreshold !== undefined) {
      validateUsageDropThreshold(usageDropThreshold);
      updateData.usageDropThreshold = usageDropThreshold;
    }

    const threshold = await prisma.thresholdConfiguration.update({
      where: { id },
      data: updateData
    });

    // Verify the threshold belongs to the organization
    if (threshold.organization !== organization) {
      throw new AppError('Threshold configuration not found', 404);
    }

    res.json({
      success: true,
      data: threshold
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      next(new AppError('Threshold configuration not found', 404));
    } else if (error.code === 'P2002') {
      next(new AppError('Threshold configuration already exists for this product area and severity level', 409));
    } else {
      next(error);
    }
  }
});

// DELETE /api/config/thresholds/:organization/:id - Delete threshold configuration
router.delete('/thresholds/:organization/:id', async (req, res, next) => {
  try {
    const { organization, id } = req.params;
    validateOrganization(organization);

    if (!id || typeof id !== 'string') {
      throw new AppError('Threshold ID is required', 400);
    }

    const threshold = await prisma.thresholdConfiguration.findUnique({
      where: { id }
    });

    if (!threshold || threshold.organization !== organization) {
      throw new AppError('Threshold configuration not found', 404);
    }

    await prisma.thresholdConfiguration.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Threshold configuration deleted successfully'
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      next(new AppError('Threshold configuration not found', 404));
    } else {
      next(error);
    }
  }
});

// GET /api/config/key-modules/:organization - Get key modules
router.get('/key-modules/:organization', async (req, res, next) => {
  try {
    const { organization } = req.params;
    validateOrganization(organization);

    const keyModules = await prisma.productAreaMapping.findMany({
      where: { 
        organization,
        isKeyModule: true 
      },
      orderBy: [
        { productArea: 'asc' },
        { dynatraceCapability: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: keyModules,
      count: keyModules.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/config/key-modules/:organization - Toggle key module status
router.post('/key-modules/:organization', async (req, res, next) => {
  try {
    const { organization } = req.params;
    validateOrganization(organization);

    const { mappingId, isKeyModule } = req.body;

    if (!mappingId || typeof mappingId !== 'string') {
      throw new AppError('Mapping ID is required', 400);
    }

    if (typeof isKeyModule !== 'boolean') {
      throw new AppError('isKeyModule must be a boolean', 400);
    }

    const mapping = await prisma.productAreaMapping.update({
      where: { id: mappingId },
      data: { isKeyModule }
    });

    // Verify the mapping belongs to the organization
    if (mapping.organization !== organization) {
      throw new AppError('Mapping not found', 404);
    }

    res.json({
      success: true,
      data: mapping,
      message: `Module ${isKeyModule ? 'marked as' : 'removed from'} key module`
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      next(new AppError('Mapping not found', 404));
    } else {
      next(error);
    }
  }
});

// PUT /api/config/key-modules/:organization/:id - Update key module status
router.put('/key-modules/:organization/:id', async (req, res, next) => {
  try {
    const { organization, id } = req.params;
    validateOrganization(organization);

    if (!id || typeof id !== 'string') {
      throw new AppError('Mapping ID is required', 400);
    }

    const { isKeyModule } = req.body;

    if (typeof isKeyModule !== 'boolean') {
      throw new AppError('isKeyModule must be a boolean', 400);
    }

    const mapping = await prisma.productAreaMapping.update({
      where: { id },
      data: { isKeyModule }
    });

    // Verify the mapping belongs to the organization
    if (mapping.organization !== organization) {
      throw new AppError('Mapping not found', 404);
    }

    res.json({
      success: true,
      data: mapping,
      message: `Module ${isKeyModule ? 'marked as' : 'removed from'} key module`
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      next(new AppError('Mapping not found', 404));
    } else {
      next(error);
    }
  }
});

export default router;
