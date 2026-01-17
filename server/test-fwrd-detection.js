/**
 * Test script for FWRD fragmentation detection
 * Run: node server/test-fwrd-detection.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from './generated/prisma/client.js';
import { detectFWRDFragmentation, getFWRDFragmentationSummary } from './modules/order-integrity/index.js';

const prisma = new PrismaClient();

async function testFWRDDetection() {
  console.log('\n========================================');
  console.log('FWRD License Plate Fragmentation Test');
  console.log('========================================\n');

  try {
    // First, let's see what's in the inventory
    const totalInventory = await prisma.inventorySnapshot.count();
    console.log(`Total inventory records: ${totalInventory}`);

    // Count by location type
    const byLocationType = await prisma.inventorySnapshot.groupBy({
      by: ['locationType'],
      _count: { _all: true },
    });
    console.log('\nInventory by location type:');
    byLocationType.forEach(lt => {
      console.log(`  ${lt.locationType || 'NULL'}: ${lt._count._all} records`);
    });

    // Check FWRD locations specifically
    const fwrdRecords = await prisma.inventorySnapshot.findMany({
      where: {
        OR: [
          { locationType: 'FWRD' },
          { locationCode: { startsWith: 'FWRD' } },
        ],
      },
      select: {
        sku: true,
        locationCode: true,
        locationType: true,
        licensePlate: true,
        quantityOnHand: true,
      },
      orderBy: [
        { locationCode: 'asc' },
        { sku: 'asc' },
      ],
    });

    console.log(`\nFWRD inventory records: ${fwrdRecords.length}`);

    // Group by location and SKU to find fragmentation
    const grouped = {};
    for (const record of fwrdRecords) {
      const key = `${record.locationCode}|${record.sku}`;
      if (!grouped[key]) {
        grouped[key] = {
          locationCode: record.locationCode,
          sku: record.sku,
          plates: [],
          totalQty: 0,
        };
      }
      grouped[key].plates.push(record.licensePlate);
      grouped[key].totalQty += record.quantityOnHand;
    }

    // Find fragmented (multiple plates same SKU)
    const fragmented = Object.values(grouped).filter(g => g.plates.length >= 2);

    console.log(`\nFragmented FWRD locations (same SKU, multiple LPs): ${fragmented.length}`);

    if (fragmented.length > 0) {
      console.log('\n--- Sample Fragmented FWRD Locations ---');
      fragmented.slice(0, 5).forEach(f => {
        console.log(`\nLocation: ${f.locationCode}`);
        console.log(`  SKU: ${f.sku}`);
        console.log(`  License Plates: ${f.plates.length}`);
        console.log(`  Total Quantity: ${f.totalQty}`);
        console.log(`  Plates: ${f.plates.join(', ')}`);
      });
    }

    // Now run the actual detection function
    console.log('\n========================================');
    console.log('Running detectFWRDFragmentation()...');
    console.log('========================================\n');

    const detectionResults = await detectFWRDFragmentation(
      prisma,
      ['FWRD', 'RESERVE'],
      2,  // minPlates
      true  // includeFinancialImpact
    );

    console.log('Detection Summary:');
    console.log(`  Total fragmented locations: ${detectionResults.summary.totalFragmentedLocations}`);
    console.log(`  Total affected SKUs: ${detectionResults.summary.totalAffectedSkus}`);
    console.log(`  Total fragmented LPs: ${detectionResults.summary.totalFragmentedPlates}`);
    console.log(`  Estimated financial impact: $${detectionResults.summary.estimatedImpact?.toLocaleString() || 'N/A'}`);

    if (detectionResults.findings.length > 0) {
      console.log('\n--- Top 5 Fragmentation Issues ---');
      detectionResults.findings.slice(0, 5).forEach((finding, i) => {
        console.log(`\n${i + 1}. ${finding.description}`);
        console.log(`   SKU: ${finding.sku}`);
        console.log(`   Location: ${finding.locationCode}`);
        console.log(`   Severity: ${finding.severity}`);
        if (finding.details) {
          console.log(`   Details: ${JSON.stringify(finding.details)}`);
        }
      });
    }

    console.log(`\nTotal issues found: ${detectionResults.findings.length}`);

    // Check MPP locations - these should NOT be flagged
    console.log('\n========================================');
    console.log('MPP Locations (should NOT be fragmented)');
    console.log('========================================\n');

    const mppRecords = await prisma.inventorySnapshot.findMany({
      where: {
        OR: [
          { locationType: 'MPP' },
          { locationCode: { startsWith: 'MPP' } },
        ],
      },
      select: {
        sku: true,
        locationCode: true,
        licensePlate: true,
      },
    });

    const mppGrouped = {};
    for (const record of mppRecords) {
      if (!mppGrouped[record.locationCode]) {
        mppGrouped[record.locationCode] = new Set();
      }
      mppGrouped[record.locationCode].add(record.sku);
    }

    console.log(`MPP locations: ${Object.keys(mppGrouped).length}`);
    console.log('MPP locations with multiple SKUs (expected - NOT fragmentation):');
    Object.entries(mppGrouped).slice(0, 5).forEach(([loc, skus]) => {
      console.log(`  ${loc}: ${skus.size} different SKUs`);
    });

    // Verify MPP is not in fragmentation results
    const mppInFindings = detectionResults.findings.filter(f =>
      f.locationType === 'MPP' || f.locationCode.startsWith('MPP')
    );

    console.log(`\nMPP locations incorrectly flagged as fragmented: ${mppInFindings.length}`);
    if (mppInFindings.length === 0) {
      console.log('PASS - MPP locations correctly excluded from fragmentation detection');
    } else {
      console.log('FAIL - MPP locations should not be flagged!');
    }

    console.log('\n========================================');
    console.log('Test Complete!');
    console.log('========================================\n');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFWRDDetection();
