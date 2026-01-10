/**
 * Product-related tool executors
 * Updated for AI Intelligence Platform - searches inventory snapshots
 */

export async function searchProducts(prisma, params) {
  // Search through inventory snapshots for SKUs matching the query
  const snapshots = await prisma.inventorySnapshot.findMany({
    where: {
      sku: { contains: params.query, mode: 'insensitive' },
    },
    orderBy: { snapshotDate: 'desc' },
    take: 100,
  });

  // Group by SKU and get unique SKUs with their data
  const skuMap = new Map();
  for (const snap of snapshots) {
    if (!skuMap.has(snap.sku)) {
      skuMap.set(snap.sku, {
        sku: snap.sku,
        locations: [],
        totalOnHand: 0,
        totalAllocated: 0,
        totalAvailable: 0,
      });
    }
    const skuData = skuMap.get(snap.sku);
    skuData.locations.push(snap.locationCode);
    skuData.totalOnHand += snap.quantityOnHand;
    skuData.totalAllocated += snap.quantityAllocated;
    skuData.totalAvailable += snap.quantityAvailable;
  }

  const results = Array.from(skuMap.values()).slice(0, params.limit || 10);

  // Also check for discrepancies related to these SKUs
  const skus = results.map(r => r.sku);
  const discrepancies = await prisma.discrepancy.findMany({
    where: {
      sku: { in: skus },
      status: 'OPEN',
    },
  });

  const discrepancyBySku = {};
  for (const d of discrepancies) {
    if (!discrepancyBySku[d.sku]) discrepancyBySku[d.sku] = [];
    discrepancyBySku[d.sku].push(d);
  }

  return {
    success: true,
    resultsCount: results.length,
    products: results.map(p => ({
      sku: p.sku,
      locationCount: new Set(p.locations).size,
      totalOnHand: p.totalOnHand,
      totalAllocated: p.totalAllocated,
      totalAvailable: p.totalAvailable,
      hasDiscrepancies: !!discrepancyBySku[p.sku],
      discrepancyCount: discrepancyBySku[p.sku]?.length || 0,
    })),
    note: 'Product master data is maintained in your host WMS. This shows inventory snapshot data.',
  };
}
