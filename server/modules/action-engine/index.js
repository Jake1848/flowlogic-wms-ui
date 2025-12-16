/**
 * FlowLogic Action Engine
 *
 * Non-invasive recommendation engine that outputs:
 * - Cycle count task lists
 * - Audit recommendations
 * - Re-slot suggestions
 * - Training flags
 * - SOP violation alerts
 *
 * Delivered as: CSV, dashboard, email, ticket export
 * Does NOT touch the WMS - low risk, high value
 */

/**
 * Action types the engine can recommend
 */
const ACTION_TYPES = {
  CYCLE_COUNT: 'cycle_count',
  PHYSICAL_AUDIT: 'physical_audit',
  LOCATION_AUDIT: 'location_audit',
  RESLOT: 'reslot',
  TRAINING: 'training',
  PROCESS_REVIEW: 'process_review',
  ADJUSTMENT: 'adjustment',
  INVESTIGATION: 'investigation',
  SUPERVISOR_ALERT: 'supervisor_alert',
  HOLD_INVENTORY: 'hold_inventory'
};

/**
 * Action priorities
 */
const PRIORITY = {
  URGENT: 1,    // Do today
  HIGH: 2,      // Do this week
  MEDIUM: 3,    // Schedule this month
  LOW: 4        // When convenient
};

/**
 * Create Action Engine routes
 */
export function createActionEngineRoutes(prisma) {
  const express = require('express');
  const router = express.Router();

  /**
   * @route GET /api/actions/recommendations
   * @desc Get AI-generated action recommendations
   */
  router.get('/recommendations', async (req, res) => {
    try {
      const { type, priority, status = 'PENDING', limit = 50 } = req.query;

      const where = { status };
      if (type) where.type = type;
      if (priority) where.priority = parseInt(priority);

      const recommendations = await prisma.actionRecommendation.findMany({
        where,
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit),
        include: {
          discrepancy: true
        }
      });

      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

  /**
   * @route POST /api/actions/generate
   * @desc Generate new action recommendations based on current discrepancies
   */
  router.post('/generate', async (req, res) => {
    try {
      const { scope = 'all' } = req.body;
      const actions = await generateActions(prisma, scope);
      res.json({
        generated: actions.length,
        actions
      });
    } catch (error) {
      console.error('Action generation error:', error);
      res.status(500).json({ error: 'Failed to generate actions' });
    }
  });

  /**
   * @route GET /api/actions/cycle-count-list
   * @desc Get prioritized cycle count task list
   */
  router.get('/cycle-count-list', async (req, res) => {
    try {
      const { maxTasks = 50, zone, priority } = req.query;
      const list = await generateCycleCountList(prisma, {
        maxTasks: parseInt(maxTasks),
        zone,
        priority: priority ? parseInt(priority) : null
      });
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate cycle count list' });
    }
  });

  /**
   * @route GET /api/actions/audit-list
   * @desc Get location audit list
   */
  router.get('/audit-list', async (req, res) => {
    try {
      const { maxLocations = 20 } = req.query;
      const list = await generateAuditList(prisma, parseInt(maxLocations));
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate audit list' });
    }
  });

  /**
   * @route GET /api/actions/reslot-suggestions
   * @desc Get re-slotting suggestions
   */
  router.get('/reslot-suggestions', async (req, res) => {
    try {
      const suggestions = await generateReslotSuggestions(prisma);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate reslot suggestions' });
    }
  });

  /**
   * @route GET /api/actions/training-flags
   * @desc Get training recommendations by operator
   */
  router.get('/training-flags', async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const flags = await generateTrainingFlags(prisma, parseInt(days));
      res.json(flags);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate training flags' });
    }
  });

  /**
   * @route PUT /api/actions/:id/status
   * @desc Update action status
   */
  router.put('/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, completedBy } = req.body;

      const action = await prisma.actionRecommendation.update({
        where: { id },
        data: {
          status,
          notes,
          completedBy,
          completedAt: status === 'COMPLETED' ? new Date() : null
        }
      });

      res.json(action);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update action' });
    }
  });

  /**
   * @route GET /api/actions/export
   * @desc Export actions as CSV
   */
  router.get('/export', async (req, res) => {
    try {
      const { type, status = 'PENDING', format = 'csv' } = req.query;

      const where = { status };
      if (type) where.type = type;

      const actions = await prisma.actionRecommendation.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
      });

      if (format === 'csv') {
        const csv = actionsToCSV(actions);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=action_recommendations.csv');
        res.send(csv);
      } else {
        res.json(actions);
      }
    } catch (error) {
      res.status(500).json({ error: 'Export failed' });
    }
  });

  /**
   * @route POST /api/actions/batch-create-tasks
   * @desc Convert recommendations to WMS tasks (for systems that support it)
   */
  router.post('/batch-create-tasks', async (req, res) => {
    try {
      const { actionIds, assignTo } = req.body;

      // This would integrate with the WMS task system
      // For now, we mark the actions as "exported"
      const updated = await prisma.actionRecommendation.updateMany({
        where: { id: { in: actionIds } },
        data: {
          status: 'EXPORTED',
          exportedAt: new Date()
        }
      });

      res.json({
        success: true,
        exported: updated.count,
        message: `${updated.count} actions exported for task creation`
      });
    } catch (error) {
      res.status(500).json({ error: 'Batch export failed' });
    }
  });

  return router;
}

/**
 * Generate actions from current discrepancies
 */
async function generateActions(prisma, scope) {
  const actions = [];

  // Get open discrepancies
  const discrepancies = await prisma.discrepancy.findMany({
    where: { status: 'OPEN' },
    orderBy: [
      { severity: 'asc' },  // critical first
      { createdAt: 'asc' }   // oldest first
    ]
  });

  for (const disc of discrepancies) {
    const discActions = generateActionsForDiscrepancy(disc);

    for (const action of discActions) {
      try {
        const created = await prisma.actionRecommendation.create({
          data: {
            type: action.type,
            priority: action.priority,
            description: action.description,
            instructions: action.instructions,
            discrepancyId: disc.id,
            sku: disc.sku,
            locationCode: disc.locationCode,
            estimatedImpact: action.estimatedImpact,
            status: 'PENDING'
          }
        });
        actions.push(created);
      } catch (error) {
        // Skip duplicates
        if (!error.message.includes('Unique')) {
          console.error('Error creating action:', error);
        }
      }
    }
  }

  return actions;
}

/**
 * Generate specific actions for a discrepancy
 */
function generateActionsForDiscrepancy(discrepancy) {
  const actions = [];

  // Every discrepancy needs verification
  actions.push({
    type: ACTION_TYPES.CYCLE_COUNT,
    priority: discrepancy.severity === 'critical' ? PRIORITY.URGENT : PRIORITY.HIGH,
    description: `Verify ${discrepancy.sku} at ${discrepancy.locationCode}`,
    instructions: `Count inventory at location ${discrepancy.locationCode}. System shows variance of ${discrepancy.variance}. Report actual quantity found.`,
    estimatedImpact: Math.abs(discrepancy.varianceValue || discrepancy.variance * 10)
  });

  // Critical issues need supervisor attention
  if (discrepancy.severity === 'critical') {
    actions.push({
      type: ACTION_TYPES.SUPERVISOR_ALERT,
      priority: PRIORITY.URGENT,
      description: `Critical inventory issue: ${discrepancy.type}`,
      instructions: `Investigate critical discrepancy immediately. ${discrepancy.description}`,
      estimatedImpact: Math.abs(discrepancy.varianceValue || 0)
    });
  }

  // Negative inventory needs hold
  if (discrepancy.type === 'negative_on_hand') {
    actions.push({
      type: ACTION_TYPES.HOLD_INVENTORY,
      priority: PRIORITY.URGENT,
      description: `Hold orders for ${discrepancy.sku} pending investigation`,
      instructions: `Do not allocate or pick ${discrepancy.sku} until inventory is verified. Current system shows ${discrepancy.actualQty}.`,
      estimatedImpact: 0
    });
  }

  // Recurring issues at location need audit
  if (discrepancy.type === 'adjustment_spike' || discrepancy.type === 'drift_detected') {
    actions.push({
      type: ACTION_TYPES.LOCATION_AUDIT,
      priority: PRIORITY.HIGH,
      description: `Audit location ${discrepancy.locationCode}`,
      instructions: `Physical audit of location. Check: label visibility, physical condition, adjacent locations, slotting appropriateness.`,
      estimatedImpact: 0
    });
  }

  return actions;
}

/**
 * Generate prioritized cycle count list
 */
async function generateCycleCountList(prisma, options) {
  const { maxTasks, zone, priority } = options;

  // Prioritize: critical discrepancies > high value > high velocity > random
  const list = await prisma.$queryRaw`
    WITH scored_locations AS (
      SELECT
        d."locationCode",
        d.sku,
        d.severity,
        d.variance,
        d."varianceValue",
        l.zone,
        p.cost,
        CASE
          WHEN d.severity = 'critical' THEN 100
          WHEN d.severity = 'high' THEN 75
          WHEN d.severity = 'medium' THEN 50
          ELSE 25
        END +
        CASE
          WHEN ABS(d."varianceValue") > 1000 THEN 50
          WHEN ABS(d."varianceValue") > 100 THEN 25
          ELSE 0
        END +
        CASE
          WHEN d."createdAt" < NOW() - INTERVAL '7 days' THEN 25
          ELSE 0
        END as priority_score
      FROM discrepancies d
      LEFT JOIN locations l ON d."locationCode" = l.code
      LEFT JOIN products p ON d.sku = p.sku
      WHERE d.status = 'OPEN'
        ${zone ? 'AND l.zone = ' + zone : ''}
    )
    SELECT
      "locationCode",
      sku,
      severity,
      variance,
      "varianceValue",
      zone,
      cost,
      priority_score
    FROM scored_locations
    ORDER BY priority_score DESC
    LIMIT ${maxTasks}
  `;

  return {
    generatedAt: new Date().toISOString(),
    taskCount: list.length,
    tasks: list.map((item, index) => ({
      sequence: index + 1,
      locationCode: item.locationCode,
      sku: item.sku,
      priority: item.priority_score >= 100 ? 'URGENT' :
                item.priority_score >= 75 ? 'HIGH' :
                item.priority_score >= 50 ? 'MEDIUM' : 'LOW',
      reason: item.severity === 'critical' ? 'Critical discrepancy' :
              item.varianceValue > 100 ? 'High value variance' : 'Standard verification',
      expectedVariance: Number(item.variance),
      zone: item.zone
    }))
  };
}

/**
 * Generate location audit list
 */
async function generateAuditList(prisma, maxLocations) {
  const problematicLocations = await prisma.$queryRaw`
    SELECT
      "locationCode",
      COUNT(*) as issue_count,
      SUM(CASE WHEN severity IN ('critical', 'high') THEN 1 ELSE 0 END) as serious_count,
      array_agg(DISTINCT type) as issue_types,
      MIN("createdAt") as oldest_issue
    FROM discrepancies
    WHERE status = 'OPEN'
    GROUP BY "locationCode"
    HAVING COUNT(*) >= 2 OR SUM(CASE WHEN severity IN ('critical', 'high') THEN 1 ELSE 0 END) >= 1
    ORDER BY serious_count DESC, issue_count DESC
    LIMIT ${maxLocations}
  `;

  return {
    generatedAt: new Date().toISOString(),
    locationCount: problematicLocations.length,
    locations: problematicLocations.map(loc => ({
      locationCode: loc.locationCode,
      issueCount: Number(loc.issue_count),
      seriousIssueCount: Number(loc.serious_count),
      issueTypes: loc.issue_types,
      oldestIssue: loc.oldest_issue,
      auditChecklist: [
        'Verify location label is readable and correct',
        'Check physical condition of location',
        'Verify no commingled SKUs',
        'Check adjacent locations for mis-slots',
        'Verify location is accessible',
        'Check for damaged or obstructed inventory'
      ]
    }))
  };
}

/**
 * Generate re-slotting suggestions
 */
async function generateReslotSuggestions(prisma) {
  // Find SKUs with issues across multiple locations
  const candidates = await prisma.$queryRaw`
    WITH sku_issues AS (
      SELECT
        sku,
        COUNT(DISTINCT "locationCode") as location_count,
        COUNT(*) as total_issues,
        SUM(ABS(variance)) as total_variance
      FROM discrepancies
      WHERE status = 'OPEN'
      GROUP BY sku
      HAVING COUNT(DISTINCT "locationCode") >= 2
    )
    SELECT
      si.sku,
      si.location_count,
      si.total_issues,
      si.total_variance,
      p.name as product_name,
      p.category
    FROM sku_issues si
    LEFT JOIN products p ON si.sku = p.sku
    ORDER BY si.total_issues DESC
    LIMIT 20
  `;

  return {
    generatedAt: new Date().toISOString(),
    suggestionCount: candidates.length,
    suggestions: candidates.map(c => ({
      sku: c.sku,
      productName: c.product_name,
      category: c.category,
      currentLocationCount: Number(c.location_count),
      totalIssues: Number(c.total_issues),
      totalVariance: Number(c.total_variance),
      recommendation: Number(c.location_count) > 3
        ? 'Consider consolidating to fewer locations'
        : 'Review slotting strategy for this SKU',
      reason: `${c.total_issues} discrepancies across ${c.location_count} locations`
    }))
  };
}

/**
 * Generate training flags for operators
 */
async function generateTrainingFlags(prisma, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Find operators with high error rates
  const operatorMetrics = await prisma.$queryRaw`
    WITH operator_adjustments AS (
      SELECT
        "userId",
        COUNT(*) as adjustment_count,
        SUM(ABS("adjustmentQty")) as total_adjusted,
        COUNT(DISTINCT "locationCode") as locations_touched,
        COUNT(DISTINCT sku) as skus_touched
      FROM adjustment_snapshots
      WHERE "adjustmentDate" >= ${dateFrom}
        AND "userId" IS NOT NULL
      GROUP BY "userId"
    ),
    operator_issues AS (
      SELECT
        i."userId",
        COUNT(*) as issue_count
      FROM investigations i
      JOIN discrepancies d ON i."discrepancyId" = d.id
      WHERE i."createdAt" >= ${dateFrom}
      GROUP BY i."userId"
    )
    SELECT
      oa."userId",
      u."fullName" as operator_name,
      oa.adjustment_count,
      oa.total_adjusted,
      COALESCE(oi.issue_count, 0) as related_issues,
      CASE
        WHEN oa.adjustment_count > 50 AND COALESCE(oi.issue_count, 0) > 5 THEN 'HIGH'
        WHEN oa.adjustment_count > 20 AND COALESCE(oi.issue_count, 0) > 2 THEN 'MEDIUM'
        ELSE 'LOW'
      END as training_priority
    FROM operator_adjustments oa
    LEFT JOIN operator_issues oi ON oa."userId" = oi."userId"
    LEFT JOIN users u ON oa."userId" = u.id
    WHERE oa.adjustment_count > 10
    ORDER BY oa.adjustment_count DESC
  `;

  return {
    generatedAt: new Date().toISOString(),
    period: { from: dateFrom, to: new Date() },
    flagCount: operatorMetrics.filter(m => m.training_priority !== 'LOW').length,
    operators: operatorMetrics.map(op => ({
      userId: op.userId,
      operatorName: op.operator_name,
      adjustmentCount: Number(op.adjustment_count),
      totalAdjusted: Number(op.total_adjusted),
      relatedIssues: Number(op.related_issues),
      trainingPriority: op.training_priority,
      recommendedTraining: getTrainingRecommendations(op)
    }))
  };
}

/**
 * Get training recommendations for an operator
 */
function getTrainingRecommendations(operatorMetrics) {
  const recommendations = [];

  if (operatorMetrics.adjustment_count > 30) {
    recommendations.push('Refresh on proper adjustment procedures');
  }

  if (operatorMetrics.related_issues > 3) {
    recommendations.push('Review accuracy and attention to detail');
  }

  if (operatorMetrics.training_priority === 'HIGH') {
    recommendations.push('Shadow experienced operator for 1 shift');
    recommendations.push('Review with supervisor');
  }

  if (recommendations.length === 0) {
    recommendations.push('Monitor performance - no immediate action needed');
  }

  return recommendations;
}

/**
 * Convert actions to CSV format
 */
function actionsToCSV(actions) {
  const headers = [
    'ID',
    'Type',
    'Priority',
    'SKU',
    'Location',
    'Description',
    'Instructions',
    'Status',
    'Created',
    'Estimated Impact'
  ];

  const rows = actions.map(a => [
    a.id,
    a.type,
    a.priority,
    a.sku || '',
    a.locationCode || '',
    `"${(a.description || '').replace(/"/g, '""')}"`,
    `"${(a.instructions || '').replace(/"/g, '""')}"`,
    a.status,
    a.createdAt?.toISOString() || '',
    a.estimatedImpact || 0
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export {
  ACTION_TYPES,
  PRIORITY,
  generateActions,
  generateCycleCountList,
  generateAuditList,
  generateReslotSuggestions,
  generateTrainingFlags
};
