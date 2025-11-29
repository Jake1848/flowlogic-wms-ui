import { useState } from 'react'
import {
  Layers,
  Package,
  Search,
  Plus,
  ArrowLeftRight,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Pallet {
  id: string
  palletId: string
  type: 'standard' | 'euro' | 'block' | 'stringer' | 'custom'
  status: 'available' | 'in_use' | 'damaged' | 'quarantine' | 'repair' | 'returned'
  location: string
  owner: 'owned' | 'rented' | 'exchange' | 'customer'
  poolProvider?: string
  lastInspection: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  cycleCount: number
  currentLoad?: string
  dimensions: string
  maxWeight: number
}

interface PalletPool {
  provider: string
  totalCount: number
  available: number
  inUse: number
  damaged: number
  monthlyRent: number
}

const mockPallets: Pallet[] = [
  { id: '1', palletId: 'PLT-00001', type: 'standard', status: 'in_use', location: 'DOCK-01', owner: 'owned', lastInspection: '2024-01-10', condition: 'good', cycleCount: 45, currentLoad: 'ASN-2024-0089', dimensions: '48x40', maxWeight: 2500 },
  { id: '2', palletId: 'PLT-00002', type: 'standard', status: 'available', location: 'PALLET-YARD-A', owner: 'owned', lastInspection: '2024-01-12', condition: 'excellent', cycleCount: 12, dimensions: '48x40', maxWeight: 2500 },
  { id: '3', palletId: 'CHEP-45678', type: 'block', status: 'in_use', location: 'A-01-05', owner: 'rented', poolProvider: 'CHEP', lastInspection: '2024-01-08', condition: 'good', cycleCount: 89, currentLoad: 'LOC-A-01-05', dimensions: '48x40', maxWeight: 2800 },
  { id: '4', palletId: 'PLT-00003', type: 'standard', status: 'damaged', location: 'REPAIR-BAY', owner: 'owned', lastInspection: '2024-01-14', condition: 'poor', cycleCount: 78, dimensions: '48x40', maxWeight: 2500 },
  { id: '5', palletId: 'PECO-12345', type: 'block', status: 'in_use', location: 'B-02-03', owner: 'rented', poolProvider: 'PECO', lastInspection: '2024-01-09', condition: 'good', cycleCount: 56, currentLoad: 'LOC-B-02-03', dimensions: '48x40', maxWeight: 2800 },
  { id: '6', palletId: 'PLT-00004', type: 'euro', status: 'available', location: 'PALLET-YARD-B', owner: 'owned', lastInspection: '2024-01-11', condition: 'excellent', cycleCount: 23, dimensions: '48x32', maxWeight: 2200 },
  { id: '7', palletId: 'CHEP-45679', type: 'block', status: 'returned', location: 'STAGING-OUT', owner: 'exchange', poolProvider: 'CHEP', lastInspection: '2024-01-13', condition: 'fair', cycleCount: 102, dimensions: '48x40', maxWeight: 2800 },
  { id: '8', palletId: 'PLT-00005', type: 'standard', status: 'quarantine', location: 'QC-HOLD', owner: 'owned', lastInspection: '2024-01-14', condition: 'fair', cycleCount: 67, dimensions: '48x40', maxWeight: 2500 },
]

const mockPools: PalletPool[] = [
  { provider: 'CHEP', totalCount: 500, available: 125, inUse: 350, damaged: 25, monthlyRent: 2500 },
  { provider: 'PECO', totalCount: 300, available: 85, inUse: 200, damaged: 15, monthlyRent: 1500 },
  { provider: 'iGPS', totalCount: 150, available: 45, inUse: 95, damaged: 10, monthlyRent: 900 },
]

const palletsByStatus = [
  { status: 'Available', count: 450, color: '#10B981' },
  { status: 'In Use', count: 680, color: '#3B82F6' },
  { status: 'Damaged', count: 45, color: '#EF4444' },
  { status: 'Repair', count: 30, color: '#F59E0B' },
  { status: 'Quarantine', count: 15, color: '#8B5CF6' },
]

const weeklyMovement = [
  { day: 'Mon', received: 120, shipped: 95, returned: 45 },
  { day: 'Tue', received: 85, shipped: 110, returned: 30 },
  { day: 'Wed', received: 150, shipped: 125, returned: 55 },
  { day: 'Thu', received: 95, shipped: 140, returned: 40 },
  { day: 'Fri', received: 180, shipped: 165, returned: 60 },
]

export default function PalletManagement() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'pools' | 'analytics'>('inventory')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null)

  const getStatusBadge = (status: Pallet['status']) => {
    const styles = {
      available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      in_use: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      damaged: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      quarantine: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      repair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      returned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return styles[status]
  }

  const getConditionBadge = (condition: Pallet['condition']) => {
    const styles = {
      excellent: 'text-green-600 dark:text-green-400',
      good: 'text-blue-600 dark:text-blue-400',
      fair: 'text-yellow-600 dark:text-yellow-400',
      poor: 'text-red-600 dark:text-red-400',
    }
    return styles[condition]
  }

  const filteredPallets = mockPallets.filter(pallet => {
    const matchesSearch = pallet.palletId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pallet.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || pallet.status === statusFilter.toLowerCase().replace(' ', '_')
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalPallets: 1220,
    available: 450,
    inUse: 680,
    damaged: 45,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pallet Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Pallet inventory, pooling, and tracking</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <ArrowLeftRight className="w-4 h-4" />
            Transfer
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Pallets
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pallets</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalPallets.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Use</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.inUse}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Damaged</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.damaged}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'inventory', label: 'Pallet Inventory', icon: Layers },
            { id: 'pools', label: 'Pallet Pools', icon: RotateCcw },
            { id: 'analytics', label: 'Analytics', icon: Package },
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

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search pallets..."
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
              <option>Available</option>
              <option>In Use</option>
              <option>Damaged</option>
              <option>Quarantine</option>
              <option>Repair</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pallet ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Condition</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cycles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPallets.map(pallet => (
                  <tr key={pallet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{pallet.palletId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white capitalize">{pallet.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(pallet.status)}`}>
                        {pallet.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{pallet.location}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white capitalize">
                      {pallet.owner}
                      {pallet.poolProvider && <span className="text-xs text-gray-500"> ({pallet.poolProvider})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium capitalize ${getConditionBadge(pallet.condition)}`}>
                        {pallet.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{pallet.cycleCount}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPallet(pallet)}
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

      {/* Pools Tab */}
      {activeTab === 'pools' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {mockPools.map(pool => (
            <div key={pool.provider} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pool.provider}</h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full">
                  Pool
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Count</span>
                  <span className="font-bold text-gray-900 dark:text-white">{pool.totalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Available</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{pool.available}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">In Use</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{pool.inUse}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Damaged</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{pool.damaged}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Rent</span>
                    <span className="font-bold text-gray-900 dark:text-white">${pool.monthlyRent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  Request More
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  Return
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pallets by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={palletsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  label={({ value }) => `${value}`}
                >
                  {palletsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {palletsByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Movement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyMovement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="received" name="Received" fill="#10B981" />
                <Bar dataKey="shipped" name="Shipped" fill="#3B82F6" />
                <Bar dataKey="returned" name="Returned" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pallet Detail Modal */}
      {selectedPallet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedPallet.palletId}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{selectedPallet.type} Pallet</h2>
                </div>
                <button
                  onClick={() => setSelectedPallet(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedPallet.status)}`}>
                  {selectedPallet.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionBadge(selectedPallet.condition)} bg-gray-100 dark:bg-gray-700`}>
                  {selectedPallet.condition}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-gray-900 dark:text-white font-mono">{selectedPallet.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                  <p className="text-gray-900 dark:text-white capitalize">{selectedPallet.owner}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dimensions</p>
                  <p className="text-gray-900 dark:text-white">{selectedPallet.dimensions}"</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Max Weight</p>
                  <p className="text-gray-900 dark:text-white">{selectedPallet.maxWeight} lbs</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cycle Count</p>
                  <p className="text-gray-900 dark:text-white">{selectedPallet.cycleCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Inspection</p>
                  <p className="text-gray-900 dark:text-white">{selectedPallet.lastInspection}</p>
                </div>
              </div>
              {selectedPallet.currentLoad && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Load</p>
                  <p className="text-gray-900 dark:text-white">{selectedPallet.currentLoad}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPallet(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Pallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
