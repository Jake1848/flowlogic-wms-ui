import express from 'express';

const router = express.Router();

export default function createCustomerRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // CUSTOMER CRUD
  // ============================================

  // List customers with filters
  router.get('/', asyncHandler(async (req, res) => {
    const { search, type, isActive, page = 1, limit = 20 } = req.query;

    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get customer by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  }));

  // Create customer
  router.post('/', asyncHandler(async (req, res) => {
    const {
      code,
      name,
      type,
      contactName,
      email,
      phone,
      fax,
      website,
      billingAddress,
      billingCity,
      billingState,
      billingZipCode,
      billingCountry,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZipCode,
      shippingCountry,
      paymentTerms,
      creditLimit,
      taxExempt,
      taxId,
      notes,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    // Check for duplicate code
    const existing = await prisma.customer.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return res.status(409).json({ error: 'Customer code already exists' });
    }

    const customer = await prisma.customer.create({
      data: {
        code: code.toUpperCase(),
        name,
        type: type || 'RETAIL',
        contactName,
        email,
        phone,
        fax,
        website,
        billingAddress,
        billingCity,
        billingState,
        billingZipCode,
        billingCountry: billingCountry || 'USA',
        shippingAddress: shippingAddress || billingAddress,
        shippingCity: shippingCity || billingCity,
        shippingState: shippingState || billingState,
        shippingZipCode: shippingZipCode || billingZipCode,
        shippingCountry: shippingCountry || billingCountry || 'USA',
        paymentTerms: paymentTerms || 'NET30',
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        taxExempt: taxExempt || false,
        taxId,
        notes,
        isActive: true,
      },
    });

    res.status(201).json(customer);
  }));

  // Update customer
  router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.code; // Code shouldn't change after creation

    if (updateData.creditLimit) {
      updateData.creditLimit = parseFloat(updateData.creditLimit);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    res.json(customer);
  }));

  // Deactivate customer
  router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check for active orders
    const activeOrders = await prisma.order.count({
      where: {
        customerId: id,
        status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
      },
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        error: 'Cannot deactivate customer with active orders',
        activeOrders,
      });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, customer });
  }));

  // Reactivate customer
  router.patch('/:id/reactivate', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: true },
    });

    res.json(customer);
  }));

  // ============================================
  // CUSTOMER ORDERS
  // ============================================

  // Get customer order history
  router.get('/:id/orders', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = { customerId: id };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          warehouse: { select: { code: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { orderDate: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // ============================================
  // CUSTOMER ANALYTICS
  // ============================================

  // Get customer performance metrics
  router.get('/:id/performance', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = new Date(startDate);
      if (endDate) dateFilter.orderDate.lte = new Date(endDate);
    }

    const [
      customer,
      orderStats,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.customer.findUnique({
        where: { id },
      }),
      prisma.order.aggregate({
        where: { customerId: id, ...dateFilter },
        _count: true,
        _sum: {
          totalUnits: true,
          totalLines: true,
        },
      }),
      prisma.order.findMany({
        where: { customerId: id },
        orderBy: { orderDate: 'desc' },
        take: 5,
        select: {
          orderNumber: true,
          orderDate: true,
          status: true,
          totalUnits: true,
        },
      }),
      prisma.orderLine.groupBy({
        by: ['productId'],
        where: {
          order: { customerId: id, ...dateFilter },
        },
        _sum: {
          quantityOrdered: true,
        },
        orderBy: {
          _sum: {
            quantityOrdered: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get product details for top products
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true },
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    // Calculate on-time delivery rate
    const deliveredOrders = await prisma.order.findMany({
      where: {
        customerId: id,
        status: { in: ['SHIPPED', 'DELIVERED'] },
        ...dateFilter,
      },
      select: { requiredDate: true, shippedDate: true },
    });

    const onTimeCount = deliveredOrders.filter(o =>
      o.shippedDate && o.requiredDate && o.shippedDate <= o.requiredDate
    ).length;
    const onTimeRate = deliveredOrders.length > 0
      ? ((onTimeCount / deliveredOrders.length) * 100).toFixed(1)
      : 0;

    res.json({
      customer: {
        id: customer.id,
        code: customer.code,
        name: customer.name,
        type: customer.type,
      },
      metrics: {
        totalOrders: orderStats._count,
        totalUnits: orderStats._sum.totalUnits || 0,
        totalLines: orderStats._sum.totalLines || 0,
        onTimeDeliveryRate: `${onTimeRate}%`,
        deliveredOrders: deliveredOrders.length,
      },
      recentOrders,
      topProducts: topProducts.map(p => ({
        product: productMap[p.productId],
        totalQuantity: p._sum.quantityOrdered,
      })),
    });
  }));

  // ============================================
  // SHIPPING ADDRESSES
  // ============================================

  // Get customer shipping addresses (stored as JSON or separate fields)
  router.get('/:id/addresses', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        billingAddress: true,
        billingCity: true,
        billingState: true,
        billingZipCode: true,
        billingCountry: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingZipCode: true,
        shippingCountry: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      billing: {
        address: customer.billingAddress,
        city: customer.billingCity,
        state: customer.billingState,
        zipCode: customer.billingZipCode,
        country: customer.billingCountry,
      },
      shipping: {
        address: customer.shippingAddress,
        city: customer.shippingCity,
        state: customer.shippingState,
        zipCode: customer.shippingZipCode,
        country: customer.shippingCountry,
      },
    });
  }));

  // Update shipping address
  router.patch('/:id/addresses/shipping', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { address, city, state, zipCode, country } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingZipCode: zipCode,
        shippingCountry: country,
      },
    });

    res.json(customer);
  }));

  // ============================================
  // SUMMARY & STATS
  // ============================================

  // Customer summary stats
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const [
      totalCustomers,
      activeCustomers,
      byType,
      recentlyAdded,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.customer.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, code: true, name: true, createdAt: true },
      }),
    ]);

    res.json({
      total: totalCustomers,
      active: activeCustomers,
      inactive: totalCustomers - activeCustomers,
      byType: byType.map(t => ({
        type: t.type,
        count: t._count,
      })),
      recentlyAdded,
    });
  }));

  return router;
}
