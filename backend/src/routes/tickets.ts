import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { prisma } from '../server';
import { TicketSeverity } from '@prisma/client';

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

interface TicketCSVRow {
  ID: string;
  Status: string;
  Requested: string;
  Organization: string;
  Subject: string;
  Updated: string;
  Assignee: string;
  Requester: string;
  'Product Area': string;
  'Reason for Contact': string;
  Severity?: string;
}

// Helper function to parse date in MM/DD/YYYY HH:MM format
function parseDate(dateString: string): Date {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Invalid date string');
  }
  
  const [datePart, timePart] = dateString.split(' ');
  
  if (!datePart) {
    throw new Error('Invalid date format');
  }
  
  const [month, day, year] = datePart.split('/');
  const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
  
  if (!month || !day || !year) {
    throw new Error('Invalid date format');
  }
  
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // Month is 0-indexed
    parseInt(day, 10),
    parseInt(hours || '0', 10),
    parseInt(minutes || '0', 10)
  );
}

// Helper function to map severity string to enum
function mapSeverity(severity: string): TicketSeverity {
  const normalizedSeverity = severity.toUpperCase();
  switch (normalizedSeverity) {
    case 'CRITICAL':
      return TicketSeverity.CRITICAL;
    case 'SEVERE':
      return TicketSeverity.SEVERE;
    case 'MODERATE':
      return TicketSeverity.MODERATE;
    case 'LOW':
      return TicketSeverity.LOW;
    default:
      return TicketSeverity.MODERATE; // Default fallback
  }
}

// Helper function to validate required fields
function validateTicketRow(row: TicketCSVRow): string[] {
  const errors: string[] = [];
  const requiredFields = ['ID', 'Status', 'Requested', 'Organization', 'Subject', 'Updated', 'Requester', 'Product Area', 'Reason for Contact'];
  
  for (const field of requiredFields) {
    const value = row[field as keyof TicketCSVRow];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate date formats
  try {
    parseDate(row.Requested);
  } catch (error) {
    errors.push('Invalid Requested date format. Expected MM/DD/YYYY HH:MM');
  }
  
  try {
    parseDate(row.Updated);
  } catch (error) {
    errors.push('Invalid Updated date format. Expected MM/DD/YYYY HH:MM');
  }
  
  return errors;
}

// POST /api/tickets/upload - Parse support tickets CSV
router.post('/upload', upload.single('file'), handleMulterError, async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const results: TicketCSVRow[] = [];
    const errors: string[] = [];
    let rowNumber = 0;
    const organizationsFound = new Set<string>();

    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer);
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: TicketCSVRow) => {
          rowNumber++;
          
          // Track organizations found in CSV
          if (data.Organization && data.Organization.trim()) {
            organizationsFound.add(data.Organization.trim());
          }
          
          // Validate row
          const rowErrors = validateTicketRow(data);
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
        success: false,
        error: 'CSV validation failed',
        details: errors,
        validRows: results.length,
        totalRows: rowNumber
      });
    }

    // Insert valid tickets into database
    const insertedTickets = [];
    for (const row of results) {
      try {
        const ticket = await prisma.supportTicket.create({
          data: {
            status: row.Status,
            requested: parseDate(row.Requested),
            organization: row.Organization,
            subject: row.Subject,
            updated: parseDate(row.Updated),
            assignee: row.Assignee || null,
            requester: row.Requester,
            productArea: row['Product Area'],
            reasonForContact: row['Reason for Contact'],
            severity: mapSeverity(row.Severity || 'MODERATE'),
          },
        });
        insertedTickets.push(ticket);
      } catch (dbError: any) {
        errors.push(`Failed to insert ticket for ${row.Subject}: ${dbError.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: 'Partial success',
        data: {
          inserted: insertedTickets.length,
          errors: errors,
          organizationsFound: Array.from(organizationsFound),
          tickets: insertedTickets
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Tickets uploaded successfully',
      data: {
        inserted: insertedTickets.length,
        organizationsFound: Array.from(organizationsFound),
        tickets: insertedTickets
      }
    });

  } catch (error: any) {
    console.error('Ticket upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process ticket upload',
      details: error.message
    });
  }
});

export default router;
