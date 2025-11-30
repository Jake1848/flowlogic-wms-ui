import express from 'express';

const router = express.Router();

export default function createReceivingRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // PURCHASE ORDERS
  // ============================================

  // List purchase orders
  router.get('/purchase-orders', asyncHandler(async (req, res) => {
    const { warehouseId, vendorId, status, search, page = 1, limit = 20 } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: { select: { code: true, name: true } },
          warehouse: { select: { code: true, name: true } },
          _count: { select: { lines: true, receipts: true } },
        },
        orderBy: { orderDate: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      data: purchaseOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get PO by ID
  router.get('/purchase-orders/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        warehouse: { select: { code: true, name: true } },
        createdBy: { select: { fullName: true } },
        lines: {
          include: {
            product: { select: { sku: true, name: true, upc: true } },
          },
          orderBy: { lineNumber: 'asc' },
        },
        receipts: {
          select: {
            id: true,
            receiptNumber: true,
            status: true,
            receiptDate: true,
            receivedUnits: true,
          },
        },
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json(po);
  }));

  // Create purchase order
  router.post('/purchase-orders', asyncHandler(async (req, res) => {
    const { vendorId, warehouseId, expectedDate, lines, notes, shipTo } = req.body;

    if (!vendorId || !warehouseId || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'vendorId, warehouseId, and lines are required' });
    }

    // Generate PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { warehouseId },
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true },
    });

    let nextNum = 1;
    if (lastPO) {
      const parts = lastPO.poNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const poNumber = `PO-${new Date().getFullYear()}-${nextNum.toString().padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let totalUnits = 0;
    const lineData = lines.map((line, index) => {
      const lineTotal = (line.unitCost || 0) * line.quantity;
      subtotal += lineTotal;
      totalUnits += line.quantity;
      return {
        lineNumber: index + 1,
        productId: line.productId,
        quantityOrdered: line.quantity,
        uom: line.uom || 'EA',
        unitCost: line.unitCost || 0,
        lineTotal,
        expectedDate: line.expectedDate ? new Date(line.expectedDate) : null,
        notes: line.notes,
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        warehouseId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        shipToName: shipTo?.name,
        shipToAddress: shipTo?.address,
        shipToCity: shipTo?.city,
        shipToState: shipTo?.state,
        shipToZipCode: shipTo?.zipCode,
        subtotal,
        totalAmount: subtotal,
        totalLines: lines.length,
        totalUnits,
        notes,
        status: 'DRAFT',
        lines: {
          create: lineData,
        },
      },
      include: {
        vendor: { select: { code: true, name: true } },
        lines: {
          include: { product: { select: { sku: true, name: true } } },
        },
      },
    });

    res.status(201).json(po);
  }));

  // Update PO status
  router.patch('/purchase-orders/:id/status', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'CONFIRMED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });

    res.json(po);
  }));

  // ============================================
  // RECEIPTS
  // ============================================

  // List receipts
  router.get('/receipts', asyncHandler(async (req, res) => {
    const { warehouseId, status, vendorId, purchaseOrderId, search, page = 1, limit = 20 } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          vendor: { select: { code: true, name: true } },
          warehouse: { select: { code: true, name: true } },
          purchaseOrder: { select: { poNumber: true } },
          dock: { select: { code: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { receiptDate: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.receipt.count({ where }),
    ]);

    res.json({
      data: receipts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get receipt by ID
  router.get('/receipts/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        vendor: true,
        warehouse: { select: { code: true, name: true } },
        purchaseOrder: {
          select: { poNumber: true, expectedDate: true },
        },
        dock: { select: { code: true, name: true, type: true } },
        receivedBy: { select: { fullName: true } },
        lines: {
          include: {
            product: { select: { sku: true, name: true, upc: true, lotTracked: true, expirationTracked: true } },
            poLine: { select: { lineNumber: true, quantityOrdered: true } },
          },
          orderBy: { lineNumber: 'asc' },
        },
        tasks: {
          select: { id: true, taskNumber: true, type: true, status: true },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(receipt);
  }));

  // Create receipt from PO
  router.post('/receipts', asyncHandler(async (req, res) => {
    const { purchaseOrderId, warehouseId, vendorId, dockId, expectedDate, carrierName, trackingNumber, bolNumber, notes, lines } = req.body;

    if (!warehouseId) {
      return res.status(400).json({ error: 'warehouseId is required' });
    }

    // Generate receipt number
    const lastReceipt = await prisma.receipt.findFirst({
      where: { warehouseId },
      orderBy: { createdAt: 'desc' },
      select: { receiptNumber: true },
    });

    let nextNum = 1;
    if (lastReceipt) {
      const parts = lastReceipt.receiptNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const receiptNumber = `RCV-${new Date().getFullYear()}-${nextNum.toString().padStart(6, '0')}`;

    // If creating from PO, get PO lines
    let receiptLines = [];
    let totalUnits = 0;

    if (purchaseOrderId) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          lines: {
            include: { product: true },
          },
        },
      });

      if (!po) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }

      receiptLines = po.lines.map((line, index) => {
        const remaining = line.quantityOrdered - line.quantityReceived;
        totalUnits += remaining;
        return {
          lineNumber: index + 1,
          productId: line.productId,
          poLineId: line.id,
          quantityExpected: remaining,
          uom: line.uom,
        };
      });
    } else if (lines) {
      receiptLines = lines.map((line, index) => {
        totalUnits += line.quantityExpected;
        return {
          lineNumber: index + 1,
          productId: line.productId,
          quantityExpected: line.quantityExpected,
          uom: line.uom || 'EA',
          lotNumber: line.lotNumber,
          expirationDate: line.expirationDate ? new Date(line.expirationDate) : null,
        };
      });
    }

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        warehouseId,
        vendorId,
        purchaseOrderId,
        dockId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        carrierName,
        trackingNumber,
        bolNumber,
        notes,
        type: purchaseOrderId ? 'PO_RECEIPT' : 'ADJUSTMENT',
        status: 'NEW',
        totalLines: receiptLines.length,
        totalUnits,
        lines: {
          create: receiptLines,
        },
      },
      include: {
        vendor: { select: { code: true, name: true } },
        purchaseOrder: { select: { poNumber: true } },
        lines: {
          include: { product: { select: { sku: true, name: true } } },
        },
      },
    });

    res.status(201).json(receipt);
  }));

  // Check-in receipt (assign dock)
  router.patch('/receipts/:id/check-in', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dockId } = req.body;

    const receipt = await prisma.$transaction(async (tx) => {
      // Update receipt status
      const updatedReceipt = await tx.receipt.update({
        where: { id },
        data: {
          status: 'CHECKED_IN',
          dockId,
        },
      });

      // Update dock status if provided
      if (dockId) {
        await tx.dock.update({
          where: { id: dockId },
          data: {
            currentStatus: 'OCCUPIED',
            appointmentTime: new Date(),
          },
        });
      }

      return updatedReceipt;
    });

    res.json(receipt);
  }));

  // Start receiving
  router.patch('/receipts/:id/start', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        status: 'RECEIVING',
        receivedById: userId,
      },
    });

    res.json(receipt);
  }));

  // Receive line items
  router.post('/receipts/:id/receive-line', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lineId, quantityReceived, quantityDamaged, quantityRejected, lotNumber, expirationDate, serialNumbers, locationId, notes } = req.body;

    if (!lineId || quantityReceived === undefined) {
      return res.status(400).json({ error: 'lineId and quantityReceived are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get receipt line with product info
      const line = await tx.receiptLine.findUnique({
        where: { id: lineId },
        include: {
          receipt: true,
          product: true,
          poLine: true,
        },
      });

      if (!line) {
        throw new Error('Receipt line not found');
      }

      // Update receipt line
      const updatedLine = await tx.receiptLine.update({
        where: { id: lineId },
        data: {
          quantityReceived: { increment: quantityReceived },
          quantityDamaged: { increment: quantityDamaged || 0 },
          quantityRejected: { increment: quantityRejected || 0 },
          lotNumber: lotNumber || line.lotNumber,
          expirationDate: expirationDate ? new Date(expirationDate) : line.expirationDate,
          serialNumbers: serialNumbers || line.serialNumbers,
          status: 'RECEIVED',
          notes,
        },
      });

      // Update receipt totals
      await tx.receipt.update({
        where: { id },
        data: {
          receivedUnits: { increment: quantityReceived },
        },
      });

      // Update PO line if applicable
      if (line.poLineId) {
        await tx.purchaseOrderLine.update({
          where: { id: line.poLineId },
          data: {
            quantityReceived: { increment: quantityReceived },
          },
        });
      }

      // Create or update inventory if location provided
      if (locationId) {
        const existingInventory = await tx.inventory.findFirst({
          where: {
            productId: line.productId,
            locationId,
            lotNumber: lotNumber || null,
          },
        });

        if (existingInventory) {
          await tx.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantityOnHand: { increment: quantityReceived },
              quantityAvailable: { increment: quantityReceived },
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              productId: line.productId,
              locationId,
              warehouseId: line.receipt.warehouseId,
              quantityOnHand: quantityReceived,
              quantityAvailable: quantityReceived,
              lotNumber,
              expirationDate: expirationDate ? new Date(expirationDate) : null,
              status: 'AVAILABLE',
            },
          });
        }

        // Get system user for transaction
        const systemUser = await tx.user.findFirst({
          where: { role: 'ADMIN' },
        });

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            transactionType: 'RECEIVE',
            productId: line.productId,
            locationId,
            quantity: quantityReceived,
            quantityBefore: existingInventory?.quantityOnHand || 0,
            quantityAfter: (existingInventory?.quantityOnHand || 0) + quantityReceived,
            lotNumber,
            referenceType: 'RECEIPT',
            referenceId: id,
            referenceNumber: line.receipt.receiptNumber,
            userId: systemUser?.id || line.productId,
            notes: `Received from ${line.receipt.receiptNumber}`,
          },
        });
      }

      return updatedLine;
    });

    res.json(result);
  }));

  // Complete receipt
  router.patch('/receipts/:id/complete', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: { id },
        include: {
          lines: true,
          purchaseOrder: true,
        },
      });

      if (!receipt) {
        throw new Error('Receipt not found');
      }

      // Update receipt
      const updatedReceipt = await tx.receipt.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
        },
      });

      // Update all lines to completed
      await tx.receiptLine.updateMany({
        where: { receiptId: id },
        data: { status: 'COMPLETED' },
      });

      // Update PO status if applicable
      if (receipt.purchaseOrderId) {
        const poLines = await tx.purchaseOrderLine.findMany({
          where: { purchaseOrderId: receipt.purchaseOrderId },
        });

        const allReceived = poLines.every(line => line.quantityReceived >= line.quantityOrdered);
        const someReceived = poLines.some(line => line.quantityReceived > 0);

        await tx.purchaseOrder.update({
          where: { id: receipt.purchaseOrderId },
          data: {
            status: allReceived ? 'RECEIVED' : someReceived ? 'PARTIAL_RECEIVED' : undefined,
            receivedUnits: {
              increment: receipt.receivedUnits,
            },
          },
        });
      }

      // Release dock
      if (receipt.dockId) {
        await tx.dock.update({
          where: { id: receipt.dockId },
          data: {
            currentStatus: 'AVAILABLE',
            appointmentTime: null,
          },
        });
      }

      return updatedReceipt;
    });

    res.json(result);
  }));

  // Create putaway task for receipt
  router.post('/receipts/:id/create-putaway', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        warehouse: true,
        lines: {
          where: { quantityReceived: { gt: 0 } },
          include: { product: true },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Generate task number
    const lastTask = await prisma.task.findFirst({
      where: { warehouseId: receipt.warehouseId },
      orderBy: { createdAt: 'desc' },
      select: { taskNumber: true },
    });

    let nextNum = 1;
    if (lastTask) {
      const parts = lastTask.taskNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const taskNumber = `TSK-PUT-${nextNum.toString().padStart(6, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskNumber,
        type: 'PUTAWAY',
        status: userId ? 'ASSIGNED' : 'PENDING',
        warehouseId: receipt.warehouseId,
        receiptId: id,
        assignedToId: userId,
        assignedAt: userId ? new Date() : null,
        totalLines: receipt.lines.length,
        totalUnits: receipt.lines.reduce((sum, l) => sum + l.quantityReceived, 0),
        notes: `Putaway for receipt ${receipt.receiptNumber}`,
        details: {
          create: receipt.lines.map((line, index) => ({
            lineNumber: index + 1,
            receiptLineId: line.id,
            quantityRequired: line.quantityReceived - line.quantityPutaway,
            lotNumber: line.lotNumber,
          })),
        },
      },
      include: {
        details: true,
      },
    });

    // Update receipt status
    await prisma.receipt.update({
      where: { id },
      data: { status: 'PUTAWAY' },
    });

    res.status(201).json(task);
  }));

  // ============================================
  // DOCK APPOINTMENTS
  // ============================================

  // Get dock schedule for receiving
  router.get('/dock-schedule', asyncHandler(async (req, res) => {
    const { warehouseId, date } = req.query;

    if (!warehouseId) {
      return res.status(400).json({ error: 'warehouseId is required' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const docks = await prisma.dock.findMany({
      where: {
        warehouseId,
        type: { in: ['RECEIVING', 'BOTH'] },
        isActive: true,
      },
      include: {
        receipts: {
          where: {
            OR: [
              { expectedDate: { gte: startOfDay, lte: endOfDay } },
              { receiptDate: { gte: startOfDay, lte: endOfDay } },
            ],
          },
          include: {
            vendor: { select: { name: true } },
            purchaseOrder: { select: { poNumber: true } },
          },
        },
      },
    });

    res.json(docks);
  }));

  // Summary endpoint
  router.get('/summary', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};

    const [
      pendingPOs,
      scheduledReceipts,
      inProgressReceipts,
      todayReceipts,
      pendingPutaway,
    ] = await Promise.all([
      prisma.purchaseOrder.count({
        where: { ...where, status: { in: ['CONFIRMED', 'APPROVED'] } },
      }),
      prisma.receipt.count({
        where: { ...where, status: 'SCHEDULED' },
      }),
      prisma.receipt.count({
        where: { ...where, status: { in: ['CHECKED_IN', 'RECEIVING'] } },
      }),
      prisma.receipt.count({
        where: {
          ...where,
          receiptDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.receipt.count({
        where: { ...where, status: 'RECEIVED' },
      }),
    ]);

    res.json({
      pendingPOs,
      scheduledReceipts,
      inProgressReceipts,
      todayReceipts,
      pendingPutaway,
    });
  }));

  return router;
}
