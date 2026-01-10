/**
 * Inventory-related tool executors
 * Updated for AI Intelligence Platform - uses snapshot tables from WMS data
 */

export async function investigateInventory(prisma, params) {
  // Get inventory snapshots for this SKU
  const snapshots = await prisma.inventorySnapshot.findMany({
    where: { sku: params.sku },
    orderBy: { snapshotDate: 'desc' },
    take: 10,
  });

  if (snapshots.length === 0) {
    return { success: false, message: `No inventory data found for SKU ${params.sku}` };
  }

  // Get transaction history
  let transactions = [];
  if (params.include_transactions !== false) {
    transactions = await prisma.transactionSnapshot.findMany({
      where: { sku: params.sku },
      orderBy: { transactionDate: 'desc' },
      take: 20,
    });
  }

  // Get related discrepancies
  const discrepancies = await prisma.discrepancy.findMany({
    where: {
      sku: params.sku,
      status: 'OPEN',
    },
  });

  // Get alerts
  const alerts = await prisma.alert.findMany({
    where: {
      entityType: 'SKU',
      entityId: params.sku,
      isResolved: false,
    },
  });

  // Calculate totals from most recent snapshot per location
  const latestByLocation = {};
  for (const snap of snapshots) {
    if (!latestByLocation[snap.locationCode]) {
      latestByLocation[snap.locationCode] = snap;
    }
  }

  const locations = Object.values(latestByLocation);
  const totalOnHand = locations.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
  const totalAllocated = locations.reduce((sum, inv) => sum + inv.quantityAllocated, 0);
  const totalAvailable = locations.reduce((sum, inv) => sum + inv.quantityAvailable, 0);

  return {
    success: true,
    sku: params.sku,
    inventory: {
      totalOnHand,
      totalAllocated,
      totalAvailable,
      locations: locations.map(inv => ({
        location: inv.locationCode,
        onHand: inv.quantityOnHand,
        allocated: inv.quantityAllocated,
        available: inv.quantityAvailable,
        snapshotDate: inv.snapshotDate,
      })),
    },
    recentTransactions: transactions.map(t => ({
      type: t.type,
      quantity: t.quantity,
      fromLocation: t.fromLocation,
      toLocation: t.toLocation,
      timestamp: t.transactionDate,
    })),
    discrepancies: discrepancies.map(d => ({
      type: d.type,
      severity: d.severity,
      variance: d.variance,
      description: d.description,
    })),
    alerts: alerts.map(a => ({
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
    })),
  };
}

export async function getInventorySummary(prisma, params) {
  // Get latest snapshots
  const snapshots = await prisma.inventorySnapshot.findMany({
    orderBy: { snapshotDate: 'desc' },
    take: 1000,
  });

  // Dedupe by SKU+location, keep most recent
  const latestByKey = {};
  for (const snap of snapshots) {
    const key = `${snap.sku}:${snap.locationCode}`;
    if (!latestByKey[key]) {
      latestByKey[key] = snap;
    }
  }

  const uniqueSnapshots = Object.values(latestByKey);

  const totalOnHand = uniqueSnapshots.reduce((sum, s) => sum + s.quantityOnHand, 0);
  const totalAllocated = uniqueSnapshots.reduce((sum, s) => sum + s.quantityAllocated, 0);
  const totalAvailable = uniqueSnapshots.reduce((sum, s) => sum + s.quantityAvailable, 0);

  // Get low stock items
  const lowStock = uniqueSnapshots
    .filter(s => s.quantityOnHand < 10)
    .slice(0, 10);

  // Get discrepancy counts
  const discrepancyStats = await prisma.discrepancy.groupBy({
    by: ['severity'],
    where: { status: 'OPEN' },
    _count: true,
  });

  return {
    success: true,
    summary: {
      totalRecords: uniqueSnapshots.length,
      totalOnHand,
      totalAllocated,
      totalAvailable,
      uniqueSKUs: new Set(uniqueSnapshots.map(s => s.sku)).size,
      uniqueLocations: new Set(uniqueSnapshots.map(s => s.locationCode)).size,
    },
    discrepancies: discrepancyStats.reduce((acc, s) => {
      acc[s.severity] = s._count;
      return acc;
    }, {}),
    lowStockItems: lowStock.map(inv => ({
      sku: inv.sku,
      location: inv.locationCode,
      onHand: inv.quantityOnHand,
    })),
  };
}

export async function createInventoryAdjustment(prisma, params) {
  // In AI Intelligence Platform mode, we don't directly adjust inventory
  // Instead, we create an action recommendation for the host WMS
  const action = await prisma.actionRecommendation.create({
    data: {
      type: 'inventory_adjustment',
      priority: params.priority || 2,
      sku: params.sku,
      locationCode: params.location_code,
      description: `Adjust inventory: ${params.adjustment_quantity > 0 ? '+' : ''}${params.adjustment_quantity} units`,
      instructions: params.reason || 'AI-recommended adjustment based on analysis',
      estimatedImpact: Math.abs(params.adjustment_quantity) * 10, // Estimated value
      status: 'PENDING',
    },
  });

  return {
    success: true,
    message: `Created adjustment recommendation for ${params.sku} at ${params.location_code}`,
    actionId: action.id,
    note: 'This is an AI Intelligence Platform. Adjustment will be exported to your WMS for execution.',
  };
}
