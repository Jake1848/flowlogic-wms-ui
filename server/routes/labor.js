import express from 'express';

const router = express.Router();

export default function createLaborRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // LABOR ENTRIES
  // ============================================

  // List labor entries
  router.get('/entries', asyncHandler(async (req, res) => {
    const { warehouseId, userId, activityType, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (userId) where.userId = userId;
    if (activityType) where.activityType = activityType;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      prisma.laborEntry.findMany({
        where,
        include: {
          user: { select: { fullName: true, username: true } },
          warehouse: { select: { code: true, name: true } },
          task: { select: { taskNumber: true, type: true } },
        },
        orderBy: { startTime: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.laborEntry.count({ where }),
    ]);

    res.json({
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get single entry
  router.get('/entries/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const entry = await prisma.laborEntry.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, username: true, role: true } },
        warehouse: { select: { code: true, name: true } },
        task: {
          select: {
            taskNumber: true,
            type: true,
            status: true,
            totalUnits: true,
            completedUnits: true,
          },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Labor entry not found' });
    }

    res.json(entry);
  }));

  // Clock in / Start activity
  router.post('/clock-in', asyncHandler(async (req, res) => {
    const { userId, warehouseId, activityType, taskId, reason } = req.body;

    if (!userId || !warehouseId || !activityType) {
      return res.status(400).json({ error: 'userId, warehouseId, and activityType are required' });
    }

    // Check for existing open entry
    const openEntry = await prisma.laborEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (openEntry) {
      return res.status(400).json({
        error: 'User already has an open time entry',
        existingEntry: openEntry,
      });
    }

    const entry = await prisma.laborEntry.create({
      data: {
        userId,
        warehouseId,
        activityType,
        taskId,
        startTime: new Date(),
        reason,
      },
      include: {
        user: { select: { fullName: true } },
        task: { select: { taskNumber: true } },
      },
    });

    res.status(201).json(entry);
  }));

  // Clock out / End activity
  router.patch('/clock-out/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { unitsProcessed, linesProcessed, notes } = req.body;

    const entry = await prisma.laborEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Labor entry not found' });
    }

    if (entry.endTime) {
      return res.status(400).json({ error: 'Entry already closed' });
    }

    const endTime = new Date();
    const durationMinutes = Math.round((endTime - entry.startTime) / 60000);

    const updated = await prisma.laborEntry.update({
      where: { id },
      data: {
        endTime,
        durationMinutes,
        unitsProcessed,
        linesProcessed,
      },
      include: {
        user: { select: { fullName: true } },
        task: { select: { taskNumber: true } },
      },
    });

    res.json(updated);
  }));

  // Switch activity
  router.post('/switch', asyncHandler(async (req, res) => {
    const { userId, warehouseId, newActivityType, taskId, reason } = req.body;

    if (!userId || !newActivityType) {
      return res.status(400).json({ error: 'userId and newActivityType are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Close any open entry
      const openEntry = await tx.laborEntry.findFirst({
        where: {
          userId,
          endTime: null,
        },
      });

      if (openEntry) {
        const endTime = new Date();
        await tx.laborEntry.update({
          where: { id: openEntry.id },
          data: {
            endTime,
            durationMinutes: Math.round((endTime - openEntry.startTime) / 60000),
          },
        });
      }

      // Create new entry
      const newEntry = await tx.laborEntry.create({
        data: {
          userId,
          warehouseId: warehouseId || openEntry?.warehouseId,
          activityType: newActivityType,
          taskId,
          startTime: new Date(),
          reason,
        },
        include: {
          user: { select: { fullName: true } },
          task: { select: { taskNumber: true } },
        },
      });

      return { closedEntry: openEntry, newEntry };
    });

    res.json(result);
  }));

  // Get user's current status
  router.get('/status/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const currentEntry = await prisma.laborEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        warehouse: { select: { code: true, name: true } },
        task: { select: { taskNumber: true, type: true, status: true } },
      },
    });

    if (!currentEntry) {
      return res.json({ status: 'clocked_out', currentEntry: null });
    }

    const duration = Math.round((Date.now() - currentEntry.startTime.getTime()) / 60000);

    res.json({
      status: 'clocked_in',
      currentEntry: {
        ...currentEntry,
        currentDuration: duration,
      },
    });
  }));

  // ============================================
  // PRODUCTIVITY & REPORTS
  // ============================================

  // User productivity summary
  router.get('/productivity/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { userId };
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const entries = await prisma.laborEntry.findMany({
      where: {
        ...where,
        endTime: { not: null },
      },
      include: {
        task: { select: { type: true } },
      },
    });

    // Calculate metrics
    const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const totalUnits = entries.reduce((sum, e) => sum + (e.unitsProcessed || 0), 0);
    const totalLines = entries.reduce((sum, e) => sum + (e.linesProcessed || 0), 0);

    // Group by activity type
    const byActivity = {};
    for (const entry of entries) {
      const type = entry.activityType;
      if (!byActivity[type]) {
        byActivity[type] = { minutes: 0, units: 0, lines: 0, count: 0 };
      }
      byActivity[type].minutes += entry.durationMinutes || 0;
      byActivity[type].units += entry.unitsProcessed || 0;
      byActivity[type].lines += entry.linesProcessed || 0;
      byActivity[type].count += 1;
    }

    // Calculate UPH (units per hour)
    const uph = totalMinutes > 0 ? Math.round((totalUnits / totalMinutes) * 60) : 0;

    res.json({
      userId,
      period: { startDate, endDate },
      summary: {
        totalEntries: entries.length,
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(2),
        totalUnits,
        totalLines,
        unitsPerHour: uph,
      },
      byActivity,
    });
  }));

  // Team productivity (all users)
  router.get('/productivity', asyncHandler(async (req, res) => {
    const { warehouseId, startDate, endDate } = req.query;

    const where = { endTime: { not: null } };
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const entries = await prisma.laborEntry.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, role: true } },
      },
    });

    // Group by user
    const byUser = {};
    for (const entry of entries) {
      const userId = entry.userId;
      if (!byUser[userId]) {
        byUser[userId] = {
          user: entry.user,
          minutes: 0,
          units: 0,
          lines: 0,
          entries: 0,
        };
      }
      byUser[userId].minutes += entry.durationMinutes || 0;
      byUser[userId].units += entry.unitsProcessed || 0;
      byUser[userId].lines += entry.linesProcessed || 0;
      byUser[userId].entries += 1;
    }

    // Calculate UPH and sort by productivity
    const userStats = Object.values(byUser).map(u => ({
      ...u,
      hours: (u.minutes / 60).toFixed(2),
      uph: u.minutes > 0 ? Math.round((u.units / u.minutes) * 60) : 0,
    })).sort((a, b) => b.uph - a.uph);

    res.json({
      period: { startDate, endDate },
      users: userStats,
      totals: {
        totalUsers: userStats.length,
        totalMinutes: userStats.reduce((sum, u) => sum + u.minutes, 0),
        totalUnits: userStats.reduce((sum, u) => sum + u.units, 0),
        averageUPH: userStats.length > 0
          ? Math.round(userStats.reduce((sum, u) => sum + u.uph, 0) / userStats.length)
          : 0,
      },
    });
  }));

  // Activity breakdown
  router.get('/activity-breakdown', asyncHandler(async (req, res) => {
    const { warehouseId, startDate, endDate } = req.query;

    const where = { endTime: { not: null } };
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const breakdown = await prisma.laborEntry.groupBy({
      by: ['activityType'],
      where,
      _sum: {
        durationMinutes: true,
        unitsProcessed: true,
        linesProcessed: true,
      },
      _count: true,
    });

    const totalMinutes = breakdown.reduce((sum, b) => sum + (b._sum.durationMinutes || 0), 0);

    res.json({
      breakdown: breakdown.map(b => ({
        activityType: b.activityType,
        entries: b._count,
        minutes: b._sum.durationMinutes || 0,
        hours: ((b._sum.durationMinutes || 0) / 60).toFixed(2),
        percentage: totalMinutes > 0
          ? ((b._sum.durationMinutes || 0) / totalMinutes * 100).toFixed(1)
          : 0,
        units: b._sum.unitsProcessed || 0,
        lines: b._sum.linesProcessed || 0,
      })).sort((a, b) => b.minutes - a.minutes),
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(2),
    });
  }));

  // Daily summary
  router.get('/daily-summary', asyncHandler(async (req, res) => {
    const { warehouseId, date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const where = {
      startTime: { gte: startOfDay, lte: endOfDay },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const [entries, activeUsers, completedTasks] = await Promise.all([
      prisma.laborEntry.findMany({
        where,
        include: {
          user: { select: { fullName: true } },
        },
      }),
      prisma.laborEntry.findMany({
        where: {
          ...where,
          endTime: null,
        },
        distinct: ['userId'],
        include: {
          user: { select: { fullName: true } },
        },
      }),
      prisma.task.count({
        where: {
          completedAt: { gte: startOfDay, lte: endOfDay },
          warehouseId: warehouseId || undefined,
        },
      }),
    ]);

    const completedEntries = entries.filter(e => e.endTime);
    const totalMinutes = completedEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const totalUnits = completedEntries.reduce((sum, e) => sum + (e.unitsProcessed || 0), 0);

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      activeUsers: activeUsers.map(e => ({
        userId: e.userId,
        name: e.user.fullName,
        activity: e.activityType,
        since: e.startTime,
      })),
      summary: {
        totalEntries: entries.length,
        completedEntries: completedEntries.length,
        activeUserCount: activeUsers.length,
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(2),
        totalUnits,
        completedTasks,
        averageUPH: totalMinutes > 0 ? Math.round((totalUnits / totalMinutes) * 60) : 0,
      },
    });
  }));

  // ============================================
  // INDIRECT TIME
  // ============================================

  // Record indirect time
  router.post('/indirect', asyncHandler(async (req, res) => {
    const { userId, warehouseId, activityType, durationMinutes, reason, date } = req.body;

    if (!userId || !warehouseId || !activityType || !durationMinutes) {
      return res.status(400).json({
        error: 'userId, warehouseId, activityType, and durationMinutes are required',
      });
    }

    const validIndirect = ['BREAK', 'LUNCH', 'MEETING', 'TRAINING', 'CLEANING', 'MAINTENANCE', 'IDLE', 'OTHER'];
    if (!validIndirect.includes(activityType)) {
      return res.status(400).json({ error: 'Invalid indirect activity type' });
    }

    const startTime = date ? new Date(date) : new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const entry = await prisma.laborEntry.create({
      data: {
        userId,
        warehouseId,
        activityType,
        startTime,
        endTime,
        durationMinutes: parseInt(durationMinutes),
        reason,
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    res.status(201).json(entry);
  }));

  return router;
}
