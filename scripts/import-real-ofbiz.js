// Import REAL OFBiz data from Derby database export
import { PrismaClient } from '../server/generated/prisma/client.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function importRealOFBizData() {
  console.log('\n========================================');
  console.log('  IMPORTING REAL OFBiz DATA');
  console.log('========================================\n');

  // Load the exported JSON files
  const inventoryData = JSON.parse(readFileSync(join(__dirname, 'ofbiz-inventory.json'), 'utf-8'));
  const productsData = JSON.parse(readFileSync(join(__dirname, 'ofbiz-products.json'), 'utf-8'));

  console.log(`Loaded ${inventoryData.length} inventory items from OFBiz`);
  console.log(`Loaded ${productsData.length} products from OFBiz`);

  // Create product lookup map
  const productMap = {};
  productsData.forEach(p => {
    productMap[p.productId] = p;
  });

  // Get or find the OFBiz integration
  let integration = await prisma.integration.findFirst({
    where: { name: { contains: 'OFBiz' } }
  });

  if (!integration) {
    integration = await prisma.integration.create({
      data: {
        name: 'Apache OFBiz WMS (Direct DB)',
        type: 'CUSTOM_WMS',
        status: 'ACTIVE',
        isActive: true,
        config: {
          source: 'Derby Database Direct Connection',
          dbPath: 'runtime/data/derby/ofbiz'
        }
      }
    });
    console.log('Created OFBiz integration record');
  } else {
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        name: 'Apache OFBiz WMS (Direct DB)',
        status: 'ACTIVE',
        isActive: true,
        lastSyncAt: new Date()
      }
    });
    console.log('Updated existing OFBiz integration');
  }

  // Clear old alerts
  console.log('\nClearing old alerts...');
  await prisma.alert.deleteMany({});

  // Create a DataIngestion record for this import
  let ingestion = await prisma.dataIngestion.findFirst({
    where: { filename: { contains: 'OFBiz-Derby' } }
  });

  if (!ingestion) {
    ingestion = await prisma.dataIngestion.create({
      data: {
        filename: 'OFBiz-Derby-Direct-Export',
        filePath: '/ofbiz/derby/export',
        dataType: 'inventory_snapshot',
        source: 'OFBiz',
        mappingType: 'ofbiz',
        status: 'COMPLETED',
        recordCount: inventoryData.length,
        errorCount: 0,
        completedAt: new Date()
      }
    });
    console.log('Created DataIngestion record');
  }

  // Clear old inventory snapshots for this ingestion
  console.log('Clearing old inventory snapshots...');
  await prisma.inventorySnapshot.deleteMany({
    where: { ingestionId: ingestion.id }
  });

  // Import real inventory data
  console.log('\n--- Importing Real Inventory ---');
  let importedCount = 0;

  for (const item of inventoryData) {
    const product = productMap[item.productId] || {};

    await prisma.inventorySnapshot.create({
      data: {
        ingestionId: ingestion.id,
        snapshotDate: new Date(),
        sku: item.productId,
        locationCode: item.locationSeqId || 'DEFAULT',
        locationType: item.facilityId || 'WAREHOUSE',
        quantityOnHand: item.quantityOnHand || 0,
        quantityAllocated: (item.quantityOnHand || 0) - (item.availableToPromise || 0),
        quantityAvailable: item.availableToPromise || 0,
        rawData: {
          ...item,
          productName: product.name || product.internalName || item.productId,
          unitCost: item.unitCost,
          currency: item.currency
        }
      }
    });
    importedCount++;

    if (importedCount % 10 === 0) {
      process.stdout.write(`  Imported ${importedCount}/${inventoryData.length} items\r`);
    }
  }
  console.log(`\n  Total imported: ${importedCount} inventory snapshots`);

  // Create REAL alerts based on actual inventory conditions
  console.log('\n--- Creating Alerts from Real Data ---');
  let alertCount = 0;

  // Find low stock items (quantity < 10)
  const lowStockItems = inventoryData.filter(i => i.quantityOnHand < 10 && i.quantityOnHand > 0);
  for (const item of lowStockItems.slice(0, 5)) {
    const product = productMap[item.productId] || {};
    await prisma.alert.create({
      data: {
        type: 'LOW_STOCK',
        severity: item.quantityOnHand < 5 ? 'CRITICAL' : 'WARNING',
        title: `Low Stock: ${item.productId}`,
        message: `${product.name || item.productId} at ${item.locationSeqId} has only ${item.quantityOnHand} units. ATP: ${item.availableToPromise}`,
        isResolved: false,
        isRead: false
      }
    });
    alertCount++;
  }

  // Find items with ATP discrepancy (reserved inventory)
  const reservedItems = inventoryData.filter(i =>
    i.quantityOnHand > 0 &&
    i.availableToPromise < i.quantityOnHand
  );
  for (const item of reservedItems.slice(0, 3)) {
    const reserved = item.quantityOnHand - item.availableToPromise;
    const product = productMap[item.productId] || {};
    await prisma.alert.create({
      data: {
        type: 'INVENTORY_DISCREPANCY',
        severity: 'INFO',
        title: `Reserved Inventory: ${item.productId}`,
        message: `${product.name || item.productId} has ${reserved} units reserved. On-hand: ${item.quantityOnHand}, ATP: ${item.availableToPromise}`,
        isResolved: false,
        isRead: false
      }
    });
    alertCount++;
  }

  // Find high-value inventory
  const highValueItems = inventoryData
    .map(i => ({ ...i, totalValue: i.quantityOnHand * i.unitCost }))
    .filter(i => i.totalValue > 100)
    .sort((a, b) => b.totalValue - a.totalValue);

  if (highValueItems.length > 0) {
    const top = highValueItems[0];
    const product = productMap[top.productId] || {};
    await prisma.alert.create({
      data: {
        type: 'CAPACITY_WARNING',
        severity: 'INFO',
        title: `High Value Inventory: ${top.productId}`,
        message: `${product.name || top.productId} has $${top.totalValue.toFixed(2)} worth of inventory (${top.quantityOnHand} units @ $${top.unitCost}/ea)`,
        isResolved: false,
        isRead: false
      }
    });
    alertCount++;
  }

  // Find items with same SKU in multiple locations (potential consolidation)
  const skuLocations = {};
  inventoryData.forEach(i => {
    if (!skuLocations[i.productId]) skuLocations[i.productId] = [];
    skuLocations[i.productId].push(i);
  });

  const multiLocationSKUs = Object.entries(skuLocations).filter(([_, items]) => items.length > 1);
  for (const [sku, items] of multiLocationSKUs.slice(0, 2)) {
    const product = productMap[sku] || {};
    const totalQty = items.reduce((sum, i) => sum + i.quantityOnHand, 0);
    const locations = items.map(i => i.locationSeqId).join(', ');
    await prisma.alert.create({
      data: {
        type: 'INVENTORY_DISCREPANCY',
        severity: 'WARNING',
        title: `Split Inventory: ${sku}`,
        message: `${product.name || sku} is split across ${items.length} locations (${locations}). Total: ${totalQty} units. Consider consolidation.`,
        isResolved: false,
        isRead: false
      }
    });
    alertCount++;
  }

  // System sync notification
  await prisma.alert.create({
    data: {
      type: 'CUSTOM',
      severity: 'INFO',
      title: 'OFBiz Direct Sync Complete',
      message: `Successfully imported ${importedCount} inventory items and ${productsData.length} products from OFBiz Derby database.`,
      isResolved: true,
      isRead: false
    }
  });
  alertCount++;

  console.log(`  Created ${alertCount} alerts from real data analysis`);

  // Summary
  console.log('\n========================================');
  console.log('  IMPORT COMPLETE');
  console.log('========================================');
  console.log(`  Inventory Items: ${importedCount}`);
  console.log(`  Products:        ${productsData.length}`);
  console.log(`  Alerts:          ${alertCount}`);
  console.log('========================================\n');

  // Verify counts
  const invCount = await prisma.inventorySnapshot.count();
  const alertsCount = await prisma.alert.count({ where: { isResolved: false } });
  console.log(`Database verification:`);
  console.log(`  - Inventory snapshots: ${invCount}`);
  console.log(`  - Active alerts: ${alertsCount}`);

  await prisma.$disconnect();
}

importRealOFBizData().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
