import express from 'express';

const router = express.Router();

export default function createCycleCountRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // CYCLE COUNTS
  // ============================================

  // List cycle counts
  router.get('/', asyncHandler(async (req, res) => {
    const { warehouseId, status, type, page = 1, limit = 20 } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [cycleCounts, total] = await Promise.all([
      prisma.cycleCount.findMany({
        where,
        include: {
          warehouse: { select: { code: true, name: true } },
          createdBy: { select: { fullName: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.cycleCount.count({ where }),
    ]);

    res.json({
      data: cycleCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get cycle count by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cycleCount = await prisma.cycleCount.findUnique({
      where: { id },
      include: {
        warehouse: { select: { code: true, name: true } },
        createdBy: { select: { fullName: true } },
        lines: {
          include: {
            location: { select: { code: true, type: true } },
            product: { select: { sku: true, name: true } },
            countedBy: { select: { fullName: true } },
          },
          orderBy: [
            { location: { code: 'asc' } },
            { product: { sku: 'asc' } },
          ],
        },
      },
    });

    if (!cycleCount) {
      return res.status(404).json({ error: 'Cycle count not found' });
    }

    res.json(cycleCount);
  }));

  // Create cycle count
  router.post('/', asyncHandler(async (req, res) => {
    const { warehouseId, type, scheduledDate, locations, products, zoneId, velocityCode, notes, userId } = req.body;

    if (!warehouseId) {
      return res.status(400).json({ error: 'warehouseId is required' });
    }

    // Generate count number
    const lastCount = await prisma.cycleCount.findFirst({
      where: { warehouseId },
      orderBy: { createdAt: 'desc' },
      select: { countNumber: true },
    });

    let nextNum = 1;
    if (lastCount) {
      const parts = lastCount.countNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const countNumber = `CC-${new Date().getFullYear()}-${nextNum.toString().padStart(6, '0')}`;

    // Build location/product selection criteria
    let inventoryWhere = { warehouseId };

    if (locations && locations.length > 0) {
      inventoryWhere.locationId = { in: locations };
    } else if (zoneId) {
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId },
        include: { locations: { select: { id: true } } },
      });
      if (zone) {
        inventoryWhere.locationId = { in: zone.locations.map(l => l.id) };
      }
    }

    if (products && products.length > 0) {
      inventoryWhere.productId = { in: products };
    } else if (velocityCode) {
      const prods = await prisma.product.findMany({
        where: { velocityCode },
        select: { id: true },
      });
      inventoryWhere.productId = { in: prods.map(p => p.id) };
    }

    // Get inventory to count
    const inventory = await prisma.inventory.findMany({
      where: inventoryWhere,
      include: {
        location: { select: { id: true, code: true } },
        product: { select: { id: true, sku: true } },
      },
    });

    if (inventory.length === 0) {
      return res.status(400).json({ error: 'No inventory found matching criteria' });
    }

    // Create cycle count with lines
    const cycleCount = await prisma.cycleCount.create({
      data: {
        countNumber,
        warehouseId,
        type: type || 'STANDARD',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'NEW',
        totalLocations: new Set(inventory.map(i => i.locationId)).size,
        notes,
        createdById: userId,
        lines: {
          create: inventory.map(inv => ({
            locationId: inv.locationId,
            productId: inv.productId,
            systemQuantity: inv.quantityOnHand,
            lotNumber: inv.lotNumber,
            status: 'PENDING',
          })),
        },
      },
      include: {
        warehouse: { select: { code: true, name: true } },
        lines: {
          include: {
            location: { select: { code: true } },
            product: { select: { sku: true, name: true } },
          },
        },
      },
    });

    res.status(201).json(cycleCount);
  }));

  // Start cycle count
  router.patch('/:id/start', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cycleCount = await prisma.cycleCount.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    res.json(cycleCount);
  }));

  // Record count for a line
  router.post('/:id/count', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lineId, countedQuantity, lotNumber, serialNumber, notes, userId } = req.body;

    if (lineId === undefined || countedQuantity === undefined) {
      return res.status(400).json({ error: 'lineId and countedQuantity are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the line
      const line = await tx.cycleCountLine.findUnique({
        where: { id: lineId },
      });

      if (!line) {
        throw new Error('Cycle count line not found');
      }

      // Calculate variance
      const variance = countedQuantity - line.systemQuantity;

      // Update line
      const updatedLine = await tx.cycleCountLine.update({
        where: { id: lineId },
        data: {
          countedQuantity,
          variance,
          lotNumber: lotNumber || line.lotNumber,
          serialNumber,
          status: 'COUNTED',
          countedAt: new Date(),
          countedById: userId,
          notes,
        },
      });

      // Update cycle count progress
      const allLines = await tx.cycleCountLine.findMany({
        where: { cycleCountId: id },
      });

      const countedLines = allLines.filter(l => l.status !== 'PENDING');
      const discrepancies = allLines.filter(l => l.variance && l.variance !== 0);

      await tx.cycleCount.update({
        where: { id },
        data: {
          countedLocations: new Set(countedLines.map(l => l.locationId)).size,
          discrepancies: discrepancies.length,
        },
      });

      return updatedLine;
    });

    res.json(result);
  }));

  // Request recount for a line
  router.patch('/:id/recount/:lineId', asyncHandler(async (req, res) => {
    const { lineId } = req.params;
    const { reason } = req.body;

    const line = await prisma.cycleCountLine.update({
      where: { id: lineId },
      data: {
        status: 'PENDING',
        countedQuantity: null,
        variance: null,
        countedAt: null,
        countedById: null,
        notes: reason ? `Recount requested: ${reason}` : 'Recount requested',
      },
    });

    res.json(line);
  }));

  // Submit for approval
  router.patch('/:id/submit', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check all lines are counted
    const pendingLines = await prisma.cycleCountLine.count({
      where: { cycleCountId: id, status: 'PENDING' },
    });

    if (pendingLines > 0) {
      return res.status(400).json({
        error: `Cannot submit - ${pendingLines} lines still pending`,
      });
    }

    const cycleCount = await prisma.cycleCount.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    });

    res.json(cycleCount);
  }));

  // Approve cycle count (apply adjustments)
  router.patch('/:id/approve', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId, adjustAll } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const cycleCount = await tx.cycleCount.findUnique({
        where: { id },
        include: {
          lines: {
            where: adjustAll ? {} : { variance: { not: 0 } },
            include: {
              location: true,
              product: true,
            },
          },
          warehouse: true,
        },
      });

      if (!cycleCount) {
        throw new Error('Cycle count not found');
      }

      // Get system user
      const systemUser = await tx.user.findFirst({
        where: { role: 'ADMIN' },
      });

      // Apply adjustments for lines with variances
      for (const line of cycleCount.lines) {
        if (line.variance === 0) continue;

        // Find inventory record
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: line.productId,
            locationId: line.locationId,
            lotNumber: line.lotNumber || null,
          },
        });

        if (inventory) {
          const newQuantity = line.countedQuantity;
          const adjustment = newQuantity - inventory.quantityOnHand;

          // Update inventory
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantityOnHand: newQuantity,
              quantityAvailable: newQuantity - inventory.quantityAllocated,
              lastCountedAt: new Date(),
            },
          });

          // Create adjustment transaction
          await tx.inventoryTransaction.create({
            data: {
              transactionType: adjustment > 0 ? 'ADJUST_IN' : 'ADJUST_OUT',
              productId: line.productId,
              locationId: line.locationId,
              inventoryId: inventory.id,
              quantity: Math.abs(adjustment),
              quantityBefore: inventory.quantityOnHand,
              quantityAfter: newQuantity,
              lotNumber: line.lotNumber,
              referenceType: 'CYCLE_COUNT',
              referenceId: id,
              referenceNumber: cycleCount.countNumber,
              reason: `Cycle count adjustment`,
              userId: systemUser?.id || userId,
            },
          });

          // Update line status
          await tx.cycleCountLine.update({
            where: { id: line.id },
            data: { status: 'ADJUSTED' },
          });
        }

        // Update location last count date
        await tx.location.update({
          where: { id: line.locationId },
          data: { lastCountDate: new Date() },
        });
      }

      // Update cycle count status
      const updated = await tx.cycleCount.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update non-variance lines to approved
      await tx.cycleCountLine.updateMany({
        where: { cycleCountId: id, variance: 0 },
        data: { status: 'APPROVED' },
      });

      return updated;
    });

    res.json(result);
  }));

  // Cancel cycle count
  router.patch('/:id/cancel', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const cycleCount = await prisma.cycleCount.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
      },
    });

    res.json(cycleCount);
  }));

  // ============================================
  // REPORTS & ANALYTICS
  // ============================================

  // Get discrepancies
  router.get('/:id/discrepancies', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lines = await prisma.cycleCountLine.findMany({
      where: {
        cycleCountId: id,
        variance: { not: 0 },
      },
      include: {
        location: { select: { code: true, type: true } },
        product: { select: { sku: true, name: true, cost: true } },
        countedBy: { select: { fullName: true } },
      },
      orderBy: [
        { variance: 'desc' },
      ],
    });

    // Calculate totals
    const totalVariance = lines.reduce((sum, l) => sum + (l.variance || 0), 0);
    const totalValue = lines.reduce((sum, l) => {
      const cost = l.product.cost ? parseFloat(l.product.cost) : 0;
      return sum + (l.variance || 0) * cost;
    }, 0);

    res.json({
      lines,
      summary: {
        totalDiscrepancies: lines.length,
        totalVariance,
        totalValue: totalValue.toFixed(2),
        positiveVariances: lines.filter(l => l.variance > 0).length,
        negativeVariances: lines.filter(l => l.variance < 0).length,
      },
    });
  }));

  // Summary
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeCount,
      completedThisMonth,
      pendingApproval,
      averageAccuracy,
    ] = await Promise.all([
      prisma.cycleCount.count({
        where: { ...where, status: 'IN_PROGRESS' },
      }),
      prisma.cycleCount.count({
        where: { ...where, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.cycleCount.count({
        where: { ...where, status: 'PENDING_APPROVAL' },
      }),
      prisma.cycleCountLine.aggregate({
        where: {
          cycleCount: where,
          status: { in: ['APPROVED', 'ADJUSTED'] },
          createdAt: { gte: thirtyDaysAgo },
        },
        _avg: {
          variance: true,
        },
      }),
    ]);

    // Get locations needing count (not counted in 30 days)
    const locationsNeedingCount = await prisma.location.count({
      where: {
        zone: { warehouseId: warehouseId || undefined },
        OR: [
          { lastCountDate: null },
          { lastCountDate: { lt: thirtyDaysAgo } },
        ],
        isActive: true,
      },
    });

    res.json({
      activeCount,
      completedThisMonth,
      pendingApproval,
      locationsNeedingCount,
      averageVariance: averageAccuracy._avg?.variance?.toFixed(2) || '0',
    });
  }));

  return router;
}
