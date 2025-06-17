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
  'Severity level'?: string;
  Severity?: string; // Keep both for backward compatibility
}

// Helper function to parse date in MM/DD/YYYY HH:MM or YYYY-MM-DD HH:MM format
function parseDate(dateString: string): Date {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Invalid date string');
  }
  
  // Trim whitespace
  dateString = dateString.trim();
  
  // Try to parse as ISO date first
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  const [datePart, timePart] = dateString.split(' ');
  
  if (!datePart) {
    throw new Error('Invalid date format');
  }
  
  const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
  
  // Check if date is in YYYY-MM-DD format (contains hyphens)
  if (datePart.includes('-')) {
    const [year, month, day] = datePart.split('-');
    
    if (!year || !month || !day) {
      throw new Error('Invalid date format');
    }
    
    const parsedDate = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Month is 0-indexed
      parseInt(day, 10),
      parseInt(hours || '0', 10),
      parseInt(minutes || '0', 10)
    );
    
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date values');
    }
    
    return parsedDate;
  }
  // Otherwise assume MM/DD/YYYY format (contains slashes)
  else if (datePart.includes('/')) {
    const [month, day, year] = datePart.split('/');
    
    if (!month || !day || !year) {
      throw new Error('Invalid date format');
    }
    
    const parsedDate = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Month is 0-indexed
      parseInt(day, 10),
      parseInt(hours || '0', 10),
      parseInt(minutes || '0', 10)
    );
    
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date values');
    }
    
    return parsedDate;
  }
  else {
    throw new Error('Invalid date format');
  }
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
  
  // Validate date formats with more lenient error handling
  if (row.Requested) {
    try {
      parseDate(row.Requested);
    } catch (error: any) {
      errors.push(`Invalid Requested date format: ${error.message}. Expected MM/DD/YYYY HH:MM, YYYY-MM-DD HH:MM, or ISO format`);
    }
  }
  
  if (row.Updated) {
    try {
      parseDate(row.Updated);
    } catch (error: any) {
      errors.push(`Invalid Updated date format: ${error.message}. Expected MM/DD/YYYY HH:MM, YYYY-MM-DD HH:MM, or ISO format`);
    }
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

    if (req.file.size === 0) {
      return res.status(400).json({
        success: false,
        error: 'Uploaded file is empty'
      });
    }

    console.log('📁 File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length
    });

    // Log first few bytes of the file to check encoding
    const firstBytes = req.file.buffer.slice(0, 200).toString('utf8');
    console.log('📄 First 200 bytes of file:', firstBytes);

    const results: TicketCSVRow[] = [];
    const errors: string[] = [];
    let rowNumber = 0;
    let headerRow: string[] = [];
    const organizationsFound = new Set<string>();

    // Parse CSV from buffer with more flexible options
    const stream = Readable.from(req.file.buffer);
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv({
          strict: false
        }))
        .on('headers', (headers: string[]) => {
          headerRow = headers;
          console.log('📋 CSV Headers detected:', headers);
          
          // Check if we have the minimum required headers
          const requiredHeaders = ['ID', 'Status', 'Requested', 'Organization', 'Subject', 'Updated', 'Requester', 'Product Area', 'Reason for Contact'];
          const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
          
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`));
            return;
          }
        })
        .on('data', (data: TicketCSVRow) => {
          rowNumber++;
          console.log(`📊 Row ${rowNumber} data:`, data);
          
          // Skip completely empty rows
          const hasData = Object.values(data).some(value => value && value.toString().trim() !== '');
          if (!hasData) {
            console.log(`⏭️ Skipping empty row ${rowNumber}`);
            return;
          }
          
          // Track organizations found in CSV
          if (data.Organization && data.Organization.trim()) {
            organizationsFound.add(data.Organization.trim());
          }
          
          // Validate row
          const rowErrors = validateTicketRow(data);
          if (rowErrors.length > 0) {
            errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`);
            console.log(`❌ Row ${rowNumber} validation errors:`, rowErrors);
          } else {
            results.push(data);
            console.log(`✅ Row ${rowNumber} validated successfully`);
          }
        })
        .on('end', () => {
          console.log('📄 CSV parsing completed:', {
            totalRows: rowNumber,
            validRows: results.length,
            errorRows: errors.length,
            organizationsFound: Array.from(organizationsFound)
          });
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSV parsing error:', error);
          reject(error);
        });
    });

    // Allow partial success if we have some valid rows
    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'CSV validation failed - no valid rows found',
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
            severity: mapSeverity(row['Severity level'] || row.Severity || 'MODERATE'),
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
