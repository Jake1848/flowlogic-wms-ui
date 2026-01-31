/**
 * FlowLogic AI Engine
 * Production-ready AI/ML capabilities for inventory intelligence
 * Focuses on anomaly detection, pattern recognition, and actionable recommendations
 */

/**
 * Anomaly Detection Engine
 * Multiple detection methods for robust anomaly identification
 */
export class AnomalyDetectionEngine {
  constructor(options = {}) {
    this.zScoreThreshold = options.zScoreThreshold || 2.5;
    this.iqrMultiplier = options.iqrMultiplier || 1.5;
    this.minDataPoints = options.minDataPoints || 10;
  }

  /**
   * Detect anomalies in inventory data
   * @param {Array} data - Array of data points with values
   * @param {string} valueKey - Key to extract value from data objects
   * @returns {Object} Anomaly detection results
   */
  detect(data, valueKey = 'value') {
    if (!data || data.length < this.minDataPoints) {
      return {
        success: false,
        error: 'Insufficient data for anomaly detection',
        minRequired: this.minDataPoints,
        provided: data?.length || 0
      };
    }

    const values = data.map(d => typeof d === 'object' ? d[valueKey] : d);

    // Multiple detection methods
    const zScoreAnomalies = this.detectByZScore(values);
    const iqrAnomalies = this.detectByIQR(values);
    const maaAnomalies = this.detectByMAD(values);

    // Combine results - anomaly must be flagged by at least 2 methods
    const anomalyIndices = new Set();
    const anomalyScores = new Map();

    [zScoreAnomalies, iqrAnomalies, maaAnomalies].forEach(method => {
      method.indices.forEach(idx => {
        const count = (anomalyScores.get(idx) || 0) + 1;
        anomalyScores.set(idx, count);
        if (count >= 2) {
          anomalyIndices.add(idx);
        }
      });
    });

    // Build anomaly details
    const anomalies = [];
    anomalyIndices.forEach(idx => {
      const value = values[idx];
      const stats = this.calculateStats(values);
      const deviation = Math.abs(value - stats.mean) / stats.stdDev;

      anomalies.push({
        index: idx,
        value,
        originalData: data[idx],
        severity: deviation > 4 ? 'critical' : deviation > 3 ? 'high' : 'medium',
        deviation: Math.round(deviation * 100) / 100,
        expectedRange: {
          lower: Math.round((stats.mean - 2 * stats.stdDev) * 100) / 100,
          upper: Math.round((stats.mean + 2 * stats.stdDev) * 100) / 100
        },
        detectedBy: [
          zScoreAnomalies.indices.includes(idx) && 'z-score',
          iqrAnomalies.indices.includes(idx) && 'iqr',
          maaAnomalies.indices.includes(idx) && 'mad'
        ].filter(Boolean)
      });
    });

    // Sort by severity
    anomalies.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const stats = this.calculateStats(values);

    return {
      success: true,
      anomalies,
      summary: {
        totalDataPoints: values.length,
        anomalyCount: anomalies.length,
        anomalyRate: Math.round((anomalies.length / values.length) * 10000) / 100,
        criticalCount: anomalies.filter(a => a.severity === 'critical').length,
        highCount: anomalies.filter(a => a.severity === 'high').length,
        mediumCount: anomalies.filter(a => a.severity === 'medium').length
      },
      statistics: {
        mean: Math.round(stats.mean * 100) / 100,
        median: stats.median,
        stdDev: Math.round(stats.stdDev * 100) / 100,
        min: stats.min,
        max: stats.max,
        q1: stats.q1,
        q3: stats.q3
      },
      thresholds: {
        zScore: this.zScoreThreshold,
        iqrMultiplier: this.iqrMultiplier
      }
    };
  }

  detectByZScore(values) {
    const stats = this.calculateStats(values);
    const indices = [];

    values.forEach((v, i) => {
      const zScore = Math.abs((v - stats.mean) / stats.stdDev);
      if (zScore > this.zScoreThreshold) {
        indices.push(i);
      }
    });

    return { method: 'z-score', indices };
  }

  detectByIQR(values) {
    const stats = this.calculateStats(values);
    const iqr = stats.q3 - stats.q1;
    const lowerBound = stats.q1 - this.iqrMultiplier * iqr;
    const upperBound = stats.q3 + this.iqrMultiplier * iqr;

    const indices = [];
    values.forEach((v, i) => {
      if (v < lowerBound || v > upperBound) {
        indices.push(i);
      }
    });

    return { method: 'iqr', indices };
  }

  detectByMAD(values) {
    // Median Absolute Deviation - robust to outliers
    const sorted = [...values].sort((a, b) => a - b);
    const median = this.getMedian(sorted);

    const absoluteDeviations = values.map(v => Math.abs(v - median));
    const mad = this.getMedian([...absoluteDeviations].sort((a, b) => a - b));

    // Modified Z-score using MAD
    const k = 1.4826; // Constant for normal distribution
    const threshold = 3.5;

    const indices = [];
    values.forEach((v, i) => {
      const modifiedZScore = mad !== 0 ? 0.6745 * (v - median) / mad : 0;
      if (Math.abs(modifiedZScore) > threshold) {
        indices.push(i);
      }
    });

    return { method: 'mad', indices };
  }

  calculateStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      stdDev,
      median: this.getMedian(sorted),
      min: sorted[0],
      max: sorted[n - 1],
      q1: this.getPercentile(sorted, 25),
      q3: this.getPercentile(sorted, 75)
    };
  }

  getMedian(sorted) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  getPercentile(sorted, p) {
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);

    if (lower === upper) return sorted[lower];

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
  }
}

/**
 * Pattern Recognition Engine
 * Identifies patterns in inventory movements and behaviors
 */
export class PatternRecognitionEngine {
  constructor() {
    this.patterns = [];
  }

  /**
   * Analyze inventory movements for patterns
   * @param {Array} transactions - Array of transaction records
   * @returns {Object} Detected patterns
   */
  analyzePatterns(transactions) {
    if (!transactions || transactions.length < 20) {
      return {
        success: false,
        error: 'Insufficient data for pattern analysis',
        minRequired: 20,
        provided: transactions?.length || 0
      };
    }

    const patterns = {
      temporal: this.detectTemporalPatterns(transactions),
      behavioral: this.detectBehavioralPatterns(transactions),
      correlations: this.detectCorrelations(transactions),
      anomalousSequences: this.detectAnomalousSequences(transactions)
    };

    return {
      success: true,
      patterns,
      summary: {
        totalTransactions: transactions.length,
        patternsDetected: Object.values(patterns).flat().length,
        highConfidencePatterns: Object.values(patterns)
          .flat()
          .filter(p => p.confidence >= 0.8).length
      }
    };
  }

  detectTemporalPatterns(transactions) {
    const patterns = [];

    // Group by hour of day
    const hourlyVolumes = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    transactions.forEach(t => {
      const hour = new Date(t.timestamp || t.createdAt).getHours();
      hourlyVolumes[hour] += Math.abs(t.quantity || t.adjustmentQty || 1);
      hourlyCounts[hour]++;
    });

    // Find peak hours
    const avgVolume = hourlyVolumes.reduce((a, b) => a + b, 0) / 24;
    for (let h = 0; h < 24; h++) {
      if (hourlyVolumes[h] > avgVolume * 2) {
        patterns.push({
          type: 'peak_hour',
          description: `High activity at ${h}:00`,
          hour: h,
          volume: hourlyVolumes[h],
          frequency: hourlyCounts[h],
          confidence: Math.min(0.95, hourlyCounts[h] / 10)
        });
      }
    }

    // Day of week patterns
    const dailyVolumes = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    transactions.forEach(t => {
      const day = new Date(t.timestamp || t.createdAt).getDay();
      dailyVolumes[day] += Math.abs(t.quantity || t.adjustmentQty || 1);
      dailyCounts[day]++;
    });

    const avgDaily = dailyVolumes.reduce((a, b) => a + b, 0) / 7;
    for (let d = 0; d < 7; d++) {
      if (dailyVolumes[d] > avgDaily * 1.5 || dailyVolumes[d] < avgDaily * 0.5) {
        patterns.push({
          type: dailyVolumes[d] > avgDaily ? 'high_day' : 'low_day',
          description: `${dailyVolumes[d] > avgDaily ? 'High' : 'Low'} activity on ${dayNames[d]}`,
          dayOfWeek: d,
          dayName: dayNames[d],
          volume: dailyVolumes[d],
          deviation: Math.round((dailyVolumes[d] / avgDaily - 1) * 100),
          confidence: Math.min(0.9, dailyCounts[d] / 5)
        });
      }
    }

    return patterns;
  }

  detectBehavioralPatterns(transactions) {
    const patterns = [];

    // Group by user/operator
    const userActivity = new Map();

    transactions.forEach(t => {
      const userId = t.userId || t.performedBy || 'unknown';
      if (!userActivity.has(userId)) {
        userActivity.set(userId, { count: 0, totalQty: 0, negativeCount: 0, adjustments: [] });
      }
      const ua = userActivity.get(userId);
      ua.count++;
      ua.totalQty += Math.abs(t.quantity || t.adjustmentQty || 0);
      if ((t.quantity || t.adjustmentQty || 0) < 0) {
        ua.negativeCount++;
      }
      ua.adjustments.push(t);
    });

    // Identify unusual user patterns
    const avgCount = [...userActivity.values()].reduce((sum, u) => sum + u.count, 0) / userActivity.size;

    userActivity.forEach((activity, userId) => {
      // High negative adjustment rate
      if (activity.count >= 5 && activity.negativeCount / activity.count > 0.7) {
        patterns.push({
          type: 'high_negative_rate',
          description: `User ${userId} has high negative adjustment rate`,
          userId,
          negativeRate: Math.round((activity.negativeCount / activity.count) * 100),
          totalTransactions: activity.count,
          confidence: Math.min(0.85, activity.count / 20)
        });
      }

      // Unusual volume per transaction
      const avgQtyPerTx = activity.totalQty / activity.count;
      if (avgQtyPerTx > 100) {
        patterns.push({
          type: 'high_volume_user',
          description: `User ${userId} processes high volumes per transaction`,
          userId,
          avgQuantity: Math.round(avgQtyPerTx),
          totalTransactions: activity.count,
          confidence: Math.min(0.8, activity.count / 10)
        });
      }
    });

    return patterns;
  }

  detectCorrelations(transactions) {
    const patterns = [];

    // Location-SKU correlations
    const locationSku = new Map();

    transactions.forEach(t => {
      const key = `${t.locationCode || t.location}|${t.sku}`;
      if (!locationSku.has(key)) {
        locationSku.set(key, { count: 0, issues: 0 });
      }
      const ls = locationSku.get(key);
      ls.count++;
      if (t.type?.includes('variance') || t.type?.includes('shortage') || (t.quantity || 0) < 0) {
        ls.issues++;
      }
    });

    // Find problematic location-SKU combinations
    locationSku.forEach((data, key) => {
      if (data.count >= 5 && data.issues / data.count > 0.5) {
        const [location, sku] = key.split('|');
        patterns.push({
          type: 'problem_location_sku',
          description: `Frequent issues with ${sku} at ${location}`,
          location,
          sku,
          issueRate: Math.round((data.issues / data.count) * 100),
          totalOccurrences: data.count,
          confidence: Math.min(0.85, data.count / 10)
        });
      }
    });

    return patterns;
  }

  detectAnomalousSequences(transactions) {
    const patterns = [];

    // Sort by timestamp
    const sorted = [...transactions].sort((a, b) =>
      new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt)
    );

    // Detect rapid consecutive adjustments (potential fraud indicator)
    for (let i = 0; i < sorted.length - 2; i++) {
      const t1 = sorted[i];
      const t2 = sorted[i + 1];
      const t3 = sorted[i + 2];

      const time1 = new Date(t1.timestamp || t1.createdAt);
      const time3 = new Date(t3.timestamp || t3.createdAt);
      const diffMinutes = (time3 - time1) / (1000 * 60);

      // 3+ adjustments to same SKU within 5 minutes
      if (diffMinutes < 5 && t1.sku === t2.sku && t2.sku === t3.sku) {
        patterns.push({
          type: 'rapid_adjustment_sequence',
          description: `Rapid consecutive adjustments to ${t1.sku}`,
          sku: t1.sku,
          timeSpanMinutes: Math.round(diffMinutes * 10) / 10,
          transactionCount: 3,
          confidence: 0.75
        });
        i += 2; // Skip ahead
      }
    }

    return patterns;
  }
}

/**
 * AI Recommendation Engine
 * Generates actionable recommendations based on analysis
 */
export class RecommendationEngine {
  constructor(options = {}) {
    this.priorityThresholds = options.priorityThresholds || {
      critical: 0.9,
      high: 0.7,
      medium: 0.5
    };
  }

  /**
   * Generate recommendations from analysis results
   * @param {Object} analysis - Combined analysis results
   * @returns {Array} Prioritized recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // From anomalies
    if (analysis.anomalies?.anomalies) {
      analysis.anomalies.anomalies.forEach(anomaly => {
        recommendations.push({
          type: 'investigate_anomaly',
          priority: anomaly.severity === 'critical' ? 1 : anomaly.severity === 'high' ? 2 : 3,
          title: `Investigate ${anomaly.severity} anomaly`,
          description: `Value ${anomaly.value} detected, ${anomaly.deviation}σ from expected range`,
          action: 'Conduct physical count verification',
          impact: anomaly.severity === 'critical' ? 'high' : 'medium',
          data: anomaly,
          confidence: 0.85
        });
      });
    }

    // From patterns
    if (analysis.patterns?.patterns) {
      const { behavioral, correlations, anomalousSequences } = analysis.patterns.patterns;

      behavioral?.filter(p => p.type === 'high_negative_rate').forEach(pattern => {
        recommendations.push({
          type: 'review_user_activity',
          priority: 2,
          title: `Review user ${pattern.userId} activity`,
          description: `${pattern.negativeRate}% negative adjustment rate detected`,
          action: 'Audit recent transactions and provide additional training if needed',
          impact: 'medium',
          data: pattern,
          confidence: pattern.confidence
        });
      });

      correlations?.filter(p => p.type === 'problem_location_sku').forEach(pattern => {
        recommendations.push({
          type: 'location_sku_audit',
          priority: 2,
          title: `Audit ${pattern.sku} at ${pattern.location}`,
          description: `${pattern.issueRate}% issue rate for this combination`,
          action: 'Consider relocating product or investigating storage conditions',
          impact: 'medium',
          data: pattern,
          confidence: pattern.confidence
        });
      });

      anomalousSequences?.forEach(pattern => {
        recommendations.push({
          type: 'investigate_sequence',
          priority: 1,
          title: `Investigate rapid adjustments to ${pattern.sku}`,
          description: `${pattern.transactionCount} adjustments in ${pattern.timeSpanMinutes} minutes`,
          action: 'Review transaction sequence for potential process issue or fraud',
          impact: 'high',
          data: pattern,
          confidence: pattern.confidence
        });
      });
    }

    // Sort by priority
    recommendations.sort((a, b) => a.priority - b.priority);

    return {
      recommendations,
      summary: {
        total: recommendations.length,
        critical: recommendations.filter(r => r.priority === 1).length,
        high: recommendations.filter(r => r.priority === 2).length,
        medium: recommendations.filter(r => r.priority === 3).length,
        low: recommendations.filter(r => r.priority === 4).length
      }
    };
  }
}

// Export singleton instances with default configuration
export const anomalyDetectionEngine = new AnomalyDetectionEngine();
export const patternRecognitionEngine = new PatternRecognitionEngine();
export const recommendationEngine = new RecommendationEngine();

export default {
  AnomalyDetectionEngine,
  PatternRecognitionEngine,
  RecommendationEngine,
  anomalyDetectionEngine,
  patternRecognitionEngine,
  recommendationEngine
};
