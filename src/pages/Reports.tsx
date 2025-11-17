import { useState } from 'react'
import { Download, FileText, TrendingDown, AlertCircle, Calendar } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type ReportType = 'bad-items' | 'tolerance' | 'abn' | 'audit-completion' | 'detail-change'

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('bad-items')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const reports = [
    {
      id: 'bad-items' as ReportType,
      title: 'Bad Item Report',
      description: 'Items with quality issues or recurring problems',
      icon: AlertCircle,
      color: 'red',
    },
    {
      id: 'tolerance' as ReportType,
      title: 'Out of Tolerance',
      description: 'Items exceeding acceptable variance thresholds',
      icon: TrendingDown,
      color: 'yellow',
    },
    {
      id: 'abn' as ReportType,
      title: 'ABN Report',
      description: 'Service Level and Error Prevention ABNs',
      icon: FileText,
      color: 'blue',
    },
    {
      id: 'audit-completion' as ReportType,
      title: 'Audit Completion Tracker',
      description: 'Live progress and completion rates by associate',
      icon: Calendar,
      color: 'green',
    },
    {
      id: 'detail-change' as ReportType,
      title: 'Detail Change Log',
      description: 'Tracks overrides and manual adjustments',
      icon: FileText,
      color: 'purple',
    },
  ]

  // Mock data for charts
  const toleranceData = [
    { sku: 'SKU-1023', variance: 8.5, count: 12 },
    { sku: 'SKU-2045', variance: 7.2, count: 9 },
    { sku: 'SKU-3012', variance: 6.8, count: 7 },
    { sku: 'SKU-1234', variance: 5.9, count: 6 },
    { sku: 'SKU-5678', variance: 5.2, count: 5 },
  ]

  const auditCompletionData = [
    { associate: 'John D.', completed: 95, target: 100 },
    { associate: 'Sarah M.', completed: 88, target: 100 },
    { associate: 'Mike R.', completed: 82, target: 100 },
    { associate: 'Lisa K.', completed: 76, target: 100 },
    { associate: 'Tom B.', completed: 71, target: 100 },
  ]

  const exportReport = (format: 'csv' | 'pdf') => {
    // Mock export functionality
    const reportName = reports.find(r => r.id === selectedReport)?.title || 'Report'
    alert(`Exporting ${reportName} as ${format.toUpperCase()}...`)
  }

  const getColorForVariance = (variance: number) => {
    if (variance > 7) return '#ef4444'
    if (variance > 5) return '#f59e0b'
    return '#10b981'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Specialized reports and analytics for warehouse operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportReport('csv')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const Icon = report.icon
          const isSelected = selectedReport === report.id
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`text-left p-6 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`p-3 rounded-xl ${
                    report.color === 'red'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                      : report.color === 'yellow'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                      : report.color === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : report.color === 'green'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Filter by Date Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'tolerance' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Out of Tolerance Trends - Top Offenders
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={toleranceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="sku" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Variance %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Occurrences
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {toleranceData.map((item) => (
                  <tr key={item.sku}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600 dark:text-red-400">
                      {item.variance.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'audit-completion' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Audit Completion by Associate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={auditCompletionData} layout="horizontal">
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
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {associate.associate}
                </span>
                <div className="flex items-center space-x-4">
                  <div className="w-48 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        associate.completed >= 90
                          ? 'bg-green-500'
                          : associate.completed >= 75
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${associate.completed}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100 w-16 text-right">
                    {associate.completed}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedReport === 'bad-items' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
              <div
                key={item.sku}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{item.sku}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{item.issue}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      item.severity === 'Critical'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : item.severity === 'High'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                        : item.severity === 'Medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {item.severity}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.occurrences} occurrences
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
