import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { prisma } from '../server';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Error handler for multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError || err.message === 'Only CSV files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

interface UsageCSVRow {
  Capability: string;
  'Annual budget-to-date cost (USD)': string;
  'Last 0-30 days cost (USD)': string;
}

// Helper function to validate required fields
function validateUsageRow(row: UsageCSVRow): string[] {
  const errors: string[] = [];
  const requiredFields = ['Capability', 'Annual budget-to-date cost (USD)', 'Last 0-30 days cost (USD)'];
  
  for (const field of requiredFields) {
    const value = row[field as keyof UsageCSVRow];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate numeric fields
  const annualCost = parseFloat(row['Annual budget-to-date cost (USD)']);
  const last30DaysCost = parseFloat(row['Last 0-30 days cost (USD)']);
  
  if (isNaN(annualCost)) {
    errors.push('Invalid Annual budget-to-date cost (USD) - must be a number');
  }
  
  if (isNaN(last30DaysCost)) {
    errors.push('Invalid Last 0-30 days cost (USD) - must be a number');
  }
  
  return errors;
}

// GET /api/usage/check-upload-eligibility/:organization - Validate upload timing
router.get('/check-upload-eligibility/:organization', async (req: express.Request, res: express.Response) => {
  try {
    const { organization } = req.params;
    
    if (!organization) {
      return res.status(400).json({ error: 'Organization parameter is required' });
    }

    // Find the most recent upload for this organization
    const lastUpload = await prisma.dynatraceUsage.findFirst({
      where: { organization },
      orderBy: { uploadDate: 'desc' },
    });

    if (!lastUpload) {
      return res.json({
        eligible: true,
        message: 'No previous uploads found for this organization',
        lastUploadDate: null,
        daysSinceLastUpload: null
      });
    }

    const now = new Date();
    const daysSinceLastUpload = Math.floor(
      (now.getTime() - lastUpload.uploadDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const eligible = daysSinceLastUpload >= 30;

    return res.json({
      eligible,
      message: eligible 
        ? 'Upload is allowed' 
        : 'It has NOT been 30 days since the last upload. Do you want to overwrite?',
      lastUploadDate: lastUpload.uploadDate,
      daysSinceLastUpload
    });

  } catch (error: any) {
    console.error('Upload eligibility check error:', error);
    return res.status(500).json({
      error: 'Failed to check upload eligibility',
      details: error.message
    });
  }
});

// POST /api/usage/upload - Parse Dynatrace usage CSV with 30-day validation
router.post('/upload', upload.single('file'), handleMulterError, async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { organization } = req.body;
    const force = req.query.force === 'true';

    if (!organization) {
      return res.status(400).json({ error: 'Organization is required in request body' });
    }

    // Check upload eligibility unless force is true
    if (!force) {
      const lastUpload = await prisma.dynatraceUsage.findFirst({
        where: { organization },
        orderBy: { uploadDate: 'desc' },
      });

      if (lastUpload) {
        const now = new Date();
        const daysSinceLastUpload = Math.floor(
          (now.getTime() - lastUpload.uploadDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastUpload < 30) {
          return res.status(409).json({
            error: 'Upload not allowed',
            message: 'It has NOT been 30 days since the last upload. Do you want to overwrite?',
            lastUploadDate: lastUpload.uploadDate,
            daysSinceLastUpload,
            suggestion: 'Add ?force=true parameter to overwrite'
          });
        }
      }
    }

    const results: UsageCSVRow[] = [];
    const errors: string[] = [];
    let rowNumber = 0;

    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer);
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: UsageCSVRow) => {
          rowNumber++;
          
          // Validate row
          const rowErrors = validateUsageRow(data);
          if (rowErrors.length > 0) {
            errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`);
          } else {
            results.push(data);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'CSV validation failed',
        details: errors,
        validRows: results.length,
        totalRows: rowNumber
      });
    }

    // Archive previous data if force overwrite
    if (force) {
      // In a real implementation, you might want to move data to an archive table
      // For now, we'll delete the old data
      await prisma.dynatraceUsage.deleteMany({
        where: { organization }
      });
    }

    // Insert new usage data
    const uploadDate = new Date();
    const insertedUsage = [];
    
    for (const row of results) {
      try {
        const usage = await prisma.dynatraceUsage.create({
          data: {
            capability: row.Capability,
            annualBudgetCost: parseFloat(row['Annual budget-to-date cost (USD)']),
            last30DaysCost: parseFloat(row['Last 0-30 days cost (USD)']),
            organization,
            uploadDate,
          },
        });
        insertedUsage.push(usage);
      } catch (dbError: any) {
        errors.push(`Failed to insert usage data for ${row.Capability}: ${dbError.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        message: 'Partial success',
        inserted: insertedUsage.length,
        errors: errors,
        data: insertedUsage
      });
    }

    return res.status(201).json({
      message: 'Usage data uploaded successfully',
      inserted: insertedUsage.length,
      organization,
      uploadDate,
      data: insertedUsage
    });

  } catch (error: any) {
    console.error('Usage upload error:', error);
    return res.status(500).json({
      error: 'Failed to process usage upload',
      details: error.message
    });
  }
});

export default router;
