// Task Routes - FlowLogic WMS
import express from 'express';

const router = express.Router();

export default function taskRoutes(prisma) {
  // Get all tasks with filters
  router.get('/', async (req, res) => {
    try {
      const {
        warehouseId,
        type,
        status,
        assignedToId,
        priority,
        page = 1,
        limit = 50,
      } = req.query;

      const where = {};

      if (warehouseId) where.warehouseId = warehouseId;
      if (type) where.type = type;
      if (status) where.status = status;
      if (assignedToId) where.assignedToId = assignedToId;
      if (priority) where.priority = { lte: parseInt(priority) };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            assignedTo: { select: { id: true, fullName: true, username: true } },
            order: { select: { orderNumber: true, customer: { select: { name: true } } } },
            wave: { select: { waveNumber: true } },
            receipt: { select: { receiptNumber: true } },
            _count: { select: { details: true } },
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        }),
        prisma.task.count({ where }),
      ]);

      res.json({
        data: tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Get task summary/dashboard
  router.get('/summary', async (req, res) => {
    try {
      const { warehouseId } = req.query;
      const where = warehouseId ? { warehouseId } : {};

      const [
        totalTasks,
        statusCounts,
        typeCounts,
        unassignedTasks,
        overdueTasks,
      ] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.task.groupBy({
          by: ['type'],
          where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          _count: true,
        }),
        prisma.task.count({
          where: {
            ...where,
            assignedToId: null,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
        }),
        prisma.task.count({
          where: {
            ...where,
            plannedStartTime: { lt: new Date() },
            status: { notIn: ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'] },
          },
        }),
      ]);

      res.json({
        totalTasks,
        unassignedTasks,
        overdueTasks,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        typeCounts: typeCounts.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error('Get task summary error:', error);
      res.status(500).json({ error: 'Failed to fetch task summary' });
    }
  });

  // Get single task with details
  router.get('/:id', async (req, res) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.id },
        include: {
          warehouse: { select: { code: true, name: true } },
          assignedTo: { select: { id: true, fullName: true, username: true } },
          createdBy: { select: { fullName: true } },
          order: {
            include: {
              customer: { select: { name: true } },
            },
          },
          wave: true,
          receipt: {
            include: {
              vendor: { select: { name: true } },
            },
          },
          details: {
            include: {
              fromLocation: { select: { code: true } },
              orderLine: {
                include: {
                  product: { select: { sku: true, name: true } },
                },
              },
              receiptLine: {
                include: {
                  product: { select: { sku: true, name: true } },
                },
              },
            },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // Create task
  router.post('/', async (req, res) => {
    try {
      const taskData = req.body;

      // Generate task number
      const lastTask = await prisma.task.findFirst({
        where: { warehouseId: taskData.warehouseId },
        orderBy: { createdAt: 'desc' },
        select: { taskNumber: true },
      });

      let nextNum = 1;
      if (lastTask) {
        const parts = lastTask.taskNumber.split('-');
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }

      const taskNumber = `TSK-${taskData.type.substring(0, 3)}-${nextNum.toString().padStart(6, '0')}`;

      const task = await prisma.task.create({
        data: {
          ...taskData,
          taskNumber,
          totalLines: taskData.details?.length || 0,
          totalUnits: taskData.details?.reduce((sum, d) => sum + d.quantityRequired, 0) || 0,
          details: taskData.details
            ? {
                create: taskData.details.map((detail, idx) => ({
                  ...detail,
                  lineNumber: idx + 1,
                })),
              }
            : undefined,
        },
        include: {
          assignedTo: { select: { fullName: true } },
          details: true,
        },
      });

      res.status(201).json(task);
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Assign task to user
  router.patch('/:id/assign', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const task = await prisma.task.update({
        where: { id },
        data: {
          assignedToId: userId,
          assignedAt: new Date(),
          status: 'ASSIGNED',
        },
        include: {
          assignedTo: { select: { fullName: true, username: true } },
        },
      });

      res.json(task);
    } catch (error) {
      console.error('Assign task error:', error);
      res.status(500).json({ error: 'Failed to assign task' });
    }
  });

  // Start task
  router.patch('/:id/start', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const task = await prisma.task.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          ...(userId && !task?.assignedToId && {
            assignedToId: userId,
            assignedAt: new Date(),
          }),
        },
      });

      // Create labor entry
      if (userId) {
        await prisma.laborEntry.create({
          data: {
            userId,
            warehouseId: task.warehouseId,
            taskId: id,
            activityType: task.type,
            startTime: new Date(),
          },
        });
      }

      res.json(task);
    } catch (error) {
      console.error('Start task error:', error);
      res.status(500).json({ error: 'Failed to start task' });
    }
  });

  // Complete task detail line
  router.patch('/:id/details/:detailId/complete', async (req, res) => {
    try {
      const { id, detailId } = req.params;
      const { quantityCompleted, notes } = req.body;

      const detail = await prisma.taskDetail.update({
        where: { id: detailId },
        data: {
          quantityCompleted,
          status: 'COMPLETED',
          completedAt: new Date(),
          notes,
        },
      });

      // Update task counts
      const completedDetails = await prisma.taskDetail.count({
        where: { taskId: id, status: 'COMPLETED' },
      });

      const totalUnitsCompleted = await prisma.taskDetail.aggregate({
        where: { taskId: id },
        _sum: { quantityCompleted: true },
      });

      await prisma.task.update({
        where: { id },
        data: {
          completedLines: completedDetails,
          completedUnits: totalUnitsCompleted._sum.quantityCompleted || 0,
        },
      });

      res.json(detail);
    } catch (error) {
      console.error('Complete task detail error:', error);
      res.status(500).json({ error: 'Failed to complete task detail' });
    }
  });

  // Complete task
  router.patch('/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const task = await prisma.task.findUnique({
        where: { id },
        include: { details: true },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const startedAt = task.startedAt || new Date();
      const completedAt = new Date();
      const actualMinutes = Math.round(
        (completedAt.getTime() - startedAt.getTime()) / 60000
      );

      // Update task
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt,
          actualMinutes,
          completedLines: task.details.length,
          completedUnits: task.details.reduce((sum, d) => sum + d.quantityRequired, 0),
        },
      });

      // Complete labor entry
      if (userId) {
        const laborEntry = await prisma.laborEntry.findFirst({
          where: { taskId: id, userId, endTime: null },
        });

        if (laborEntry) {
          await prisma.laborEntry.update({
            where: { id: laborEntry.id },
            data: {
              endTime: completedAt,
              durationMinutes: actualMinutes,
              unitsProcessed: task.totalUnits,
              linesProcessed: task.totalLines,
            },
          });
        }
      }

      res.json(updatedTask);
    } catch (error) {
      console.error('Complete task error:', error);
      res.status(500).json({ error: 'Failed to complete task' });
    }
  });

  // Cancel task
  router.patch('/:id/cancel', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const task = await prisma.task.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: reason ? `Cancelled: ${reason}` : 'Task cancelled',
        },
      });

      res.json(task);
    } catch (error) {
      console.error('Cancel task error:', error);
      res.status(500).json({ error: 'Failed to cancel task' });
    }
  });

  // Get tasks by user
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      const tasks = await prisma.task.findMany({
        where: {
          assignedToId: userId,
          status: status || { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        include: {
          order: { select: { orderNumber: true } },
          receipt: { select: { receiptNumber: true } },
          _count: { select: { details: true } },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      res.json(tasks);
    } catch (error) {
      console.error('Get user tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch user tasks' });
    }
  });

  // Create pick task for order
  router.post('/create-pick/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { userId, priority = 5 } = req.body;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          lines: {
            where: { quantityAllocated: { gt: 0 } },
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.lines.length === 0) {
        return res.status(400).json({ error: 'No allocated lines to pick' });
      }

      // Find inventory for each line
      const taskDetails = [];
      for (const line of order.lines) {
        const inventories = await prisma.inventory.findMany({
          where: {
            productId: line.productId,
            warehouseId: order.warehouseId,
            quantityAvailable: { gt: 0 },
            status: 'AVAILABLE',
          },
          include: { location: true },
          orderBy: { location: { pickSequence: 'asc' } },
        });

        let remaining = line.quantityAllocated;
        for (const inv of inventories) {
          if (remaining <= 0) break;
          const qty = Math.min(remaining, inv.quantityAvailable);
          taskDetails.push({
            fromLocationId: inv.locationId,
            orderLineId: line.id,
            quantityRequired: qty,
          });
          remaining -= qty;
        }
      }

      // Generate task number
      const lastTask = await prisma.task.findFirst({
        where: { warehouseId: order.warehouseId },
        orderBy: { createdAt: 'desc' },
        select: { taskNumber: true },
      });

      let nextNum = 1;
      if (lastTask) {
        const parts = lastTask.taskNumber.split('-');
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }

      const taskNumber = `TSK-PIC-${nextNum.toString().padStart(6, '0')}`;

      const task = await prisma.task.create({
        data: {
          taskNumber,
          type: 'PICK',
          warehouseId: order.warehouseId,
          orderId,
          priority,
          assignedToId: userId || null,
          assignedAt: userId ? new Date() : null,
          status: userId ? 'ASSIGNED' : 'PENDING',
          totalLines: taskDetails.length,
          totalUnits: taskDetails.reduce((sum, d) => sum + d.quantityRequired, 0),
          details: {
            create: taskDetails.map((detail, idx) => ({
              ...detail,
              lineNumber: idx + 1,
            })),
          },
        },
        include: {
          details: {
            include: {
              fromLocation: { select: { code: true } },
              orderLine: {
                include: {
                  product: { select: { sku: true, name: true } },
                },
              },
            },
          },
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PICKING' },
      });

      res.status(201).json(task);
    } catch (error) {
      console.error('Create pick task error:', error);
      res.status(500).json({ error: 'Failed to create pick task' });
    }
  });

  return router;
}
