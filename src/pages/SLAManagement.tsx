import { useState } from 'react'
import {
  Timer,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Target,
  Users,
  Truck,
  Package,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface SLA {
  id: string
  name: string
  category: 'receiving' | 'shipping' | 'picking' | 'returns' | 'inventory'
  metric: string
  target: number
  unit: string
  currentValue: number
  status: 'meeting' | 'at_risk' | 'breached'
  customer?: string
  period: 'daily' | 'weekly' | 'monthly'
  penalties?: {
    threshold: number
    amount: number
  }[]
}

interface SLAPerformance {
  date: string
  actual: number
  target: number
}

const mockSLAs: SLA[] = [
  {
    id: 'SLA001',
    name: 'Same-Day Ship Rate',
    category: 'shipping',
    metric: 'Orders shipped same day if received by 2PM',
    target: 98,
    unit: '%',
    currentValue: 99.2,
    status: 'meeting',
    customer: 'All Customers',
    period: 'daily',
    penalties: [
      { threshold: 95, amount: 500 },
      { threshold: 90, amount: 1500 },
    ],
  },
  {
    id: 'SLA002',
    name: 'Receiving Turnaround',
    category: 'receiving',
    metric: 'Time from dock arrival to put-away completion',
    target: 4,
    unit: 'hours',
    currentValue: 3.2,
    status: 'meeting',
    customer: 'Tech Corp',
    period: 'daily',
  },
  {
    id: 'SLA003',
    name: 'Pick Accuracy',
    category: 'picking',
    metric: 'Order lines picked correctly',
    target: 99.9,
    unit: '%',
    currentValue: 99.7,
    status: 'at_risk',
    customer: 'All Customers',
    period: 'weekly',
    penalties: [
      { threshold: 99.5, amount: 250 },
      { threshold: 99, amount: 1000 },
    ],
  },
  {
    id: 'SLA004',
    name: 'Return Processing Time',
    category: 'returns',
    metric: 'Time from RMA receipt to disposition',
    target: 48,
    unit: 'hours',
    currentValue: 52,
    status: 'breached',
    customer: 'MegaRetail Inc',
    period: 'daily',
    penalties: [
      { threshold: 72, amount: 100 },
    ],
  },
  {
    id: 'SLA005',
    name: 'Inventory Accuracy',
    category: 'inventory',
    metric: 'SKU-level inventory accuracy',
    target: 99.5,
    unit: '%',
    currentValue: 99.8,
    status: 'meeting',
    customer: 'All Customers',
    period: 'monthly',
  },
  {
    id: 'SLA006',
    name: 'B2B Order Fulfillment',
    category: 'shipping',
    metric: 'Complete orders shipped within 24 hours',
    target: 95,
    unit: '%',
    currentValue: 92,
    status: 'at_risk',
    customer: 'Wholesale Partners',
    period: 'weekly',
  },
]

const performanceData: SLAPerformance[] = [
  { date: 'Mon', actual: 98.5, target: 98 },
  { date: 'Tue', actual: 99.1, target: 98 },
  { date: 'Wed', actual: 97.8, target: 98 },
  { date: 'Thu', actual: 99.4, target: 98 },
  { date: 'Fri', actual: 98.9, target: 98 },
  { date: 'Sat', actual: 99.2, target: 98 },
  { date: 'Sun', actual: 99.5, target: 98 },
]

const categoryPerformance = [
  { category: 'Shipping', compliance: 98 },
  { category: 'Receiving', compliance: 95 },
  { category: 'Picking', compliance: 99 },
  { category: 'Returns', compliance: 87 },
  { category: 'Inventory', compliance: 100 },
]

export default function SLAManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedSLA, setSelectedSLA] = useState<SLA | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'slas' | 'alerts'>('overview')

  const getStatusBadge = (status: SLA['status']) => {
    const styles = {
      meeting: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      at_risk: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      breached: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    const labels = {
      meeting: 'Meeting',
      at_risk: 'At Risk',
      breached: 'Breached',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getCategoryIcon = (category: SLA['category']) => {
    const icons = {
      receiving: Truck,
      shipping: Package,
      picking: Target,
      returns: Clock,
      inventory: Package,
    }
    const Icon = icons[category]
    return <Icon className="w-4 h-4" />
  }

  const filteredSLAs = mockSLAs.filter((sla) => {
    const matchesSearch =
      sla.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sla.customer?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || sla.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: mockSLAs.length,
    meeting: mockSLAs.filter((s) => s.status === 'meeting').length,
    atRisk: mockSLAs.filter((s) => s.status === 'at_risk').length,
    breached: mockSLAs.filter((s) => s.status === 'breached').length,
  }

  const overallCompliance = Math.round(
    (stats.meeting / stats.total) * 100
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SLA Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage service level agreements</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Create SLA
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total SLAs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Meeting</p>
              <p className="text-xl font-bold text-green-600">{stats.meeting}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">At Risk</p>
              <p className="text-xl font-bold text-yellow-600">{stats.atRisk}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Breached</p>
              <p className="text-xl font-bold text-red-600">{stats.breached}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compliance</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{overallCompliance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'slas', label: 'All SLAs' },
            { id: 'alerts', label: 'Alerts & Breaches' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'slas' | 'alerts')}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Same-Day Ship Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[95, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="target" stroke="#EF4444" strokeDasharray="5 5" name="Target" />
                  <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis dataKey="category" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Compliance']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar
                    dataKey="compliance"
                    radius={[0, 4, 4, 0]}
                    fill="#3B82F6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Status Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockSLAs.slice(0, 3).map((sla) => (
              <div
                key={sla.id}
                className={`p-4 rounded-xl border-2 ${
                  sla.status === 'meeting'
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
                    : sla.status === 'at_risk'
                    ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{sla.name}</h4>
                  {getStatusBadge(sla.status)}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {sla.currentValue}
                      <span className="text-lg">{sla.unit}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Target: {sla.target}
                      {sla.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{sla.customer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'slas' && (
        <>
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search SLAs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">All Categories</option>
              <option value="shipping">Shipping</option>
              <option value="receiving">Receiving</option>
              <option value="picking">Picking</option>
              <option value="returns">Returns</option>
              <option value="inventory">Inventory</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    SLA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Current
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSLAs.map((sla) => (
                  <tr key={sla.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{sla.name}</div>
                      <div className="text-xs text-gray-500">{sla.metric}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        {getCategoryIcon(sla.category)}
                        <span className="capitalize">{sla.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {sla.target}
                      {sla.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${
                          sla.status === 'meeting'
                            ? 'text-green-600'
                            : sla.status === 'at_risk'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {sla.currentValue}
                        {sla.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sla.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {sla.customer}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedSLA(sla)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {mockSLAs
            .filter((sla) => sla.status !== 'meeting')
            .map((sla) => (
              <div
                key={sla.id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 ${
                  sla.status === 'breached' ? 'border-red-500' : 'border-yellow-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {sla.status === 'breached' ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{sla.name}</h3>
                      <p className="text-sm text-gray-500">{sla.customer}</p>
                    </div>
                  </div>
                  {getStatusBadge(sla.status)}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Current</p>
                    <p className="text-2xl font-bold text-red-600">
                      {sla.currentValue}
                      {sla.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Target</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {sla.target}
                      {sla.unit}
                    </p>
                  </div>
                  {sla.penalties && sla.penalties.length > 0 && (
                    <div className="ml-auto">
                      <p className="text-sm text-gray-500">Potential Penalty</p>
                      <p className="text-xl font-bold text-red-600">${sla.penalties[0].amount}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

          {mockSLAs.filter((sla) => sla.status !== 'meeting').length === 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-400">All SLAs Meeting Target</h3>
              <p className="text-green-600 dark:text-green-300">No alerts or breaches to display</p>
            </div>
          )}
        </div>
      )}

      {/* SLA Detail Modal */}
      {selectedSLA && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSLA.name}</h2>
                <button
                  onClick={() => setSelectedSLA(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Category</label>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedSLA.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Period</label>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedSLA.period}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Target</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedSLA.target}
                    {selectedSLA.unit}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Current Value</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedSLA.currentValue}
                    {selectedSLA.unit}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Metric Description</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedSLA.metric}</p>
              </div>
              {selectedSLA.penalties && selectedSLA.penalties.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Penalty Structure</label>
                  <div className="mt-2 space-y-2">
                    {selectedSLA.penalties.map((penalty, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Below {penalty.threshold}{selectedSLA.unit}</span>
                        <span className="font-medium text-red-600">${penalty.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
