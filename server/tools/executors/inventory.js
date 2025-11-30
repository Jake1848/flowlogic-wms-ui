/**
 * Inventory-related tool executors
 */

export async function investigateInventory(prisma, params) {
  const product = await prisma.product.findUnique({
    where: { sku: params.sku },
    include: {
      inventory: {
        include: {
          location: { select: { code: true, type: true } },
          warehouse: { select: { code: true, name: true } },
        },
      },
      category: { select: { name: true } },
    },
  });

  if (!product) {
    return { success: false, message: `No product found with SKU ${params.sku}` };
  }

  let transactions = [];
  if (params.include_transactions !== false) {
    transactions = await prisma.inventoryTransaction.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        location: { select: { code: true } },
        user: { select: { fullName: true } },
      },
    });
  }

  const alerts = await prisma.alert.findMany({
    where: {
      entityType: 'Product',
      entityId: product.id,
      isResolved: false,
    },
  });

  const totalOnHand = product.inventory.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
  const totalAllocated = product.inventory.reduce((sum, inv) => sum + inv.quantityAllocated, 0);
  const totalAvailable = product.inventory.reduce((sum, inv) => sum + inv.quantityAvailable, 0);

  return {
    success: true,
    product: {
      sku: product.sku,
      name: product.name,
      category: product.category?.name,
      reorderPoint: product.reorderPoint,
      minStock: product.minStock,
      maxStock: product.maxStock,
    },
    inventory: {
      totalOnHand,
      totalAllocated,
      totalAvailable,
      locations: product.inventory.map(inv => ({
        location: inv.location.code,
        warehouse: inv.warehouse.code,
        onHand: inv.quantityOnHand,
        allocated: inv.quantityAllocated,
        available: inv.quantityAvailable,
        status: inv.status,
      })),
    },
    recentTransactions: transactions.map(t => ({
      type: t.transactionType,
      quantity: t.quantity,
      location: t.location.code,
      user: t.user?.fullName,
      timestamp: t.createdAt,
      reason: t.reason,
    })),
    alerts: alerts.map(a => ({
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
    })),
    needsReorder: totalOnHand < (product.reorderPoint || 0),
  };
}

export async function getInventorySummary(prisma, params) {
  const where = params.warehouse_id ? { warehouseId: params.warehouse_id } : {};

  const [summary, lowStock, statusCounts] = await Promise.all([
    prisma.inventory.aggregate({
      where,
      _sum: { quantityOnHand: true, quantityAllocated: true, quantityAvailable: true },
      _count: true,
    }),
    prisma.inventory.findMany({
      where: {
        ...where,
        quantityOnHand: { lt: 10 },
      },
      include: {
        product: { select: { sku: true, name: true, reorderPoint: true } },
        location: { select: { code: true } },
      },
      take: 10,
    }),
    prisma.inventory.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
  ]);

  return {
    success: true,
    summary: {
      totalRecords: summary._count,
      totalOnHand: summary._sum.quantityOnHand || 0,
      totalAllocated: summary._sum.quantityAllocated || 0,
      totalAvailable: summary._sum.quantityAvailable || 0,
    },
    statusBreakdown: statusCounts.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {}),
    lowStockItems: lowStock.map(inv => ({
      sku: inv.product.sku,
      name: inv.product.name,
      location: inv.location.code,
      onHand: inv.quantityOnHand,
      reorderPoint: inv.product.reorderPoint,
    })),
  };
}

export async function createInventoryAdjustment(prisma, params) {
  const inventory = await prisma.inventory.findUnique({
    where: { id: params.inventory_id },
  });

  if (!inventory) {
    return { success: false, message: 'Inventory record not found' };
  }

  const quantityBefore = inventory.quantityOnHand;
  const quantityAfter = quantityBefore + params.adjustment_quantity;

  if (quantityAfter < 0) {
    return { success: false, message: 'Cannot adjust below zero' };
  }

  // Find a system user for the adjustment
  const systemUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  const [updatedInventory, transaction] = await prisma.$transaction([
    prisma.inventory.update({
      where: { id: params.inventory_id },
      data: {
        quantityOnHand: quantityAfter,
        quantityAvailable: quantityAfter - inventory.quantityAllocated,
      },
    }),
    prisma.inventoryTransaction.create({
      data: {
        transactionType: params.adjustment_quantity > 0 ? 'ADJUST_IN' : 'ADJUST_OUT',
        productId: inventory.productId,
        locationId: inventory.locationId,
        inventoryId: inventory.id,
        quantity: Math.abs(params.adjustment_quantity),
        quantityBefore,
        quantityAfter,
        reason: params.reason,
        notes: 'Created by Flow AI',
        userId: systemUser?.id || inventory.productId, // Fallback
        referenceType: 'AI_ADJUSTMENT',
      },
    }),
  ]);

  return {
    success: true,
    message: `Inventory adjusted from ${quantityBefore} to ${quantityAfter} (${params.adjustment_quantity > 0 ? '+' : ''}${params.adjustment_quantity})`,
    adjustment: {
      inventoryId: params.inventory_id,
      quantityBefore,
      quantityAfter,
      change: params.adjustment_quantity,
      reason: params.reason,
    },
  };
}
