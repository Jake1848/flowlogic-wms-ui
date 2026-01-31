// Alert Routes - FlowLogic WMS
import express from 'express';
import {
  validateUUID,
  validatePagination,
  validateRequired,
  validateEnum,
  validateArray,
  wmsValidators,
} from '../middleware/validation.js';
import notificationService from '../services/notification.js';

const router = express.Router();

// Helper to compute status from isRead/isResolved
function computeAlertStatus(alert) {
  if (alert.isResolved) return 'RESOLVED';
  if (alert.isRead) return 'ACKNOWLEDGED';
  return 'NEW';
}

// Transform alert to include status field for frontend compatibility
function transformAlert(alert) {
  return {
    ...alert,
    status: computeAlertStatus(alert)
  };
}

export default function alertRoutes(prisma) {
  // Initialize notification service with prisma
  notificationService.setPrisma(prisma);
  // Get all alerts with filters
  router.get('/', validatePagination, async (req, res) => {
    try {
      const {
        warehouseId,
        type,
        severity,
        isRead,
        isResolved,
        page = 1,
        limit = 50,
      } = req.query;

      const where = {};

      if (warehouseId) where.warehouseId = warehouseId;
      if (type) where.type = type;
      if (severity) where.severity = severity;
      if (isRead !== undefined) where.isRead = isRead === 'true';
      if (isResolved !== undefined) where.isResolved = isResolved === 'true';

      const [alerts, total] = await Promise.all([
        prisma.alert.findMany({
          where,
          include: {
            warehouse: { select: { code: true, name: true } },
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.alert.count({ where }),
      ]);

      res.json({
        data: alerts.map(transformAlert),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Get alert summary
  router.get('/summary', async (req, res) => {
    try {
      const { warehouseId } = req.query;
      const where = warehouseId ? { warehouseId } : {};

      const [
        totalAlerts,
        unreadCount,
        severityCounts,
        typeCounts,
        unresolvedCount,
      ] = await Promise.all([
        prisma.alert.count({ where }),
        prisma.alert.count({ where: { ...where, isRead: false } }),
        prisma.alert.groupBy({
          by: ['severity'],
          where: { ...where, isResolved: false },
          _count: true,
        }),
        prisma.alert.groupBy({
          by: ['type'],
          where: { ...where, isResolved: false },
          _count: true,
        }),
        prisma.alert.count({ where: { ...where, isResolved: false } }),
      ]);

      res.json({
        totalAlerts,
        unreadCount,
        unresolvedCount,
        severityCounts: severityCounts.reduce((acc, item) => {
          acc[item.severity] = item._count;
          return acc;
        }, {}),
        typeCounts: typeCounts.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error('Get alert summary error:', error);
      res.status(500).json({ error: 'Failed to fetch alert summary' });
    }
  });

  // Get alert counts - for frontend useAlertCounts hook
  router.get('/counts', async (req, res) => {
    try {
      const { warehouseId } = req.query;
      const where = warehouseId ? { warehouseId } : {};

      const [
        total,
        severityCounts,
        typeCounts,
        criticalCount,
        unacknowledgedCount,
      ] = await Promise.all([
        prisma.alert.count({ where: { ...where, isResolved: false } }),
        prisma.alert.groupBy({
          by: ['severity'],
          where: { ...where, isResolved: false },
          _count: true,
        }),
        prisma.alert.groupBy({
          by: ['type'],
          where: { ...where, isResolved: false },
          _count: true,
        }),
        prisma.alert.count({
          where: { ...where, severity: { in: ['CRITICAL', 'EMERGENCY'] }, isResolved: false }
        }),
        prisma.alert.count({ where: { ...where, isRead: false } }),
      ]);

      res.json({
        total,
        bySeverity: severityCounts.reduce((acc, item) => {
          acc[item.severity] = item._count;
          return acc;
        }, {}),
        byType: typeCounts.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {}),
        critical: criticalCount,
        unacknowledged: unacknowledgedCount,
      });
    } catch (error) {
      console.error('Get alert counts error:', error);
      res.status(500).json({ error: 'Failed to fetch alert counts' });
    }
  });

  // Get active alerts - for frontend useActiveAlerts hook
  router.get('/active', async (req, res) => {
    try {
      const { warehouseId, limit = 20 } = req.query;

      const alerts = await prisma.alert.findMany({
        where: {
          isResolved: false,
          ...(warehouseId && { warehouseId }),
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: parseInt(limit),
      });

      res.json(alerts.map(transformAlert));
    } catch (error) {
      console.error('Get active alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch active alerts' });
    }
  });

  // Get unread alerts
  router.get('/unread', async (req, res) => {
    try {
      const { warehouseId, limit = 20 } = req.query;

      const alerts = await prisma.alert.findMany({
        where: {
          isRead: false,
          ...(warehouseId && { warehouseId }),
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: parseInt(limit),
      });

      res.json(alerts.map(transformAlert));
    } catch (error) {
      console.error('Get unread alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch unread alerts' });
    }
  });

  // Get critical alerts
  router.get('/critical', async (req, res) => {
    try {
      const { warehouseId } = req.query;

      const alerts = await prisma.alert.findMany({
        where: {
          severity: { in: ['CRITICAL', 'EMERGENCY'] },
          isResolved: false,
          ...(warehouseId && { warehouseId }),
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.json(alerts.map(transformAlert));
    } catch (error) {
      console.error('Get critical alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch critical alerts' });
    }
  });

  // Get single alert
  router.get('/:id', validateUUID('id'), async (req, res) => {
    try {
      const alert = await prisma.alert.findUnique({
        where: { id: req.params.id },
        include: {
          warehouse: true,
        },
      });

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      res.json(transformAlert(alert));
    } catch (error) {
      console.error('Get alert error:', error);
      res.status(500).json({ error: 'Failed to fetch alert' });
    }
  });

  // Create alert
  router.post('/',
    validateRequired(['type', 'severity', 'title', 'message']),
    validateEnum('severity', wmsValidators.alertSeverity),
    async (req, res) => {
    try {
      const alertData = req.body;

      const alert = await prisma.alert.create({
        data: alertData,
      });

      // Send email notifications asynchronously (don't block response)
      if (alertData.warehouseId && ['CRITICAL', 'HIGH', 'EMERGENCY'].includes(alertData.severity)) {
        notificationService.notifyAlert(alert, alertData.warehouseId).catch(err => {
          console.error('Failed to send alert notification:', err);
        });
      }

      res.status(201).json(alert);
    } catch (error) {
      console.error('Create alert error:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  // Mark alert as read
  router.patch('/:id/read', validateUUID('id'), async (req, res) => {
    try {
      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: { isRead: true },
      });

      res.json(alert);
    } catch (error) {
      console.error('Mark alert read error:', error);
      res.status(500).json({ error: 'Failed to mark alert as read' });
    }
  });

  // Mark multiple alerts as read
  router.patch('/bulk-read',
    validateRequired(['alertIds']),
    validateArray('alertIds', { minLength: 1, maxLength: 100 }),
    async (req, res) => {
    try {
      const { alertIds } = req.body;

      await prisma.alert.updateMany({
        where: { id: { in: alertIds } },
        data: { isRead: true },
      });

      res.json({ success: true, count: alertIds.length });
    } catch (error) {
      console.error('Bulk mark read error:', error);
      res.status(500).json({ error: 'Failed to mark alerts as read' });
    }
  });

  // Mark all alerts as read
  router.patch('/mark-all-read', async (req, res) => {
    try {
      const { warehouseId } = req.body;

      const result = await prisma.alert.updateMany({
        where: {
          isRead: false,
          ...(warehouseId && { warehouseId }),
        },
        data: { isRead: true },
      });

      res.json({ success: true, count: result.count });
    } catch (error) {
      console.error('Mark all read error:', error);
      res.status(500).json({ error: 'Failed to mark all alerts as read' });
    }
  });

  // Acknowledge alert
  router.post('/:id/acknowledge', validateUUID('id'), async (req, res) => {
    try {
      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: {
          isRead: true,
        },
      });

      res.json(transformAlert(alert));
    } catch (error) {
      console.error('Acknowledge alert error:', error);
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  });

  // Resolve alert
  router.post('/:id/resolve', validateUUID('id'), async (req, res) => {
    try {
      const { resolution } = req.body;

      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: {
          isResolved: true,
          isRead: true,
          resolvedAt: new Date(),
        },
      });

      res.json(transformAlert(alert));
    } catch (error) {
      console.error('Resolve alert error:', error);
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  });

  // Resolve alert (PATCH variant for backwards compat)
  router.patch('/:id/resolve', validateUUID('id'), async (req, res) => {
    try {
      const { userId, notes } = req.body;

      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: {
          isResolved: true,
          isRead: true,
          resolvedAt: new Date(),
          resolvedBy: userId,
        },
      });

      res.json(transformAlert(alert));
    } catch (error) {
      console.error('Resolve alert error:', error);
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  });

  // Dismiss alert
  router.post('/:id/dismiss', validateUUID('id'), async (req, res) => {
    try {
      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: {
          isResolved: true,
          isRead: true,
          resolvedAt: new Date(),
        },
      });

      res.json(transformAlert(alert));
    } catch (error) {
      console.error('Dismiss alert error:', error);
      res.status(500).json({ error: 'Failed to dismiss alert' });
    }
  });

  // Delete old resolved alerts
  router.delete('/cleanup', async (req, res) => {
    try {
      const { daysOld = 30 } = req.query;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

      const result = await prisma.alert.deleteMany({
        where: {
          isResolved: true,
          resolvedAt: { lt: cutoffDate },
        },
      });

      res.json({ success: true, deleted: result.count });
    } catch (error) {
      console.error('Cleanup alerts error:', error);
      res.status(500).json({ error: 'Failed to cleanup alerts' });
    }
  });

  // Generate system alerts based on current data - AI Intelligence Platform
  router.post('/generate', async (req, res) => {
    try {
      const { warehouseId } = req.body;
      const generatedAlerts = [];

      // Check for critical discrepancies without alerts
      const criticalDiscrepancies = await prisma.discrepancy.findMany({
        where: {
          severity: { in: ['critical', 'high'] },
          status: 'OPEN',
        },
        take: 50,
      });

      for (const discrepancy of criticalDiscrepancies) {
        const existing = await prisma.alert.findFirst({
          where: {
            type: 'INVENTORY',
            entityType: 'Discrepancy',
            entityId: discrepancy.id,
            isResolved: false,
          },
        });

        if (!existing) {
          const alert = await prisma.alert.create({
            data: {
              type: 'INVENTORY',
              severity: discrepancy.severity === 'critical' ? 'CRITICAL' : 'WARNING',
              title: `Inventory Discrepancy: ${discrepancy.sku || 'Multiple SKUs'}`,
              message: discrepancy.description || `Variance of ${discrepancy.variance} units detected at ${discrepancy.locationCode}`,
              warehouseId: warehouseId || null,
              entityType: 'Discrepancy',
              entityId: discrepancy.id,
              suggestedAction: 'Investigate root cause and reconcile inventory',
              aiConfidence: 0.92,
            },
          });
          generatedAlerts.push(alert);
        }
      }

      // Check for high-value adjustments in recent snapshots
      const recentAdjustments = await prisma.adjustmentSnapshot.findMany({
        where: {
          adjustmentDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          adjustmentQty: { not: 0 },
        },
        orderBy: { adjustmentQty: 'desc' },
        take: 20,
      });

      for (const adjustment of recentAdjustments) {
        if (Math.abs(adjustment.adjustmentQty) >= 50) {
          const existing = await prisma.alert.findFirst({
            where: {
              type: 'INVENTORY',
              entityType: 'Adjustment',
              entityId: adjustment.id,
              isResolved: false,
            },
          });

          if (!existing) {
            const alert = await prisma.alert.create({
              data: {
                type: 'INVENTORY',
                severity: Math.abs(adjustment.adjustmentQty) >= 100 ? 'WARNING' : 'INFO',
                title: `Large Adjustment: ${adjustment.sku}`,
                message: `Adjustment of ${adjustment.adjustmentQty} units at ${adjustment.locationCode}. Reason: ${adjustment.reason || 'Not specified'}`,
                warehouseId: warehouseId || null,
                entityType: 'Adjustment',
                entityId: adjustment.id,
                suggestedAction: 'Review adjustment reason and verify inventory accuracy',
                aiConfidence: 0.88,
              },
            });
            generatedAlerts.push(alert);
          }
        }
      }

      // Check for pending high-priority action recommendations
      const pendingActions = await prisma.actionRecommendation.findMany({
        where: {
          status: 'PENDING',
          priority: { lte: 2 }, // Priority 1 and 2 (high priority)
        },
        take: 20,
      });

      for (const action of pendingActions) {
        const existing = await prisma.alert.findFirst({
          where: {
            type: 'SYSTEM',
            entityType: 'ActionRecommendation',
            entityId: action.id,
            isResolved: false,
          },
        });

        if (!existing) {
          const alert = await prisma.alert.create({
            data: {
              type: 'SYSTEM',
              severity: action.priority === 1 ? 'CRITICAL' : 'WARNING',
              title: `Action Required: ${action.actionType}`,
              message: action.description,
              warehouseId: warehouseId || null,
              entityType: 'ActionRecommendation',
              entityId: action.id,
              suggestedAction: action.suggestedAction || 'Review and execute recommended action',
              aiConfidence: action.confidence || 0.85,
            },
          });
          generatedAlerts.push(alert);
        }
      }

      res.json({
        success: true,
        generated: generatedAlerts.length,
        alerts: generatedAlerts,
      });
    } catch (error) {
      console.error('Generate alerts error:', error);
      res.status(500).json({ error: 'Failed to generate alerts' });
    }
  });

  return router;
}
