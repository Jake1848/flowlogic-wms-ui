/**
 * FlowLogic Root Cause Graph
 *
 * For every discrepancy, this module answers:
 * - Which locations?
 * - Which SKUs?
 * - Which transactions?
 * - Which operators?
 * - Which shifts?
 * - Which upstream events?
 *
 * Graph thinking, not flat reports.
 */

/**
 * Root cause categories
 */
const ROOT_CAUSE_CATEGORIES = {
  PROCESS: 'process',           // Process/procedure breakdown
  HUMAN: 'human',               // Operator error, training issue
  SYSTEM: 'system',             // WMS/system error
  EXTERNAL: 'external',         // Vendor/customer/carrier issue
  EQUIPMENT: 'equipment',       // Scanner, forklift, etc.
  LOCATION: 'location',         // Physical location issue
  TIMING: 'timing',             // Timing/sequence issue
  UNKNOWN: 'unknown'
};

/**
 * Confidence levels for root cause analysis
 */
const CONFIDENCE = {
  HIGH: 'high',         // Strong evidence, high correlation
  MEDIUM: 'medium',     // Moderate evidence
  LOW: 'low',           // Weak evidence, possible correlation
  SPECULATIVE: 'speculative'
};

/**
 * Create Root Cause Graph routes
 */
export function createRootCauseRoutes(prisma) {
  const express = require('express');
  const router = express.Router();

  /**
   * @route GET /api/root-cause/investigate/:discrepancyId
   * @desc Get full root cause investigation for a discrepancy
   */
  router.get('/investigate/:discrepancyId', async (req, res) => {
    try {
      const { discrepancyId } = req.params;
      const investigation = await investigateDiscrepancy(prisma, discrepancyId);
      res.json(investigation);
    } catch (error) {
      console.error('Investigation error:', error);
      res.status(500).json({ error: 'Investigation failed' });
    }
  });

  /**
   * @route GET /api/root-cause/graph/:discrepancyId
   * @desc Get root cause graph data for visualization
   */
  router.get('/graph/:discrepancyId', async (req, res) => {
    try {
      const { discrepancyId } = req.params;
      const graph = await buildCauseGraph(prisma, discrepancyId);
      res.json(graph);
    } catch (error) {
      res.status(500).json({ error: 'Failed to build cause graph' });
    }
  });

  /**
   * @route GET /api/root-cause/patterns
   * @desc Get recurring root cause patterns
   */
  router.get('/patterns', async (req, res) => {
    try {
      const { days = 30, minOccurrences = 3 } = req.query;
      const patterns = await findPatterns(prisma, parseInt(days), parseInt(minOccurrences));
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: 'Pattern analysis failed' });
    }
  });

  /**
   * @route GET /api/root-cause/correlations
   * @desc Find correlations between discrepancies
   */
  router.get('/correlations', async (req, res) => {
    try {
      const { dimension = 'location' } = req.query;
      const correlations = await findCorrelations(prisma, dimension);
      res.json(correlations);
    } catch (error) {
      res.status(500).json({ error: 'Correlation analysis failed' });
    }
  });

  /**
   * @route POST /api/root-cause/assign
   * @desc Assign confirmed root cause to a discrepancy
   */
  router.post('/assign', async (req, res) => {
    try {
      const { discrepancyId, rootCause, category, notes, assignedTo } = req.body;

      const investigation = await prisma.investigation.create({
        data: {
          discrepancyId,
          rootCause,
          category,
          notes,
          assignedTo,
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      });

      // Update discrepancy status
      await prisma.discrepancy.update({
        where: { id: discrepancyId },
        data: {
          status: 'INVESTIGATED',
          rootCause,
          rootCauseCategory: category
        }
      });

      res.json(investigation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign root cause' });
    }
  });

  /**
   * @route GET /api/root-cause/operator-analysis/:userId
   * @desc Analyze discrepancies associated with an operator
   */
  router.get('/operator-analysis/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;
      const analysis = await analyzeOperator(prisma, userId, parseInt(days));
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: 'Operator analysis failed' });
    }
  });

  /**
   * @route GET /api/root-cause/location-analysis/:locationCode
   * @desc Analyze discrepancies at a specific location
   */
  router.get('/location-analysis/:locationCode', async (req, res) => {
    try {
      const { locationCode } = req.params;
      const { days = 30 } = req.query;
      const analysis = await analyzeLocation(prisma, locationCode, parseInt(days));
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: 'Location analysis failed' });
    }
  });

  return router;
}

/**
 * Investigate a discrepancy to find root cause
 */
async function investigateDiscrepancy(prisma, discrepancyId) {
  const discrepancy = await prisma.discrepancy.findUnique({
    where: { id: discrepancyId },
    include: {
      investigations: true
    }
  });

  if (!discrepancy) {
    throw new Error('Discrepancy not found');
  }

  const investigation = {
    discrepancy,
    timeline: [],
    relatedTransactions: [],
    relatedAdjustments: [],
    relatedCycleCounts: [],
    involvedOperators: [],
    involvedLocations: [],
    possibleCauses: [],
    recommendedActions: []
  };

  // 1. Build timeline of events around the discrepancy
  const timeWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
  const startDate = new Date(discrepancy.detectedAt.getTime() - timeWindow);
  const endDate = discrepancy.detectedAt;

  // Get related transactions
  investigation.relatedTransactions = await prisma.transactionSnapshot.findMany({
    where: {
      OR: [
        { sku: discrepancy.sku, toLocation: discrepancy.locationCode },
        { sku: discrepancy.sku, fromLocation: discrepancy.locationCode }
      ],
      transactionDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { transactionDate: 'desc' }
  });

  // Get related adjustments
  investigation.relatedAdjustments = await prisma.adjustmentSnapshot.findMany({
    where: {
      sku: discrepancy.sku,
      locationCode: discrepancy.locationCode,
      adjustmentDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { adjustmentDate: 'desc' }
  });

  // Get related cycle counts
  investigation.relatedCycleCounts = await prisma.cycleCountSnapshot.findMany({
    where: {
      sku: discrepancy.sku,
      locationCode: discrepancy.locationCode,
      countDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { countDate: 'desc' }
  });

  // Extract unique operators involved
  const operatorIds = new Set([
    ...investigation.relatedTransactions.map(t => t.userId).filter(Boolean),
    ...investigation.relatedAdjustments.map(a => a.userId).filter(Boolean),
    ...investigation.relatedCycleCounts.map(c => c.counterId).filter(Boolean)
  ]);

  if (operatorIds.size > 0) {
    investigation.involvedOperators = await prisma.user.findMany({
      where: { id: { in: Array.from(operatorIds) } },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true
      }
    });
  }

  // Build timeline
  investigation.timeline = buildTimeline(
    investigation.relatedTransactions,
    investigation.relatedAdjustments,
    investigation.relatedCycleCounts,
    discrepancy
  );

  // Analyze for possible causes
  investigation.possibleCauses = await analyzePossibleCauses(
    prisma,
    discrepancy,
    investigation
  );

  // Generate recommended actions
  investigation.recommendedActions = generateRecommendations(
    discrepancy,
    investigation.possibleCauses
  );

  return investigation;
}

/**
 * Build chronological timeline of events
 */
function buildTimeline(transactions, adjustments, cycleCounts, discrepancy) {
  const events = [];

  // Add transactions
  for (const t of transactions) {
    events.push({
      timestamp: t.transactionDate,
      type: 'transaction',
      action: t.type,
      quantity: t.quantity,
      from: t.fromLocation,
      to: t.toLocation,
      operator: t.userId,
      data: t
    });
  }

  // Add adjustments
  for (const a of adjustments) {
    events.push({
      timestamp: a.adjustmentDate,
      type: 'adjustment',
      action: a.reason,
      quantity: a.adjustmentQty,
      location: a.locationCode,
      operator: a.userId,
      data: a
    });
  }

  // Add cycle counts
  for (const c of cycleCounts) {
    events.push({
      timestamp: c.countDate,
      type: 'cycle_count',
      action: 'count',
      systemQty: c.systemQty,
      countedQty: c.countedQty,
      variance: c.variance,
      operator: c.counterId,
      data: c
    });
  }

  // Add discrepancy detection
  events.push({
    timestamp: discrepancy.detectedAt,
    type: 'discrepancy_detected',
    action: discrepancy.type,
    severity: discrepancy.severity,
    variance: discrepancy.variance,
    data: discrepancy
  });

  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return events;
}

/**
 * Analyze possible root causes
 */
async function analyzePossibleCauses(prisma, discrepancy, investigation) {
  const causes = [];

  // 1. Check for adjustment-related causes
  if (investigation.relatedAdjustments.length > 0) {
    const adjustmentTotal = investigation.relatedAdjustments.reduce(
      (sum, a) => sum + a.adjustmentQty, 0
    );

    if (Math.abs(adjustmentTotal) > Math.abs(discrepancy.variance) * 0.5) {
      causes.push({
        category: ROOT_CAUSE_CATEGORIES.PROCESS,
        description: 'High adjustment volume may indicate systematic issue',
        confidence: CONFIDENCE.MEDIUM,
        evidence: {
          adjustmentCount: investigation.relatedAdjustments.length,
          totalAdjusted: adjustmentTotal,
          discrepancyVariance: discrepancy.variance
        },
        possibleReasons: [
          'Receiving errors requiring frequent corrections',
          'Pick errors being adjusted rather than root-caused',
          'Damaged inventory being adjusted without investigation'
        ]
      });
    }
  }

  // 2. Check for operator patterns
  const operatorAdjustments = {};
  for (const adj of investigation.relatedAdjustments) {
    if (adj.userId) {
      operatorAdjustments[adj.userId] = (operatorAdjustments[adj.userId] || 0) + 1;
    }
  }

  for (const [userId, count] of Object.entries(operatorAdjustments)) {
    if (count >= 3) {
      const operator = investigation.involvedOperators.find(o => o.id === userId);
      causes.push({
        category: ROOT_CAUSE_CATEGORIES.HUMAN,
        description: `Operator ${operator?.fullName || userId} made ${count} adjustments`,
        confidence: count >= 5 ? CONFIDENCE.HIGH : CONFIDENCE.MEDIUM,
        evidence: {
          operatorId: userId,
          operatorName: operator?.fullName,
          adjustmentCount: count
        },
        possibleReasons: [
          'Training gap - operator may need retraining',
          'Process confusion - procedures may be unclear',
          'Equipment issue - scanner or RF gun problems'
        ]
      });
    }
  }

  // 3. Check for transaction sequence issues
  const transactions = investigation.relatedTransactions;
  if (transactions.length > 0) {
    // Look for receive without putaway, pick without ship, etc.
    const types = transactions.map(t => t.type);
    if (types.includes('RECEIVE') && !types.includes('PUTAWAY')) {
      causes.push({
        category: ROOT_CAUSE_CATEGORIES.PROCESS,
        description: 'Receiving transaction without corresponding putaway',
        confidence: CONFIDENCE.HIGH,
        evidence: {
          transactionTypes: types
        },
        possibleReasons: [
          'Product received but not put away to final location',
          'Putaway transaction not recorded in WMS',
          'Product sitting in staging area'
        ]
      });
    }
  }

  // 4. Check for cycle count patterns
  if (investigation.relatedCycleCounts.length > 0) {
    const allNegative = investigation.relatedCycleCounts.every(c => c.variance < 0);
    const allPositive = investigation.relatedCycleCounts.every(c => c.variance > 0);

    if (allNegative) {
      causes.push({
        category: ROOT_CAUSE_CATEGORIES.PROCESS,
        description: 'Consistent negative variances in cycle counts',
        confidence: CONFIDENCE.HIGH,
        evidence: {
          countCount: investigation.relatedCycleCounts.length,
          variances: investigation.relatedCycleCounts.map(c => c.variance)
        },
        possibleReasons: [
          'Unrecorded picks or moves out of location',
          'Theft or shrinkage',
          'Damage disposal not recorded'
        ]
      });
    } else if (allPositive) {
      causes.push({
        category: ROOT_CAUSE_CATEGORIES.PROCESS,
        description: 'Consistent positive variances in cycle counts',
        confidence: CONFIDENCE.HIGH,
        evidence: {
          countCount: investigation.relatedCycleCounts.length,
          variances: investigation.relatedCycleCounts.map(c => c.variance)
        },
        possibleReasons: [
          'Unrecorded receiving or moves into location',
          'Returns placed without transaction',
          'Mis-slot from adjacent location'
        ]
      });
    }
  }

  // 5. Check location-based patterns
  const locationIssues = await prisma.discrepancy.count({
    where: {
      locationCode: discrepancy.locationCode,
      status: 'OPEN',
      id: { not: discrepancy.id }
    }
  });

  if (locationIssues >= 3) {
    causes.push({
      category: ROOT_CAUSE_CATEGORIES.LOCATION,
      description: `Location ${discrepancy.locationCode} has ${locationIssues} other open discrepancies`,
      confidence: CONFIDENCE.HIGH,
      evidence: {
        locationCode: discrepancy.locationCode,
        otherIssuesCount: locationIssues
      },
      possibleReasons: [
        'Location physically problematic (hard to reach, confusing)',
        'Multiple SKUs in location causing confusion',
        'Location label damaged or hard to read'
      ]
    });
  }

  // 6. Check SKU-based patterns
  const skuIssues = await prisma.discrepancy.count({
    where: {
      sku: discrepancy.sku,
      status: 'OPEN',
      id: { not: discrepancy.id }
    }
  });

  if (skuIssues >= 3) {
    causes.push({
      category: ROOT_CAUSE_CATEGORIES.PROCESS,
      description: `SKU ${discrepancy.sku} has ${skuIssues} other open discrepancies`,
      confidence: CONFIDENCE.MEDIUM,
      evidence: {
        sku: discrepancy.sku,
        otherIssuesCount: skuIssues
      },
      possibleReasons: [
        'SKU easily confused with similar item',
        'Unit of measure confusion (eaches vs cases)',
        'Barcode scanning issues'
      ]
    });
  }

  // Sort by confidence
  const confidenceOrder = { high: 0, medium: 1, low: 2, speculative: 3 };
  causes.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);

  return causes;
}

/**
 * Generate recommended actions based on analysis
 */
function generateRecommendations(discrepancy, possibleCauses) {
  const recommendations = [];

  // Always recommend cycle count verification
  recommendations.push({
    priority: 1,
    action: 'CYCLE_COUNT',
    description: `Perform cycle count at ${discrepancy.locationCode} for ${discrepancy.sku}`,
    assignTo: 'inventory_control'
  });

  // Based on causes, add specific recommendations
  for (const cause of possibleCauses) {
    switch (cause.category) {
      case ROOT_CAUSE_CATEGORIES.HUMAN:
        recommendations.push({
          priority: 2,
          action: 'TRAINING_REVIEW',
          description: `Review training for operator mentioned in investigation`,
          assignTo: 'supervisor'
        });
        break;

      case ROOT_CAUSE_CATEGORIES.LOCATION:
        recommendations.push({
          priority: 2,
          action: 'LOCATION_AUDIT',
          description: `Audit location ${discrepancy.locationCode} for physical issues`,
          assignTo: 'warehouse_ops'
        });
        break;

      case ROOT_CAUSE_CATEGORIES.PROCESS:
        recommendations.push({
          priority: 3,
          action: 'PROCESS_REVIEW',
          description: 'Review related SOP for gaps or clarity issues',
          assignTo: 'operations'
        });
        break;
    }
  }

  // If variance is significant, recommend adjustment after investigation
  if (Math.abs(discrepancy.variance) > 10) {
    recommendations.push({
      priority: 4,
      action: 'ADJUSTMENT',
      description: `After root cause confirmed, adjust inventory by ${-discrepancy.variance}`,
      assignTo: 'inventory_control',
      requiresApproval: Math.abs(discrepancy.variance) > 50
    });
  }

  return recommendations;
}

/**
 * Build cause graph for visualization
 */
async function buildCauseGraph(prisma, discrepancyId) {
  const investigation = await investigateDiscrepancy(prisma, discrepancyId);

  const nodes = [];
  const edges = [];

  // Central discrepancy node
  nodes.push({
    id: 'discrepancy',
    type: 'discrepancy',
    label: `${investigation.discrepancy.type}`,
    data: {
      sku: investigation.discrepancy.sku,
      location: investigation.discrepancy.locationCode,
      variance: investigation.discrepancy.variance
    }
  });

  // Add operator nodes
  for (const op of investigation.involvedOperators) {
    nodes.push({
      id: `operator-${op.id}`,
      type: 'operator',
      label: op.fullName || op.username,
      data: op
    });
  }

  // Add transaction nodes
  for (const tx of investigation.relatedTransactions) {
    const nodeId = `tx-${tx.id}`;
    nodes.push({
      id: nodeId,
      type: 'transaction',
      label: `${tx.type}: ${tx.quantity}`,
      data: tx
    });

    edges.push({
      from: nodeId,
      to: 'discrepancy',
      type: 'transaction'
    });

    if (tx.userId) {
      edges.push({
        from: `operator-${tx.userId}`,
        to: nodeId,
        type: 'performed'
      });
    }
  }

  // Add adjustment nodes
  for (const adj of investigation.relatedAdjustments) {
    const nodeId = `adj-${adj.id}`;
    nodes.push({
      id: nodeId,
      type: 'adjustment',
      label: `Adj: ${adj.adjustmentQty}`,
      data: adj
    });

    edges.push({
      from: nodeId,
      to: 'discrepancy',
      type: 'adjustment'
    });

    if (adj.userId) {
      edges.push({
        from: `operator-${adj.userId}`,
        to: nodeId,
        type: 'performed'
      });
    }
  }

  // Add cause nodes
  for (let i = 0; i < investigation.possibleCauses.length; i++) {
    const cause = investigation.possibleCauses[i];
    const nodeId = `cause-${i}`;
    nodes.push({
      id: nodeId,
      type: 'cause',
      label: cause.description.substring(0, 50) + '...',
      data: cause
    });

    edges.push({
      from: nodeId,
      to: 'discrepancy',
      type: 'cause',
      confidence: cause.confidence
    });
  }

  return { nodes, edges, investigation };
}

/**
 * Find recurring patterns across discrepancies
 */
async function findPatterns(prisma, days, minOccurrences) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Pattern: Same location, same type
  const locationPatterns = await prisma.$queryRaw`
    SELECT
      "locationCode",
      type,
      COUNT(*) as occurrences,
      AVG(variance) as avg_variance,
      array_agg(DISTINCT sku) as affected_skus
    FROM discrepancies
    WHERE "createdAt" >= ${dateFrom}
    GROUP BY "locationCode", type
    HAVING COUNT(*) >= ${minOccurrences}
    ORDER BY occurrences DESC
  `;

  // Pattern: Same SKU, multiple locations
  const skuPatterns = await prisma.$queryRaw`
    SELECT
      sku,
      type,
      COUNT(*) as occurrences,
      COUNT(DISTINCT "locationCode") as location_count,
      AVG(variance) as avg_variance
    FROM discrepancies
    WHERE "createdAt" >= ${dateFrom}
    GROUP BY sku, type
    HAVING COUNT(*) >= ${minOccurrences}
    ORDER BY occurrences DESC
  `;

  // Pattern: Time-based (shift patterns)
  const timePatterns = await prisma.$queryRaw`
    SELECT
      EXTRACT(HOUR FROM "detectedAt") as hour,
      CASE
        WHEN EXTRACT(HOUR FROM "detectedAt") BETWEEN 6 AND 14 THEN 'Day'
        WHEN EXTRACT(HOUR FROM "detectedAt") BETWEEN 14 AND 22 THEN 'Evening'
        ELSE 'Night'
      END as shift,
      type,
      COUNT(*) as occurrences
    FROM discrepancies
    WHERE "createdAt" >= ${dateFrom}
    GROUP BY EXTRACT(HOUR FROM "detectedAt"), type
    HAVING COUNT(*) >= ${minOccurrences}
    ORDER BY occurrences DESC
  `;

  return {
    locationPatterns: locationPatterns.map(p => ({
      ...p,
      occurrences: Number(p.occurrences),
      avgVariance: Number(p.avg_variance)
    })),
    skuPatterns: skuPatterns.map(p => ({
      ...p,
      occurrences: Number(p.occurrences),
      locationCount: Number(p.location_count),
      avgVariance: Number(p.avg_variance)
    })),
    timePatterns: timePatterns.map(p => ({
      ...p,
      hour: Number(p.hour),
      occurrences: Number(p.occurrences)
    }))
  };
}

/**
 * Find correlations between discrepancies
 */
async function findCorrelations(prisma, dimension) {
  // Find discrepancies that tend to occur together
  const correlations = await prisma.$queryRaw`
    WITH paired AS (
      SELECT
        d1.id as id1,
        d2.id as id2,
        d1.${dimension === 'sku' ? 'sku' : '"locationCode"'} as dim1,
        d2.${dimension === 'sku' ? 'sku' : '"locationCode"'} as dim2,
        ABS(EXTRACT(EPOCH FROM (d1."detectedAt" - d2."detectedAt"))) / 3600 as hours_apart
      FROM discrepancies d1
      JOIN discrepancies d2 ON d1.id < d2.id
      WHERE ABS(EXTRACT(EPOCH FROM (d1."detectedAt" - d2."detectedAt"))) / 3600 < 24
    )
    SELECT
      dim1,
      dim2,
      COUNT(*) as co_occurrences,
      AVG(hours_apart) as avg_hours_apart
    FROM paired
    WHERE dim1 != dim2
    GROUP BY dim1, dim2
    HAVING COUNT(*) >= 3
    ORDER BY co_occurrences DESC
    LIMIT 20
  `;

  return correlations.map(c => ({
    item1: c.dim1,
    item2: c.dim2,
    coOccurrences: Number(c.co_occurrences),
    avgHoursApart: Number(c.avg_hours_apart)
  }));
}

/**
 * Analyze an operator's discrepancy history
 */
async function analyzeOperator(prisma, userId, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get adjustments made by operator
  const adjustments = await prisma.adjustmentSnapshot.findMany({
    where: {
      userId,
      adjustmentDate: { gte: dateFrom }
    },
    orderBy: { adjustmentDate: 'desc' }
  });

  // Get discrepancies at locations operator worked at
  const operatorLocations = [...new Set(adjustments.map(a => a.locationCode))];
  const relatedDiscrepancies = await prisma.discrepancy.findMany({
    where: {
      locationCode: { in: operatorLocations },
      createdAt: { gte: dateFrom }
    }
  });

  // Calculate metrics
  const totalAdjustments = adjustments.length;
  const totalAdjusted = adjustments.reduce((sum, a) => sum + Math.abs(a.adjustmentQty), 0);
  const uniqueLocations = new Set(adjustments.map(a => a.locationCode)).size;
  const uniqueSKUs = new Set(adjustments.map(a => a.sku)).size;

  // Analyze by reason
  const byReason = {};
  for (const adj of adjustments) {
    byReason[adj.reason] = (byReason[adj.reason] || 0) + 1;
  }

  return {
    userId,
    period: { from: dateFrom, to: new Date() },
    metrics: {
      totalAdjustments,
      totalAdjusted,
      uniqueLocations,
      uniqueSKUs,
      avgAdjustmentSize: totalAdjustments > 0 ? totalAdjusted / totalAdjustments : 0
    },
    adjustmentsByReason: byReason,
    relatedDiscrepancies: relatedDiscrepancies.length,
    recentAdjustments: adjustments.slice(0, 20)
  };
}

/**
 * Analyze a location's discrepancy history
 */
async function analyzeLocation(prisma, locationCode, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all discrepancies at location
  const discrepancies = await prisma.discrepancy.findMany({
    where: {
      locationCode,
      createdAt: { gte: dateFrom }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get adjustments at location
  const adjustments = await prisma.adjustmentSnapshot.findMany({
    where: {
      locationCode,
      adjustmentDate: { gte: dateFrom }
    }
  });

  // Get cycle counts at location
  const cycleCounts = await prisma.cycleCountSnapshot.findMany({
    where: {
      locationCode,
      countDate: { gte: dateFrom }
    }
  });

  // Calculate metrics
  const byType = {};
  const bySeverity = {};
  for (const d of discrepancies) {
    byType[d.type] = (byType[d.type] || 0) + 1;
    bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
  }

  const avgCycleCountVariance = cycleCounts.length > 0
    ? cycleCounts.reduce((sum, c) => sum + Math.abs(c.variance), 0) / cycleCounts.length
    : 0;

  return {
    locationCode,
    period: { from: dateFrom, to: new Date() },
    metrics: {
      totalDiscrepancies: discrepancies.length,
      openDiscrepancies: discrepancies.filter(d => d.status === 'OPEN').length,
      totalAdjustments: adjustments.length,
      totalCycleCounts: cycleCounts.length,
      avgCycleCountVariance
    },
    byType,
    bySeverity,
    recentDiscrepancies: discrepancies.slice(0, 10),
    uniqueOperators: [...new Set(adjustments.map(a => a.userId).filter(Boolean))]
  };
}

export {
  ROOT_CAUSE_CATEGORIES,
  CONFIDENCE,
  investigateDiscrepancy,
  buildCauseGraph,
  findPatterns,
  findCorrelations,
  analyzeOperator,
  analyzeLocation
};
