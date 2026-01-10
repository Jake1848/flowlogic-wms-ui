import { useState, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
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
    <motion.div
      className="space-y-4 sm:space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Inventory Intelligence
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              AI-powered inventory analysis and root cause detection
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">{analyzeMutation.isPending ? 'Analyzing...' : 'Run Analysis'}</span>
            <span className="sm:hidden">{analyzeMutation.isPending ? '...' : 'Analyze'}</span>
          </Button>
          <Button
            onClick={() => generateActionsMutation.mutate()}
            disabled={generateActionsMutation.isPending}
            variant="secondary"
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-4 h-4 ${generateActionsMutation.isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Generate Actions</span>
            <span className="sm:hidden">Actions</span>
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto">
        <nav className="flex gap-1 sm:gap-4 min-w-max">
          {[
            { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: Brain },
            { id: 'discrepancies', label: 'Discrepancies', shortLabel: 'Issues', icon: AlertTriangle },
            { id: 'actions', label: 'Action Queue', shortLabel: 'Actions', icon: Target },
            { id: 'reports', label: 'Executive Reports', shortLabel: 'Reports', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
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
            <motion.div
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Open Issues</p>
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            {dashboard?.summary?.openDiscrepancies ?? 0}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Critical</p>
                          <p className="text-2xl sm:text-3xl font-bold text-red-600">
                            {dashboard?.summary?.criticalIssues ?? 0}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pending</p>
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            {actions?.filter(a => a.status === 'PENDING').length || 0}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Impact</p>
                          <p className="text-xl sm:text-3xl font-bold text-green-600">
                            ${actions?.reduce((sum, a) => sum + (a.estimatedImpact || 0), 0).toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Recent Discrepancies</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {dashboard?.recentDiscrepancies.slice(0, 5).map((disc) => (
                        <div key={disc.id} className="py-4 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-6 px-6 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {severityIcons[disc.severity]}
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={disc.severity === 'critical' ? 'destructive' : disc.severity === 'high' ? 'warning' : 'secondary'}>
                                    {disc.severity.toUpperCase()}
                                  </Badge>
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
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Discrepancies Tab */}
          {activeTab === 'discrepancies' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    All Open Discrepancies ({discrepancies?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
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
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {actions?.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl ${
                            action.priority === 1 ? 'bg-red-100 dark:bg-red-900/30' :
                            action.priority === 2 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            <Target className={`w-5 h-5 ${
                              action.priority === 1 ? 'text-red-600' :
                              action.priority === 2 ? 'text-orange-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={action.priority === 1 ? 'destructive' : action.priority === 2 ? 'warning' : 'default'}>
                                {action.priority === 1 ? 'URGENT' : action.priority === 2 ? 'HIGH' : 'MEDIUM'}
                              </Badge>
                              <Badge variant="secondary">
                                {action.type.replace('_', ' ').toUpperCase()}
                              </Badge>
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
                          <Button variant="ghost" size="sm" className="mt-2 text-purple-600 hover:text-purple-700">
                            View Details <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && brief && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Executive Brief */}
              <Card>
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Executive Brief</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {brief.period.days}-day analysis ending {new Date(brief.period.to).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="secondary">
                      <FileText className="w-4 h-4" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                      className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0 }}
                    >
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {brief.metrics.totalDiscrepancies}
                      </p>
                      <p className="text-sm text-gray-500">Total Issues</p>
                    </motion.div>
                    <motion.div
                      className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <p className="text-2xl font-bold text-red-600">{brief.metrics.criticalIssues}</p>
                      <p className="text-sm text-gray-500">Critical</p>
                    </motion.div>
                    <motion.div
                      className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <p className="text-2xl font-bold text-green-600">{brief.metrics.resolved}</p>
                      <p className="text-sm text-gray-500">Resolved</p>
                    </motion.div>
                    <motion.div
                      className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <p className="text-2xl font-bold text-purple-600">{brief.metrics.totalAdjustments}</p>
                      <p className="text-sm text-gray-500">Adjustments</p>
                    </motion.div>
                  </div>

                  {/* Top Issues */}
                  {brief.topIssues.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Top Issues</h4>
                      <div className="space-y-2">
                        {brief.topIssues.map((issue, i) => (
                          <motion.div
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant={issue.severity === 'critical' ? 'destructive' : issue.severity === 'high' ? 'warning' : 'secondary'}>
                                {issue.severity}
                              </Badge>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {issue.description || `${issue.type} at ${issue.location}`}
                              </span>
                            </div>
                            <span className="text-sm font-mono text-gray-500">{issue.sku}</span>
                          </motion.div>
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
                          <motion.div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                          >
                            <Badge variant={rec.priority === 'URGENT' ? 'destructive' : rec.priority === 'HIGH' ? 'warning' : 'default'}>
                              {rec.priority}
                            </Badge>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{rec.action}</p>
                              <p className="text-sm text-gray-500">{rec.rationale}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
