import { PrismaClient } from '../server/generated/prisma/client.js';
const prisma = new PrismaClient();

async function verifyData() {
  console.log('\n=== Database Verification ===\n');

  // Check users
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, isActive: true, role: true }
  });
  console.log('Users:', users.length);
  users.forEach(u => console.log(`  - ${u.username} (${u.email}) [${u.role}] Active: ${u.isActive}`));

  // Check alerts
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log('\nAlerts:', alerts.length);
  const unresolved = alerts.filter(a => !a.isResolved);
  console.log('Unresolved:', unresolved.length);

  console.log('\nUnresolved alerts:');
  unresolved.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.severity}] ${a.title}`);
    console.log(`      Type: ${a.type}, isResolved: ${a.isResolved}`);
  });

  // Check integrations
  const integrations = await prisma.integration.findMany();
  console.log('\nIntegrations:', integrations.length);
  integrations.forEach(i => console.log(`  - ${i.name} (${i.type}) Status: ${i.status}`));

  // Check inventory snapshots
  const invCount = await prisma.inventorySnapshot.count();
  console.log('\nInventory Snapshots:', invCount);

  // Check transaction snapshots
  const txCount = await prisma.transactionSnapshot.count();
  console.log('Transaction Snapshots:', txCount);

  await prisma.$disconnect();

  console.log('\n=== Verification Complete ===');
  console.log('\nTo see alerts in the UI:');
  console.log('1. Make sure you are logged in');
  console.log('2. Navigate to /dashboard or /alerts');
  console.log('3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
  console.log('\nIf using existing credentials, login with:');
  if (users.length > 0) {
    console.log(`   Username: ${users[0].username}`);
    console.log('   Password: (whatever was set during initial setup)');
  }
}

verifyData().catch(console.error);
