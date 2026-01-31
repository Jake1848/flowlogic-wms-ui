import { PrismaClient } from '../server/generated/prisma/client.js';
const prisma = new PrismaClient();

async function checkAndFixAlerts() {
  console.log('\n=== Checking Alert State ===\n');

  // Get all alerts
  const allAlerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total alerts: ${allAlerts.length}`);
  console.log('\nAlert details:');
  allAlerts.forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.title}`);
    console.log(`      Type: ${a.type}, Severity: ${a.severity}`);
    console.log(`      isResolved: ${a.isResolved}, isRead: ${a.isRead}`);
    console.log(`      Created: ${a.createdAt}`);
    console.log('');
  });

  // Count by isResolved
  const unresolvedCount = allAlerts.filter(a => !a.isResolved).length;
  const resolvedCount = allAlerts.filter(a => a.isResolved).length;

  console.log(`Unresolved: ${unresolvedCount}`);
  console.log(`Resolved: ${resolvedCount}`);

  // If all are resolved, fix them
  if (unresolvedCount === 0 && allAlerts.length > 0) {
    console.log('\n=== All alerts are resolved - fixing... ===\n');

    const result = await prisma.alert.updateMany({
      data: {
        isResolved: false,
        isRead: false
      }
    });

    console.log(`Updated ${result.count} alerts to unresolved`);
  }

  // Check OFBiz-specific alerts
  const ofbizAlerts = allAlerts.filter(a => a.title?.includes('OFBiz') || a.message?.includes('OFBiz'));
  console.log(`\nOFBiz-related alerts: ${ofbizAlerts.length}`);

  // If no OFBiz alerts exist, create some from the inventory data
  if (ofbizAlerts.length === 0) {
    console.log('\n=== Creating OFBiz alerts from inventory data ===\n');

    const inventory = await prisma.inventorySnapshot.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${inventory.length} inventory snapshots`);

    for (const item of inventory) {
      // Create a low stock alert for demo
      if (item.quantity < 50) {
        const alert = await prisma.alert.create({
          data: {
            type: 'INVENTORY',
            severity: 'WARNING',
            title: `Low Stock: ${item.sku} [OFBiz]`,
            message: `Item ${item.sku} at ${item.locationCode} has only ${item.quantity} units. Consider replenishment.`,
            isResolved: false,
            isRead: false
          }
        });
        console.log(`Created alert: ${alert.title}`);
      }
    }

    // Create some sample alerts
    const sampleAlerts = [
      {
        type: 'INVENTORY',
        severity: 'CRITICAL',
        title: 'Inventory Discrepancy Detected [OFBiz]',
        message: 'WMS system shows variance between expected and actual inventory for SKU GZ-1001 in location FWRD-A1.',
        isResolved: false,
        isRead: false
      },
      {
        type: 'SYSTEM',
        severity: 'WARNING',
        title: 'OFBiz Sync Completed',
        message: 'Successfully synced 25 inventory items and 10 transactions from Apache OFBiz WMS.',
        isResolved: false,
        isRead: false
      },
      {
        type: 'INVENTORY',
        severity: 'WARNING',
        title: 'Multiple LPs in FWRD Location [OFBiz]',
        message: 'Location FWRD-B2 has 3 license plates for the same SKU GZ-2004, causing fragmentation issues.',
        isResolved: false,
        isRead: false
      }
    ];

    for (const alertData of sampleAlerts) {
      const alert = await prisma.alert.create({ data: alertData });
      console.log(`Created alert: ${alert.title}`);
    }
  }

  // Final count
  const finalAlerts = await prisma.alert.findMany({
    where: { isResolved: false }
  });
  console.log(`\n=== Final State ===`);
  console.log(`Active (unresolved) alerts: ${finalAlerts.length}`);

  await prisma.$disconnect();
}

checkAndFixAlerts().catch(console.error);
