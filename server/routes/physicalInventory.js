import express from 'express';

const router = express.Router();

export default function createPhysicalInventoryRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // PHYSICAL INVENTORY SETUP (FMPIA)
  // ============================================

  // List physical inventories
  router.get('/', asyncHandler(async (req, res) => {
    const { warehouseId, status, year, page = 1, limit = 20 } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
      where.scheduledDate = { gte: startOfYear, lte: endOfYear };
    }

    const [inventories, total] = await Promise.all([
      prisma.physicalInventory.findMany({
        where,
        include: {
          warehouse: { select: { id: true, code: true, name: true } },
          createdBy: { select: { fullName: true } },
          _count: { select: { countBooks: true } },
        },
        orderBy: { scheduledDate: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.physicalInventory.count({ where }),
    ]);

    res.json({
      data: inventories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get physical inventory by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const pi = await prisma.physicalInventory.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        createdBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
        countBooks: {
          include: {
            zone: { select: { code: true, name: true } },
            assignedTo: { select: { fullName: true } },
            _count: { select: { lines: true } },
          },
          orderBy: { bookNumber: 'asc' },
        },
      },
    });

    if (!pi) {
      return res.status(404).json({ error: 'Physical inventory not found' });
    }

    res.json(pi);
  }));

  // Create physical inventory setup
  router.post('/', asyncHandler(async (req, res) => {
    const {
      warehouseId,
      name,
      description,
      scheduledDate,
      countType,
      blindCount,
      locationsPerBook,
      varianceThresholdQty,
      varianceThresholdPct,
      varianceThresholdValue,
      zoneIds,
      userId,
    } = req.body;

    if (!warehouseId || !scheduledDate) {
      return res.status(400).json({
        error: 'warehouseId and scheduledDate are required'
      });
    }

    // Generate PI number
    const year = new Date().getFullYear();
    const count = await prisma.physicalInventory.count({
      where: {
        warehouseId,
        piNumber: { startsWith: `PI-${year}` },
      },
    });
    const piNumber = `PI-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const pi = await prisma.physicalInventory.create({
      data: {
        piNumber,
        warehouseId,
        name: name || `Physical Inventory ${piNumber}`,
        description,
        scheduledDate: new Date(scheduledDate),
        countType: countType || 'FULL',
        blindCount: blindCount || false,
        locationsPerBook: locationsPerBook ? parseInt(locationsPerBook) : 50,
        varianceThresholdQty: varianceThresholdQty ? parseInt(varianceThresholdQty) : 5,
        varianceThresholdPct: varianceThresholdPct ? parseFloat(varianceThresholdPct) : 5.0,
        varianceThresholdValue: varianceThresholdValue ? parseFloat(varianceThresholdValue) : 100.0,
        status: 'SETUP',
        createdById: userId,
        zoneIds: zoneIds || [],
      },
      include: {
        warehouse: { select: { code: true, name: true } },
      },
    });

    res.status(201).json(pi);
  }));

  // Update physical inventory setup
  router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Don't allow updates after count has started
    const existing = await prisma.physicalInventory.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Physical inventory not found' });
    }

    if (!['SETUP', 'SCHEDULED'].includes(existing.status)) {
      return res.status(400).json({
        error: 'Cannot modify physical inventory after counting has started'
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.piNumber;
    delete updateData.warehouseId;
    delete updateData.createdAt;

    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate);
    }
    if (updateData.locationsPerBook) {
      updateData.locationsPerBook = parseInt(updateData.locationsPerBook);
    }
    if (updateData.varianceThresholdQty) {
      updateData.varianceThresholdQty = parseInt(updateData.varianceThresholdQty);
    }
    if (updateData.varianceThresholdPct) {
      updateData.varianceThresholdPct = parseFloat(updateData.varianceThresholdPct);
    }
    if (updateData.varianceThresholdValue) {
      updateData.varianceThresholdValue = parseFloat(updateData.varianceThresholdValue);
    }

    const pi = await prisma.physicalInventory.update({
      where: { id },
      data: updateData,
    });

    res.json(pi);
  }));

  // ============================================
  // COUNT BOOK GENERATION (FMPIA -> ISPIA)
  // ============================================

  // Generate count books for physical inventory
  router.post('/:id/generate-books', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const pi = await prisma.physicalInventory.findUnique({
      where: { id },
      include: {
        warehouse: true,
      },
    });

    if (!pi) {
      return res.status(404).json({ error: 'Physical inventory not found' });
    }

    if (!['SETUP', 'SCHEDULED'].includes(pi.status)) {
      return res.status(400).json({
        error: 'Count books can only be generated in SETUP or SCHEDULED status'
      });
    }

    // Get locations to count based on zones or all warehouse locations
    const locationWhere = {
      zone: { warehouseId: pi.warehouseId },
      isActive: true,
    };

    if (pi.zoneIds && pi.zoneIds.length > 0) {
      locationWhere.zoneId = { in: pi.zoneIds };
    }

    const locations = await prisma.location.findMany({
      where: locationWhere,
      include: {
        zone: { select: { id: true, code: true } },
        inventory: {
          where: { quantityOnHand: { gt: 0 } },
          include: {
            product: { select: { sku: true, name: true, cost: true } },
          },
        },
      },
      orderBy: [
        { zone: { code: 'asc' } },
        { aisle: 'asc' },
        { bay: 'asc' },
        { level: 'asc' },
      ],
    });

    if (locations.length === 0) {
      return res.status(400).json({ error: 'No locations found to count' });
    }

    // Group locations into books
    const locationsPerBook = pi.locationsPerBook || 50;
    const books = [];
    let currentBook = [];
    let bookNumber = 1;

    for (const location of locations) {
      currentBook.push(location);
      if (currentBook.length >= locationsPerBook) {
        books.push({ bookNumber, locations: currentBook });
        currentBook = [];
        bookNumber++;
      }
    }
    if (currentBook.length > 0) {
      books.push({ bookNumber, locations: currentBook });
    }

    // Create count books and lines
    const result = await prisma.$transaction(async (tx) => {
      const createdBooks = [];

      for (const book of books) {
        const zones = [...new Set(book.locations.map(l => l.zoneId))];
        const primaryZoneId = zones[0]; // First zone as primary

        const countBook = await tx.countBook.create({
          data: {
            physicalInventoryId: id,
            bookNumber: `BOOK-${book.bookNumber.toString().padStart(3, '0')}`,
            zoneId: primaryZoneId,
            status: 'NEW',
            totalLocations: book.locations.length,
            countedLocations: 0,
            lines: {
              create: book.locations.flatMap((location, locIdx) =>
                location.inventory.length > 0
                  ? location.inventory.map((inv, invIdx) => ({
                      lineNumber: locIdx * 100 + invIdx + 1,
                      locationId: location.id,
                      productId: inv.productId,
                      expectedQuantity: pi.blindCount ? null : inv.quantityOnHand,
                      lpn: inv.lpn,
                      lotNumber: inv.lotNumber,
                      status: 'PENDING',
                    }))
                  : [{
                      lineNumber: locIdx * 100 + 1,
                      locationId: location.id,
                      expectedQuantity: pi.blindCount ? null : 0,
                      status: 'PENDING',
                    }]
              ),
            },
          },
          include: {
            _count: { select: { lines: true } },
          },
        });

        createdBooks.push(countBook);
      }

      // Update PI status
      await tx.physicalInventory.update({
        where: { id },
        data: {
          status: 'SCHEDULED',
          totalBooks: createdBooks.length,
          totalLocations: locations.length,
        },
      });

      return createdBooks;
    });

    res.json({
      success: true,
      piNumber: pi.piNumber,
      booksGenerated: result.length,
      totalLocations: locations.length,
      books: result.map(b => ({
        bookNumber: b.bookNumber,
        totalLocations: b.totalLocations,
        lineCount: b._count.lines,
      })),
    });
  }));

  // ============================================
  // COUNT BOOK OPERATIONS
  // ============================================

  // Get count book details
  router.get('/:id/books/:bookId', asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    const book = await prisma.countBook.findUnique({
      where: { id: bookId },
      include: {
        physicalInventory: {
          select: { piNumber: true, blindCount: true, varianceThresholdQty: true },
        },
        zone: { select: { code: true, name: true } },
        assignedTo: { select: { fullName: true } },
        lines: {
          include: {
            location: { select: { code: true } },
            product: { select: { sku: true, name: true, uom: true } },
          },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Count book not found' });
    }

    res.json(book);
  }));

  // Assign count book to user
  router.patch('/:id/books/:bookId/assign', asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const { userId } = req.body;

    const book = await prisma.countBook.update({
      where: { id: bookId },
      data: {
        assignedToId: userId,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
      include: {
        assignedTo: { select: { fullName: true } },
      },
    });

    res.json(book);
  }));

  // Start counting a book
  router.patch('/:id/books/:bookId/start', asyncHandler(async (req, res) => {
    const { id, bookId } = req.params;
    const { userId } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.countBook.update({
        where: { id: bookId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          assignedToId: userId || undefined,
        },
      });

      // Update PI status if first book started
      await tx.physicalInventory.updateMany({
        where: { id, status: 'SCHEDULED' },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });

      return book;
    });

    res.json(result);
  }));

  // Record count for a line
  router.patch('/:id/books/:bookId/lines/:lineId/count', asyncHandler(async (req, res) => {
    const { lineId } = req.params;
    const { countedQuantity, userId, notes, recountRequired } = req.body;

    if (countedQuantity === undefined) {
      return res.status(400).json({ error: 'countedQuantity is required' });
    }

    const line = await prisma.countBookLine.findUnique({
      where: { id: lineId },
      include: {
        countBook: {
          include: {
            physicalInventory: {
              select: {
                varianceThresholdQty: true,
                varianceThresholdPct: true,
              },
            },
          },
        },
      },
    });

    if (!line) {
      return res.status(404).json({ error: 'Count line not found' });
    }

    const qty = parseInt(countedQuantity);
    const expected = line.expectedQuantity || 0;
    const variance = qty - expected;
    const variancePct = expected > 0 ? (Math.abs(variance) / expected) * 100 : (qty > 0 ? 100 : 0);

    // Check if variance exceeds thresholds
    const pi = line.countBook.physicalInventory;
    const needsRecount = recountRequired ||
      (Math.abs(variance) > (pi.varianceThresholdQty || 5) &&
       variancePct > (pi.varianceThresholdPct || 5));

    const updatedLine = await prisma.countBookLine.update({
      where: { id: lineId },
      data: {
        countedQuantity: qty,
        variance,
        variancePct,
        countedById: userId,
        countedAt: new Date(),
        status: needsRecount ? 'RECOUNT_REQUIRED' : 'COUNTED',
        notes,
      },
    });

    // Update book progress
    const bookStats = await prisma.countBookLine.aggregate({
      where: { countBookId: line.countBookId },
      _count: { _all: true },
    });
    const countedLines = await prisma.countBookLine.count({
      where: {
        countBookId: line.countBookId,
        status: { in: ['COUNTED', 'RECOUNT_REQUIRED', 'APPROVED'] },
      },
    });

    await prisma.countBook.update({
      where: { id: line.countBookId },
      data: { countedLocations: countedLines },
    });

    res.json({
      ...updatedLine,
      needsRecount,
      bookProgress: `${countedLines}/${bookStats._count._all}`,
    });
  }));

  // Record recount
  router.patch('/:id/books/:bookId/lines/:lineId/recount', asyncHandler(async (req, res) => {
    const { lineId } = req.params;
    const { recountQuantity, userId, notes } = req.body;

    if (recountQuantity === undefined) {
      return res.status(400).json({ error: 'recountQuantity is required' });
    }

    const line = await prisma.countBookLine.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      return res.status(404).json({ error: 'Count line not found' });
    }

    const qty = parseInt(recountQuantity);
    const expected = line.expectedQuantity || 0;
    const variance = qty - expected;
    const variancePct = expected > 0 ? (Math.abs(variance) / expected) * 100 : (qty > 0 ? 100 : 0);

    const updatedLine = await prisma.countBookLine.update({
      where: { id: lineId },
      data: {
        recountQuantity: qty,
        countedQuantity: qty, // Update final count
        variance,
        variancePct,
        recountedById: userId,
        recountedAt: new Date(),
        status: 'COUNTED',
        notes: notes ? `${line.notes || ''}\nRecount: ${notes}` : line.notes,
      },
    });

    res.json(updatedLine);
  }));

  // Complete count book
  router.patch('/:id/books/:bookId/complete', asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const { userId } = req.body;

    // Check all lines are counted
    const uncounted = await prisma.countBookLine.count({
      where: {
        countBookId: bookId,
        status: 'PENDING',
      },
    });

    if (uncounted > 0) {
      return res.status(400).json({
        error: 'Cannot complete book with uncounted lines',
        uncountedLines: uncounted,
      });
    }

    const book = await prisma.countBook.update({
      where: { id: bookId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedById: userId,
      },
    });

    res.json(book);
  }));

  // ============================================
  // VARIANCE MANAGEMENT & APPROVAL
  // ============================================

  // Get variance summary for PI
  router.get('/:id/variances', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const pi = await prisma.physicalInventory.findUnique({
      where: { id },
      select: {
        piNumber: true,
        varianceThresholdQty: true,
        varianceThresholdPct: true,
        varianceThresholdValue: true,
      },
    });

    if (!pi) {
      return res.status(404).json({ error: 'Physical inventory not found' });
    }

    const lines = await prisma.countBookLine.findMany({
      where: {
        countBook: { physicalInventoryId: id },
        variance: { not: 0 },
      },
      include: {
        location: { select: { code: true } },
        product: { select: { sku: true, name: true, cost: true } },
        countBook: { select: { bookNumber: true } },
      },
      orderBy: { variance: 'desc' },
    });

    // Calculate summary
    let totalPositiveVariance = 0;
    let totalNegativeVariance = 0;
    let totalVarianceValue = 0;

    const varianceLines = lines.map(line => {
      const cost = line.product?.cost ? parseFloat(line.product.cost) : 0;
      const varianceValue = line.variance * cost;

      if (line.variance > 0) totalPositiveVariance += line.variance;
      else totalNegativeVariance += Math.abs(line.variance);
      totalVarianceValue += varianceValue;

      return {
        ...line,
        varianceValue: varianceValue.toFixed(2),
        exceedsThreshold:
          Math.abs(line.variance) > pi.varianceThresholdQty ||
          line.variancePct > pi.varianceThresholdPct ||
          Math.abs(varianceValue) > pi.varianceThresholdValue,
      };
    });

    res.json({
      piNumber: pi.piNumber,
      thresholds: {
        quantity: pi.varianceThresholdQty,
        percent: pi.varianceThresholdPct,
        value: pi.varianceThresholdValue,
      },
      summary: {
        totalVarianceLines: lines.length,
        totalPositiveVariance,
        totalNegativeVariance,
        netVariance: totalPositiveVariance - totalNegativeVariance,
        totalVarianceValue: totalVarianceValue.toFixed(2),
      },
      lines: varianceLines,
    });
  }));

  // Approve variance line
  router.patch('/:id/variances/:lineId/approve', asyncHandler(async (req, res) => {
    const { lineId } = req.params;
    const { userId, notes } = req.body;

    const line = await prisma.countBookLine.update({
      where: { id: lineId },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
        notes: notes ? `${notes}\nApproved` : 'Approved',
      },
    });

    res.json(line);
  }));

  // ============================================
  // PI COMPLETION & POSTING
  // ============================================

  // Complete physical inventory and post adjustments
  router.post('/:id/complete', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId, postAdjustments = true } = req.body;

    const pi = await prisma.physicalInventory.findUnique({
      where: { id },
      include: {
        countBooks: {
          include: {
            lines: {
              where: { variance: { not: 0 } },
              include: {
                product: { select: { cost: true } },
              },
            },
          },
        },
      },
    });

    if (!pi) {
      return res.status(404).json({ error: 'Physical inventory not found' });
    }

    // Check all books are completed
    const incompleteBooks = pi.countBooks.filter(b => b.status !== 'COMPLETED');
    if (incompleteBooks.length > 0) {
      return res.status(400).json({
        error: 'Cannot complete PI with incomplete count books',
        incompleteBooks: incompleteBooks.map(b => b.bookNumber),
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let adjustmentsPosted = 0;
      let totalAdjustmentValue = 0;

      if (postAdjustments) {
        // Post inventory adjustments for all variance lines
        for (const book of pi.countBooks) {
          for (const line of book.lines) {
            if (line.variance !== 0 && line.productId && line.locationId) {
              // Find the inventory record
              const inventory = await tx.inventory.findFirst({
                where: {
                  productId: line.productId,
                  locationId: line.locationId,
                },
              });

              if (inventory) {
                const newQty = line.countedQuantity;
                const oldQty = inventory.quantityOnHand;
                const adjustmentQty = newQty - oldQty;

                // Update inventory
                await tx.inventory.update({
                  where: { id: inventory.id },
                  data: {
                    quantityOnHand: newQty,
                    quantityAvailable: Math.max(0, newQty - inventory.quantityAllocated),
                  },
                });

                // Create transaction record
                await tx.inventoryTransaction.create({
                  data: {
                    inventoryId: inventory.id,
                    productId: line.productId,
                    locationId: line.locationId,
                    type: 'ADJUSTMENT',
                    quantity: adjustmentQty,
                    quantityBefore: oldQty,
                    quantityAfter: newQty,
                    reason: `Physical Inventory ${pi.piNumber}`,
                    reference: pi.piNumber,
                    userId,
                  },
                });

                adjustmentsPosted++;
                const cost = line.product?.cost ? parseFloat(line.product.cost) : 0;
                totalAdjustmentValue += adjustmentQty * cost;
              }
            }
          }
        }
      }

      // Update PI status
      const completed = await tx.physicalInventory.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          approvedById: userId,
          adjustmentsPosted,
          totalAdjustmentValue,
        },
      });

      return { pi: completed, adjustmentsPosted, totalAdjustmentValue };
    });

    res.json({
      success: true,
      piNumber: pi.piNumber,
      status: 'COMPLETED',
      adjustmentsPosted: result.adjustmentsPosted,
      totalAdjustmentValue: result.totalAdjustmentValue.toFixed(2),
    });
  }));

  // Cancel physical inventory
  router.patch('/:id/cancel', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, userId } = req.body;

    const pi = await prisma.physicalInventory.findUnique({
      where: { id },
      select: { status: true, piNumber: true },
    });

    if (!pi) {
      return res.status(404).json({ error: 'Physical inventory not found' });
    }

    if (pi.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel completed physical inventory' });
    }

    const updated = await prisma.physicalInventory.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: userId,
        cancelReason: reason,
      },
    });

    res.json({
      success: true,
      piNumber: pi.piNumber,
      status: 'CANCELLED',
    });
  }));

  // ============================================
  // SUMMARY & REPORTS
  // ============================================

  // Get PI summary statistics
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const { warehouseId, year } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
      where.scheduledDate = { gte: startOfYear, lte: endOfYear };
    }

    const [
      total,
      byStatus,
      recentPIs,
    ] = await Promise.all([
      prisma.physicalInventory.count({ where }),
      prisma.physicalInventory.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.physicalInventory.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
        take: 5,
        select: {
          piNumber: true,
          name: true,
          status: true,
          scheduledDate: true,
          totalLocations: true,
        },
      }),
    ]);

    res.json({
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
      recentPIs,
    });
  }));

  return router;
}
