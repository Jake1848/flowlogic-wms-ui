import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Filter,
  Settings,
  X,
  Package,
  Truck,
  MapPin,
  Users,
  RefreshCw,
  Loader2,
  Brain,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react';
import { useAlertList, useAlertCounts, useAcknowledgeAlert, type Alert } from '../hooks/useAlerts';
import api from '../lib/api';

// Alert severity types (maps to API severity field)
const ALERT_SEVERITIES = [
  { id: 'CRITICAL', label: 'Critical', icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'ERROR', label: 'Error', icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'WARNING', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'INFO', label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-200' },
];

// Alert type categories (maps to API type field)
const ALERT_CATEGORIES = [
  { id: 'INVENTORY', label: 'Inventory', icon: Package },
  { id: 'ORDER', label: 'Order', icon: Package },
  { id: 'SHIPPING', label: 'Shipping', icon: Truck },
  { id: 'RECEIVING', label: 'Receiving', icon: Truck },
  { id: 'LABOR', label: 'Labor', icon: Users },
  { id: 'QUALITY', label: 'Quality', icon: CheckCircle },
  { id: 'SAFETY', label: 'Safety', icon: AlertTriangle },
  { id: 'SYSTEM', label: 'System', icon: RefreshCw },
];

// AI Analysis types
interface AnomalyResult {
  success: boolean;
  anomalies?: Array<{
    index: number;
    value: number;
    severity: string;
    deviation: number;
    detectedBy: string[];
    sku?: string;
    locationCode?: string;
    createdAt?: string;
  }>;
  summary?: {
    totalRecords: number;
    anomalyCount: number;
    anomalyRate: number;
    severityBreakdown: Record<string, number>;
    byDetectionMethod: Record<string, number>;
  };
  error?: string;
}

interface PatternResult {
  success: boolean;
  patterns?: {
    temporal?: Array<{
      pattern: string;
      description: string;
      confidence: number;
    }>;
    behavioral?: Array<{
      pattern: string;
      description: string;
      confidence: number;
    }>;
    correlation?: Array<{
      pattern: string;
      description: string;
      confidence: number;
    }>;
  };
  summary?: {
    totalPatterns: number;
    significantPatterns: number;
    recommendations: string[];
  };
  error?: string;
}

// Mock alerts (fallback when API unavailable)
const mockAlerts: Alert[] = [
  {
    id: 'ALT-001',
    type: 'INVENTORY',
    severity: 'CRITICAL',
    title: 'Stock Out - SKU-10045',
    message: 'Primary pick location A-12-03 is empty. Replenishment required immediately.',
    status: 'NEW',
    referenceNumber: 'SKU-10045',
    createdAt: '2024-01-15T10:32:15Z',
    updatedAt: '2024-01-15T10:32:15Z',
  },
  {
    id: 'ALT-002',
    type: 'SHIPPING',
    severity: 'CRITICAL',
    title: 'Carrier Cutoff Approaching',
    message: 'UPS Ground cutoff in 30 minutes. 12 orders pending shipment.',
    status: 'NEW',
    referenceNumber: 'WAVE-001',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'ALT-003',
    type: 'INVENTORY',
    severity: 'WARNING',
    title: 'Low Stock Warning',
    message: 'SKU-20089 below minimum threshold (24 units remaining, min: 50)',
    status: 'NEW',
    referenceNumber: 'SKU-20089',
    createdAt: '2024-01-15T10:15:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
  },
];

export default function Alerts() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'anomalies' | 'patterns'>('alerts');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [anomalyType, setAnomalyType] = useState<string>('adjustments');

  const queryClient = useQueryClient();

  // Fetch alerts from API
  const { data: alertData, isLoading, error } = useAlertList({
    severity: filterSeverity !== 'all' ? filterSeverity : undefined,
    type: filterCategory !== 'all' ? filterCategory : undefined,
  });
  const { data: alertCounts } = useAlertCounts();
  const acknowledgeAlert = useAcknowledgeAlert();

  // Fetch AI anomaly detection
  const { data: anomalyData, isLoading: anomalyLoading } = useQuery<AnomalyResult>({
    queryKey: ['ai-anomalies', anomalyType],
    queryFn: async (): Promise<AnomalyResult> => {
      const response = await api.post<AnomalyResult>('/ai/anomaly-detection', {
        type: anomalyType,
        lookbackDays: 30
      });
      return response.data;
    },
    enabled: activeTab === 'anomalies'
  });

  // Fetch AI pattern analysis
  const { data: patternData, isLoading: patternLoading, refetch: refetchPatterns } = useQuery<PatternResult>({
    queryKey: ['ai-patterns'],
    queryFn: async (): Promise<PatternResult> => {
      const response = await api.post<PatternResult>('/ai/pattern-analysis', {
        lookbackDays: 60
      });
      return response.data;
    },
    enabled: activeTab === 'patterns'
  });

  // Run anomaly detection mutation
  const runAnomalyDetection = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/anomaly-detection', {
        type: anomalyType,
        lookbackDays: 30
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-anomalies'] });
    }
  });

  // Use API data with fallback to mock data
  const alerts: Alert[] = alertData?.data || mockAlerts;

  const getSeverityInfo = (severity: string) => ALERT_SEVERITIES.find(s => s.id === severity);
  const getCategoryInfo = (categoryId: string) => ALERT_CATEGORIES.find(c => c.id === categoryId);

  // Helper to check if alert is acknowledged
  const isAcknowledged = (alert: Alert) =>
    alert.status === 'ACKNOWLEDGED' || alert.status === 'RESOLVED' || alert.status === 'DISMISSED';

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesCategory = filterCategory === 'all' || alert.type === filterCategory;
    const matchesAck = showAcknowledged || !isAcknowledged(alert);
    return matchesSeverity && matchesCategory && matchesAck;
  });

  // Use API counts if available, otherwise calculate from alerts
  const criticalCount = alertCounts?.critical ?? alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'NEW').length;

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <Bell className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts & AI Detection</h1>
            <p className="text-gray-500 dark:text-gray-400">AI-powered monitoring and anomaly detection</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
            <Settings className="w-4 h-4" />
            Alert Rules
          </button>
          <button
            onClick={() => {
              if (activeTab === 'anomalies') runAnomalyDetection.mutate();
              else if (activeTab === 'patterns') refetchPatterns();
            }}
            disabled={runAnomalyDetection.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Brain className="w-4 h-4" />
            {runAnomalyDetection.isPending ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'alerts', label: 'System Alerts', icon: Bell },
            { id: 'anomalies', label: 'AI Anomaly Detection', icon: AlertTriangle },
            { id: 'patterns', label: 'Pattern Analysis', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI Anomalies</p>
              <p className="text-2xl font-bold text-purple-600">
                {anomalyData?.summary?.anomalyCount ?? 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Patterns Found</p>
              <p className="text-2xl font-bold text-blue-600">
                {patternData?.summary?.totalPatterns ?? 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Anomaly Rate</p>
              <p className="text-2xl font-bold text-orange-600">
                {anomalyData?.summary?.anomalyRate?.toFixed(1) ?? 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <>
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading alerts...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>Unable to load from server. Showing demo data.</span>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Severities</option>
                {ALERT_SEVERITIES.map(severity => (
                  <option key={severity.id} value={severity.id}>{severity.label}</option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {ALERT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showAcknowledged}
                  onChange={(e) => setShowAcknowledged(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                Show Acknowledged
              </label>
            </div>
          </div>

          {/* Alert List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No alerts matching your filters</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const severityInfo = getSeverityInfo(alert.severity);
                  const categoryInfo = getCategoryInfo(alert.type);
                  const SeverityIcon = severityInfo?.icon || AlertCircle;
                  const CategoryIcon = categoryInfo?.icon || Package;
                  const acknowledged = isAcknowledged(alert);

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                        acknowledged ? 'opacity-60' : ''
                      }`}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg border ${severityInfo?.color}`}>
                          <SeverityIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                            {acknowledged && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                {alert.status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <CategoryIcon className="w-3 h-3" />
                              {categoryInfo?.label || alert.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(alert.createdAt).toLocaleString()}
                            </span>
                            {alert.referenceNumber && (
                              <span className="flex items-center gap-1 font-mono">
                                <MapPin className="w-3 h-3" />
                                {alert.referenceNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        {!acknowledged && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(alert.id);
                            }}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* AI Anomaly Detection Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          {/* Anomaly Type Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Analyze:</span>
              {[
                { id: 'inventory', label: 'Inventory Levels' },
                { id: 'adjustments', label: 'Adjustments' },
                { id: 'cycle-counts', label: 'Cycle Count Variances' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAnomalyType(type.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    anomalyType === type.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {anomalyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Running anomaly detection...</span>
            </div>
          ) : anomalyData?.success ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Records Analyzed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {anomalyData.summary?.totalRecords?.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Anomalies Detected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {anomalyData.summary?.anomalyCount ?? 0}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detection Methods</p>
                  <div className="flex gap-2 mt-1">
                    {anomalyData.summary?.byDetectionMethod && Object.entries(anomalyData.summary.byDetectionMethod).map(([method, count]) => (
                      <span key={method} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded">
                        {method}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Anomaly List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Detected Anomalies
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {anomalyData.anomalies && anomalyData.anomalies.length > 0 ? (
                    anomalyData.anomalies.slice(0, 20).map((anomaly, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(anomaly.severity)}`}>
                                  {anomaly.severity.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Deviation: {anomaly.deviation.toFixed(2)}σ
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white mt-1">
                                Value: <span className="font-mono font-medium">{anomaly.value}</span>
                                {anomaly.sku && <span className="ml-2 text-gray-500">SKU: {anomaly.sku}</span>}
                                {anomaly.locationCode && <span className="ml-2 text-gray-500">Location: {anomaly.locationCode}</span>}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">Detected by:</span>
                                {anomaly.detectedBy.map((method) => (
                                  <span key={method} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                    {method}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No anomalies detected in the analyzed data</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {anomalyData?.error || 'Click "Run AI Analysis" to detect anomalies in your data'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pattern Analysis Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          {patternLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Analyzing patterns...</span>
            </div>
          ) : patternData?.success ? (
            <>
              {/* Pattern Summary */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Pattern Analysis Summary</h3>
                <p className="text-blue-100">
                  {patternData.summary?.totalPatterns ?? 0} patterns identified,{' '}
                  {patternData.summary?.significantPatterns ?? 0} significant
                </p>
                {patternData.summary?.recommendations && patternData.summary.recommendations.length > 0 && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-sm font-medium mb-1">Top Recommendation:</p>
                    <p className="text-sm text-blue-100">{patternData.summary.recommendations[0]}</p>
                  </div>
                )}
              </div>

              {/* Pattern Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Temporal Patterns */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Temporal Patterns
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {patternData.patterns?.temporal && patternData.patterns.temporal.length > 0 ? (
                      patternData.patterns.temporal.map((pattern, i) => (
                        <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{pattern.pattern}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pattern.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${pattern.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{(pattern.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No temporal patterns detected</p>
                    )}
                  </div>
                </div>

                {/* Behavioral Patterns */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      Behavioral Patterns
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {patternData.patterns?.behavioral && patternData.patterns.behavioral.length > 0 ? (
                      patternData.patterns.behavioral.map((pattern, i) => (
                        <div key={i} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{pattern.pattern}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pattern.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600 rounded-full"
                                style={{ width: `${pattern.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{(pattern.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No behavioral patterns detected</p>
                    )}
                  </div>
                </div>

                {/* Correlation Patterns */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      Correlation Patterns
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {patternData.patterns?.correlation && patternData.patterns.correlation.length > 0 ? (
                      patternData.patterns.correlation.map((pattern, i) => (
                        <div key={i} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{pattern.pattern}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pattern.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-600 rounded-full"
                                style={{ width: `${pattern.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{(pattern.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No correlation patterns detected</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <Activity className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {patternData?.error || 'Click "Run AI Analysis" to discover patterns in your data'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const severityInfo = getSeverityInfo(selectedAlert.severity);
                  const SeverityIcon = severityInfo?.icon || AlertCircle;
                  return (
                    <div className={`p-2 rounded-lg border ${severityInfo?.color}`}>
                      <SeverityIcon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedAlert.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAlert.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Message</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getCategoryInfo(selectedAlert.type)?.label || selectedAlert.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Severity</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getSeverityInfo(selectedAlert.severity)?.label || selectedAlert.severity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedAlert.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedAlert.referenceNumber && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
                  <p className="font-mono text-blue-600">{selectedAlert.referenceNumber}</p>
                </div>
              )}

              {selectedAlert.assignedToName && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedAlert.assignedToName}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
              {!isAcknowledged(selectedAlert) && (
                <button
                  onClick={() => {
                    handleAcknowledge(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Acknowledge
                </button>
              )}
              {selectedAlert.referenceNumber && (
                <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  View Related
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
