/**
 * FlowLogic Data Ingestion Module
 *
 * WMS-agnostic data ingestion layer that accepts:
 * - CSV/Excel file uploads
 * - API connections to WMS systems (Manhattan, SAP, Blue Yonder)
 * - Real-time webhook integrations
 * - Scheduled data pulls
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

// Configure file storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads/ingestion';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Use: ${allowedTypes.join(', ')}`));
    }
  }
});

// Data type mappings for different WMS exports
const DATA_TYPES = {
  INVENTORY_SNAPSHOT: 'inventory_snapshot',
  TRANSACTION_HISTORY: 'transaction_history',
  ADJUSTMENT_LOG: 'adjustment_log',
  CYCLE_COUNT_RESULTS: 'cycle_count_results',
  LOCATION_MASTER: 'location_master',
  SKU_MASTER: 'sku_master',
  ORDER_HISTORY: 'order_history',
  LABOR_LOG: 'labor_log'
};

// Column mapping templates for common WMS exports
const COLUMN_MAPPINGS = {
  manhattan: {
    inventory: {
      SKU: 'sku',
      'Location ID': 'locationCode',
      'On Hand Qty': 'quantityOnHand',
      'Allocated Qty': 'quantityAllocated',
      'Available Qty': 'quantityAvailable',
      'Lot Number': 'lotNumber',
      'Expiration Date': 'expirationDate'
    },
    transactions: {
      'Transaction ID': 'transactionId',
      'Transaction Type': 'type',
      SKU: 'sku',
      'From Location': 'fromLocation',
      'To Location': 'toLocation',
      Quantity: 'quantity',
      'User ID': 'userId',
      'Transaction Date': 'transactionDate'
    }
  },
  sap: {
    inventory: {
      MATNR: 'sku',
      LGPLA: 'locationCode',
      VERME: 'quantityOnHand',
      EINME: 'quantityAllocated',
      CHARG: 'lotNumber',
      VFDAT: 'expirationDate'
    }
  },
  generic: {
    inventory: {
      sku: 'sku',
      location: 'locationCode',
      quantity: 'quantityOnHand',
      allocated: 'quantityAllocated',
      available: 'quantityAvailable',
      lot: 'lotNumber'
    }
  }
};

/**
 * Parse CSV data with auto-detection of column mapping
 */
function parseCSV(content, mappingType = 'generic', dataType = 'inventory') {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const mapping = COLUMN_MAPPINGS[mappingType]?.[dataType] || COLUMN_MAPPINGS.generic[dataType];

  return records.map(record => {
    const mapped = {};
    for (const [sourceCol, targetCol] of Object.entries(mapping)) {
      if (record[sourceCol] !== undefined) {
        mapped[targetCol] = record[sourceCol];
      }
    }
    // Include unmapped columns with original names
    for (const [key, value] of Object.entries(record)) {
      if (!mapping[key]) {
        mapped[key] = value;
      }
    }
    return mapped;
  });
}

/**
 * Validate and normalize imported data
 */
function validateData(records, dataType) {
  const errors = [];
  const validated = [];

  const requiredFields = {
    [DATA_TYPES.INVENTORY_SNAPSHOT]: ['sku', 'locationCode', 'quantityOnHand'],
    [DATA_TYPES.TRANSACTION_HISTORY]: ['type', 'sku', 'quantity', 'transactionDate'],
    [DATA_TYPES.ADJUSTMENT_LOG]: ['sku', 'locationCode', 'adjustmentQty', 'reason'],
    [DATA_TYPES.CYCLE_COUNT_RESULTS]: ['sku', 'locationCode', 'countedQty', 'systemQty'],
    [DATA_TYPES.LOCATION_MASTER]: ['locationCode', 'zone'],
    [DATA_TYPES.SKU_MASTER]: ['sku', 'description']
  };

  const required = requiredFields[dataType] || [];

  records.forEach((record, index) => {
    const missing = required.filter(field => !record[field]);
    if (missing.length > 0) {
      errors.push({ row: index + 1, message: `Missing required fields: ${missing.join(', ')}` });
    } else {
      // Normalize numeric fields
      if (record.quantityOnHand) record.quantityOnHand = parseFloat(record.quantityOnHand) || 0;
      if (record.quantityAllocated) record.quantityAllocated = parseFloat(record.quantityAllocated) || 0;
      if (record.quantityAvailable) record.quantityAvailable = parseFloat(record.quantityAvailable) || 0;
      if (record.quantity) record.quantity = parseFloat(record.quantity) || 0;
      if (record.countedQty) record.countedQty = parseFloat(record.countedQty) || 0;
      if (record.systemQty) record.systemQty = parseFloat(record.systemQty) || 0;
      if (record.adjustmentQty) record.adjustmentQty = parseFloat(record.adjustmentQty) || 0;

      validated.push(record);
    }
  });

  return { validated, errors };
}

/**
 * Create ingestion routes
 */
export function createIngestionRoutes(prisma) {
  const express = await import('express');
  const router = express.Router();

  /**
   * @route POST /api/ingestion/upload
   * @desc Upload file for data ingestion
   */
  router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { dataType = DATA_TYPES.INVENTORY_SNAPSHOT, mappingType = 'generic', source = 'manual' } = req.body;

      // Read and parse file
      const content = await fs.readFile(req.file.path, 'utf-8');
      const parsed = parseCSV(content, mappingType, dataType.replace('_', ''));
      const { validated, errors } = validateData(parsed, dataType);

      // Store ingestion record
      const ingestion = await prisma.dataIngestion.create({
        data: {
          filename: req.file.originalname,
          filePath: req.file.path,
          dataType,
          source,
          mappingType,
          recordCount: validated.length,
          errorCount: errors.length,
          status: errors.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
          metadata: {
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            errors: errors.slice(0, 100) // Store first 100 errors
          }
        }
      });

      // Process validated records based on data type
      let processedCount = 0;
      if (validated.length > 0) {
        switch (dataType) {
          case DATA_TYPES.INVENTORY_SNAPSHOT:
            processedCount = await processInventorySnapshot(prisma, validated, ingestion.id);
            break;
          case DATA_TYPES.TRANSACTION_HISTORY:
            processedCount = await processTransactionHistory(prisma, validated, ingestion.id);
            break;
          case DATA_TYPES.ADJUSTMENT_LOG:
            processedCount = await processAdjustmentLog(prisma, validated, ingestion.id);
            break;
          case DATA_TYPES.CYCLE_COUNT_RESULTS:
            processedCount = await processCycleCountResults(prisma, validated, ingestion.id);
            break;
          default:
            // Store raw data for custom processing
            processedCount = validated.length;
        }
      }

      res.json({
        success: true,
        ingestionId: ingestion.id,
        recordsProcessed: processedCount,
        recordsWithErrors: errors.length,
        errors: errors.slice(0, 20) // Return first 20 errors
      });
    } catch (error) {
      console.error('Ingestion error:', error);
      res.status(500).json({ error: 'Failed to process file', details: error.message });
    }
  });

  /**
   * @route GET /api/ingestion/history
   * @desc Get ingestion history
   */
  router.get('/history', async (req, res) => {
    try {
      const { limit = 50, offset = 0, dataType, status } = req.query;

      const where = {};
      if (dataType) where.dataType = dataType;
      if (status) where.status = status;

      const ingestions = await prisma.dataIngestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      res.json(ingestions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch ingestion history' });
    }
  });

  /**
   * @route GET /api/ingestion/mappings
   * @desc Get available column mappings
   */
  router.get('/mappings', (req, res) => {
    res.json({
      dataTypes: DATA_TYPES,
      mappings: COLUMN_MAPPINGS
    });
  });

  /**
   * @route POST /api/ingestion/schedule
   * @desc Schedule recurring data import
   */
  router.post('/schedule', async (req, res) => {
    try {
      const { name, source, connectionConfig, schedule, dataType, mappingType } = req.body;

      const scheduledJob = await prisma.scheduledIngestion.create({
        data: {
          name,
          source,
          connectionConfig: JSON.stringify(connectionConfig),
          schedule, // cron expression
          dataType,
          mappingType,
          isActive: true
        }
      });

      res.json({ success: true, job: scheduledJob });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create scheduled ingestion' });
    }
  });

  return router;
}

/**
 * Process inventory snapshot into comparison table
 */
async function processInventorySnapshot(prisma, records, ingestionId) {
  const batchSize = 1000;
  let processed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.inventorySnapshot.createMany({
      data: batch.map(r => ({
        ingestionId,
        sku: r.sku,
        locationCode: r.locationCode,
        quantityOnHand: r.quantityOnHand,
        quantityAllocated: r.quantityAllocated || 0,
        quantityAvailable: r.quantityAvailable || r.quantityOnHand - (r.quantityAllocated || 0),
        lotNumber: r.lotNumber || null,
        expirationDate: r.expirationDate ? new Date(r.expirationDate) : null,
        snapshotDate: new Date(),
        rawData: r
      })),
      skipDuplicates: true
    });

    processed += batch.length;
  }

  return processed;
}

/**
 * Process transaction history for analysis
 */
async function processTransactionHistory(prisma, records, ingestionId) {
  const batchSize = 1000;
  let processed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.transactionSnapshot.createMany({
      data: batch.map(r => ({
        ingestionId,
        externalTransactionId: r.transactionId,
        type: r.type,
        sku: r.sku,
        fromLocation: r.fromLocation || null,
        toLocation: r.toLocation || null,
        quantity: r.quantity,
        userId: r.userId || null,
        transactionDate: new Date(r.transactionDate),
        rawData: r
      })),
      skipDuplicates: true
    });

    processed += batch.length;
  }

  return processed;
}

/**
 * Process adjustment log for root cause analysis
 */
async function processAdjustmentLog(prisma, records, ingestionId) {
  const batchSize = 1000;
  let processed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.adjustmentSnapshot.createMany({
      data: batch.map(r => ({
        ingestionId,
        sku: r.sku,
        locationCode: r.locationCode,
        adjustmentQty: r.adjustmentQty,
        reason: r.reason,
        reasonCode: r.reasonCode || null,
        userId: r.userId || null,
        adjustmentDate: r.adjustmentDate ? new Date(r.adjustmentDate) : new Date(),
        rawData: r
      })),
      skipDuplicates: true
    });

    processed += batch.length;
  }

  return processed;
}

/**
 * Process cycle count results
 */
async function processCycleCountResults(prisma, records, ingestionId) {
  const batchSize = 1000;
  let processed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.cycleCountSnapshot.createMany({
      data: batch.map(r => ({
        ingestionId,
        sku: r.sku,
        locationCode: r.locationCode,
        systemQty: r.systemQty,
        countedQty: r.countedQty,
        variance: r.countedQty - r.systemQty,
        variancePercent: r.systemQty !== 0 ? ((r.countedQty - r.systemQty) / r.systemQty) * 100 : 0,
        counterId: r.counterId || r.userId || null,
        countDate: r.countDate ? new Date(r.countDate) : new Date(),
        rawData: r
      })),
      skipDuplicates: true
    });

    processed += batch.length;
  }

  return processed;
}

export { DATA_TYPES, COLUMN_MAPPINGS, parseCSV, validateData };
