import { PrismaClient } from '../server/generated/prisma/client.js';
const prisma = new PrismaClient();

async function setup() {
  // Find existing company
  let company = await prisma.company.findFirst();
  console.log('Existing company:', company?.id, company?.name);

  if (!company) {
    console.log('No company found, creating one...');
    company = await prisma.company.create({
      data: {
        name: 'FlowLogic Demo',
        industry: 'Logistics'
      }
    });
    console.log('Created company:', company.id);
  }

  // Check if OFBiz integration already exists
  const existing = await prisma.integration.findFirst({
    where: { name: 'Apache OFBiz WMS' }
  });

  if (existing) {
    console.log('\nOFBiz integration already exists:', existing.id);
  } else {
    // Create OFBiz integration record (using CUSTOM_WMS as type since OFBIZ isn't in DB enum yet)
    const integration = await prisma.integration.create({
      data: {
        name: 'Apache OFBiz WMS',
        type: 'CUSTOM_WMS',
        endpoint: 'https://localhost:8443',
        username: 'admin',
        password: 'ofbiz',
        status: 'ACTIVE',
        isActive: true,
        companyId: company.id,
        settings: {
          facilityId: 'WebStoreWarehouse',
          syncInterval: '15m',
          dataTypes: ['inventory', 'transactions']
        },
        lastSyncAt: new Date()
      }
    });

    console.log('\nCreated OFBiz integration:', integration.id);
  }

  // List all integrations
  const all = await prisma.integration.findMany();
  console.log('\n=== All Integrations ===');
  all.forEach(i => console.log('  -', i.name, '|', i.type, '|', i.status, '| Active:', i.isActive));

  // Show data stats
  const invCount = await prisma.inventorySnapshot.count();
  const txCount = await prisma.transactionSnapshot.count();
  const ingestions = await prisma.dataIngestion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('\n=== Data Stats ===');
  console.log('Inventory Snapshots:', invCount);
  console.log('Transaction Snapshots:', txCount);
  console.log('\nRecent Ingestions:');
  ingestions.forEach(i => console.log('  -', i.source, '|', i.status, '|', i.recordCount, 'records'));

  await prisma.$disconnect();
}

setup().catch(console.error);
