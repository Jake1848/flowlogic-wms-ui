import { Router } from 'express';

/**
 * RMA (Return Merchandise Authorization) Routes
 * Handles customer returns, refunds, and inventory reintegration
 */
export default function rmaRoutes(prisma) {
  const router = Router();

  // Async handler wrapper
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // RMA statuses
  const RMA_STATUSES = ['REQUESTED', 'APPROVED', 'DENIED', 'RECEIVING', 'INSPECTING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

  // Return dispositions
  const DISPOSITIONS = ['RESTOCK', 'REFURBISH', 'SCRAP', 'RETURN_TO_VENDOR', 'DONATE', 'PENDING'];

  // ==========================================
  // RMA CRUD Operations
  // ==========================================

  // Get all RMAs with filtering
  router.get('/', asyncHandler(async (req, res) => {
    const {
      status,
      customerId,
      warehouseId,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { rmaNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { originalOrderNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [rmas, total] = await Promise.all([
      prisma.rMA.findMany({
        where,
        include: {
          customer: { select: { id: true, code: true, name: true } },
          warehouse: { select: { id: true, code: true, name: true } },
          lines: {
            include: {
              product: { select: { id: true, sku: true, name: true } }
            }
          },
          _count: { select: { lines: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.rMA.count({ where })
    ]);

    res.json({
      data: rmas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get single RMA with full details
  router.get('/:id', asyncHandler(async (req, res) => {
    const rma = await prisma.rMA.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        warehouse: true,
        lines: {
          include: {
            product: true,
            receivedInventory: {
              include: {
                location: true
              }
            }
          }
        },
        originalOrder: {
          select: {
            id: true,
            orderNumber: true,
            orderDate: true
          }
        },
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } }
      }
    });

    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    res.json(rma);
  }));

  // Create new RMA
  router.post('/', asyncHandler(async (req, res) => {
    const {
      customerId,
      warehouseId,
      originalOrderId,
      originalOrderNumber,
      returnReason,
      customerNotes,
      lines
    } = req.body;

    // Generate RMA number
    const rmaCount = await prisma.rMA.count();
    const rmaNumber = `RMA-${String(rmaCount + 1).padStart(8, '0')}`;

    const rma = await prisma.rMA.create({
      data: {
        rmaNumber,
        customerId,
        warehouseId,
        originalOrderId,
        originalOrderNumber,
        returnReason,
        customerNotes,
        status: 'REQUESTED',
        createdById: req.user?.id,
        lines: {
          create: lines.map(line => ({
            productId: line.productId,
            quantityRequested: line.quantity,
            quantityReceived: 0,
            returnReason: line.reason || returnReason,
            disposition: 'PENDING'
          }))
        }
      },
      include: {
        customer: { select: { id: true, code: true, name: true } },
        lines: {
          include: {
            product: { select: { id: true, sku: true, name: true } }
          }
        }
      }
    });

    res.status(201).json(rma);
  }));

  // Update RMA
  router.patch('/:id', asyncHandler(async (req, res) => {
    const { returnReason, customerNotes, internalNotes } = req.body;

    const rma = await prisma.rMA.update({
      where: { id: req.params.id },
      data: {
        ...(returnReason && { returnReason }),
        ...(customerNotes !== undefined && { customerNotes }),
        ...(internalNotes !== undefined && { internalNotes }),
        updatedAt: new Date()
      },
      include: {
        customer: { select: { id: true, code: true, name: true } },
        lines: true
      }
    });

    res.json(rma);
  }));

  // ==========================================
  // RMA Lifecycle Management
  // ==========================================

  // Approve RMA
  router.patch('/:id/approve', asyncHandler(async (req, res) => {
    const { approvalNotes, expectedArrival } = req.body;

    const rma = await prisma.rMA.findUnique({
      where: { id: req.params.id }
    });

    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    if (rma.status !== 'REQUESTED') {
      return res.status(400).json({ error: 'RMA must be in REQUESTED status to approve' });
    }

    const updated = await prisma.rMA.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user?.id,
        approvedAt: new Date(),
        approvalNotes,
        expectedArrival: expectedArrival ? new Date(expectedArrival) : null
      },
      include: {
        customer: true,
        lines: { include: { product: true } }
      }
    });

    res.json(updated);
  }));

  // Deny RMA
  router.patch('/:id/deny', asyncHandler(async (req, res) => {
    const { denialReason } = req.body;

    if (!denialReason) {
      return res.status(400).json({ error: 'Denial reason is required' });
    }

    const rma = await prisma.rMA.findUnique({
      where: { id: req.params.id }
    });

    if (!rma || rma.status !== 'REQUESTED') {
      return res.status(400).json({ error: 'RMA must be in REQUESTED status to deny' });
    }

    const updated = await prisma.rMA.update({
      where: { id: req.params.id },
      data: {
        status: 'DENIED',
        approvedById: req.user?.id,
        approvalNotes: denialReason
      }
    });

    res.json(updated);
  }));

  // Receive RMA items
  router.post('/:id/receive', asyncHandler(async (req, res) => {
    const { lines, receivingLocationId } = req.body;

    const rma = await prisma.rMA.findUnique({
      where: { id: req.params.id },
      include: { lines: true }
    });

    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    if (!['APPROVED', 'RECEIVING'].includes(rma.status)) {
      return res.status(400).json({ error: 'RMA must be approved to receive items' });
    }

    // Update RMA lines with received quantities
    await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        await tx.rMALine.update({
          where: { id: line.lineId },
          data: {
            quantityReceived: { increment: line.quantityReceived },
            receivedAt: new Date()
          }
        });

        // Create inventory transaction for received return
        await tx.inventoryTransaction.create({
          data: {
            type: 'RETURN_RECEIPT',
            productId: line.productId,
            locationId: receivingLocationId,
            quantity: line.quantityReceived,
            referenceType: 'RMA',
            referenceId: rma.id,
            userId: req.user?.id,
            notes: `RMA ${rma.rmaNumber} receipt`
          }
        });
      }

      // Update RMA status
      await tx.rMA.update({
        where: { id: req.params.id },
        data: {
          status: 'RECEIVING',
          receivedAt: new Date()
        }
      });
    });

    const updated = await prisma.rMA.findUnique({
      where: { id: req.params.id },
      include: {
        lines: { include: { product: true } }
      }
    });

    res.json(updated);
  }));

  // Inspect RMA line and set disposition
  router.patch('/:id/lines/:lineId/inspect', asyncHandler(async (req, res) => {
    const { lineId } = req.params;
    const { disposition, condition, inspectionNotes, quantityAccepted } = req.body;

    if (!DISPOSITIONS.includes(disposition)) {
      return res.status(400).json({ error: `Invalid disposition. Must be one of: ${DISPOSITIONS.join(', ')}` });
    }

    const updated = await prisma.rMALine.update({
      where: { id: lineId },
      data: {
        disposition,
        condition,
        inspectionNotes,
        quantityAccepted: quantityAccepted || 0,
        inspectedAt: new Date(),
        inspectedById: req.user?.id
      },
      include: {
        product: true,
        rma: true
      }
    });

    // Check if all lines are inspected
    const allLines = await prisma.rMALine.findMany({
      where: { rmaId: req.params.id }
    });

    const allInspected = allLines.every(line => line.disposition !== 'PENDING');

    if (allInspected) {
      await prisma.rMA.update({
        where: { id: req.params.id },
        data: { status: 'PROCESSING' }
      });
    } else {
      await prisma.rMA.update({
        where: { id: req.params.id },
        data: { status: 'INSPECTING' }
      });
    }

    res.json(updated);
  }));

  // Process RMA - execute dispositions
  router.post('/:id/process', asyncHandler(async (req, res) => {
    const rma = await prisma.rMA.findUnique({
      where: { id: req.params.id },
      include: {
        lines: { include: { product: true } },
        warehouse: true
      }
    });

    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    if (rma.status !== 'PROCESSING') {
      return res.status(400).json({ error: 'RMA must be in PROCESSING status' });
    }

    // Process each line based on disposition
    await prisma.$transaction(async (tx) => {
      for (const line of rma.lines) {
        const quantity = line.quantityAccepted || line.quantityReceived;

        if (line.disposition === 'RESTOCK' && quantity > 0) {
          // Find or create inventory record for restock
          const inventory = await tx.inventory.findFirst({
            where: {
              productId: line.productId,
              warehouseId: rma.warehouseId,
              status: 'AVAILABLE'
            }
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantityOnHand: { increment: quantity },
                quantityAvailable: { increment: quantity }
              }
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              type: 'RETURN_RESTOCK',
              productId: line.productId,
              quantity,
              referenceType: 'RMA',
              referenceId: rma.id,
              userId: req.user?.id,
              notes: `RMA ${rma.rmaNumber} restocked`
            }
          });
        } else if (line.disposition === 'SCRAP' && quantity > 0) {
          await tx.inventoryTransaction.create({
            data: {
              type: 'SCRAP',
              productId: line.productId,
              quantity: -quantity,
              referenceType: 'RMA',
              referenceId: rma.id,
              userId: req.user?.id,
              notes: `RMA ${rma.rmaNumber} scrapped: ${line.inspectionNotes || 'No notes'}`
            }
          });
        }

        // Mark line as processed
        await tx.rMALine.update({
          where: { id: line.id },
          data: { processedAt: new Date() }
        });
      }

      // Complete the RMA
      await tx.rMA.update({
        where: { id: req.params.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    });

    const updated = await prisma.rMA.findUnique({
      where: { id: req.params.id },
      include: { lines: { include: { product: true } } }
    });

    res.json(updated);
  }));

  // Cancel RMA
  router.patch('/:id/cancel', asyncHandler(async (req, res) => {
    const { cancellationReason } = req.body;

    const rma = await prisma.rMA.findUnique({
      where: { id: req.params.id }
    });

    if (!rma) {
      return res.status(404).json({ error: 'RMA not found' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(rma.status)) {
      return res.status(400).json({ error: 'Cannot cancel completed or already cancelled RMA' });
    }

    const updated = await prisma.rMA.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        internalNotes: cancellationReason ?
          `${rma.internalNotes || ''}\nCancelled: ${cancellationReason}` :
          rma.internalNotes
      }
    });

    res.json(updated);
  }));

  // ==========================================
  // RMA Analytics & Reports
  // ==========================================

  // Get RMA summary statistics
  router.get('/stats/summary', asyncHandler(async (req, res) => {
    const { warehouseId, dateFrom, dateTo } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [byStatus, byDisposition, recentRMAs, topReasons] = await Promise.all([
      // Count by status
      prisma.rMA.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),

      // Lines by disposition
      prisma.rMALine.groupBy({
        by: ['disposition'],
        _count: { id: true },
        _sum: { quantityReceived: true }
      }),

      // Recent RMAs
      prisma.rMA.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          _count: { select: { lines: true } }
        }
      }),

      // Top return reasons
      prisma.rMA.groupBy({
        by: ['returnReason'],
        where: { returnReason: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);

    res.json({
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
      byDisposition: byDisposition.reduce((acc, d) => ({
        ...acc,
        [d.disposition]: { count: d._count.id, quantity: d._sum.quantityReceived || 0 }
      }), {}),
      recentRMAs,
      topReturnReasons: topReasons.map(r => ({
        reason: r.returnReason,
        count: r._count.id
      }))
    });
  }));

  // Get return rate by customer
  router.get('/stats/by-customer', asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;

    const customerReturns = await prisma.rMA.groupBy({
      by: ['customerId'],
      _count: { id: true },
      _sum: { lines: true },
      orderBy: { _count: { id: 'desc' } },
      take: parseInt(limit)
    });

    // Get customer details
    const customerIds = customerReturns.map(c => c.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, code: true, name: true }
    });

    const customerMap = new Map(customers.map(c => [c.id, c]));

    res.json(customerReturns.map(r => ({
      customer: customerMap.get(r.customerId),
      rmaCount: r._count.id
    })));
  }));

  // Get return rate by product
  router.get('/stats/by-product', asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;

    const productReturns = await prisma.rMALine.groupBy({
      by: ['productId'],
      _count: { id: true },
      _sum: { quantityReceived: true },
      orderBy: { _sum: { quantityReceived: 'desc' } },
      take: parseInt(limit)
    });

    // Get product details
    const productIds = productReturns.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    res.json(productReturns.map(r => ({
      product: productMap.get(r.productId),
      returnCount: r._count.id,
      totalQuantity: r._sum.quantityReceived || 0
    })));
  }));

  return router;
}
