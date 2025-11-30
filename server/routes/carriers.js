import express from 'express';

const router = express.Router();

export default function createCarrierRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // CARRIER CRUD
  // ============================================

  // List carriers with filters
  router.get('/', asyncHandler(async (req, res) => {
    const { search, type, isActive, page = 1, limit = 20 } = req.query;

    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [carriers, total] = await Promise.all([
      prisma.carrier.findMany({
        where,
        include: {
          services: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: { shipments: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.carrier.count({ where }),
    ]);

    res.json({
      data: carriers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get carrier by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const carrier = await prisma.carrier.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { shipments: true },
        },
      },
    });

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    res.json(carrier);
  }));

  // Create carrier
  router.post('/', asyncHandler(async (req, res) => {
    const {
      code,
      name,
      type,
      accountNumber,
      apiKey,
      apiSecret,
      apiEndpoint,
      trackingUrl,
      contactName,
      contactEmail,
      contactPhone,
      notes,
      services,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    // Check for duplicate code
    const existing = await prisma.carrier.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return res.status(409).json({ error: 'Carrier code already exists' });
    }

    const carrier = await prisma.carrier.create({
      data: {
        code: code.toUpperCase(),
        name,
        type: type || 'PARCEL',
        accountNumber,
        apiKey,
        apiSecret,
        apiEndpoint,
        trackingUrl,
        contactName,
        contactEmail,
        contactPhone,
        notes,
        isActive: true,
        services: services && services.length > 0 ? {
          create: services.map(s => ({
            code: s.code?.toUpperCase() || `${code.toUpperCase()}-${s.name?.substring(0, 3).toUpperCase()}`,
            name: s.name,
            transitDays: s.transitDays ? parseInt(s.transitDays) : null,
            isActive: true,
          })),
        } : undefined,
      },
      include: {
        services: true,
      },
    });

    res.status(201).json(carrier);
  }));

  // Update carrier
  router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.code;
    delete updateData.createdAt;
    delete updateData.services;

    const carrier = await prisma.carrier.update({
      where: { id },
      data: updateData,
      include: {
        services: true,
      },
    });

    res.json(carrier);
  }));

  // Deactivate carrier
  router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check for pending shipments
    const pendingShipments = await prisma.shipment.count({
      where: {
        carrierId: id,
        status: { notIn: ['SHIPPED', 'DELIVERED', 'EXCEPTION'] },
      },
    });

    if (pendingShipments > 0) {
      return res.status(400).json({
        error: 'Cannot deactivate carrier with pending shipments',
        pendingShipments,
      });
    }

    const carrier = await prisma.carrier.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, carrier });
  }));

  // Reactivate carrier
  router.patch('/:id/reactivate', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const carrier = await prisma.carrier.update({
      where: { id },
      data: { isActive: true },
    });

    res.json(carrier);
  }));

  // Test carrier connection (mock)
  router.post('/:id/test', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const carrier = await prisma.carrier.findUnique({
      where: { id },
      select: { code: true, name: true, apiKey: true, apiEndpoint: true },
    });

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    // Mock connection test - in real implementation would call carrier API
    const hasCredentials = !!(carrier.apiKey && carrier.apiEndpoint);

    res.json({
      carrierId: id,
      carrierCode: carrier.code,
      status: hasCredentials ? 'SUCCESS' : 'NOT_CONFIGURED',
      message: hasCredentials
        ? 'Connection test successful (mock)'
        : 'Carrier API credentials not configured',
      testedAt: new Date().toISOString(),
    });
  }));

  // ============================================
  // CARRIER SERVICES
  // ============================================

  // List carrier services
  router.get('/:id/services', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.query;

    const where = { carrierId: id };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const services = await prisma.carrierService.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(services);
  }));

  // Add service to carrier
  router.post('/:id/services', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { code, name, transitDays, description } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    // Check for duplicate code within this carrier
    const existing = await prisma.carrierService.findFirst({
      where: {
        carrierId: id,
        code: code.toUpperCase(),
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Service code already exists for this carrier' });
    }

    const service = await prisma.carrierService.create({
      data: {
        carrierId: id,
        code: code.toUpperCase(),
        name,
        transitDays: transitDays ? parseInt(transitDays) : null,
        description,
        isActive: true,
      },
    });

    res.status(201).json(service);
  }));

  // Update service
  router.put('/:id/services/:serviceId', asyncHandler(async (req, res) => {
    const { serviceId } = req.params;
    const { name, transitDays, description, isActive } = req.body;

    const service = await prisma.carrierService.update({
      where: { id: serviceId },
      data: {
        name,
        transitDays: transitDays !== undefined ? parseInt(transitDays) : undefined,
        description,
        isActive,
      },
    });

    res.json(service);
  }));

  // Delete service
  router.delete('/:id/services/:serviceId', asyncHandler(async (req, res) => {
    const { serviceId } = req.params;

    // Check for shipments using this service
    const shipmentsUsing = await prisma.shipment.count({
      where: { serviceId },
    });

    if (shipmentsUsing > 0) {
      // Soft delete by deactivating
      await prisma.carrierService.update({
        where: { id: serviceId },
        data: { isActive: false },
      });
      return res.json({ success: true, message: 'Service deactivated (has shipment history)' });
    }

    await prisma.carrierService.delete({
      where: { id: serviceId },
    });

    res.json({ success: true });
  }));

  // ============================================
  // CARRIER RATES (Mock implementation)
  // ============================================

  // Get shipping rates
  router.post('/:id/rates', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fromZip, toZip, weight, dimensions, serviceId } = req.body;

    const carrier = await prisma.carrier.findUnique({
      where: { id },
      include: {
        services: { where: { isActive: true } },
      },
    });

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    // Mock rate calculation - in real implementation would call carrier API
    const baseRate = parseFloat(weight || 1) * 0.5;
    const services = serviceId
      ? carrier.services.filter(s => s.id === serviceId)
      : carrier.services;

    const rates = services.map((service, index) => ({
      serviceId: service.id,
      serviceCode: service.code,
      serviceName: service.name,
      transitDays: service.transitDays || (index + 1),
      rate: (baseRate * (1 + index * 0.25)).toFixed(2),
      currency: 'USD',
      estimatedDelivery: new Date(
        Date.now() + (service.transitDays || (index + 1)) * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
    }));

    res.json({
      carrierId: id,
      carrierCode: carrier.code,
      origin: fromZip,
      destination: toZip,
      weight,
      rates,
      quotedAt: new Date().toISOString(),
      note: 'Mock rates - integrate with carrier API for live rates',
    });
  }));

  // ============================================
  // CARRIER SHIPMENTS & TRACKING
  // ============================================

  // Get carrier shipments
  router.get('/:id/shipments', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = { carrierId: id };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.shipDate = {};
      if (startDate) where.shipDate.gte = new Date(startDate);
      if (endDate) where.shipDate.lte = new Date(endDate);
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          service: { select: { code: true, name: true } },
          order: {
            select: {
              orderNumber: true,
              customer: { select: { name: true } },
            },
          },
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

  // Track shipment (mock)
  router.get('/:id/track/:trackingNumber', asyncHandler(async (req, res) => {
    const { id, trackingNumber } = req.params;

    const shipment = await prisma.shipment.findFirst({
      where: {
        carrierId: id,
        trackingNumber,
      },
      include: {
        carrier: { select: { code: true, name: true, trackingUrl: true } },
        service: { select: { name: true, transitDays: true } },
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Mock tracking events - in real implementation would call carrier API
    const events = [];
    if (shipment.shipDate) {
      events.push({
        timestamp: shipment.shipDate.toISOString(),
        status: 'SHIPPED',
        location: 'Origin Facility',
        description: 'Package shipped',
      });

      if (shipment.status === 'DELIVERED') {
        events.push({
          timestamp: new Date(shipment.shipDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'IN_TRANSIT',
          location: 'Distribution Center',
          description: 'Package in transit',
        });
        events.push({
          timestamp: new Date(shipment.shipDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'DELIVERED',
          location: shipment.shipToCity,
          description: 'Package delivered',
        });
      }
    }

    res.json({
      trackingNumber,
      carrier: shipment.carrier,
      service: shipment.service?.name,
      status: shipment.status,
      shipDate: shipment.shipDate,
      estimatedDelivery: shipment.service?.transitDays && shipment.shipDate
        ? new Date(shipment.shipDate.getTime() + shipment.service.transitDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null,
      trackingUrl: shipment.carrier?.trackingUrl
        ? `${shipment.carrier.trackingUrl}${trackingNumber}`
        : null,
      events,
    });
  }));

  // ============================================
  // CARRIER PERFORMANCE & ANALYTICS
  // ============================================

  // Get carrier performance metrics
  router.get('/:id/performance', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.shipDate = {};
      if (startDate) dateFilter.shipDate.gte = new Date(startDate);
      if (endDate) dateFilter.shipDate.lte = new Date(endDate);
    }

    const [
      carrier,
      shipmentStats,
      byService,
      byStatus,
    ] = await Promise.all([
      prisma.carrier.findUnique({
        where: { id },
        select: { id: true, code: true, name: true, type: true },
      }),
      prisma.shipment.aggregate({
        where: { carrierId: id, ...dateFilter },
        _count: true,
        _sum: {
          totalWeight: true,
          totalPackages: true,
        },
      }),
      prisma.shipment.groupBy({
        by: ['serviceId'],
        where: { carrierId: id, ...dateFilter },
        _count: true,
      }),
      prisma.shipment.groupBy({
        by: ['status'],
        where: { carrierId: id, ...dateFilter },
        _count: true,
      }),
    ]);

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    // Get service names
    const serviceIds = byService.map(s => s.serviceId).filter(Boolean);
    const services = await prisma.carrierService.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, code: true, name: true },
    });
    const serviceMap = Object.fromEntries(services.map(s => [s.id, s]));

    res.json({
      carrier,
      metrics: {
        totalShipments: shipmentStats._count,
        totalWeight: shipmentStats._sum.totalWeight || 0,
        totalPackages: shipmentStats._sum.totalPackages || 0,
      },
      byService: byService.map(s => ({
        service: serviceMap[s.serviceId] || { name: 'Unknown' },
        count: s._count,
      })),
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
    });
  }));

  // ============================================
  // SUMMARY & STATS
  // ============================================

  // Carrier summary stats
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      totalCarriers,
      activeCarriers,
      byType,
      shipmentsToday,
      topCarriers,
    ] = await Promise.all([
      prisma.carrier.count(),
      prisma.carrier.count({ where: { isActive: true } }),
      prisma.carrier.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.shipment.count({
        where: { shipDate: { gte: today } },
      }),
      prisma.shipment.groupBy({
        by: ['carrierId'],
        _count: true,
        orderBy: { _count: { carrierId: 'desc' } },
        take: 5,
      }),
    ]);

    // Get carrier names for top carriers
    const carrierIds = topCarriers.map(c => c.carrierId).filter(Boolean);
    const carriers = await prisma.carrier.findMany({
      where: { id: { in: carrierIds } },
      select: { id: true, code: true, name: true },
    });
    const carrierMap = Object.fromEntries(carriers.map(c => [c.id, c]));

    res.json({
      total: totalCarriers,
      active: activeCarriers,
      inactive: totalCarriers - activeCarriers,
      byType: byType.map(t => ({
        type: t.type,
        count: t._count,
      })),
      shipmentsToday,
      topCarriers: topCarriers.map(c => ({
        carrier: carrierMap[c.carrierId],
        shipmentCount: c._count,
      })),
    });
  }));

  return router;
}
