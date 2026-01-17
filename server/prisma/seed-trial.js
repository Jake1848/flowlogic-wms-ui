/**
 * Trial Data Seeder
 *
 * Seeds demo data for new trial accounts to demonstrate FlowLogic's capabilities.
 * This script populates:
 * - Sample inventory snapshots with discrepancies
 * - FWRD license plate fragmentation examples
 * - Transaction history
 * - AI-detected discrepancies with recommendations
 * - Sample alerts
 *
 * Usage: node server/prisma/seed-trial.js <companyId>
 */

import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

// Sample SKUs with realistic data
const SAMPLE_SKUS = [
  { sku: 'ELEC-TV-55-SAM', description: 'Samsung 55" 4K Smart TV', uom: 'EA', unitCost: 449.99 },
  { sku: 'ELEC-TV-65-LG', description: 'LG 65" OLED TV', uom: 'EA', unitCost: 1299.99 },
  { sku: 'FURN-SOFA-3SEAT', description: '3-Seat Leather Sofa', uom: 'EA', unitCost: 899.00 },
  { sku: 'FURN-TABLE-DIN-6', description: '6-Person Dining Table', uom: 'EA', unitCost: 549.00 },
  { sku: 'APPL-FRIDGE-SS', description: 'Stainless Steel Refrigerator', uom: 'EA', unitCost: 1199.00 },
  { sku: 'APPL-WASHER-FL', description: 'Front-Load Washing Machine', uom: 'EA', unitCost: 699.00 },
  { sku: 'TOOL-DRILL-CORD', description: 'Cordless Power Drill Set', uom: 'EA', unitCost: 129.99 },
  { sku: 'TOOL-SAW-CIRC', description: 'Circular Saw 7.25"', uom: 'EA', unitCost: 89.99 },
  { sku: 'GRDN-MOWER-GAS', description: 'Gas-Powered Lawn Mower', uom: 'EA', unitCost: 399.00 },
  { sku: 'GRDN-TRIM-ELEC', description: 'Electric String Trimmer', uom: 'EA', unitCost: 79.99 },
  { sku: 'SPRT-BIKE-MTN', description: 'Mountain Bike 26"', uom: 'EA', unitCost: 349.00 },
  { sku: 'SPRT-TREAD-PRO', description: 'Professional Treadmill', uom: 'EA', unitCost: 1499.00 },
  { sku: 'ELEC-LAPTOP-HP', description: 'HP ProBook 15" Laptop', uom: 'EA', unitCost: 799.00 },
  { sku: 'ELEC-PHONE-SAM', description: 'Samsung Galaxy S24', uom: 'EA', unitCost: 899.00 },
  { sku: 'HOME-VACUUM-DYS', description: 'Dyson V15 Vacuum', uom: 'EA', unitCost: 699.00 },
];

// Sample locations
const LOCATION_TYPES = {
  PICK: ['A01-01-A', 'A01-02-A', 'A02-01-A', 'A02-02-A', 'B01-01-A', 'B01-02-A'],
  RESERVE: ['R01-01-01', 'R01-01-02', 'R01-02-01', 'R02-01-01', 'R02-01-02', 'R02-02-01'],
  FWRD: ['FWRD-01', 'FWRD-02', 'FWRD-03', 'FWRD-04', 'FWRD-05'],
  BULK: ['BULK-A1', 'BULK-A2', 'BULK-B1', 'BULK-B2'],
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - randomBetween(0, daysBack));
  date.setHours(randomBetween(6, 22), randomBetween(0, 59), randomBetween(0, 59));
  return date;
}

function generateLicensePlate() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let lp = 'LP';
  for (let i = 0; i < 8; i++) {
    lp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return lp;
}

async function seedTrialData(companyId) {
  console.log(`\nSeeding trial demo data for company: ${companyId}`);

  // Find the company's warehouse
  const warehouse = await prisma.warehouse.findFirst({
    where: { companyId },
    include: { zones: true },
  });

  if (!warehouse) {
    throw new Error('No warehouse found for company. Please run initial setup first.');
  }

  // Get or create the main zone
  let mainZone = warehouse.zones[0];
  if (!mainZone) {
    mainZone = await prisma.zone.create({
      data: {
        warehouseId: warehouse.id,
        code: 'MAIN',
        name: 'Main Zone',
        type: 'STORAGE',
      },
    });
  }

  console.log(`Using warehouse: ${warehouse.name}`);
  console.log(`Using zone: ${mainZone.name}`);

  // Create a data ingestion record
  const ingestion = await prisma.dataIngestion.create({
    data: {
      source: 'DEMO_SEEDER',
      type: 'inventory',
      status: 'COMPLETED',
      recordsTotal: 100,
      recordsProcessed: 100,
      recordsSuccess: 100,
      recordsFailed: 0,
      completedAt: new Date(),
    },
  });

  console.log('\nCreating inventory snapshots...');

  // Create inventory snapshots - normal inventory
  const inventorySnapshots = [];
  for (const item of SAMPLE_SKUS) {
    // Pick location
    const pickLoc = LOCATION_TYPES.PICK[randomBetween(0, LOCATION_TYPES.PICK.length - 1)];
    inventorySnapshots.push({
      ingestionId: ingestion.id,
      sku: item.sku,
      description: item.description,
      locationCode: pickLoc,
      locationType: 'PICK',
      licensePlate: generateLicensePlate(),
      quantity: randomBetween(5, 50),
      uom: item.uom,
      unitCost: item.unitCost,
      lotNumber: `LOT${randomBetween(1000, 9999)}`,
      snapshotDate: new Date(),
    });

    // Reserve location
    const reserveLoc = LOCATION_TYPES.RESERVE[randomBetween(0, LOCATION_TYPES.RESERVE.length - 1)];
    inventorySnapshots.push({
      ingestionId: ingestion.id,
      sku: item.sku,
      description: item.description,
      locationCode: reserveLoc,
      locationType: 'RESERVE',
      licensePlate: generateLicensePlate(),
      quantity: randomBetween(20, 200),
      uom: item.uom,
      unitCost: item.unitCost,
      lotNumber: `LOT${randomBetween(1000, 9999)}`,
      snapshotDate: new Date(),
    });
  }

  // Create FWRD fragmentation examples (the issue from your DC)
  console.log('Creating FWRD license plate fragmentation examples...');
  const fragSkus = SAMPLE_SKUS.slice(0, 5); // First 5 SKUs will have fragmentation
  for (const item of fragSkus) {
    const fwrdLoc = LOCATION_TYPES.FWRD[randomBetween(0, LOCATION_TYPES.FWRD.length - 1)];
    // Create 2-4 license plates for same SKU in same FWRD location
    const numPlates = randomBetween(2, 4);
    for (let i = 0; i < numPlates; i++) {
      inventorySnapshots.push({
        ingestionId: ingestion.id,
        sku: item.sku,
        description: item.description,
        locationCode: fwrdLoc,
        locationType: 'FWRD',
        licensePlate: generateLicensePlate(),
        quantity: randomBetween(5, 25),
        uom: item.uom,
        unitCost: item.unitCost,
        lotNumber: `LOT${randomBetween(1000, 9999)}`,
        snapshotDate: new Date(),
      });
    }
  }

  // Bulk insert inventory
  await prisma.inventorySnapshot.createMany({ data: inventorySnapshots });
  console.log(`Created ${inventorySnapshots.length} inventory snapshots`);

  // Create transaction history
  console.log('\nCreating transaction history...');
  const transactions = [];
  const txTypes = ['RECEIPT', 'PICK', 'PUTAWAY', 'ADJUSTMENT', 'TRANSFER'];
  for (let i = 0; i < 200; i++) {
    const item = SAMPLE_SKUS[randomBetween(0, SAMPLE_SKUS.length - 1)];
    const txType = txTypes[randomBetween(0, txTypes.length - 1)];
    const qty = txType === 'PICK' ? -randomBetween(1, 10) : randomBetween(1, 50);

    transactions.push({
      ingestionId: ingestion.id,
      sku: item.sku,
      type: txType,
      quantity: Math.abs(qty),
      direction: qty > 0 ? 'IN' : 'OUT',
      fromLocation: txType === 'PICK' ? LOCATION_TYPES.PICK[0] : null,
      toLocation: txType === 'PUTAWAY' ? LOCATION_TYPES.RESERVE[0] : null,
      reference: `TXN${randomBetween(100000, 999999)}`,
      transactionDate: randomDate(30),
    });
  }
  await prisma.transactionSnapshot.createMany({ data: transactions });
  console.log(`Created ${transactions.length} transactions`);

  // Create cycle count history with variances
  console.log('\nCreating cycle count history...');
  const cycleCounts = [];
  for (let i = 0; i < 50; i++) {
    const item = SAMPLE_SKUS[randomBetween(0, SAMPLE_SKUS.length - 1)];
    const location = LOCATION_TYPES.PICK[randomBetween(0, LOCATION_TYPES.PICK.length - 1)];
    const systemQty = randomBetween(10, 100);
    // 30% chance of variance
    const hasVariance = Math.random() < 0.3;
    const variance = hasVariance ? randomBetween(-10, 10) : 0;
    const countedQty = systemQty + variance;

    cycleCounts.push({
      ingestionId: ingestion.id,
      sku: item.sku,
      locationCode: location,
      systemQty,
      countedQty,
      variance,
      variancePercent: systemQty > 0 ? (variance / systemQty) * 100 : 0,
      counterId: `USR${randomBetween(100, 999)}`,
      countDate: randomDate(14),
    });
  }
  await prisma.cycleCountSnapshot.createMany({ data: cycleCounts });
  console.log(`Created ${cycleCounts.length} cycle counts`);

  // Create AI-detected discrepancies
  console.log('\nCreating AI-detected discrepancies...');
  const discrepancies = [];

  // FWRD Fragmentation Discrepancies
  for (const item of fragSkus) {
    discrepancies.push({
      type: 'FWRD_FRAGMENTATION',
      severity: 'high',
      status: 'OPEN',
      sku: item.sku,
      locationCode: LOCATION_TYPES.FWRD[0],
      variance: 0,
      description: `Multiple license plates detected for ${item.sku} in FWRD location. This prevents BOH reduction from running correctly.`,
      evidence: JSON.stringify({
        licensePlates: [generateLicensePlate(), generateLicensePlate(), generateLicensePlate()],
        totalQuantity: randomBetween(30, 80),
        plateCount: 3,
      }),
      rootCauseCategory: 'PROCESS',
      detectedAt: randomDate(7),
    });
  }

  // Inventory Variances
  for (let i = 0; i < 8; i++) {
    const item = SAMPLE_SKUS[randomBetween(0, SAMPLE_SKUS.length - 1)];
    const variance = randomBetween(-15, -5);
    discrepancies.push({
      type: 'INVENTORY_VARIANCE',
      severity: Math.abs(variance) > 10 ? 'critical' : 'medium',
      status: i < 3 ? 'RESOLVED' : 'OPEN',
      sku: item.sku,
      locationCode: LOCATION_TYPES.PICK[randomBetween(0, LOCATION_TYPES.PICK.length - 1)],
      expectedQty: randomBetween(20, 50),
      actualQty: randomBetween(5, 18),
      variance,
      variancePercent: variance / 30 * 100,
      varianceValue: Math.abs(variance) * item.unitCost,
      description: `System quantity does not match physical count for ${item.sku}`,
      rootCauseCategory: i % 2 === 0 ? 'PICKING_ERROR' : 'RECEIVING_ERROR',
      detectedAt: randomDate(14),
      resolvedAt: i < 3 ? randomDate(7) : null,
    });
  }

  // Location Mismatches
  for (let i = 0; i < 3; i++) {
    const item = SAMPLE_SKUS[randomBetween(0, SAMPLE_SKUS.length - 1)];
    discrepancies.push({
      type: 'LOCATION_MISMATCH',
      severity: 'medium',
      status: 'OPEN',
      sku: item.sku,
      locationCode: LOCATION_TYPES.RESERVE[randomBetween(0, LOCATION_TYPES.RESERVE.length - 1)],
      variance: randomBetween(10, 30),
      description: `${item.sku} found in unexpected location`,
      rootCauseCategory: 'PUTAWAY_ERROR',
      detectedAt: randomDate(10),
    });
  }

  await prisma.discrepancy.createMany({ data: discrepancies });
  console.log(`Created ${discrepancies.length} discrepancies`);

  // Create action recommendations
  console.log('\nCreating action recommendations...');
  const actions = [];

  // For FWRD fragmentation
  for (const item of fragSkus.slice(0, 3)) {
    actions.push({
      type: 'LP_MERGE',
      priority: 1,
      status: 'PENDING',
      sku: item.sku,
      locationCode: LOCATION_TYPES.FWRD[0],
      description: `Merge fragmented license plates for ${item.sku} in FWRD location`,
      instructions: `1. Physically consolidate all LPs for ${item.sku}\n2. System merge in WMS\n3. Verify BOH reduction eligibility`,
      estimatedImpact: item.unitCost * randomBetween(20, 50),
    });
  }

  // General recommendations
  actions.push({
    type: 'CYCLE_COUNT',
    priority: 2,
    status: 'PENDING',
    description: 'Schedule cycle count for high-variance pick locations',
    instructions: 'Count locations A01-01-A through A02-02-A',
    estimatedImpact: 5000,
  });

  actions.push({
    type: 'PROCESS_REVIEW',
    priority: 3,
    status: 'PENDING',
    description: 'Review putaway process - multiple location mismatches detected',
    instructions: 'Audit last 50 putaway transactions for process compliance',
    estimatedImpact: 2500,
  });

  await prisma.actionRecommendation.createMany({ data: actions });
  console.log(`Created ${actions.length} action recommendations`);

  // Create sample alerts
  console.log('\nCreating alerts...');
  const alerts = await prisma.alert.createMany({
    data: [
      {
        warehouseId: warehouse.id,
        title: 'FWRD License Plate Fragmentation Detected',
        message: `5 FWRD locations have multiple license plates for the same SKU, preventing BOH reduction`,
        type: 'INVENTORY',
        priority: 'CRITICAL',
        category: 'system',
        isResolved: false,
      },
      {
        warehouseId: warehouse.id,
        title: 'High Variance in Cycle Counts',
        message: 'Pick zone A has 15% variance rate in last 7 days',
        type: 'INVENTORY',
        priority: 'HIGH',
        category: 'system',
        isResolved: false,
      },
      {
        warehouseId: warehouse.id,
        title: 'Receiving Discrepancy Pattern',
        message: 'ASN quantities consistently differ from received quantities for vendor ACME Corp',
        type: 'RECEIVING',
        priority: 'MEDIUM',
        category: 'system',
        isResolved: false,
      },
      {
        warehouseId: warehouse.id,
        title: 'System Integration Healthy',
        message: 'All WMS connectors operating normally',
        type: 'SYSTEM',
        priority: 'LOW',
        category: 'system',
        isResolved: true,
        resolvedAt: new Date(),
      },
    ],
  });
  console.log(`Created ${alerts.count} alerts`);

  console.log('\n✅ Trial demo data seeded successfully!');
  console.log('\nSummary:');
  console.log(`- ${inventorySnapshots.length} inventory records`);
  console.log(`- ${transactions.length} transaction records`);
  console.log(`- ${cycleCounts.length} cycle count records`);
  console.log(`- ${discrepancies.length} AI-detected discrepancies`);
  console.log(`- ${actions.length} action recommendations`);
  console.log(`- ${alerts.count} alerts`);
  console.log(`\nFWRD Fragmentation demo: 5 SKUs with fragmented license plates`);
}

// Run if called directly (not when imported)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const companyId = process.argv[2];
  if (!companyId) {
    console.log('Usage: node server/prisma/seed-trial.js <companyId>');
    console.log('\nTo seed all trial accounts, run without arguments:');
    console.log('  node server/prisma/seed-trial.js --all');
    process.exit(1);
  }

  if (companyId === '--all') {
    // Seed all companies with trial plan
    (async () => {
      const trialSettings = await prisma.systemSetting.findMany({
        where: {
          key: { contains: '.plan' },
          value: 'trial',
        },
      });

      for (const setting of trialSettings) {
        const compId = setting.key.split('.')[1];
        try {
          await seedTrialData(compId);
        } catch (err) {
          console.error(`Failed to seed company ${compId}:`, err.message);
        }
      }
      await prisma.$disconnect();
    })();
  } else {
    seedTrialData(companyId)
      .then(() => prisma.$disconnect())
      .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
      });
  }
}

export { seedTrialData };
