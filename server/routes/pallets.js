import express from 'express';

const router = express.Router();

export default function createPalletRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // Generate pallet ID (LPN - License Plate Number)
  const generatePalletId = () => {
    const prefix = 'PLT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  // ============================================
  // PALLET CRUD & SEARCH
  // ============================================

  // List pallets with filters
  router.get('/', asyncHandler(async (req, res) => {
    const {
      warehouseId,
      locationId,
      zoneId,
      productId,
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter for inventory records that represent pallets
    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (locationId) where.locationId = locationId;
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (zoneId) {
      where.location = { zoneId };
    }
    if (search) {
      where.OR = [
        { lpn: { contains: search, mode: 'insensitive' } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { location: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Only get records with LPN (pallet identifier)
    where.lpn = { not: null };

    const [pallets, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true, uom: true } },
          location: {
            select: {
              id: true,
              code: true,
              type: true,
              zone: { select: { id: true, code: true, name: true } },
            }
          },
          warehouse: { select: { id: true, code: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.inventory.count({ where }),
    ]);

    res.json({
      data: pallets.map(p => ({
        id: p.id,
        lpn: p.lpn,
        product: p.product,
        location: p.location,
        warehouse: p.warehouse,
        quantityOnHand: p.quantityOnHand,
        quantityAllocated: p.quantityAllocated,
        quantityAvailable: p.quantityAvailable,
        lotNumber: p.lotNumber,
        expirationDate: p.expirationDate,
        status: p.status,
        lastReceivedAt: p.lastReceivedAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get pallet by LPN
  router.get('/lpn/:lpn', asyncHandler(async (req, res) => {
    const { lpn } = req.params;

    const pallet = await prisma.inventory.findFirst({
      where: { lpn },
      include: {
        product: { select: { id: true, sku: true, name: true, uom: true, cost: true } },
        location: {
          select: {
            id: true,
            code: true,
            type: true,
            aisle: true,
            bay: true,
            level: true,
            position: true,
            zone: { select: { id: true, code: true, name: true } },
          }
        },
        warehouse: { select: { id: true, code: true, name: true } },
      },
    });

    if (!pallet) {
      return res.status(404).json({ error: 'Pallet not found' });
    }

    // Get recent transactions for this pallet
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { inventoryId: pallet.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { fullName: true } },
        fromLocation: { select: { code: true } },
        toLocation: { select: { code: true } },
      },
    });

    res.json({
      ...pallet,
      transactions,
    });
  }));

  // Get pallet by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const pallet = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, sku: true, name: true, uom: true, cost: true } },
        location: {
          select: {
            id: true,
            code: true,
            type: true,
            aisle: true,
            bay: true,
            level: true,
            position: true,
            zone: { select: { id: true, code: true, name: true } },
          }
        },
        warehouse: { select: { id: true, code: true, name: true } },
      },
    });

    if (!pallet || !pallet.lpn) {
      return res.status(404).json({ error: 'Pallet not found' });
    }

    res.json(pallet);
  }));

  // Create new pallet (palletize inventory)
  router.post('/', asyncHandler(async (req, res) => {
    const {
      warehouseId,
      locationId,
      productId,
      quantity,
      lotNumber,
      expirationDate,
      lpn,
      userId,
    } = req.body;

    if (!warehouseId || !locationId || !productId || !quantity) {
      return res.status(400).json({
        error: 'warehouseId, locationId, productId, and quantity are required'
      });
    }

    const palletLpn = lpn || generatePalletId();

    // Check if LPN already exists
    if (lpn) {
      const existing = await prisma.inventory.findFirst({
        where: { lpn },
      });
      if (existing) {
        return res.status(409).json({ error: 'LPN already exists' });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create inventory record for the pallet
      const pallet = await tx.inventory.create({
        data: {
          warehouseId,
          locationId,
          productId,
          lpn: palletLpn,
          quantityOnHand: parseInt(quantity),
          quantityAllocated: 0,
          quantityAvailable: parseInt(quantity),
          lotNumber,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          status: 'AVAILABLE',
          lastReceivedAt: new Date(),
        },
        include: {
          product: { select: { sku: true, name: true } },
          location: { select: { code: true } },
        },
      });

      // Create transaction record
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: pallet.id,
          productId,
          toLocationId: locationId,
          type: 'RECEIVE',
          quantity: parseInt(quantity),
          quantityBefore: 0,
          quantityAfter: parseInt(quantity),
          reason: 'Pallet created',
          reference: palletLpn,
          userId,
        },
      });

      return pallet;
    });

    res.status(201).json({
      ...result,
      message: 'Pallet created successfully',
    });
  }));

  // ============================================
  // PALLET MOVE OPERATIONS (ISPMA, IRMMV)
  // ============================================

  // Move pallet to new location
  router.post('/:id/move', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { toLocationId, toPosition, reason, userId, printLabel = true } = req.body;

    if (!toLocationId) {
      return res.status(400).json({ error: 'toLocationId is required' });
    }

    const pallet = await prisma.inventory.findUnique({
      where: { id },
      include: {
        location: { select: { id: true, code: true } },
        product: { select: { sku: true, name: true } },
      },
    });

    if (!pallet || !pallet.lpn) {
      return res.status(404).json({ error: 'Pallet not found' });
    }

    if (pallet.quantityAllocated > 0) {
      return res.status(400).json({
        error: 'Cannot move pallet with allocated quantity',
        allocated: pallet.quantityAllocated,
      });
    }

    const fromLocationId = pallet.locationId;

    // Get destination location details
    const toLocation = await prisma.location.findUnique({
      where: { id: toLocationId },
      select: { id: true, code: true, type: true, zone: { select: { code: true } } },
    });

    if (!toLocation) {
      return res.status(404).json({ error: 'Destination location not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update pallet location
      const updatedPallet = await tx.inventory.update({
        where: { id },
        data: {
          locationId: toLocationId,
          position: toPosition || null,
          updatedAt: new Date(),
        },
        include: {
          location: { select: { id: true, code: true, type: true } },
          product: { select: { sku: true, name: true } },
        },
      });

      // Create move transaction
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: id,
          productId: pallet.productId,
          fromLocationId,
          toLocationId,
          type: 'MOVE',
          quantity: pallet.quantityOnHand,
          quantityBefore: pallet.quantityOnHand,
          quantityAfter: pallet.quantityOnHand,
          reason: reason || 'Pallet move',
          reference: pallet.lpn,
          userId,
        },
      });

      return updatedPallet;
    });

    // Generate label data (mock - in real system would print to label printer)
    const labelData = printLabel ? {
      lpn: pallet.lpn,
      sku: pallet.product.sku,
      productName: pallet.product.name,
      quantity: pallet.quantityOnHand,
      fromLocation: pallet.location.code,
      toLocation: toLocation.code,
      movedAt: new Date().toISOString(),
      barcode: pallet.lpn,
    } : null;

    res.json({
      success: true,
      pallet: result,
      move: {
        fromLocation: pallet.location.code,
        toLocation: toLocation.code,
        quantity: pallet.quantityOnHand,
      },
      label: labelData,
    });
  }));

  // Move pallet to pick slot (primary or alternate)
  router.post('/:id/move-to-pick', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { slotType = 'PRIMARY', userId, printLabel = true } = req.body;

    const pallet = await prisma.inventory.findUnique({
      where: { id },
      include: {
        location: { select: { id: true, code: true, type: true } },
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            primaryLocationId: true,
            alternateLocationId: true,
          }
        },
      },
    });

    if (!pallet || !pallet.lpn) {
      return res.status(404).json({ error: 'Pallet not found' });
    }

    // Determine target location based on slot type
    let targetLocationId;
    if (slotType === 'PRIMARY') {
      targetLocationId = pallet.product.primaryLocationId;
    } else if (slotType === 'ALTERNATE') {
      targetLocationId = pallet.product.alternateLocationId;
    }

    if (!targetLocationId) {
      return res.status(400).json({
        error: `No ${slotType.toLowerCase()} pick slot configured for this product`
      });
    }

    // Check if already at target location
    if (pallet.locationId === targetLocationId) {
      return res.status(400).json({ error: 'Pallet is already at the pick slot' });
    }

    const targetLocation = await prisma.location.findUnique({
      where: { id: targetLocationId },
      select: { id: true, code: true, type: true },
    });

    const fromLocationId = pallet.locationId;

    const result = await prisma.$transaction(async (tx) => {
      const updatedPallet = await tx.inventory.update({
        where: { id },
        data: {
          locationId: targetLocationId,
          updatedAt: new Date(),
        },
        include: {
          location: { select: { id: true, code: true, type: true } },
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: id,
          productId: pallet.productId,
          fromLocationId,
          toLocationId: targetLocationId,
          type: 'MOVE',
          quantity: pallet.quantityOnHand,
          quantityBefore: pallet.quantityOnHand,
          quantityAfter: pallet.quantityOnHand,
          reason: `Move to ${slotType.toLowerCase()} pick slot`,
          reference: pallet.lpn,
          userId,
        },
      });

      return updatedPallet;
    });

    const labelData = printLabel ? {
      lpn: pallet.lpn,
      sku: pallet.product.sku,
      productName: pallet.product.name,
      quantity: pallet.quantityOnHand,
      fromLocation: pallet.location.code,
      toLocation: targetLocation.code,
      slotType,
      movedAt: new Date().toISOString(),
    } : null;

    res.json({
      success: true,
      pallet: result,
      slotType,
      label: labelData,
    });
  }));

  // Bulk move pallets
  router.post('/move-all', asyncHandler(async (req, res) => {
    const { palletIds, toLocationId, reason, userId, printLabels = true } = req.body;

    if (!palletIds || !Array.isArray(palletIds) || palletIds.length === 0) {
      return res.status(400).json({ error: 'palletIds array is required' });
    }

    if (!toLocationId) {
      return res.status(400).json({ error: 'toLocationId is required' });
    }

    const toLocation = await prisma.location.findUnique({
      where: { id: toLocationId },
      select: { id: true, code: true, type: true },
    });

    if (!toLocation) {
      return res.status(404).json({ error: 'Destination location not found' });
    }

    const results = [];
    const errors = [];

    for (const palletId of palletIds) {
      try {
        const pallet = await prisma.inventory.findUnique({
          where: { id: palletId },
          include: {
            location: { select: { id: true, code: true } },
            product: { select: { sku: true, name: true } },
          },
        });

        if (!pallet || !pallet.lpn) {
          errors.push({ palletId, error: 'Pallet not found' });
          continue;
        }

        if (pallet.quantityAllocated > 0) {
          errors.push({ palletId, lpn: pallet.lpn, error: 'Has allocated quantity' });
          continue;
        }

        const fromLocationId = pallet.locationId;

        await prisma.$transaction(async (tx) => {
          await tx.inventory.update({
            where: { id: palletId },
            data: {
              locationId: toLocationId,
              updatedAt: new Date(),
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              inventoryId: palletId,
              productId: pallet.productId,
              fromLocationId,
              toLocationId,
              type: 'MOVE',
              quantity: pallet.quantityOnHand,
              quantityBefore: pallet.quantityOnHand,
              quantityAfter: pallet.quantityOnHand,
              reason: reason || 'Bulk pallet move',
              reference: pallet.lpn,
              userId,
            },
          });
        });

        results.push({
          palletId,
          lpn: pallet.lpn,
          fromLocation: pallet.location.code,
          toLocation: toLocation.code,
          quantity: pallet.quantityOnHand,
        });
      } catch (err) {
        errors.push({ palletId, error: err.message });
      }
    }

    // Generate labels for all moved pallets
    const labels = printLabels ? results.map(r => ({
      lpn: r.lpn,
      fromLocation: r.fromLocation,
      toLocation: r.toLocation,
      quantity: r.quantity,
      movedAt: new Date().toISOString(),
    })) : [];

    res.json({
      success: true,
      moved: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      labels,
    });
  }));

  // ============================================
  // PALLET PRIORITY & STATUS (IRMMV)
  // ============================================

  // Update pallet priority
  router.patch('/:id/priority', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { priority, reason, userId } = req.body;

    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Invalid priority',
        validPriorities,
      });
    }

    const pallet = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!pallet || !pallet.lpn) {
      return res.status(404).json({ error: 'Pallet not found' });
    }

    // Update any associated tasks
    const updatedTasks = await prisma.task.updateMany({
      where: {
        OR: [
          { fromLocationId: pallet.locationId, productId: pallet.productId },
          { toLocationId: pallet.locationId, productId: pallet.productId },
        ],
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      data: {
        priority,
        notes: reason ? `Priority updated: ${reason}` : undefined,
      },
    });

    res.json({
      success: true,
      lpn: pallet.lpn,
      newPriority: priority,
      tasksUpdated: updatedTasks.count,
    });
  }));

  // Update pallet status
  router.patch('/:id/status', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason, userId } = req.body;

    const validStatuses = ['AVAILABLE', 'ALLOCATED', 'ON_HOLD', 'DAMAGED', 'QC_HOLD', 'QUARANTINE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses,
      });
    }

    const pallet = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: { select: { sku: true, name: true } },
      },
    });

    if (!pallet || !pallet.lpn) {
      return res.status(404).json({ error: 'Pallet not found' });
    }

    const previousStatus = pallet.status;

    const updatedPallet = await prisma.inventory.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Create audit record via transaction
    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: id,
        productId: pallet.productId,
        type: 'STATUS_CHANGE',
        quantity: 0,
        quantityBefore: pallet.quantityOnHand,
        quantityAfter: pallet.quantityOnHand,
        reason: reason || `Status changed from ${previousStatus} to ${status}`,
        reference: pallet.lpn,
        userId,
      },
    });

    res.json({
      success: true,
      lpn: pallet.lpn,
      previousStatus,
      newStatus: status,
    });
  }));

  // ============================================
  // PALLET LABELS
  // ============================================

  // Generate/print pallet label
  router.post('/:id/label', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { labelType = 'STANDARD', copies = 1 } = req.body;

    const pallet = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            uom: true,
            description: true,
          }
        },
        location: {
          select: {
            code: true,
            aisle: true,
            bay: true,
            level: true,
            zone: { select: { code: true } },
          }
        },
        warehouse: { select: { code: true, name: true } },
      },
    });

    if (!pallet || !pallet.lpn) {
      return res.status(404).json({ error: 'Pallet not found' });
    }

    // Generate label data based on type
    const labelData = {
      lpn: pallet.lpn,
      barcodeData: pallet.lpn,
      barcodeType: 'CODE128',
      sku: pallet.product.sku,
      productName: pallet.product.name,
      uom: pallet.product.uom,
      quantity: pallet.quantityOnHand,
      location: pallet.location.code,
      zone: pallet.location.zone?.code,
      warehouse: pallet.warehouse.code,
      lotNumber: pallet.lotNumber,
      expirationDate: pallet.expirationDate?.toISOString().split('T')[0],
      printedAt: new Date().toISOString(),
      copies,
    };

    // Additional fields for move labels
    if (labelType === 'MOVE') {
      labelData.labelType = 'MOVE';
      // These would be populated from the move request
    }

    // Mock print job - in real system would send to label printer
    const printJob = {
      jobId: `LBL-${Date.now()}`,
      status: 'QUEUED',
      printer: 'LABEL_PRINTER_1',
      labelType,
      copies,
      queuedAt: new Date().toISOString(),
    };

    res.json({
      label: labelData,
      printJob,
      message: 'Label generated (mock - would print to label printer)',
    });
  }));

  // ============================================
  // PALLETS TO MOVE SUGGESTIONS
  // ============================================

  // Get pallets available to move to pick slots
  router.get('/suggestions/to-pick', asyncHandler(async (req, res) => {
    const { warehouseId, productId, limit = 10 } = req.query;

    // Find products with pick slots that need replenishment
    const productsNeedingReplen = await prisma.product.findMany({
      where: {
        isActive: true,
        primaryLocationId: { not: null },
        ...(productId && { id: productId }),
      },
      select: {
        id: true,
        sku: true,
        name: true,
        primaryLocationId: true,
        alternateLocationId: true,
        replenishmentMin: true,
      },
      take: parseInt(limit),
    });

    const suggestions = [];

    for (const product of productsNeedingReplen) {
      // Check current pick slot inventory
      const pickSlotInventory = await prisma.inventory.aggregate({
        where: {
          productId: product.id,
          locationId: product.primaryLocationId,
        },
        _sum: { quantityAvailable: true },
      });

      const currentQty = pickSlotInventory._sum.quantityAvailable || 0;
      const minQty = product.replenishmentMin || 0;

      if (currentQty <= minQty) {
        // Find pallets in reserve/bulk locations
        const availablePallets = await prisma.inventory.findMany({
          where: {
            productId: product.id,
            lpn: { not: null },
            quantityAvailable: { gt: 0 },
            locationId: { not: product.primaryLocationId },
            location: {
              type: { in: ['BULK', 'RESERVE', 'PUTAWAY'] },
              ...(warehouseId && { zone: { warehouseId } }),
            },
          },
          include: {
            location: { select: { code: true, type: true } },
          },
          orderBy: [
            { expirationDate: 'asc' }, // FEFO
            { lastReceivedAt: 'asc' }, // FIFO
          ],
          take: 3,
        });

        if (availablePallets.length > 0) {
          suggestions.push({
            product: {
              id: product.id,
              sku: product.sku,
              name: product.name,
            },
            pickSlotQty: currentQty,
            minQty,
            needsQty: minQty - currentQty,
            availablePallets: availablePallets.map(p => ({
              id: p.id,
              lpn: p.lpn,
              location: p.location.code,
              locationType: p.location.type,
              quantity: p.quantityAvailable,
              expirationDate: p.expirationDate,
            })),
          });
        }
      }
    }

    res.json({
      suggestions,
      count: suggestions.length,
      message: suggestions.length === 0
        ? 'No pallets available to move to pick slots'
        : undefined,
    });
  }));

  // ============================================
  // SUMMARY & STATS
  // ============================================

  // Pallet summary stats
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = { lpn: { not: null } };
    if (warehouseId) where.warehouseId = warehouseId;

    const [
      totalPallets,
      byStatus,
      byZone,
      recentMoves,
    ] = await Promise.all([
      prisma.inventory.count({ where }),
      prisma.inventory.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { quantityOnHand: true },
      }),
      prisma.inventory.groupBy({
        by: ['locationId'],
        where,
        _count: true,
      }),
      prisma.inventoryTransaction.findMany({
        where: {
          type: 'MOVE',
          reference: { startsWith: 'PLT' },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          fromLocation: { select: { code: true } },
          toLocation: { select: { code: true } },
          user: { select: { fullName: true } },
        },
      }),
    ]);

    res.json({
      totalPallets,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        totalUnits: s._sum.quantityOnHand || 0,
      })),
      locationCount: byZone.length,
      recentMoves: recentMoves.map(m => ({
        reference: m.reference,
        fromLocation: m.fromLocation?.code,
        toLocation: m.toLocation?.code,
        quantity: m.quantity,
        movedBy: m.user?.fullName,
        movedAt: m.createdAt,
      })),
    });
  }));

  return router;
}
