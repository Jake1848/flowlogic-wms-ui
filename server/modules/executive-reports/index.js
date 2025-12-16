/**
 * FlowLogic Executive Reports Module
 *
 * Auto-generated executive narratives:
 * - "Why inventory accuracy dropped"
 * - "Where write-offs came from"
 * - "What we fixed"
 * - "What will happen if nothing changes"
 *
 * This replaces manual IC manager reporting - where the money comes from.
 */

/**
 * Report types available
 */
const REPORT_TYPES = {
  WEEKLY_SUMMARY: 'weekly_summary',
  ACCURACY_ANALYSIS: 'accuracy_analysis',
  WRITEOFF_ANALYSIS: 'writeoff_analysis',
  TREND_FORECAST: 'trend_forecast',
  ROOT_CAUSE_SUMMARY: 'root_cause_summary',
  OPERATOR_PERFORMANCE: 'operator_performance',
  LOCATION_HEALTH: 'location_health',
  EXECUTIVE_BRIEF: 'executive_brief'
};

/**
 * Create Executive Reports routes
 */
export function createExecutiveReportsRoutes(prisma) {
  const express = require('express');
  const router = express.Router();

  /**
   * @route GET /api/reports/executive-brief
   * @desc Get executive brief for leadership
   */
  router.get('/executive-brief', async (req, res) => {
    try {
      const { period = 'week' } = req.query;
      const brief = await generateExecutiveBrief(prisma, period);
      res.json(brief);
    } catch (error) {
      console.error('Executive brief error:', error);
      res.status(500).json({ error: 'Failed to generate executive brief' });
    }
  });

  /**
   * @route GET /api/reports/weekly-summary
   * @desc Get weekly inventory intelligence summary
   */
  router.get('/weekly-summary', async (req, res) => {
    try {
      const { weekOf } = req.query;
      const startDate = weekOf ? new Date(weekOf) : getLastWeekStart();
      const summary = await generateWeeklySummary(prisma, startDate);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate weekly summary' });
    }
  });

  /**
   * @route GET /api/reports/accuracy-trend
   * @desc Get inventory accuracy trend analysis
   */
  router.get('/accuracy-trend', async (req, res) => {
    try {
      const { days = 90 } = req.query;
      const trend = await analyzeAccuracyTrend(prisma, parseInt(days));
      res.json(trend);
    } catch (error) {
      res.status(500).json({ error: 'Accuracy trend analysis failed' });
    }
  });

  /**
   * @route GET /api/reports/writeoff-analysis
   * @desc Analyze write-offs and their causes
   */
  router.get('/writeoff-analysis', async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const analysis = await analyzeWriteoffs(prisma, period);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: 'Write-off analysis failed' });
    }
  });

  /**
   * @route GET /api/reports/forecast
   * @desc Forecast inventory accuracy and issues
   */
  router.get('/forecast', async (req, res) => {
    try {
      const { horizon = 30 } = req.query;
      const forecast = await generateForecast(prisma, parseInt(horizon));
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ error: 'Forecast generation failed' });
    }
  });

  /**
   * @route GET /api/reports/root-cause-summary
   * @desc Get root cause summary for period
   */
  router.get('/root-cause-summary', async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const summary = await summarizeRootCauses(prisma, parseInt(days));
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Root cause summary failed' });
    }
  });

  /**
   * @route GET /api/reports/operator-scorecard
   * @desc Get operator performance scorecard
   */
  router.get('/operator-scorecard', async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const scorecard = await generateOperatorScorecard(prisma, parseInt(days));
      res.json(scorecard);
    } catch (error) {
      res.status(500).json({ error: 'Operator scorecard failed' });
    }
  });

  /**
   * @route POST /api/reports/schedule
   * @desc Schedule automated report delivery
   */
  router.post('/schedule', async (req, res) => {
    try {
      const { reportType, schedule, recipients, format = 'pdf' } = req.body;

      const scheduled = await prisma.scheduledReport.create({
        data: {
          reportType,
          schedule, // cron expression
          recipients: JSON.stringify(recipients),
          format,
          isActive: true
        }
      });

      res.json({ success: true, scheduled });
    } catch (error) {
      res.status(500).json({ error: 'Failed to schedule report' });
    }
  });

  /**
   * @route GET /api/reports/narrative/:type
   * @desc Get AI-generated narrative report
   */
  router.get('/narrative/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const { period = 'week' } = req.query;
      const narrative = await generateNarrative(prisma, type, period);
      res.json(narrative);
    } catch (error) {
      res.status(500).json({ error: 'Narrative generation failed' });
    }
  });

  return router;
}

/**
 * Generate executive brief
 */
async function generateExecutiveBrief(prisma, period) {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const previousFrom = new Date(dateFrom.getTime() - days * 24 * 60 * 60 * 1000);

  // Current period metrics
  const currentMetrics = await getMetricsForPeriod(prisma, dateFrom, new Date());
  const previousMetrics = await getMetricsForPeriod(prisma, previousFrom, dateFrom);

  // Calculate trends
  const accuracyChange = currentMetrics.accuracyScore - previousMetrics.accuracyScore;
  const discrepancyChange = currentMetrics.totalDiscrepancies - previousMetrics.totalDiscrepancies;
  const writeoffChange = currentMetrics.totalWriteoffs - previousMetrics.totalWriteoffs;

  // Top issues
  const topIssues = await prisma.discrepancy.findMany({
    where: {
      createdAt: { gte: dateFrom },
      severity: { in: ['critical', 'high'] }
    },
    orderBy: { varianceValue: 'desc' },
    take: 5
  });

  // Key wins (resolved issues)
  const resolved = await prisma.discrepancy.findMany({
    where: {
      status: 'RESOLVED',
      updatedAt: { gte: dateFrom }
    },
    orderBy: { varianceValue: 'desc' },
    take: 5
  });

  return {
    reportDate: new Date().toISOString(),
    period: { from: dateFrom, to: new Date(), days },

    headline: generateHeadline(currentMetrics, accuracyChange),

    keyMetrics: {
      current: currentMetrics,
      previous: previousMetrics,
      changes: {
        accuracyScore: {
          value: accuracyChange,
          direction: accuracyChange > 0 ? 'up' : accuracyChange < 0 ? 'down' : 'flat',
          interpretation: interpretAccuracyChange(accuracyChange)
        },
        discrepancies: {
          value: discrepancyChange,
          direction: discrepancyChange < 0 ? 'improved' : discrepancyChange > 0 ? 'worsened' : 'stable',
          interpretation: interpretDiscrepancyChange(discrepancyChange)
        },
        writeoffs: {
          value: writeoffChange,
          direction: writeoffChange < 0 ? 'improved' : writeoffChange > 0 ? 'worsened' : 'stable',
          interpretation: interpretWriteoffChange(writeoffChange)
        }
      }
    },

    topIssues: topIssues.map(i => ({
      type: i.type,
      severity: i.severity,
      sku: i.sku,
      location: i.locationCode,
      impact: i.varianceValue,
      description: i.description
    })),

    wins: resolved.map(r => ({
      type: r.type,
      sku: r.sku,
      location: r.locationCode,
      resolved: r.varianceValue,
      rootCause: r.rootCause
    })),

    recommendations: generateExecutiveRecommendations(currentMetrics, accuracyChange, topIssues),

    forecast: generateSimpleForecast(currentMetrics, accuracyChange)
  };
}

/**
 * Get metrics for a period
 */
async function getMetricsForPeriod(prisma, dateFrom, dateTo) {
  // Accuracy from cycle counts
  const accuracyData = await prisma.$queryRaw`
    SELECT
      COUNT(*) as total_counts,
      SUM(CASE WHEN ABS("variancePercent") <= 1 THEN 1 ELSE 0 END) as accurate_counts,
      AVG(ABS("variancePercent")) as avg_variance_percent
    FROM cycle_count_snapshots
    WHERE "countDate" BETWEEN ${dateFrom} AND ${dateTo}
  `;

  // Discrepancy counts
  const discrepancies = await prisma.$queryRaw`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
      SUM(ABS("varianceValue")) as total_variance_value
    FROM discrepancies
    WHERE "createdAt" BETWEEN ${dateFrom} AND ${dateTo}
  `;

  // Adjustments (write-offs)
  const adjustments = await prisma.$queryRaw`
    SELECT
      SUM(ABS("adjustmentQty")) as total_adjusted,
      COUNT(*) as adjustment_count
    FROM adjustment_snapshots
    WHERE "adjustmentDate" BETWEEN ${dateFrom} AND ${dateTo}
  `;

  const accuracy = accuracyData[0];
  const disc = discrepancies[0];
  const adj = adjustments[0];

  return {
    accuracyScore: accuracy?.total_counts > 0
      ? (Number(accuracy.accurate_counts) / Number(accuracy.total_counts)) * 100
      : 0,
    avgVariancePercent: Number(accuracy?.avg_variance_percent || 0),
    totalDiscrepancies: Number(disc?.total || 0),
    criticalDiscrepancies: Number(disc?.critical || 0),
    highDiscrepancies: Number(disc?.high || 0),
    totalVarianceValue: Number(disc?.total_variance_value || 0),
    totalWriteoffs: Number(adj?.total_adjusted || 0),
    adjustmentCount: Number(adj?.adjustment_count || 0)
  };
}

/**
 * Generate weekly summary
 */
async function generateWeeklySummary(prisma, weekStart) {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const metrics = await getMetricsForPeriod(prisma, weekStart, weekEnd);

  // Daily breakdown
  const dailyBreakdown = await prisma.$queryRaw`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as discrepancies,
      SUM(CASE WHEN severity IN ('critical', 'high') THEN 1 ELSE 0 END) as serious
    FROM discrepancies
    WHERE "createdAt" BETWEEN ${weekStart} AND ${weekEnd}
    GROUP BY DATE("createdAt")
    ORDER BY date
  `;

  // Top problem areas
  const topLocations = await prisma.$queryRaw`
    SELECT "locationCode", COUNT(*) as issues
    FROM discrepancies
    WHERE "createdAt" BETWEEN ${weekStart} AND ${weekEnd}
    GROUP BY "locationCode"
    ORDER BY issues DESC
    LIMIT 5
  `;

  const topSKUs = await prisma.$queryRaw`
    SELECT sku, COUNT(*) as issues, SUM(ABS("varianceValue")) as value
    FROM discrepancies
    WHERE "createdAt" BETWEEN ${weekStart} AND ${weekEnd}
    GROUP BY sku
    ORDER BY value DESC
    LIMIT 5
  `;

  return {
    week: { start: weekStart, end: weekEnd },
    generatedAt: new Date().toISOString(),

    summary: metrics,

    narrative: generateWeeklyNarrative(metrics, dailyBreakdown),

    dailyBreakdown: dailyBreakdown.map(d => ({
      date: d.date,
      discrepancies: Number(d.discrepancies),
      serious: Number(d.serious)
    })),

    problemAreas: {
      locations: topLocations.map(l => ({
        locationCode: l.locationCode,
        issues: Number(l.issues)
      })),
      skus: topSKUs.map(s => ({
        sku: s.sku,
        issues: Number(s.issues),
        value: Number(s.value)
      }))
    }
  };
}

/**
 * Analyze inventory accuracy trend
 */
async function analyzeAccuracyTrend(prisma, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const trend = await prisma.$queryRaw`
    SELECT
      DATE("countDate") as date,
      COUNT(*) as count_count,
      AVG(ABS("variancePercent")) as avg_variance,
      SUM(CASE WHEN ABS("variancePercent") <= 1 THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as accuracy_rate
    FROM cycle_count_snapshots
    WHERE "countDate" >= ${dateFrom}
    GROUP BY DATE("countDate")
    ORDER BY date
  `;

  // Calculate trend line
  const dataPoints = trend.map((t, i) => ({
    x: i,
    y: Number(t.accuracy_rate)
  }));

  const trendLine = calculateTrendLine(dataPoints);

  return {
    period: { from: dateFrom, to: new Date() },
    dataPoints: trend.map(t => ({
      date: t.date,
      countCount: Number(t.count_count),
      avgVariance: Number(t.avg_variance),
      accuracyRate: Number(t.accuracy_rate)
    })),
    trend: {
      direction: trendLine.slope > 0.1 ? 'improving' :
                 trendLine.slope < -0.1 ? 'declining' : 'stable',
      slope: trendLine.slope,
      projectedAccuracy: trendLine.slope * (dataPoints.length + 30) + trendLine.intercept
    },
    interpretation: interpretAccuracyTrend(trendLine)
  };
}

/**
 * Analyze write-offs
 */
async function analyzeWriteoffs(prisma, period) {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // By reason
  const byReason = await prisma.$queryRaw`
    SELECT
      reason,
      COUNT(*) as count,
      SUM(ABS("adjustmentQty")) as total_qty,
      AVG(ABS("adjustmentQty")) as avg_qty
    FROM adjustment_snapshots
    WHERE "adjustmentDate" >= ${dateFrom}
    GROUP BY reason
    ORDER BY total_qty DESC
  `;

  // By location
  const byLocation = await prisma.$queryRaw`
    SELECT
      "locationCode",
      COUNT(*) as count,
      SUM(ABS("adjustmentQty")) as total_qty
    FROM adjustment_snapshots
    WHERE "adjustmentDate" >= ${dateFrom}
    GROUP BY "locationCode"
    ORDER BY total_qty DESC
    LIMIT 10
  `;

  // By SKU
  const bySKU = await prisma.$queryRaw`
    SELECT
      sku,
      COUNT(*) as count,
      SUM(ABS("adjustmentQty")) as total_qty
    FROM adjustment_snapshots
    WHERE "adjustmentDate" >= ${dateFrom}
    GROUP BY sku
    ORDER BY total_qty DESC
    LIMIT 10
  `;

  // Trend over time
  const trend = await prisma.$queryRaw`
    SELECT
      DATE("adjustmentDate") as date,
      SUM(ABS("adjustmentQty")) as daily_total
    FROM adjustment_snapshots
    WHERE "adjustmentDate" >= ${dateFrom}
    GROUP BY DATE("adjustmentDate")
    ORDER BY date
  `;

  const totalWriteoffs = byReason.reduce((sum, r) => sum + Number(r.total_qty), 0);

  return {
    period: { from: dateFrom, to: new Date() },
    totalWriteoffs,

    byReason: byReason.map(r => ({
      reason: r.reason,
      count: Number(r.count),
      totalQty: Number(r.total_qty),
      avgQty: Number(r.avg_qty),
      percentOfTotal: (Number(r.total_qty) / totalWriteoffs) * 100
    })),

    topLocations: byLocation.map(l => ({
      locationCode: l.locationCode,
      count: Number(l.count),
      totalQty: Number(l.total_qty)
    })),

    topSKUs: bySKU.map(s => ({
      sku: s.sku,
      count: Number(s.count),
      totalQty: Number(s.total_qty)
    })),

    trend: trend.map(t => ({
      date: t.date,
      dailyTotal: Number(t.daily_total)
    })),

    narrative: generateWriteoffNarrative(byReason, totalWriteoffs)
  };
}

/**
 * Generate forecast
 */
async function generateForecast(prisma, horizonDays) {
  const historicalDays = 90;
  const dateFrom = new Date(Date.now() - historicalDays * 24 * 60 * 60 * 1000);

  // Get historical accuracy trend
  const history = await prisma.$queryRaw`
    SELECT
      DATE("countDate") as date,
      SUM(CASE WHEN ABS("variancePercent") <= 1 THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as accuracy
    FROM cycle_count_snapshots
    WHERE "countDate" >= ${dateFrom}
    GROUP BY DATE("countDate")
    ORDER BY date
  `;

  // Get historical discrepancy trend
  const discrepancyHistory = await prisma.$queryRaw`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM discrepancies
    WHERE "createdAt" >= ${dateFrom}
    GROUP BY DATE("createdAt")
    ORDER BY date
  `;

  // Calculate trend lines
  const accuracyData = history.map((h, i) => ({ x: i, y: Number(h.accuracy) }));
  const discrepancyData = discrepancyHistory.map((d, i) => ({ x: i, y: Number(d.count) }));

  const accuracyTrend = calculateTrendLine(accuracyData);
  const discrepancyTrend = calculateTrendLine(discrepancyData);

  // Project forward
  const forecastDates = [];
  for (let i = 0; i < horizonDays; i++) {
    const date = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000);
    const dayIndex = accuracyData.length + i;

    forecastDates.push({
      date: date.toISOString().split('T')[0],
      projectedAccuracy: Math.max(0, Math.min(100,
        accuracyTrend.slope * dayIndex + accuracyTrend.intercept
      )),
      projectedDiscrepancies: Math.max(0,
        discrepancyTrend.slope * dayIndex + discrepancyTrend.intercept
      )
    });
  }

  // Generate risk assessment
  const endAccuracy = forecastDates[forecastDates.length - 1].projectedAccuracy;
  const currentAccuracy = accuracyData.length > 0 ? accuracyData[accuracyData.length - 1].y : 0;

  return {
    generatedAt: new Date().toISOString(),
    horizon: horizonDays,

    currentState: {
      accuracy: currentAccuracy,
      avgDailyDiscrepancies: discrepancyData.length > 0
        ? discrepancyData.reduce((sum, d) => sum + d.y, 0) / discrepancyData.length
        : 0
    },

    forecast: forecastDates,

    trends: {
      accuracy: {
        direction: accuracyTrend.slope > 0.1 ? 'improving' :
                   accuracyTrend.slope < -0.1 ? 'declining' : 'stable',
        changePerDay: accuracyTrend.slope
      },
      discrepancies: {
        direction: discrepancyTrend.slope > 0.1 ? 'increasing' :
                   discrepancyTrend.slope < -0.1 ? 'decreasing' : 'stable',
        changePerDay: discrepancyTrend.slope
      }
    },

    riskAssessment: {
      level: endAccuracy < 90 ? 'HIGH' : endAccuracy < 95 ? 'MEDIUM' : 'LOW',
      message: generateRiskMessage(currentAccuracy, endAccuracy, horizonDays)
    },

    recommendations: generateForecastRecommendations(accuracyTrend, discrepancyTrend)
  };
}

/**
 * Summarize root causes
 */
async function summarizeRootCauses(prisma, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const byCause = await prisma.$queryRaw`
    SELECT
      "rootCauseCategory" as category,
      COUNT(*) as count,
      SUM(ABS(variance)) as total_variance
    FROM discrepancies
    WHERE "createdAt" >= ${dateFrom}
      AND "rootCauseCategory" IS NOT NULL
    GROUP BY "rootCauseCategory"
    ORDER BY count DESC
  `;

  return {
    period: { from: dateFrom, to: new Date() },
    summary: byCause.map(c => ({
      category: c.category,
      count: Number(c.count),
      totalVariance: Number(c.total_variance)
    })),
    narrative: generateRootCauseNarrative(byCause)
  };
}

/**
 * Generate operator scorecard
 */
async function generateOperatorScorecard(prisma, days) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const operators = await prisma.$queryRaw`
    SELECT
      a."userId",
      u."fullName" as operator_name,
      COUNT(*) as adjustment_count,
      SUM(ABS(a."adjustmentQty")) as total_adjusted,
      COUNT(DISTINCT a."locationCode") as locations,
      COUNT(DISTINCT a.sku) as skus
    FROM adjustment_snapshots a
    LEFT JOIN users u ON a."userId" = u.id
    WHERE a."adjustmentDate" >= ${dateFrom}
      AND a."userId" IS NOT NULL
    GROUP BY a."userId", u."fullName"
    ORDER BY total_adjusted DESC
  `;

  return {
    period: { from: dateFrom, to: new Date() },
    operators: operators.map(op => ({
      userId: op.userId,
      name: op.operator_name,
      adjustmentCount: Number(op.adjustment_count),
      totalAdjusted: Number(op.total_adjusted),
      locationsWorked: Number(op.locations),
      skusHandled: Number(op.skus),
      score: calculateOperatorScore(op)
    }))
  };
}

/**
 * Generate AI narrative
 */
async function generateNarrative(prisma, type, period) {
  // This would ideally use AI to generate natural language narratives
  // For now, we use template-based generation

  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const metrics = await getMetricsForPeriod(
    prisma,
    new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    new Date()
  );

  const narratives = {
    accuracy: `Over the past ${period}, inventory accuracy ${
      metrics.accuracyScore > 95 ? 'remained strong' :
      metrics.accuracyScore > 90 ? 'was acceptable but has room for improvement' :
      'needs immediate attention'
    } at ${metrics.accuracyScore.toFixed(1)}%. ${
      metrics.criticalDiscrepancies > 0
        ? `We identified ${metrics.criticalDiscrepancies} critical issues requiring immediate attention.`
        : 'No critical issues were identified.'
    }`,

    writeoffs: `Write-offs totaled ${metrics.totalWriteoffs.toLocaleString()} units across ${
      metrics.adjustmentCount
    } adjustments. ${
      metrics.totalWriteoffs > 1000
        ? 'This represents a significant opportunity for improvement.'
        : 'This is within acceptable parameters.'
    }`,

    recommendations: generateNarrativeRecommendations(metrics)
  };

  return {
    type,
    period,
    generatedAt: new Date().toISOString(),
    sections: narratives
  };
}

// Helper functions
function getLastWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff - 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function calculateTrendLine(dataPoints) {
  if (dataPoints.length < 2) return { slope: 0, intercept: 0 };

  const n = dataPoints.length;
  const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
  const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n || 0;

  return { slope, intercept };
}

function generateHeadline(metrics, accuracyChange) {
  if (metrics.criticalDiscrepancies > 5) {
    return `ALERT: ${metrics.criticalDiscrepancies} critical inventory issues require attention`;
  }
  if (accuracyChange > 2) {
    return `Inventory accuracy improved by ${accuracyChange.toFixed(1)} percentage points`;
  }
  if (accuracyChange < -2) {
    return `Inventory accuracy declined by ${Math.abs(accuracyChange).toFixed(1)} percentage points`;
  }
  return `Inventory operations stable at ${metrics.accuracyScore.toFixed(1)}% accuracy`;
}

function interpretAccuracyChange(change) {
  if (change > 2) return 'Significant improvement in inventory accuracy';
  if (change > 0) return 'Slight improvement in accuracy';
  if (change < -2) return 'Accuracy declining - investigation recommended';
  if (change < 0) return 'Minor decrease in accuracy';
  return 'Accuracy stable';
}

function interpretDiscrepancyChange(change) {
  if (change < -10) return 'Significant reduction in discrepancies';
  if (change < 0) return 'Fewer discrepancies than previous period';
  if (change > 10) return 'Increase in discrepancies - action needed';
  if (change > 0) return 'Slight increase in discrepancies';
  return 'Discrepancy rate stable';
}

function interpretWriteoffChange(change) {
  if (change < -100) return 'Major reduction in write-offs';
  if (change < 0) return 'Write-offs decreased';
  if (change > 100) return 'Significant increase in write-offs';
  if (change > 0) return 'Write-offs slightly increased';
  return 'Write-offs stable';
}

function interpretAccuracyTrend(trendLine) {
  if (trendLine.slope > 0.5) return 'Strong positive trend - current initiatives are working';
  if (trendLine.slope > 0.1) return 'Gradual improvement in accuracy';
  if (trendLine.slope < -0.5) return 'Concerning decline - immediate action recommended';
  if (trendLine.slope < -0.1) return 'Slight negative trend - monitor closely';
  return 'Accuracy trending stable';
}

function generateExecutiveRecommendations(metrics, accuracyChange, topIssues) {
  const recommendations = [];

  if (metrics.criticalDiscrepancies > 0) {
    recommendations.push({
      priority: 'URGENT',
      action: 'Address critical discrepancies immediately',
      rationale: `${metrics.criticalDiscrepancies} critical issues identified`
    });
  }

  if (accuracyChange < -1) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Investigate root cause of accuracy decline',
      rationale: `Accuracy dropped ${Math.abs(accuracyChange).toFixed(1)} percentage points`
    });
  }

  if (metrics.totalWriteoffs > 500) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Review write-off patterns for prevention opportunities',
      rationale: `${metrics.totalWriteoffs} units written off this period`
    });
  }

  return recommendations;
}

function generateSimpleForecast(metrics, trend) {
  return {
    nextWeek: {
      projectedAccuracy: metrics.accuracyScore + (trend * 7),
      confidence: 'medium'
    },
    risk: metrics.accuracyScore < 90 ? 'HIGH' : metrics.accuracyScore < 95 ? 'MEDIUM' : 'LOW'
  };
}

function generateWeeklyNarrative(metrics, dailyBreakdown) {
  const totalDiscrepancies = dailyBreakdown.reduce((sum, d) => sum + Number(d.discrepancies), 0);
  const peakDay = dailyBreakdown.reduce((max, d) =>
    Number(d.discrepancies) > Number(max.discrepancies) ? d : max,
    dailyBreakdown[0] || { date: 'N/A', discrepancies: 0 }
  );

  return `This week saw ${totalDiscrepancies} inventory discrepancies identified. ` +
    `Peak activity was on ${peakDay.date} with ${peakDay.discrepancies} issues. ` +
    `Current accuracy stands at ${metrics.accuracyScore.toFixed(1)}%.`;
}

function generateWriteoffNarrative(byReason, total) {
  if (byReason.length === 0) return 'No write-offs recorded for this period.';

  const topReason = byReason[0];
  return `Total write-offs: ${total.toLocaleString()} units. ` +
    `Primary reason: "${topReason.reason}" accounting for ${
      ((Number(topReason.total_qty) / total) * 100).toFixed(1)
    }% of all adjustments.`;
}

function generateRootCauseNarrative(byCause) {
  if (byCause.length === 0) return 'No root causes documented for this period.';

  const topCause = byCause[0];
  return `The most common root cause category was "${topCause.category}" with ${
    Number(topCause.count)
  } occurrences.`;
}

function generateRiskMessage(current, projected, days) {
  const change = projected - current;
  if (change < -5) {
    return `WARNING: Accuracy projected to decline from ${current.toFixed(1)}% to ${
      projected.toFixed(1)
    }% in ${days} days if current trends continue.`;
  }
  if (change > 2) {
    return `POSITIVE: Accuracy projected to improve from ${current.toFixed(1)}% to ${
      projected.toFixed(1)
    }% in ${days} days.`;
  }
  return `Accuracy projected to remain stable around ${projected.toFixed(1)}% over the next ${days} days.`;
}

function generateForecastRecommendations(accuracyTrend, discrepancyTrend) {
  const recommendations = [];

  if (accuracyTrend.slope < -0.1) {
    recommendations.push('Increase cycle count frequency in problem areas');
    recommendations.push('Review recent process changes that may have impacted accuracy');
  }

  if (discrepancyTrend.slope > 0.1) {
    recommendations.push('Analyze root causes of increasing discrepancies');
    recommendations.push('Consider targeted training for high-error operators');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current practices');
    recommendations.push('Continue monitoring key metrics');
  }

  return recommendations;
}

function generateNarrativeRecommendations(metrics) {
  const recs = [];

  if (metrics.accuracyScore < 95) {
    recs.push('Focus cycle counting on locations with known discrepancies');
  }
  if (metrics.criticalDiscrepancies > 0) {
    recs.push('Prioritize investigation of critical issues');
  }
  if (metrics.totalWriteoffs > 100) {
    recs.push('Analyze write-off patterns for prevention opportunities');
  }

  return recs.length > 0 ? recs.join('. ') + '.' : 'No immediate actions required.';
}

function calculateOperatorScore(op) {
  // Simple scoring: lower adjustments = better score
  const avgAdjustment = Number(op.total_adjusted) / Number(op.adjustment_count);
  if (avgAdjustment < 5) return 'A';
  if (avgAdjustment < 15) return 'B';
  if (avgAdjustment < 30) return 'C';
  return 'D';
}

export {
  REPORT_TYPES,
  generateExecutiveBrief,
  generateWeeklySummary,
  analyzeAccuracyTrend,
  analyzeWriteoffs,
  generateForecast,
  summarizeRootCauses,
  generateOperatorScorecard
};
