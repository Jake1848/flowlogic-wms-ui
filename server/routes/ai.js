/**
 * AI Engine API Routes
 * Production-ready endpoints for AI/ML capabilities
 * Updated for AI Intelligence Platform - uses snapshot tables
 */
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  forecastingEngine,
  anomalyDetectionEngine,
  patternRecognitionEngine,
  recommendationEngine
} from '../modules/ai-engine/index.js';

const router = express.Router();

/**
 * Input validation helper
 */
const validatePositiveInt = (value, defaultVal, max = 365) => {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1) return defaultVal;
  return Math.min(num, max);
};

const validateString = (value, maxLength = 100) => {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength) || null;
};

/**
 * @route POST /api/ai/forecast
 * @desc Generate demand forecast for a SKU using transaction snapshots
 */
router.post('/forecast', asyncHandler(async (req, res) => {
  try {
    const sku = validateString(req.body.sku);
    const horizonDays = validatePositiveInt(req.body.horizonDays, 30, 365);
    const prisma = req.app.locals.prisma;

    // Get historical transaction data from snapshots
    const transactions = await prisma.transactionSnapshot.findMany({
      where: {
        sku: sku || undefined,
        transactionDate: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { transactionDate: 'asc' },
      select: {
        quantity: true,
        transactionDate: true
      }
    });

    // Aggregate by day
    const dailyData = new Map();
    transactions.forEach(t => {
      const date = t.transactionDate.toISOString().split('T')[0];
      dailyData.set(date, (dailyData.get(date) || 0) + Math.abs(t.quantity));
    });

    const historicalData = Array.from(dailyData.entries()).map(([date, quantity]) => ({
      date,
      quantity
    }));

    // Generate forecast
    const forecast = forecastingEngine.forecast(historicalData, horizonDays);

    res.json({
      success: true,
      sku,
      ...forecast
    });
  } catch (error) {
    console.error('Forecast error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Forecast generation failed',
      message: error.message || 'Insufficient data or internal error'
    });
  }
}));

/**
 * @route POST /api/ai/anomaly-detection
 * @desc Detect anomalies in inventory or transaction data
 */
router.post('/anomaly-detection', asyncHandler(async (req, res) => {
  try {
    const validTypes = ['inventory', 'adjustments', 'cycle-counts'];
    const type = validTypes.includes(req.body.type) ? req.body.type : 'inventory';
    const sku = validateString(req.body.sku);
    const locationCode = validateString(req.body.locationCode);
    const lookbackDays = validatePositiveInt(req.body.lookbackDays, 30, 90);
    const prisma = req.app.locals.prisma;

    let data = [];

    if (type === 'inventory') {
      const snapshots = await prisma.inventorySnapshot.findMany({
        where: {
          sku: sku || undefined,
          locationCode: locationCode || undefined,
          snapshotDate: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
        },
        orderBy: { snapshotDate: 'asc' },
        select: {
          id: true,
          sku: true,
          locationCode: true,
          quantityOnHand: true,
          snapshotDate: true
        }
      });

      data = snapshots.map(s => ({
        ...s,
        value: s.quantityOnHand
      }));
    } else if (type === 'adjustments') {
      const adjustments = await prisma.adjustmentSnapshot.findMany({
        where: {
          sku: sku || undefined,
          locationCode: locationCode || undefined,
          adjustmentDate: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
        },
        orderBy: { adjustmentDate: 'asc' },
        select: {
          id: true,
          sku: true,
          locationCode: true,
          adjustmentQty: true,
          reason: true,
          adjustmentDate: true
        }
      });

      data = adjustments.map(a => ({
        ...a,
        value: a.adjustmentQty
      }));
    } else if (type === 'cycle-counts') {
      const cycleCounts = await prisma.cycleCountSnapshot.findMany({
        where: {
          sku: sku || undefined,
          locationCode: locationCode || undefined,
          countDate: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
        },
        orderBy: { countDate: 'asc' },
        select: {
          id: true,
          sku: true,
          locationCode: true,
          variance: true,
          variancePercent: true,
          countDate: true
        }
      });

      data = cycleCounts.map(c => ({
        ...c,
        value: c.variance
      }));
    }

    // Run anomaly detection
    const results = anomalyDetectionEngine.detect(data, 'value');

    res.json({
      success: true,
      type,
      parameters: { sku, locationCode, lookbackDays },
      ...results
    });
  } catch (error) {
    console.error('Anomaly detection error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Anomaly detection failed',
      message: error.message || 'Data unavailable or internal error'
    });
  }
}));

/**
 * @route POST /api/ai/pattern-analysis
 * @desc Analyze patterns in transactions
 */
router.post('/pattern-analysis', asyncHandler(async (req, res) => {
  try {
    const lookbackDays = validatePositiveInt(req.body.lookbackDays, 60, 90);
    const prisma = req.app.locals.prisma;

    // Get transactions from snapshots
    const transactions = await prisma.transactionSnapshot.findMany({
      where: {
        transactionDate: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
      },
      orderBy: { transactionDate: 'asc' }
    });

    // Get adjustments
    const adjustments = await prisma.adjustmentSnapshot.findMany({
      where: {
        adjustmentDate: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
      },
      orderBy: { adjustmentDate: 'asc' }
    });

    // Combine and normalize data
    const combinedData = [
      ...transactions.map(t => ({
        id: t.id,
        type: t.type,
        sku: t.sku,
        locationCode: t.fromLocation || t.toLocation,
        quantity: t.quantity,
        userId: t.userId,
        timestamp: t.transactionDate
      })),
      ...adjustments.map(a => ({
        id: a.id,
        type: 'adjustment',
        sku: a.sku,
        locationCode: a.locationCode,
        quantity: a.adjustmentQty,
        userId: a.userId,
        timestamp: a.adjustmentDate
      }))
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Run pattern analysis
    const results = patternRecognitionEngine.analyzePatterns(combinedData);

    res.json({
      success: true,
      parameters: { lookbackDays },
      ...results
    });
  } catch (error) {
    console.error('Pattern analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Pattern analysis failed',
      message: error.message || 'Data unavailable or internal error'
    });
  }
}));

/**
 * @route POST /api/ai/recommendations
 * @desc Generate AI recommendations based on comprehensive analysis
 */
router.post('/recommendations', asyncHandler(async (req, res) => {
  try {
    const sku = validateString(req.body.sku);
    const prisma = req.app.locals.prisma;
    const lookbackDays = 30;

    // Get adjustment data for anomaly detection
    const adjustments = await prisma.adjustmentSnapshot.findMany({
      where: {
        sku: sku || undefined,
        adjustmentDate: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
      },
      orderBy: { adjustmentDate: 'asc' }
    });

    const adjustmentData = adjustments.map(a => ({
      ...a,
      value: a.adjustmentQty
    }));

    // Get transaction data for forecasting
    const transactions = await prisma.transactionSnapshot.findMany({
      where: {
        sku: sku || undefined,
        transactionDate: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { transactionDate: 'asc' }
    });

    const dailyData = new Map();
    transactions.forEach(t => {
      const date = t.transactionDate.toISOString().split('T')[0];
      dailyData.set(date, (dailyData.get(date) || 0) + Math.abs(t.quantity));
    });

    const historicalData = Array.from(dailyData.entries()).map(([date, quantity]) => ({
      date,
      quantity
    }));

    // Run analyses
    const anomalies = anomalyDetectionEngine.detect(adjustmentData, 'value');
    const forecasts = forecastingEngine.forecast(historicalData, 30);

    // Pattern analysis
    const combinedTransactions = [
      ...transactions.map(t => ({
        id: t.id,
        type: t.type,
        sku: t.sku,
        locationCode: t.fromLocation || t.toLocation,
        quantity: t.quantity,
        userId: t.userId,
        timestamp: t.transactionDate
      })),
      ...adjustments.map(a => ({
        id: a.id,
        type: 'adjustment',
        sku: a.sku,
        locationCode: a.locationCode,
        quantity: a.adjustmentQty,
        userId: a.userId,
        timestamp: a.adjustmentDate
      }))
    ];

    const patterns = patternRecognitionEngine.analyzePatterns(combinedTransactions);

    // Generate recommendations
    const recommendations = recommendationEngine.generateRecommendations({
      anomalies,
      forecasts,
      patterns
    });

    res.json({
      success: true,
      parameters: { sku },
      analysis: {
        anomalies: anomalies.success ? anomalies.summary : null,
        forecasts: forecasts.success ? forecasts.summary : null,
        patterns: patterns.success ? patterns.summary : null
      },
      ...recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Recommendations generation failed',
      message: error.message || 'Data unavailable or internal error'
    });
  }
}));

/**
 * @route GET /api/ai/health
 * @desc Check AI engine health status
 */
router.get('/health', asyncHandler(async (req, res) => {
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    engines: {
      forecasting: 'active',
      anomalyDetection: 'active',
      patternRecognition: 'active',
      recommendations: 'active'
    },
    llm: {
      provider: 'anthropic',
      configured: anthropicConfigured,
      model: anthropicConfigured ? 'claude-sonnet-4-20250514' : null
    }
  });
}));

/**
 * @route GET /api/ai/dashboard
 * @desc Get AI dashboard summary
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    const prisma = req.app.locals.prisma;

    // Get recent discrepancies
    const discrepancies = await prisma.discrepancy.findMany({
      where: {
        status: { in: ['OPEN', 'INVESTIGATING'] }
      },
      orderBy: { detectedAt: 'desc' },
      take: 10
    });

    // Get pending action recommendations
    const actions = await prisma.actionRecommendation.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: { priority: 'asc' },
      take: 10
    });

    // Get recent AI analyses count
    const analysisCount = await prisma.investigation.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    // Calculate summary metrics
    const criticalIssues = discrepancies.filter(d => d.severity === 'critical').length;
    const highIssues = discrepancies.filter(d => d.severity === 'high').length;
    const pendingActions = actions.length;

    // Get accuracy from recent forecasts (mock for now)
    const forecastAccuracy = 92.5;

    res.json({
      success: true,
      summary: {
        openDiscrepancies: discrepancies.length,
        criticalIssues,
        highIssues,
        pendingActions,
        analysesLast24h: analysisCount,
        forecastAccuracy
      },
      recentDiscrepancies: discrepancies,
      topActions: actions,
      aiStatus: {
        lastAnalysis: new Date().toISOString(),
        modelsActive: 4,
        dataQuality: 'good'
      }
    });
  } catch (error) {
    console.error('AI Dashboard error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Dashboard data unavailable',
      message: error.message || 'Internal error'
    });
  }
}));

export default router;
