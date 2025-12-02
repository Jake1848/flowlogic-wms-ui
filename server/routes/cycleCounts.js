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

  // ============================================
  // CYCLE COUNT CRITERIA MAINTENANCE (IICCA)
  // ============================================

  // List cycle count criteria/rules
  router.get('/criteria/list', asyncHandler(async (req, res) => {
    const { warehouseId, isActive } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const criteria = await prisma.cycleCountCriteria.findMany({
      where,
      include: {
        warehouse: { select: { code: true, name: true } },
      },
      orderBy: { cycleClass: 'asc' },
    });

    res.json(criteria);
  }));

  // Get cycle count criteria by ID
  router.get('/criteria/:criteriaId', asyncHandler(async (req, res) => {
    const { criteriaId } = req.params;

    const criteria = await prisma.cycleCountCriteria.findUnique({
      where: { id: criteriaId },
      include: {
        warehouse: { select: { code: true, name: true } },
      },
    });

    if (!criteria) {
      return res.status(404).json({ error: 'Cycle count criteria not found' });
    }

    res.json(criteria);
  }));

  // Create cycle count criteria (IICCA - Add)
  router.post('/criteria', asyncHandler(async (req, res) => {
    const {
      warehouseId,
      cycleClass,
      name,
      description,
      countFrequencyDays,
      minCost,
      maxCost,
      minShippedQty,
      maxShippedQty,
      velocityCodes,
      productCategories,
      locationTypes,
      isActive,
    } = req.body;

    if (!warehouseId || !cycleClass || !countFrequencyDays) {
      return res.status(400).json({
        error: 'warehouseId, cycleClass, and countFrequencyDays are required'
      });
    }

    // Check for duplicate class in warehouse
    const existing = await prisma.cycleCountCriteria.findFirst({
      where: { warehouseId, cycleClass },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Cycle class already exists for this warehouse'
      });
    }

    const criteria = await prisma.cycleCountCriteria.create({
      data: {
        warehouseId,
        cycleClass: cycleClass.toUpperCase(),
        name: name || `Class ${cycleClass}`,
        description,
        countFrequencyDays: parseInt(countFrequencyDays),
        minCost: minCost ? parseFloat(minCost) : null,
        maxCost: maxCost ? parseFloat(maxCost) : null,
        minShippedQty: minShippedQty ? parseInt(minShippedQty) : null,
        maxShippedQty: maxShippedQty ? parseInt(maxShippedQty) : null,
        velocityCodes: velocityCodes || [],
        productCategories: productCategories || [],
        locationTypes: locationTypes || [],
        isActive: isActive !== false,
      },
    });

    res.status(201).json(criteria);
  }));

  // Update cycle count criteria (IICCA - Modify)
  router.put('/criteria/:criteriaId', asyncHandler(async (req, res) => {
    const { criteriaId } = req.params;
    const updateData = { ...req.body };

    delete updateData.id;
    delete updateData.warehouseId;
    delete updateData.cycleClass;
    delete updateData.createdAt;

    if (updateData.countFrequencyDays) {
      updateData.countFrequencyDays = parseInt(updateData.countFrequencyDays);
    }
    if (updateData.minCost !== undefined) {
      updateData.minCost = updateData.minCost ? parseFloat(updateData.minCost) : null;
    }
    if (updateData.maxCost !== undefined) {
      updateData.maxCost = updateData.maxCost ? parseFloat(updateData.maxCost) : null;
    }
    if (updateData.minShippedQty !== undefined) {
      updateData.minShippedQty = updateData.minShippedQty ? parseInt(updateData.minShippedQty) : null;
    }
    if (updateData.maxShippedQty !== undefined) {
      updateData.maxShippedQty = updateData.maxShippedQty ? parseInt(updateData.maxShippedQty) : null;
    }

    const criteria = await prisma.cycleCountCriteria.update({
      where: { id: criteriaId },
      data: updateData,
    });

    res.json(criteria);
  }));

  // Delete cycle count criteria
  router.delete('/criteria/:criteriaId', asyncHandler(async (req, res) => {
    const { criteriaId } = req.params;

    await prisma.cycleCountCriteria.delete({
      where: { id: criteriaId },
    });

    res.json({ success: true });
  }));

  // Generate cycle counts from criteria (IICCA - Generate)
  router.post('/criteria/:criteriaId/generate', asyncHandler(async (req, res) => {
    const { criteriaId } = req.params;
    const { userId, maxLocations = 100 } = req.body;

    const criteria = await prisma.cycleCountCriteria.findUnique({
      where: { id: criteriaId },
      include: {
        warehouse: true,
      },
    });

    if (!criteria) {
      return res.status(404).json({ error: 'Cycle count criteria not found' });
    }

    if (!criteria.isActive) {
      return res.status(400).json({ error: 'Criteria is not active' });
    }

    // Calculate the date threshold for locations needing count
    const countThreshold = new Date();
    countThreshold.setDate(countThreshold.getDate() - criteria.countFrequencyDays);

    // Build location filter based on criteria
    const locationWhere = {
      zone: { warehouseId: criteria.warehouseId },
      isActive: true,
      OR: [
        { lastCountDate: null },
        { lastCountDate: { lt: countThreshold } },
      ],
    };

    if (criteria.locationTypes && criteria.locationTypes.length > 0) {
      locationWhere.type = { in: criteria.locationTypes };
    }

    // Build product filter
    const productWhere = { isActive: true };
    if (criteria.velocityCodes && criteria.velocityCodes.length > 0) {
      productWhere.velocityCode = { in: criteria.velocityCodes };
    }
    if (criteria.productCategories && criteria.productCategories.length > 0) {
      productWhere.categoryId = { in: criteria.productCategories };
    }
    if (criteria.minCost !== null || criteria.maxCost !== null) {
      productWhere.cost = {};
      if (criteria.minCost !== null) productWhere.cost.gte = criteria.minCost;
      if (criteria.maxCost !== null) productWhere.cost.lte = criteria.maxCost;
    }

    // Find inventory matching criteria
    const inventory = await prisma.inventory.findMany({
      where: {
        warehouseId: criteria.warehouseId,
        location: locationWhere,
        product: productWhere,
        quantityOnHand: { gt: 0 },
      },
      include: {
        location: { select: { id: true, code: true } },
        product: { select: { id: true, sku: true } },
      },
      take: maxLocations,
    });

    if (inventory.length === 0) {
      return res.json({
        success: true,
        message: 'No locations found needing count based on criteria',
        cycleCountCreated: false,
      });
    }

    // Generate count number
    const lastCount = await prisma.cycleCount.findFirst({
      where: { warehouseId: criteria.warehouseId },
      orderBy: { createdAt: 'desc' },
      select: { countNumber: true },
    });

    let nextNum = 1;
    if (lastCount) {
      const parts = lastCount.countNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const countNumber = `CC-${new Date().getFullYear()}-${nextNum.toString().padStart(6, '0')}`;

    // Create cycle count
    const cycleCount = await prisma.cycleCount.create({
      data: {
        countNumber,
        warehouseId: criteria.warehouseId,
        type: 'CRITERIA',
        cycleClass: criteria.cycleClass,
        status: 'NEW',
        totalLocations: new Set(inventory.map(i => i.locationId)).size,
        notes: `Generated from criteria: ${criteria.name}`,
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
        _count: { select: { lines: true } },
      },
    });

    res.json({
      success: true,
      cycleCountCreated: true,
      countNumber: cycleCount.countNumber,
      totalLocations: cycleCount.totalLocations,
      totalLines: cycleCount._count.lines,
      criteria: criteria.name,
    });
  }));

  // ============================================
  // CYCLE COUNT TOLERANCE CRITERIA (CICCA)
  // ============================================

  // List tolerance criteria
  router.get('/tolerances/list', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};

    const tolerances = await prisma.cycleCountTolerance.findMany({
      where,
      include: {
        warehouse: { select: { code: true, name: true } },
      },
      orderBy: [
        { category: 'asc' },
        { toleranceQty: 'asc' },
      ],
    });

    res.json(tolerances);
  }));

  // Get tolerance by ID
  router.get('/tolerances/:toleranceId', asyncHandler(async (req, res) => {
    const { toleranceId } = req.params;

    const tolerance = await prisma.cycleCountTolerance.findUnique({
      where: { id: toleranceId },
    });

    if (!tolerance) {
      return res.status(404).json({ error: 'Tolerance criteria not found' });
    }

    res.json(tolerance);
  }));

  // Create tolerance criteria (CICCA - Add)
  router.post('/tolerances', asyncHandler(async (req, res) => {
    const {
      warehouseId,
      category,
      name,
      description,
      toleranceQty,
      tolerancePct,
      toleranceValue,
      cycleClasses,
      velocityCodes,
      autoApprove,
      requireRecount,
      recountThreshold,
    } = req.body;

    if (!warehouseId || !category) {
      return res.status(400).json({
        error: 'warehouseId and category are required'
      });
    }

    const tolerance = await prisma.cycleCountTolerance.create({
      data: {
        warehouseId,
        category: category.toUpperCase(),
        name: name || `Tolerance ${category}`,
        description,
        toleranceQty: toleranceQty ? parseInt(toleranceQty) : 0,
        tolerancePct: tolerancePct ? parseFloat(tolerancePct) : 0,
        toleranceValue: toleranceValue ? parseFloat(toleranceValue) : 0,
        cycleClasses: cycleClasses || [],
        velocityCodes: velocityCodes || [],
        autoApprove: autoApprove || false,
        requireRecount: requireRecount || false,
        recountThreshold: recountThreshold ? parseInt(recountThreshold) : null,
        isActive: true,
      },
    });

    res.status(201).json(tolerance);
  }));

  // Update tolerance criteria (CICCA - Modify)
  router.put('/tolerances/:toleranceId', asyncHandler(async (req, res) => {
    const { toleranceId } = req.params;
    const updateData = { ...req.body };

    delete updateData.id;
    delete updateData.warehouseId;
    delete updateData.createdAt;

    if (updateData.toleranceQty !== undefined) {
      updateData.toleranceQty = parseInt(updateData.toleranceQty);
    }
    if (updateData.tolerancePct !== undefined) {
      updateData.tolerancePct = parseFloat(updateData.tolerancePct);
    }
    if (updateData.toleranceValue !== undefined) {
      updateData.toleranceValue = parseFloat(updateData.toleranceValue);
    }
    if (updateData.recountThreshold !== undefined) {
      updateData.recountThreshold = updateData.recountThreshold ? parseInt(updateData.recountThreshold) : null;
    }

    const tolerance = await prisma.cycleCountTolerance.update({
      where: { id: toleranceId },
      data: updateData,
    });

    res.json(tolerance);
  }));

  // Delete tolerance criteria (CICCA - Delete)
  router.delete('/tolerances/:toleranceId', asyncHandler(async (req, res) => {
    const { toleranceId } = req.params;

    await prisma.cycleCountTolerance.delete({
      where: { id: toleranceId },
    });

    res.json({ success: true });
  }));

  // Check variance against tolerances
  router.post('/tolerances/check', asyncHandler(async (req, res) => {
    const { warehouseId, productId, variance, variancePct, varianceValue, cycleClass, velocityCode } = req.body;

    // Find applicable tolerances
    const tolerances = await prisma.cycleCountTolerance.findMany({
      where: {
        warehouseId,
        isActive: true,
      },
      orderBy: { toleranceQty: 'asc' },
    });

    // Find the first matching tolerance
    let matchedTolerance = null;
    let withinTolerance = false;
    let requiresRecount = false;
    let autoApprove = false;

    for (const tol of tolerances) {
      // Check if tolerance applies to this item
      const appliesToClass = !tol.cycleClasses?.length || tol.cycleClasses.includes(cycleClass);
      const appliesToVelocity = !tol.velocityCodes?.length || tol.velocityCodes.includes(velocityCode);

      if (appliesToClass && appliesToVelocity) {
        matchedTolerance = tol;

        // Check if variance is within tolerance
        const qtyWithin = tol.toleranceQty === 0 || Math.abs(variance) <= tol.toleranceQty;
        const pctWithin = tol.tolerancePct === 0 || Math.abs(variancePct) <= tol.tolerancePct;
        const valWithin = tol.toleranceValue === 0 || Math.abs(varianceValue) <= tol.toleranceValue;

        withinTolerance = qtyWithin && pctWithin && valWithin;
        autoApprove = withinTolerance && tol.autoApprove;

        // Check recount threshold
        if (tol.requireRecount && tol.recountThreshold) {
          requiresRecount = Math.abs(variance) > tol.recountThreshold;
        }

        break;
      }
    }

    res.json({
      variance,
      variancePct,
      varianceValue,
      matchedTolerance: matchedTolerance ? {
        category: matchedTolerance.category,
        name: matchedTolerance.name,
      } : null,
      withinTolerance,
      autoApprove,
      requiresRecount,
      recommendation: autoApprove ? 'AUTO_APPROVE' :
                      requiresRecount ? 'RECOUNT' :
                      withinTolerance ? 'APPROVE' : 'REVIEW',
    });
  }));

  // ============================================
  // SCHEDULED REFILL PROCESS (IBRPB)
  // ============================================

  // Get scheduled refill parameters
  router.get('/scheduled-refill/params', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    // In a real system, these would be stored in a settings table
    // For now, return default parameters
    const params = {
      warehouseId,
      defaultFrequencyDays: 30,
      classAFrequencyDays: 7,
      classBFrequencyDays: 14,
      classCFrequencyDays: 30,
      maxLocationsPerBatch: 100,
      autoSchedule: false,
      scheduleTime: '06:00',
      excludeWeekends: true,
      excludeHolidays: true,
    };

    res.json(params);
  }));

  // Update scheduled refill parameters (IBRPB - Modify)
  router.put('/scheduled-refill/params', asyncHandler(async (req, res) => {
    const { warehouseId } = req.body;
    // In a real system, these would be saved to a settings table
    res.json({
      success: true,
      message: 'Parameters updated (mock - would save to settings table)',
      params: req.body,
    });
  }));

  // Run scheduled refill batch process (IBRPB - Batch_process)
  router.post('/scheduled-refill/run', asyncHandler(async (req, res) => {
    const { warehouseId, cycleClass, maxLocations = 100, userId } = req.body;

    if (!warehouseId) {
      return res.status(400).json({ error: 'warehouseId is required' });
    }

    // Get criteria for the specified class or all classes
    const criteriaWhere = { warehouseId, isActive: true };
    if (cycleClass) {
      criteriaWhere.cycleClass = cycleClass;
    }

    const allCriteria = await prisma.cycleCountCriteria.findMany({
      where: criteriaWhere,
      orderBy: { countFrequencyDays: 'asc' },
    });

    if (allCriteria.length === 0) {
      return res.json({
        success: true,
        message: 'No active criteria found',
        countsGenerated: 0,
      });
    }

    const generatedCounts = [];

    for (const criteria of allCriteria) {
      // Check if already generated today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingToday = await prisma.cycleCount.count({
        where: {
          warehouseId,
          cycleClass: criteria.cycleClass,
          createdAt: { gte: today },
        },
      });

      if (existingToday > 0) {
        continue; // Skip if already generated today
      }

      // Calculate threshold date
      const countThreshold = new Date();
      countThreshold.setDate(countThreshold.getDate() - criteria.countFrequencyDays);

      // Find locations needing count
      const locationWhere = {
        zone: { warehouseId },
        isActive: true,
        OR: [
          { lastCountDate: null },
          { lastCountDate: { lt: countThreshold } },
        ],
      };

      if (criteria.locationTypes?.length > 0) {
        locationWhere.type = { in: criteria.locationTypes };
      }

      const inventory = await prisma.inventory.findMany({
        where: {
          warehouseId,
          location: locationWhere,
          quantityOnHand: { gt: 0 },
        },
        include: {
          location: { select: { id: true, code: true } },
          product: { select: { id: true, sku: true } },
        },
        take: maxLocations,
      });

      if (inventory.length === 0) continue;

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

      // Create cycle count
      const cycleCount = await prisma.cycleCount.create({
        data: {
          countNumber,
          warehouseId,
          type: 'SCHEDULED',
          cycleClass: criteria.cycleClass,
          status: 'NEW',
          totalLocations: new Set(inventory.map(i => i.locationId)).size,
          notes: `Scheduled refill: ${criteria.name}`,
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
      });

      generatedCounts.push({
        countNumber: cycleCount.countNumber,
        cycleClass: criteria.cycleClass,
        totalLocations: cycleCount.totalLocations,
      });
    }

    res.json({
      success: true,
      countsGenerated: generatedCounts.length,
      counts: generatedCounts,
    });
  }));

  // Print count books (IBRPB - Only_print)
  router.post('/scheduled-refill/print', asyncHandler(async (req, res) => {
    const { cycleCountId, format = 'PDF' } = req.body;

    const cycleCount = await prisma.cycleCount.findUnique({
      where: { id: cycleCountId },
      include: {
        warehouse: { select: { code: true, name: true } },
        lines: {
          include: {
            location: { select: { code: true, aisle: true, bay: true, level: true } },
            product: { select: { sku: true, name: true, uom: true } },
          },
          orderBy: [
            { location: { code: 'asc' } },
          ],
        },
      },
    });

    if (!cycleCount) {
      return res.status(404).json({ error: 'Cycle count not found' });
    }

    // In a real system, this would generate a PDF
    // For now, return the data that would be printed
    res.json({
      format,
      countNumber: cycleCount.countNumber,
      warehouse: cycleCount.warehouse,
      status: cycleCount.status,
      totalLocations: cycleCount.totalLocations,
      lines: cycleCount.lines.map(l => ({
        location: l.location.code,
        sku: l.product?.sku,
        productName: l.product?.name,
        uom: l.product?.uom,
        systemQty: cycleCount.type === 'BLIND' ? null : l.systemQuantity,
        countedQty: '_____',
        variance: '_____',
      })),
      printedAt: new Date().toISOString(),
      note: 'Mock print - would generate actual PDF/labels',
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
