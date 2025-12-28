/**
 * AI Engine Unit Tests
 * Tests for forecasting, anomaly detection, pattern recognition, and recommendations
 */

import {
  forecastingEngine,
  anomalyDetectionEngine,
  patternRecognitionEngine,
  recommendationEngine
} from '../modules/ai-engine/index.js';

describe('AI Engine', () => {
  describe('Forecasting Engine', () => {
    it('should return error for insufficient data (less than 7 points)', () => {
      const result = forecastingEngine.forecast([], 7);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient data for forecasting');
      expect(result.minRequired).toBe(7);
      expect(result.provided).toBe(0);
    });

    it('should generate forecasts for valid historical data (7+ points)', () => {
      const historicalData = [
        { date: '2024-01-01', quantity: 100 },
        { date: '2024-01-02', quantity: 120 },
        { date: '2024-01-03', quantity: 110 },
        { date: '2024-01-04', quantity: 130 },
        { date: '2024-01-05', quantity: 115 },
        { date: '2024-01-06', quantity: 125 },
        { date: '2024-01-07', quantity: 140 },
      ];

      const result = forecastingEngine.forecast(historicalData, 7);

      expect(result.success).toBe(true);
      expect(result.forecasts).toHaveLength(7);
      expect(result.summary.dataPoints).toBe(7);
      expect(result.summary.averageDemand).toBeGreaterThan(0);
    });

    it('should reject data with fewer than 7 points', () => {
      const historicalData = [
        { date: '2024-01-01', quantity: 100 },
        { date: '2024-01-02', quantity: 110 },
        { date: '2024-01-03', quantity: 120 },
      ];
      const result = forecastingEngine.forecast(historicalData, 3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient data for forecasting');
      expect(result.provided).toBe(3);
    });

    it('should respect horizon days parameter', () => {
      const historicalData = Array.from({ length: 10 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        quantity: 100 + Math.random() * 20
      }));

      const result30 = forecastingEngine.forecast(historicalData, 30);
      const result7 = forecastingEngine.forecast(historicalData, 7);

      expect(result30.forecasts).toHaveLength(30);
      expect(result7.forecasts).toHaveLength(7);
    });

    it('should include confidence intervals in forecasts', () => {
      const historicalData = Array.from({ length: 14 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        quantity: 100 + (i % 3) * 10
      }));

      const result = forecastingEngine.forecast(historicalData, 5);

      expect(result.success).toBe(true);
      result.forecasts.forEach(pred => {
        expect(pred).toHaveProperty('date');
        expect(pred).toHaveProperty('predicted');
        expect(pred).toHaveProperty('lower');
        expect(pred).toHaveProperty('upper');
        expect(pred).toHaveProperty('confidence');
        expect(pred.lower).toBeLessThanOrEqual(pred.predicted);
        expect(pred.upper).toBeGreaterThanOrEqual(pred.predicted);
      });
    });

    it('should detect trend direction', () => {
      // Create increasing trend data
      const increasingData = Array.from({ length: 14 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        quantity: 100 + i * 10
      }));

      const result = forecastingEngine.forecast(increasingData, 7);

      expect(result.success).toBe(true);
      expect(result.summary.trend).toBe('increasing');
    });

    it('should include accuracy metrics', () => {
      const historicalData = Array.from({ length: 20 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        quantity: 100 + Math.sin(i) * 20
      }));

      const result = forecastingEngine.forecast(historicalData, 7);

      expect(result.success).toBe(true);
      expect(result.accuracy).toHaveProperty('mape');
      expect(result.accuracy).toHaveProperty('rmse');
      expect(result.accuracy).toHaveProperty('confidence');
    });
  });

  describe('Anomaly Detection Engine', () => {
    it('should return error for insufficient data (less than 10 points)', () => {
      const result = anomalyDetectionEngine.detect([], 'value');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient data for anomaly detection');
      expect(result.minRequired).toBe(10);
      expect(result.provided).toBe(0);
    });

    it('should detect no anomalies in uniform data', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        value: 100,
        timestamp: new Date(2024, 0, i + 1)
      }));

      const result = anomalyDetectionEngine.detect(data, 'value');

      expect(result.success).toBe(true);
      expect(result.anomalies).toHaveLength(0);
    });

    it('should detect anomalies in data with outliers', () => {
      const data = [
        { id: 1, value: 100 },
        { id: 2, value: 102 },
        { id: 3, value: 98 },
        { id: 4, value: 101 },
        { id: 5, value: 99 },
        { id: 6, value: 500 }, // Outlier
        { id: 7, value: 100 },
        { id: 8, value: 103 },
        { id: 9, value: 97 },
        { id: 10, value: 101 },
      ];

      const result = anomalyDetectionEngine.detect(data, 'value');

      expect(result.success).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies.some(a => a.value === 500)).toBe(true);
    });

    it('should include severity in detected anomalies', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        value: i === 10 ? 1000 : 100  // Major outlier at index 10
      }));

      const result = anomalyDetectionEngine.detect(data, 'value');

      expect(result.success).toBe(true);
      if (result.anomalies.length > 0) {
        result.anomalies.forEach(anomaly => {
          expect(anomaly).toHaveProperty('severity');
          expect(['medium', 'high', 'critical']).toContain(anomaly.severity);
          expect(anomaly).toHaveProperty('deviation');
          expect(anomaly).toHaveProperty('detectedBy');
        });
      }
    });

    it('should handle data with negative values', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        value: i === 10 ? -100 : -10 - Math.random()
      }));

      const result = anomalyDetectionEngine.detect(data, 'value');

      expect(result.success).toBe(true);
      expect(result.summary).toHaveProperty('anomalyRate');
      expect(result.summary).toHaveProperty('totalDataPoints');
    });

    it('should provide detection statistics', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        value: 100 + Math.random() * 10
      }));

      const result = anomalyDetectionEngine.detect(data, 'value');

      expect(result.success).toBe(true);
      expect(result.statistics).toHaveProperty('mean');
      expect(result.statistics).toHaveProperty('median');
      expect(result.statistics).toHaveProperty('stdDev');
      expect(result.statistics).toHaveProperty('min');
      expect(result.statistics).toHaveProperty('max');
    });
  });

  describe('Pattern Recognition Engine', () => {
    it('should return error for insufficient data (less than 20 transactions)', () => {
      const result = patternRecognitionEngine.analyzePatterns([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient data for pattern analysis');
      expect(result.minRequired).toBe(20);
    });

    it('should identify patterns in transaction data', () => {
      // Generate 30 transactions across different hours and days
      const transactions = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        type: i % 3 === 0 ? 'PICK' : 'PUT',
        sku: `SKU-${(i % 5) + 1}`.padStart(7, '0'),
        quantity: 10 + (i % 10),
        userId: `user${(i % 3) + 1}`,
        timestamp: new Date(2024, 0, Math.floor(i / 5) + 1, 9 + (i % 8))
      }));

      const result = patternRecognitionEngine.analyzePatterns(transactions);

      expect(result.success).toBe(true);
      expect(result.summary).toHaveProperty('totalTransactions');
      expect(result.summary.totalTransactions).toBe(30);
      expect(result.patterns).toBeDefined();
    });

    it('should detect temporal patterns', () => {
      // Create transactions clustered at specific hours
      const transactions = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        type: 'PICK',
        sku: 'SKU-001',
        quantity: 10,
        userId: 'user1',
        timestamp: new Date(2024, 0, Math.floor(i / 10) + 1, i < 20 ? 9 : 14) // Peak at 9 and 14
      }));

      const result = patternRecognitionEngine.analyzePatterns(transactions);

      expect(result.success).toBe(true);
      expect(result.patterns.temporal).toBeDefined();
    });

    it('should detect behavioral patterns', () => {
      // Create transactions with one user having high negative adjustments
      const transactions = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        type: 'adjustment',
        sku: `SKU-${(i % 3) + 1}`.padStart(7, '0'),
        quantity: i < 15 ? -20 : 10, // First 15 are negative (user1)
        userId: i < 15 ? 'user1' : 'user2',
        timestamp: new Date(2024, 0, Math.floor(i / 3) + 1, 10)
      }));

      const result = patternRecognitionEngine.analyzePatterns(transactions);

      expect(result.success).toBe(true);
      expect(result.patterns.behavioral).toBeDefined();
    });
  });

  describe('Recommendation Engine', () => {
    it('should return empty recommendations for empty analysis', () => {
      const analysis = {
        anomalies: { success: true, anomalies: [], summary: {} },
        forecasts: { success: true, forecasts: [], summary: {} },
        patterns: { success: true, patterns: { temporal: [], behavioral: [], correlations: [], anomalousSequences: [] }, summary: {} }
      };

      const result = recommendationEngine.generateRecommendations(analysis);

      expect(result.recommendations).toEqual([]);
      expect(result.summary.total).toBe(0);
    });

    it('should generate recommendations from anomalies', () => {
      const analysis = {
        anomalies: {
          success: true,
          anomalies: [
            { index: 0, value: 500, severity: 'high', deviation: 4.5 }
          ],
          summary: { anomalyCount: 1 }
        },
        forecasts: { success: true, forecasts: [], summary: {} },
        patterns: { success: true, patterns: { temporal: [], behavioral: [], correlations: [], anomalousSequences: [] }, summary: {} }
      };

      const result = recommendationEngine.generateRecommendations(analysis);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].type).toBe('investigate_anomaly');
    });

    it('should prioritize recommendations by severity', () => {
      const analysis = {
        anomalies: {
          success: true,
          anomalies: [
            { index: 0, value: 1000, severity: 'critical', deviation: 10 },
            { index: 1, value: 200, severity: 'medium', deviation: 2.5 },
            { index: 2, value: 500, severity: 'high', deviation: 4 }
          ],
          summary: { anomalyCount: 3 }
        },
        forecasts: { success: true, forecasts: [], summary: {} },
        patterns: { success: true, patterns: { temporal: [], behavioral: [], correlations: [], anomalousSequences: [] }, summary: {} }
      };

      const result = recommendationEngine.generateRecommendations(analysis);

      expect(result.recommendations.length).toBe(3);
      // Should be sorted by priority (1 = critical, 2 = high, 3 = medium)
      expect(result.recommendations[0].priority).toBe(1);
      expect(result.recommendations[1].priority).toBe(2);
      expect(result.recommendations[2].priority).toBe(3);
    });

    it('should generate recommendations from patterns', () => {
      const analysis = {
        anomalies: { success: true, anomalies: [], summary: {} },
        forecasts: { success: true, forecasts: [], summary: {} },
        patterns: {
          success: true,
          patterns: {
            temporal: [],
            behavioral: [
              { type: 'high_negative_rate', userId: 'user1', negativeRate: 80, totalTransactions: 10, confidence: 0.85 }
            ],
            correlations: [
              { type: 'problem_location_sku', location: 'A-01', sku: 'SKU-001', issueRate: 60, totalOccurrences: 8, confidence: 0.8 }
            ],
            anomalousSequences: [
              { type: 'rapid_adjustment_sequence', sku: 'SKU-002', timeSpanMinutes: 3, transactionCount: 3, confidence: 0.75 }
            ]
          },
          summary: {}
        }
      };

      const result = recommendationEngine.generateRecommendations(analysis);

      expect(result.recommendations.length).toBe(3);
      expect(result.recommendations.some(r => r.type === 'review_user_activity')).toBe(true);
      expect(result.recommendations.some(r => r.type === 'location_sku_audit')).toBe(true);
      expect(result.recommendations.some(r => r.type === 'investigate_sequence')).toBe(true);
    });

    it('should generate recommendations from forecasts', () => {
      const analysis = {
        anomalies: { success: true, anomalies: [], summary: {} },
        forecasts: {
          success: true,
          forecasts: [
            { date: '2024-01-08', predicted: 200 },
            { date: '2024-01-09', predicted: 220 },
            { date: '2024-01-10', predicted: 240 }
          ],
          summary: {
            averageDemand: 100,
            trend: 'increasing',
            trendStrength: 0.7
          },
          accuracy: { confidence: 0.85 }
        },
        patterns: { success: true, patterns: { temporal: [], behavioral: [], correlations: [], anomalousSequences: [] }, summary: {} }
      };

      const result = recommendationEngine.generateRecommendations(analysis);

      expect(result.recommendations.length).toBeGreaterThan(0);
      // Should recommend increasing stock or warn about demand surge
      expect(result.recommendations.some(r =>
        r.type === 'increase_stock' || r.type === 'demand_surge_warning'
      )).toBe(true);
    });

    it('should provide recommendation summary', () => {
      const analysis = {
        anomalies: {
          success: true,
          anomalies: [
            { index: 0, value: 1000, severity: 'critical', deviation: 10 },
            { index: 1, value: 500, severity: 'high', deviation: 4 }
          ],
          summary: {}
        },
        forecasts: { success: true, forecasts: [], summary: {} },
        patterns: { success: true, patterns: { temporal: [], behavioral: [], correlations: [], anomalousSequences: [] }, summary: {} }
      };

      const result = recommendationEngine.generateRecommendations(analysis);

      expect(result.summary).toHaveProperty('total');
      expect(result.summary).toHaveProperty('critical');
      expect(result.summary).toHaveProperty('high');
      expect(result.summary).toHaveProperty('medium');
      expect(result.summary.total).toBe(2);
      expect(result.summary.critical).toBe(1);
      expect(result.summary.high).toBe(1);
    });
  });
});
