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

  // ============================================
  // WORK UNIT MANAGEMENT (RMVUA, IRMMV)
  // ============================================

  // Update task/work unit priority (IRMMV)
  router.patch('/:id/priority', async (req, res) => {
    try {
      const { id } = req.params;
      const { priority, reason, userId } = req.body;

      const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'];
      // Also support numeric priorities (1-5 scale)
      const numericPriority = parseInt(priority);

      let priorityValue = priority;
      if (!isNaN(numericPriority) && numericPriority >= 1 && numericPriority <= 10) {
        priorityValue = numericPriority;
      } else if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error: 'Invalid priority',
          validPriorities,
          numericRange: '1-10',
        });
      }

      const task = await prisma.task.findUnique({
        where: { id },
        select: { taskNumber: true, priority: true, status: true },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task/work unit not found' });
      }

      if (['COMPLETED', 'CANCELLED'].includes(task.status)) {
        return res.status(400).json({
          error: 'Cannot update priority of completed or cancelled task'
        });
      }

      const previousPriority = task.priority;

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          priority: typeof priorityValue === 'number' ? priorityValue :
            priorityValue === 'CRITICAL' ? 1 :
            priorityValue === 'URGENT' ? 2 :
            priorityValue === 'HIGH' ? 3 :
            priorityValue === 'NORMAL' ? 5 :
            priorityValue === 'LOW' ? 7 : 5,
          notes: reason
            ? `${new Date().toISOString()}: Priority changed from ${previousPriority} to ${priorityValue}. Reason: ${reason}`
            : undefined,
        },
        include: {
          assignedTo: { select: { fullName: true } },
        },
      });

      res.json({
        success: true,
        taskNumber: updatedTask.taskNumber,
        previousPriority,
        newPriority: updatedTask.priority,
        updatedBy: userId,
      });
    } catch (error) {
      console.error('Update task priority error:', error);
      res.status(500).json({ error: 'Failed to update task priority' });
    }
  });

  // Assign driver to task (RMVUA)
  router.patch('/:id/assign-driver', async (req, res) => {
    try {
      const { id } = req.params;
      const { driverId, equipmentId, notes } = req.body;

      if (!driverId) {
        return res.status(400).json({ error: 'driverId is required' });
      }

      // Verify driver exists and is active
      const driver = await prisma.user.findUnique({
        where: { id: driverId },
        select: { id: true, fullName: true, role: true, isActive: true },
      });

      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      if (!driver.isActive) {
        return res.status(400).json({ error: 'Driver is not active' });
      }

      const task = await prisma.task.findUnique({
        where: { id },
        select: { taskNumber: true, status: true, assignedToId: true },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (['COMPLETED', 'CANCELLED'].includes(task.status)) {
        return res.status(400).json({
          error: 'Cannot assign driver to completed or cancelled task'
        });
      }

      const previousAssignee = task.assignedToId;

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          assignedToId: driverId,
          assignedAt: new Date(),
          status: task.status === 'PENDING' ? 'ASSIGNED' : task.status,
          equipmentId: equipmentId || undefined,
          notes: notes ? `Driver assigned: ${notes}` : undefined,
        },
        include: {
          assignedTo: { select: { id: true, fullName: true, username: true } },
        },
      });

      res.json({
        success: true,
        taskNumber: updatedTask.taskNumber,
        driver: updatedTask.assignedTo,
        previousAssignee,
        equipmentId,
      });
    } catch (error) {
      console.error('Assign driver error:', error);
      res.status(500).json({ error: 'Failed to assign driver' });
    }
  });

  // Abandon task (mark as abandoned)
  router.patch('/:id/abandon', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, userId, locationId } = req.body;

      const task = await prisma.task.findUnique({
        where: { id },
        select: {
          taskNumber: true,
          status: true,
          assignedToId: true,
          warehouseId: true,
          type: true,
        },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (['COMPLETED', 'CANCELLED'].includes(task.status)) {
        return res.status(400).json({
          error: 'Task is already completed or cancelled'
        });
      }

      const updatedTask = await prisma.$transaction(async (tx) => {
        // Update task status
        const updated = await tx.task.update({
          where: { id },
          data: {
            status: 'ABANDONED',
            abandonedAt: new Date(),
            abandonedReason: reason || 'Task abandoned',
            abandonedById: userId,
            abandonedLocationId: locationId,
          },
        });

        // Close any open labor entries
        if (task.assignedToId) {
          await tx.laborEntry.updateMany({
            where: {
              taskId: id,
              userId: task.assignedToId,
              endTime: null,
            },
            data: {
              endTime: new Date(),
              notes: 'Task abandoned',
            },
          });
        }

        // Create alert for abandoned task
        await tx.alert.create({
          data: {
            warehouseId: task.warehouseId,
            type: 'TASK_ABANDONED',
            severity: 'WARNING',
            title: `Task ${task.taskNumber} abandoned`,
            message: reason || 'Task was abandoned without completion',
            entityType: 'TASK',
            entityId: id,
          },
        });

        return updated;
      });

      res.json({
        success: true,
        taskNumber: updatedTask.taskNumber,
        status: 'ABANDONED',
        abandonedAt: updatedTask.abandonedAt,
      });
    } catch (error) {
      console.error('Abandon task error:', error);
      res.status(500).json({ error: 'Failed to abandon task' });
    }
  });

  // Resolve abandoned task (RMVUA)
  router.patch('/:id/resolve-abandon', async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution, reassignToId, notes, userId } = req.body;

      const validResolutions = ['REASSIGN', 'CANCEL', 'COMPLETE', 'REOPEN'];
      if (!validResolutions.includes(resolution)) {
        return res.status(400).json({
          error: 'Invalid resolution',
          validResolutions,
        });
      }

      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          details: true,
        },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (task.status !== 'ABANDONED') {
        return res.status(400).json({
          error: 'Task is not in abandoned status'
        });
      }

      let newStatus;
      let updateData = {
        abandonedResolution: resolution,
        abandonedResolvedAt: new Date(),
        abandonedResolvedById: userId,
        notes: notes ? `Abandon resolved: ${notes}` : undefined,
      };

      switch (resolution) {
        case 'REASSIGN':
          if (!reassignToId) {
            return res.status(400).json({ error: 'reassignToId required for REASSIGN resolution' });
          }
          newStatus = 'ASSIGNED';
          updateData.assignedToId = reassignToId;
          updateData.assignedAt = new Date();
          break;
        case 'CANCEL':
          newStatus = 'CANCELLED';
          break;
        case 'COMPLETE':
          newStatus = 'COMPLETED';
          updateData.completedAt = new Date();
          updateData.completedLines = task.totalLines;
          updateData.completedUnits = task.totalUnits;
          break;
        case 'REOPEN':
          newStatus = 'PENDING';
          updateData.assignedToId = null;
          updateData.assignedAt = null;
          break;
      }

      updateData.status = newStatus;

      const updatedTask = await prisma.$transaction(async (tx) => {
        const updated = await tx.task.update({
          where: { id },
          data: updateData,
          include: {
            assignedTo: { select: { fullName: true } },
          },
        });

        // Resolve the alert
        await tx.alert.updateMany({
          where: {
            entityType: 'TASK',
            entityId: id,
            type: 'TASK_ABANDONED',
            isResolved: false,
          },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
            resolvedById: userId,
            resolution: `Resolved: ${resolution}`,
          },
        });

        return updated;
      });

      res.json({
        success: true,
        taskNumber: updatedTask.taskNumber,
        resolution,
        newStatus,
        assignedTo: updatedTask.assignedTo?.fullName,
      });
    } catch (error) {
      console.error('Resolve abandon error:', error);
      res.status(500).json({ error: 'Failed to resolve abandoned task' });
    }
  });

  // Close all selected work units (RMVUA batch operation)
  router.post('/close-all', async (req, res) => {
    try {
      const { taskIds, reason, userId } = req.body;

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ error: 'taskIds array is required' });
      }

      const results = [];
      const errors = [];

      for (const taskId of taskIds) {
        try {
          const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { taskNumber: true, status: true },
          });

          if (!task) {
            errors.push({ taskId, error: 'Task not found' });
            continue;
          }

          if (['COMPLETED', 'CANCELLED'].includes(task.status)) {
            errors.push({ taskId, taskNumber: task.taskNumber, error: 'Already closed' });
            continue;
          }

          await prisma.task.update({
            where: { id: taskId },
            data: {
              status: 'CANCELLED',
              notes: reason || 'Batch close operation',
              completedAt: new Date(),
            },
          });

          results.push({ taskId, taskNumber: task.taskNumber, status: 'CLOSED' });
        } catch (err) {
          errors.push({ taskId, error: err.message });
        }
      }

      res.json({
        success: true,
        closed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('Close all tasks error:', error);
      res.status(500).json({ error: 'Failed to close tasks' });
    }
  });

  // Batch update priorities
  router.post('/update-priorities', async (req, res) => {
    try {
      const { updates, userId } = req.body;
      // updates = [{ taskId, priority }, ...]

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'updates array is required' });
      }

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const task = await prisma.task.findUnique({
            where: { id: update.taskId },
            select: { taskNumber: true, status: true },
          });

          if (!task) {
            errors.push({ taskId: update.taskId, error: 'Task not found' });
            continue;
          }

          if (['COMPLETED', 'CANCELLED'].includes(task.status)) {
            errors.push({ taskId: update.taskId, taskNumber: task.taskNumber, error: 'Cannot update closed task' });
            continue;
          }

          await prisma.task.update({
            where: { id: update.taskId },
            data: { priority: update.priority },
          });

          results.push({ taskId: update.taskId, taskNumber: task.taskNumber, newPriority: update.priority });
        } catch (err) {
          errors.push({ taskId: update.taskId, error: err.message });
        }
      }

      res.json({
        success: true,
        updated: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('Batch update priorities error:', error);
      res.status(500).json({ error: 'Failed to update priorities' });
    }
  });

  // ============================================
  // REALTIME WORK SUMMARY (RMRWA)
  // ============================================

  // Get realtime work summary for management
  router.get('/realtime/summary', async (req, res) => {
    try {
      const { warehouseId } = req.query;
      const where = warehouseId ? { warehouseId } : {};

      const [
        openTasks,
        byType,
        byPriority,
        byStatus,
        byAssignee,
        abandonedTasks,
        oldestTasks,
      ] = await Promise.all([
        // Total open work
        prisma.task.count({
          where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        }),
        // By type
        prisma.task.groupBy({
          by: ['type'],
          where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          _count: true,
          _sum: { totalUnits: true },
        }),
        // By priority
        prisma.task.groupBy({
          by: ['priority'],
          where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          _count: true,
          orderBy: { priority: 'asc' },
        }),
        // By status
        prisma.task.groupBy({
          by: ['status'],
          where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          _count: true,
        }),
        // By assignee (active drivers)
        prisma.task.groupBy({
          by: ['assignedToId'],
          where: {
            ...where,
            status: 'IN_PROGRESS',
            assignedToId: { not: null },
          },
          _count: true,
        }),
        // Abandoned tasks
        prisma.task.count({
          where: { ...where, status: 'ABANDONED' },
        }),
        // Oldest open tasks
        prisma.task.findMany({
          where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          orderBy: { createdAt: 'asc' },
          take: 5,
          select: {
            id: true,
            taskNumber: true,
            type: true,
            priority: true,
            createdAt: true,
            assignedTo: { select: { fullName: true } },
          },
        }),
      ]);

      // Get driver names
      const driverIds = byAssignee.map(a => a.assignedToId).filter(Boolean);
      const drivers = await prisma.user.findMany({
        where: { id: { in: driverIds } },
        select: { id: true, fullName: true },
      });
      const driverMap = Object.fromEntries(drivers.map(d => [d.id, d.fullName]));

      // Calculate total units of open work
      const totalOpenUnits = byType.reduce((sum, t) => sum + (t._sum.totalUnits || 0), 0);

      res.json({
        summary: {
          openTasks,
          totalOpenUnits,
          abandonedTasks,
          activeDrivers: byAssignee.length,
        },
        byType: byType.map(t => ({
          type: t.type,
          count: t._count,
          units: t._sum.totalUnits || 0,
        })),
        byPriority: byPriority.map(p => ({
          priority: p.priority,
          count: p._count,
          label: p.priority <= 2 ? 'CRITICAL/URGENT' :
                 p.priority <= 4 ? 'HIGH' :
                 p.priority <= 6 ? 'NORMAL' : 'LOW',
        })),
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count,
        })),
        activeDrivers: byAssignee.map(a => ({
          driverId: a.assignedToId,
          driverName: driverMap[a.assignedToId] || 'Unknown',
          tasksInProgress: a._count,
        })),
        oldestTasks: oldestTasks.map(t => ({
          ...t,
          ageMinutes: Math.round((Date.now() - new Date(t.createdAt).getTime()) / 60000),
        })),
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Realtime summary error:', error);
      res.status(500).json({ error: 'Failed to fetch realtime summary' });
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
