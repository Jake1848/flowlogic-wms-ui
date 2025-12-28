import { Loader2, AlertTriangle, CheckCircle, Brain, Zap } from 'lucide-react'
import { getSeverityColor } from '../../types/alerts'
import type { AnomalyResult } from '../../types/alerts'

interface AnomalyPanelProps {
  anomalyType: string
  onAnomalyTypeChange: (type: string) => void
  anomalyData: AnomalyResult | undefined
  isLoading: boolean
}

const ANOMALY_TYPES = [
  { id: 'inventory', label: 'Inventory Levels' },
  { id: 'adjustments', label: 'Adjustments' },
  { id: 'cycle-counts', label: 'Cycle Count Variances' }
]

export function AnomalyPanel({
  anomalyType,
  onAnomalyTypeChange,
  anomalyData,
  isLoading
}: AnomalyPanelProps) {
  return (
    <div className="space-y-6">
      {/* Anomaly Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Analyze:</span>
          {ANOMALY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onAnomalyTypeChange(type.id)}
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

      {isLoading ? (
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
  )
}
