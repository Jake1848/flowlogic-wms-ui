import express from 'express';
import bcrypt from 'bcryptjs';

const router = express.Router();

export default function createUserRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // USER CRUD
  // ============================================

  // List users with filters
  router.get('/', asyncHandler(async (req, res) => {
    const { search, role, isActive, warehouseId, page = 1, limit = 20 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (warehouseId) {
      where.warehouses = { some: { warehouseId } };
    }
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          role: true,
          department: true,
          employeeId: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          warehouses: {
            include: {
              warehouse: { select: { id: true, code: true, name: true } },
            },
          },
        },
        orderBy: { fullName: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users.map(u => ({
        ...u,
        warehouses: u.warehouses.map(w => w.warehouse),
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get user by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        department: true,
        employeeId: true,
        phone: true,
        locale: true,
        timezone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        warehouses: {
          include: {
            warehouse: { select: { id: true, code: true, name: true } },
          },
        },
        defaultWarehouse: { select: { id: true, code: true, name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      warehouses: user.warehouses.map(w => w.warehouse),
    });
  }));

  // Create user
  router.post('/', asyncHandler(async (req, res) => {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      employeeId,
      phone,
      locale,
      timezone,
      defaultWarehouseId,
      warehouseIds,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    // Check for duplicates
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({
        error: existing.username === username.toLowerCase()
          ? 'Username already exists'
          : 'Email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        fullName: `${firstName || ''} ${lastName || ''}`.trim() || username,
        role: role || 'OPERATOR',
        department,
        employeeId,
        phone,
        locale: locale || 'en-US',
        timezone: timezone || 'America/New_York',
        defaultWarehouseId,
        isActive: true,
        warehouses: warehouseIds && warehouseIds.length > 0 ? {
          create: warehouseIds.map(wId => ({ warehouseId: wId })),
        } : undefined,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  }));

  // Update user
  router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      department,
      employeeId,
      phone,
      locale,
      timezone,
      defaultWarehouseId,
    } = req.body;

    // Check email uniqueness if changed
    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: id },
        },
      });
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        fullName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
        email: email ? email.toLowerCase() : undefined,
        department,
        employeeId,
        phone,
        locale,
        timezone,
        defaultWarehouseId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        department: true,
        isActive: true,
      },
    });

    res.json(user);
  }));

  // Deactivate user
  router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check for open tasks
    const openTasks = await prisma.task.count({
      where: {
        assignedToId: id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    if (openTasks > 0) {
      return res.status(400).json({
        error: 'Cannot deactivate user with open tasks',
        openTasks,
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, userId: user.id });
  }));

  // Reactivate user
  router.patch('/:id/reactivate', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    res.json(user);
  }));

  // ============================================
  // ROLE & PERMISSIONS
  // ============================================

  // Update user role
  router.patch('/:id/role', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'PICKER', 'PACKER', 'RECEIVER', 'SHIPPER', 'VIEWER', 'API'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles,
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
      },
    });

    res.json(user);
  }));

  // Get available roles
  router.get('/roles/list', asyncHandler(async (req, res) => {
    const roles = [
      { code: 'ADMIN', name: 'Administrator', description: 'Full system access' },
      { code: 'MANAGER', name: 'Manager', description: 'Manage operations and users' },
      { code: 'SUPERVISOR', name: 'Supervisor', description: 'Supervise warehouse operations' },
      { code: 'OPERATOR', name: 'Operator', description: 'General warehouse operations' },
      { code: 'PICKER', name: 'Picker', description: 'Order picking operations' },
      { code: 'PACKER', name: 'Packer', description: 'Packing and shipping prep' },
      { code: 'RECEIVER', name: 'Receiver', description: 'Receiving operations' },
      { code: 'SHIPPER', name: 'Shipper', description: 'Shipping operations' },
      { code: 'VIEWER', name: 'Viewer', description: 'Read-only access' },
      { code: 'API', name: 'API User', description: 'Integration/API access only' },
    ];

    res.json(roles);
  }));

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  // Change password (self)
  router.put('/:id/password', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  }));

  // Reset password (admin)
  router.post('/:id/reset-password', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'newPassword is required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  }));

  // ============================================
  // WAREHOUSE ASSIGNMENTS
  // ============================================

  // Assign warehouses to user
  router.post('/:id/warehouses', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { warehouseIds } = req.body;

    if (!warehouseIds || !Array.isArray(warehouseIds)) {
      return res.status(400).json({ error: 'warehouseIds array is required' });
    }

    await prisma.$transaction(async (tx) => {
      // Remove existing assignments
      await tx.userWarehouse.deleteMany({
        where: { userId: id },
      });

      // Create new assignments
      if (warehouseIds.length > 0) {
        await tx.userWarehouse.createMany({
          data: warehouseIds.map(wId => ({
            userId: id,
            warehouseId: wId,
          })),
        });
      }
    });

    // Return updated user with warehouses
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        warehouses: {
          include: {
            warehouse: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    res.json({
      userId: id,
      warehouses: user.warehouses.map(w => w.warehouse),
    });
  }));

  // Add single warehouse to user
  router.post('/:id/warehouses/:warehouseId', asyncHandler(async (req, res) => {
    const { id, warehouseId } = req.params;

    // Check if already assigned
    const existing = await prisma.userWarehouse.findUnique({
      where: {
        userId_warehouseId: {
          userId: id,
          warehouseId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'User already assigned to this warehouse' });
    }

    await prisma.userWarehouse.create({
      data: {
        userId: id,
        warehouseId,
      },
    });

    res.json({ success: true, userId: id, warehouseId });
  }));

  // Remove warehouse from user
  router.delete('/:id/warehouses/:warehouseId', asyncHandler(async (req, res) => {
    const { id, warehouseId } = req.params;

    await prisma.userWarehouse.delete({
      where: {
        userId_warehouseId: {
          userId: id,
          warehouseId,
        },
      },
    });

    res.json({ success: true });
  }));

  // ============================================
  // USER PERFORMANCE & ACTIVITY
  // ============================================

  // Get user performance metrics
  router.get('/:id/performance', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.startTime = {};
      if (startDate) dateFilter.startTime.gte = new Date(startDate);
      if (endDate) dateFilter.startTime.lte = new Date(endDate);
    }

    const [
      user,
      laborEntries,
      completedTasks,
      recentActivity,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          role: true,
          department: true,
        },
      }),
      prisma.laborEntry.findMany({
        where: {
          userId: id,
          endTime: { not: null },
          ...dateFilter,
        },
      }),
      prisma.task.count({
        where: {
          assignedToId: id,
          status: 'COMPLETED',
          completedAt: dateFilter.startTime ? {
            gte: dateFilter.startTime.gte,
            lte: dateFilter.startTime.lte,
          } : undefined,
        },
      }),
      prisma.laborEntry.findMany({
        where: { userId: id },
        orderBy: { startTime: 'desc' },
        take: 10,
        include: {
          warehouse: { select: { code: true } },
          task: { select: { taskNumber: true, type: true } },
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate metrics
    const totalMinutes = laborEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const totalUnits = laborEntries.reduce((sum, e) => sum + (e.unitsProcessed || 0), 0);
    const totalLines = laborEntries.reduce((sum, e) => sum + (e.linesProcessed || 0), 0);

    // Group by activity type
    const byActivity = {};
    for (const entry of laborEntries) {
      const type = entry.activityType;
      if (!byActivity[type]) {
        byActivity[type] = { minutes: 0, units: 0, entries: 0 };
      }
      byActivity[type].minutes += entry.durationMinutes || 0;
      byActivity[type].units += entry.unitsProcessed || 0;
      byActivity[type].entries += 1;
    }

    res.json({
      user,
      summary: {
        totalHours: (totalMinutes / 60).toFixed(2),
        totalUnits,
        totalLines,
        completedTasks,
        unitsPerHour: totalMinutes > 0 ? Math.round((totalUnits / totalMinutes) * 60) : 0,
        entriesCount: laborEntries.length,
      },
      byActivity,
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        activity: a.activityType,
        warehouse: a.warehouse?.code,
        task: a.task?.taskNumber,
        startTime: a.startTime,
        endTime: a.endTime,
        duration: a.durationMinutes,
        units: a.unitsProcessed,
      })),
    });
  }));

  // ============================================
  // SUMMARY & STATS
  // ============================================

  // User summary stats
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const warehouseFilter = warehouseId ? {
      warehouses: { some: { warehouseId } },
    } : {};

    const [
      totalUsers,
      activeUsers,
      byRole,
      byDepartment,
      recentLogins,
    ] = await Promise.all([
      prisma.user.count({ where: warehouseFilter }),
      prisma.user.count({ where: { isActive: true, ...warehouseFilter } }),
      prisma.user.groupBy({
        by: ['role'],
        where: warehouseFilter,
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['department'],
        where: { department: { not: null }, ...warehouseFilter },
        _count: true,
      }),
      prisma.user.findMany({
        where: { lastLoginAt: { not: null }, ...warehouseFilter },
        orderBy: { lastLoginAt: 'desc' },
        take: 10,
        select: {
          id: true,
          fullName: true,
          role: true,
          lastLoginAt: true,
        },
      }),
    ]);

    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: byRole.map(r => ({
        role: r.role,
        count: r._count,
      })),
      byDepartment: byDepartment.map(d => ({
        department: d.department,
        count: d._count,
      })),
      recentLogins,
    });
  }));

  return router;
}
