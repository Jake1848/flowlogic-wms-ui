import { Router } from 'express';

/**
 * ASN (Advanced Shipping Notice) Routes
 * Handles inbound shipment notifications, EDI 856 processing, and receiving preparation
 */
export default function asnRoutes(prisma) {
  const router = Router();

  // Async handler wrapper
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // ASN statuses
  const ASN_STATUSES = ['PENDING', 'VALIDATED', 'SCHEDULED', 'IN_TRANSIT', 'ARRIVED', 'RECEIVING', 'RECEIVED', 'CLOSED', 'CANCELLED'];

  // ==========================================
  // ASN CRUD Operations
  // ==========================================

  // Get all ASNs with filtering
  router.get('/', asyncHandler(async (req, res) => {
    const {
      status,
      vendorId,
      warehouseId,
      carrierId,
      dateFrom,
      dateTo,
      expectedDateFrom,
      expectedDateTo,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (carrierId) where.carrierId = carrierId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (expectedDateFrom || expectedDateTo) {
      where.expectedArrival = {};
      if (expectedDateFrom) where.expectedArrival.gte = new Date(expectedDateFrom);
      if (expectedDateTo) where.expectedArrival.lte = new Date(expectedDateTo);
    }

    if (search) {
      where.OR = [
        { asnNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
        { bolNumber: { contains: search, mode: 'insensitive' } },
        { proNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [asns, total] = await Promise.all([
      prisma.aSN.findMany({
        where,
        include: {
          vendor: { select: { id: true, code: true, name: true } },
          warehouse: { select: { id: true, code: true, name: true } },
          carrier: { select: { id: true, code: true, name: true } },
          purchaseOrder: { select: { id: true, poNumber: true } },
          lines: {
            include: {
              product: { select: { id: true, sku: true, name: true } }
            }
          },
          _count: { select: { lines: true } }
        },
        orderBy: { expectedArrival: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.aSN.count({ where })
    ]);

    res.json({
      data: asns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get single ASN with full details
  router.get('/:id', asyncHandler(async (req, res) => {
    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        warehouse: true,
        carrier: true,
        purchaseOrder: {
          include: {
            lines: { include: { product: true } }
          }
        },
        lines: {
          include: {
            product: true,
            receivedReceipts: true
          }
        },
        dockAppointment: true,
        createdBy: { select: { id: true, fullName: true } }
      }
    });

    if (!asn) {
      return res.status(404).json({ error: 'ASN not found' });
    }

    // Calculate receiving progress
    const totalExpected = asn.lines.reduce((sum, line) => sum + line.quantityExpected, 0);
    const totalReceived = asn.lines.reduce((sum, line) => sum + line.quantityReceived, 0);

    res.json({
      ...asn,
      progress: {
        totalExpected,
        totalReceived,
        percentComplete: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0
      }
    });
  }));

  // Create new ASN (manual or from EDI)
  router.post('/', asyncHandler(async (req, res) => {
    const {
      vendorId,
      warehouseId,
      carrierId,
      purchaseOrderId,
      expectedArrival,
      bolNumber,
      proNumber,
      sealNumber,
      trailerNumber,
      shipFromAddress,
      totalPallets,
      totalCases,
      totalWeight,
      lines,
      ediSource // If created from EDI
    } = req.body;

    // Generate ASN number
    const asnCount = await prisma.aSN.count();
    const asnNumber = `ASN-${String(asnCount + 1).padStart(8, '0')}`;

    const asn = await prisma.aSN.create({
      data: {
        asnNumber,
        vendorId,
        warehouseId,
        carrierId,
        purchaseOrderId,
        expectedArrival: expectedArrival ? new Date(expectedArrival) : null,
        bolNumber,
        proNumber,
        sealNumber,
        trailerNumber,
        shipFromAddress,
        totalPallets,
        totalCases,
        totalWeight,
        status: 'PENDING',
        ediSource,
        createdById: req.user?.id,
        lines: {
          create: lines.map((line, idx) => ({
            lineNumber: idx + 1,
            productId: line.productId,
            quantityExpected: line.quantity,
            quantityReceived: 0,
            uom: line.uom || 'EA',
            lotNumber: line.lotNumber,
            serialNumbers: line.serialNumbers || [],
            expirationDate: line.expirationDate ? new Date(line.expirationDate) : null,
            poLineNumber: line.poLineNumber
          }))
        }
      },
      include: {
        vendor: { select: { id: true, code: true, name: true } },
        lines: {
          include: {
            product: { select: { id: true, sku: true, name: true } }
          }
        }
      }
    });

    res.status(201).json(asn);
  }));

  // Update ASN
  router.patch('/:id', asyncHandler(async (req, res) => {
    const {
      expectedArrival,
      bolNumber,
      proNumber,
      sealNumber,
      trailerNumber,
      totalPallets,
      totalCases,
      totalWeight,
      notes
    } = req.body;

    const asn = await prisma.aSN.update({
      where: { id: req.params.id },
      data: {
        ...(expectedArrival && { expectedArrival: new Date(expectedArrival) }),
        ...(bolNumber !== undefined && { bolNumber }),
        ...(proNumber !== undefined && { proNumber }),
        ...(sealNumber !== undefined && { sealNumber }),
        ...(trailerNumber !== undefined && { trailerNumber }),
        ...(totalPallets !== undefined && { totalPallets }),
        ...(totalCases !== undefined && { totalCases }),
        ...(totalWeight !== undefined && { totalWeight }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date()
      },
      include: {
        vendor: { select: { id: true, code: true, name: true } },
        lines: true
      }
    });

    res.json(asn);
  }));

  // Delete/Cancel ASN
  router.delete('/:id', asyncHandler(async (req, res) => {
    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id }
    });

    if (!asn) {
      return res.status(404).json({ error: 'ASN not found' });
    }

    if (['RECEIVING', 'RECEIVED', 'CLOSED'].includes(asn.status)) {
      return res.status(400).json({ error: 'Cannot delete ASN that has started receiving' });
    }

    await prisma.aSN.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'ASN cancelled successfully' });
  }));

  // ==========================================
  // ASN Lifecycle Management
  // ==========================================

  // Validate ASN (verify against PO)
  router.post('/:id/validate', asyncHandler(async (req, res) => {
    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id },
      include: {
        lines: { include: { product: true } },
        purchaseOrder: {
          include: {
            lines: { include: { product: true } }
          }
        }
      }
    });

    if (!asn) {
      return res.status(404).json({ error: 'ASN not found' });
    }

    const validationResults = {
      valid: true,
      warnings: [],
      errors: []
    };

    // Validate against PO if linked
    if (asn.purchaseOrder) {
      const poLineMap = new Map(
        asn.purchaseOrder.lines.map(line => [line.productId, line])
      );

      for (const asnLine of asn.lines) {
        const poLine = poLineMap.get(asnLine.productId);

        if (!poLine) {
          validationResults.errors.push({
            lineNumber: asnLine.lineNumber,
            message: `Product ${asnLine.product.sku} not found on PO`
          });
          validationResults.valid = false;
        } else if (asnLine.quantityExpected > poLine.quantityOrdered - poLine.quantityReceived) {
          validationResults.warnings.push({
            lineNumber: asnLine.lineNumber,
            message: `Quantity ${asnLine.quantityExpected} exceeds open PO quantity`
          });
        }
      }
    }

    // Update status if valid
    if (validationResults.valid) {
      await prisma.aSN.update({
        where: { id: req.params.id },
        data: {
          status: 'VALIDATED',
          validatedAt: new Date()
        }
      });
    }

    res.json(validationResults);
  }));

  // Schedule ASN for dock appointment
  router.post('/:id/schedule', asyncHandler(async (req, res) => {
    const { dockId, appointmentDate, appointmentTime, duration } = req.body;

    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id }
    });

    if (!asn) {
      return res.status(404).json({ error: 'ASN not found' });
    }

    // Create dock appointment
    const appointment = await prisma.dockAppointment.create({
      data: {
        dockId,
        asnId: asn.id,
        type: 'INBOUND',
        scheduledDate: new Date(appointmentDate),
        scheduledTime: appointmentTime,
        duration: duration || 60,
        status: 'SCHEDULED',
        vendorId: asn.vendorId,
        carrierId: asn.carrierId,
        reference: asn.asnNumber
      }
    });

    await prisma.aSN.update({
      where: { id: req.params.id },
      data: {
        status: 'SCHEDULED',
        dockAppointmentId: appointment.id
      }
    });

    res.json(appointment);
  }));

  // Mark ASN as in transit
  router.patch('/:id/in-transit', asyncHandler(async (req, res) => {
    const { shipDate, trackingNumber, estimatedArrival } = req.body;

    const updated = await prisma.aSN.update({
      where: { id: req.params.id },
      data: {
        status: 'IN_TRANSIT',
        shipDate: shipDate ? new Date(shipDate) : new Date(),
        trackingNumber,
        expectedArrival: estimatedArrival ? new Date(estimatedArrival) : undefined
      }
    });

    res.json(updated);
  }));

  // Mark ASN as arrived
  router.patch('/:id/arrived', asyncHandler(async (req, res) => {
    const { arrivalTime, actualTrailer, actualSeal, dockDoorId } = req.body;

    const updated = await prisma.aSN.update({
      where: { id: req.params.id },
      data: {
        status: 'ARRIVED',
        arrivalTime: arrivalTime ? new Date(arrivalTime) : new Date(),
        actualTrailerNumber: actualTrailer,
        actualSealNumber: actualSeal,
        dockDoorId
      }
    });

    // Update dock appointment if exists
    if (updated.dockAppointmentId) {
      await prisma.dockAppointment.update({
        where: { id: updated.dockAppointmentId },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: new Date()
        }
      });
    }

    res.json(updated);
  }));

  // Start receiving on ASN
  router.patch('/:id/start-receiving', asyncHandler(async (req, res) => {
    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id }
    });

    if (!asn) {
      return res.status(404).json({ error: 'ASN not found' });
    }

    if (!['VALIDATED', 'SCHEDULED', 'ARRIVED'].includes(asn.status)) {
      return res.status(400).json({ error: 'ASN must be validated/scheduled/arrived to start receiving' });
    }

    const updated = await prisma.aSN.update({
      where: { id: req.params.id },
      data: {
        status: 'RECEIVING',
        receivingStartedAt: new Date()
      }
    });

    res.json(updated);
  }));

  // Receive ASN line items
  router.post('/:id/receive', asyncHandler(async (req, res) => {
    const { lines, receivingLocationId } = req.body;

    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id },
      include: { lines: true, warehouse: true }
    });

    if (!asn) {
      return res.status(404).json({ error: 'ASN not found' });
    }

    if (asn.status !== 'RECEIVING') {
      return res.status(400).json({ error: 'ASN must be in RECEIVING status' });
    }

    const results = [];

    await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        // Update ASN line
        const asnLine = await tx.aSNLine.update({
          where: { id: line.lineId },
          data: {
            quantityReceived: { increment: line.quantityReceived },
            receivedAt: new Date()
          }
        });

        // Create inventory
        const inventory = await tx.inventory.create({
          data: {
            productId: asnLine.productId,
            warehouseId: asn.warehouseId,
            locationId: receivingLocationId,
            quantityOnHand: line.quantityReceived,
            quantityAvailable: line.quantityReceived,
            quantityAllocated: 0,
            lotNumber: line.lotNumber || asnLine.lotNumber,
            expirationDate: line.expirationDate || asnLine.expirationDate,
            status: 'AVAILABLE'
          }
        });

        // Create transaction
        await tx.inventoryTransaction.create({
          data: {
            type: 'RECEIPT',
            productId: asnLine.productId,
            locationId: receivingLocationId,
            quantity: line.quantityReceived,
            referenceType: 'ASN',
            referenceId: asn.id,
            userId: req.user?.id,
            lotNumber: line.lotNumber || asnLine.lotNumber,
            notes: `ASN ${asn.asnNumber} receipt`
          }
        });

        results.push({
          lineId: line.lineId,
          quantityReceived: line.quantityReceived,
          inventoryId: inventory.id
        });
      }

      // Check if all lines are fully received
      const allLines = await tx.aSNLine.findMany({
        where: { asnId: req.params.id }
      });

      const allReceived = allLines.every(l => l.quantityReceived >= l.quantityExpected);

      if (allReceived) {
        await tx.aSN.update({
          where: { id: req.params.id },
          data: {
            status: 'RECEIVED',
            receivedAt: new Date()
          }
        });
      }
    });

    res.json({ message: 'Lines received successfully', results });
  }));

  // Close ASN (complete receiving)
  router.patch('/:id/close', asyncHandler(async (req, res) => {
    const { closeNotes, acceptVariance } = req.body;

    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id },
      include: { lines: true }
    });

    if (!asn) {
      return res.status(404).json({ error: 'ASN not found' });
    }

    // Check for variances
    const variances = asn.lines.filter(l => l.quantityReceived !== l.quantityExpected);

    if (variances.length > 0 && !acceptVariance) {
      return res.status(400).json({
        error: 'ASN has receiving variances',
        variances: variances.map(v => ({
          lineNumber: v.lineNumber,
          expected: v.quantityExpected,
          received: v.quantityReceived,
          variance: v.quantityReceived - v.quantityExpected
        }))
      });
    }

    const updated = await prisma.aSN.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        notes: closeNotes ? `${asn.notes || ''}\n${closeNotes}` : asn.notes
      }
    });

    // Update dock appointment if exists
    if (asn.dockAppointmentId) {
      await prisma.dockAppointment.update({
        where: { id: asn.dockAppointmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }

    res.json(updated);
  }));

  // ==========================================
  // ASN Line Management
  // ==========================================

  // Add line to ASN
  router.post('/:id/lines', asyncHandler(async (req, res) => {
    const { productId, quantity, uom, lotNumber, expirationDate } = req.body;

    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id },
      include: { lines: true }
    });

    if (!asn) {
      return res.status(404).json({ error: 'ASN not found' });
    }

    if (['RECEIVING', 'RECEIVED', 'CLOSED'].includes(asn.status)) {
      return res.status(400).json({ error: 'Cannot modify ASN that has started receiving' });
    }

    const maxLine = Math.max(...asn.lines.map(l => l.lineNumber), 0);

    const line = await prisma.aSNLine.create({
      data: {
        asnId: req.params.id,
        lineNumber: maxLine + 1,
        productId,
        quantityExpected: quantity,
        quantityReceived: 0,
        uom: uom || 'EA',
        lotNumber,
        expirationDate: expirationDate ? new Date(expirationDate) : null
      },
      include: {
        product: { select: { id: true, sku: true, name: true } }
      }
    });

    res.status(201).json(line);
  }));

  // Update ASN line
  router.patch('/:id/lines/:lineId', asyncHandler(async (req, res) => {
    const { quantity, lotNumber, expirationDate } = req.body;

    const line = await prisma.aSNLine.update({
      where: { id: req.params.lineId },
      data: {
        ...(quantity !== undefined && { quantityExpected: quantity }),
        ...(lotNumber !== undefined && { lotNumber }),
        ...(expirationDate !== undefined && { expirationDate: new Date(expirationDate) })
      },
      include: {
        product: { select: { id: true, sku: true, name: true } }
      }
    });

    res.json(line);
  }));

  // Delete ASN line
  router.delete('/:id/lines/:lineId', asyncHandler(async (req, res) => {
    const asn = await prisma.aSN.findUnique({
      where: { id: req.params.id }
    });

    if (['RECEIVING', 'RECEIVED', 'CLOSED'].includes(asn?.status)) {
      return res.status(400).json({ error: 'Cannot modify ASN that has started receiving' });
    }

    await prisma.aSNLine.delete({
      where: { id: req.params.lineId }
    });

    res.json({ message: 'Line deleted successfully' });
  }));

  // ==========================================
  // ASN Analytics
  // ==========================================

  // Get ASN summary statistics
  router.get('/stats/summary', asyncHandler(async (req, res) => {
    const { warehouseId, dateFrom, dateTo } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [byStatus, todayExpected, overdueASNs, avgReceivingTime] = await Promise.all([
      // Count by status
      prisma.aSN.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),

      // Expected today
      prisma.aSN.count({
        where: {
          ...where,
          expectedArrival: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: { in: ['PENDING', 'VALIDATED', 'SCHEDULED', 'IN_TRANSIT'] }
        }
      }),

      // Overdue ASNs
      prisma.aSN.count({
        where: {
          ...where,
          expectedArrival: { lt: new Date() },
          status: { in: ['PENDING', 'VALIDATED', 'SCHEDULED', 'IN_TRANSIT'] }
        }
      }),

      // Average receiving time (completed ASNs)
      prisma.aSN.findMany({
        where: {
          ...where,
          status: 'CLOSED',
          receivingStartedAt: { not: null },
          closedAt: { not: null }
        },
        select: {
          receivingStartedAt: true,
          closedAt: true
        },
        take: 100
      })
    ]);

    // Calculate average receiving time in minutes
    let avgTime = 0;
    if (avgReceivingTime.length > 0) {
      const totalMinutes = avgReceivingTime.reduce((sum, asn) => {
        const diff = (asn.closedAt - asn.receivingStartedAt) / (1000 * 60);
        return sum + diff;
      }, 0);
      avgTime = Math.round(totalMinutes / avgReceivingTime.length);
    }

    res.json({
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
      todayExpected,
      overdueASNs,
      avgReceivingTimeMinutes: avgTime
    });
  }));

  // Get expected arrivals calendar
  router.get('/calendar', asyncHandler(async (req, res) => {
    const { startDate, endDate, warehouseId } = req.query;

    const where = {
      expectedArrival: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      status: { notIn: ['CLOSED', 'CANCELLED'] }
    };

    if (warehouseId) where.warehouseId = warehouseId;

    const asns = await prisma.aSN.findMany({
      where,
      include: {
        vendor: { select: { code: true, name: true } },
        carrier: { select: { code: true, name: true } },
        _count: { select: { lines: true } }
      },
      orderBy: { expectedArrival: 'asc' }
    });

    // Group by date
    const byDate = {};
    for (const asn of asns) {
      const dateKey = asn.expectedArrival.toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(asn);
    }

    res.json(byDate);
  }));

  return router;
}
