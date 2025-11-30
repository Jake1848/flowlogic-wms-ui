import express from 'express';

const router = express.Router();

export default function createWarehouseRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // WAREHOUSE CRUD
  // ============================================

  // List warehouses
  router.get('/', asyncHandler(async (req, res) => {
    const { companyId, isActive, search } = req.query;

    const where = {};
    if (companyId) where.companyId = companyId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        company: { select: { id: true, code: true, name: true } },
        _count: {
          select: {
            zones: true,
            inventory: true,
            orders: true,
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(warehouses);
  }));

  // Get warehouse by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, code: true, name: true } },
        zones: {
          where: { isActive: true },
          orderBy: { code: 'asc' },
          include: {
            _count: { select: { locations: true } },
          },
        },
        _count: {
          select: {
            zones: true,
            inventory: true,
            orders: true,
            users: true,
            docks: true,
          },
        },
      },
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json(warehouse);
  }));

  // Create warehouse
  router.post('/', asyncHandler(async (req, res) => {
    const {
      code,
      name,
      companyId,
      address,
      city,
      state,
      zipCode,
      country,
      timezone,
      phone,
      email,
      squareFootage,
      maxCapacity,
      operatingHoursStart,
      operatingHoursEnd,
      notes,
    } = req.body;

    if (!code || !name || !companyId) {
      return res.status(400).json({ error: 'code, name, and companyId are required' });
    }

    // Check for duplicate code
    const existing = await prisma.warehouse.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return res.status(409).json({ error: 'Warehouse code already exists' });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        code: code.toUpperCase(),
        name,
        companyId,
        address,
        city,
        state,
        zipCode,
        country: country || 'USA',
        timezone: timezone || 'America/New_York',
        phone,
        email,
        squareFootage: squareFootage ? parseInt(squareFootage) : null,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
        operatingHoursStart,
        operatingHoursEnd,
        notes,
        isActive: true,
      },
      include: {
        company: { select: { code: true, name: true } },
      },
    });

    res.status(201).json(warehouse);
  }));

  // Update warehouse
  router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.code;
    delete updateData.createdAt;

    if (updateData.squareFootage) {
      updateData.squareFootage = parseInt(updateData.squareFootage);
    }
    if (updateData.maxCapacity) {
      updateData.maxCapacity = parseInt(updateData.maxCapacity);
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: updateData,
    });

    res.json(warehouse);
  }));

  // Deactivate warehouse
  router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check for active inventory
    const activeInventory = await prisma.inventory.count({
      where: { warehouseId: id, quantityOnHand: { gt: 0 } },
    });

    if (activeInventory > 0) {
      return res.status(400).json({
        error: 'Cannot deactivate warehouse with active inventory',
        activeInventory,
      });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, warehouse });
  }));

  // ============================================
  // WAREHOUSE CAPACITY & HEALTH
  // ============================================

  // Get warehouse capacity analysis
  router.get('/:id/capacity', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        squareFootage: true,
        maxCapacity: true,
      },
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const [
      totalLocations,
      usedLocations,
      inventoryStats,
      zoneCapacity,
    ] = await Promise.all([
      prisma.location.count({
        where: { zone: { warehouseId: id }, isActive: true },
      }),
      prisma.location.count({
        where: {
          zone: { warehouseId: id },
          isActive: true,
          inventory: { some: { quantityOnHand: { gt: 0 } } },
        },
      }),
      prisma.inventory.aggregate({
        where: { warehouseId: id },
        _sum: { quantityOnHand: true },
        _count: true,
      }),
      prisma.zone.findMany({
        where: { warehouseId: id, isActive: true },
        include: {
          _count: { select: { locations: true } },
          locations: {
            where: { inventory: { some: { quantityOnHand: { gt: 0 } } } },
            select: { id: true },
          },
        },
      }),
    ]);

    const utilizationPct = totalLocations > 0
      ? ((usedLocations / totalLocations) * 100).toFixed(1)
      : 0;

    res.json({
      warehouse: {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
      },
      capacity: {
        squareFootage: warehouse.squareFootage,
        maxCapacity: warehouse.maxCapacity,
        totalLocations,
        usedLocations,
        emptyLocations: totalLocations - usedLocations,
        utilizationPercent: parseFloat(utilizationPct),
      },
      inventory: {
        totalRecords: inventoryStats._count,
        totalUnits: inventoryStats._sum.quantityOnHand || 0,
      },
      byZone: zoneCapacity.map(z => ({
        zoneId: z.id,
        zoneCode: z.code,
        zoneName: z.name,
        totalLocations: z._count.locations,
        usedLocations: z.locations.length,
        utilizationPercent: z._count.locations > 0
          ? ((z.locations.length / z._count.locations) * 100).toFixed(1)
          : 0,
      })),
    });
  }));

  // Get warehouse health metrics
  router.get('/:id/health', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      warehouse,
      pendingOrders,
      lateOrders,
      openTasks,
      unresolvedAlerts,
      recentTransactions,
      lowStockItems,
    ] = await Promise.all([
      prisma.warehouse.findUnique({
        where: { id },
        select: { id: true, code: true, name: true },
      }),
      prisma.order.count({
        where: {
          warehouseId: id,
          status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
        },
      }),
      prisma.order.count({
        where: {
          warehouseId: id,
          requiredDate: { lt: new Date() },
          status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
        },
      }),
      prisma.task.count({
        where: {
          warehouseId: id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      prisma.alert.count({
        where: {
          warehouseId: id,
          isResolved: false,
        },
      }),
      prisma.inventoryTransaction.count({
        where: {
          inventory: { warehouseId: id },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.inventory.count({
        where: {
          warehouseId: id,
          quantityAvailable: { lte: 10 },
          quantityOnHand: { gt: 0 },
        },
      }),
    ]);

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Calculate health score (simple weighted average)
    const lateOrderPenalty = lateOrders * 10;
    const alertPenalty = unresolvedAlerts * 5;
    const healthScore = Math.max(0, 100 - lateOrderPenalty - alertPenalty);

    res.json({
      warehouse,
      healthScore,
      healthStatus: healthScore >= 80 ? 'GOOD' : healthScore >= 50 ? 'WARNING' : 'CRITICAL',
      metrics: {
        pendingOrders,
        lateOrders,
        openTasks,
        unresolvedAlerts,
        transactionsLast7Days: recentTransactions,
        lowStockItems,
      },
      issues: [
        ...(lateOrders > 0 ? [{ type: 'LATE_ORDERS', count: lateOrders, severity: 'HIGH' }] : []),
        ...(unresolvedAlerts > 0 ? [{ type: 'UNRESOLVED_ALERTS', count: unresolvedAlerts, severity: 'MEDIUM' }] : []),
        ...(lowStockItems > 0 ? [{ type: 'LOW_STOCK', count: lowStockItems, severity: 'LOW' }] : []),
      ],
    });
  }));

  // ============================================
  // ZONES
  // ============================================

  // List zones in warehouse
  router.get('/:id/zones', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, isActive } = req.query;

    const where = { warehouseId: id };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const zones = await prisma.zone.findMany({
      where,
      include: {
        _count: { select: { locations: true } },
      },
      orderBy: { code: 'asc' },
    });

    res.json(zones);
  }));

  // Create zone
  router.post('/:id/zones', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      code,
      name,
      type,
      temperatureControlled,
      minTemp,
      maxTemp,
      description,
      pickSequence,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    // Check for duplicate code within warehouse
    const existing = await prisma.zone.findFirst({
      where: {
        warehouseId: id,
        code: code.toUpperCase(),
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Zone code already exists in this warehouse' });
    }

    const zone = await prisma.zone.create({
      data: {
        warehouseId: id,
        code: code.toUpperCase(),
        name,
        type: type || 'STORAGE',
        temperatureControlled: temperatureControlled || false,
        minTemp: minTemp ? parseFloat(minTemp) : null,
        maxTemp: maxTemp ? parseFloat(maxTemp) : null,
        description,
        pickSequence: pickSequence ? parseInt(pickSequence) : null,
        isActive: true,
      },
    });

    res.status(201).json(zone);
  }));

  // Get zone by ID
  router.get('/zones/:zoneId', asyncHandler(async (req, res) => {
    const { zoneId } = req.params;

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        _count: { select: { locations: true } },
      },
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json(zone);
  }));

  // Update zone
  router.put('/zones/:zoneId', asyncHandler(async (req, res) => {
    const { zoneId } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.warehouseId;
    delete updateData.code;
    delete updateData.createdAt;

    if (updateData.minTemp !== undefined) {
      updateData.minTemp = parseFloat(updateData.minTemp);
    }
    if (updateData.maxTemp !== undefined) {
      updateData.maxTemp = parseFloat(updateData.maxTemp);
    }
    if (updateData.pickSequence !== undefined) {
      updateData.pickSequence = parseInt(updateData.pickSequence);
    }

    const zone = await prisma.zone.update({
      where: { id: zoneId },
      data: updateData,
    });

    res.json(zone);
  }));

  // Delete zone
  router.delete('/zones/:zoneId', asyncHandler(async (req, res) => {
    const { zoneId } = req.params;

    // Check for locations with inventory
    const locationsWithInventory = await prisma.location.count({
      where: {
        zoneId,
        inventory: { some: { quantityOnHand: { gt: 0 } } },
      },
    });

    if (locationsWithInventory > 0) {
      return res.status(400).json({
        error: 'Cannot delete zone with inventory',
        locationsWithInventory,
      });
    }

    // Soft delete
    const zone = await prisma.zone.update({
      where: { id: zoneId },
      data: { isActive: false },
    });

    res.json({ success: true, zone });
  }));

  // Get zone capacity
  router.get('/zones/:zoneId/capacity', asyncHandler(async (req, res) => {
    const { zoneId } = req.params;

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      select: { id: true, code: true, name: true, type: true },
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const [
      totalLocations,
      usedLocations,
      inventoryStats,
      byLocationType,
    ] = await Promise.all([
      prisma.location.count({
        where: { zoneId, isActive: true },
      }),
      prisma.location.count({
        where: {
          zoneId,
          isActive: true,
          inventory: { some: { quantityOnHand: { gt: 0 } } },
        },
      }),
      prisma.inventory.aggregate({
        where: { location: { zoneId } },
        _sum: { quantityOnHand: true },
        _count: true,
      }),
      prisma.location.groupBy({
        by: ['type'],
        where: { zoneId, isActive: true },
        _count: true,
      }),
    ]);

    res.json({
      zone,
      capacity: {
        totalLocations,
        usedLocations,
        emptyLocations: totalLocations - usedLocations,
        utilizationPercent: totalLocations > 0
          ? ((usedLocations / totalLocations) * 100).toFixed(1)
          : 0,
      },
      inventory: {
        totalRecords: inventoryStats._count,
        totalUnits: inventoryStats._sum.quantityOnHand || 0,
      },
      byLocationType: byLocationType.map(t => ({
        type: t.type,
        count: t._count,
      })),
    });
  }));

  // Get locations in zone
  router.get('/zones/:zoneId/locations', asyncHandler(async (req, res) => {
    const { zoneId } = req.params;
    const { type, isActive, hasInventory, page = 1, limit = 50 } = req.query;

    const where = { zoneId };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (hasInventory === 'true') {
      where.inventory = { some: { quantityOnHand: { gt: 0 } } };
    } else if (hasInventory === 'false') {
      where.OR = [
        { inventory: { none: {} } },
        { inventory: { every: { quantityOnHand: 0 } } },
      ];
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          _count: { select: { inventory: true } },
        },
        orderBy: { code: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.location.count({ where }),
    ]);

    res.json({
      data: locations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // ============================================
  // SUMMARY & STATS
  // ============================================

  // Warehouse summary stats
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const [
      totalWarehouses,
      activeWarehouses,
      totalZones,
      totalLocations,
      inventoryValue,
    ] = await Promise.all([
      prisma.warehouse.count(),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.zone.count({ where: { isActive: true } }),
      prisma.location.count({ where: { isActive: true } }),
      prisma.inventory.aggregate({
        _sum: { quantityOnHand: true },
      }),
    ]);

    // Get warehouse breakdown
    const warehouseStats = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        _count: {
          select: {
            zones: true,
            inventory: true,
            orders: true,
          },
        },
      },
    });

    res.json({
      total: totalWarehouses,
      active: activeWarehouses,
      totalZones,
      totalLocations,
      totalInventoryUnits: inventoryValue._sum.quantityOnHand || 0,
      warehouses: warehouseStats.map(w => ({
        id: w.id,
        code: w.code,
        name: w.name,
        zones: w._count.zones,
        inventoryRecords: w._count.inventory,
        orders: w._count.orders,
      })),
    });
  }));

  return router;
}
