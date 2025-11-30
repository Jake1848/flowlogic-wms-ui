/**
 * Location-related tool executors
 */

export async function investigateLocation(prisma, params) {
  const location = await prisma.location.findFirst({
    where: { code: params.location_code },
    include: {
      zone: {
        include: { warehouse: { select: { code: true, name: true } } },
      },
      inventory: {
        include: {
          product: { select: { sku: true, name: true } },
        },
      },
    },
  });

  if (!location) {
    return { success: false, message: `No location found with code ${params.location_code}` };
  }

  const recentTransactions = await prisma.inventoryTransaction.findMany({
    where: { locationId: location.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      product: { select: { sku: true } },
      user: { select: { fullName: true } },
    },
  });

  return {
    success: true,
    location: {
      code: location.code,
      type: location.type,
      zone: location.zone.name,
      warehouse: location.zone.warehouse.name,
      minQuantity: location.minQuantity,
      maxQuantity: location.maxQuantity,
      reorderPoint: location.reorderPoint,
      isPickable: location.isPickable,
      isReplenishable: location.isReplenishable,
    },
    contents: location.inventory.map(inv => ({
      sku: inv.product.sku,
      productName: inv.product.name,
      onHand: inv.quantityOnHand,
      allocated: inv.quantityAllocated,
      available: inv.quantityAvailable,
      status: inv.status,
    })),
    recentActivity: recentTransactions.map(t => ({
      type: t.transactionType,
      sku: t.product.sku,
      quantity: t.quantity,
      user: t.user?.fullName,
      timestamp: t.createdAt,
    })),
    needsReplenishment: location.minQuantity
      ? location.inventory.reduce((sum, inv) => sum + inv.quantityOnHand, 0) < location.minQuantity
      : false,
  };
}
