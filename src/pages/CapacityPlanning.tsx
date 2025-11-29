import { useState } from 'react'
import {
  Gauge,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Package,
  Truck,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  BarChart3,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts'

interface CapacityMetric {
  id: string
  name: string
  category: 'storage' | 'throughput' | 'labor' | 'equipment'
  currentUsage: number
  maxCapacity: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  forecast: number
}

const mockMetrics: CapacityMetric[] = [
  { id: 'CAP001', name: 'Warehouse Storage', category: 'storage', currentUsage: 8500, maxCapacity: 10000, unit: 'pallets', trend: 'up', forecast: 9200 },
  { id: 'CAP002', name: 'Daily Receiving', category: 'throughput', currentUsage: 450, maxCapacity: 600, unit: 'pallets/day', trend: 'stable', forecast: 480 },
  { id: 'CAP003', name: 'Daily Shipping', category: 'throughput', currentUsage: 520, maxCapacity: 700, unit: 'orders/day', trend: 'up', forecast: 650 },
  { id: 'CAP004', name: 'Pick Rate', category: 'throughput', currentUsage: 1200, maxCapacity: 1500, unit: 'lines/hour', trend: 'up', forecast: 1350 },
  { id: 'CAP005', name: 'Labor Hours', category: 'labor', currentUsage: 320, maxCapacity: 400, unit: 'hours/day', trend: 'stable', forecast: 340 },
  { id: 'CAP006', name: 'Forklift Fleet', category: 'equipment', currentUsage: 12, maxCapacity: 15, unit: 'units', trend: 'stable', forecast: 12 },
  { id: 'CAP007', name: 'Dock Doors', category: 'throughput', currentUsage: 8, maxCapacity: 12, unit: 'active', trend: 'up', forecast: 10 },
  { id: 'CAP008', name: 'Returns Processing', category: 'throughput', currentUsage: 85, maxCapacity: 150, unit: 'units/day', trend: 'down', forecast: 75 },
]

const storageHistoryData = [
  { month: 'Aug', usage: 7200, capacity: 10000 },
  { month: 'Sep', usage: 7500, capacity: 10000 },
  { month: 'Oct', usage: 7800, capacity: 10000 },
  { month: 'Nov', usage: 8200, capacity: 10000 },
  { month: 'Dec', usage: 8800, capacity: 10000 },
  { month: 'Jan', usage: 8500, capacity: 10000 },
]

const throughputForecast = [
  { week: 'Week 1', receiving: 450, shipping: 520 },
  { week: 'Week 2', receiving: 480, shipping: 560 },
  { week: 'Week 3', receiving: 520, shipping: 600 },
  { week: 'Week 4', receiving: 550, shipping: 650 },
  { week: 'Week 5', receiving: 500, shipping: 580 },
  { week: 'Week 6', receiving: 480, shipping: 550 },
]

const peakDemandData = [
  { hour: '6AM', demand: 45 },
  { hour: '8AM', demand: 78 },
  { hour: '10AM', demand: 95 },
  { hour: '12PM', demand: 82 },
  { hour: '2PM', demand: 88 },
  { hour: '4PM', demand: 100 },
  { hour: '6PM', demand: 72 },
  { hour: '8PM', demand: 45 },
]

export default function CapacityPlanning() {
  const [activeTab, setActiveTab] = useState<'overview' | 'storage' | 'throughput' | 'forecast'>('overview')

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getUtilizationBg = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getCategoryIcon = (category: CapacityMetric['category']) => {
    const icons = {
      storage: Package,
      throughput: TrendingUp,
      labor: Users,
      equipment: Truck,
    }
    return icons[category]
  }

  const overallUtilization = Math.round(
    (mockMetrics.reduce((sum, m) => sum + (m.currentUsage / m.maxCapacity) * 100, 0) / mockMetrics.length)
  )

  const criticalCapacity = mockMetrics.filter(m => (m.currentUsage / m.maxCapacity) >= 0.9).length
  const warningCapacity = mockMetrics.filter(m => {
    const util = m.currentUsage / m.maxCapacity
    return util >= 0.75 && util < 0.9
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capacity Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and forecast warehouse capacity utilization</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Calendar className="w-4 h-4" />
            Schedule Review
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <BarChart3 className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Gauge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Utilization</p>
              <p className={`text-xl font-bold ${getUtilizationColor(overallUtilization)}`}>
                {overallUtilization}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical (90%+)</p>
              <p className="text-xl font-bold text-red-600">{criticalCapacity}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Warning (75-90%)</p>
              <p className="text-xl font-bold text-yellow-600">{warningCapacity}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Healthy (&lt;75%)</p>
              <p className="text-xl font-bold text-green-600">
                {mockMetrics.length - criticalCapacity - warningCapacity}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'storage', label: 'Storage' },
            { id: 'throughput', label: 'Throughput' },
            { id: 'forecast', label: 'Forecast' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'storage' | 'throughput' | 'forecast')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Capacity Metrics Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockMetrics.map((metric) => {
              const utilization = Math.round((metric.currentUsage / metric.maxCapacity) * 100)
              const Icon = getCategoryIcon(metric.category)
              return (
                <div key={metric.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.name}</span>
                    </div>
                    {metric.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-red-500" />
                    ) : metric.trend === 'down' ? (
                      <ArrowDown className="w-4 h-4 text-green-500" />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {metric.currentUsage.toLocaleString()} / {metric.maxCapacity.toLocaleString()}
                      </span>
                      <span className={`font-bold ${getUtilizationColor(utilization)}`}>{utilization}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getUtilizationBg(utilization)}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{metric.unit}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Storage Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Storage Utilization Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={storageHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number) => [value.toLocaleString(), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="capacity"
                    stroke="#E5E7EB"
                    fill="#F3F4F6"
                    name="Max Capacity"
                  />
                  <Area
                    type="monotone"
                    dataKey="usage"
                    stroke="#3B82F6"
                    fill="#93C5FD"
                    name="Current Usage"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Demand Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Peak Demand Pattern</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakDemandData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value}%`, 'Demand']}
                  />
                  <Bar dataKey="demand" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Zones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { zone: 'Zone A - Bulk Storage', used: 2800, max: 3500, items: 'Oversized Items' },
              { zone: 'Zone B - Rack Storage', used: 4200, max: 4500, items: 'Standard Pallets' },
              { zone: 'Zone C - Pick Modules', used: 1500, max: 2000, items: 'High Velocity SKUs' },
            ].map((zone) => {
              const util = Math.round((zone.used / zone.max) * 100)
              return (
                <div key={zone.zone} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{zone.zone}</h4>
                  <p className="text-sm text-gray-500 mb-4">{zone.items}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {zone.used.toLocaleString()}
                      </span>
                      <span className={`text-lg font-bold ${getUtilizationColor(util)}`}>{util}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getUtilizationBg(util)}`}
                        style={{ width: `${util}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      of {zone.max.toLocaleString()} locations
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Storage History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">6-Month Storage Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={storageHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="usage" stroke="#3B82F6" fill="#93C5FD" name="Pallets Stored" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'throughput' && (
        <div className="space-y-6">
          {/* Throughput Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Receiving vs Shipping Throughput
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={throughputForecast}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="receiving" stroke="#10B981" strokeWidth={2} name="Receiving" />
                  <Line type="monotone" dataKey="shipping" stroke="#3B82F6" strokeWidth={2} name="Shipping" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Receiving (pallets/day)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Shipping (orders/day)</span>
              </div>
            </div>
          </div>

          {/* Throughput Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockMetrics
              .filter((m) => m.category === 'throughput')
              .map((metric) => {
                const util = Math.round((metric.currentUsage / metric.maxCapacity) * 100)
                return (
                  <div key={metric.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{metric.name}</h4>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {metric.currentUsage.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{metric.unit}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Max: {metric.maxCapacity.toLocaleString()}
                      </span>
                      <span className={`font-medium ${getUtilizationColor(util)}`}>{util}%</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Forecast Alert */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-400">Capacity Warning</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Storage utilization projected to reach 92% in 4 weeks based on current trends.
                  Consider overflow options or inventory reduction strategies.
                </p>
              </div>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">6-Week Capacity Forecast</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Current
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Week 2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Week 4
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Week 6
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Risk
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockMetrics.slice(0, 5).map((metric) => {
                  const currentUtil = Math.round((metric.currentUsage / metric.maxCapacity) * 100)
                  const week2 = Math.round(currentUtil * 1.02)
                  const week4 = Math.round(currentUtil * 1.05)
                  const week6 = Math.round(currentUtil * 1.08)
                  return (
                    <tr key={metric.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{metric.name}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getUtilizationColor(currentUtil)}`}>{currentUtil}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getUtilizationColor(week2)}`}>{week2}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getUtilizationColor(week4)}`}>{week4}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getUtilizationColor(week6)}`}>{week6}%</span>
                      </td>
                      <td className="px-6 py-4">
                        {week6 >= 90 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
                            High
                          </span>
                        ) : week6 >= 75 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium">
                            Medium
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                            Low
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-400">Optimize Slotting</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Reslot slow-moving inventory to consolidate space and free up prime pick locations.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-400">Schedule Overtime</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Add overtime shifts weeks 3-4 to handle projected shipping volume increase.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800 dark:text-purple-400">Evaluate Overflow Options</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Contact overflow warehouse partners to secure additional capacity for peak season.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
