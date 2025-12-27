// Seed Script - FlowLogic WMS
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
  console.log('Seeding FlowLogic WMS database...');

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

  // Core WMS tables
  await prisma.alert.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.userWarehouse.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.carrierService.deleteMany();
  await prisma.carrier.deleteMany();
  await prisma.dock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
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

  // Create Locations sequentially (fewer locations for faster seeding)
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

  // Create Product Categories sequentially
  const elecCat = await prisma.productCategory.create({
    data: { code: 'ELEC', name: 'Electronics' },
  });
  const applCat = await prisma.productCategory.create({
    data: { code: 'APPL', name: 'Appliances' },
  });
  const furnCat = await prisma.productCategory.create({
    data: { code: 'FURN', name: 'Furniture' },
  });
  const foodCat = await prisma.productCategory.create({
    data: { code: 'FOOD', name: 'Food & Beverage' },
  });
  const clthCat = await prisma.productCategory.create({
    data: { code: 'CLTH', name: 'Clothing' },
  });
  console.log('Created 5 product categories');

  // Create Products sequentially
  const laptop = await prisma.product.create({
    data: {
      sku: 'ELEC-LAPTOP-001',
      upc: '012345678901',
      name: 'Business Laptop 15"',
      categoryId: elecCat.id,
      weight: 5.5,
      length: 15,
      width: 10,
      height: 1.5,
      cost: 650.00,
      price: 899.99,
      caseQty: 1,
      velocityCode: 'A',
      minStock: 20,
      maxStock: 100,
      reorderPoint: 30,
      reorderQty: 50,
    },
  });

  const phone = await prisma.product.create({
    data: {
      sku: 'ELEC-PHONE-001',
      upc: '012345678902',
      name: 'Smartphone Pro Max',
      categoryId: elecCat.id,
      weight: 0.5,
      length: 6,
      width: 3,
      height: 0.5,
      cost: 450.00,
      price: 699.99,
      caseQty: 10,
      velocityCode: 'A',
      serialTracked: true,
      minStock: 50,
      maxStock: 500,
      reorderPoint: 100,
      reorderQty: 200,
    },
  });

  const washer = await prisma.product.create({
    data: {
      sku: 'APPL-WASHER-001',
      upc: '012345678903',
      name: 'Front Load Washer',
      categoryId: applCat.id,
      weight: 180,
      length: 30,
      width: 30,
      height: 40,
      cost: 450.00,
      price: 799.99,
      caseQty: 1,
      velocityCode: 'B',
      minStock: 5,
      maxStock: 30,
      reorderPoint: 10,
      reorderQty: 15,
    },
  });

  const chair = await prisma.product.create({
    data: {
      sku: 'FURN-CHAIR-001',
      upc: '012345678904',
      name: 'Ergonomic Office Chair',
      categoryId: furnCat.id,
      weight: 45,
      length: 24,
      width: 24,
      height: 48,
      cost: 150.00,
      price: 299.99,
      caseQty: 1,
      velocityCode: 'B',
      minStock: 10,
      maxStock: 50,
      reorderPoint: 15,
      reorderQty: 25,
    },
  });

  const snack = await prisma.product.create({
    data: {
      sku: 'FOOD-SNACK-001',
      upc: '012345678905',
      name: 'Organic Granola Bars (24pk)',
      categoryId: foodCat.id,
      weight: 2.5,
      length: 12,
      width: 8,
      height: 6,
      cost: 15.00,
      price: 24.99,
      caseQty: 12,
      velocityCode: 'A',
      lotTracked: true,
      expirationTracked: true,
      shelfLife: 180,
      minStock: 100,
      maxStock: 1000,
      reorderPoint: 200,
      reorderQty: 500,
    },
  });

  const shirt = await prisma.product.create({
    data: {
      sku: 'CLTH-SHIRT-001',
      upc: '012345678906',
      name: 'Cotton T-Shirt (M)',
      categoryId: clthCat.id,
      weight: 0.4,
      length: 12,
      width: 10,
      height: 1,
      cost: 8.00,
      price: 24.99,
      caseQty: 24,
      velocityCode: 'A',
      minStock: 200,
      maxStock: 2000,
      reorderPoint: 500,
      reorderQty: 1000,
    },
  });
  const products = [laptop, phone, washer, chair, snack, shirt];
  console.log('Created 6 products');

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

  const pickerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      username: 'jdoe',
      email: 'jdoe@flowlogic.com',
      passwordHash: '$2b$10$v.RItiDm9XXds0c5phbam.3IzzWHYHKdgvfP2YukGX85z/NntcfWC',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: 'PICKER',
    },
  });

  const packerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      username: 'sallen',
      email: 'sallen@flowlogic.com',
      passwordHash: '$2b$10$v.RItiDm9XXds0c5phbam.3IzzWHYHKdgvfP2YukGX85z/NntcfWC',
      firstName: 'Sarah',
      lastName: 'Allen',
      fullName: 'Sarah Allen',
      role: 'PACKER',
    },
  });

  const receiverUser = await prisma.user.create({
    data: {
      companyId: company.id,
      username: 'rjohnson',
      email: 'rjohnson@flowlogic.com',
      passwordHash: '$2b$10$v.RItiDm9XXds0c5phbam.3IzzWHYHKdgvfP2YukGX85z/NntcfWC',
      firstName: 'Robert',
      lastName: 'Johnson',
      fullName: 'Robert Johnson',
      role: 'RECEIVER',
    },
  });
  const users = [adminUser, managerUser, pickerUser, packerUser, receiverUser];
  console.log('Created 5 users');

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

  // Create Carriers sequentially
  const upsCarrier = await prisma.carrier.create({
    data: {
      code: 'UPS',
      name: 'United Parcel Service',
      type: 'PARCEL',
    },
  });

  const fedexCarrier = await prisma.carrier.create({
    data: {
      code: 'FEDEX',
      name: 'FedEx',
      type: 'PARCEL',
    },
  });

  const uspsCarrier = await prisma.carrier.create({
    data: {
      code: 'USPS',
      name: 'US Postal Service',
      type: 'PARCEL',
    },
  });
  console.log('Created 3 carriers');

  // Create Carrier Services sequentially
  await prisma.carrierService.create({
    data: {
      carrierId: upsCarrier.id,
      code: 'UPS-GROUND',
      name: 'UPS Ground',
      transitDays: 5,
    },
  });
  await prisma.carrierService.create({
    data: {
      carrierId: upsCarrier.id,
      code: 'UPS-2DAY',
      name: 'UPS 2nd Day Air',
      transitDays: 2,
    },
  });
  await prisma.carrierService.create({
    data: {
      carrierId: fedexCarrier.id,
      code: 'FEDEX-HOME',
      name: 'FedEx Home Delivery',
      transitDays: 4,
    },
  });
  await prisma.carrierService.create({
    data: {
      carrierId: fedexCarrier.id,
      code: 'FEDEX-EXPRESS',
      name: 'FedEx Express',
      transitDays: 1,
    },
  });
  console.log('Created carrier services');

  // Create Customers sequentially
  const customer1 = await prisma.customer.create({
    data: {
      companyId: company.id,
      code: 'CUST001',
      name: 'Acme Corporation',
      type: 'WHOLESALE',
      contactName: 'Jane Wilson',
      email: 'jwilson@acme.com',
      phone: '(555) 123-4567',
      billingAddress: '100 Corporate Drive',
      billingCity: 'New York',
      billingState: 'NY',
      billingZipCode: '10001',
      shippingAddress: '100 Corporate Drive',
      shippingCity: 'New York',
      shippingState: 'NY',
      shippingZipCode: '10001',
      defaultCarrierId: upsCarrier.id,
      paymentTerms: 'NET30',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      companyId: company.id,
      code: 'CUST002',
      name: 'TechStart Inc',
      type: 'RETAIL',
      contactName: 'Tom Brown',
      email: 'tbrown@techstart.com',
      phone: '(555) 234-5678',
      billingAddress: '200 Innovation Way',
      billingCity: 'San Francisco',
      billingState: 'CA',
      billingZipCode: '94102',
      shippingAddress: '200 Innovation Way',
      shippingCity: 'San Francisco',
      shippingState: 'CA',
      shippingZipCode: '94102',
      defaultCarrierId: fedexCarrier.id,
      paymentTerms: 'NET15',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      companyId: company.id,
      code: 'CUST003',
      name: 'WebShop Direct',
      type: 'ECOMMERCE',
      contactName: 'Lisa Chen',
      email: 'lchen@webshop.com',
      phone: '(555) 345-6789',
      billingAddress: '300 E-Commerce Lane',
      billingCity: 'Seattle',
      billingState: 'WA',
      billingZipCode: '98101',
      shippingAddress: '300 E-Commerce Lane',
      shippingCity: 'Seattle',
      shippingState: 'WA',
      shippingZipCode: '98101',
      defaultCarrierId: upsCarrier.id,
      paymentTerms: 'NET30',
    },
  });
  console.log('Created 3 customers');

  // Create Vendors sequentially
  await prisma.vendor.create({
    data: {
      companyId: company.id,
      code: 'VND001',
      name: 'Global Electronics Supply',
      type: 'SUPPLIER',
      contactName: 'Mark Taylor',
      email: 'mtaylor@globalelec.com',
      phone: '(555) 456-7890',
      address: '500 Supply Chain Road',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      paymentTerms: 'NET45',
      leadTimeDays: 14,
    },
  });

  await prisma.vendor.create({
    data: {
      companyId: company.id,
      code: 'VND002',
      name: 'Premium Furniture Co',
      type: 'MANUFACTURER',
      contactName: 'Susan White',
      email: 'swhite@premfurn.com',
      phone: '(555) 567-8901',
      address: '600 Manufacturing Blvd',
      city: 'Detroit',
      state: 'MI',
      zipCode: '48201',
      paymentTerms: 'NET30',
      leadTimeDays: 21,
    },
  });
  console.log('Created 2 vendors');

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

  // Create Sample Inventory
  const pickLocations = await prisma.location.findMany({
    where: { zoneId: pickZone.id },
    take: 6,
  });

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const location = pickLocations[i % pickLocations.length];
    const qty = Math.floor(Math.random() * 50) + 20;

    await prisma.inventory.create({
      data: {
        productId: product.id,
        locationId: location.id,
        warehouseId: warehouse.id,
        quantityOnHand: qty,
        quantityAvailable: qty,
        status: 'AVAILABLE',
      },
    });
  }
  console.log('Created sample inventory');

  // Create Sample Orders sequentially
  const order1 = await prisma.order.create({
    data: {
      warehouseId: warehouse.id,
      orderNumber: 'SO-2024-0001',
      customerId: customer1.id,
      type: 'SALES',
      status: 'NEW',
      priority: 5,
      orderDate: new Date(),
      requiredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      shipToName: customer1.name,
      shipToAddress: '100 Corporate Drive',
      shipToCity: 'New York',
      shipToState: 'NY',
      shipToZipCode: '10001',
      carrierId: upsCarrier.id,
      totalLines: 2,
      totalUnits: 15,
      sourceChannel: 'EDI',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      warehouseId: warehouse.id,
      orderNumber: 'SO-2024-0002',
      customerId: customer2.id,
      type: 'SALES',
      status: 'ALLOCATED',
      priority: 3,
      orderDate: new Date(),
      requiredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      shipToName: customer2.name,
      shipToAddress: '200 Innovation Way',
      shipToCity: 'San Francisco',
      shipToState: 'CA',
      shipToZipCode: '94102',
      carrierId: fedexCarrier.id,
      totalLines: 1,
      totalUnits: 5,
      sourceChannel: 'API',
    },
  });

  const order3 = await prisma.order.create({
    data: {
      warehouseId: warehouse.id,
      orderNumber: 'SO-2024-0003',
      customerId: customer3.id,
      type: 'SALES',
      status: 'PICKING',
      priority: 1,
      orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      requiredDate: new Date(),
      shipToName: 'WebShop Customer',
      shipToAddress: '123 Consumer Street',
      shipToCity: 'Portland',
      shipToState: 'OR',
      shipToZipCode: '97201',
      carrierId: upsCarrier.id,
      totalLines: 3,
      totalUnits: 8,
      sourceChannel: 'Web',
    },
  });
  console.log('Created 3 orders');

  // Create Order Lines sequentially
  await prisma.orderLine.create({
    data: {
      orderId: order1.id,
      lineNumber: 1,
      productId: laptop.id,
      quantityOrdered: 10,
      uom: 'EA',
      unitPrice: 899.99,
      lineTotal: 8999.90,
      status: 'NEW',
    },
  });
  await prisma.orderLine.create({
    data: {
      orderId: order1.id,
      lineNumber: 2,
      productId: chair.id,
      quantityOrdered: 5,
      uom: 'EA',
      unitPrice: 299.99,
      lineTotal: 1499.95,
      status: 'NEW',
    },
  });
  await prisma.orderLine.create({
    data: {
      orderId: order2.id,
      lineNumber: 1,
      productId: phone.id,
      quantityOrdered: 5,
      quantityAllocated: 5,
      uom: 'EA',
      unitPrice: 699.99,
      lineTotal: 3499.95,
      status: 'ALLOCATED',
    },
  });
  await prisma.orderLine.create({
    data: {
      orderId: order3.id,
      lineNumber: 1,
      productId: snack.id,
      quantityOrdered: 4,
      quantityAllocated: 4,
      quantityPicked: 2,
      uom: 'EA',
      unitPrice: 24.99,
      lineTotal: 99.96,
      status: 'PICKING',
    },
  });
  await prisma.orderLine.create({
    data: {
      orderId: order3.id,
      lineNumber: 2,
      productId: shirt.id,
      quantityOrdered: 3,
      quantityAllocated: 3,
      quantityPicked: 3,
      uom: 'EA',
      unitPrice: 24.99,
      lineTotal: 74.97,
      status: 'PICKED',
    },
  });
  await prisma.orderLine.create({
    data: {
      orderId: order3.id,
      lineNumber: 3,
      productId: phone.id,
      quantityOrdered: 1,
      quantityAllocated: 1,
      uom: 'EA',
      unitPrice: 699.99,
      lineTotal: 699.99,
      status: 'ALLOCATED',
    },
  });
  console.log('Created order lines');

  // Create Sample Alerts sequentially
  await prisma.alert.create({
    data: {
      warehouseId: warehouse.id,
      type: 'INVENTORY_DISCREPANCY',
      severity: 'CRITICAL',
      title: 'Inventory Shortage Detected',
      message: 'Product ELEC-LAPTOP-001 shows 5 unit shortage at location P001. Expected: 25, Actual: 20.',
      entityType: 'Product',
      entityId: laptop.id,
      suggestedAction: 'Investigate the shortage and create a cycle count to verify inventory.',
      aiConfidence: 0.95,
    },
  });
  await prisma.alert.create({
    data: {
      warehouseId: warehouse.id,
      type: 'LOW_STOCK',
      severity: 'WARNING',
      title: 'Low Stock Warning',
      message: 'Product FOOD-SNACK-001 is approaching reorder point. Current: 85, Reorder Point: 200.',
      entityType: 'Product',
      entityId: snack.id,
      suggestedAction: 'Create purchase order for 500 units from the primary vendor.',
      aiConfidence: 0.88,
    },
  });
  await prisma.alert.create({
    data: {
      warehouseId: warehouse.id,
      type: 'ORDER_LATE',
      severity: 'WARNING',
      title: 'Order Behind Schedule',
      message: 'Order SO-2024-0003 is behind schedule. Required date is today but order is still in picking.',
      entityType: 'Order',
      entityId: order3.id,
      suggestedAction: 'Prioritize this order and assign additional pickers.',
      aiConfidence: 0.92,
    },
  });
  console.log('Created sample alerts');

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

  // Create inventory snapshots with some issues for demo
  const inventoryItems = await prisma.inventory.findMany({ take: 20 });
  for (const inv of inventoryItems) {
    await prisma.inventorySnapshot.create({
      data: {
        ingestionId: ingestion.id,
        sku: inv.productId ? (await prisma.product.findUnique({ where: { id: inv.productId } }))?.sku || 'UNKNOWN' : 'UNKNOWN',
        locationCode: inv.locationId ? (await prisma.location.findUnique({ where: { id: inv.locationId } }))?.code || 'UNKNOWN' : 'UNKNOWN',
        quantityOnHand: inv.quantityOnHand,
        quantityAllocated: inv.quantityAllocated,
        quantityAvailable: inv.quantityAvailable,
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
  console.log('  20 cycle count snapshots');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
