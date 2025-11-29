import { useState } from 'react'
import {
  RotateCcw,
  Package,
  Search,
  Plus,
  CheckCircle,
  Clock,
  Eye,
  DollarSign,
  TrendingDown,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface RMA {
  id: string
  rmaNumber: string
  orderNumber: string
  customerName: string
  status: 'pending' | 'approved' | 'received' | 'inspecting' | 'processed' | 'refunded' | 'rejected' | 'closed'
  returnReason: string
  returnType: 'refund' | 'exchange' | 'repair' | 'credit'
  items: number
  totalValue: number
  createdDate: string
  receivedDate?: string
  processedDate?: string
  disposition?: 'restock' | 'refurbish' | 'scrap' | 'vendor_return'
  notes?: string
}

const mockRMAs: RMA[] = [
  { id: '1', rmaNumber: 'RMA-2024-0456', orderNumber: 'ORD-2024-4890', customerName: 'Acme Corp', status: 'inspecting', returnReason: 'Defective product', returnType: 'refund', items: 3, totalValue: 299.97, createdDate: '2024-01-12', receivedDate: '2024-01-14', notes: 'Customer reported unit not powering on' },
  { id: '2', rmaNumber: 'RMA-2024-0457', orderNumber: 'ORD-2024-4856', customerName: 'TechStart Inc', status: 'approved', returnReason: 'Wrong item shipped', returnType: 'exchange', items: 1, totalValue: 149.99, createdDate: '2024-01-13' },
  { id: '3', rmaNumber: 'RMA-2024-0455', orderNumber: 'ORD-2024-4820', customerName: 'Global Retail', status: 'processed', returnReason: 'Customer changed mind', returnType: 'credit', items: 5, totalValue: 524.95, createdDate: '2024-01-10', receivedDate: '2024-01-12', processedDate: '2024-01-14', disposition: 'restock' },
  { id: '4', rmaNumber: 'RMA-2024-0458', orderNumber: 'ORD-2024-4901', customerName: 'SmallBiz LLC', status: 'pending', returnReason: 'Damaged in shipping', returnType: 'refund', items: 2, totalValue: 189.98, createdDate: '2024-01-14' },
  { id: '5', rmaNumber: 'RMA-2024-0454', orderNumber: 'ORD-2024-4785', customerName: 'Enterprise Co', status: 'refunded', returnReason: 'Product not as described', returnType: 'refund', items: 1, totalValue: 399.99, createdDate: '2024-01-08', receivedDate: '2024-01-10', processedDate: '2024-01-12', disposition: 'vendor_return' },
  { id: '6', rmaNumber: 'RMA-2024-0459', orderNumber: 'ORD-2024-4910', customerName: 'Quick Ship Co', status: 'received', returnReason: 'Warranty claim', returnType: 'repair', items: 1, totalValue: 899.99, createdDate: '2024-01-14', receivedDate: '2024-01-15' },
  { id: '7', rmaNumber: 'RMA-2024-0453', orderNumber: 'ORD-2024-4750', customerName: 'Budget Buys', status: 'rejected', returnReason: 'Outside return window', returnType: 'refund', items: 2, totalValue: 79.98, createdDate: '2024-01-06', notes: 'Return request submitted 45 days after purchase' },
]

const returnsByReason = [
  { reason: 'Defective', count: 45, value: 8900 },
  { reason: 'Wrong Item', count: 28, value: 4200 },
  { reason: 'Damaged', count: 32, value: 5600 },
  { reason: 'Changed Mind', count: 56, value: 7800 },
  { reason: 'Not as Described', count: 19, value: 3400 },
  { reason: 'Warranty', count: 15, value: 6200 },
]

const dispositionData = [
  { name: 'Restock', value: 45, color: '#10B981' },
  { name: 'Refurbish', value: 25, color: '#3B82F6' },
  { name: 'Scrap', value: 15, color: '#EF4444' },
  { name: 'Vendor Return', value: 15, color: '#F59E0B' },
]

export default function RMAProcessing() {
  const [activeTab, setActiveTab] = useState<'list' | 'process' | 'analytics'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedRMA, setSelectedRMA] = useState<RMA | null>(null)

  const getStatusBadge = (status: RMA['status']) => {
    const styles: Record<RMA['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      received: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      inspecting: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      processed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      refunded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return styles[status]
  }

  const getTypeBadge = (type: RMA['returnType']) => {
    const styles = {
      refund: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      exchange: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      repair: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      credit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    }
    return styles[type]
  }

  const filteredRMAs = mockRMAs.filter(rma => {
    const matchesSearch = rma.rmaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rma.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rma.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || rma.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalRMAs: mockRMAs.length,
    pendingApproval: mockRMAs.filter(r => r.status === 'pending').length,
    inProcess: mockRMAs.filter(r => ['approved', 'received', 'inspecting', 'processed'].includes(r.status)).length,
    totalValue: mockRMAs.reduce((sum, r) => sum + r.totalValue, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RMA Processing</h1>
          <p className="text-gray-600 dark:text-gray-400">Return merchandise authorization and processing</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Create RMA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total RMAs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalRMAs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingApproval}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Process</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.inProcess}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Return Value</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'RMA List', icon: RotateCcw },
            { id: 'process', label: 'Processing Queue', icon: Package },
            { id: 'analytics', label: 'Analytics', icon: DollarSign },
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

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search RMAs..."
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
              <option>Pending</option>
              <option>Approved</option>
              <option>Received</option>
              <option>Inspecting</option>
              <option>Processed</option>
              <option>Refunded</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">RMA #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredRMAs.map(rma => (
                  <tr key={rma.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{rma.rmaNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rma.customerName}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{rma.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{rma.returnReason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(rma.returnType)}`}>
                        {rma.returnType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(rma.status)}`}>
                        {rma.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${rma.totalValue.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRMA(rma)}
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

      {activeTab === 'process' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['pending', 'approved', 'received', 'inspecting'].map(status => (
            <div key={status} className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize flex items-center gap-2">
                {status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                {status === 'approved' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                {status === 'received' && <Package className="w-4 h-4 text-purple-500" />}
                {status === 'inspecting' && <Eye className="w-4 h-4 text-orange-500" />}
                {status}
                <span className="ml-auto text-sm text-gray-500">
                  {mockRMAs.filter(r => r.status === status).length}
                </span>
              </h3>
              <div className="space-y-2">
                {mockRMAs
                  .filter(r => r.status === status)
                  .map(rma => (
                    <div
                      key={rma.id}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedRMA(rma)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{rma.rmaNumber}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeBadge(rma.returnType)}`}>
                          {rma.returnType}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{rma.customerName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{rma.returnReason}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">${rma.totalValue.toFixed(2)}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Returns by Reason</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={returnsByReason}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="reason" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }} />
                <Bar dataKey="count" name="Returns" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Disposition Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dispositionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ value }) => `${value}%`}>
                  {dispositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {dispositionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedRMA && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedRMA.rmaNumber}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRMA.customerName}</h2>
                </div>
                <button onClick={() => setSelectedRMA(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">×</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(selectedRMA.returnType)}`}>{selectedRMA.returnType}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRMA.status)}`}>{selectedRMA.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p><p className="text-gray-900 dark:text-white font-mono">{selectedRMA.orderNumber}</p></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Items</p><p className="text-gray-900 dark:text-white">{selectedRMA.items}</p></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p><p className="text-gray-900 dark:text-white font-bold">${selectedRMA.totalValue.toFixed(2)}</p></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Created</p><p className="text-gray-900 dark:text-white">{selectedRMA.createdDate}</p></div>
              </div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Return Reason</p><p className="text-gray-900 dark:text-white">{selectedRMA.returnReason}</p></div>
              {selectedRMA.notes && <div><p className="text-sm text-gray-500 dark:text-gray-400">Notes</p><p className="text-gray-900 dark:text-white">{selectedRMA.notes}</p></div>}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setSelectedRMA(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">Close</button>
              {selectedRMA.status === 'pending' && <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>}
              {selectedRMA.status === 'inspecting' && <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Process</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
