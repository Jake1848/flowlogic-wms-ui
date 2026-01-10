/**
 * Location-related tool executors
 * Updated for AI Intelligence Platform - uses snapshot tables
 */

export async function investigateLocation(prisma, params) {
  // First check if location exists in our reference data
  const location = await prisma.location.findFirst({
    where: { code: params.location_code },
    include: {
      zone: {
        include: { warehouse: { select: { code: true, name: true } } },
      },
    },
  });

  // Get inventory snapshots for this location
  const snapshots = await prisma.inventorySnapshot.findMany({
    where: { locationCode: params.location_code },
    orderBy: { snapshotDate: 'desc' },
  });

  // Dedupe by SKU, keep most recent
  const latestBySku = {};
  for (const snap of snapshots) {
    if (!latestBySku[snap.sku]) {
      latestBySku[snap.sku] = snap;
    }
  }
  const contents = Object.values(latestBySku);

  // Get recent transactions for this location
  const recentTransactions = await prisma.transactionSnapshot.findMany({
    where: {
      OR: [
        { fromLocation: params.location_code },
        { toLocation: params.location_code },
      ],
    },
    orderBy: { transactionDate: 'desc' },
    take: 10,
  });

  // Get discrepancies for this location
  const discrepancies = await prisma.discrepancy.findMany({
    where: {
      locationCode: params.location_code,
      status: 'OPEN',
    },
  });

  // Get adjustments for this location
  const adjustments = await prisma.adjustmentSnapshot.findMany({
    where: { locationCode: params.location_code },
    orderBy: { adjustmentDate: 'desc' },
    take: 10,
  });

  return {
    success: true,
    location: location ? {
      code: location.code,
      type: location.type,
      zone: location.zone?.name || 'Unknown',
      warehouse: location.zone?.warehouse?.name || 'Unknown',
      minQuantity: location.minQuantity,
      maxQuantity: location.maxQuantity,
      reorderPoint: location.reorderPoint,
      isPickable: location.isPickable,
      isReplenishable: location.isReplenishable,
    } : {
      code: params.location_code,
      note: 'Location not in reference data - data from WMS snapshots only',
    },
    contents: contents.map(inv => ({
      sku: inv.sku,
      onHand: inv.quantityOnHand,
      allocated: inv.quantityAllocated,
      available: inv.quantityAvailable,
      snapshotDate: inv.snapshotDate,
    })),
    recentActivity: recentTransactions.map(t => ({
      type: t.type,
      sku: t.sku,
      quantity: t.quantity,
      direction: t.toLocation === params.location_code ? 'IN' : 'OUT',
      timestamp: t.transactionDate,
    })),
    recentAdjustments: adjustments.map(a => ({
      sku: a.sku,
      quantity: a.adjustmentQty,
      reason: a.reason,
      date: a.adjustmentDate,
    })),
    discrepancies: discrepancies.map(d => ({
      type: d.type,
      severity: d.severity,
      variance: d.variance,
      description: d.description,
    })),
    totalOnHand: contents.reduce((sum, inv) => sum + inv.quantityOnHand, 0),
  };
}
