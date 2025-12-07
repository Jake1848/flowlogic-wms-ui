// Order Routes - FlowLogic WMS
import express from 'express';
import {
  validateRequired,
  validateUUID,
  validatePagination,
  validateEnum,
  validateDateRange,
  sanitizeFields,
  wmsValidators,
} from '../middleware/validation.js';

const router = express.Router();

export default function orderRoutes(prisma) {
  // Get all orders with filters
  router.get('/', validatePagination, validateDateRange('dateFrom', 'dateTo'), async (req, res) => {
    try {
      const {
        warehouseId,
        customerId,
        status,
        type,
        priority,
        search,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = req.query;

      const where = {};

      if (warehouseId) where.warehouseId = warehouseId;
      if (customerId) where.customerId = customerId;
      if (status) where.status = status;
      if (type) where.type = type;
      if (priority) where.priority = parseInt(priority);

      if (dateFrom || dateTo) {
        where.orderDate = {};
        if (dateFrom) where.orderDate.gte = new Date(dateFrom);
        if (dateTo) where.orderDate.lte = new Date(dateTo);
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { externalOrderId: { contains: search, mode: 'insensitive' } },
          { customerPO: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            customer: {
              select: { id: true, code: true, name: true },
            },
            carrier: {
              select: { id: true, code: true, name: true },
            },
            wave: {
              select: { id: true, waveNumber: true, status: true },
            },
            _count: { select: { lines: true, shipments: true } },
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: [{ priority: 'asc' }, { requiredDate: 'asc' }],
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Get order summary/dashboard
  router.get('/summary', async (req, res) => {
    try {
      const { warehouseId } = req.query;
      const where = warehouseId ? { warehouseId } : {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalOrders,
        statusCounts,
        ordersToday,
        lateOrders,
        priorityOrders,
      ] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.order.count({
          where: { ...where, orderDate: { gte: today } },
        }),
        prisma.order.count({
          where: {
            ...where,
            requiredDate: { lt: new Date() },
            status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
          },
        }),
        prisma.order.count({
          where: {
            ...where,
            priority: { lte: 3 },
            status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
          },
        }),
      ]);

      res.json({
        totalOrders,
        ordersToday,
        lateOrders,
        priorityOrders,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error('Get order summary error:', error);
      res.status(500).json({ error: 'Failed to fetch order summary' });
    }
  });

  // Get late orders
  router.get('/late', async (req, res) => {
    try {
      const { warehouseId } = req.query;

      const lateOrders = await prisma.order.findMany({
        where: {
          warehouseId: warehouseId || undefined,
          requiredDate: { lt: new Date() },
          status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
        },
        include: {
          customer: { select: { name: true } },
          carrier: { select: { name: true } },
        },
        orderBy: { requiredDate: 'asc' },
        take: 50,
      });

      res.json(lateOrders);
    } catch (error) {
      console.error('Get late orders error:', error);
      res.status(500).json({ error: 'Failed to fetch late orders' });
    }
  });

  // Get single order with details
  router.get('/:id', validateUUID('id'), async (req, res) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          customer: true,
          carrier: true,
          wave: true,
          warehouse: { select: { code: true, name: true } },
          createdBy: { select: { fullName: true } },
          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  upc: true,
                  weight: true,
                },
              },
            },
            orderBy: { lineNumber: 'asc' },
          },
          shipments: {
            include: {
              carrier: { select: { name: true } },
              service: { select: { name: true } },
            },
          },
          tasks: {
            select: {
              id: true,
              taskNumber: true,
              type: true,
              status: true,
              assignedTo: { select: { fullName: true } },
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // Create new order
  router.post('/',
    validateRequired(['warehouseId', 'customerId']),
    sanitizeFields('notes', 'customerPO', 'specialInstructions'),
    async (req, res) => {
    try {
      const orderData = req.body;

      // Generate order number
      const lastOrder = await prisma.order.findFirst({
        where: { warehouseId: orderData.warehouseId },
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });

      const year = new Date().getFullYear();
      let nextNum = 1;
      if (lastOrder && lastOrder.orderNumber.includes(year.toString())) {
        const parts = lastOrder.orderNumber.split('-');
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }

      const orderNumber = `SO-${year}-${nextNum.toString().padStart(4, '0')}`;

      const order = await prisma.order.create({
        data: {
          ...orderData,
          orderNumber,
          totalLines: orderData.lines?.length || 0,
          totalUnits: orderData.lines?.reduce((sum, l) => sum + l.quantityOrdered, 0) || 0,
          lines: orderData.lines
            ? {
                create: orderData.lines.map((line, idx) => ({
                  ...line,
                  lineNumber: idx + 1,
                  lineTotal: line.quantityOrdered * (line.unitPrice || 0),
                })),
              }
            : undefined,
        },
        include: {
          lines: true,
          customer: { select: { name: true } },
        },
      });

      res.status(201).json(order);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Update order
  router.put('/:id',
    validateUUID('id'),
    sanitizeFields('notes', 'customerPO', 'specialInstructions'),
    async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Don't allow status changes through general update
      delete updateData.status;

      const order = await prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          lines: true,
          customer: { select: { name: true } },
        },
      });

      res.json(order);
    } catch (error) {
      console.error('Update order error:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  // Update order status
  router.patch('/:id/status',
    validateUUID('id'),
    validateRequired(['status']),
    validateEnum('status', wmsValidators.orderStatus),
    async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await prisma.order.update({
        where: { id },
        data: {
          status,
          ...(status === 'SHIPPED' && { shippedDate: new Date() }),
          ...(status === 'DELIVERED' && { deliveredDate: new Date() }),
        },
      });

      res.json(order);
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Allocate order
  router.post('/:id/allocate', async (req, res) => {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          lines: {
            include: { product: true },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'NEW' && order.status !== 'VALIDATED') {
        return res.status(400).json({ error: 'Order cannot be allocated in current status' });
      }

      // Use transaction for atomic inventory allocation
      const allocationResults = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const line of order.lines) {
          // Find available inventory
          const inventory = await tx.inventory.findMany({
            where: {
              warehouseId: order.warehouseId,
              productId: line.productId,
              quantityAvailable: { gt: 0 },
              status: 'AVAILABLE',
            },
            orderBy: [
              { expirationDate: 'asc' },
              { createdAt: 'asc' },
            ],
          });

          let remaining = line.quantityOrdered - line.quantityAllocated;
          let allocated = 0;

          for (const inv of inventory) {
            if (remaining <= 0) break;

            const toAllocate = Math.min(remaining, inv.quantityAvailable);

            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                quantityAllocated: { increment: toAllocate },
                quantityAvailable: { decrement: toAllocate },
              },
            });

            allocated += toAllocate;
            remaining -= toAllocate;
          }

          await tx.orderLine.update({
            where: { id: line.id },
            data: {
              quantityAllocated: { increment: allocated },
              status: allocated >= line.quantityOrdered ? 'ALLOCATED' : 'PARTIAL_ALLOCATED',
            },
          });

          results.push({
            lineNumber: line.lineNumber,
            productSku: line.product.sku,
            requested: line.quantityOrdered,
            allocated,
            shortage: remaining,
          });
        }

        // Update order status
        const fullyAllocated = results.every(r => r.shortage === 0);
        await tx.order.update({
          where: { id },
          data: {
            status: fullyAllocated ? 'ALLOCATED' : 'BACKORDERED',
          },
        });

        return { results, fullyAllocated };
      });

      res.json({
        success: true,
        fullyAllocated: allocationResults.fullyAllocated,
        allocations: allocationResults.results,
      });
    } catch (error) {
      console.error('Allocate order error:', error);
      res.status(500).json({ error: 'Failed to allocate order' });
    }
  });

  // Cancel order
  router.post('/:id/cancel', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await prisma.order.findUnique({
        where: { id },
        include: { lines: true },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
        return res.status(400).json({ error: 'Cannot cancel shipped/delivered order' });
      }

      // Use transaction for atomic cancellation and inventory release
      await prisma.$transaction(async (tx) => {
        // Deallocate inventory for each line
        for (const line of order.lines) {
          if (line.quantityAllocated > 0) {
            // Find allocations and release them
            const inventories = await tx.inventory.findMany({
              where: {
                productId: line.productId,
                warehouseId: order.warehouseId,
                quantityAllocated: { gt: 0 },
              },
            });

            let toRelease = line.quantityAllocated;
            for (const inv of inventories) {
              if (toRelease <= 0) break;
              const release = Math.min(toRelease, inv.quantityAllocated);
              await tx.inventory.update({
                where: { id: inv.id },
                data: {
                  quantityAllocated: { decrement: release },
                  quantityAvailable: { increment: release },
                },
              });
              toRelease -= release;
            }
          }
        }

        // Update order lines to cancelled
        await tx.orderLine.updateMany({
          where: { orderId: id },
          data: {
            status: 'CANCELLED',
            quantityCancelled: { increment: 1 },
          },
        });

        // Update order status
        await tx.order.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            notes: reason ? `Cancelled: ${reason}` : 'Order cancelled',
          },
        });
      });

      res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  });

  // Get order lines
  router.get('/:id/lines', async (req, res) => {
    try {
      const lines = await prisma.orderLine.findMany({
        where: { orderId: req.params.id },
        include: {
          product: {
            select: {
              sku: true,
              name: true,
              upc: true,
              weight: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { lineNumber: 'asc' },
      });

      res.json(lines);
    } catch (error) {
      console.error('Get order lines error:', error);
      res.status(500).json({ error: 'Failed to fetch order lines' });
    }
  });

  return router;
}
