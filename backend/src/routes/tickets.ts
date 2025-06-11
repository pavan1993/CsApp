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
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results: TicketCSVRow[] = [];
    const errors: string[] = [];
    let rowNumber = 0;

    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer);
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: TicketCSVRow) => {
          rowNumber++;
          
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
            id: row.ID,
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
        errors.push(`Failed to insert ticket ${row.ID}: ${dbError.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        message: 'Partial success',
        inserted: insertedTickets.length,
        errors: errors,
        data: insertedTickets
      });
    }

    return res.status(201).json({
      message: 'Tickets uploaded successfully',
      inserted: insertedTickets.length,
      data: insertedTickets
    });

  } catch (error: any) {
    console.error('Ticket upload error:', error);
    return res.status(500).json({
      error: 'Failed to process ticket upload',
      details: error.message
    });
  }
});

export default router;
