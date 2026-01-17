/**
 * Realistic WMS Data Generator
 *
 * Generates synthetic warehouse data that mimics real-world patterns
 * based on common DC operations. Includes intentional discrepancies
 * and issues (like FWRD fragmentation) to demonstrate FlowLogic's detection.
 *
 * Usage: node server/prisma/generate-realistic-data.js [--large]
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../generated/prisma/client.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  small: {
    skuCount: 500,
    locationCount: 200,
    transactionDays: 30,
    transactionsPerDay: 150,
    cycleCountsPerWeek: 50,
  },
  large: {
    skuCount: 5000,
    locationCount: 2000,
    transactionDays: 90,
    transactionsPerDay: 500,
    cycleCountsPerWeek: 200,
  }
};

// Realistic product categories and naming
const CATEGORIES = {
  ELECTRONICS: {
    prefix: 'ELEC',
    items: ['TV', 'LAPTOP', 'PHONE', 'TABLET', 'MONITOR', 'SPEAKER', 'HEADPHONE', 'CAMERA', 'ROUTER', 'PRINTER'],
    brands: ['SAM', 'LG', 'SONY', 'APPLE', 'HP', 'DELL', 'ASUS', 'ACER'],
    costRange: [50, 2000],
  },
  FURNITURE: {
    prefix: 'FURN',
    items: ['SOFA', 'CHAIR', 'TABLE', 'DESK', 'BED', 'DRESSER', 'SHELF', 'CABINET'],
    brands: ['MODERN', 'CLASSIC', 'URBAN', 'RUSTIC'],
    costRange: [100, 1500],
  },
  APPLIANCE: {
    prefix: 'APPL',
    items: ['FRIDGE', 'WASHER', 'DRYER', 'DISHWASH', 'MICROWAVE', 'OVEN', 'VACUUM', 'AC'],
    brands: ['WHIRL', 'GE', 'LG', 'SAM', 'BOSCH'],
    costRange: [200, 2500],
  },
  TOOLS: {
    prefix: 'TOOL',
    items: ['DRILL', 'SAW', 'HAMMER', 'WRENCH', 'SANDER', 'GRINDER', 'PLIER', 'LEVEL'],
    brands: ['DEWALT', 'MAKITA', 'MILWKE', 'BOSCH', 'RYOBI'],
    costRange: [25, 500],
  },
  GARDEN: {
    prefix: 'GRDN',
    items: ['MOWER', 'TRIMMER', 'BLOWER', 'HOSE', 'SPRINKLER', 'SHOVEL', 'RAKE', 'PLANTER'],
    brands: ['TORO', 'HONDA', 'STIHL', 'HUSQ'],
    costRange: [20, 800],
  },
  SPORTING: {
    prefix: 'SPRT',
    items: ['BIKE', 'TREADMILL', 'WEIGHT', 'YOGA', 'TENT', 'KAYAK', 'GOLF', 'BASKET'],
    brands: ['NIKE', 'ADIDAS', 'SCHWINN', 'BOWFLEX'],
    costRange: [30, 2000],
  },
  OFFICE: {
    prefix: 'OFFC',
    items: ['CHAIR', 'DESK', 'FILE', 'SHRED', 'LAMP', 'BOARD', 'PAPER', 'TONER'],
    brands: ['HERMAN', 'STEELC', 'IKEA', 'STAPLES'],
    costRange: [15, 1200],
  },
  HOME: {
    prefix: 'HOME',
    items: ['MATTRESS', 'PILLOW', 'SHEET', 'TOWEL', 'CURTAIN', 'RUG', 'MIRROR', 'CLOCK'],
    brands: ['SEALY', 'SERTA', 'TEMPUR', 'CASPER'],
    costRange: [20, 3000],
  },
};

// Location structure mimicking real DC layout
const ZONE_CONFIG = {
  RECEIVING: { prefix: 'RCV', aisles: 2, bays: 10, levels: 1 },
  PICK_MOD: { prefix: 'A', aisles: 10, bays: 20, levels: 4 },
  RESERVE: { prefix: 'R', aisles: 20, bays: 30, levels: 5 },
  FWRD: { prefix: 'FWRD', aisles: 1, bays: 20, levels: 1 },
  BULK: { prefix: 'BULK', aisles: 5, bays: 10, levels: 1 },
  MPP: { prefix: 'MPP', aisles: 2, bays: 15, levels: 3 },
  STAGING: { prefix: 'STG', aisles: 2, bays: 20, levels: 1 },
  SHIPPING: { prefix: 'SHIP', aisles: 2, bays: 15, levels: 1 },
};

// Helper functions
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(daysBack, daysForward = 0) {
  const date = new Date();
  const offset = randomBetween(-daysBack, daysForward);
  date.setDate(date.getDate() + offset);
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

function generateSKU(category, item, brand, variant) {
  return `${category.prefix}-${item}-${brand}-${variant}`;
}

function generateLocation(zone, aisle, bay, level) {
  const a = String(aisle).padStart(2, '0');
  const b = String(bay).padStart(2, '0');
  const l = String.fromCharCode(64 + level); // A, B, C, D, E
  return `${zone}-${a}-${b}-${l}`;
}

// Generate realistic SKU catalog
function generateSKUs(count) {
  const skus = [];
  const usedSkus = new Set();
  const categories = Object.entries(CATEGORIES);

  while (skus.length < count) {
    const [catName, cat] = randomChoice(categories);
    const item = randomChoice(cat.items);
    const brand = randomChoice(cat.brands);
    const variant = randomBetween(100, 999);

    const sku = generateSKU(cat, item, brand, variant);

    // Skip if already generated (ensure uniqueness)
    if (usedSkus.has(sku)) continue;
    usedSkus.add(sku);

    const cost = randomBetween(cat.costRange[0], cat.costRange[1]);

    // Velocity classification (ABC)
    const velocity = Math.random();
    let velocityClass;
    if (velocity < 0.2) velocityClass = 'A'; // Top 20% - high movers
    else if (velocity < 0.5) velocityClass = 'B'; // Next 30%
    else velocityClass = 'C'; // Bottom 50%

    skus.push({
      sku,
      description: `${brand} ${item} ${variant}`,
      category: catName,
      brand,
      uom: 'EA',
      unitCost: cost,
      velocityClass,
      minQty: velocityClass === 'A' ? 20 : velocityClass === 'B' ? 10 : 5,
      maxQty: velocityClass === 'A' ? 200 : velocityClass === 'B' ? 100 : 50,
    });
  }

  return skus;
}

// Generate location master
function generateLocations() {
  const locations = [];

  for (const [zoneType, config] of Object.entries(ZONE_CONFIG)) {
    for (let a = 1; a <= config.aisles; a++) {
      for (let b = 1; b <= config.bays; b++) {
        for (let l = 1; l <= config.levels; l++) {
          locations.push({
            code: generateLocation(config.prefix, a, b, l),
            zone: config.prefix,
            zoneType,
            aisle: a,
            bay: b,
            level: l,
            capacity: zoneType === 'BULK' ? 100 : zoneType === 'RESERVE' ? 50 : 20,
          });
        }
      }
    }
  }

  return locations;
}

// Generate item parameters with intentional mismatches
// This creates the systematic overage scenario: Target Order Min not divisible by Shelf Pack
function generateItemParameters(skus) {
  const itemParams = [];

  // Common shelf pack configurations
  const shelfPackConfigs = [
    { shelfPack: 1, casePack: 12 },
    { shelfPack: 3, casePack: 24 },   // Will create issues with targetOrderMin of 8
    { shelfPack: 4, casePack: 24 },
    { shelfPack: 6, casePack: 24 },
    { shelfPack: 6, casePack: 48 },
    { shelfPack: 8, casePack: 32 },
    { shelfPack: 12, casePack: 48 },
  ];

  // Intentional mismatch configurations (Target Order Min NOT divisible by Shelf Pack)
  const mismatchConfigs = [
    { shelfPack: 3, targetOrderMin: 8, casePack: 24 },   // 8 ÷ 3 = 2.67 → 3 packs = 9 (1 overage)
    { shelfPack: 3, targetOrderMin: 5, casePack: 24 },   // 5 ÷ 3 = 1.67 → 2 packs = 6 (1 overage)
    { shelfPack: 3, targetOrderMin: 10, casePack: 24 },  // 10 ÷ 3 = 3.33 → 4 packs = 12 (2 overage)
    { shelfPack: 4, targetOrderMin: 10, casePack: 24 },  // 10 ÷ 4 = 2.5 → 3 packs = 12 (2 overage)
    { shelfPack: 4, targetOrderMin: 7, casePack: 24 },   // 7 ÷ 4 = 1.75 → 2 packs = 8 (1 overage)
    { shelfPack: 5, targetOrderMin: 8, casePack: 25 },   // 8 ÷ 5 = 1.6 → 2 packs = 10 (2 overage)
    { shelfPack: 6, targetOrderMin: 8, casePack: 24 },   // 8 ÷ 6 = 1.33 → 2 packs = 12 (4 overage)
    { shelfPack: 6, targetOrderMin: 10, casePack: 24 },  // 10 ÷ 6 = 1.67 → 2 packs = 12 (2 overage)
    { shelfPack: 7, targetOrderMin: 10, casePack: 28 },  // 10 ÷ 7 = 1.43 → 2 packs = 14 (4 overage)
    { shelfPack: 8, targetOrderMin: 15, casePack: 32 },  // 15 ÷ 8 = 1.875 → 2 packs = 16 (1 overage)
  ];

  // Add the specific example from the report: CE MAX RED RELIEF SIZE .5Z
  itemParams.push({
    sku: '451915',
    description: 'CE MAX RED RELIEF SIZE .5Z',
    category: 'HEALTH',
    shelfPack: 3,
    casePack: 24,
    targetOrderMin: 8,  // 8 ÷ 3 = 2.67 → problem!
    maxStoreOrder: 144,
    unitCost: 25.00,
    demandData: {
      avgDailyDemand: 159.9,
      medianDailyDemand: 162.0,
      avgOrderQuantity: 6.5,
      medianOrderQuantity: 6.0,
      mostCommonOrder: 3,
      avgReplenishmentsPerMonth: 12,
      primaryLocationQty: 1326,
      daysOfSupply: 8.3,
    },
  });

  for (const sku of skus) {
    // Skip if this is the specific example SKU we already added
    if (sku.sku === '451915') continue;

    // Randomly assign configuration
    // 15% chance of intentional mismatch to create test data
    const hasMismatch = Math.random() < 0.15;

    let config;
    if (hasMismatch) {
      config = randomChoice(mismatchConfigs);
    } else {
      config = randomChoice(shelfPackConfigs);
      // For aligned configs, set targetOrderMin to a multiple of shelfPack
      config = {
        ...config,
        targetOrderMin: config.shelfPack * randomBetween(1, 4),
      };
    }

    // Generate realistic demand data
    const avgDailyDemand = randomBetween(10, 300);
    const avgReplenishmentsPerMonth = Math.ceil(avgDailyDemand / (config.targetOrderMin || 10));

    itemParams.push({
      sku: sku.sku,
      description: sku.description,
      category: sku.category,
      shelfPack: config.shelfPack,
      casePack: config.casePack,
      targetOrderMin: config.targetOrderMin,
      maxStoreOrder: config.casePack * randomBetween(4, 8),
      unitCost: sku.unitCost,
      demandData: {
        avgDailyDemand,
        avgReplenishmentsPerMonth,
        velocityClass: sku.velocityClass,
      },
    });
  }

  return itemParams;
}

// Generate inventory with intentional issues
function generateInventory(skus, locations, ingestionId) {
  const inventory = [];
  const pickLocations = locations.filter(l => l.zoneType === 'PICK_MOD');
  const reserveLocations = locations.filter(l => l.zoneType === 'RESERVE');
  const fwrdLocations = locations.filter(l => l.zoneType === 'FWRD');
  const bulkLocations = locations.filter(l => l.zoneType === 'BULK');
  const mppLocations = locations.filter(l => l.zoneType === 'MPP');

  for (const sku of skus) {
    // Pick location (primary)
    if (Math.random() < 0.9) { // 90% of SKUs have pick location
      const loc = randomChoice(pickLocations);
      const qty = randomBetween(sku.minQty, sku.maxQty);
      const allocated = randomBetween(0, Math.floor(qty * 0.3));
      inventory.push({
        ingestionId,
        sku: sku.sku,
        locationCode: loc.code,
        locationType: 'PICK',
        licensePlate: generateLicensePlate(),
        quantityOnHand: qty,
        quantityAllocated: allocated,
        quantityAvailable: qty - allocated,
        lotNumber: `LOT${randomBetween(10000, 99999)}`,
        snapshotDate: new Date(),
      });
    }

    // Reserve locations (1-3 per SKU based on velocity)
    const reserveCount = sku.velocityClass === 'A' ? randomBetween(2, 3) :
                         sku.velocityClass === 'B' ? randomBetween(1, 2) :
                         Math.random() < 0.5 ? 1 : 0;

    for (let i = 0; i < reserveCount; i++) {
      const loc = randomChoice(reserveLocations);
      const qty = randomBetween(20, 100);
      inventory.push({
        ingestionId,
        sku: sku.sku,
        locationCode: loc.code,
        locationType: 'RESERVE',
        licensePlate: generateLicensePlate(),
        quantityOnHand: qty,
        quantityAllocated: 0,
        quantityAvailable: qty,
        lotNumber: `LOT${randomBetween(10000, 99999)}`,
        snapshotDate: new Date(),
      });
    }
  }

  // === INTENTIONAL ISSUES FOR AI TO DETECT ===

  // Issue 1: FWRD License Plate Fragmentation (the real DC issue)
  // Select 10% of high-velocity SKUs for fragmentation
  const fragmentSkus = skus.filter(s => s.velocityClass === 'A').slice(0, Math.ceil(skus.length * 0.05));

  for (const sku of fragmentSkus) {
    const loc = randomChoice(fwrdLocations);
    const plateCount = randomBetween(2, 5); // Multiple plates for same SKU

    for (let i = 0; i < plateCount; i++) {
      const qty = randomBetween(5, 20);
      inventory.push({
        ingestionId,
        sku: sku.sku,
        locationCode: loc.code,
        locationType: 'FWRD',
        licensePlate: generateLicensePlate(),
        quantityOnHand: qty,
        quantityAllocated: 0,
        quantityAvailable: qty,
        lotNumber: `LOT${randomBetween(10000, 99999)}`,
        snapshotDate: new Date(),
      });
    }
  }

  // Issue 2: MPP locations (different SKUs allowed - NOT fragmentation)
  // These should NOT trigger fragmentation alerts
  for (let i = 0; i < 20; i++) {
    const loc = randomChoice(mppLocations);
    const startIdx = randomBetween(0, Math.max(0, skus.length - 5));
    const mppSkus = skus.slice(startIdx, startIdx + randomBetween(2, 4));

    for (const sku of mppSkus) {
      const qty = randomBetween(10, 30);
      inventory.push({
        ingestionId,
        sku: sku.sku,
        locationCode: loc.code,
        locationType: 'MPP',
        licensePlate: generateLicensePlate(),
        quantityOnHand: qty,
        quantityAllocated: 0,
        quantityAvailable: qty,
        lotNumber: `LOT${randomBetween(10000, 99999)}`,
        snapshotDate: new Date(),
      });
    }
  }

  // Issue 3: Negative inventory (system error)
  for (let i = 0; i < 5; i++) {
    const sku = randomChoice(skus);
    const loc = randomChoice(pickLocations);
    const negQty = -randomBetween(1, 10);
    inventory.push({
      ingestionId,
      sku: sku.sku,
      locationCode: loc.code,
      locationType: 'PICK',
      licensePlate: generateLicensePlate(),
      quantityOnHand: negQty,
      quantityAllocated: 0,
      quantityAvailable: negQty,
      lotNumber: `LOT${randomBetween(10000, 99999)}`,
      snapshotDate: new Date(),
    });
  }

  // Issue 4: Zero quantity records (should be cleaned up)
  for (let i = 0; i < 10; i++) {
    const sku = randomChoice(skus);
    const loc = randomChoice(reserveLocations);
    inventory.push({
      ingestionId,
      sku: sku.sku,
      locationCode: loc.code,
      locationType: 'RESERVE',
      licensePlate: generateLicensePlate(),
      quantityOnHand: 0,
      quantityAllocated: 0,
      quantityAvailable: 0,
      lotNumber: `LOT${randomBetween(10000, 99999)}`,
      snapshotDate: new Date(),
    });
  }

  return inventory;
}

// Generate transaction history
function generateTransactions(skus, locations, config, ingestionId) {
  const transactions = [];
  const txTypes = [
    { type: 'RECEIPT', weight: 15, direction: 'IN' },
    { type: 'PICK', weight: 40, direction: 'OUT' },
    { type: 'PUTAWAY', weight: 15, direction: 'IN' },
    { type: 'REPLEN', weight: 15, direction: 'IN' },
    { type: 'ADJUSTMENT', weight: 10, direction: 'BOTH' },
    { type: 'TRANSFER', weight: 5, direction: 'BOTH' },
  ];

  const totalWeight = txTypes.reduce((sum, t) => sum + t.weight, 0);
  const pickLocations = locations.filter(l => l.zoneType === 'PICK_MOD');
  const reserveLocations = locations.filter(l => l.zoneType === 'RESERVE');
  const receivingLocations = locations.filter(l => l.zoneType === 'RECEIVING');

  for (let day = 0; day < config.transactionDays; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);

    // More transactions on weekdays
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dailyTxCount = isWeekend ?
      Math.floor(config.transactionsPerDay * 0.3) :
      config.transactionsPerDay;

    for (let i = 0; i < dailyTxCount; i++) {
      // Weighted random type selection
      let rand = Math.random() * totalWeight;
      let selectedType;
      for (const t of txTypes) {
        rand -= t.weight;
        if (rand <= 0) {
          selectedType = t;
          break;
        }
      }

      const sku = randomChoice(skus);
      const txDate = new Date(date);
      txDate.setHours(randomBetween(6, 22), randomBetween(0, 59), randomBetween(0, 59));

      let fromLoc = null;
      let toLoc = null;
      let qty = randomBetween(1, 20);

      switch (selectedType.type) {
        case 'RECEIPT':
          fromLoc = 'DOCK-01';
          toLoc = randomChoice(receivingLocations).code;
          qty = randomBetween(10, 100);
          break;
        case 'PICK':
          fromLoc = randomChoice(pickLocations).code;
          toLoc = 'STAGING-01';
          qty = randomBetween(1, 10);
          break;
        case 'PUTAWAY':
          fromLoc = randomChoice(receivingLocations).code;
          toLoc = randomChoice(reserveLocations).code;
          qty = randomBetween(10, 50);
          break;
        case 'REPLEN':
          fromLoc = randomChoice(reserveLocations).code;
          toLoc = randomChoice(pickLocations).code;
          qty = randomBetween(10, 30);
          break;
        case 'ADJUSTMENT':
          fromLoc = randomChoice(pickLocations).code;
          toLoc = fromLoc;
          qty = randomBetween(-5, 5);
          break;
        case 'TRANSFER':
          fromLoc = randomChoice(reserveLocations).code;
          toLoc = randomChoice(reserveLocations).code;
          qty = randomBetween(5, 20);
          break;
      }

      transactions.push({
        ingestionId,
        externalTransactionId: `${selectedType.type.substring(0, 3)}${randomBetween(100000, 999999)}`,
        type: selectedType.type,
        sku: sku.sku,
        fromLocation: fromLoc,
        toLocation: toLoc,
        quantity: Math.abs(qty),
        userId: `USR${randomBetween(100, 150)}`,
        transactionDate: txDate,
      });
    }
  }

  return transactions;
}

// Generate cycle counts with realistic variance patterns
function generateCycleCounts(skus, locations, config, ingestionId) {
  const cycleCounts = [];
  const pickLocations = locations.filter(l => l.zoneType === 'PICK_MOD');

  for (let week = 0; week < Math.ceil(config.transactionDays / 7); week++) {
    for (let i = 0; i < config.cycleCountsPerWeek; i++) {
      const sku = randomChoice(skus);
      const loc = randomChoice(pickLocations);
      const systemQty = randomBetween(5, 50);

      // Variance probability based on velocity (high movers have more variance)
      const varianceChance = sku.velocityClass === 'A' ? 0.25 :
                             sku.velocityClass === 'B' ? 0.15 : 0.08;

      let variance = 0;
      if (Math.random() < varianceChance) {
        // Variance tends to be negative (shrinkage more common)
        variance = Math.random() < 0.7 ?
          -randomBetween(1, Math.min(5, systemQty)) :
          randomBetween(1, 3);
      }

      const countedQty = Math.max(0, systemQty + variance);
      const countDate = new Date();
      countDate.setDate(countDate.getDate() - (week * 7) - randomBetween(0, 6));

      cycleCounts.push({
        ingestionId,
        sku: sku.sku,
        locationCode: loc.code,
        systemQty,
        countedQty,
        variance,
        variancePercent: systemQty > 0 ? (variance / systemQty) * 100 : 0,
        counterId: `USR${randomBetween(100, 120)}`,
        countDate,
      });
    }
  }

  return cycleCounts;
}

// Generate adjustments
function generateAdjustments(skus, locations, config, ingestionId) {
  const adjustments = [];
  const pickLocations = locations.filter(l => l.zoneType === 'PICK_MOD');

  const reasonCodes = [
    { code: 'CC', reason: 'Cycle Count Adjustment', weight: 40 },
    { code: 'DMG', reason: 'Damaged', weight: 20 },
    { code: 'RECV', reason: 'Receiving Error Correction', weight: 15 },
    { code: 'PICK', reason: 'Picking Error Correction', weight: 15 },
    { code: 'LOST', reason: 'Lost/Not Found', weight: 8 },
    { code: 'FOUND', reason: 'Found', weight: 2 },
  ];

  const totalWeight = reasonCodes.reduce((sum, r) => sum + r.weight, 0);
  const adjustmentCount = Math.floor(config.transactionDays * 3); // ~3 adjustments per day

  for (let i = 0; i < adjustmentCount; i++) {
    let rand = Math.random() * totalWeight;
    let selectedReason;
    for (const r of reasonCodes) {
      rand -= r.weight;
      if (rand <= 0) {
        selectedReason = r;
        break;
      }
    }

    const sku = randomChoice(skus);
    const loc = randomChoice(pickLocations);

    // Most adjustments are negative (shrinkage)
    const isPositive = selectedReason.code === 'FOUND' ||
                       (selectedReason.code === 'RECV' && Math.random() < 0.3);
    const qty = isPositive ? randomBetween(1, 10) : -randomBetween(1, 10);

    adjustments.push({
      ingestionId,
      sku: sku.sku,
      locationCode: loc.code,
      adjustmentQty: qty,
      reason: selectedReason.reason,
      reasonCode: selectedReason.code,
      userId: `USR${randomBetween(100, 110)}`,
      adjustmentDate: randomDate(config.transactionDays),
    });
  }

  return adjustments;
}

// Main generation function
async function generateRealisticData(size = 'small') {
  const config = CONFIG[size];
  console.log(`\nGenerating ${size} realistic WMS dataset...`);
  console.log(`Config: ${JSON.stringify(config, null, 2)}\n`);

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.actionRecommendation.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.discrepancy.deleteMany();
  await prisma.cycleCountSnapshot.deleteMany();
  await prisma.adjustmentSnapshot.deleteMany();
  await prisma.transactionSnapshot.deleteMany();
  await prisma.inventorySnapshot.deleteMany();
  await prisma.scheduledIngestion.deleteMany();
  await prisma.dataIngestion.deleteMany();
  await prisma.scheduledReport.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.userWarehouse.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dock.deleteMany();
  await prisma.location.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.company.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.itemParameter.deleteMany();
  console.log('Data cleared.\n');

  // Create company
  const company = await prisma.company.create({
    data: {
      code: 'FLOWDEMO',
      name: 'FlowLogic Demo Distribution',
      address: '1000 Logistics Parkway',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30328',
      country: 'USA',
      phone: '(404) 555-0100',
      email: 'demo@flowlogic.ai',
    },
  });
  console.log(`Created company: ${company.name}`);

  // Create warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      code: 'ATL-DC1',
      name: 'Atlanta Distribution Center',
      address: '1000 Logistics Parkway',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30328',
      timezone: 'America/New_York',
      squareFootage: 500000,
      maxCapacity: 100000,
      isDefault: true,
      operatingHours: { start: '06:00', end: '22:00', shifts: 2 },
    },
  });
  console.log(`Created warehouse: ${warehouse.name}`);

  // Create zones
  const zones = [];
  for (const [zoneType, config] of Object.entries(ZONE_CONFIG)) {
    const zone = await prisma.zone.create({
      data: {
        warehouseId: warehouse.id,
        code: config.prefix,
        name: zoneType.replace('_', ' '),
        type: zoneType === 'PICK_MOD' ? 'PICKING' :
              zoneType === 'RECEIVING' ? 'RECEIVING' :
              zoneType === 'SHIPPING' || zoneType === 'STAGING' ? 'STAGING' : 'STORAGE',
        pickSequence: zones.length,
      },
    });
    zones.push(zone);
  }
  console.log(`Created ${zones.length} zones`);

  // Create admin user
  const passwordHash = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.create({
    data: {
      username: 'demo',
      email: 'demo@flowlogic.ai',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      fullName: 'Demo User',
      role: 'ADMIN',
      companyId: company.id,
      defaultWarehouseId: warehouse.id,
    },
  });

  await prisma.userWarehouse.create({
    data: {
      userId: user.id,
      warehouseId: warehouse.id,
      isDefault: true,
    },
  });
  console.log(`Created user: ${user.email} (password: demo123)`);

  // Create data ingestion record
  const ingestion = await prisma.dataIngestion.create({
    data: {
      filename: 'synthetic-data-generator.json',
      filePath: '/generated/synthetic',
      dataType: 'inventory',
      source: 'REALISTIC_GENERATOR',
      mappingType: 'generic',
      recordCount: 0,
      errorCount: 0,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  // Generate data
  console.log('\nGenerating SKUs...');
  const skus = generateSKUs(config.skuCount);
  console.log(`Generated ${skus.length} SKUs`);

  console.log('Generating item parameters (with intentional mismatches)...');
  const itemParams = generateItemParameters(skus);
  const mismatchCount = itemParams.filter(p => {
    if (!p.targetOrderMin || !p.shelfPack) return false;
    return !Number.isInteger(p.targetOrderMin / p.shelfPack);
  }).length;
  console.log(`Generated ${itemParams.length} item parameters (${mismatchCount} with parameter mismatch issues)`);

  console.log('Generating locations...');
  const locations = generateLocations();
  console.log(`Generated ${locations.length} locations`);

  console.log('Generating inventory...');
  const inventory = generateInventory(skus, locations, ingestion.id);
  console.log(`Generated ${inventory.length} inventory records`);

  console.log('Generating transactions...');
  const transactions = generateTransactions(skus, locations, config, ingestion.id);
  console.log(`Generated ${transactions.length} transactions`);

  console.log('Generating cycle counts...');
  const cycleCounts = generateCycleCounts(skus, locations, config, ingestion.id);
  console.log(`Generated ${cycleCounts.length} cycle counts`);

  console.log('Generating adjustments...');
  const adjustments = generateAdjustments(skus, locations, config, ingestion.id);
  console.log(`Generated ${adjustments.length} adjustments`);

  // Bulk insert
  console.log('\nInserting data into database...');

  await prisma.inventorySnapshot.createMany({ data: inventory });
  console.log(`Inserted ${inventory.length} inventory records`);

  await prisma.transactionSnapshot.createMany({ data: transactions });
  console.log(`Inserted ${transactions.length} transactions`);

  await prisma.cycleCountSnapshot.createMany({ data: cycleCounts });
  console.log(`Inserted ${cycleCounts.length} cycle counts`);

  await prisma.adjustmentSnapshot.createMany({ data: adjustments });
  console.log(`Inserted ${adjustments.length} adjustments`);

  await prisma.itemParameter.createMany({ data: itemParams });
  console.log(`Inserted ${itemParams.length} item parameters`);

  // Update ingestion record
  await prisma.dataIngestion.update({
    where: { id: ingestion.id },
    data: {
      recordCount: inventory.length + transactions.length + cycleCounts.length + adjustments.length,
    },
  });

  // Create sample alerts
  await prisma.alert.createMany({
    data: [
      {
        warehouseId: warehouse.id,
        title: 'FWRD License Plate Fragmentation Detected',
        message: `${Math.ceil(skus.length * 0.05)} SKUs have fragmented license plates in FWRD locations`,
        type: 'INVENTORY_DISCREPANCY',
        severity: 'CRITICAL',
      },
      {
        warehouseId: warehouse.id,
        title: 'Negative Inventory Detected',
        message: '5 locations have negative on-hand quantities',
        type: 'INVENTORY_DISCREPANCY',
        severity: 'CRITICAL',
      },
      {
        warehouseId: warehouse.id,
        title: 'High Cycle Count Variance',
        message: 'Pick zone A showing 18% variance rate this week',
        type: 'INVENTORY_DISCREPANCY',
        severity: 'WARNING',
      },
      {
        warehouseId: warehouse.id,
        title: 'Zero Quantity Records',
        message: '10 locations have zero quantity - consider cleanup',
        type: 'INVENTORY_DISCREPANCY',
        severity: 'INFO',
      },
      {
        warehouseId: warehouse.id,
        title: 'Parameter Mismatch Detected',
        message: `${mismatchCount} items have Target Order Min not divisible by Shelf Pack - causing systematic overages`,
        type: 'INVENTORY_DISCREPANCY',
        severity: 'WARNING',
      },
    ],
  });

  console.log('\n========================================');
  console.log('Data generation complete!');
  console.log('========================================');
  console.log(`\nLogin credentials:`);
  console.log(`  Email: demo@flowlogic.ai`);
  console.log(`  Password: demo123`);
  console.log(`\nIntentional issues seeded for AI detection:`);
  console.log(`  - FWRD License Plate Fragmentation: ~${Math.ceil(skus.length * 0.05)} SKUs`);
  console.log(`  - Parameter Mismatch (Target Order Min ÷ Shelf Pack): ${mismatchCount} items`);
  console.log(`  - Example: Item 451915 (CE MAX RED RELIEF SIZE .5Z) - 8 ÷ 3 = 2.67`);
  console.log(`  - Negative Inventory: 5 records`);
  console.log(`  - Zero Quantity Records: 10 records`);
  console.log(`  - MPP Multi-SKU (NOT fragmentation): 20 locations`);
  console.log(`\nRun the intelligence engine to detect these issues!`);
}

// Run
const size = process.argv.includes('--large') ? 'large' : 'small';
generateRealisticData(size)
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
