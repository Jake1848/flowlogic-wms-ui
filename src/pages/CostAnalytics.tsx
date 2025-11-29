import { useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts'

interface CostCategory {
  name: string
  amount: number
  change: number
  color: string
}

const costCategories: CostCategory[] = [
  { name: 'Labor', amount: 85420, change: 3.2, color: '#3B82F6' },
  { name: 'Storage', amount: 42150, change: -1.5, color: '#10B981' },
  { name: 'Shipping', amount: 67890, change: 5.8, color: '#F59E0B' },
  { name: 'Equipment', amount: 12340, change: 0.2, color: '#8B5CF6' },
  { name: 'Supplies', amount: 8920, change: -2.1, color: '#EF4444' },
  { name: 'Utilities', amount: 15680, change: 4.5, color: '#EC4899' },
]

const monthlyTrendData = [
  { month: 'Aug', actual: 215000, budget: 220000 },
  { month: 'Sep', actual: 228000, budget: 225000 },
  { month: 'Oct', actual: 235000, budget: 230000 },
  { month: 'Nov', actual: 242000, budget: 235000 },
  { month: 'Dec', actual: 268000, budget: 250000 },
  { month: 'Jan', actual: 232400, budget: 240000 },
]

const costPerUnitData = [
  { month: 'Aug', picking: 0.42, packing: 0.28, shipping: 0.85 },
  { month: 'Sep', picking: 0.40, packing: 0.27, shipping: 0.82 },
  { month: 'Oct', picking: 0.38, packing: 0.26, shipping: 0.80 },
  { month: 'Nov', picking: 0.39, packing: 0.25, shipping: 0.78 },
  { month: 'Dec', picking: 0.45, packing: 0.30, shipping: 0.88 },
  { month: 'Jan', picking: 0.41, packing: 0.27, shipping: 0.83 },
]

const departmentCosts = [
  { department: 'Receiving', budget: 25000, actual: 24500 },
  { department: 'Picking', budget: 45000, actual: 47200 },
  { department: 'Packing', budget: 32000, actual: 30800 },
  { department: 'Shipping', budget: 55000, actual: 58500 },
  { department: 'Inventory', budget: 18000, actual: 17200 },
  { department: 'Returns', budget: 12000, actual: 11500 },
]

export default function CostAnalytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'breakdown'>('overview')
  const [timeRange, setTimeRange] = useState('month')

  const totalCost = costCategories.reduce((sum, cat) => sum + cat.amount, 0)
  const budgetVariance = monthlyTrendData[monthlyTrendData.length - 1].actual - monthlyTrendData[monthlyTrendData.length - 1].budget

  const pieData = costCategories.map(cat => ({
    name: cat.name,
    value: cat.amount,
    color: cat.color,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cost Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Analyze warehouse operational costs</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost (MTD)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${totalCost.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${budgetVariance < 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {budgetVariance < 0 ? (
                <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Budget Variance</p>
              <p className={`text-xl font-bold ${budgetVariance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {budgetVariance < 0 ? '-' : '+'}${Math.abs(budgetVariance).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cost per Order</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">$4.85</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Labor %</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {Math.round((costCategories[0].amount / totalCost) * 100)}%
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
            { id: 'trends', label: 'Trends' },
            { id: 'breakdown', label: 'Department Breakdown' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'trends' | 'breakdown')}
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
          {/* Cost Distribution Pie */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {costCategories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Categories Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Categories</h3>
            <div className="space-y-3">
              {costCategories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${cat.amount.toLocaleString()}
                    </span>
                    <span className={`flex items-center gap-1 text-sm ${
                      cat.change > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {cat.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(cat.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget vs Actual */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget vs Actual</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="budget" stroke="#9CA3AF" fill="#E5E7EB" name="Budget" />
                  <Area type="monotone" dataKey="actual" stroke="#3B82F6" fill="#93C5FD" name="Actual" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost per Unit Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costPerUnitData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="picking" stroke="#3B82F6" strokeWidth={2} name="Picking" />
                  <Line type="monotone" dataKey="packing" stroke="#10B981" strokeWidth={2} name="Packing" />
                  <Line type="monotone" dataKey="shipping" stroke="#F59E0B" strokeWidth={2} name="Shipping" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Picking Cost/Unit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Packing Cost/Unit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Shipping Cost/Unit</span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h4 className="text-sm text-gray-500 mb-2">Avg Cost per Order</h4>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">$4.85</span>
                <span className="text-green-600 text-sm flex items-center">
                  <ArrowDown className="w-3 h-3" /> 3.2%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">vs $5.01 last month</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h4 className="text-sm text-gray-500 mb-2">Labor Cost per Hour</h4>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">$24.50</span>
                <span className="text-red-600 text-sm flex items-center">
                  <ArrowUp className="w-3 h-3" /> 2.1%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Including benefits</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h4 className="text-sm text-gray-500 mb-2">Storage Cost per Pallet</h4>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">$12.00</span>
                <span className="text-gray-400 text-sm">No change</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Per month</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Budget vs Actual</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentCosts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                  <YAxis dataKey="department" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="budget" fill="#E5E7EB" name="Budget" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" fill="#3B82F6" name="Actual" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentCosts.map((dept) => {
              const variance = dept.actual - dept.budget
              const variancePercent = ((variance / dept.budget) * 100).toFixed(1)
              return (
                <div key={dept.department} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">{dept.department}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${dept.budget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Actual</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${dept.actual.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Variance</span>
                      <span className={`font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance > 0 ? '+' : ''}{variancePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
