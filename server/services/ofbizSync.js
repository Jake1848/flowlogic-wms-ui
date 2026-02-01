// OFBiz Automatic Sync Service
import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, '../../scripts');
const OFBIZ_DIR = process.env.OFBIZ_PATH || '/mnt/c/Users/Jake/OneDrive/Desktop/FlowLogic/apache-ofbiz-24.09.05';
const JAVA_HOME = process.env.JAVA_HOME || '/home/jake_k/jdk-17.0.2';
const DERBY_JAR = process.env.DERBY_JAR || '/home/jake_k/.gradle/caches/modules-2/files-2.1/org.apache.derby/derby/10.14.2.0/7efad40ef52fbb1f08142f07a83b42d29e47d8ce/derby-10.14.2.0.jar';

let syncInProgress = false;
let lastSyncTime = null;
let lastSyncStatus = null;
let lastSyncError = null;

export function getSyncStatus() {
  return {
    inProgress: syncInProgress,
    lastSyncTime,
    lastSyncStatus,
    lastSyncError
  };
}

// Export data from OFBiz Derby database using Java
function exportFromOFBiz() {
  return new Promise((resolve, reject) => {
    const dbPath = join(OFBIZ_DIR, 'runtime/data/derby/ofbiz');

    const javaCode = `
import java.sql.*;
import java.io.*;
public class OFBizExport {
  public static void main(String[] args) throws Exception {
    Connection conn = DriverManager.getConnection("jdbc:derby:" + args[0]);
    Statement stmt = conn.createStatement();

    // Export inventory
    StringBuilder json = new StringBuilder();
    json.append("[\\n");
    ResultSet rs = stmt.executeQuery(
      "SELECT i.INVENTORY_ITEM_ID, i.PRODUCT_ID, i.FACILITY_ID, i.LOCATION_SEQ_ID, " +
      "i.QUANTITY_ON_HAND_TOTAL, i.AVAILABLE_TO_PROMISE_TOTAL, i.UNIT_COST, i.CURRENCY_UOM_ID, " +
      "i.LAST_UPDATED_STAMP FROM OFBIZ.INVENTORY_ITEM i"
    );
    boolean first = true;
    while (rs.next()) {
      if (!first) json.append(",\\n");
      first = false;
      json.append("  {\\"inventoryItemId\\": \\"" + rs.getString("INVENTORY_ITEM_ID") + "\\",");
      json.append("\\"productId\\": \\"" + nullSafe(rs.getString("PRODUCT_ID")) + "\\",");
      json.append("\\"facilityId\\": \\"" + nullSafe(rs.getString("FACILITY_ID")) + "\\",");
      json.append("\\"locationSeqId\\": \\"" + nullSafe(rs.getString("LOCATION_SEQ_ID")) + "\\",");
      json.append("\\"quantityOnHand\\": " + rs.getBigDecimal("QUANTITY_ON_HAND_TOTAL") + ",");
      json.append("\\"availableToPromise\\": " + rs.getBigDecimal("AVAILABLE_TO_PROMISE_TOTAL") + ",");
      json.append("\\"unitCost\\": " + rs.getBigDecimal("UNIT_COST") + ",");
      json.append("\\"currency\\": \\"" + nullSafe(rs.getString("CURRENCY_UOM_ID")) + "\\",");
      json.append("\\"lastUpdated\\": \\"" + nullSafe(rs.getString("LAST_UPDATED_STAMP")) + "\\"}");
    }
    json.append("\\n]");
    System.out.println(json.toString());
    conn.close();
  }
  static String nullSafe(String s) { return s != null ? s : ""; }
}`;

    // Write Java file
    const javaFile = '/tmp/OFBizExport.java';
    writeFileSync(javaFile, javaCode);

    // Compile
    const javac = spawn(join(JAVA_HOME, 'bin/javac'), ['-cp', DERBY_JAR, javaFile], {
      cwd: '/tmp'
    });

    javac.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to compile Java export'));
        return;
      }

      // Run
      const java = spawn(join(JAVA_HOME, 'bin/java'), ['-cp', `.:${DERBY_JAR}`, 'OFBizExport', dbPath], {
        cwd: '/tmp'
      });

      let output = '';
      let error = '';

      java.stdout.on('data', (data) => { output += data; });
      java.stderr.on('data', (data) => { error += data; });

      java.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Java export failed: ${error}`));
          return;
        }
        try {
          const data = JSON.parse(output);
          resolve(data);
        } catch (e) {
          reject(new Error(`Failed to parse export: ${e.message}`));
        }
      });
    });
  });
}

// Export variance/bad item data from OFBiz
function exportVariancesFromOFBiz() {
  return new Promise((resolve, reject) => {
    const dbPath = join(OFBIZ_DIR, 'runtime/data/derby/ofbiz');

    const javaCode = `
import java.sql.*;
public class OFBizVarianceExport {
  public static void main(String[] args) throws Exception {
    Connection conn = DriverManager.getConnection("jdbc:derby:" + args[0]);
    Statement stmt = conn.createStatement();

    StringBuilder json = new StringBuilder();
    json.append("[\\n");

    // Get variances with reasons
    ResultSet rs = stmt.executeQuery(
      "SELECT v.INVENTORY_ITEM_ID, v.VARIANCE_REASON_ID, v.QUANTITY_ON_HAND_VAR, " +
      "v.AVAILABLE_TO_PROMISE_VAR, v.COMMENTS, v.CREATED_STAMP, " +
      "r.DESCRIPTION as REASON_DESC, i.PRODUCT_ID, i.FACILITY_ID, i.LOCATION_SEQ_ID " +
      "FROM OFBIZ.INVENTORY_ITEM_VARIANCE v " +
      "LEFT JOIN OFBIZ.VARIANCE_REASON r ON v.VARIANCE_REASON_ID = r.VARIANCE_REASON_ID " +
      "LEFT JOIN OFBIZ.INVENTORY_ITEM i ON v.INVENTORY_ITEM_ID = i.INVENTORY_ITEM_ID"
    );

    boolean first = true;
    while (rs.next()) {
      if (!first) json.append(",\\n");
      first = false;
      json.append("  {\\"inventoryItemId\\": \\"" + nullSafe(rs.getString("INVENTORY_ITEM_ID")) + "\\",");
      json.append("\\"productId\\": \\"" + nullSafe(rs.getString("PRODUCT_ID")) + "\\",");
      json.append("\\"facilityId\\": \\"" + nullSafe(rs.getString("FACILITY_ID")) + "\\",");
      json.append("\\"locationSeqId\\": \\"" + nullSafe(rs.getString("LOCATION_SEQ_ID")) + "\\",");
      json.append("\\"varianceReasonId\\": \\"" + nullSafe(rs.getString("VARIANCE_REASON_ID")) + "\\",");
      json.append("\\"reasonDescription\\": \\"" + nullSafe(rs.getString("REASON_DESC")) + "\\",");
      json.append("\\"quantityVariance\\": " + rs.getBigDecimal("QUANTITY_ON_HAND_VAR") + ",");
      json.append("\\"comments\\": \\"" + nullSafe(rs.getString("COMMENTS")) + "\\",");
      json.append("\\"createdAt\\": \\"" + nullSafe(rs.getString("CREATED_STAMP")) + "\\"}");
    }
    json.append("\\n]");
    System.out.println(json.toString());
    conn.close();
  }
  static String nullSafe(String s) { return s != null ? s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") : ""; }
}`;

    const javaFile = '/tmp/OFBizVarianceExport.java';
    writeFileSync(javaFile, javaCode);

    const javac = spawn(join(JAVA_HOME, 'bin/javac'), ['-cp', DERBY_JAR, javaFile], { cwd: '/tmp' });

    javac.on('close', (code) => {
      if (code !== 0) {
        resolve([]); // Return empty if compile fails
        return;
      }

      const java = spawn(join(JAVA_HOME, 'bin/java'), ['-cp', `.:${DERBY_JAR}`, 'OFBizVarianceExport', dbPath], { cwd: '/tmp' });
      let output = '';

      java.stdout.on('data', (data) => { output += data; });
      java.on('close', (code) => {
        try {
          resolve(JSON.parse(output));
        } catch {
          resolve([]);
        }
      });
    });
  });
}

// Load products from cached file
function loadProducts() {
  try {
    const productsFile = join(SCRIPTS_DIR, 'ofbiz-products.json');
    return JSON.parse(readFileSync(productsFile, 'utf-8'));
  } catch (e) {
    console.warn('Could not load products file:', e.message);
    return [];
  }
}

// Main sync function
export async function syncOFBizData(prisma) {
  if (syncInProgress) {
    return { success: false, error: 'Sync already in progress' };
  }

  syncInProgress = true;
  lastSyncError = null;

  try {
    console.log('[OFBiz Sync] Starting automatic sync...');

    // Get or create integration record
    let integration = await prisma.integration.findFirst({
      where: { name: { contains: 'OFBiz' } }
    });

    if (!integration) {
      // Get or create a default company for the integration
      let company = await prisma.company.findFirst();
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: 'FlowLogic Demo',
            domain: 'flowlogic.local'
          }
        });
      }

      integration = await prisma.integration.create({
        data: {
          name: 'Apache OFBiz WMS (Auto-Sync)',
          type: 'CUSTOM_WMS',
          status: 'ACTIVE',
          isActive: true,
          settings: { source: 'Derby Database', autoSync: true },
          companyId: company.id
        }
      });
    }

    // Export from OFBiz
    console.log('[OFBiz Sync] Exporting from Derby database...');
    const inventoryData = await exportFromOFBiz();
    console.log(`[OFBiz Sync] Exported ${inventoryData.length} inventory items`);

    // Load products for names
    const products = loadProducts();
    const productMap = {};
    products.forEach(p => { productMap[p.productId] = p; });

    // Get or create ingestion record
    let ingestion = await prisma.dataIngestion.findFirst({
      where: { filename: { contains: 'OFBiz-AutoSync' } }
    });

    if (!ingestion) {
      ingestion = await prisma.dataIngestion.create({
        data: {
          filename: 'OFBiz-AutoSync',
          filePath: '/ofbiz/auto-sync',
          dataType: 'inventory_snapshot',
          source: 'OFBiz',
          mappingType: 'ofbiz',
          status: 'COMPLETED',
          recordCount: inventoryData.length,
          errorCount: 0,
          completedAt: new Date()
        }
      });
    }

    // Clear old snapshots and import new
    await prisma.inventorySnapshot.deleteMany({
      where: { ingestionId: ingestion.id }
    });

    let imported = 0;
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
      imported++;
    }

    // Update integration last sync time
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date(), status: 'ACTIVE' }
    });

    // Update ingestion
    await prisma.dataIngestion.update({
      where: { id: ingestion.id },
      data: {
        recordCount: imported,
        completedAt: new Date(),
        status: 'COMPLETED'
      }
    });

    // Generate alerts from inventory data
    await generateAlerts(prisma, inventoryData, productMap);

    // Sync bad items (variances) from OFBiz
    console.log('[OFBiz Sync] Exporting variances/bad items...');
    const varianceData = await exportVariancesFromOFBiz();
    console.log(`[OFBiz Sync] Exported ${varianceData.length} variance records`);

    // Sync bad items to database
    const badItemsImported = await syncBadItems(prisma, varianceData, productMap);
    console.log(`[OFBiz Sync] Synced ${badItemsImported} bad items`);

    lastSyncTime = new Date();
    lastSyncStatus = 'success';

    console.log(`[OFBiz Sync] Complete! Imported ${imported} items, ${badItemsImported} bad items`);

    return {
      success: true,
      imported,
      timestamp: lastSyncTime
    };

  } catch (error) {
    console.error('[OFBiz Sync] Error:', error.message);
    lastSyncStatus = 'error';
    lastSyncError = error.message;
    return { success: false, error: error.message };
  } finally {
    syncInProgress = false;
  }
}

// Generate alerts based on inventory conditions
async function generateAlerts(prisma, inventoryData, productMap) {
  // Clear old auto-generated alerts
  await prisma.alert.deleteMany({
    where: { title: { contains: '[Auto]' } }
  });

  let alertCount = 0;

  // Low stock alerts (qty < 10)
  const lowStock = inventoryData.filter(i => i.quantityOnHand < 10 && i.quantityOnHand > 0);
  for (const item of lowStock.slice(0, 5)) {
    const product = productMap[item.productId] || {};
    await prisma.alert.create({
      data: {
        type: 'LOW_STOCK',
        severity: item.quantityOnHand < 5 ? 'CRITICAL' : 'WARNING',
        title: `[Auto] Low Stock: ${item.productId}`,
        message: `${product.name || item.productId} at ${item.locationSeqId || 'DEFAULT'} has only ${item.quantityOnHand} units`,
        isResolved: false,
        isRead: false
      }
    });
    alertCount++;
  }

  // Split inventory alerts
  const skuLocations = {};
  inventoryData.forEach(i => {
    if (!skuLocations[i.productId]) skuLocations[i.productId] = [];
    skuLocations[i.productId].push(i);
  });

  const multiLocation = Object.entries(skuLocations).filter(([_, items]) => items.length > 1);
  for (const [sku, items] of multiLocation.slice(0, 3)) {
    const product = productMap[sku] || {};
    const totalQty = items.reduce((sum, i) => sum + i.quantityOnHand, 0);
    await prisma.alert.create({
      data: {
        type: 'INVENTORY_DISCREPANCY',
        severity: 'WARNING',
        title: `[Auto] Split Inventory: ${sku}`,
        message: `${product.name || sku} is across ${items.length} locations. Total: ${totalQty} units.`,
        isResolved: false,
        isRead: false
      }
    });
    alertCount++;
  }

  console.log(`[OFBiz Sync] Generated ${alertCount} alerts`);
}

// Sync bad items from variance data
async function syncBadItems(prisma, varianceData, productMap) {
  if (!varianceData || varianceData.length === 0) {
    return 0;
  }

  // Map variance reasons to issue types
  const issueTypeMap = {
    'VAR_LOST': 'LOST',
    'VAR_STOLEN': 'THEFT',
    'VAR_FOUND': 'FOUND',
    'VAR_DAMAGED': 'DAMAGED',
    'VAR_INTEGR': 'INTEGRATION_ERROR',
    'VAR_SAMPLE': 'SAMPLE',
    'VAR_TRANSIT': 'IN_TRANSIT',
    'VAR_REJECTED': 'REJECTED',
    'VAR_MISSHIP_ORDERED': 'MIS_SHIPPED',
    'VAR_MISSHIP_SHIPPED': 'MIS_SHIPPED'
  };

  const severityMap = {
    'VAR_LOST': 'HIGH',
    'VAR_STOLEN': 'CRITICAL',
    'VAR_DAMAGED': 'MEDIUM',
    'VAR_REJECTED': 'MEDIUM',
    'VAR_MISSHIP_ORDERED': 'HIGH',
    'VAR_MISSHIP_SHIPPED': 'HIGH'
  };

  let imported = 0;

  for (const variance of varianceData) {
    const product = productMap[variance.productId] || {};
    const issueType = issueTypeMap[variance.varianceReasonId] || 'OTHER';
    const severity = severityMap[variance.varianceReasonId] || 'LOW';

    // Check if this variance already exists
    const existing = await prisma.badItem.findFirst({
      where: {
        sku: variance.productId || 'UNKNOWN',
        locationCode: variance.locationSeqId || 'DEFAULT',
        issueType: issueType,
        rawData: {
          path: ['inventoryItemId'],
          equals: variance.inventoryItemId
        }
      }
    });

    if (!existing) {
      await prisma.badItem.create({
        data: {
          sku: variance.productId || 'UNKNOWN',
          description: product.name || product.internalName || variance.reasonDescription || `${issueType} item`,
          issueType: issueType,
          severity: severity,
          occurrences: Math.abs(variance.quantityVariance || 1),
          locationCode: variance.locationSeqId || 'DEFAULT',
          warehouseId: variance.facilityId || null,
          status: 'OPEN',
          reportedAt: variance.createdAt ? new Date(variance.createdAt) : new Date(),
          notes: variance.comments || null,
          sourceFile: 'OFBiz-WMS',
          rawData: {
            inventoryItemId: variance.inventoryItemId,
            varianceReasonId: variance.varianceReasonId,
            reasonDescription: variance.reasonDescription,
            quantityVariance: variance.quantityVariance,
            facilityId: variance.facilityId,
            productName: product.name || product.internalName
          }
        }
      });
      imported++;
    }
  }

  return imported;
}

// Schedule automatic sync
let syncInterval = null;

export function startAutoSync(prisma, intervalMinutes = 5) {
  if (syncInterval) {
    console.log('[OFBiz Sync] Auto-sync already running');
    return;
  }

  console.log(`[OFBiz Sync] Starting auto-sync every ${intervalMinutes} minutes`);

  // Run immediately
  syncOFBizData(prisma);

  // Then run on interval
  syncInterval = setInterval(() => {
    syncOFBizData(prisma);
  }, intervalMinutes * 60 * 1000);
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[OFBiz Sync] Auto-sync stopped');
  }
}

export default {
  syncOFBizData,
  getSyncStatus,
  startAutoSync,
  stopAutoSync
};
