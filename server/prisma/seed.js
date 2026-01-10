// Seed Script - FlowLogic AI Intelligence Platform
// Populates the database with demo data
// Uses sequential operations for compatibility with prisma dev (connection_limit=1)
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

function padNumber(num, size) {
  return num.toString().padStart(size, '0');
}

async function main() {
  console.log('Seeding FlowLogic AI Intelligence Platform database...');

  // Clean existing data first (in reverse dependency order)
  console.log('Cleaning existing data...');

  // Intelligence Platform tables
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

  // Core tables
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
  console.log('Existing data cleared.');

  // Create Company
  const company = await prisma.company.create({
    data: {
      code: 'DEMO',
      name: 'FlowLogic Demo Company',
      address: '123 Warehouse Way',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30301',
      country: 'USA',
      phone: '(404) 555-0100',
      email: 'info@flowlogic-demo.com',
    },
  });
  console.log('Created company:', company.name);

  // Create Warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      code: 'ATL01',
      name: 'Atlanta Distribution Center',
      address: '456 Logistics Blvd',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30302',
      timezone: 'America/New_York',
      squareFootage: 250000,
      maxCapacity: 50000,
      isDefault: true,
      operatingHours: { start: '06:00', end: '22:00' },
    },
  });
  console.log('Created warehouse:', warehouse.name);

  // Create Zones sequentially
  const rcvZone = await prisma.zone.create({
    data: {
      warehouseId: warehouse.id,
      code: 'RCV',
      name: 'Receiving',
      type: 'RECEIVING',
      pickSequence: 0,
    },
  });

  const bulkZone = await prisma.zone.create({
    data: {
      warehouseId: warehouse.id,
      code: 'BULK',
      name: 'Bulk Storage',
      type: 'STORAGE',
      pickSequence: 1,
    },
  });

  const pickZone = await prisma.zone.create({
    data: {
      warehouseId: warehouse.id,
      code: 'PICK',
      name: 'Pick Zone',
      type: 'PICKING',
      pickSequence: 2,
    },
  });

  const packZone = await prisma.zone.create({
    data: {
      warehouseId: warehouse.id,
      code: 'PACK',
      name: 'Packing',
      type: 'PACKING',
      pickSequence: 3,
    },
  });

  const shipZone = await prisma.zone.create({
    data: {
      warehouseId: warehouse.id,
      code: 'SHIP',
      name: 'Shipping',
      type: 'SHIPPING',
      pickSequence: 4,
    },
  });

  console.log('Created 5 zones');

  // Create Locations sequentially (for reference data)
  // Bulk storage locations (A01-A05)
  for (const aisle of ['A', 'B']) {
    for (let bay = 1; bay <= 5; bay++) {
      for (let level = 1; level <= 2; level++) {
        await prisma.location.create({
          data: {
            zoneId: bulkZone.id,
            code: aisle + padNumber(bay, 2) + '-' + level,
            type: 'RACK',
            aisle: aisle,
            bay: padNumber(bay, 2),
            level: level.toString(),
            maxPallets: 2,
            pickSequence: (aisle.charCodeAt(0) - 65) * 100 + bay * 10 + level,
          },
        });
      }
    }
  }

  // Pick face locations (P01-P20)
  for (let i = 1; i <= 20; i++) {
    await prisma.location.create({
      data: {
        zoneId: pickZone.id,
        code: 'P' + padNumber(i, 3),
        type: 'PICK_FACE',
        aisle: 'P',
        bay: padNumber(i, 3),
        pickSequence: i,
        minQuantity: 10,
        maxQuantity: 100,
        reorderPoint: 25,
      },
    });
  }
  console.log('Created 40 locations');

  // Create Users sequentially
  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      username: 'admin',
      email: 'admin@flowlogic.com',
      passwordHash: '$2b$10$v.RItiDm9XXds0c5phbam.3IzzWHYHKdgvfP2YukGX85z/NntcfWC', // admin123
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      role: 'ADMIN',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      username: 'msmith',
      email: 'msmith@flowlogic.com',
      passwordHash: '$2b$10$v.RItiDm9XXds0c5phbam.3IzzWHYHKdgvfP2YukGX85z/NntcfWC', // admin123
      firstName: 'Mike',
      lastName: 'Smith',
      fullName: 'Mike Smith',
      role: 'MANAGER',
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      companyId: company.id,
      username: 'jdoe',
      email: 'jdoe@flowlogic.com',
      passwordHash: '$2b$10$v.RItiDm9XXds0c5phbam.3IzzWHYHKdgvfP2YukGX85z/NntcfWC',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: 'SUPERVISOR',
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      username: 'viewer',
      email: 'viewer@flowlogic.com',
      passwordHash: '$2b$10$v.RItiDm9XXds0c5phbam.3IzzWHYHKdgvfP2YukGX85z/NntcfWC',
      firstName: 'View',
      lastName: 'Only',
      fullName: 'View Only',
      role: 'VIEWER',
    },
  });
  const users = [adminUser, managerUser, analystUser, viewerUser];
  console.log('Created 4 users');

  // Assign users to warehouse sequentially
  for (const user of users) {
    await prisma.userWarehouse.create({
      data: {
        userId: user.id,
        warehouseId: warehouse.id,
        isDefault: true,
      },
    });
  }
  console.log('Assigned users to warehouse');

  // Create Docks sequentially
  await prisma.dock.create({
    data: {
      warehouseId: warehouse.id,
      code: 'DOCK-01',
      name: 'Dock 1 (Receiving)',
      type: 'RECEIVING',
      currentStatus: 'AVAILABLE',
    },
  });
  await prisma.dock.create({
    data: {
      warehouseId: warehouse.id,
      code: 'DOCK-02',
      name: 'Dock 2 (Receiving)',
      type: 'RECEIVING',
      currentStatus: 'AVAILABLE',
    },
  });
  await prisma.dock.create({
    data: {
      warehouseId: warehouse.id,
      code: 'DOCK-03',
      name: 'Dock 3 (Shipping)',
      type: 'SHIPPING',
      currentStatus: 'AVAILABLE',
    },
  });
  await prisma.dock.create({
    data: {
      warehouseId: warehouse.id,
      code: 'DOCK-04',
      name: 'Dock 4 (Shipping)',
      type: 'SHIPPING',
      currentStatus: 'AVAILABLE',
    },
  });
  console.log('Created 4 docks');

  // Create Sample Alerts sequentially
  await prisma.alert.create({
    data: {
      warehouseId: warehouse.id,
      type: 'INVENTORY_DISCREPANCY',
      severity: 'CRITICAL',
      title: 'Negative Inventory Detected',
      message: 'SKU-001 at location PICK-A-01-01 shows -5 units. System integrity issue requires immediate attention.',
      entityType: 'Location',
      entityId: 'PICK-A-01-01',
      suggestedAction: 'Investigate the shortage and verify with physical count.',
      aiConfidence: 0.95,
    },
  });
  await prisma.alert.create({
    data: {
      warehouseId: warehouse.id,
      type: 'LOW_STOCK',
      severity: 'WARNING',
      title: 'Low Stock Warning - High Velocity SKU',
      message: 'SKU-005 is approaching reorder point. Current: 85, Reorder Point: 200. 3-day stockout risk.',
      entityType: 'SKU',
      entityId: 'SKU-005',
      suggestedAction: 'Create purchase order for 500 units from the primary vendor.',
      aiConfidence: 0.88,
    },
  });
  await prisma.alert.create({
    data: {
      warehouseId: warehouse.id,
      type: 'ORDER_LATE',
      severity: 'WARNING',
      title: 'Cycle Count Variance Trend',
      message: 'Zone PICK has shown 15% average variance over the past 7 days. Pattern suggests systematic issue.',
      entityType: 'Zone',
      entityId: 'PICK',
      suggestedAction: 'Schedule zone-wide audit and review picking procedures.',
      aiConfidence: 0.82,
    },
  });
  console.log('Created sample alerts');

  // Create WMS Integration examples
  await prisma.integration.create({
    data: {
      companyId: company.id,
      name: 'Manhattan WMS',
      type: 'MANHATTAN',
      status: 'ACTIVE',
      endpoint: 'https://wms.manhattan.com/api/v2',
      settings: {
        syncInterval: 300,
        dataTypes: ['inventory', 'transactions', 'adjustments'],
        fieldMappings: {
          sku: 'item_number',
          location: 'loc_code',
          quantity: 'qty_on_hand'
        }
      },
      lastSyncAt: new Date(Date.now() - 5 * 60 * 1000) // 5 min ago
    },
  });
  await prisma.integration.create({
    data: {
      companyId: company.id,
      name: 'SAP EWM',
      type: 'SAP',
      status: 'INACTIVE',
      endpoint: 'https://sap-ewm.company.com/sap/bc/rest',
      settings: {
        protocol: 'ODATA',
        authType: 'OAuth2'
      }
    },
  });
  console.log('Created 2 integrations');

  // ============================================
  // INTELLIGENCE PLATFORM DEMO DATA
  // ============================================
  console.log('\nSeeding Intelligence Platform demo data...');

  // Create a sample data ingestion
  const ingestion = await prisma.dataIngestion.create({
    data: {
      filename: 'inventory_snapshot_demo.csv',
      filePath: './uploads/demo/inventory_snapshot_demo.csv',
      dataType: 'inventory_snapshot',
      source: 'manual',
      mappingType: 'generic',
      recordCount: 150,
      errorCount: 0,
      status: 'COMPLETED',
      completedAt: new Date(),
      metadata: { importedBy: 'system', notes: 'Demo data import' }
    }
  });
  console.log('Created demo data ingestion');

  // Create inventory snapshots from WMS
  const skus = ['SKU-001', 'SKU-002', 'SKU-003', 'SKU-004', 'SKU-005', 'SKU-006', 'SKU-007', 'SKU-008'];
  const locations = ['PICK-A-01-01', 'PICK-A-02-01', 'PICK-B-01-01', 'BULK-A-01', 'BULK-A-02', 'BULK-B-01'];

  for (const sku of skus) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const qty = Math.floor(Math.random() * 100) + 20;
    await prisma.inventorySnapshot.create({
      data: {
        ingestionId: ingestion.id,
        sku,
        locationCode: loc,
        quantityOnHand: qty,
        quantityAllocated: Math.floor(qty * 0.2),
        quantityAvailable: Math.floor(qty * 0.8),
        snapshotDate: new Date()
      }
    });
  }
  console.log('Created inventory snapshots');

  // Create sample discrepancies for demo
  const discrepancy1 = await prisma.discrepancy.create({
    data: {
      type: 'negative_on_hand',
      severity: 'critical',
      status: 'OPEN',
      sku: 'SKU-001',
      locationCode: 'PICK-A-01-01',
      expectedQty: 0,
      actualQty: -5,
      variance: -5,
      variancePercent: -100,
      varianceValue: 125.00,
      description: 'Negative on-hand quantity detected. System shows -5 units which is physically impossible.',
      evidence: { lastTransaction: 'PICK-2024-0042', detectedDuring: 'automated_scan' },
      detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  });

  const discrepancy2 = await prisma.discrepancy.create({
    data: {
      type: 'cycle_count_variance',
      severity: 'high',
      status: 'OPEN',
      sku: 'SKU-005',
      locationCode: 'BULK-B-02-03',
      expectedQty: 100,
      actualQty: 73,
      variance: -27,
      variancePercent: -27,
      varianceValue: 675.00,
      description: 'Cycle count revealed 27% shortage. System showed 100 units, physical count found 73.',
      evidence: { countedBy: 'user_warehouse1', countDate: new Date().toISOString() },
      detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  });

  const discrepancy3 = await prisma.discrepancy.create({
    data: {
      type: 'unexplained_overage',
      severity: 'medium',
      status: 'OPEN',
      sku: 'SKU-012',
      locationCode: 'PICK-C-01-02',
      expectedQty: 50,
      actualQty: 62,
      variance: 12,
      variancePercent: 24,
      varianceValue: 180.00,
      description: 'Unexplained overage of 12 units. No receiving transactions found to explain increase.',
      evidence: { possibleCause: 'unrecorded_return', nearbyLocations: ['PICK-C-01-01', 'PICK-C-01-03'] },
      detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }
  });

  const discrepancy4 = await prisma.discrepancy.create({
    data: {
      type: 'adjustment_spike',
      severity: 'medium',
      status: 'INVESTIGATING',
      sku: 'SKU-008',
      locationCode: 'PICK-A-03-01',
      variance: 45,
      varianceValue: 900.00,
      description: 'Unusual adjustment activity detected. 8 adjustments totaling 45 units in past 7 days.',
      evidence: { adjustmentCount: 8, averageAdjustment: 3, zScore: 2.8 },
      detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    }
  });

  const discrepancy5 = await prisma.discrepancy.create({
    data: {
      type: 'drift_detected',
      severity: 'low',
      status: 'OPEN',
      sku: 'SKU-020',
      locationCode: 'BULK-A-01-01',
      expectedQty: 500,
      actualQty: 467,
      variance: -33,
      variancePercent: -6.6,
      varianceValue: 330.00,
      description: 'Gradual inventory drift detected over 30 days. No single event explains 33-unit decline.',
      evidence: { startQty: 500, endQty: 467, daysObserved: 30, trendSlope: -1.1 },
      detectedAt: new Date()
    }
  });
  console.log('Created sample discrepancies');

  // Create investigation for one discrepancy
  await prisma.investigation.create({
    data: {
      discrepancyId: discrepancy4.id,
      rootCause: 'Training gap - new operator unfamiliar with adjustment procedures',
      category: 'human',
      notes: 'Operator started 2 weeks ago. Multiple small adjustments suggest counting errors during picking.',
      status: 'IN_PROGRESS',
      assignedTo: 'Warehouse Supervisor'
    }
  });
  console.log('Created sample investigation');

  // Create action recommendations
  await prisma.actionRecommendation.create({
    data: {
      type: 'cycle_count',
      priority: 1,
      status: 'PENDING',
      discrepancyId: discrepancy1.id,
      sku: 'SKU-001',
      locationCode: 'PICK-A-01-01',
      description: 'URGENT: Verify SKU-001 at PICK-A-01-01',
      instructions: 'Count all inventory at location. System shows negative balance. Report actual quantity found.',
      estimatedImpact: 125.00
    }
  });

  await prisma.actionRecommendation.create({
    data: {
      type: 'cycle_count',
      priority: 2,
      status: 'PENDING',
      discrepancyId: discrepancy2.id,
      sku: 'SKU-005',
      locationCode: 'BULK-B-02-03',
      description: 'Verify SKU-005 at BULK-B-02-03',
      instructions: 'Recount inventory. Previous count showed 27% variance. Check adjacent locations for mis-slots.',
      estimatedImpact: 675.00
    }
  });

  await prisma.actionRecommendation.create({
    data: {
      type: 'supervisor_alert',
      priority: 1,
      status: 'PENDING',
      discrepancyId: discrepancy1.id,
      sku: 'SKU-001',
      locationCode: 'PICK-A-01-01',
      description: 'CRITICAL: Negative inventory requires immediate attention',
      instructions: 'Investigate how system reached negative balance. Check recent picks, adjustments, and receiving.',
      estimatedImpact: 125.00
    }
  });

  await prisma.actionRecommendation.create({
    data: {
      type: 'location_audit',
      priority: 2,
      status: 'PENDING',
      discrepancyId: discrepancy3.id,
      locationCode: 'PICK-C-01-02',
      description: 'Audit location PICK-C-01-02 and adjacent slots',
      instructions: 'Check for: mis-slots from nearby locations, unrecorded returns, label accuracy.',
      estimatedImpact: 180.00
    }
  });

  await prisma.actionRecommendation.create({
    data: {
      type: 'training',
      priority: 3,
      status: 'PENDING',
      discrepancyId: discrepancy4.id,
      description: 'Schedule refresher training on adjustment procedures',
      instructions: 'New operator showing high adjustment frequency. Review proper procedures for handling discrepancies.',
      estimatedImpact: 900.00
    }
  });
  console.log('Created action recommendations');

  // Create sample adjustment snapshots for analytics
  const reasons = ['Damaged', 'Cycle Count', 'Receiving Error', 'Pick Short', 'Customer Return'];
  for (let i = 0; i < 30; i++) {
    await prisma.adjustmentSnapshot.create({
      data: {
        ingestionId: ingestion.id,
        sku: `SKU-${padNumber(Math.floor(Math.random() * 20) + 1, 3)}`,
        locationCode: `PICK-${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}-0${Math.floor(Math.random() * 3) + 1}-0${Math.floor(Math.random() * 3) + 1}`,
        adjustmentQty: Math.floor(Math.random() * 20) - 10,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        adjustmentDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      }
    });
  }
  console.log('Created adjustment history for analytics');

  // Create transaction snapshots
  const txnTypes = ['PICK', 'RECEIVE', 'TRANSFER', 'ADJUST', 'CYCLE_COUNT'];
  for (let i = 0; i < 50; i++) {
    await prisma.transactionSnapshot.create({
      data: {
        ingestionId: ingestion.id,
        externalTransactionId: `TXN-${Date.now()}-${i}`,
        type: txnTypes[Math.floor(Math.random() * txnTypes.length)],
        sku: `SKU-${padNumber(Math.floor(Math.random() * 20) + 1, 3)}`,
        fromLocation: `PICK-${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}-0${Math.floor(Math.random() * 3) + 1}-0${Math.floor(Math.random() * 3) + 1}`,
        toLocation: Math.random() > 0.5 ? `BULK-${['A', 'B'][Math.floor(Math.random() * 2)]}-0${Math.floor(Math.random() * 5) + 1}` : null,
        quantity: Math.floor(Math.random() * 50) + 1,
        transactionDate: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000)
      }
    });
  }
  console.log('Created transaction history for analytics');

  // Create cycle count snapshots
  for (let i = 0; i < 20; i++) {
    const systemQty = Math.floor(Math.random() * 100) + 20;
    const variance = Math.floor(Math.random() * 20) - 10;
    const countedQty = systemQty + variance;
    await prisma.cycleCountSnapshot.create({
      data: {
        ingestionId: ingestion.id,
        sku: `SKU-${padNumber(Math.floor(Math.random() * 20) + 1, 3)}`,
        locationCode: `PICK-${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}-0${Math.floor(Math.random() * 3) + 1}-0${Math.floor(Math.random() * 3) + 1}`,
        systemQty,
        countedQty,
        variance,
        variancePercent: (variance / systemQty) * 100,
        countDate: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000)
      }
    });
  }
  console.log('Created cycle count history for analytics');

  // Create scheduled ingestion for WMS sync
  await prisma.scheduledIngestion.create({
    data: {
      name: 'Manhattan Daily Inventory Sync',
      source: 'manhattan_wms',
      connectionConfig: JSON.stringify({
        endpoint: 'https://wms.manhattan.com/api/v2/inventory',
        authType: 'bearer'
      }),
      schedule: '0 6 * * *', // 6 AM daily
      dataType: 'inventory_snapshot',
      mappingType: 'manhattan',
      isActive: true,
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
  console.log('Created scheduled ingestion');

  console.log('Intelligence Platform demo data created');

  console.log('\n========================================');
  console.log('Database seeding completed successfully!');
  console.log('========================================');
  console.log('\nDemo Credentials:');
  console.log('  Username: admin');
  console.log('  Password: admin123 (change in production)');
  console.log('\nIntelligence Platform:');
  console.log('  5 sample discrepancies (1 critical, 1 high, 2 medium, 1 low)');
  console.log('  5 action recommendations');
  console.log('  30 adjustment snapshots for analytics');
  console.log('  50 transaction snapshots');
  console.log('  20 cycle count snapshots');
  console.log('  2 WMS integrations');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
