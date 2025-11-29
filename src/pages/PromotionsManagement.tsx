import { useState } from 'react'
import {
  Tag,
  Percent,
  Search,
  Plus,
  Calendar,
  CheckCircle,
  Eye,
  Package,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Promotion {
  id: string
  promotionCode: string
  name: string
  type: 'bogo' | 'percent_off' | 'fixed_discount' | 'free_shipping' | 'bundle' | 'tiered'
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  discountValue: number
  minOrderValue?: number
  maxUses?: number
  currentUses: number
  applicableItems: string[]
  excludedItems: string[]
  redemptionCount: number
  revenue: number
}

const mockPromotions: Promotion[] = [
  { id: '1', promotionCode: 'SUMMER25', name: 'Summer Sale 25% Off', type: 'percent_off', status: 'active', startDate: '2024-06-01', endDate: '2024-08-31', discountValue: 25, minOrderValue: 50, maxUses: 10000, currentUses: 3456, applicableItems: ['All Items'], excludedItems: ['Clearance'], redemptionCount: 3456, revenue: 125400 },
  { id: '2', promotionCode: 'FREESHIP', name: 'Free Shipping Over $75', type: 'free_shipping', status: 'active', startDate: '2024-01-01', endDate: '2024-12-31', discountValue: 0, minOrderValue: 75, currentUses: 8920, applicableItems: ['All Items'], excludedItems: [], redemptionCount: 8920, revenue: 892000 },
  { id: '3', promotionCode: 'BOGO50', name: 'Buy One Get One 50% Off', type: 'bogo', status: 'scheduled', startDate: '2024-07-01', endDate: '2024-07-31', discountValue: 50, currentUses: 0, applicableItems: ['Category: Apparel'], excludedItems: [], redemptionCount: 0, revenue: 0 },
  { id: '4', promotionCode: 'SAVE10', name: '$10 Off Orders Over $50', type: 'fixed_discount', status: 'active', startDate: '2024-01-01', endDate: '2024-06-30', discountValue: 10, minOrderValue: 50, maxUses: 5000, currentUses: 4890, applicableItems: ['All Items'], excludedItems: [], redemptionCount: 4890, revenue: 244500 },
  { id: '5', promotionCode: 'BUNDLE20', name: 'Bundle Deal 20% Off', type: 'bundle', status: 'paused', startDate: '2024-03-01', endDate: '2024-05-31', discountValue: 20, currentUses: 890, applicableItems: ['Bundle SKUs'], excludedItems: [], redemptionCount: 890, revenue: 45600 },
  { id: '6', promotionCode: 'TIER100', name: 'Spend More Save More', type: 'tiered', status: 'expired', startDate: '2024-01-01', endDate: '2024-03-31', discountValue: 15, minOrderValue: 100, currentUses: 2340, applicableItems: ['All Items'], excludedItems: ['Electronics'], redemptionCount: 2340, revenue: 234000 },
]

const redemptionTrend = [
  { week: 'Week 1', redemptions: 450, revenue: 22500 },
  { week: 'Week 2', redemptions: 520, revenue: 26000 },
  { week: 'Week 3', redemptions: 680, revenue: 34000 },
  { week: 'Week 4', redemptions: 590, revenue: 29500 },
  { week: 'Week 5', redemptions: 720, revenue: 36000 },
  { week: 'Week 6', redemptions: 850, revenue: 42500 },
]

const promotionsByType = [
  { type: 'Percent Off', count: 12, revenue: 156000 },
  { type: 'Free Shipping', count: 3, revenue: 892000 },
  { type: 'BOGO', count: 5, revenue: 78000 },
  { type: 'Fixed Discount', count: 8, revenue: 244500 },
  { type: 'Bundle', count: 4, revenue: 45600 },
]

export default function PromotionsManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'analytics'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)

  const getStatusBadge = (status: Promotion['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return styles[status]
  }

  const getTypeBadge = (type: Promotion['type']) => {
    const styles = {
      bogo: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      percent_off: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      fixed_discount: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      free_shipping: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      bundle: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      tiered: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    }
    return styles[type]
  }

  const filteredPromotions = mockPromotions.filter(promo => {
    const matchesSearch = promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.promotionCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || promo.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const stats = {
    activePromotions: mockPromotions.filter(p => p.status === 'active').length,
    totalRedemptions: mockPromotions.reduce((sum, p) => sum + p.redemptionCount, 0),
    totalRevenue: mockPromotions.reduce((sum, p) => sum + p.revenue, 0),
    avgDiscount: Math.round(mockPromotions.filter(p => p.discountValue > 0).reduce((sum, p) => sum + p.discountValue, 0) / mockPromotions.filter(p => p.discountValue > 0).length),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promotions Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Discounts, coupons, and promotional campaigns</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Create Promotion
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Promotions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activePromotions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Redemptions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalRedemptions.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Promo Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${(stats.totalRevenue / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Percent className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Discount</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgDiscount}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Promotions', icon: Tag },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: Percent },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option>Active</option>
              <option>Scheduled</option>
              <option>Paused</option>
              <option>Expired</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date Range</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Redemptions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPromotions.map(promo => (
                  <tr key={promo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{promo.promotionCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{promo.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(promo.type)}`}>
                        {promo.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(promo.status)}`}>
                        {promo.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {promo.startDate} - {promo.endDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {promo.redemptionCount.toLocaleString()}
                      {promo.maxUses && (
                        <span className="text-gray-500 dark:text-gray-400"> / {promo.maxUses.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      ${promo.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPromotion(promo)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Promotion Timeline</h3>
          <div className="space-y-4">
            {mockPromotions.map(promo => (
              <div key={promo.id} className="flex items-center gap-4">
                <div className="w-32">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(promo.status)}`}>
                    {promo.promotionCode}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div
                      className={`absolute h-full rounded-lg ${
                        promo.status === 'active' ? 'bg-green-500' :
                        promo.status === 'scheduled' ? 'bg-purple-500' :
                        promo.status === 'paused' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}
                      style={{
                        left: '10%',
                        width: '60%',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {promo.name}
                    </div>
                  </div>
                </div>
                <div className="w-48 text-sm text-gray-600 dark:text-gray-400">
                  {promo.startDate} - {promo.endDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Redemption Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={redemptionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line type="monotone" dataKey="redemptions" name="Redemptions" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Promotion Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={promotionsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Promotions</h3>
            <div className="space-y-3">
              {mockPromotions
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((promo, index) => (
                  <div key={promo.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{promo.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{promo.promotionCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">${promo.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{promo.redemptionCount.toLocaleString()} redemptions</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Promotion Detail Modal */}
      {selectedPromotion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedPromotion.promotionCode}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPromotion.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedPromotion(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(selectedPromotion.type)}`}>
                  {selectedPromotion.type.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedPromotion.status)}`}>
                  {selectedPromotion.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Discount</p>
                  <p className="text-gray-900 dark:text-white font-bold">
                    {selectedPromotion.type === 'fixed_discount' ? `$${selectedPromotion.discountValue}` :
                     selectedPromotion.type === 'free_shipping' ? 'Free' :
                     `${selectedPromotion.discountValue}%`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Min Order</p>
                  <p className="text-gray-900 dark:text-white">${selectedPromotion.minOrderValue || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="text-gray-900 dark:text-white">{selectedPromotion.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                  <p className="text-gray-900 dark:text-white">{selectedPromotion.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Redemptions</p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedPromotion.redemptionCount.toLocaleString()}
                    {selectedPromotion.maxUses && ` / ${selectedPromotion.maxUses.toLocaleString()}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                  <p className="text-gray-900 dark:text-white font-bold">${selectedPromotion.revenue.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Applicable Items</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPromotion.applicableItems.map(item => (
                    <span key={item} className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {selectedPromotion.excludedItems.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Excluded Items</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPromotion.excludedItems.map(item => (
                      <span key={item} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPromotion(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
