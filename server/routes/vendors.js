import express from 'express';

const router = express.Router();

export default function createVendorRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // VENDOR CRUD
  // ============================================

  // List vendors with filters
  router.get('/', asyncHandler(async (req, res) => {
    const { search, type, isActive, minRating, page = 1, limit = 20 } = req.query;

    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (minRating) where.rating = { gte: parseInt(minRating) };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          _count: {
            select: { purchaseOrders: true, products: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.vendor.count({ where }),
    ]);

    res.json({
      data: vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get vendor by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchaseOrders: true, products: true },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  }));

  // Create vendor
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
      address,
      city,
      state,
      zipCode,
      country,
      paymentTerms,
      leadTimeDays,
      minimumOrderQty,
      minimumOrderValue,
      rating,
      notes,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    // Check for duplicate code
    const existing = await prisma.vendor.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return res.status(409).json({ error: 'Vendor code already exists' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        code: code.toUpperCase(),
        name,
        type: type || 'SUPPLIER',
        contactName,
        email,
        phone,
        fax,
        website,
        address,
        city,
        state,
        zipCode,
        country: country || 'USA',
        paymentTerms: paymentTerms || 'NET30',
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : 7,
        minimumOrderQty: minimumOrderQty ? parseInt(minimumOrderQty) : null,
        minimumOrderValue: minimumOrderValue ? parseFloat(minimumOrderValue) : null,
        rating: rating ? parseInt(rating) : 3,
        notes,
        isActive: true,
      },
    });

    res.status(201).json(vendor);
  }));

  // Update vendor
  router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.code; // Code shouldn't change after creation

    // Parse numeric fields
    if (updateData.leadTimeDays) {
      updateData.leadTimeDays = parseInt(updateData.leadTimeDays);
    }
    if (updateData.minimumOrderQty) {
      updateData.minimumOrderQty = parseInt(updateData.minimumOrderQty);
    }
    if (updateData.minimumOrderValue) {
      updateData.minimumOrderValue = parseFloat(updateData.minimumOrderValue);
    }
    if (updateData.rating) {
      updateData.rating = Math.min(5, Math.max(1, parseInt(updateData.rating)));
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    res.json(vendor);
  }));

  // Deactivate vendor
  router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check for open POs
    const openPOs = await prisma.purchaseOrder.count({
      where: {
        vendorId: id,
        status: { notIn: ['RECEIVED', 'CANCELLED', 'CLOSED'] },
      },
    });

    if (openPOs > 0) {
      return res.status(400).json({
        error: 'Cannot deactivate vendor with open purchase orders',
        openPOs,
      });
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, vendor });
  }));

  // Reactivate vendor
  router.patch('/:id/reactivate', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { isActive: true },
    });

    res.json(vendor);
  }));

  // Update vendor rating
  router.patch('/:id/rating', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, reason } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        rating: parseInt(rating),
        notes: reason
          ? `${new Date().toISOString().split('T')[0]}: Rating updated to ${rating} - ${reason}`
          : undefined,
      },
    });

    res.json(vendor);
  }));

  // ============================================
  // VENDOR PRODUCTS
  // ============================================

  // Get vendor products
  router.get('/:id/products', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const [products, total] = await Promise.all([
      prisma.productVendor.findMany({
        where: { vendorId: id },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              description: true,
              cost: true,
              isActive: true,
            },
          },
        },
        orderBy: { product: { sku: 'asc' } },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.productVendor.count({ where: { vendorId: id } }),
    ]);

    res.json({
      data: products.map(pv => ({
        ...pv.product,
        vendorSku: pv.vendorSku,
        vendorCost: pv.cost,
        vendorLeadTime: pv.leadTimeDays,
        minOrderQty: pv.minOrderQty,
        isPrimary: pv.isPrimary,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Add product to vendor
  router.post('/:id/products', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productId, vendorSku, cost, leadTimeDays, minOrderQty, isPrimary } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Check if relationship already exists
    const existing = await prisma.productVendor.findUnique({
      where: {
        productId_vendorId: {
          productId,
          vendorId: id,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Product already assigned to this vendor' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // If this is primary, unset other primaries for this product
      if (isPrimary) {
        await tx.productVendor.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.productVendor.create({
        data: {
          productId,
          vendorId: id,
          vendorSku,
          cost: cost ? parseFloat(cost) : null,
          leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : null,
          minOrderQty: minOrderQty ? parseInt(minOrderQty) : null,
          isPrimary: isPrimary || false,
        },
        include: {
          product: { select: { sku: true, name: true } },
        },
      });
    });

    res.status(201).json(result);
  }));

  // Update vendor product relationship
  router.put('/:id/products/:productId', asyncHandler(async (req, res) => {
    const { id, productId } = req.params;
    const { vendorSku, cost, leadTimeDays, minOrderQty, isPrimary } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // If setting as primary, unset other primaries
      if (isPrimary) {
        await tx.productVendor.updateMany({
          where: { productId, isPrimary: true, vendorId: { not: id } },
          data: { isPrimary: false },
        });
      }

      return tx.productVendor.update({
        where: {
          productId_vendorId: {
            productId,
            vendorId: id,
          },
        },
        data: {
          vendorSku,
          cost: cost ? parseFloat(cost) : undefined,
          leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : undefined,
          minOrderQty: minOrderQty ? parseInt(minOrderQty) : undefined,
          isPrimary,
        },
      });
    });

    res.json(result);
  }));

  // Remove product from vendor
  router.delete('/:id/products/:productId', asyncHandler(async (req, res) => {
    const { id, productId } = req.params;

    await prisma.productVendor.delete({
      where: {
        productId_vendorId: {
          productId,
          vendorId: id,
        },
      },
    });

    res.json({ success: true });
  }));

  // ============================================
  // VENDOR PURCHASE ORDERS
  // ============================================

  // Get vendor purchase orders
  router.get('/:id/purchase-orders', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = { vendorId: id };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          warehouse: { select: { code: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { orderDate: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.purchaseOrder.count({ where }),
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
  // VENDOR PERFORMANCE & ANALYTICS
  // ============================================

  // Get vendor performance metrics
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
      vendor,
      poStats,
      receiptStats,
      recentPOs,
    ] = await Promise.all([
      prisma.vendor.findUnique({
        where: { id },
      }),
      prisma.purchaseOrder.aggregate({
        where: { vendorId: id, ...dateFilter },
        _count: true,
        _sum: {
          totalUnits: true,
          totalCost: true,
        },
      }),
      prisma.receipt.findMany({
        where: {
          purchaseOrder: { vendorId: id },
          status: 'COMPLETED',
          ...dateFilter,
        },
        select: {
          receivedDate: true,
          purchaseOrder: {
            select: { expectedDate: true },
          },
        },
      }),
      prisma.purchaseOrder.findMany({
        where: { vendorId: id },
        orderBy: { orderDate: 'desc' },
        take: 5,
        select: {
          poNumber: true,
          orderDate: true,
          status: true,
          totalUnits: true,
          totalCost: true,
        },
      }),
    ]);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Calculate on-time delivery rate
    const onTimeCount = receiptStats.filter(r =>
      r.receivedDate && r.purchaseOrder.expectedDate &&
      r.receivedDate <= r.purchaseOrder.expectedDate
    ).length;
    const onTimeRate = receiptStats.length > 0
      ? ((onTimeCount / receiptStats.length) * 100).toFixed(1)
      : 0;

    // Calculate average lead time from completed POs
    const completedPOs = await prisma.purchaseOrder.findMany({
      where: {
        vendorId: id,
        status: 'RECEIVED',
        ...dateFilter,
      },
      select: { orderDate: true, receivedDate: true },
    });

    let avgLeadTime = vendor.leadTimeDays;
    if (completedPOs.length > 0) {
      const totalDays = completedPOs.reduce((sum, po) => {
        if (po.receivedDate && po.orderDate) {
          return sum + Math.ceil((po.receivedDate - po.orderDate) / (1000 * 60 * 60 * 24));
        }
        return sum;
      }, 0);
      avgLeadTime = Math.round(totalDays / completedPOs.length);
    }

    res.json({
      vendor: {
        id: vendor.id,
        code: vendor.code,
        name: vendor.name,
        type: vendor.type,
        rating: vendor.rating,
      },
      metrics: {
        totalPOs: poStats._count,
        totalUnits: poStats._sum.totalUnits || 0,
        totalSpend: poStats._sum.totalCost || 0,
        onTimeDeliveryRate: `${onTimeRate}%`,
        averageLeadTimeDays: avgLeadTime,
        completedReceipts: receiptStats.length,
      },
      recentPOs,
    });
  }));

  // ============================================
  // SUMMARY & STATS
  // ============================================

  // Vendor summary stats
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const [
      totalVendors,
      activeVendors,
      byType,
      byRating,
      topVendors,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.vendor.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.vendor.groupBy({
        by: ['rating'],
        _count: true,
        orderBy: { rating: 'desc' },
      }),
      prisma.purchaseOrder.groupBy({
        by: ['vendorId'],
        _sum: { totalCost: true },
        _count: true,
        orderBy: { _sum: { totalCost: 'desc' } },
        take: 5,
      }),
    ]);

    // Get vendor names for top vendors
    const vendorIds = topVendors.map(v => v.vendorId);
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, code: true, name: true },
    });
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v]));

    res.json({
      total: totalVendors,
      active: activeVendors,
      inactive: totalVendors - activeVendors,
      byType: byType.map(t => ({
        type: t.type,
        count: t._count,
      })),
      byRating: byRating.map(r => ({
        rating: r.rating,
        count: r._count,
      })),
      topBySpend: topVendors.map(v => ({
        vendor: vendorMap[v.vendorId],
        poCount: v._count,
        totalSpend: v._sum.totalCost || 0,
      })),
    });
  }));

  return router;
}
