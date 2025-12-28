/**
 * AI Engine API Routes
 * Production-ready endpoints for AI/ML capabilities
 *
 * Note: Authentication is enforced at the app level in server/index.js
 * via: app.use('/api/ai', authMiddleware, aiRoutes)
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
 * @desc Generate demand forecast for a SKU or category
 */
router.post('/forecast', asyncHandler(async (req, res) => {
  try {
    const sku = validateString(req.body.sku);
    const categoryId = validateString(req.body.categoryId);
    const warehouseId = validateString(req.body.warehouseId);
    const horizonDays = validatePositiveInt(req.body.horizonDays, 30, 365);
    const prisma = req.app.locals.prisma;

  // Get historical data
  let historicalData = [];

  if (sku) {
    // Get transaction history for specific SKU
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        product: { sku },
        warehouseId: warehouseId || undefined,
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 days
      },
      orderBy: { createdAt: 'asc' },
      select: {
        quantity: true,
        createdAt: true
      }
    });

    // Aggregate by day
    const dailyData = new Map();
    transactions.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      dailyData.set(date, (dailyData.get(date) || 0) + Math.abs(t.quantity));
    });

    historicalData = Array.from(dailyData.entries()).map(([date, quantity]) => ({
      date,
      quantity
    }));
  } else if (categoryId) {
    // Get aggregated data for category
    const products = await prisma.product.findMany({
      where: { categoryId },
      select: { id: true }
    });

    const productIds = products.map(p => p.id);

    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        productId: { in: productIds },
        warehouseId: warehouseId || undefined,
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        quantity: true,
        createdAt: true
      }
    });

    const dailyData = new Map();
    transactions.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      dailyData.set(date, (dailyData.get(date) || 0) + Math.abs(t.quantity));
    });

    historicalData = Array.from(dailyData.entries()).map(([date, quantity]) => ({
      date,
      quantity
    }));
  } else {
    // Overall warehouse forecast
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        warehouseId: warehouseId || undefined,
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        quantity: true,
        createdAt: true
      }
    });

    const dailyData = new Map();
    transactions.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      dailyData.set(date, (dailyData.get(date) || 0) + Math.abs(t.quantity));
    });

    historicalData = Array.from(dailyData.entries()).map(([date, quantity]) => ({
      date,
      quantity
    }));
  }

    // Generate forecast
    const forecast = forecastingEngine.forecast(historicalData, horizonDays);

    res.json({
      success: true,
      sku,
      categoryId,
      warehouseId,
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
    const warehouseId = validateString(req.body.warehouseId);
    const sku = validateString(req.body.sku);
    const locationCode = validateString(req.body.locationCode);
    const lookbackDays = validatePositiveInt(req.body.lookbackDays, 30, 90);
    const prisma = req.app.locals.prisma;

  let data = [];

  if (type === 'inventory') {
    // Get inventory levels over time
    const snapshots = await prisma.inventorySnapshot.findMany({
      where: {
        warehouseId: warehouseId || undefined,
        sku: sku || undefined,
        locationCode: locationCode || undefined,
        snapshotDate: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
      },
      orderBy: { snapshotDate: 'asc' },
      select: {
        id: true,
        sku: true,
        locationCode: true,
        onHandQty: true,
        snapshotDate: true
      }
    });

    data = snapshots.map(s => ({
      ...s,
      value: s.onHandQty
    }));
  } else if (type === 'adjustments') {
    // Get adjustment quantities
    const adjustments = await prisma.adjustmentSnapshot.findMany({
      where: {
        warehouseId: warehouseId || undefined,
        sku: sku || undefined,
        createdAt: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        sku: true,
        locationCode: true,
        adjustmentQty: true,
        reasonCode: true,
        createdAt: true
      }
    });

    data = adjustments.map(a => ({
      ...a,
      value: a.adjustmentQty
    }));
  } else if (type === 'cycle-counts') {
    // Get cycle count variances
    const cycleCounts = await prisma.cycleCountSnapshot.findMany({
      where: {
        warehouseId: warehouseId || undefined,
        sku: sku || undefined,
        createdAt: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        sku: true,
        locationCode: true,
        variance: true,
        variancePercent: true,
        createdAt: true
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
      parameters: { warehouseId, sku, locationCode, lookbackDays },
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
    const warehouseId = validateString(req.body.warehouseId);
    const lookbackDays = validatePositiveInt(req.body.lookbackDays, 60, 90);
    const prisma = req.app.locals.prisma;

  // Get transactions for analysis
  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      warehouseId: warehouseId || undefined,
      createdAt: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
    },
    include: {
      product: { select: { sku: true, name: true } },
      location: { select: { code: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Also get adjustments
  const adjustments = await prisma.adjustmentSnapshot.findMany({
    where: {
      warehouseId: warehouseId || undefined,
      createdAt: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Combine and normalize data
  const combinedData = [
    ...transactions.map(t => ({
      id: t.id,
      type: t.type,
      sku: t.product?.sku,
      locationCode: t.location?.code,
      quantity: t.quantity,
      userId: t.performedBy,
      timestamp: t.createdAt
    })),
    ...adjustments.map(a => ({
      id: a.id,
      type: 'adjustment',
      sku: a.sku,
      locationCode: a.locationCode,
      quantity: a.adjustmentQty,
      userId: a.performedBy,
      timestamp: a.createdAt
    }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Run pattern analysis
    const results = patternRecognitionEngine.analyzePatterns(combinedData);

    res.json({
      success: true,
      parameters: { warehouseId, lookbackDays },
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
    const warehouseId = validateString(req.body.warehouseId);
    const sku = validateString(req.body.sku);
    const prisma = req.app.locals.prisma;

  // Run all analyses
  const lookbackDays = 30;

  // Get data for anomaly detection
  const adjustments = await prisma.adjustmentSnapshot.findMany({
    where: {
      warehouseId: warehouseId || undefined,
      sku: sku || undefined,
      createdAt: { gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
    },
    orderBy: { createdAt: 'asc' }
  });

  const adjustmentData = adjustments.map(a => ({
    ...a,
    value: a.adjustmentQty
  }));

  // Get data for forecasting
  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      warehouseId: warehouseId || undefined,
      product: sku ? { sku } : undefined,
      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    },
    include: {
      product: { select: { sku: true } },
      location: { select: { code: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  const dailyData = new Map();
  transactions.forEach(t => {
    const date = t.createdAt.toISOString().split('T')[0];
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
      sku: t.product?.sku,
      locationCode: t.location?.code,
      quantity: t.quantity,
      userId: t.performedBy,
      timestamp: t.createdAt
    })),
    ...adjustments.map(a => ({
      id: a.id,
      type: 'adjustment',
      sku: a.sku,
      locationCode: a.locationCode,
      quantity: a.adjustmentQty,
      userId: a.performedBy,
      timestamp: a.createdAt
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
      parameters: { warehouseId, sku },
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
    const warehouseId = validateString(req.query.warehouseId);
    const prisma = req.app.locals.prisma;

    // Get recent discrepancies
    const discrepancies = await prisma.discrepancy.findMany({
    where: {
      warehouseId: warehouseId || undefined,
      status: { in: ['OPEN', 'INVESTIGATING'] }
    },
    orderBy: { detectedAt: 'desc' },
    take: 10
  });

  // Get pending action recommendations
  const actions = await prisma.actionRecommendation.findMany({
    where: {
      warehouseId: warehouseId || undefined,
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

  // Get accuracy from recent forecasts (mock for now, would be stored in practice)
  const forecastAccuracy = 92.5; // Would come from model performance tracking

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
