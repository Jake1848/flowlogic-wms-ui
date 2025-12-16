/**
 * FlowLogic Inventory Truth Engine
 *
 * Core intelligence module that:
 * - Reconciles inventory snapshots vs transaction history
 * - Detects drift and anomalies
 * - Identifies where inventory "goes missing"
 * - Understands timing and locality of discrepancies
 *
 * This is the core IP - the "why is inventory wrong?" engine
 */

/**
 * Discrepancy types that the engine can identify
 */
const DISCREPANCY_TYPES = {
  NEGATIVE_ON_HAND: 'negative_on_hand',
  UNEXPLAINED_SHORTAGE: 'unexplained_shortage',
  UNEXPLAINED_OVERAGE: 'unexplained_overage',
  PHANTOM_INVENTORY: 'phantom_inventory',
  MIS_SLOT: 'mis_slot',
  TRANSACTION_GAP: 'transaction_gap',
  CYCLE_COUNT_VARIANCE: 'cycle_count_variance',
  ADJUSTMENT_SPIKE: 'adjustment_spike',
  DRIFT_DETECTED: 'drift_detected'
};

/**
 * Severity levels for discrepancies
 */
const SEVERITY = {
  CRITICAL: 'critical',   // Negative inventory, major variance
  HIGH: 'high',           // Significant unexplained variance
  MEDIUM: 'medium',       // Moderate variance requiring investigation
  LOW: 'low'              // Minor variance, monitor
};

/**
 * Create Inventory Truth Engine routes and services
 */
export function createInventoryTruthRoutes(prisma) {
  const express = require('express');
  const router = express.Router();

  /**
   * @route GET /api/truth/dashboard
   * @desc Get inventory truth dashboard summary
   */
  router.get('/dashboard', async (req, res) => {
    try {
      const { warehouseId, dateFrom, dateTo } = req.query;

      const summary = await getInventoryTruthSummary(prisma, { warehouseId, dateFrom, dateTo });
      res.json(summary);
    } catch (error) {
      console.error('Truth dashboard error:', error);
      res.status(500).json({ error: 'Failed to generate dashboard' });
    }
  });

  /**
   * @route GET /api/truth/discrepancies
   * @desc Get all detected discrepancies
   */
  router.get('/discrepancies', async (req, res) => {
    try {
      const {
        type,
        severity,
        status = 'OPEN',
        limit = 100,
        offset = 0,
        sortBy = 'severity',
        sortOrder = 'desc'
      } = req.query;

      const where = {};
      if (type) where.type = type;
      if (severity) where.severity = severity;
      if (status) where.status = status;

      const discrepancies = await prisma.discrepancy.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          investigations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      const total = await prisma.discrepancy.count({ where });

      res.json({
        discrepancies,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch discrepancies' });
    }
  });

  /**
   * @route POST /api/truth/analyze
   * @desc Run inventory truth analysis
   */
  router.post('/analyze', async (req, res) => {
    try {
      const { analysisType = 'full', scope = {} } = req.body;

      const analysis = await runInventoryAnalysis(prisma, analysisType, scope);
      res.json(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
  });

  /**
   * @route GET /api/truth/reconciliation
   * @desc Get snapshot vs transaction reconciliation
   */
  router.get('/reconciliation', async (req, res) => {
    try {
      const { snapshotId, compareToSnapshotId } = req.query;

      if (!snapshotId) {
        return res.status(400).json({ error: 'snapshotId required' });
      }

      const reconciliation = await reconcileSnapshots(prisma, snapshotId, compareToSnapshotId);
      res.json(reconciliation);
    } catch (error) {
      res.status(500).json({ error: 'Reconciliation failed' });
    }
  });

  /**
   * @route GET /api/truth/drift
   * @desc Analyze inventory drift over time
   */
  router.get('/drift', async (req, res) => {
    try {
      const { sku, locationCode, days = 30 } = req.query;

      const drift = await analyzeDrift(prisma, { sku, locationCode, days: parseInt(days) });
      res.json(drift);
    } catch (error) {
      res.status(500).json({ error: 'Drift analysis failed' });
    }
  });

  /**
   * @route GET /api/truth/hotspots
   * @desc Get problem hotspots (locations/SKUs with most issues)
   */
  router.get('/hotspots', async (req, res) => {
    try {
      const { type = 'location', limit = 20, days = 30 } = req.query;

      const hotspots = await getHotspots(prisma, type, parseInt(limit), parseInt(days));
      res.json(hotspots);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get hotspots' });
    }
  });

  return router;
}

/**
 * Get inventory truth summary for dashboard
 */
async function getInventoryTruthSummary(prisma, filters = {}) {
  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

  // Get discrepancy counts by type and severity
  const discrepancyCounts = await prisma.$queryRaw`
    SELECT
      type,
      severity,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_count
    FROM discrepancies
    WHERE "createdAt" BETWEEN ${dateFrom} AND ${dateTo}
    GROUP BY type, severity
  `;

  // Calculate overall accuracy score
  const accuracyData = await prisma.$queryRaw`
    SELECT
      COUNT(*) as total_locations,
      SUM(CASE WHEN variance_percent <= 1 THEN 1 ELSE 0 END) as accurate_count,
      AVG(ABS(variance_percent)) as avg_variance
    FROM (
      SELECT
        "locationCode",
        SUM("countedQty" - "systemQty") as variance,
        CASE WHEN SUM("systemQty") != 0
          THEN (SUM("countedQty" - "systemQty") / SUM("systemQty")) * 100
          ELSE 0
        END as variance_percent
      FROM cycle_count_snapshots
      WHERE "countDate" BETWEEN ${dateFrom} AND ${dateTo}
      GROUP BY "locationCode"
    ) as location_accuracy
  `;

  // Get adjustment trends
  const adjustmentTrends = await prisma.$queryRaw`
    SELECT
      DATE("adjustmentDate") as date,
      SUM(CASE WHEN "adjustmentQty" > 0 THEN "adjustmentQty" ELSE 0 END) as positive_adjustments,
      SUM(CASE WHEN "adjustmentQty" < 0 THEN ABS("adjustmentQty") ELSE 0 END) as negative_adjustments,
      COUNT(*) as adjustment_count
    FROM adjustment_snapshots
    WHERE "adjustmentDate" BETWEEN ${dateFrom} AND ${dateTo}
    GROUP BY DATE("adjustmentDate")
    ORDER BY date DESC
    LIMIT 30
  `;

  // Get top problem areas
  const topProblemLocations = await prisma.$queryRaw`
    SELECT
      "locationCode",
      COUNT(*) as issue_count,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
      array_agg(DISTINCT type) as issue_types
    FROM discrepancies
    WHERE status = 'OPEN'
    GROUP BY "locationCode"
    ORDER BY critical_count DESC, issue_count DESC
    LIMIT 10
  `;

  const topProblemSKUs = await prisma.$queryRaw`
    SELECT
      sku,
      COUNT(*) as issue_count,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
      SUM(ABS("varianceValue")) as total_variance_value
    FROM discrepancies
    WHERE status = 'OPEN'
    GROUP BY sku
    ORDER BY total_variance_value DESC, issue_count DESC
    LIMIT 10
  `;

  const accuracy = accuracyData[0];
  const accuracyScore = accuracy?.total_locations > 0
    ? (Number(accuracy.accurate_count) / Number(accuracy.total_locations)) * 100
    : 0;

  return {
    summary: {
      accuracyScore: Math.round(accuracyScore * 10) / 10,
      avgVariancePercent: Math.round(Number(accuracy?.avg_variance || 0) * 100) / 100,
      openDiscrepancies: discrepancyCounts.reduce((sum, d) => sum + Number(d.open_count), 0),
      criticalIssues: discrepancyCounts.filter(d => d.severity === 'critical').reduce((sum, d) => sum + Number(d.open_count), 0)
    },
    discrepancyBreakdown: discrepancyCounts.map(d => ({
      type: d.type,
      severity: d.severity,
      count: Number(d.count),
      openCount: Number(d.open_count)
    })),
    adjustmentTrends: adjustmentTrends.map(t => ({
      date: t.date,
      positiveAdjustments: Number(t.positive_adjustments),
      negativeAdjustments: Number(t.negative_adjustments),
      count: Number(t.adjustment_count)
    })),
    hotspots: {
      locations: topProblemLocations.map(l => ({
        locationCode: l.locationCode,
        issueCount: Number(l.issue_count),
        criticalCount: Number(l.critical_count),
        issueTypes: l.issue_types
      })),
      skus: topProblemSKUs.map(s => ({
        sku: s.sku,
        issueCount: Number(s.issue_count),
        criticalCount: Number(s.critical_count),
        totalVarianceValue: Number(s.total_variance_value)
      }))
    }
  };
}

/**
 * Run comprehensive inventory analysis
 */
async function runInventoryAnalysis(prisma, analysisType, scope) {
  const results = {
    analysisId: `analysis-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: analysisType,
    findings: [],
    discrepanciesCreated: 0
  };

  // 1. Detect negative on-hand
  const negativeOnHand = await detectNegativeOnHand(prisma, scope);
  results.findings.push(...negativeOnHand);

  // 2. Detect transaction gaps (movements without matching transactions)
  const transactionGaps = await detectTransactionGaps(prisma, scope);
  results.findings.push(...transactionGaps);

  // 3. Detect unexplained variances from cycle counts
  const cycleCountVariances = await detectCycleCountVariances(prisma, scope);
  results.findings.push(...cycleCountVariances);

  // 4. Detect adjustment spikes (unusual adjustment patterns)
  const adjustmentSpikes = await detectAdjustmentSpikes(prisma, scope);
  results.findings.push(...adjustmentSpikes);

  // 5. Detect drift (gradual unexplained changes)
  const driftIssues = await detectDrift(prisma, scope);
  results.findings.push(...driftIssues);

  // Create discrepancy records for each finding
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
          detectedAt: new Date()
        }
      });
      results.discrepanciesCreated++;
    } catch (error) {
      // Skip duplicate discrepancies
      if (!error.message.includes('Unique constraint')) {
        console.error('Error creating discrepancy:', error);
      }
    }
  }

  return results;
}

/**
 * Detect negative on-hand inventory
 */
async function detectNegativeOnHand(prisma, scope) {
  const findings = [];

  const negatives = await prisma.$queryRaw`
    SELECT
      i.sku,
      i."locationCode",
      i."quantityOnHand",
      p.name as product_name,
      p.cost as unit_cost
    FROM inventory_snapshots i
    LEFT JOIN products p ON i.sku = p.sku
    WHERE i."quantityOnHand" < 0
    ORDER BY i."quantityOnHand" ASC
  `;

  for (const item of negatives) {
    findings.push({
      type: DISCREPANCY_TYPES.NEGATIVE_ON_HAND,
      severity: SEVERITY.CRITICAL,
      sku: item.sku,
      locationCode: item.locationCode,
      expectedQty: 0,
      actualQty: Number(item.quantityOnHand),
      variance: Number(item.quantityOnHand),
      variancePercent: -100,
      varianceValue: Math.abs(Number(item.quantityOnHand)) * (Number(item.unit_cost) || 0),
      description: `Negative on-hand quantity (${item.quantityOnHand}) for ${item.sku} at ${item.locationCode}`,
      evidence: {
        productName: item.product_name,
        currentQty: Number(item.quantityOnHand),
        unitCost: Number(item.unit_cost) || 0
      }
    });
  }

  return findings;
}

/**
 * Detect transaction gaps
 */
async function detectTransactionGaps(prisma, scope) {
  const findings = [];

  // Find inventory changes without corresponding transactions
  const gaps = await prisma.$queryRaw`
    WITH snapshot_changes AS (
      SELECT
        sku,
        "locationCode",
        "quantityOnHand" as current_qty,
        LAG("quantityOnHand") OVER (PARTITION BY sku, "locationCode" ORDER BY "snapshotDate") as prev_qty,
        "snapshotDate"
      FROM inventory_snapshots
    ),
    transaction_totals AS (
      SELECT
        sku,
        COALESCE("toLocation", "fromLocation") as location,
        SUM(CASE WHEN "toLocation" IS NOT NULL THEN quantity ELSE -quantity END) as net_change,
        MIN("transactionDate") as from_date,
        MAX("transactionDate") as to_date
      FROM transaction_snapshots
      GROUP BY sku, COALESCE("toLocation", "fromLocation")
    )
    SELECT
      sc.sku,
      sc."locationCode",
      sc.current_qty,
      sc.prev_qty,
      (sc.current_qty - sc.prev_qty) as snapshot_change,
      COALESCE(tt.net_change, 0) as transaction_change,
      (sc.current_qty - sc.prev_qty) - COALESCE(tt.net_change, 0) as gap
    FROM snapshot_changes sc
    LEFT JOIN transaction_totals tt ON sc.sku = tt.sku AND sc."locationCode" = tt.location
    WHERE sc.prev_qty IS NOT NULL
      AND ABS((sc.current_qty - sc.prev_qty) - COALESCE(tt.net_change, 0)) > 1
    ORDER BY ABS((sc.current_qty - sc.prev_qty) - COALESCE(tt.net_change, 0)) DESC
    LIMIT 50
  `;

  for (const gap of gaps) {
    const variance = Number(gap.gap);
    const severity = Math.abs(variance) > 100 ? SEVERITY.HIGH :
                     Math.abs(variance) > 10 ? SEVERITY.MEDIUM : SEVERITY.LOW;

    findings.push({
      type: DISCREPANCY_TYPES.TRANSACTION_GAP,
      severity,
      sku: gap.sku,
      locationCode: gap.locationCode,
      expectedQty: Number(gap.transaction_change),
      actualQty: Number(gap.snapshot_change),
      variance,
      variancePercent: gap.prev_qty !== 0 ? (variance / Number(gap.prev_qty)) * 100 : 0,
      description: `Inventory change (${gap.snapshot_change}) doesn't match transaction total (${gap.transaction_change})`,
      evidence: {
        previousQty: Number(gap.prev_qty),
        currentQty: Number(gap.current_qty),
        snapshotChange: Number(gap.snapshot_change),
        transactionChange: Number(gap.transaction_change),
        unexplainedGap: variance
      }
    });
  }

  return findings;
}

/**
 * Detect cycle count variances
 */
async function detectCycleCountVariances(prisma, scope) {
  const findings = [];

  const variances = await prisma.$queryRaw`
    SELECT
      sku,
      "locationCode",
      "systemQty",
      "countedQty",
      variance,
      "variancePercent",
      "counterId",
      "countDate"
    FROM cycle_count_snapshots
    WHERE ABS("variancePercent") > 5
      OR ABS(variance) > 10
    ORDER BY ABS(variance) DESC
    LIMIT 100
  `;

  for (const v of variances) {
    const severity = Math.abs(Number(v.variancePercent)) > 20 || Math.abs(Number(v.variance)) > 50
      ? SEVERITY.HIGH
      : Math.abs(Number(v.variancePercent)) > 10 || Math.abs(Number(v.variance)) > 20
      ? SEVERITY.MEDIUM
      : SEVERITY.LOW;

    findings.push({
      type: DISCREPANCY_TYPES.CYCLE_COUNT_VARIANCE,
      severity,
      sku: v.sku,
      locationCode: v.locationCode,
      expectedQty: Number(v.systemQty),
      actualQty: Number(v.countedQty),
      variance: Number(v.variance),
      variancePercent: Number(v.variancePercent),
      description: `Cycle count variance: system showed ${v.systemQty}, counted ${v.countedQty} (${v.variancePercent?.toFixed(1)}%)`,
      evidence: {
        systemQty: Number(v.systemQty),
        countedQty: Number(v.countedQty),
        counterId: v.counterId,
        countDate: v.countDate
      }
    });
  }

  return findings;
}

/**
 * Detect adjustment spikes (unusual patterns)
 */
async function detectAdjustmentSpikes(prisma, scope) {
  const findings = [];

  // Find locations/SKUs with abnormally high adjustment frequency or volume
  const spikes = await prisma.$queryRaw`
    WITH daily_adjustments AS (
      SELECT
        sku,
        "locationCode",
        DATE("adjustmentDate") as adj_date,
        SUM(ABS("adjustmentQty")) as daily_volume,
        COUNT(*) as daily_count,
        array_agg(DISTINCT reason) as reasons
      FROM adjustment_snapshots
      WHERE "adjustmentDate" > NOW() - INTERVAL '30 days'
      GROUP BY sku, "locationCode", DATE("adjustmentDate")
    ),
    avg_adjustments AS (
      SELECT
        sku,
        "locationCode",
        AVG(daily_volume) as avg_volume,
        AVG(daily_count) as avg_count,
        STDDEV(daily_volume) as stddev_volume
      FROM daily_adjustments
      GROUP BY sku, "locationCode"
    )
    SELECT
      da.sku,
      da."locationCode",
      da.adj_date,
      da.daily_volume,
      da.daily_count,
      da.reasons,
      aa.avg_volume,
      aa.stddev_volume,
      (da.daily_volume - aa.avg_volume) / NULLIF(aa.stddev_volume, 0) as z_score
    FROM daily_adjustments da
    JOIN avg_adjustments aa ON da.sku = aa.sku AND da."locationCode" = aa."locationCode"
    WHERE (da.daily_volume - aa.avg_volume) / NULLIF(aa.stddev_volume, 0) > 2
      OR da.daily_count > 5
    ORDER BY z_score DESC NULLS LAST
    LIMIT 50
  `;

  for (const spike of spikes) {
    findings.push({
      type: DISCREPANCY_TYPES.ADJUSTMENT_SPIKE,
      severity: Number(spike.z_score) > 3 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      sku: spike.sku,
      locationCode: spike.locationCode,
      expectedQty: Number(spike.avg_volume) || 0,
      actualQty: Number(spike.daily_volume),
      variance: Number(spike.daily_volume) - Number(spike.avg_volume || 0),
      variancePercent: spike.avg_volume ? ((Number(spike.daily_volume) - Number(spike.avg_volume)) / Number(spike.avg_volume)) * 100 : 0,
      description: `Unusual adjustment activity: ${spike.daily_volume} units adjusted on ${spike.adj_date} (${spike.z_score?.toFixed(1)}σ above average)`,
      evidence: {
        date: spike.adj_date,
        dailyVolume: Number(spike.daily_volume),
        dailyCount: Number(spike.daily_count),
        averageVolume: Number(spike.avg_volume),
        zScore: Number(spike.z_score),
        reasons: spike.reasons
      }
    });
  }

  return findings;
}

/**
 * Detect inventory drift
 */
async function detectDrift(prisma, scope) {
  const findings = [];

  // Detect gradual unexplained changes over time
  const drift = await prisma.$queryRaw`
    WITH daily_inventory AS (
      SELECT
        sku,
        "locationCode",
        DATE("snapshotDate") as snap_date,
        AVG("quantityOnHand") as avg_qty
      FROM inventory_snapshots
      WHERE "snapshotDate" > NOW() - INTERVAL '30 days'
      GROUP BY sku, "locationCode", DATE("snapshotDate")
    ),
    drift_calc AS (
      SELECT
        sku,
        "locationCode",
        FIRST_VALUE(avg_qty) OVER (PARTITION BY sku, "locationCode" ORDER BY snap_date) as start_qty,
        LAST_VALUE(avg_qty) OVER (PARTITION BY sku, "locationCode" ORDER BY snap_date
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as end_qty,
        COUNT(*) OVER (PARTITION BY sku, "locationCode") as data_points
      FROM daily_inventory
    )
    SELECT DISTINCT
      sku,
      "locationCode",
      start_qty,
      end_qty,
      (end_qty - start_qty) as absolute_drift,
      CASE WHEN start_qty != 0 THEN ((end_qty - start_qty) / start_qty) * 100 ELSE 0 END as percent_drift,
      data_points
    FROM drift_calc
    WHERE data_points >= 7
      AND ABS(end_qty - start_qty) > 5
      AND ABS(CASE WHEN start_qty != 0 THEN ((end_qty - start_qty) / start_qty) * 100 ELSE 0 END) > 5
    ORDER BY ABS(end_qty - start_qty) DESC
    LIMIT 50
  `;

  for (const d of drift) {
    const severity = Math.abs(Number(d.percent_drift)) > 20 ? SEVERITY.HIGH :
                     Math.abs(Number(d.percent_drift)) > 10 ? SEVERITY.MEDIUM : SEVERITY.LOW;

    findings.push({
      type: DISCREPANCY_TYPES.DRIFT_DETECTED,
      severity,
      sku: d.sku,
      locationCode: d.locationCode,
      expectedQty: Number(d.start_qty),
      actualQty: Number(d.end_qty),
      variance: Number(d.absolute_drift),
      variancePercent: Number(d.percent_drift),
      description: `Inventory drift detected: quantity changed from ${d.start_qty} to ${d.end_qty} (${Number(d.percent_drift).toFixed(1)}%) over 30 days`,
      evidence: {
        startQty: Number(d.start_qty),
        endQty: Number(d.end_qty),
        absoluteDrift: Number(d.absolute_drift),
        percentDrift: Number(d.percent_drift),
        dataPoints: Number(d.data_points)
      }
    });
  }

  return findings;
}

/**
 * Reconcile two inventory snapshots
 */
async function reconcileSnapshots(prisma, snapshotId, compareToSnapshotId) {
  // Implementation for comparing two point-in-time snapshots
  const current = await prisma.inventorySnapshot.findMany({
    where: { ingestionId: snapshotId }
  });

  const previous = compareToSnapshotId
    ? await prisma.inventorySnapshot.findMany({
        where: { ingestionId: compareToSnapshotId }
      })
    : [];

  const currentMap = new Map(current.map(i => [`${i.sku}-${i.locationCode}`, i]));
  const previousMap = new Map(previous.map(i => [`${i.sku}-${i.locationCode}`, i]));

  const reconciliation = {
    additions: [],
    removals: [],
    changes: [],
    unchanged: 0
  };

  // Find changes and additions
  for (const [key, curr] of currentMap) {
    const prev = previousMap.get(key);
    if (!prev) {
      reconciliation.additions.push(curr);
    } else if (curr.quantityOnHand !== prev.quantityOnHand) {
      reconciliation.changes.push({
        sku: curr.sku,
        locationCode: curr.locationCode,
        previousQty: prev.quantityOnHand,
        currentQty: curr.quantityOnHand,
        change: curr.quantityOnHand - prev.quantityOnHand
      });
    } else {
      reconciliation.unchanged++;
    }
  }

  // Find removals
  for (const [key, prev] of previousMap) {
    if (!currentMap.has(key)) {
      reconciliation.removals.push(prev);
    }
  }

  return reconciliation;
}

/**
 * Analyze drift for specific SKU/location
 */
async function analyzeDrift(prisma, { sku, locationCode, days }) {
  const where = {};
  if (sku) where.sku = sku;
  if (locationCode) where.locationCode = locationCode;

  const history = await prisma.inventorySnapshot.findMany({
    where: {
      ...where,
      snapshotDate: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { snapshotDate: 'asc' }
  });

  // Calculate trend line
  const dataPoints = history.map((h, i) => ({
    x: i,
    y: h.quantityOnHand,
    date: h.snapshotDate
  }));

  // Simple linear regression
  const n = dataPoints.length;
  if (n < 2) return { trend: 'insufficient_data', history };

  const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
  const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    trend: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
    slope,
    intercept,
    projectedEndQty: slope * (n + days) + intercept,
    history: dataPoints
  };
}

/**
 * Get problem hotspots
 */
async function getHotspots(prisma, type, limit, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  if (type === 'location') {
    return prisma.$queryRaw`
      SELECT
        "locationCode",
        COUNT(*) as total_issues,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(ABS(variance)) as total_variance,
        array_agg(DISTINCT type) as issue_types
      FROM discrepancies
      WHERE "createdAt" >= ${dateFrom}
      GROUP BY "locationCode"
      ORDER BY critical DESC, high DESC, total_issues DESC
      LIMIT ${limit}
    `;
  } else if (type === 'sku') {
    return prisma.$queryRaw`
      SELECT
        sku,
        COUNT(*) as total_issues,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(ABS("varianceValue")) as total_variance_value,
        array_agg(DISTINCT type) as issue_types
      FROM discrepancies
      WHERE "createdAt" >= ${dateFrom}
      GROUP BY sku
      ORDER BY total_variance_value DESC, critical DESC
      LIMIT ${limit}
    `;
  } else if (type === 'user') {
    return prisma.$queryRaw`
      SELECT
        "userId",
        COUNT(*) as total_issues,
        SUM(CASE WHEN severity IN ('critical', 'high') THEN 1 ELSE 0 END) as serious_issues,
        array_agg(DISTINCT type) as issue_types
      FROM discrepancies d
      JOIN investigations i ON d.id = i."discrepancyId"
      WHERE d."createdAt" >= ${dateFrom}
      GROUP BY "userId"
      ORDER BY serious_issues DESC
      LIMIT ${limit}
    `;
  }

  return [];
}

export {
  DISCREPANCY_TYPES,
  SEVERITY,
  getInventoryTruthSummary,
  runInventoryAnalysis,
  reconcileSnapshots,
  analyzeDrift,
  getHotspots
};
