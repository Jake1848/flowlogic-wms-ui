import express from 'express';
import {
  validateRequired,
  validateUUID,
  validatePagination,
  validateQuantity,
  validateEnum,
  sanitizeFields,
  wmsValidators,
} from '../middleware/validation.js';

const router = express.Router();

export default function createShippingRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // SHIPMENTS
  // ============================================

  // List shipments
  router.get('/', validatePagination, asyncHandler(async (req, res) => {
    const { warehouseId, status, carrierId, orderId, search, page = 1, limit = 20 } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    if (carrierId) where.carrierId = carrierId;
    if (orderId) where.orderId = orderId;
    if (search) {
      where.OR = [
        { shipmentNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              customer: { select: { name: true } },
            },
          },
          carrier: { select: { code: true, name: true } },
          service: { select: { code: true, name: true } },
          warehouse: { select: { code: true, name: true } },
          dock: { select: { code: true, name: true } },
          _count: { select: { lines: true, packages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({
      data: shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get shipment by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            lines: {
              include: { product: { select: { sku: true, name: true } } },
            },
          },
        },
        carrier: true,
        service: true,
        warehouse: { select: { code: true, name: true } },
        dock: { select: { code: true, name: true } },
        shippedBy: { select: { fullName: true } },
        lines: {
          include: {
            orderLine: {
              include: { product: { select: { sku: true, name: true } } },
            },
          },
        },
        packages: {
          orderBy: { packageNumber: 'asc' },
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(shipment);
  }));

  // Create shipment from order
  router.post('/', asyncHandler(async (req, res) => {
    const { orderId, carrierId, serviceId, dockId, packages: packageData } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        warehouse: true,
        lines: {
          where: { quantityPicked: { gt: 0 } },
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Generate shipment number
    const lastShipment = await prisma.shipment.findFirst({
      where: { warehouseId: order.warehouseId },
      orderBy: { createdAt: 'desc' },
      select: { shipmentNumber: true },
    });

    let nextNum = 1;
    if (lastShipment) {
      const parts = lastShipment.shipmentNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const shipmentNumber = `SHP-${new Date().getFullYear()}-${nextNum.toString().padStart(6, '0')}`;

    // Calculate total weight
    let totalWeight = 0;
    const shipmentLines = order.lines.map(line => {
      const weight = line.product.weight ? parseFloat(line.product.weight) * line.quantityPicked : 0;
      totalWeight += weight;
      return {
        orderLineId: line.id,
        quantity: line.quantityPicked,
      };
    });

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        orderId,
        warehouseId: order.warehouseId,
        carrierId,
        serviceId,
        dockId,
        status: 'NEW',
        shipToName: order.shipToName,
        shipToAddress: order.shipToAddress,
        shipToCity: order.shipToCity,
        shipToState: order.shipToState,
        shipToZipCode: order.shipToZipCode,
        shipToCountry: order.shipToCountry,
        totalWeight,
        totalPackages: packageData?.length || 1,
        lines: {
          create: shipmentLines,
        },
        packages: packageData ? {
          create: packageData.map((pkg, index) => ({
            packageNumber: index + 1,
            weight: pkg.weight,
            length: pkg.length,
            width: pkg.width,
            height: pkg.height,
            packageType: pkg.type || 'Box',
          })),
        } : {
          create: [{
            packageNumber: 1,
            weight: totalWeight,
            packageType: 'Box',
          }],
        },
      },
      include: {
        order: { select: { orderNumber: true } },
        carrier: { select: { code: true, name: true } },
        lines: true,
        packages: true,
      },
    });

    res.status(201).json(shipment);
  }));

  // Update shipment carrier/service
  router.patch('/:id/carrier', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { carrierId, serviceId } = req.body;

    const shipment = await prisma.shipment.update({
      where: { id },
      data: { carrierId, serviceId },
      include: {
        carrier: { select: { code: true, name: true } },
        service: { select: { code: true, name: true } },
      },
    });

    res.json(shipment);
  }));

  // Pack shipment
  router.patch('/:id/pack', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { packages } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Update package details
      if (packages) {
        for (const pkg of packages) {
          if (pkg.id) {
            await tx.package.update({
              where: { id: pkg.id },
              data: {
                weight: pkg.weight,
                length: pkg.length,
                width: pkg.width,
                height: pkg.height,
                packageType: pkg.type,
              },
            });
          }
        }
      }

      // Update shipment status
      const shipment = await tx.shipment.update({
        where: { id },
        data: {
          status: 'PACKED',
          totalPackages: packages?.length,
          totalWeight: packages?.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0),
        },
        include: {
          packages: true,
        },
      });

      return shipment;
    });

    res.json(result);
  }));

  // Generate label (mock - would integrate with carrier API)
  router.post('/:id/label', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        carrier: true,
        order: { include: { customer: true } },
        packages: true,
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Mock tracking number generation
    const carrierPrefix = shipment.carrier?.code?.substring(0, 2).toUpperCase() || 'XX';
    const trackingNumber = `${carrierPrefix}${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Update shipment with tracking
    const updated = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: {
          trackingNumber,
          status: 'LABELED',
          labelUrl: `/api/shipping/${id}/label/download`, // Mock URL
        },
      });

      // Update packages with tracking (for multi-piece)
      await tx.package.updateMany({
        where: { shipmentId: id },
        data: { trackingNumber },
      });

      return updatedShipment;
    });

    res.json({
      shipmentId: id,
      trackingNumber,
      labelUrl: updated.labelUrl,
      carrier: shipment.carrier?.name,
      packages: shipment.packages.length,
    });
  }));

  // Stage shipment
  router.patch('/:id/stage', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dockId } = req.body;

    const shipment = await prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id },
        data: {
          status: 'STAGED',
          dockId,
        },
      });

      if (dockId) {
        await tx.dock.update({
          where: { id: dockId },
          data: { currentStatus: 'RESERVED' },
        });
      }

      return updated;
    });

    res.json(shipment);
  }));

  // Ship shipment
  router.patch('/:id/ship', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id },
        include: {
          lines: true,
          order: true,
        },
      });

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      // Update shipment
      const updated = await tx.shipment.update({
        where: { id },
        data: {
          status: 'SHIPPED',
          shipDate: new Date(),
          shippedById: userId,
        },
      });

      // Update order line shipped quantities
      for (const line of shipment.lines) {
        await tx.orderLine.update({
          where: { id: line.orderLineId },
          data: {
            quantityShipped: { increment: line.quantity },
            status: 'SHIPPED',
          },
        });
      }

      // Calculate shipped units for order
      const shippedUnits = shipment.lines.reduce((sum, l) => sum + l.quantity, 0);

      // Check if order is fully shipped
      const order = await tx.order.findUnique({
        where: { id: shipment.orderId },
        include: { lines: true },
      });

      const allShipped = order.lines.every(l => l.quantityShipped >= l.quantityOrdered);

      // Update order
      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          shippedUnits: { increment: shippedUnits },
          status: allShipped ? 'SHIPPED' : 'PICKING',
          shippedDate: allShipped ? new Date() : undefined,
          trackingNumber: shipment.trackingNumber,
        },
      });

      // Release dock
      if (shipment.dockId) {
        await tx.dock.update({
          where: { id: shipment.dockId },
          data: { currentStatus: 'AVAILABLE' },
        });
      }

      return updated;
    });

    res.json(result);
  }));

  // Void shipment
  router.patch('/:id/void', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        status: 'EXCEPTION',
        notes: reason ? `Voided: ${reason}` : 'Shipment voided',
      },
    });

    res.json(shipment);
  }));

  // ============================================
  // CARRIERS
  // ============================================

  // List carriers
  router.get('/carriers', asyncHandler(async (req, res) => {
    const carriers = await prisma.carrier.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { shipments: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(carriers);
  }));

  // Create carrier
  router.post('/carriers', asyncHandler(async (req, res) => {
    const { code, name, type, accountNumber, services } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    const carrier = await prisma.carrier.create({
      data: {
        code: code.toUpperCase(),
        name,
        type: type || 'PARCEL',
        accountNumber,
        services: services ? {
          create: services.map(s => ({
            code: s.code,
            name: s.name,
            transitDays: s.transitDays,
          })),
        } : undefined,
      },
      include: { services: true },
    });

    res.status(201).json(carrier);
  }));

  // ============================================
  // DOCK MANAGEMENT
  // ============================================

  // Get shipping dock schedule
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
        type: { in: ['SHIPPING', 'BOTH'] },
        isActive: true,
      },
      include: {
        shipments: {
          where: {
            OR: [
              { shipDate: { gte: startOfDay, lte: endOfDay } },
              { status: { in: ['STAGED', 'LABELED', 'PACKED'] } },
            ],
          },
          include: {
            order: {
              select: { orderNumber: true, customer: { select: { name: true } } },
            },
            carrier: { select: { name: true } },
          },
        },
      },
    });

    res.json(docks);
  }));

  // ============================================
  // SUMMARY & REPORTS
  // ============================================

  // Shipping summary
  router.get('/summary', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      pendingShipments,
      stagedShipments,
      shippedToday,
      lateOrders,
      carrierBreakdown,
    ] = await Promise.all([
      prisma.shipment.count({
        where: { ...where, status: { in: ['NEW', 'PACKING', 'PACKED', 'LABELED'] } },
      }),
      prisma.shipment.count({
        where: { ...where, status: 'STAGED' },
      }),
      prisma.shipment.count({
        where: { ...where, status: 'SHIPPED', shipDate: { gte: today } },
      }),
      prisma.order.count({
        where: {
          ...where,
          requiredDate: { lt: new Date() },
          status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
        },
      }),
      prisma.shipment.groupBy({
        by: ['carrierId'],
        where: { ...where, shipDate: { gte: today } },
        _count: true,
      }),
    ]);

    // Get carrier names for breakdown
    const carrierIds = carrierBreakdown.map(c => c.carrierId).filter(Boolean);
    const carriers = await prisma.carrier.findMany({
      where: { id: { in: carrierIds } },
      select: { id: true, name: true },
    });

    const carrierMap = Object.fromEntries(carriers.map(c => [c.id, c.name]));

    res.json({
      pendingShipments,
      stagedShipments,
      shippedToday,
      lateOrders,
      carrierBreakdown: carrierBreakdown.map(c => ({
        carrier: carrierMap[c.carrierId] || 'Unknown',
        count: c._count,
      })),
    });
  }));

  return router;
}
