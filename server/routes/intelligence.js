/**
 * FlowLogic Intelligence Platform Routes
 *
 * Unified API for the AI Inventory Intelligence system:
 * - Data ingestion from WMS exports
 * - Inventory truth analysis
 * - Root cause investigation
 * - Action recommendations
 * - Executive reporting
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import sanitizeFilename from 'sanitize-filename';
import crypto from 'crypto';

const router = express.Router();

// Allowed MIME types and their magic bytes for verification
const ALLOWED_FILE_TYPES = {
  'text/csv': { extensions: ['.csv'], magicBytes: null }, // CSV has no magic bytes
  'application/json': { extensions: ['.json'], magicBytes: null },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extensions: ['.xlsx'],
    magicBytes: Buffer.from([0x50, 0x4B, 0x03, 0x04]) // ZIP/XLSX magic bytes
  },
  'application/vnd.ms-excel': {
    extensions: ['.xls'],
    magicBytes: Buffer.from([0xD0, 0xCF, 0x11, 0xE0]) // OLE compound document
  }
};

// File upload configuration with security
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Store uploads outside web root
    const uploadDir = process.env.UPLOAD_PATH || './uploads/ingestion';
    await fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize and generate secure filename
    const sanitized = sanitizeFilename(file.originalname);
    const ext = path.extname(sanitized).toLowerCase();
    const randomId = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();

    // Check extension
    if (!allowed.includes(ext)) {
      return cb(new Error(`File type ${ext} not allowed. Allowed: ${allowed.join(', ')}`), false);
    }

    cb(null, true);
  }
});

// Verify file magic bytes after upload
async function verifyFileType(filePath, expectedExt) {
  try {
    const buffer = Buffer.alloc(8);
    const fileHandle = await fs.open(filePath, 'r');
    await fileHandle.read(buffer, 0, 8, 0);
    await fileHandle.close();

    // Check magic bytes for binary files
    if (expectedExt === '.xlsx') {
      const xlsxMagic = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
      return buffer.slice(0, 4).equals(xlsxMagic);
    }
    if (expectedExt === '.xls') {
      const xlsMagic = Buffer.from([0xD0, 0xCF, 0x11, 0xE0]);
      return buffer.slice(0, 4).equals(xlsMagic);
    }
    // CSV and JSON are text files - verify they're valid text
    if (expectedExt === '.csv' || expectedExt === '.json') {
      const content = await fs.readFile(filePath, 'utf8');
      if (expectedExt === '.json') {
        JSON.parse(content); // Will throw if invalid JSON
      }
      return true;
    }
    return true;
  } catch {
    return false;
  }
}

// Column mappings for different WMS systems
const COLUMN_MAPPINGS = {
  manhattan: {
    inventory: {
      'SKU': 'sku', 'Location ID': 'locationCode', 'On Hand Qty': 'quantityOnHand',
      'Allocated Qty': 'quantityAllocated', 'Available Qty': 'quantityAvailable'
    }
  },
  sap: {
    inventory: {
      'MATNR': 'sku', 'LGPLA': 'locationCode', 'VERME': 'quantityOnHand'
    }
  },
  generic: {
    inventory: {
      'sku': 'sku', 'location': 'locationCode', 'quantity': 'quantityOnHand'
    }
  }
};

export default function createIntelligenceRoutes(prisma) {

  // ==========================================
  // DATA INGESTION
  // ==========================================

  /**
   * Upload file for data ingestion
   */
  router.post('/ingest/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Verify file type matches extension (prevent malicious file uploads)
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isValidFile = await verifyFileType(req.file.path, ext);
      if (!isValidFile) {
        // Delete the suspicious file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          error: 'Invalid file',
          message: 'File content does not match the expected format'
        });
      }

      const { dataType = 'inventory_snapshot', mappingType = 'generic' } = req.body;

      // Read and parse file
      const content = await fs.readFile(req.file.path, 'utf-8');
      let records;

      try {
        records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
      } catch (e) {
        return res.status(400).json({ error: 'Failed to parse CSV', details: e.message });
      }

      // Map columns
      const mapping = COLUMN_MAPPINGS[mappingType]?.inventory || COLUMN_MAPPINGS.generic.inventory;
      const mapped = records.map(record => {
        const result = {};
        for (const [source, target] of Object.entries(mapping)) {
          if (record[source] !== undefined) result[target] = record[source];
        }
        return result;
      });

      // Create ingestion record
      const ingestion = await prisma.dataIngestion.create({
        data: {
          filename: req.file.originalname,
          filePath: req.file.path,
          dataType,
          source: 'manual',
          mappingType,
          recordCount: mapped.length,
          status: 'PROCESSING'
        }
      });

      // Process records based on type
      let processed = 0;
      if (dataType === 'inventory_snapshot' && mapped.length > 0) {
        for (const batch of chunkArray(mapped, 500)) {
          await prisma.inventorySnapshot.createMany({
            data: batch.map(r => ({
              ingestionId: ingestion.id,
              sku: r.sku || 'UNKNOWN',
              locationCode: r.locationCode || 'UNKNOWN',
              quantityOnHand: parseFloat(r.quantityOnHand) || 0,
              quantityAllocated: parseFloat(r.quantityAllocated) || 0,
              quantityAvailable: parseFloat(r.quantityAvailable) || 0,
              snapshotDate: new Date(),
              rawData: r
            })),
            skipDuplicates: true
          });
          processed += batch.length;
        }
      }

      // Update ingestion status
      await prisma.dataIngestion.update({
        where: { id: ingestion.id },
        data: { status: 'COMPLETED', completedAt: new Date(), recordCount: processed }
      });

      res.json({
        success: true,
        ingestionId: ingestion.id,
        recordsProcessed: processed
      });
    } catch (error) {
      console.error('Ingestion error:', error);
      res.status(500).json({ error: 'Ingestion failed', details: error.message });
    }
  });

  /**
   * Get ingestion history
   */
  router.get('/ingest/history', async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const ingestions = await prisma.dataIngestion.findMany({
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit)
      });
      res.json(ingestions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // ==========================================
  // INVENTORY TRUTH ENGINE
  // ==========================================

  /**
   * Get truth dashboard summary
   */
  router.get('/truth/dashboard', async (req, res) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get discrepancy stats
      const discrepancies = await prisma.discrepancy.groupBy({
        by: ['severity', 'status'],
        _count: true,
        where: { createdAt: { gte: thirtyDaysAgo } }
      });

      const openCritical = discrepancies
        .filter(d => d.severity === 'critical' && d.status === 'OPEN')
        .reduce((sum, d) => sum + d._count, 0);

      const totalOpen = discrepancies
        .filter(d => d.status === 'OPEN')
        .reduce((sum, d) => sum + d._count, 0);

      // Get recent discrepancies
      const recent = await prisma.discrepancy.findMany({
        where: { status: 'OPEN' },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        take: 10
      });

      res.json({
        summary: {
          openDiscrepancies: totalOpen,
          criticalIssues: openCritical,
          period: '30 days'
        },
        discrepancyBreakdown: discrepancies,
        recentDiscrepancies: recent
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  });

  /**
   * Get all discrepancies
   */
  router.get('/truth/discrepancies', async (req, res) => {
    try {
      const { status = 'OPEN', severity, type, limit = 50 } = req.query;

      const where = {};
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (type) where.type = type;

      const discrepancies = await prisma.discrepancy.findMany({
        where,
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        take: parseInt(limit),
        include: { investigations: { take: 1, orderBy: { createdAt: 'desc' } } }
      });

      res.json(discrepancies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch discrepancies' });
    }
  });

  /**
   * Run inventory analysis
   */
  router.post('/truth/analyze', async (req, res) => {
    try {
      const findings = [];

      // 1. Find negative inventory
      const negatives = await prisma.inventorySnapshot.findMany({
        where: { quantityOnHand: { lt: 0 } },
        orderBy: { quantityOnHand: 'asc' },
        take: 100
      });

      for (const neg of negatives) {
        findings.push({
          type: 'negative_on_hand',
          severity: 'critical',
          sku: neg.sku,
          locationCode: neg.locationCode,
          variance: neg.quantityOnHand,
          description: `Negative on-hand: ${neg.quantityOnHand} at ${neg.locationCode}`
        });
      }

      // 2. Find cycle count variances
      const variances = await prisma.cycleCountSnapshot.findMany({
        where: {
          OR: [
            { variancePercent: { gt: 5 } },
            { variancePercent: { lt: -5 } },
            { variance: { gt: 10 } },
            { variance: { lt: -10 } }
          ]
        },
        orderBy: { variance: 'desc' },
        take: 100
      });

      for (const v of variances) {
        const severity = Math.abs(v.variancePercent) > 20 ? 'high' :
                        Math.abs(v.variancePercent) > 10 ? 'medium' : 'low';
        findings.push({
          type: 'cycle_count_variance',
          severity,
          sku: v.sku,
          locationCode: v.locationCode,
          expectedQty: v.systemQty,
          actualQty: v.countedQty,
          variance: v.variance,
          variancePercent: v.variancePercent,
          description: `Cycle count variance: ${v.variancePercent.toFixed(1)}%`
        });
      }

      // Create discrepancy records
      let created = 0;
      for (const finding of findings) {
        try {
          await prisma.discrepancy.create({
            data: {
              type: finding.type,
              severity: finding.severity,
              sku: finding.sku,
              locationCode: finding.locationCode,
              expectedQty: finding.expectedQty,
              actualQty: finding.actualQty,
              variance: finding.variance || 0,
              variancePercent: finding.variancePercent,
              description: finding.description,
              status: 'OPEN',
              detectedAt: new Date()
            }
          });
          created++;
        } catch (e) {
          // Skip duplicates
        }
      }

      res.json({
        analyzed: true,
        findingsCount: findings.length,
        discrepanciesCreated: created,
        findings: findings.slice(0, 20)
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // ==========================================
  // ROOT CAUSE ANALYSIS
  // ==========================================

  /**
   * Investigate a discrepancy
   */
  router.get('/root-cause/investigate/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const discrepancy = await prisma.discrepancy.findUnique({
        where: { id },
        include: { investigations: true, actions: true }
      });

      if (!discrepancy) {
        return res.status(404).json({ error: 'Discrepancy not found' });
      }

      // Get related data
      const timeWindow = 7 * 24 * 60 * 60 * 1000;
      const startDate = new Date(discrepancy.detectedAt.getTime() - timeWindow);

      const [transactions, adjustments, cycleCounts] = await Promise.all([
        prisma.transactionSnapshot.findMany({
          where: {
            sku: discrepancy.sku,
            transactionDate: { gte: startDate, lte: discrepancy.detectedAt }
          },
          orderBy: { transactionDate: 'desc' },
          take: 50
        }),
        prisma.adjustmentSnapshot.findMany({
          where: {
            sku: discrepancy.sku,
            locationCode: discrepancy.locationCode,
            adjustmentDate: { gte: startDate }
          },
          orderBy: { adjustmentDate: 'desc' }
        }),
        prisma.cycleCountSnapshot.findMany({
          where: {
            sku: discrepancy.sku,
            locationCode: discrepancy.locationCode,
            countDate: { gte: startDate }
          },
          orderBy: { countDate: 'desc' }
        })
      ]);

      // Generate possible causes
      const possibleCauses = [];

      if (adjustments.length > 3) {
        possibleCauses.push({
          category: 'process',
          description: `High adjustment frequency (${adjustments.length} in 7 days)`,
          confidence: 'medium'
        });
      }

      if (cycleCounts.every(c => c.variance < 0)) {
        possibleCauses.push({
          category: 'process',
          description: 'Consistent negative variances - possible unrecorded picks',
          confidence: 'high'
        });
      }

      res.json({
        discrepancy,
        relatedTransactions: transactions,
        relatedAdjustments: adjustments,
        relatedCycleCounts: cycleCounts,
        possibleCauses
      });
    } catch (error) {
      console.error('Investigation error:', error);
      res.status(500).json({ error: 'Investigation failed' });
    }
  });

  /**
   * Assign root cause
   */
  router.post('/root-cause/assign', async (req, res) => {
    try {
      const { discrepancyId, rootCause, category, notes } = req.body;

      const investigation = await prisma.investigation.create({
        data: {
          discrepancyId,
          rootCause,
          category,
          notes,
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      });

      await prisma.discrepancy.update({
        where: { id: discrepancyId },
        data: { rootCause, rootCauseCategory: category, status: 'INVESTIGATED' }
      });

      res.json(investigation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign root cause' });
    }
  });

  // ==========================================
  // ACTION ENGINE
  // ==========================================

  /**
   * Get action recommendations
   */
  router.get('/actions', async (req, res) => {
    try {
      const { status = 'PENDING', type, limit = 50 } = req.query;

      const where = { status };
      if (type) where.type = type;

      const actions = await prisma.actionRecommendation.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        take: parseInt(limit),
        include: { discrepancy: true }
      });

      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch actions' });
    }
  });

  /**
   * Generate action recommendations
   */
  router.post('/actions/generate', async (req, res) => {
    try {
      const openDiscrepancies = await prisma.discrepancy.findMany({
        where: { status: 'OPEN' },
        orderBy: { severity: 'asc' }
      });

      let created = 0;
      for (const disc of openDiscrepancies) {
        // Create cycle count action
        try {
          await prisma.actionRecommendation.create({
            data: {
              type: 'cycle_count',
              priority: disc.severity === 'critical' ? 1 : 2,
              discrepancyId: disc.id,
              sku: disc.sku,
              locationCode: disc.locationCode,
              description: `Verify ${disc.sku} at ${disc.locationCode}`,
              instructions: `Count inventory. System variance: ${disc.variance}`,
              status: 'PENDING'
            }
          });
          created++;
        } catch (e) {
          // Skip duplicates
        }

        // Critical issues need supervisor alert
        if (disc.severity === 'critical') {
          try {
            await prisma.actionRecommendation.create({
              data: {
                type: 'supervisor_alert',
                priority: 1,
                discrepancyId: disc.id,
                sku: disc.sku,
                locationCode: disc.locationCode,
                description: `URGENT: Critical issue - ${disc.type}`,
                instructions: disc.description,
                status: 'PENDING'
              }
            });
            created++;
          } catch (e) {}
        }
      }

      res.json({ generated: created });
    } catch (error) {
      res.status(500).json({ error: 'Action generation failed' });
    }
  });

  /**
   * Get cycle count list
   */
  router.get('/actions/cycle-count-list', async (req, res) => {
    try {
      const { maxTasks = 50 } = req.query;

      const tasks = await prisma.actionRecommendation.findMany({
        where: { type: 'cycle_count', status: 'PENDING' },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        take: parseInt(maxTasks)
      });

      res.json({
        generatedAt: new Date().toISOString(),
        taskCount: tasks.length,
        tasks: tasks.map((t, i) => ({
          sequence: i + 1,
          locationCode: t.locationCode,
          sku: t.sku,
          priority: t.priority === 1 ? 'URGENT' : t.priority === 2 ? 'HIGH' : 'MEDIUM',
          instructions: t.instructions
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate list' });
    }
  });

  /**
   * Update action status
   */
  router.put('/actions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, completedBy } = req.body;

      const action = await prisma.actionRecommendation.update({
        where: { id },
        data: {
          status,
          notes,
          completedBy,
          completedAt: status === 'COMPLETED' ? new Date() : null
        }
      });

      res.json(action);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update action' });
    }
  });

  // ==========================================
  // EXECUTIVE REPORTS
  // ==========================================

  /**
   * Get executive brief
   */
  router.get('/reports/executive-brief', async (req, res) => {
    try {
      const { period = 'week' } = req.query;
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get metrics
      const [discrepancies, adjustments, resolved] = await Promise.all([
        prisma.discrepancy.findMany({
          where: { createdAt: { gte: dateFrom } }
        }),
        prisma.adjustmentSnapshot.aggregate({
          where: { adjustmentDate: { gte: dateFrom } },
          _sum: { adjustmentQty: true },
          _count: true
        }),
        prisma.discrepancy.count({
          where: { status: 'RESOLVED', resolvedAt: { gte: dateFrom } }
        })
      ]);

      const critical = discrepancies.filter(d => d.severity === 'critical').length;
      const open = discrepancies.filter(d => d.status === 'OPEN').length;

      res.json({
        reportDate: new Date().toISOString(),
        period: { from: dateFrom, to: new Date(), days },

        headline: critical > 0
          ? `ALERT: ${critical} critical inventory issues require attention`
          : `Inventory operations stable - ${open} open issues`,

        metrics: {
          totalDiscrepancies: discrepancies.length,
          criticalIssues: critical,
          openIssues: open,
          resolved,
          totalAdjustments: adjustments._count,
          adjustmentVolume: Math.abs(adjustments._sum.adjustmentQty || 0)
        },

        topIssues: discrepancies
          .filter(d => d.status === 'OPEN')
          .sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          })
          .slice(0, 5)
          .map(d => ({
            type: d.type,
            severity: d.severity,
            sku: d.sku,
            location: d.locationCode,
            description: d.description
          })),

        recommendations: generateRecommendations(critical, open, adjustments._count)
      });
    } catch (error) {
      console.error('Executive brief error:', error);
      res.status(500).json({ error: 'Failed to generate brief' });
    }
  });

  /**
   * Get weekly summary
   */
  router.get('/reports/weekly-summary', async (req, res) => {
    try {
      const weekStart = getWeekStart();
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const discrepancies = await prisma.discrepancy.findMany({
        where: { createdAt: { gte: weekStart, lt: weekEnd } }
      });

      const byType = {};
      const bySeverity = {};
      for (const d of discrepancies) {
        byType[d.type] = (byType[d.type] || 0) + 1;
        bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
      }

      res.json({
        week: { start: weekStart, end: weekEnd },
        summary: {
          total: discrepancies.length,
          byType,
          bySeverity
        },
        narrative: `This week: ${discrepancies.length} discrepancies identified. ` +
          `${bySeverity.critical || 0} critical, ${bySeverity.high || 0} high priority.`
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  return router;
}

// Helper functions
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function generateRecommendations(critical, open, adjustmentCount) {
  const recs = [];

  if (critical > 0) {
    recs.push({
      priority: 'URGENT',
      action: 'Address critical discrepancies immediately',
      rationale: `${critical} critical issues identified`
    });
  }

  if (open > 10) {
    recs.push({
      priority: 'HIGH',
      action: 'Schedule additional cycle counting resources',
      rationale: `${open} open discrepancies pending investigation`
    });
  }

  if (adjustmentCount > 100) {
    recs.push({
      priority: 'MEDIUM',
      action: 'Review adjustment patterns for root causes',
      rationale: `${adjustmentCount} adjustments this period`
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: 'LOW',
      action: 'Maintain current monitoring practices',
      rationale: 'No immediate issues identified'
    });
  }

  return recs;
}
