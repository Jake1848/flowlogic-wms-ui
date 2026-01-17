/**
 * FlowLogic Order Integrity & Overage Detection Engine
 *
 * CRITICAL WAREHOUSE DETECTION SCENARIOS:
 *
 * 1. DOUBLE BOM CONSUMPTION
 *    - Order BOM consumed twice but only one label printed
 *    - Inventory reduced twice for single fulfillment
 *
 * 2. ORDER-LEVEL ANOMALY DETECTION
 *    - Track every order from creation to shipment
 *    - Detect picks/transactions that don't match order quantities
 *
 * 3. SYSTEMATIC OVERAGE DETECTION
 *    - Most warehouses have MORE inventory than system shows
 *    - Find patterns causing positive variances
 *
 * 4. RECEIPT POSTING FAILURES
 *    - Items physically received but inventory not posted
 *    - ASN received but no corresponding inventory increase
 *
 * 5. PO DISCREPANCY DETECTION
 *    - PO quantity vs actual received mismatch
 *    - Short ships, over ships, wrong items
 *
 * 6. DUPLICATE TRANSACTION DETECTION
 *    - Same transaction recorded multiple times
 *    - Label reprints causing duplicate picks
 */

import { Router } from 'express';

/**
 * Enhanced discrepancy types for real warehouse scenarios
 */
export const ORDER_DISCREPANCY_TYPES = {
  // BOM & Order Issues
  DOUBLE_BOM_CONSUMPTION: 'double_bom_consumption',
  ORDER_OVERPICK: 'order_overpick',
  ORDER_UNDERPICK: 'order_underpick',
  ORDER_WRONG_ITEM: 'order_wrong_item',
  LABEL_TRANSACTION_MISMATCH: 'label_transaction_mismatch',
  DUPLICATE_PICK: 'duplicate_pick',

  // Receipt & PO Issues
  RECEIPT_NOT_POSTED: 'receipt_not_posted',
  PO_QUANTITY_MISMATCH: 'po_quantity_mismatch',
  PO_SHORT_SHIP: 'po_short_ship',
  PO_OVER_RECEIPT: 'po_over_receipt',
  ASN_INVENTORY_MISMATCH: 'asn_inventory_mismatch',

  // Overage Issues (MORE than system shows)
  SYSTEMATIC_OVERAGE: 'systematic_overage',
  RECEIPT_DOUBLE_POST: 'receipt_double_post',
  RETURN_NOT_DEDUCTED: 'return_not_deducted',
  PUTAWAY_LOCATION_ERROR: 'putaway_location_error',

  // Transaction Integrity
  DUPLICATE_TRANSACTION: 'duplicate_transaction',
  TRANSACTION_SEQUENCE_ERROR: 'transaction_sequence_error',
  ORPHAN_TRANSACTION: 'orphan_transaction',

  // FWRD/Reserve Location Issues
  FWRD_LP_FRAGMENTATION: 'fwrd_lp_fragmentation',       // Multiple LPs same SKU in FWRD
  RESERVE_LP_FRAGMENTATION: 'reserve_lp_fragmentation', // Multiple LPs same SKU in reserve
  LP_MERGE_REQUIRED: 'lp_merge_required',               // LPs should be merged
  BOH_REDUCTION_RISK: 'boh_reduction_risk',             // At risk for incorrect BOH reduction

  // Parameter Mismatch Issues (systematic overages)
  PARAMETER_MISMATCH_OVERAGE: 'parameter_mismatch_overage',  // Target Order Min not divisible by Shelf Pack
  SHELF_PACK_ROUNDING: 'shelf_pack_rounding',                // Rounding creates systematic overage
  REPLENISHMENT_OVERAGE: 'replenishment_overage'             // Replenishment logic causing overage
};

const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Create Order Integrity routes
 */
export function createOrderIntegrityRoutes(prisma) {
  const router = Router();

  /**
   * @route GET /api/intelligence/orders/audit
   * @desc Audit all orders for anomalies
   */
  router.get('/audit', async (req, res) => {
    try {
      const { dateFrom, dateTo, limit = 100 } = req.query;
      const results = await auditOrders(prisma, { dateFrom, dateTo, limit: parseInt(limit) });
      res.json(results);
    } catch (error) {
      console.error('Order audit error:', error);
      res.status(500).json({ error: 'Order audit failed', details: error.message });
    }
  });

  /**
   * @route POST /api/intelligence/orders/analyze
   * @desc Run comprehensive order integrity analysis
   */
  router.post('/analyze', async (req, res) => {
    try {
      const { analysisTypes = 'all', scope = {} } = req.body;
      const results = await runOrderIntegrityAnalysis(prisma, analysisTypes, scope);
      res.json(results);
    } catch (error) {
      console.error('Order analysis error:', error);
      res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
  });

  /**
   * @route GET /api/intelligence/orders/double-consumption
   * @desc Detect double BOM consumption issues
   */
  router.get('/double-consumption', async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const results = await detectDoubleBOMConsumption(prisma, parseInt(days));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Detection failed' });
    }
  });

  /**
   * @route GET /api/intelligence/receipts/unposted
   * @desc Find receipts that weren't posted to inventory
   */
  router.get('/receipts/unposted', async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const results = await detectUnpostedReceipts(prisma, parseInt(days));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Detection failed' });
    }
  });

  /**
   * @route GET /api/intelligence/po/discrepancies
   * @desc Find PO vs receipt discrepancies
   */
  router.get('/po/discrepancies', async (req, res) => {
    try {
      const { days = 30, threshold = 0 } = req.query;
      const results = await detectPODiscrepancies(prisma, parseInt(days), parseFloat(threshold));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Detection failed' });
    }
  });

  /**
   * @route GET /api/intelligence/overages/systematic
   * @desc Detect systematic overages (more inventory than system shows)
   */
  router.get('/overages/systematic', async (req, res) => {
    try {
      const { days = 90 } = req.query;
      const results = await detectSystematicOverages(prisma, parseInt(days));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Detection failed' });
    }
  });

  /**
   * @route GET /api/intelligence/duplicates
   * @desc Find duplicate transactions
   */
  router.get('/duplicates', async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const results = await detectDuplicateTransactions(prisma, parseInt(days));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Detection failed' });
    }
  });

  // ==========================================
  // FWRD LICENSE PLATE FRAGMENTATION DETECTION
  // ==========================================

  /**
   * @route GET /api/intelligence/orders/fwrd/fragmentation
   * @desc Detect FWRD locations with multiple LPs for same SKU
   *
   * This detects the specific issue where:
   * - FWRD reserve locations have multiple license plates
   * - All plates contain the SAME item/SKU
   * - System treats each LP independently for BOH reduction
   * - Results in inventory discrepancies (typically overages)
   *
   * NOTE: MPP locations with different items are NOT flagged
   */
  router.get('/fwrd/fragmentation', async (req, res) => {
    try {
      const {
        locationTypes = 'FWRD,RESERVE',  // Types to check
        minPlates = 2,                    // Minimum plates to flag
        includeFinancialImpact = true
      } = req.query;

      const results = await detectFWRDFragmentation(
        prisma,
        locationTypes.split(','),
        parseInt(minPlates),
        includeFinancialImpact === 'true' || includeFinancialImpact === true
      );
      res.json(results);
    } catch (error) {
      console.error('FWRD fragmentation detection error:', error);
      res.status(500).json({ error: 'Detection failed', details: error.message });
    }
  });

  /**
   * @route GET /api/intelligence/orders/fwrd/summary
   * @desc Get summary of FWRD fragmentation issues by location
   */
  router.get('/fwrd/summary', async (req, res) => {
    try {
      const results = await getFWRDFragmentationSummary(prisma);
      res.json(results);
    } catch (error) {
      console.error('FWRD summary error:', error);
      res.status(500).json({ error: 'Summary failed', details: error.message });
    }
  });

  /**
   * @route POST /api/intelligence/orders/fwrd/merge-recommendations
   * @desc Get LP merge recommendations for specific locations
   */
  router.post('/fwrd/merge-recommendations', async (req, res) => {
    try {
      const { locationCodes } = req.body;
      const results = await getLPMergeRecommendations(prisma, locationCodes);
      res.json(results);
    } catch (error) {
      console.error('Merge recommendations error:', error);
      res.status(500).json({ error: 'Recommendations failed', details: error.message });
    }
  });

  // ==========================================
  // PARAMETER MISMATCH / SYSTEMATIC OVERAGE DETECTION
  // ==========================================

  /**
   * @route GET /api/intelligence/orders/parameter-mismatch
   * @desc Detect items where Target Order Min is not divisible by Shelf Pack
   *
   * This detects the specific systematic overage issue where:
   * - Target Order Minimum (e.g., 8) is not divisible by Shelf Pack (e.g., 3)
   * - Forces rounding up: 8 ÷ 3 = 2.67 → 3 shelf packs = 9 units
   * - Creates systematic 1-unit overage per replenishment cycle
   * - Accumulates over time into significant inventory discrepancies
   *
   * Example: Item 451915 (CE MAX RED RELIEF SIZE .5Z)
   * - Target Order Min: 8, Shelf Pack: 3
   * - 8 ÷ 3 = 2.67 (not whole number) → rounds to 3 packs = 9 units
   * - Overage per cycle: 1 unit
   */
  router.get('/parameter-mismatch', async (req, res) => {
    try {
      const {
        includeFinancialImpact = true,
        includeRecommendations = true
      } = req.query;

      const results = await detectParameterMismatch(
        prisma,
        includeFinancialImpact === 'true' || includeFinancialImpact === true,
        includeRecommendations === 'true' || includeRecommendations === true
      );
      res.json(results);
    } catch (error) {
      console.error('Parameter mismatch detection error:', error);
      res.status(500).json({ error: 'Detection failed', details: error.message });
    }
  });

  /**
   * @route GET /api/intelligence/orders/parameter-mismatch/:sku
   * @desc Analyze a specific SKU for parameter mismatch issues
   */
  router.get('/parameter-mismatch/:sku', async (req, res) => {
    try {
      const { sku } = req.params;
      const results = await analyzeSkuParameters(prisma, sku);
      res.json(results);
    } catch (error) {
      console.error('SKU parameter analysis error:', error);
      res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
  });

  return router;
}

/**
 * Run comprehensive order integrity analysis
 */
export async function runOrderIntegrityAnalysis(prisma, analysisTypes, scope) {
  const results = {
    analysisId: `order-integrity-${Date.now()}`,
    timestamp: new Date().toISOString(),
    findings: [],
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      estimatedVarianceValue: 0
    }
  };

  const analyses = analysisTypes === 'all' ? [
    'doubleBOM',
    'orderAnomalies',
    'unpostedReceipts',
    'poDiscrepancies',
    'systematicOverages',
    'duplicateTransactions'
  ] : (Array.isArray(analysisTypes) ? analysisTypes : analysisTypes.split(','));

  // Run each analysis type
  for (const analysis of analyses) {
    let findings = [];

    switch (analysis) {
      case 'doubleBOM':
        findings = await detectDoubleBOMConsumption(prisma, scope.days || 30);
        break;
      case 'orderAnomalies':
        findings = await auditOrders(prisma, scope);
        break;
      case 'unpostedReceipts':
        findings = await detectUnpostedReceipts(prisma, scope.days || 30);
        break;
      case 'poDiscrepancies':
        findings = await detectPODiscrepancies(prisma, scope.days || 30);
        break;
      case 'systematicOverages':
        findings = await detectSystematicOverages(prisma, scope.days || 90);
        break;
      case 'duplicateTransactions':
        findings = await detectDuplicateTransactions(prisma, scope.days || 7);
        break;
    }

    if (findings.findings) {
      results.findings.push(...findings.findings);
    } else if (Array.isArray(findings)) {
      results.findings.push(...findings);
    }
  }

  // Create discrepancy records
  for (const finding of results.findings) {
    try {
      await prisma.discrepancy.create({
        data: {
          type: finding.type,
          severity: finding.severity,
          sku: finding.sku,
          locationCode: finding.locationCode,
          expectedQty: finding.expectedQty,
          actualQty: finding.actualQty,
          variance: finding.variance,
          variancePercent: finding.variancePercent,
          varianceValue: finding.varianceValue || 0,
          status: 'OPEN',
          description: finding.description,
          evidence: finding.evidence,
          rootCauseCategory: finding.rootCauseCategory,
          detectedAt: new Date()
        }
      });
      results.summary.totalIssues++;
      if (finding.severity === 'critical') results.summary.criticalIssues++;
      results.summary.estimatedVarianceValue += Math.abs(finding.varianceValue || 0);
    } catch (error) {
      // Skip duplicates
      if (!error.message?.includes('Unique constraint')) {
        console.error('Error creating discrepancy:', error.message);
      }
    }
  }

  return results;
}

/**
 * DETECT DOUBLE BOM CONSUMPTION
 *
 * Scenario: Order is processed, BOM explodes and consumes components.
 * System error causes BOM to consume twice but only one label prints.
 * Result: Inventory reduced twice for single pick.
 *
 * Detection: Look for orders where component consumption (transactions)
 * is 2x the order quantity but shipment confirms single fulfillment.
 */
async function detectDoubleBOMConsumption(prisma, days) {
  const findings = [];
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Find orders with suspicious consumption patterns
  const suspiciousOrders = await prisma.$queryRaw`
    WITH order_picks AS (
      SELECT
        t."externalTransactionId" as order_number,
        t.sku,
        SUM(ABS(t.quantity)) as total_picked,
        COUNT(*) as pick_count,
        MIN(t."transactionDate") as first_pick,
        MAX(t."transactionDate") as last_pick,
        array_agg(DISTINCT t.id) as transaction_ids
      FROM transaction_snapshots t
      WHERE t.type IN ('PICK', 'ISSUE', 'CONSUMPTION', 'BOM_CONSUMPTION')
        AND t."transactionDate" >= ${dateFrom}
        AND t."externalTransactionId" IS NOT NULL
      GROUP BY t."externalTransactionId", t.sku
    ),
    order_expected AS (
      -- This would join to order lines if available
      -- For now, identify where pick_count > 1 for same order/sku combination
      SELECT
        order_number,
        sku,
        total_picked,
        pick_count,
        first_pick,
        last_pick,
        transaction_ids,
        -- If picked multiple times within short window, likely duplicate
        EXTRACT(EPOCH FROM (last_pick - first_pick)) as pick_window_seconds
      FROM order_picks
      WHERE pick_count > 1
    )
    SELECT *
    FROM order_expected
    WHERE pick_count >= 2
      AND pick_window_seconds < 300  -- Within 5 minutes = suspicious
    ORDER BY total_picked DESC
    LIMIT 100
  `;

  for (const order of suspiciousOrders) {
    // Calculate if it looks like double consumption
    const expectedQty = Number(order.total_picked) / Number(order.pick_count);
    const actualConsumed = Number(order.total_picked);

    if (order.pick_count >= 2) {
      findings.push({
        type: ORDER_DISCREPANCY_TYPES.DOUBLE_BOM_CONSUMPTION,
        severity: SEVERITY.CRITICAL,
        sku: order.sku,
        orderNumber: order.order_number,
        expectedQty: expectedQty,
        actualQty: actualConsumed,
        variance: actualConsumed - expectedQty,
        variancePercent: ((actualConsumed - expectedQty) / expectedQty) * 100,
        description: `Possible double BOM consumption: Order ${order.order_number} picked ${order.sku} ${order.pick_count} times within ${Math.round(order.pick_window_seconds)}s. Total consumed: ${actualConsumed}, expected: ~${expectedQty}`,
        rootCauseCategory: 'SYSTEM_ERROR',
        evidence: {
          orderNumber: order.order_number,
          sku: order.sku,
          pickCount: Number(order.pick_count),
          totalPicked: actualConsumed,
          pickWindowSeconds: Number(order.pick_window_seconds),
          firstPick: order.first_pick,
          lastPick: order.last_pick,
          transactionIds: order.transaction_ids
        }
      });
    }
  }

  return { findings, count: findings.length };
}

/**
 * AUDIT ALL ORDERS FOR ANOMALIES
 *
 * Reviews every order to find:
 * - Picks that don't match order quantities
 * - Missing picks (order line not fulfilled)
 * - Over-picks (picked more than ordered)
 * - Wrong items picked
 */
async function auditOrders(prisma, options = {}) {
  const findings = [];
  const dateFrom = options.dateFrom ? new Date(options.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Find orders with quantity mismatches
  const orderAnomalies = await prisma.$queryRaw`
    WITH order_transactions AS (
      SELECT
        "externalTransactionId" as order_number,
        sku,
        SUM(CASE WHEN type IN ('PICK', 'ISSUE') THEN ABS(quantity) ELSE 0 END) as picked_qty,
        SUM(CASE WHEN type IN ('SHIP', 'SHIPMENT') THEN ABS(quantity) ELSE 0 END) as shipped_qty,
        COUNT(DISTINCT type) as transaction_types,
        array_agg(DISTINCT type) as types_used
      FROM transaction_snapshots
      WHERE "transactionDate" >= ${dateFrom}
        AND "externalTransactionId" IS NOT NULL
      GROUP BY "externalTransactionId", sku
    )
    SELECT
      order_number,
      sku,
      picked_qty,
      shipped_qty,
      (picked_qty - shipped_qty) as pick_ship_variance,
      transaction_types,
      types_used
    FROM order_transactions
    WHERE picked_qty != shipped_qty
      AND shipped_qty > 0
    ORDER BY ABS(picked_qty - shipped_qty) DESC
    LIMIT ${options.limit || 100}
  `;

  for (const order of orderAnomalies) {
    const variance = Number(order.pick_ship_variance);
    const severity = Math.abs(variance) > 10 ? SEVERITY.HIGH :
                     Math.abs(variance) > 1 ? SEVERITY.MEDIUM : SEVERITY.LOW;

    if (variance > 0) {
      // Picked more than shipped - inventory shrinkage source
      findings.push({
        type: ORDER_DISCREPANCY_TYPES.ORDER_OVERPICK,
        severity,
        sku: order.sku,
        orderNumber: order.order_number,
        expectedQty: Number(order.shipped_qty),
        actualQty: Number(order.picked_qty),
        variance,
        variancePercent: (variance / Number(order.shipped_qty)) * 100,
        description: `Order ${order.order_number}: Picked ${order.picked_qty} but only shipped ${order.shipped_qty} of ${order.sku}. ${variance} units unaccounted for.`,
        rootCauseCategory: 'PROCESS_ERROR',
        evidence: {
          orderNumber: order.order_number,
          pickedQty: Number(order.picked_qty),
          shippedQty: Number(order.shipped_qty),
          transactionTypes: order.types_used
        }
      });
    } else {
      // Shipped more than picked - possible double ship or bypass
      findings.push({
        type: ORDER_DISCREPANCY_TYPES.ORDER_UNDERPICK,
        severity: SEVERITY.HIGH,
        sku: order.sku,
        orderNumber: order.order_number,
        expectedQty: Number(order.shipped_qty),
        actualQty: Number(order.picked_qty),
        variance,
        variancePercent: (variance / Number(order.shipped_qty)) * 100,
        description: `Order ${order.order_number}: Shipped ${order.shipped_qty} but only picked ${order.picked_qty} of ${order.sku}. Process bypass detected.`,
        rootCauseCategory: 'PROCESS_BYPASS',
        evidence: {
          orderNumber: order.order_number,
          pickedQty: Number(order.picked_qty),
          shippedQty: Number(order.shipped_qty),
          transactionTypes: order.types_used
        }
      });
    }
  }

  return { findings, count: findings.length };
}

/**
 * DETECT UNPOSTED RECEIPTS
 *
 * Scenario: Items physically received (ASN/PO arrival),
 * but inventory never posted to system.
 * Result: Physical inventory > system inventory (overage on count)
 *
 * Detection: Find receiving transactions without corresponding
 * inventory increases, or ASNs marked received but no inventory movement.
 */
async function detectUnpostedReceipts(prisma, days) {
  const findings = [];
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Find receiving transactions without inventory impact
  const unpostedReceipts = await prisma.$queryRaw`
    WITH receipt_transactions AS (
      SELECT
        "externalTransactionId" as po_number,
        sku,
        SUM(quantity) as received_qty,
        MIN("transactionDate") as receipt_date,
        array_agg(DISTINCT "toLocation") as receipt_locations
      FROM transaction_snapshots
      WHERE type IN ('RECEIVE', 'RECEIPT', 'PO_RECEIPT', 'ASN_RECEIPT')
        AND "transactionDate" >= ${dateFrom}
      GROUP BY "externalTransactionId", sku
    ),
    inventory_movements AS (
      SELECT
        sku,
        "locationCode",
        SUM("quantityOnHand") as current_qty,
        MAX("snapshotDate") as last_snapshot
      FROM inventory_snapshots
      WHERE "snapshotDate" >= ${dateFrom}
      GROUP BY sku, "locationCode"
    ),
    putaway_transactions AS (
      SELECT
        sku,
        "toLocation",
        SUM(quantity) as putaway_qty
      FROM transaction_snapshots
      WHERE type IN ('PUTAWAY', 'PUT')
        AND "transactionDate" >= ${dateFrom}
      GROUP BY sku, "toLocation"
    )
    SELECT
      rt.po_number,
      rt.sku,
      rt.received_qty,
      rt.receipt_date,
      rt.receipt_locations,
      COALESCE(pt.putaway_qty, 0) as putaway_qty,
      (rt.received_qty - COALESCE(pt.putaway_qty, 0)) as unputaway_qty
    FROM receipt_transactions rt
    LEFT JOIN putaway_transactions pt ON rt.sku = pt.sku
    WHERE rt.received_qty > COALESCE(pt.putaway_qty, 0)
    ORDER BY (rt.received_qty - COALESCE(pt.putaway_qty, 0)) DESC
    LIMIT 100
  `;

  for (const receipt of unpostedReceipts) {
    const unpostedQty = Number(receipt.unputaway_qty);
    if (unpostedQty > 0) {
      findings.push({
        type: ORDER_DISCREPANCY_TYPES.RECEIPT_NOT_POSTED,
        severity: unpostedQty > 50 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
        sku: receipt.sku,
        poNumber: receipt.po_number,
        expectedQty: Number(receipt.received_qty),
        actualQty: Number(receipt.putaway_qty),
        variance: unpostedQty,
        variancePercent: (unpostedQty / Number(receipt.received_qty)) * 100,
        description: `PO ${receipt.po_number}: Received ${receipt.received_qty} of ${receipt.sku} but only ${receipt.putaway_qty} posted to inventory. ${unpostedQty} units not posted - will show as OVERAGE on next count.`,
        rootCauseCategory: 'RECEIPT_POSTING_FAILURE',
        evidence: {
          poNumber: receipt.po_number,
          receivedQty: Number(receipt.received_qty),
          putawayQty: Number(receipt.putaway_qty),
          unpostedQty,
          receiptDate: receipt.receipt_date,
          receiptLocations: receipt.receipt_locations
        }
      });
    }
  }

  return { findings, count: findings.length };
}

/**
 * DETECT PO DISCREPANCIES
 *
 * Scenario: PO says 100 units, but 95 received (short ship) or 105 received (over ship)
 * Without proper tracking, this causes inventory mismatches
 */
async function detectPODiscrepancies(prisma, days, threshold = 0) {
  const findings = [];
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // This would ideally compare against a PO table
  // For now, detect variance patterns in receipt transactions
  const poVariances = await prisma.$queryRaw`
    WITH po_receipts AS (
      SELECT
        "externalTransactionId" as po_number,
        sku,
        SUM(quantity) as total_received,
        COUNT(DISTINCT "transactionDate"::date) as receipt_days,
        MIN("transactionDate") as first_receipt,
        MAX("transactionDate") as last_receipt
      FROM transaction_snapshots
      WHERE type IN ('RECEIVE', 'RECEIPT', 'PO_RECEIPT')
        AND "transactionDate" >= ${dateFrom}
        AND "externalTransactionId" IS NOT NULL
      GROUP BY "externalTransactionId", sku
    ),
    -- Find POs with multiple receipt events (could indicate discrepancy resolution)
    multi_receipt_pos AS (
      SELECT *
      FROM po_receipts
      WHERE receipt_days > 1
    )
    SELECT
      po_number,
      sku,
      total_received,
      receipt_days,
      first_receipt,
      last_receipt
    FROM multi_receipt_pos
    ORDER BY receipt_days DESC, total_received DESC
    LIMIT 100
  `;

  for (const po of poVariances) {
    // Multiple receipt days for same PO/SKU suggests discrepancy resolution
    if (Number(po.receipt_days) > 1) {
      findings.push({
        type: ORDER_DISCREPANCY_TYPES.PO_QUANTITY_MISMATCH,
        severity: SEVERITY.MEDIUM,
        sku: po.sku,
        poNumber: po.po_number,
        variance: 0, // Would need PO data to calculate actual variance
        description: `PO ${po.po_number} for ${po.sku} received over ${po.receipt_days} days. Total: ${po.total_received}. Multiple receipts may indicate short ship correction.`,
        rootCauseCategory: 'VENDOR_ISSUE',
        evidence: {
          poNumber: po.po_number,
          totalReceived: Number(po.total_received),
          receiptDays: Number(po.receipt_days),
          firstReceipt: po.first_receipt,
          lastReceipt: po.last_receipt
        }
      });
    }
  }

  return { findings, count: findings.length };
}

/**
 * DETECT SYSTEMATIC OVERAGES
 *
 * Most warehouses have MORE inventory than the system shows.
 * This detects patterns that cause consistent positive variances:
 * - Receipts double-posted
 * - Returns not deducted from inventory
 * - Picks not processed but product put back
 */
async function detectSystematicOverages(prisma, days) {
  const findings = [];
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Find SKUs/locations with consistent positive variances (counted > system)
  const overagePatterns = await prisma.$queryRaw`
    WITH variance_history AS (
      SELECT
        sku,
        "locationCode",
        variance,
        "variancePercent",
        "countDate",
        CASE WHEN variance > 0 THEN 1 ELSE 0 END as is_overage
      FROM cycle_count_snapshots
      WHERE "countDate" >= ${dateFrom}
    ),
    overage_patterns AS (
      SELECT
        sku,
        "locationCode",
        COUNT(*) as count_events,
        SUM(is_overage) as overage_events,
        AVG(variance) as avg_variance,
        SUM(variance) as total_variance,
        AVG("variancePercent") as avg_variance_pct
      FROM variance_history
      GROUP BY sku, "locationCode"
      HAVING COUNT(*) >= 2
    )
    SELECT *
    FROM overage_patterns
    WHERE overage_events::float / count_events >= 0.7  -- 70%+ of counts are overages
      AND avg_variance > 0
    ORDER BY total_variance DESC
    LIMIT 100
  `;

  for (const pattern of overagePatterns) {
    const overageRate = (Number(pattern.overage_events) / Number(pattern.count_events)) * 100;

    findings.push({
      type: ORDER_DISCREPANCY_TYPES.SYSTEMATIC_OVERAGE,
      severity: Number(pattern.total_variance) > 100 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      sku: pattern.sku,
      locationCode: pattern.locationCode,
      expectedQty: 0, // System expectation
      actualQty: Number(pattern.avg_variance), // Average overage
      variance: Number(pattern.total_variance),
      variancePercent: Number(pattern.avg_variance_pct),
      description: `Systematic overage detected: ${pattern.sku} at ${pattern.locationCode} shows overage ${overageRate.toFixed(0)}% of the time (${pattern.overage_events}/${pattern.count_events} counts). Average overage: ${Number(pattern.avg_variance).toFixed(1)} units. INVESTIGATE: Receipt double-posting, returns not processed, or picks cancelled but not reversed.`,
      rootCauseCategory: 'SYSTEMATIC_PROCESS_ISSUE',
      evidence: {
        countEvents: Number(pattern.count_events),
        overageEvents: Number(pattern.overage_events),
        overageRate,
        avgVariance: Number(pattern.avg_variance),
        totalVariance: Number(pattern.total_variance),
        avgVariancePct: Number(pattern.avg_variance_pct),
        possibleCauses: [
          'Receipt double-posting',
          'Returns received but not deducted',
          'Cancelled picks with product put back',
          'Cycle count adjustments creating phantom inventory',
          'Vendor overship not returned'
        ]
      }
    });
  }

  return { findings, count: findings.length };
}

/**
 * DETECT DUPLICATE TRANSACTIONS
 *
 * Same transaction recorded multiple times due to:
 * - Label reprints triggering new picks
 * - System errors creating duplicate records
 * - Interface re-sends
 */
async function detectDuplicateTransactions(prisma, days) {
  const findings = [];
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const duplicates = await prisma.$queryRaw`
    WITH potential_duplicates AS (
      SELECT
        sku,
        "toLocation",
        "fromLocation",
        quantity,
        type,
        "externalTransactionId",
        "userId",
        DATE_TRUNC('minute', "transactionDate") as transaction_minute,
        COUNT(*) as occurrence_count,
        array_agg(id) as transaction_ids,
        array_agg("transactionDate") as timestamps
      FROM transaction_snapshots
      WHERE "transactionDate" >= ${dateFrom}
      GROUP BY
        sku,
        "toLocation",
        "fromLocation",
        quantity,
        type,
        "externalTransactionId",
        "userId",
        DATE_TRUNC('minute', "transactionDate")
      HAVING COUNT(*) > 1
    )
    SELECT *
    FROM potential_duplicates
    ORDER BY occurrence_count DESC, ABS(quantity) DESC
    LIMIT 100
  `;

  for (const dup of duplicates) {
    const inventoryImpact = Number(dup.quantity) * (Number(dup.occurrence_count) - 1);

    findings.push({
      type: ORDER_DISCREPANCY_TYPES.DUPLICATE_TRANSACTION,
      severity: Number(dup.occurrence_count) > 2 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
      sku: dup.sku,
      locationCode: dup.toLocation || dup.fromLocation,
      expectedQty: Number(dup.quantity),
      actualQty: Number(dup.quantity) * Number(dup.occurrence_count),
      variance: inventoryImpact,
      variancePercent: ((Number(dup.occurrence_count) - 1) / 1) * 100,
      description: `Duplicate transaction detected: ${dup.type} of ${dup.quantity} ${dup.sku} recorded ${dup.occurrence_count} times within same minute. Order: ${dup.externalTransactionId || 'N/A'}. Inventory impact: ${inventoryImpact} units.`,
      rootCauseCategory: 'SYSTEM_ERROR',
      evidence: {
        transactionType: dup.type,
        quantity: Number(dup.quantity),
        occurrenceCount: Number(dup.occurrence_count),
        transactionIds: dup.transaction_ids,
        timestamps: dup.timestamps,
        externalTransactionId: dup.externalTransactionId,
        userId: dup.userId,
        inventoryImpact
      }
    });
  }

  return { findings, count: findings.length };
}

// ==========================================
// FWRD LICENSE PLATE FRAGMENTATION DETECTION
// ==========================================

/**
 * Detect FWRD/Reserve locations with multiple license plates for the SAME SKU
 *
 * This is the core detection for the fragmentation issue:
 * - FWRD locations are reserve-type, so LPs don't merge
 * - When same SKU has multiple LPs in one location, BOH reduction
 *   runs against each LP independently
 * - This causes inventory discrepancies (usually overages)
 *
 * MPP locations with DIFFERENT items are NOT flagged - that's expected behavior
 *
 * @param {PrismaClient} prisma
 * @param {string[]} locationTypes - Location types to check (FWRD, RESERVE)
 * @param {number} minPlates - Minimum number of plates to flag (default 2)
 * @param {boolean} includeFinancialImpact - Calculate estimated $ impact
 */
async function detectFWRDFragmentation(prisma, locationTypes = ['FWRD', 'RESERVE'], minPlates = 2, includeFinancialImpact = true) {
  const findings = [];

  // Find locations with multiple LPs for SAME SKU
  // This is the key query - we're looking for:
  // - Same location code
  // - Same SKU
  // - Multiple different license plates
  const fragmentedLocations = await prisma.$queryRawUnsafe(`
    SELECT
      "locationCode",
      "locationType",
      sku,
      COUNT(DISTINCT "licensePlate") as plate_count,
      ARRAY_AGG(DISTINCT "licensePlate") as license_plates,
      SUM("quantityOnHand") as total_qty,
      ARRAY_AGG("quantityOnHand") as qty_per_plate,
      MAX("snapshotDate") as last_snapshot
    FROM inventory_snapshots
    WHERE
      "licensePlate" IS NOT NULL
      AND (
        "locationType" = ANY($1)
        OR "locationCode" LIKE 'FWRD%'
        OR "locationCode" LIKE 'FWD%'
      )
    GROUP BY "locationCode", "locationType", sku
    HAVING COUNT(DISTINCT "licensePlate") >= $2
    ORDER BY COUNT(DISTINCT "licensePlate") DESC, SUM("quantityOnHand") DESC
  `, locationTypes, minPlates);

  // If no LP data in inventory_snapshots, try to detect from rawData
  let results = fragmentedLocations;

  if (results.length === 0) {
    // Fallback: Check rawData JSON field for LP information
    results = await prisma.$queryRawUnsafe(`
      SELECT
        "locationCode",
        "locationType",
        sku,
        COUNT(*) as record_count,
        SUM("quantityOnHand") as total_qty,
        MAX("snapshotDate") as last_snapshot,
        jsonb_agg(DISTINCT "rawData"->>'licensePlate') FILTER (WHERE "rawData"->>'licensePlate' IS NOT NULL) as license_plates
      FROM inventory_snapshots
      WHERE
        "rawData"->>'licensePlate' IS NOT NULL
        AND (
          "locationType" = ANY($1)
          OR "locationCode" LIKE 'FWRD%'
          OR "locationCode" LIKE 'FWD%'
        )
      GROUP BY "locationCode", "locationType", sku
      HAVING COUNT(DISTINCT "rawData"->>'licensePlate') >= $2
      ORDER BY COUNT(*) DESC
    `, locationTypes, minPlates);
  }

  // Average cost per unit for financial impact (configurable)
  const AVG_UNIT_COST = 25.00;
  // Estimated error rate when BOH reduction hits fragmented LPs
  const FRAGMENTATION_ERROR_RATE = 0.15; // 15% of transactions cause issues

  for (const loc of results) {
    const plateCount = Number(loc.plate_count || loc.record_count || 0);
    const totalQty = Number(loc.total_qty || 0);
    const plates = loc.license_plates || [];

    // Calculate risk level based on plate count
    let severity = SEVERITY.MEDIUM;
    if (plateCount >= 4) {
      severity = SEVERITY.CRITICAL;
    } else if (plateCount >= 3) {
      severity = SEVERITY.HIGH;
    }

    // Estimate financial impact
    let financialImpact = null;
    if (includeFinancialImpact) {
      // Each fragmented LP increases risk of incorrect BOH reduction
      // More plates = more chances for system to reduce from wrong LP
      const estimatedErrorsPerMonth = totalQty * FRAGMENTATION_ERROR_RATE * (plateCount - 1);
      const monthlyImpact = estimatedErrorsPerMonth * AVG_UNIT_COST;
      const yearlyImpact = monthlyImpact * 12;

      financialImpact = {
        estimatedErrorsPerMonth: Math.round(estimatedErrorsPerMonth),
        monthlyImpact: Math.round(monthlyImpact * 100) / 100,
        yearlyImpact: Math.round(yearlyImpact * 100) / 100,
        assumptions: {
          avgUnitCost: AVG_UNIT_COST,
          errorRate: FRAGMENTATION_ERROR_RATE,
          calculation: 'totalQty * errorRate * (plateCount - 1) * avgCost'
        }
      };
    }

    findings.push({
      type: ORDER_DISCREPANCY_TYPES.FWRD_LP_FRAGMENTATION,
      severity,
      locationCode: loc.locationCode,
      locationType: loc.locationType || 'FWRD',
      sku: loc.sku,
      plateCount,
      licensePlates: plates,
      totalQuantity: totalQty,
      quantityPerPlate: loc.qty_per_plate || [],
      lastSnapshot: loc.last_snapshot,
      description: `FWRD location ${loc.locationCode} has ${plateCount} license plates for SKU ${loc.sku}. ` +
        `Total qty: ${totalQty}. Each LP treated independently for BOH reduction - HIGH RISK for inventory discrepancies.`,
      rootCauseCategory: 'LP_FRAGMENTATION',
      recommendation: `Merge ${plateCount} license plates into single LP to prevent BOH reduction errors. ` +
        `Plates to merge: ${plates.slice(0, 5).join(', ')}${plates.length > 5 ? '...' : ''}`,
      financialImpact,
      evidence: {
        locationCode: loc.locationCode,
        sku: loc.sku,
        plateCount,
        plates,
        totalQty,
        issueType: 'SAME_SKU_MULTIPLE_PLATES',
        systemBehavior: 'BOH reduction runs against each LP independently',
        expectedResult: 'Inventory discrepancies, typically overages on physical count'
      }
    });
  }

  // Calculate summary statistics
  const summary = {
    totalLocationsAffected: findings.length,
    totalPlatesFragmented: findings.reduce((sum, f) => sum + f.plateCount, 0),
    criticalLocations: findings.filter(f => f.severity === SEVERITY.CRITICAL).length,
    highRiskLocations: findings.filter(f => f.severity === SEVERITY.HIGH).length,
    estimatedYearlyImpact: includeFinancialImpact
      ? findings.reduce((sum, f) => sum + (f.financialImpact?.yearlyImpact || 0), 0)
      : null
  };

  return {
    findings,
    count: findings.length,
    summary,
    analysisNote: 'Only flagging locations where SAME SKU has multiple LPs. MPP with different items is expected behavior.'
  };
}

/**
 * Get summary of FWRD fragmentation issues grouped by location
 */
async function getFWRDFragmentationSummary(prisma) {
  // Get high-level stats
  const stats = await prisma.$queryRawUnsafe(`
    SELECT
      "locationType",
      COUNT(DISTINCT "locationCode") as location_count,
      COUNT(DISTINCT sku) as sku_count,
      SUM("quantityOnHand") as total_inventory
    FROM inventory_snapshots
    WHERE
      "locationType" = ANY($1)
      OR "locationCode" LIKE 'FWRD%'
      OR "locationCode" LIKE 'FWD%'
    GROUP BY "locationType"
  `, ['FWRD', 'RESERVE']);

  // Get fragmentation stats
  const fragmentation = await detectFWRDFragmentation(prisma, ['FWRD', 'RESERVE'], 2, true);

  return {
    locationStats: stats,
    fragmentation: fragmentation.summary,
    topIssues: fragmentation.findings.slice(0, 10),
    recommendations: [
      'Implement LP merge process for FWRD locations',
      'Consider system configuration change to auto-merge LPs in FWRD',
      'Validate Manhattan system handles this differently before migration',
      'Track BOH adjustments by location to quantify actual impact'
    ]
  };
}

/**
 * Get specific merge recommendations for given locations
 */
async function getLPMergeRecommendations(prisma, locationCodes = []) {
  const recommendations = [];

  for (const locationCode of locationCodes) {
    // Get all inventory records for this location
    const inventory = await prisma.inventorySnapshot.findMany({
      where: {
        locationCode,
        licensePlate: { not: null }
      },
      orderBy: [
        { sku: 'asc' },
        { quantityOnHand: 'desc' }
      ]
    });

    // Group by SKU
    const skuGroups = {};
    for (const inv of inventory) {
      if (!skuGroups[inv.sku]) {
        skuGroups[inv.sku] = [];
      }
      skuGroups[inv.sku].push(inv);
    }

    // Generate merge recommendations for SKUs with multiple LPs
    for (const [sku, records] of Object.entries(skuGroups)) {
      if (records.length >= 2) {
        const totalQty = records.reduce((sum, r) => sum + r.quantityOnHand, 0);
        const plates = records.map(r => r.licensePlate);

        // Recommend merging into the LP with highest quantity
        const targetLP = records[0].licensePlate;
        const sourceLPs = plates.slice(1);

        recommendations.push({
          locationCode,
          sku,
          action: 'MERGE_LICENSE_PLATES',
          targetLP,
          sourceLPs,
          totalQuantity: totalQty,
          plateCount: records.length,
          priority: records.length >= 4 ? 'CRITICAL' : records.length >= 3 ? 'HIGH' : 'MEDIUM',
          steps: [
            `Navigate to location ${locationCode}`,
            `Identify LP ${targetLP} (primary - ${records[0].quantityOnHand} units)`,
            `Merge inventory from LPs: ${sourceLPs.join(', ')}`,
            `Verify total quantity: ${totalQty} units`,
            `Update system to reflect single LP`
          ],
          estimatedTime: `${5 + (records.length * 2)} minutes`,
          note: 'Merging will prevent BOH reduction errors from LP fragmentation'
        });
      }
    }
  }

  return {
    recommendations,
    totalMergesNeeded: recommendations.length,
    estimatedTotalTime: recommendations.reduce((sum, r) => {
      const mins = parseInt(r.estimatedTime);
      return sum + (isNaN(mins) ? 10 : mins);
    }, 0) + ' minutes'
  };
}

// ==========================================
// PARAMETER MISMATCH DETECTION
// Detects when Target Order Min is not divisible by Shelf Pack
// ==========================================

/**
 * Detect items where Target Order Minimum is not divisible by Shelf Pack
 *
 * This creates systematic overages because:
 * - Target Order Min (e.g., 8) forces minimum replenishment quantity
 * - Shelf Pack (e.g., 3) is the physical picking unit
 * - If 8 ÷ 3 = 2.67 (not whole), system rounds UP to 3 packs = 9 units
 * - Creates 1-unit overage per replenishment cycle
 * - Accumulates into significant inventory discrepancies over time
 *
 * @param {PrismaClient} prisma
 * @param {boolean} includeFinancialImpact - Calculate estimated $ impact
 * @param {boolean} includeRecommendations - Include fix recommendations
 */
async function detectParameterMismatch(prisma, includeFinancialImpact = true, includeRecommendations = true) {
  const findings = [];

  // Get all items with parameter data
  const items = await prisma.itemParameter.findMany({
    where: {
      isActive: true,
      shelfPack: { gt: 0 },
      targetOrderMin: { not: null }
    }
  });

  for (const item of items) {
    const { sku, description, category, shelfPack, casePack, targetOrderMin, unitCost, demandData } = item;

    // Skip if targetOrderMin is null or 0
    if (!targetOrderMin || targetOrderMin === 0) continue;

    // Check divisibility: Target Order Min ÷ Shelf Pack
    const ratio = targetOrderMin / shelfPack;
    const isAligned = Number.isInteger(ratio);

    if (!isAligned) {
      // Calculate the rounding overage
      const roundedPacks = Math.ceil(ratio);
      const roundedUnits = roundedPacks * shelfPack;
      const overagePerCycle = roundedUnits - targetOrderMin;
      const roundingPercentage = ((roundedUnits - targetOrderMin) / targetOrderMin) * 100;

      // Determine severity based on overage amount and frequency potential
      let severity = SEVERITY.MEDIUM;
      if (roundingPercentage >= 20) {
        severity = SEVERITY.CRITICAL;
      } else if (roundingPercentage >= 10) {
        severity = SEVERITY.HIGH;
      }

      // Calculate financial impact
      let financialImpact = null;
      if (includeFinancialImpact) {
        const avgCost = unitCost || 25.00; // Default cost if not specified
        // Estimate replenishments per month based on demand data or default
        const replenishmentsPerMonth = demandData?.avgReplenishmentsPerMonth || 12;

        const monthlyOverageUnits = overagePerCycle * replenishmentsPerMonth;
        const monthlyImpact = monthlyOverageUnits * avgCost;
        const yearlyImpact = monthlyImpact * 12;

        financialImpact = {
          overagePerCycle,
          replenishmentsPerMonth,
          monthlyOverageUnits,
          monthlyImpact: Math.round(monthlyImpact * 100) / 100,
          yearlyImpact: Math.round(yearlyImpact * 100) / 100,
          assumptions: {
            unitCost: avgCost,
            replenishmentsPerMonth,
            calculation: 'overagePerCycle * replenishmentsPerMonth * 12 * unitCost'
          }
        };
      }

      // Generate recommendations
      let recommendations = null;
      if (includeRecommendations) {
        // Find the nearest shelf pack multiples
        const lowerMultiple = Math.floor(ratio) * shelfPack;
        const upperMultiple = roundedPacks * shelfPack;

        recommendations = {
          primary: {
            action: `Change Target Order Min from ${targetOrderMin} to ${upperMultiple}`,
            rationale: `${upperMultiple} ÷ ${shelfPack} = ${roundedPacks} shelf packs exactly`,
            impact: 'Eliminates rounding overage, minimal operational change (+${overagePerCycle} units)',
            risk: 'Low'
          },
          alternative: lowerMultiple > 0 ? {
            action: `Change Target Order Min from ${targetOrderMin} to ${lowerMultiple}`,
            rationale: `${lowerMultiple} ÷ ${shelfPack} = ${Math.floor(ratio)} shelf packs exactly`,
            impact: 'Reduces minimum quantity, may increase replenishment frequency',
            risk: 'Low-Medium'
          } : null,
          otherOptions: [
            {
              action: `Change Shelf Pack from ${shelfPack} to a factor of ${targetOrderMin}`,
              rationale: `Requires vendor repackaging - complex and costly`,
              risk: 'High - not recommended'
            }
          ]
        };
      }

      findings.push({
        type: ORDER_DISCREPANCY_TYPES.PARAMETER_MISMATCH_OVERAGE,
        severity,
        sku,
        description: description || 'Unknown Item',
        category: category || 'Unknown',
        parameters: {
          targetOrderMin,
          shelfPack,
          casePack: casePack || null,
          ratio: Math.round(ratio * 100) / 100,
          isAligned: false
        },
        issue: {
          calculation: `${targetOrderMin} ÷ ${shelfPack} = ${ratio.toFixed(2)} (not a whole number)`,
          roundedTo: `${roundedPacks} shelf packs = ${roundedUnits} units`,
          overagePerCycle,
          roundingPercentage: Math.round(roundingPercentage * 10) / 10
        },
        rootCause: 'Target Order Minimum is not divisible by Shelf Pack, forcing systematic rounding overage',
        mechanism: 'When replenishment triggers at minimum quantity, system rounds up to next whole shelf pack, creating overage each cycle',
        financialImpact,
        recommendations,
        evidence: {
          targetOrderMin,
          shelfPack,
          divisionResult: ratio,
          roundedPacks,
          roundedUnits,
          overagePerCycle,
          isSystematic: true,
          accumulates: true
        }
      });
    }
  }

  // Sort by severity and financial impact
  findings.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aSev = severityOrder[a.severity] || 3;
    const bSev = severityOrder[b.severity] || 3;
    if (aSev !== bSev) return aSev - bSev;
    return (b.financialImpact?.yearlyImpact || 0) - (a.financialImpact?.yearlyImpact || 0);
  });

  // Calculate summary
  const summary = {
    totalItemsAffected: findings.length,
    criticalItems: findings.filter(f => f.severity === SEVERITY.CRITICAL).length,
    highRiskItems: findings.filter(f => f.severity === SEVERITY.HIGH).length,
    totalYearlyOverageUnits: includeFinancialImpact
      ? findings.reduce((sum, f) => sum + (f.financialImpact?.monthlyOverageUnits || 0) * 12, 0)
      : null,
    estimatedYearlyImpact: includeFinancialImpact
      ? findings.reduce((sum, f) => sum + (f.financialImpact?.yearlyImpact || 0), 0)
      : null
  };

  return {
    findings,
    count: findings.length,
    summary,
    analysisNote: 'Detecting items where Target Order Min is not divisible by Shelf Pack. This causes systematic rounding overages during replenishment.'
  };
}

/**
 * Analyze a specific SKU for parameter mismatch issues
 * Provides detailed analysis similar to the report format
 */
async function analyzeSkuParameters(prisma, sku) {
  // Get item parameters
  const item = await prisma.itemParameter.findUnique({
    where: { sku }
  });

  if (!item) {
    return {
      sku,
      found: false,
      message: 'Item not found in parameter database'
    };
  }

  const { description, category, shelfPack, casePack, innerPack, palletQty, targetOrderMin, maxStoreOrder, unitCost, demandData } = item;

  // Parameter alignment check
  const parameterCheck = {
    targetOrderMin: targetOrderMin ? {
      value: targetOrderMin,
      divisibleByShelfPack: shelfPack ? Number.isInteger(targetOrderMin / shelfPack) : null,
      shelfPacksNeeded: shelfPack ? (targetOrderMin / shelfPack).toFixed(2) : null
    } : null,
    shelfPack: { value: shelfPack, baseUnit: true },
    casePack: casePack ? {
      value: casePack,
      divisibleByShelfPack: shelfPack ? Number.isInteger(casePack / shelfPack) : null,
      shelfPacksPerCase: shelfPack ? (casePack / shelfPack).toFixed(2) : null
    } : null,
    maxStoreOrder: maxStoreOrder ? {
      value: maxStoreOrder,
      divisibleByCasePack: casePack ? Number.isInteger(maxStoreOrder / casePack) : null,
      casesNeeded: casePack ? (maxStoreOrder / casePack).toFixed(2) : null
    } : null
  };

  // Identify the issue
  let hasIssue = false;
  let issueDetails = null;

  if (targetOrderMin && shelfPack && !Number.isInteger(targetOrderMin / shelfPack)) {
    hasIssue = true;
    const ratio = targetOrderMin / shelfPack;
    const roundedPacks = Math.ceil(ratio);
    const roundedUnits = roundedPacks * shelfPack;
    const overage = roundedUnits - targetOrderMin;

    issueDetails = {
      problem: 'Target Order Minimum not divisible by Shelf Pack',
      calculation: `${targetOrderMin} ÷ ${shelfPack} = ${ratio.toFixed(2)}`,
      systemBehavior: `System rounds up to ${roundedPacks} shelf packs = ${roundedUnits} units`,
      overagePerCycle: overage,
      mechanism: 'Each replenishment cycle creates a systematic overage that accumulates over time',
      solutions: [
        {
          option: 1,
          change: `Target Order Min: ${targetOrderMin} → ${roundedUnits}`,
          result: `${roundedUnits} ÷ ${shelfPack} = ${roundedPacks} shelf packs exactly`,
          risk: 'Low - increases minimum by only ${overage} unit(s)'
        },
        {
          option: 2,
          change: `Target Order Min: ${targetOrderMin} → ${Math.floor(ratio) * shelfPack}`,
          result: `${Math.floor(ratio) * shelfPack} ÷ ${shelfPack} = ${Math.floor(ratio)} shelf packs exactly`,
          risk: 'Low-Medium - reduces minimum, may increase replenishment frequency'
        }
      ]
    };
  }

  return {
    sku,
    found: true,
    description,
    category,
    parameters: {
      shelfPack,
      casePack,
      innerPack,
      palletQty,
      targetOrderMin,
      maxStoreOrder,
      unitCost
    },
    parameterCheck,
    hasIssue,
    issueDetails,
    demandData: demandData || null,
    recommendation: hasIssue
      ? `Change Target Order Min from ${targetOrderMin} to ${Math.ceil(targetOrderMin / shelfPack) * shelfPack} to eliminate systematic overage`
      : 'No parameter mismatch detected'
  };
}

export {
  detectDoubleBOMConsumption,
  auditOrders,
  detectUnpostedReceipts,
  detectPODiscrepancies,
  detectSystematicOverages,
  detectDuplicateTransactions,
  detectFWRDFragmentation,
  getFWRDFragmentationSummary,
  getLPMergeRecommendations,
  detectParameterMismatch,
  analyzeSkuParameters
};
