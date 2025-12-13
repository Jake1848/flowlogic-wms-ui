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

const router = express.Router();

export default function alertRoutes(prisma) {
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
        data: alerts,
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

      res.json(alerts);
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

      res.json(alerts);
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

      res.json(alert);
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

  // Resolve alert
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

      res.json(alert);
    } catch (error) {
      console.error('Resolve alert error:', error);
      res.status(500).json({ error: 'Failed to resolve alert' });
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

  // Generate system alerts based on current data
  router.post('/generate', async (req, res) => {
    try {
      const { warehouseId } = req.body;
      const generatedAlerts = [];

      // Check for low stock
      const lowStockProducts = await prisma.product.findMany({
        where: {
          reorderPoint: { not: null },
          inventory: {
            some: {
              warehouseId: warehouseId || undefined,
            },
          },
        },
        include: {
          inventory: {
            where: warehouseId ? { warehouseId } : undefined,
          },
        },
      });

      for (const product of lowStockProducts) {
        const totalQty = product.inventory.reduce(
          (sum, inv) => sum + inv.quantityOnHand,
          0
        );

        if (totalQty < product.reorderPoint) {
          // Check if alert already exists
          const existing = await prisma.alert.findFirst({
            where: {
              type: 'LOW_STOCK',
              entityType: 'Product',
              entityId: product.id,
              isResolved: false,
            },
          });

          if (!existing) {
            const alert = await prisma.alert.create({
              data: {
                type: 'LOW_STOCK',
                severity: totalQty < product.reorderPoint / 2 ? 'CRITICAL' : 'WARNING',
                title: `Low Stock: ${product.sku}`,
                message: `Product ${product.name} is below reorder point. Current: ${totalQty}, Reorder Point: ${product.reorderPoint}`,
                warehouseId: warehouseId || null,
                entityType: 'Product',
                entityId: product.id,
                suggestedAction: `Create purchase order for ${product.reorderQty || product.reorderPoint} units`,
                aiConfidence: 0.95,
              },
            });
            generatedAlerts.push(alert);
          }
        }
      }

      // Check for late orders
      const lateOrders = await prisma.order.findMany({
        where: {
          requiredDate: { lt: new Date() },
          status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
          warehouseId: warehouseId || undefined,
        },
      });

      for (const order of lateOrders) {
        const existing = await prisma.alert.findFirst({
          where: {
            type: 'ORDER_LATE',
            entityType: 'Order',
            entityId: order.id,
            isResolved: false,
          },
        });

        if (!existing) {
          const daysLate = Math.ceil(
            (Date.now() - order.requiredDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const alert = await prisma.alert.create({
            data: {
              type: 'ORDER_LATE',
              severity: daysLate > 2 ? 'CRITICAL' : 'WARNING',
              title: `Late Order: ${order.orderNumber}`,
              message: `Order ${order.orderNumber} is ${daysLate} day(s) past required date. Current status: ${order.status}`,
              warehouseId: order.warehouseId,
              entityType: 'Order',
              entityId: order.id,
              suggestedAction: 'Prioritize this order and expedite fulfillment',
              aiConfidence: 0.98,
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
