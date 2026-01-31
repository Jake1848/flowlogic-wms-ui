import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Download,
  FileText,
  TrendingDown,
  AlertCircle,
  Calendar,
  Clock,
  Brain,
  BarChart3,
  FileSpreadsheet,
  Printer,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import api from '../lib/api'

type ReportType = 'bad-items' | 'tolerance' | 'ai-insights' | 'audit-completion' | 'discrepancies'

interface AIDashboardData {
  summary?: {
    openDiscrepancies?: number
    criticalIssues?: number
    pendingActions?: number
  }
}

interface ScheduledReport {
  id: string
  name: string
  type: ReportType
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  lastRun: string
  nextRun: string
  enabled: boolean
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'generate' | 'scheduled' | 'history'>('generate')
  const [selectedReport, setSelectedReport] = useState<ReportType>('ai-insights')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Fetch AI dashboard data for insights
  const { data: aiDashboard, isLoading: aiLoading } = useQuery<AIDashboardData | null>({
    queryKey: ['ai-dashboard'],
    queryFn: async (): Promise<AIDashboardData | null> => {
      try {
        const response = await api.get<AIDashboardData>('/ai/dashboard')
        return response.data
      } catch {
        return null
      }
    },
    enabled: selectedReport === 'ai-insights'
  })

  const reports = [
    {
      id: 'ai-insights' as ReportType,
      title: 'AI Intelligence Report',
      description: 'AI-generated insights, predictions, and recommendations',
      icon: Brain,
      color: 'purple',
    },
    {
      id: 'discrepancies' as ReportType,
      title: 'Discrepancy Analysis',
      description: 'Detailed breakdown of inventory discrepancies',
      icon: AlertCircle,
      color: 'red',
    },
    {
      id: 'bad-items' as ReportType,
      title: 'Bad Item Report',
      description: 'Items with quality issues or recurring problems',
      icon: FileText,
      color: 'yellow',
    },
    {
      id: 'tolerance' as ReportType,
      title: 'Out of Tolerance',
      description: 'Items exceeding acceptable variance thresholds',
      icon: BarChart3,
      color: 'orange',
    },
    {
      id: 'audit-completion' as ReportType,
      title: 'Audit Tracker',
      description: 'Live progress and completion rates',
      icon: Calendar,
      color: 'green',
    },
  ]

  // Mock scheduled reports
  const scheduledReports: ScheduledReport[] = [
    {
      id: '1',
      name: 'Daily AI Insights Summary',
      type: 'ai-insights',
      frequency: 'daily',
      recipients: ['operations@company.com', 'manager@company.com'],
      lastRun: '2024-12-28T06:00:00Z',
      nextRun: '2024-12-29T06:00:00Z',
      enabled: true
    },
    {
      id: '2',
      name: 'Weekly Discrepancy Report',
      type: 'discrepancies',
      frequency: 'weekly',
      recipients: ['inventory@company.com'],
      lastRun: '2024-12-22T08:00:00Z',
      nextRun: '2024-12-29T08:00:00Z',
      enabled: true
    }
  ]

  // Mock data
  const toleranceData = [
    { sku: 'SKU-1023', variance: 8.5, count: 12 },
    { sku: 'SKU-2045', variance: 7.2, count: 9 },
    { sku: 'SKU-3012', variance: 6.8, count: 7 },
    { sku: 'SKU-1234', variance: 5.9, count: 6 },
    { sku: 'SKU-5678', variance: 5.2, count: 5 },
  ]

  const discrepancyBreakdown = [
    { name: 'Cycle Count Variance', value: 45, color: '#3B82F6' },
    { name: 'Receiving Errors', value: 25, color: '#10B981' },
    { name: 'Shipping Errors', value: 18, color: '#F59E0B' },
    { name: 'Unknown', value: 12, color: '#8B5CF6' },
  ]

  const auditCompletionData = [
    { associate: 'John D.', completed: 95, target: 100 },
    { associate: 'Sarah M.', completed: 88, target: 100 },
    { associate: 'Mike R.', completed: 82, target: 100 },
    { associate: 'Lisa K.', completed: 76, target: 100 },
    { associate: 'Tom B.', completed: 71, target: 100 },
  ]

  const exportReport = async (format: 'csv' | 'pdf' | 'xlsx') => {
    setExporting(true)
    const reportName = reports.find(r => r.id === selectedReport)?.title || 'Report'

    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate CSV content
    if (format === 'csv') {
      let csvContent = ''

      if (selectedReport === 'tolerance') {
        csvContent = 'SKU,Variance %,Occurrences\n'
        toleranceData.forEach(item => {
          csvContent += `${item.sku},${item.variance},${item.count}\n`
        })
      } else if (selectedReport === 'audit-completion') {
        csvContent = 'Associate,Completed %,Target\n'
        auditCompletionData.forEach(item => {
          csvContent += `${item.associate},${item.completed},${item.target}\n`
        })
      } else {
        csvContent = `${reportName}\nGenerated: ${new Date().toISOString()}\n\nReport data export`
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      // For PDF/XLSX, show message (would integrate with server-side generation in production)
      alert(`${format.toUpperCase()} export would be generated server-side in production`)
    }

    setExporting(false)
  }

  const getColorForVariance = (variance: number) => {
    if (variance > 7) return '#ef4444'
    if (variance > 5) return '#f59e0b'
    return '#10b981'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Generate and schedule AI-powered reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReport('csv')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            CSV
          </button>
          <button
            onClick={() => exportReport('xlsx')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => exportReport('pdf')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'generate', label: 'Generate Report', icon: FileText },
            { id: 'scheduled', label: 'Scheduled Reports', icon: Clock },
            { id: 'history', label: 'Report History', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Generate Report Tab */}
      {activeTab === 'generate' && (
        <>
          {/* Report Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const Icon = report.icon
              const isSelected = selectedReport === report.id
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      report.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      report.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                      report.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                      report.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                      report.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                      'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Date Range Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Report Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Schedule Report
                </button>
              </div>
            </div>
          </div>

          {/* AI Insights Report */}
          {selectedReport === 'ai-insights' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Intelligence Summary
                </h3>
              </div>

              {aiLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-sm text-purple-600 dark:text-purple-400">Open Discrepancies</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {aiDashboard?.summary?.openDiscrepancies ?? 12}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">Critical Issues</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                      {aiDashboard?.summary?.criticalIssues ?? 3}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Pending Actions</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {aiDashboard?.summary?.pendingActions ?? 8}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <p className="text-sm text-green-600 dark:text-green-400">Detection Confidence</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      94.2%
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Insights</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Anomaly detection identified 3 unusual patterns in Zone A adjustments
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Location-SKU correlation detected: SKU-2045 issues concentrated in Zone B
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Pattern recognition found correlation between shift changes and variance spikes
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Discrepancy Analysis Report */}
          {selectedReport === 'discrepancies' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Discrepancy Analysis
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">By Category</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={discrepancyBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {discrepancyBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Summary</h4>
                  <div className="space-y-3">
                    {discrepancyBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-gray-900 dark:text-white">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tolerance Report */}
          {selectedReport === 'tolerance' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Out of Tolerance - Top Offenders
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toleranceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="sku" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="variance" name="Variance %">
                    {toleranceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorForVariance(entry.variance)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Variance %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Occurrences</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {toleranceData.map((item) => (
                      <tr key={item.sku}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.sku}</td>
                        <td className="px-6 py-4 text-sm font-bold text-red-600">{item.variance.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Completion Report */}
          {selectedReport === 'audit-completion' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Audit Completion by Associate
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={auditCompletionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="associate" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#3b82f6" name="Completed %" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {auditCompletionData.map((associate) => (
                  <div key={associate.associate} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-white">{associate.associate}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            associate.completed >= 90 ? 'bg-green-500' :
                            associate.completed >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${associate.completed}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white w-16 text-right">{associate.completed}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bad Items Report */}
          {selectedReport === 'bad-items' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bad Item Report
              </h3>
              <div className="space-y-3">
                {[
                  { sku: 'SKU-1023', issue: 'Damaged packaging', severity: 'High', occurrences: 8 },
                  { sku: 'SKU-2045', issue: 'Incorrect labeling', severity: 'Medium', occurrences: 5 },
                  { sku: 'SKU-3012', issue: 'Missing components', severity: 'High', occurrences: 6 },
                  { sku: 'SKU-1234', issue: 'Quality defect', severity: 'Critical', occurrences: 12 },
                  { sku: 'SKU-5678', issue: 'Wrong color variant', severity: 'Low', occurrences: 3 },
                ].map((item) => (
                  <div key={item.sku} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{item.sku}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.issue}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        item.severity === 'Critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        item.severity === 'High' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                        item.severity === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      }`}>
                        {item.severity}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.occurrences} occurrences</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Schedule
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Recipients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Run</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Next Run</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {scheduledReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{report.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{report.frequency}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {report.recipients.map((email, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">{email}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(report.lastRun).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(report.nextRun).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {report.enabled ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                          {report.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              { name: 'AI Intelligence Report', format: 'PDF', date: '2024-12-28T14:30:00Z', size: '1.2 MB', status: 'completed' },
              { name: 'Weekly Discrepancy Report', format: 'CSV', date: '2024-12-28T08:00:00Z', size: '245 KB', status: 'completed' },
              { name: 'Pattern Analysis Report', format: 'XLSX', date: '2024-12-27T16:45:00Z', size: '890 KB', status: 'completed' },
              { name: 'Bad Item Report', format: 'PDF', date: '2024-12-27T10:15:00Z', size: '456 KB', status: 'completed' },
              { name: 'Audit Completion Tracker', format: 'CSV', date: '2024-12-26T09:00:00Z', size: '128 KB', status: 'completed' },
            ].map((report, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    report.format === 'PDF' ? 'bg-red-100 dark:bg-red-900/30' :
                    report.format === 'CSV' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      report.format === 'PDF' ? 'text-red-600' :
                      report.format === 'CSV' ? 'text-green-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{report.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {report.format} • {report.size} • {new Date(report.date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Schedule Report</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {reports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipients (comma separated)</label>
                <input
                  type="text"
                  placeholder="email1@company.com, email2@company.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
