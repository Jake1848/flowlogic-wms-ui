import { useState, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  Search,
  RefreshCw,
  ChevronRight,
  Target,
  MapPin,
  Package
} from 'lucide-react'
import api from '../lib/api'

interface Discrepancy {
  id: string
  type: string
  severity: string
  status: string
  sku: string | null
  locationCode: string | null
  variance: number
  variancePercent: number | null
  varianceValue: number | null
  description: string | null
  detectedAt: string
}

interface DashboardSummary {
  summary: {
    openDiscrepancies: number
    criticalIssues: number
    period: string
  }
  discrepancyBreakdown: Array<{
    severity: string
    status: string
    _count: number
  }>
  recentDiscrepancies: Discrepancy[]
}

interface ActionRecommendation {
  id: string
  type: string
  priority: number
  status: string
  sku: string | null
  locationCode: string | null
  description: string
  instructions: string | null
  estimatedImpact: number | null
}

interface ExecutiveBrief {
  reportDate: string
  period: { from: string; to: string; days: number }
  headline: string
  metrics: {
    totalDiscrepancies: number
    criticalIssues: number
    openIssues: number
    resolved: number
    totalAdjustments: number
    adjustmentVolume: number
  }
  topIssues: Array<{
    type: string
    severity: string
    sku: string
    location: string
    description: string
  }>
  recommendations: Array<{
    priority: string
    action: string
    rationale: string
  }>
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200'
}

const severityIcons: Record<string, ReactNode> = {
  critical: <AlertTriangle className="w-4 h-4 text-red-600" />,
  high: <TrendingDown className="w-4 h-4 text-orange-600" />,
  medium: <Clock className="w-4 h-4 text-yellow-600" />,
  low: <CheckCircle className="w-4 h-4 text-blue-600" />
}

const typeLabels: Record<string, string> = {
  negative_on_hand: 'Negative On-Hand',
  cycle_count_variance: 'Cycle Count Variance',
  unexplained_shortage: 'Unexplained Shortage',
  unexplained_overage: 'Unexplained Overage',
  adjustment_spike: 'Adjustment Spike',
  drift_detected: 'Inventory Drift',
  transaction_gap: 'Transaction Gap'
}

export default function IntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'discrepancies' | 'actions' | 'reports'>('overview')
  const queryClient = useQueryClient()

  // Fetch dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery<DashboardSummary>({
    queryKey: ['intelligence-dashboard'],
    queryFn: async (): Promise<DashboardSummary> => {
      const response = await api.get<DashboardSummary>('/intelligence/truth/dashboard')
      return response.data
    }
  })

  // Fetch discrepancies
  const { data: discrepancies, isLoading: discrepanciesLoading } = useQuery<Discrepancy[]>({
    queryKey: ['intelligence-discrepancies'],
    queryFn: async (): Promise<Discrepancy[]> => {
      const response = await api.get<Discrepancy[]>('/intelligence/truth/discrepancies')
      return response.data
    }
  })

  // Fetch actions
  const { data: actions, isLoading: actionsLoading } = useQuery<ActionRecommendation[]>({
    queryKey: ['intelligence-actions'],
    queryFn: async (): Promise<ActionRecommendation[]> => {
      const response = await api.get<ActionRecommendation[]>('/intelligence/actions')
      return response.data
    }
  })

  // Fetch executive brief
  const { data: brief, isLoading: briefLoading } = useQuery<ExecutiveBrief>({
    queryKey: ['intelligence-brief'],
    queryFn: async (): Promise<ExecutiveBrief> => {
      const response = await api.get<ExecutiveBrief>('/intelligence/reports/executive-brief')
      return response.data
    }
  })

  // Run analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/intelligence/truth/analyze')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['intelligence-discrepancies'] })
    }
  })

  // Generate actions mutation
  const generateActionsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/intelligence/actions/generate')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-actions'] })
    }
  })

  const isLoading = dashboardLoading || discrepanciesLoading || actionsLoading || briefLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Inventory Intelligence
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              AI-powered inventory analysis and root cause detection
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {analyzeMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
          </button>
          <button
            onClick={() => generateActionsMutation.mutate()}
            disabled={generateActionsMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RefreshCw className="w-4 h-4" />
            Generate Actions
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview', icon: Brain },
            { id: 'discrepancies', label: 'Discrepancies', icon: AlertTriangle },
            { id: 'actions', label: 'Action Queue', icon: Target },
            { id: 'reports', label: 'Executive Reports', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Open Issues</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {dashboard?.summary.openDiscrepancies || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
                      <p className="text-3xl font-bold text-red-600">
                        {dashboard?.summary.criticalIssues || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pending Actions</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {actions?.filter(a => a.status === 'PENDING').length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Est. Impact</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${actions?.reduce((sum, a) => sum + (a.estimatedImpact || 0), 0).toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Brief Headline */}
              {brief && (
                <div className={`rounded-xl p-6 ${
                  brief.metrics.criticalIssues > 0
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                }`}>
                  <h3 className={`text-lg font-semibold ${
                    brief.metrics.criticalIssues > 0 ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'
                  }`}>
                    {brief.headline}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {brief.period.days}-day period ending {new Date(brief.period.to).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Recent Discrepancies */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Recent Discrepancies</h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dashboard?.recentDiscrepancies.slice(0, 5).map((disc) => (
                    <div key={disc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {severityIcons[disc.severity]}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[disc.severity]}`}>
                                {disc.severity.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {typeLabels[disc.type] || disc.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {disc.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              {disc.sku && (
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {disc.sku}
                                </span>
                              )}
                              {disc.locationCode && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {disc.locationCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {disc.variance > 0 ? '+' : ''}{disc.variance}
                          </p>
                          {disc.varianceValue && (
                            <p className="text-sm text-gray-500">
                              ${disc.varianceValue.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Discrepancies Tab */}
          {activeTab === 'discrepancies' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  All Open Discrepancies ({discrepancies?.length || 0})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Variance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Impact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Detected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {discrepancies?.map((disc) => (
                      <tr key={disc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[disc.severity]}`}>
                            {disc.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {typeLabels[disc.type] || disc.type}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                          {disc.sku || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                          {disc.locationCode || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span className={disc.variance < 0 ? 'text-red-600' : 'text-green-600'}>
                            {disc.variance > 0 ? '+' : ''}{disc.variance}
                          </span>
                          {disc.variancePercent && (
                            <span className="text-gray-400 text-xs ml-1">
                              ({disc.variancePercent.toFixed(1)}%)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {disc.varianceValue ? `$${disc.varianceValue.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            disc.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                            disc.status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {disc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(disc.detectedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              {actions?.map((action) => (
                <div key={action.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        action.priority === 1 ? 'bg-red-100' :
                        action.priority === 2 ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        <Target className={`w-5 h-5 ${
                          action.priority === 1 ? 'text-red-600' :
                          action.priority === 2 ? 'text-orange-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            action.priority === 1 ? 'bg-red-100 text-red-800' :
                            action.priority === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {action.priority === 1 ? 'URGENT' : action.priority === 2 ? 'HIGH' : 'MEDIUM'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {action.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {action.description}
                        </p>
                        {action.instructions && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {action.instructions}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          {action.sku && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {action.sku}
                            </span>
                          )}
                          {action.locationCode && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {action.locationCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {action.estimatedImpact && (
                        <p className="text-lg font-bold text-green-600">
                          ${action.estimatedImpact.toLocaleString()}
                        </p>
                      )}
                      <button className="mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                        View Details <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && brief && (
            <div className="space-y-6">
              {/* Executive Brief */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Executive Brief
                      </h3>
                      <p className="text-sm text-gray-500">
                        {brief.period.days}-day analysis ending {new Date(brief.period.to).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                      <FileText className="w-4 h-4" />
                      Export PDF
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {brief.metrics.totalDiscrepancies}
                      </p>
                      <p className="text-sm text-gray-500">Total Issues</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{brief.metrics.criticalIssues}</p>
                      <p className="text-sm text-gray-500">Critical</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{brief.metrics.resolved}</p>
                      <p className="text-sm text-gray-500">Resolved</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{brief.metrics.totalAdjustments}</p>
                      <p className="text-sm text-gray-500">Adjustments</p>
                    </div>
                  </div>

                  {/* Top Issues */}
                  {brief.topIssues.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Top Issues</h4>
                      <div className="space-y-2">
                        {brief.topIssues.map((issue, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[issue.severity]}`}>
                                {issue.severity}
                              </span>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {issue.description || `${issue.type} at ${issue.location}`}
                              </span>
                            </div>
                            <span className="text-sm font-mono text-gray-500">{issue.sku}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {brief.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {brief.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {rec.priority}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{rec.action}</p>
                              <p className="text-sm text-gray-500">{rec.rationale}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
