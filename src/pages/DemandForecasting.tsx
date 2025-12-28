import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  BarChart3,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Brain,
  Loader2,
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts'
import api from '../lib/api'

interface ForecastResult {
  success: boolean
  forecasts?: Array<{
    date: string
    predicted: number
    lower: number
    upper: number
    confidence: number
  }>
  summary?: {
    averageDemand: number
    trend: string
    trendStrength: number
    volatility: number
    seasonalityDetected: boolean
    dataPoints: number
    horizonDays: number
  }
  accuracy?: {
    mape: number
    rmse: number
    confidence: number
  }
  error?: string
}

interface AnomalyResult {
  success: boolean
  anomalies?: Array<{
    index: number
    value: number
    severity: string
    deviation: number
    detectedBy: string[]
  }>
  summary?: {
    totalDataPoints: number
    anomalyCount: number
    anomalyRate: number
    criticalCount: number
    highCount: number
    mediumCount: number
  }
  statistics?: {
    mean: number
    median: number
    stdDev: number
    min: number
    max: number
  }
}

interface RecommendationResult {
  success: boolean
  recommendations?: Array<{
    type: string
    priority: number
    title: string
    description: string
    action: string
    impact: string
    confidence: number
  }>
  summary?: {
    total: number
    critical: number
    high: number
    medium: number
  }
  analysis?: {
    anomalies: { anomalyCount: number } | null
    forecasts: { trend: string; averageDemand: number } | null
    patterns: { patternsDetected: number } | null
  }
}

export default function DemandForecasting() {
  const [activeTab, setActiveTab] = useState<'overview' | 'forecasts' | 'anomalies' | 'recommendations'>('overview')
  const [timeHorizon, setTimeHorizon] = useState(30)
  const queryClient = useQueryClient()

  // Fetch AI forecast data
  const { data: forecastData, isLoading: forecastLoading } = useQuery<ForecastResult>({
    queryKey: ['ai-forecast', timeHorizon],
    queryFn: async () => {
      const response = await api.post<ForecastResult>('/ai/forecast', { horizonDays: timeHorizon })
      return response.data
    }
  })

  // Fetch anomaly detection data
  const { data: anomalyData, isLoading: anomalyLoading } = useQuery<AnomalyResult>({
    queryKey: ['ai-anomalies'],
    queryFn: async () => {
      const response = await api.post<AnomalyResult>('/ai/anomaly-detection', { type: 'adjustments', lookbackDays: 30 })
      return response.data
    }
  })

  // Fetch AI recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery<RecommendationResult>({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const response = await api.post<RecommendationResult>('/ai/recommendations', {})
      return response.data
    }
  })

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Invalidate all AI queries to refetch
      await queryClient.invalidateQueries({ queryKey: ['ai-forecast'] })
      await queryClient.invalidateQueries({ queryKey: ['ai-anomalies'] })
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] })
    }
  })

  const isLoading = forecastLoading || anomalyLoading || recommendationsLoading

  // Prepare chart data
  const chartData = forecastData?.forecasts?.map(f => ({
    date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    predicted: f.predicted,
    lower: f.lower,
    upper: f.upper,
  })) || []

  const getTrendColor = (trend: string) => {
    if (trend === 'increasing') return 'text-green-600'
    if (trend === 'decreasing') return 'text-red-600'
    return 'text-gray-600'
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    if (priority === 2) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    if (priority === 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
            <Brain className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demand Forecasting</h1>
            <p className="text-gray-600 dark:text-gray-400">AI-powered inventory demand predictions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
          </select>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{timeHorizon}-Day Forecast</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {forecastData?.forecasts
                  ? forecastData.forecasts.reduce((sum, f) => sum + f.predicted, 0).toLocaleString()
                  : '-'} units
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Model Confidence</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {forecastData?.accuracy?.confidence
                  ? `${Math.round(forecastData.accuracy.confidence * 100)}%`
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Anomalies Detected</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {anomalyData?.summary?.anomalyCount ?? '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Demand Trend</p>
              <p className={`text-xl font-bold capitalize ${getTrendColor(forecastData?.summary?.trend || '')}`}>
                {forecastData?.summary?.trend || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
            { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
            { id: 'recommendations', label: 'AI Recommendations', icon: Brain },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Forecast Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {timeHorizon}-Day Demand Forecast
                </h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                      <YAxis tick={{ fill: '#9CA3AF' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="upper"
                        name="Upper Bound"
                        stroke="#06B6D4"
                        fill="#06B6D433"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        name="Predicted"
                        stroke="#0891B2"
                        fill="#0891B266"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="lower"
                        name="Lower Bound"
                        stroke="#06B6D4"
                        fill="transparent"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <p>No forecast data available. Run analysis to generate predictions.</p>
                  </div>
                )}
              </div>

              {/* Model Statistics */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Model Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">MAPE (Error Rate)</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {forecastData?.accuracy?.mape ? `${forecastData.accuracy.mape}%` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">RMSE</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {forecastData?.accuracy?.rmse ?? '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Volatility (CV)</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {forecastData?.summary?.volatility ?? '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Seasonality</span>
                    <span className={`font-medium ${forecastData?.summary?.seasonalityDetected ? 'text-green-600' : 'text-gray-600'}`}>
                      {forecastData?.summary?.seasonalityDetected ? 'Detected' : 'Not Detected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Data Points Used</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {forecastData?.summary?.dataPoints ?? '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Statistics */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Mean Value</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {anomalyData?.statistics?.mean ?? '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Median Value</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {anomalyData?.statistics?.median ?? '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Std Deviation</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {anomalyData?.statistics?.stdDev ?? '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Range</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {anomalyData?.statistics ? `${anomalyData.statistics.min} - ${anomalyData.statistics.max}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Anomaly Rate</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {anomalyData?.summary?.anomalyRate ? `${anomalyData.summary.anomalyRate}%` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecasts Tab */}
          {activeTab === 'forecasts' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Predicted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lower Bound</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Upper Bound</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {forecastData?.forecasts?.map((forecast, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(forecast.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                        {forecast.predicted.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {forecast.lower.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {forecast.upper.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${forecast.confidence >= 0.9 ? 'bg-green-500' : forecast.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${forecast.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {Math.round(forecast.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No forecast data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Anomalies Tab */}
          {activeTab === 'anomalies' && (
            <div className="space-y-6">
              {/* Anomaly Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {anomalyData?.summary?.criticalCount ?? 0}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-600 dark:text-orange-400">High</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {anomalyData?.summary?.highCount ?? 0}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Medium</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {anomalyData?.summary?.mediumCount ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Data Points</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {anomalyData?.summary?.totalDataPoints ?? 0}
                  </p>
                </div>
              </div>

              {/* Anomaly List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Detected Anomalies</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {anomalyData?.anomalies?.map((anomaly, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              anomaly.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {anomaly.severity.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {anomaly.deviation.toFixed(1)}σ deviation
                            </span>
                          </div>
                          <p className="mt-1 text-gray-900 dark:text-white">
                            Value: <span className="font-mono">{anomaly.value}</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Detected by: {anomaly.detectedBy.join(', ')}
                          </p>
                        </div>
                        <AlertTriangle className={`w-5 h-5 ${
                          anomaly.severity === 'critical' ? 'text-red-500' :
                          anomaly.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                        }`} />
                      </div>
                    </div>
                  )) || (
                    <div className="p-8 text-center text-gray-500">
                      No anomalies detected in the current dataset
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {recommendationsData?.recommendations?.map((rec, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(rec.priority)}`}>
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                            {rec.priority === 1 ? 'URGENT' : rec.priority === 2 ? 'HIGH' : rec.priority === 3 ? 'MEDIUM' : 'LOW'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{rec.type.replace(/_/g, ' ')}</span>
                        </div>
                        <h4 className="mt-1 font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                        <p className="mt-2 text-sm text-cyan-600 dark:text-cyan-400">
                          <strong>Action:</strong> {rec.action}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Impact</p>
                      <p className={`font-medium ${rec.impact === 'high' ? 'text-red-600' : rec.impact === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {rec.impact.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.round(rec.confidence * 100)}% confidence
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center text-gray-500">
                  No recommendations available. Run analysis to generate AI-powered recommendations.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
