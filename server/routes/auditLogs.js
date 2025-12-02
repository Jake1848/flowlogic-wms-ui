import { Router } from 'express';

/**
 * Audit Log Routes
 * Tracks system changes, user actions, and provides compliance reporting
 */
export default function auditLogRoutes(prisma) {
  const router = Router();

  // Async handler wrapper
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Action categories
  const ACTION_CATEGORIES = {
    INVENTORY: ['ADJUSTMENT', 'TRANSFER', 'RECEIPT', 'SHIPMENT', 'CYCLE_COUNT', 'PHYSICAL_INVENTORY'],
    ORDERS: ['CREATE', 'UPDATE', 'CANCEL', 'ALLOCATE', 'PICK', 'PACK', 'SHIP'],
    USERS: ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'PASSWORD_CHANGE', 'ROLE_CHANGE'],
    SETTINGS: ['SETTING_CHANGED', 'FEATURE_TOGGLE', 'CONFIG_UPDATE'],
    PRODUCTS: ['CREATE', 'UPDATE', 'DELETE', 'PRICE_CHANGE'],
    LOCATIONS: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'],
    SYSTEM: ['BACKUP', 'RESTORE', 'IMPORT', 'EXPORT', 'MAINTENANCE']
  };

  // ==========================================
  // Audit Log Queries
  // ==========================================

  // Get audit logs with comprehensive filtering
  router.get('/', asyncHandler(async (req, res) => {
    const {
      action,
      entityType,
      entityId,
      userId,
      warehouseId,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 100
    } = req.query;

    const where = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (warehouseId) where.warehouseId = warehouseId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, fullName: true }
          },
          warehouse: {
            select: { id: true, code: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get single audit log entry
  router.get('/:id', asyncHandler(async (req, res) => {
    const log = await prisma.auditLog.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, email: true }
        },
        warehouse: true
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log entry not found' });
    }

    res.json(log);
  }));

  // Get audit trail for specific entity
  router.get('/entity/:entityType/:entityId', asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          entityType,
          entityId
        },
        include: {
          user: {
            select: { id: true, username: true, fullName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.auditLog.count({
        where: { entityType, entityId }
      })
    ]);

    res.json({
      entityType,
      entityId,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get user activity history
  router.get('/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { dateFrom, dateTo, page = 1, limit = 100 } = req.query;

    const where = { userId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total, user] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, fullName: true }
      })
    ]);

    res.json({
      user,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // ==========================================
  // Audit Log Creation (internal use)
  // ==========================================

  // Create audit log entry (for internal/API use)
  router.post('/', asyncHandler(async (req, res) => {
    const {
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      description,
      details,
      warehouseId,
      ipAddress
    } = req.body;

    const log = await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        description,
        details: details || {},
        userId: req.user?.id,
        warehouseId,
        ipAddress: ipAddress || req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json(log);
  }));

  // ==========================================
  // Audit Reports & Analytics
  // ==========================================

  // Get audit summary statistics
  router.get('/stats/summary', asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, warehouseId } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [
      byAction,
      byEntity,
      byUser,
      totalCount,
      recentActivity
    ] = await Promise.all([
      // Actions breakdown
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20
      }),

      // Entity types breakdown
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),

      // Top users by activity
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),

      // Total count
      prisma.auditLog.count({ where }),

      // Recent activity (last 10)
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Get user details for top users
    const userIds = byUser.map(u => u.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, username: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    res.json({
      totalEntries: totalCount,
      byAction: byAction.map(a => ({ action: a.action, count: a._count.id })),
      byEntityType: byEntity.map(e => ({ entityType: e.entityType, count: e._count.id })),
      topUsers: byUser.map(u => ({
        user: userMap.get(u.userId),
        activityCount: u._count.id
      })),
      recentActivity
    });
  }));

  // Get daily activity trend
  router.get('/stats/trend', asyncHandler(async (req, res) => {
    const { days = 30, warehouseId } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = {
      createdAt: { gte: startDate }
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const dailyActivity = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= ${startDate}
      ${warehouseId ? prisma.$queryRaw`AND warehouse_id = ${warehouseId}` : prisma.$queryRaw``}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    res.json(dailyActivity.map(d => ({
      date: d.date,
      count: Number(d.count)
    })));
  }));

  // Get login/logout activity report
  router.get('/stats/logins', asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, userId } = req.query;

    const where = {
      action: { in: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'] }
    };

    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [loginActivity, failedLogins] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, username: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      }),

      // Failed login attempts
      prisma.auditLog.groupBy({
        by: ['details'],
        where: {
          action: 'LOGIN_FAILED',
          createdAt: where.createdAt
        },
        _count: { id: true }
      })
    ]);

    res.json({
      activity: loginActivity,
      failedAttempts: failedLogins.length
    });
  }));

  // Get inventory change audit report
  router.get('/stats/inventory-changes', asyncHandler(async (req, res) => {
    const { productId, locationId, dateFrom, dateTo, page = 1, limit = 100 } = req.query;

    const where = {
      entityType: 'Inventory',
      action: { in: ['ADJUSTMENT', 'TRANSFER', 'RECEIPT', 'SHIPMENT', 'CYCLE_COUNT'] }
    };

    if (productId) {
      where.details = { path: ['productId'], equals: productId };
    }
    if (locationId) {
      where.details = { path: ['locationId'], equals: locationId };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get security events report
  router.get('/stats/security', asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;

    const where = {
      action: {
        in: [
          'LOGIN_FAILED',
          'PASSWORD_CHANGE',
          'ROLE_CHANGE',
          'PERMISSION_CHANGE',
          'ACCOUNT_LOCKED',
          'ACCOUNT_UNLOCKED',
          'MFA_ENABLED',
          'MFA_DISABLED',
          'API_KEY_CREATED',
          'API_KEY_REVOKED'
        ]
      }
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [securityEvents, byAction] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, username: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),

      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true }
      })
    ]);

    res.json({
      events: securityEvents,
      summary: byAction.reduce((acc, a) => ({ ...acc, [a.action]: a._count.id }), {})
    });
  }));

  // ==========================================
  // Compliance & Export
  // ==========================================

  // Export audit logs (CSV format)
  router.get('/export', asyncHandler(async (req, res) => {
    const {
      action,
      entityType,
      userId,
      dateFrom,
      dateTo,
      format = 'csv'
    } = req.query;

    const where = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { username: true, fullName: true } },
        warehouse: { select: { code: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10000 // Limit export to 10k records
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
      return res.json(logs);
    }

    // CSV format
    const csvRows = [
      ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User', 'Description', 'Old Value', 'New Value', 'IP Address'].join(',')
    ];

    for (const log of logs) {
      csvRows.push([
        log.createdAt.toISOString(),
        log.action,
        log.entityType || '',
        log.entityId || '',
        log.user?.fullName || log.user?.username || 'System',
        `"${(log.description || '').replace(/"/g, '""')}"`,
        `"${(log.oldValue || '').replace(/"/g, '""')}"`,
        `"${(log.newValue || '').replace(/"/g, '""')}"`,
        log.ipAddress || ''
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    res.send(csvRows.join('\n'));
  }));

  // Get retention policy
  router.get('/retention', asyncHandler(async (req, res) => {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { startsWith: 'audit.' }
      }
    });

    const retention = {};
    for (const s of settings) {
      retention[s.key.replace('audit.', '')] = s.value;
    }

    res.json({
      retention: retention.retentionDays || 365,
      archiveEnabled: retention.archiveEnabled === 'true',
      archiveLocation: retention.archiveLocation || null
    });
  }));

  // Purge old audit logs (admin only)
  router.delete('/purge', asyncHandler(async (req, res) => {
    const { olderThan } = req.body;

    if (!olderThan) {
      return res.status(400).json({ error: 'olderThan date is required' });
    }

    const cutoffDate = new Date(olderThan);

    // Archive before purging (in production)
    const count = await prisma.auditLog.count({
      where: { createdAt: { lt: cutoffDate } }
    });

    // Log the purge action before executing
    await prisma.auditLog.create({
      data: {
        action: 'AUDIT_PURGE',
        entityType: 'AuditLog',
        description: `Purging ${count} audit logs older than ${cutoffDate.toISOString()}`,
        userId: req.user?.id,
        details: { cutoffDate: cutoffDate.toISOString(), recordCount: count }
      }
    });

    // Perform the purge
    const deleted = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });

    res.json({
      message: `Purged ${deleted.count} audit log entries`,
      cutoffDate: cutoffDate.toISOString()
    });
  }));

  // Get available action categories
  router.get('/categories', (req, res) => {
    res.json(ACTION_CATEGORIES);
  });

  return router;
}
