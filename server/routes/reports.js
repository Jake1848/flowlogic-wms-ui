import express from 'express';

const router = express.Router();

export default function createReportRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // INVENTORY REPORTS
  // ============================================

  // Inventory value report
  router.get('/inventory/value', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: { sku: true, name: true, cost: true },
        },
        warehouse: { select: { code: true, name: true } },
      },
    });

    // Calculate value by product
    const byProduct = {};
    let totalValue = 0;
    let totalUnits = 0;

    for (const inv of inventory) {
      const cost = inv.product.cost ? parseFloat(inv.product.cost) : 0;
      const value = inv.quantityOnHand * cost;
      totalValue += value;
      totalUnits += inv.quantityOnHand;

      const sku = inv.product.sku;
      if (!byProduct[sku]) {
        byProduct[sku] = {
          sku,
          name: inv.product.name,
          cost,
          quantity: 0,
          value: 0,
        };
      }
      byProduct[sku].quantity += inv.quantityOnHand;
      byProduct[sku].value += value;
    }

    const productList = Object.values(byProduct)
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);

    res.json({
      summary: {
        totalValue: totalValue.toFixed(2),
        totalUnits,
        uniqueProducts: Object.keys(byProduct).length,
        averageValue: totalUnits > 0 ? (totalValue / totalUnits).toFixed(2) : 0,
      },
      topProducts: productList,
      generatedAt: new Date().toISOString(),
    });
  }));

  // ABC analysis report
  router.get('/inventory/abc', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: { sku: true, name: true, cost: true, velocityCode: true },
        },
      },
    });

    // Aggregate by product
    const productTotals = {};
    for (const inv of inventory) {
      const sku = inv.product.sku;
      const cost = inv.product.cost ? parseFloat(inv.product.cost) : 0;
      if (!productTotals[sku]) {
        productTotals[sku] = {
          sku,
          name: inv.product.name,
          velocityCode: inv.product.velocityCode,
          quantity: 0,
          value: 0,
        };
      }
      productTotals[sku].quantity += inv.quantityOnHand;
      productTotals[sku].value += inv.quantityOnHand * cost;
    }

    // Sort by value and calculate cumulative percentage
    const sorted = Object.values(productTotals).sort((a, b) => b.value - a.value);
    const totalValue = sorted.reduce((sum, p) => sum + p.value, 0);

    let cumulative = 0;
    const classified = sorted.map(p => {
      cumulative += p.value;
      const cumulativePct = totalValue > 0 ? (cumulative / totalValue) * 100 : 0;
      let classification;
      if (cumulativePct <= 80) classification = 'A';
      else if (cumulativePct <= 95) classification = 'B';
      else classification = 'C';

      return {
        ...p,
        valuePct: totalValue > 0 ? ((p.value / totalValue) * 100).toFixed(2) : 0,
        cumulativePct: cumulativePct.toFixed(2),
        classification,
      };
    });

    const summary = {
      A: { count: 0, value: 0, quantity: 0 },
      B: { count: 0, value: 0, quantity: 0 },
      C: { count: 0, value: 0, quantity: 0 },
    };

    for (const p of classified) {
      summary[p.classification].count++;
      summary[p.classification].value += p.value;
      summary[p.classification].quantity += p.quantity;
    }

    res.json({
      summary: {
        totalProducts: classified.length,
        totalValue: totalValue.toFixed(2),
        byClassification: {
          A: {
            ...summary.A,
            value: summary.A.value.toFixed(2),
            pctOfTotal: totalValue > 0 ? ((summary.A.value / totalValue) * 100).toFixed(1) : 0,
          },
          B: {
            ...summary.B,
            value: summary.B.value.toFixed(2),
            pctOfTotal: totalValue > 0 ? ((summary.B.value / totalValue) * 100).toFixed(1) : 0,
          },
          C: {
            ...summary.C,
            value: summary.C.value.toFixed(2),
            pctOfTotal: totalValue > 0 ? ((summary.C.value / totalValue) * 100).toFixed(1) : 0,
          },
        },
      },
      products: classified.slice(0, 100),
      generatedAt: new Date().toISOString(),
    });
  }));

  // Inventory aging report
  router.get('/inventory/aging', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};

    const inventory = await prisma.inventory.findMany({
      where: { ...where, quantityOnHand: { gt: 0 } },
      include: {
        product: { select: { sku: true, name: true, cost: true } },
        location: { select: { code: true } },
      },
    });

    const now = new Date();
    const aging = {
      '0-30': { count: 0, quantity: 0, value: 0 },
      '31-60': { count: 0, quantity: 0, value: 0 },
      '61-90': { count: 0, quantity: 0, value: 0 },
      '90+': { count: 0, quantity: 0, value: 0 },
    };

    const items = inventory.map(inv => {
      const daysSinceReceipt = inv.lastReceivedAt
        ? Math.floor((now - new Date(inv.lastReceivedAt)) / (1000 * 60 * 60 * 24))
        : 999;
      const cost = inv.product.cost ? parseFloat(inv.product.cost) : 0;
      const value = inv.quantityOnHand * cost;

      let bucket;
      if (daysSinceReceipt <= 30) bucket = '0-30';
      else if (daysSinceReceipt <= 60) bucket = '31-60';
      else if (daysSinceReceipt <= 90) bucket = '61-90';
      else bucket = '90+';

      aging[bucket].count++;
      aging[bucket].quantity += inv.quantityOnHand;
      aging[bucket].value += value;

      return {
        sku: inv.product.sku,
        name: inv.product.name,
        location: inv.location?.code,
        quantity: inv.quantityOnHand,
        daysSinceReceipt,
        value: value.toFixed(2),
        bucket,
      };
    });

    // Sort by days (oldest first)
    items.sort((a, b) => b.daysSinceReceipt - a.daysSinceReceipt);

    res.json({
      summary: {
        '0-30 days': { ...aging['0-30'], value: aging['0-30'].value.toFixed(2) },
        '31-60 days': { ...aging['31-60'], value: aging['31-60'].value.toFixed(2) },
        '61-90 days': { ...aging['61-90'], value: aging['61-90'].value.toFixed(2) },
        '90+ days': { ...aging['90+'], value: aging['90+'].value.toFixed(2) },
      },
      oldestItems: items.slice(0, 50),
      generatedAt: new Date().toISOString(),
    });
  }));

  // ============================================
  // ORDER REPORTS
  // ============================================

  // Order fulfillment report
  router.get('/orders/fulfillment', asyncHandler(async (req, res) => {
    const { warehouseId, startDate, endDate } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    const [
      totalOrders,
      byStatus,
      lateOrders,
      shippedOrders,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.order.count({
        where: {
          ...where,
          requiredDate: { lt: new Date() },
          status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
        },
      }),
      prisma.order.findMany({
        where: {
          ...where,
          status: { in: ['SHIPPED', 'DELIVERED'] },
          shippedDate: { not: null },
        },
        select: { orderDate: true, shippedDate: true, requiredDate: true },
      }),
    ]);

    // Calculate on-time shipping rate
    const onTimeCount = shippedOrders.filter(o =>
      o.shippedDate && o.requiredDate && o.shippedDate <= o.requiredDate
    ).length;
    const onTimeRate = shippedOrders.length > 0
      ? ((onTimeCount / shippedOrders.length) * 100).toFixed(1)
      : 0;

    // Calculate average fulfillment time
    const fulfillmentTimes = shippedOrders
      .filter(o => o.orderDate && o.shippedDate)
      .map(o => Math.floor((new Date(o.shippedDate) - new Date(o.orderDate)) / (1000 * 60 * 60 * 24)));
    const avgFulfillmentDays = fulfillmentTimes.length > 0
      ? (fulfillmentTimes.reduce((a, b) => a + b, 0) / fulfillmentTimes.length).toFixed(1)
      : 0;

    res.json({
      summary: {
        totalOrders,
        shippedOrders: shippedOrders.length,
        lateOrders,
        onTimeRate: `${onTimeRate}%`,
        avgFulfillmentDays,
      },
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        pct: totalOrders > 0 ? ((s._count / totalOrders) * 100).toFixed(1) : 0,
      })),
      generatedAt: new Date().toISOString(),
    });
  }));

  // Order volume trends
  router.get('/orders/trends', asyncHandler(async (req, res) => {
    const { warehouseId, days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const where = {
      orderDate: { gte: startDate },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const orders = await prisma.order.findMany({
      where,
      select: {
        orderDate: true,
        totalUnits: true,
        totalLines: true,
        status: true,
      },
    });

    // Group by date
    const byDate = {};
    for (const order of orders) {
      const date = order.orderDate.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { orders: 0, units: 0, lines: 0 };
      }
      byDate[date].orders++;
      byDate[date].units += order.totalUnits || 0;
      byDate[date].lines += order.totalLines || 0;
    }

    // Fill in missing dates
    const trends = [];
    const current = new Date(startDate);
    const today = new Date();
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      trends.push({
        date: dateStr,
        orders: byDate[dateStr]?.orders || 0,
        units: byDate[dateStr]?.units || 0,
        lines: byDate[dateStr]?.lines || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    res.json({
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        days: parseInt(days),
      },
      totals: {
        orders: orders.length,
        units: orders.reduce((sum, o) => sum + (o.totalUnits || 0), 0),
        lines: orders.reduce((sum, o) => sum + (o.totalLines || 0), 0),
      },
      trends,
      generatedAt: new Date().toISOString(),
    });
  }));

  // ============================================
  // RECEIVING REPORTS
  // ============================================

  // Receiving performance report
  router.get('/receiving/performance', asyncHandler(async (req, res) => {
    const { warehouseId, startDate, endDate } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) where.receivedDate.gte = new Date(startDate);
      if (endDate) where.receivedDate.lte = new Date(endDate);
    }

    const [
      receipts,
      byStatus,
      byVendor,
    ] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          purchaseOrder: {
            select: { expectedDate: true, vendor: { select: { name: true } } },
          },
        },
      }),
      prisma.receipt.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.receipt.groupBy({
        by: ['purchaseOrderId'],
        where,
        _count: true,
        _sum: { totalUnitsReceived: true },
      }),
    ]);

    // Calculate metrics
    const totalUnits = receipts.reduce((sum, r) => sum + (r.totalUnitsReceived || 0), 0);
    const completedReceipts = receipts.filter(r => r.status === 'COMPLETED');

    // On-time receiving
    const onTimeCount = completedReceipts.filter(r =>
      r.receivedDate && r.purchaseOrder?.expectedDate &&
      r.receivedDate <= r.purchaseOrder.expectedDate
    ).length;
    const onTimeRate = completedReceipts.length > 0
      ? ((onTimeCount / completedReceipts.length) * 100).toFixed(1)
      : 0;

    res.json({
      summary: {
        totalReceipts: receipts.length,
        completedReceipts: completedReceipts.length,
        totalUnitsReceived: totalUnits,
        onTimeReceivingRate: `${onTimeRate}%`,
      },
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
      generatedAt: new Date().toISOString(),
    });
  }));

  // ============================================
  // SHIPPING REPORTS
  // ============================================

  // Shipping performance report
  router.get('/shipping/performance', asyncHandler(async (req, res) => {
    const { warehouseId, startDate, endDate } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.shipDate = {};
      if (startDate) where.shipDate.gte = new Date(startDate);
      if (endDate) where.shipDate.lte = new Date(endDate);
    }

    const [
      shipments,
      byStatus,
      byCarrier,
    ] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          carrier: { select: { name: true } },
        },
      }),
      prisma.shipment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.shipment.groupBy({
        by: ['carrierId'],
        where,
        _count: true,
        _sum: { totalPackages: true, totalWeight: true },
      }),
    ]);

    // Get carrier names
    const carrierIds = byCarrier.map(c => c.carrierId).filter(Boolean);
    const carriers = await prisma.carrier.findMany({
      where: { id: { in: carrierIds } },
      select: { id: true, name: true },
    });
    const carrierMap = Object.fromEntries(carriers.map(c => [c.id, c.name]));

    const totalPackages = shipments.reduce((sum, s) => sum + (s.totalPackages || 0), 0);
    const totalWeight = shipments.reduce((sum, s) => sum + (s.totalWeight || 0), 0);

    res.json({
      summary: {
        totalShipments: shipments.length,
        totalPackages,
        totalWeight: totalWeight.toFixed(2),
        shippedCount: shipments.filter(s => s.status === 'SHIPPED' || s.status === 'DELIVERED').length,
      },
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
      byCarrier: byCarrier.map(c => ({
        carrier: carrierMap[c.carrierId] || 'Unknown',
        shipments: c._count,
        packages: c._sum.totalPackages || 0,
        weight: (c._sum.totalWeight || 0).toFixed(2),
      })),
      generatedAt: new Date().toISOString(),
    });
  }));

  // ============================================
  // LABOR REPORTS
  // ============================================

  // Labor productivity report
  router.get('/labor/productivity', asyncHandler(async (req, res) => {
    const { warehouseId, startDate, endDate } = req.query;

    const where = { endTime: { not: null } };
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const entries = await prisma.laborEntry.findMany({
      where,
      include: {
        user: { select: { fullName: true, role: true } },
      },
    });

    // Aggregate by user
    const byUser = {};
    for (const entry of entries) {
      const userId = entry.userId;
      if (!byUser[userId]) {
        byUser[userId] = {
          user: entry.user,
          minutes: 0,
          units: 0,
          lines: 0,
          entries: 0,
        };
      }
      byUser[userId].minutes += entry.durationMinutes || 0;
      byUser[userId].units += entry.unitsProcessed || 0;
      byUser[userId].lines += entry.linesProcessed || 0;
      byUser[userId].entries++;
    }

    // Calculate UPH and sort
    const userStats = Object.values(byUser).map(u => ({
      ...u,
      hours: (u.minutes / 60).toFixed(2),
      uph: u.minutes > 0 ? Math.round((u.units / u.minutes) * 60) : 0,
    })).sort((a, b) => b.uph - a.uph);

    // Aggregate by activity
    const byActivity = {};
    for (const entry of entries) {
      const type = entry.activityType;
      if (!byActivity[type]) {
        byActivity[type] = { minutes: 0, units: 0, entries: 0 };
      }
      byActivity[type].minutes += entry.durationMinutes || 0;
      byActivity[type].units += entry.unitsProcessed || 0;
      byActivity[type].entries++;
    }

    const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
    const totalUnits = entries.reduce((sum, e) => sum + (e.unitsProcessed || 0), 0);

    res.json({
      summary: {
        totalHours: (totalMinutes / 60).toFixed(2),
        totalUnits,
        totalEntries: entries.length,
        averageUPH: totalMinutes > 0 ? Math.round((totalUnits / totalMinutes) * 60) : 0,
        activeUsers: Object.keys(byUser).length,
      },
      topPerformers: userStats.slice(0, 10),
      byActivity: Object.entries(byActivity).map(([type, data]) => ({
        activity: type,
        hours: (data.minutes / 60).toFixed(2),
        units: data.units,
        entries: data.entries,
        uph: data.minutes > 0 ? Math.round((data.units / data.minutes) * 60) : 0,
      })),
      generatedAt: new Date().toISOString(),
    });
  }));

  // ============================================
  // FINANCIAL REPORTS
  // ============================================

  // Cost analysis report
  router.get('/financial/costs', asyncHandler(async (req, res) => {
    const { warehouseId, startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = new Date(startDate);
      if (endDate) dateFilter.orderDate.lte = new Date(endDate);
    }

    const where = warehouseId ? { warehouseId, ...dateFilter } : dateFilter;

    const [
      poStats,
      inventoryValue,
      orderStats,
    ] = await Promise.all([
      prisma.purchaseOrder.aggregate({
        where: {
          ...where,
          status: { not: 'CANCELLED' },
        },
        _sum: { totalCost: true },
        _count: true,
      }),
      prisma.inventory.findMany({
        where: warehouseId ? { warehouseId } : {},
        include: {
          product: { select: { cost: true } },
        },
      }),
      prisma.order.aggregate({
        where: {
          ...where,
          status: { not: 'CANCELLED' },
        },
        _sum: { totalUnits: true },
        _count: true,
      }),
    ]);

    // Calculate inventory value
    const totalInventoryValue = inventoryValue.reduce((sum, inv) => {
      const cost = inv.product.cost ? parseFloat(inv.product.cost) : 0;
      return sum + (inv.quantityOnHand * cost);
    }, 0);

    res.json({
      summary: {
        purchaseOrderCost: (poStats._sum.totalCost || 0).toFixed(2),
        purchaseOrderCount: poStats._count,
        currentInventoryValue: totalInventoryValue.toFixed(2),
        orderCount: orderStats._count,
        unitsOrdered: orderStats._sum.totalUnits || 0,
      },
      generatedAt: new Date().toISOString(),
    });
  }));

  // ============================================
  // EXPORT FUNCTIONALITY
  // ============================================

  // Export report data as CSV
  router.get('/export/:reportType', asyncHandler(async (req, res) => {
    const { reportType } = req.params;
    const { warehouseId, startDate, endDate, format = 'csv' } = req.query;

    // For now, return JSON with a note about CSV export
    res.json({
      message: 'Export functionality',
      reportType,
      format,
      note: 'Full CSV/Excel export would be implemented with a library like json2csv or exceljs',
      parameters: { warehouseId, startDate, endDate },
    });
  }));

  return router;
}
