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
  ORPHAN_TRANSACTION: 'orphan_transaction'
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

export {
  detectDoubleBOMConsumption,
  auditOrders,
  detectUnpostedReceipts,
  detectPODiscrepancies,
  detectSystematicOverages,
  detectDuplicateTransactions
};
