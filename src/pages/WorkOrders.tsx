import { useState } from 'react'
import {
  Wrench,
  Package,
  Search,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface WorkOrder {
  id: string
  workOrderNumber: string
  type: 'assembly' | 'disassembly' | 'rework' | 'repair' | 'packaging' | 'labeling'
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  itemSku: string
  itemDescription: string
  quantity: number
  completedQty: number
  workstation: string
  assignedTo: string
  dueDate: string
  startDate?: string
  completedDate?: string
  estimatedHours: number
  actualHours?: number
  notes: string
}

const mockWorkOrders: WorkOrder[] = [
  { id: '1', workOrderNumber: 'WO-2024-0145', type: 'assembly', status: 'in_progress', priority: 'high', itemSku: 'KIT-1001', itemDescription: 'Premium Gift Set Assembly', quantity: 100, completedQty: 65, workstation: 'WS-A01', assignedTo: 'John Smith', dueDate: '2024-01-20', startDate: '2024-01-15', estimatedHours: 16, actualHours: 10, notes: 'Rush order for Valentine promotion' },
  { id: '2', workOrderNumber: 'WO-2024-0146', type: 'packaging', status: 'pending', priority: 'medium', itemSku: 'SKU-5001', itemDescription: 'Custom Box Packaging', quantity: 500, completedQty: 0, workstation: 'WS-B02', assignedTo: 'Sarah Johnson', dueDate: '2024-01-22', estimatedHours: 8, notes: 'New packaging design' },
  { id: '3', workOrderNumber: 'WO-2024-0144', type: 'rework', status: 'completed', priority: 'high', itemSku: 'SKU-3002', itemDescription: 'Label Correction Rework', quantity: 250, completedQty: 250, workstation: 'WS-C01', assignedTo: 'Mike Williams', dueDate: '2024-01-18', startDate: '2024-01-16', completedDate: '2024-01-17', estimatedHours: 4, actualHours: 3.5, notes: 'Incorrect UPC labels' },
  { id: '4', workOrderNumber: 'WO-2024-0147', type: 'assembly', status: 'on_hold', priority: 'low', itemSku: 'KIT-2005', itemDescription: 'Variety Pack Bundle', quantity: 200, completedQty: 45, workstation: 'WS-A02', assignedTo: 'Emily Davis', dueDate: '2024-01-25', startDate: '2024-01-18', estimatedHours: 12, actualHours: 4, notes: 'Waiting for component delivery' },
  { id: '5', workOrderNumber: 'WO-2024-0148', type: 'labeling', status: 'in_progress', priority: 'medium', itemSku: 'SKU-7890', itemDescription: 'Private Label Application', quantity: 1000, completedQty: 720, workstation: 'WS-D01', assignedTo: 'James Brown', dueDate: '2024-01-19', startDate: '2024-01-17', estimatedHours: 6, actualHours: 5, notes: 'Customer-specific labels' },
  { id: '6', workOrderNumber: 'WO-2024-0143', type: 'repair', status: 'completed', priority: 'high', itemSku: 'EQ-001', itemDescription: 'Forklift Battery Replacement', quantity: 1, completedQty: 1, workstation: 'MAINT-01', assignedTo: 'Lisa Chen', dueDate: '2024-01-16', startDate: '2024-01-16', completedDate: '2024-01-16', estimatedHours: 2, actualHours: 1.5, notes: 'Preventive maintenance' },
]

const workOrdersByType = [
  { type: 'Assembly', count: 15 },
  { type: 'Packaging', count: 12 },
  { type: 'Labeling', count: 8 },
  { type: 'Rework', count: 5 },
  { type: 'Repair', count: 3 },
  { type: 'Disassembly', count: 2 },
]

const statusDistribution = [
  { name: 'Completed', value: 28, color: '#10B981' },
  { name: 'In Progress', value: 12, color: '#3B82F6' },
  { name: 'Pending', value: 8, color: '#F59E0B' },
  { name: 'On Hold', value: 4, color: '#EF4444' },
]

export default function WorkOrders() {
  const [activeTab, setActiveTab] = useState<'list' | 'board' | 'analytics'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)

  const getStatusBadge = (status: WorkOrder['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      on_hold: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return styles[status]
  }

  const getTypeBadge = (type: WorkOrder['type']) => {
    const styles = {
      assembly: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      disassembly: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      rework: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      repair: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      packaging: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      labeling: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return styles[type]
  }

  const getPriorityBadge = (priority: WorkOrder['priority']) => {
    const styles = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return styles[priority]
  }

  const filteredOrders = mockWorkOrders.filter(order => {
    const matchesSearch = order.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.itemDescription.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter.toLowerCase().replace(' ', '_')
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalOrders: mockWorkOrders.length,
    inProgress: mockWorkOrders.filter(o => o.status === 'in_progress').length,
    completed: mockWorkOrders.filter(o => o.status === 'completed').length,
    onHold: mockWorkOrders.filter(o => o.status === 'on_hold').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Work Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Assembly, packaging, and value-added services</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Work Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Play className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Pause className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On Hold</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.onHold}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Work Order List', icon: Package },
            { id: 'board', label: 'Kanban Board', icon: Wrench },
            { id: 'analytics', label: 'Analytics', icon: Clock },
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
                placeholder="Search work orders..."
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
              <option>In Progress</option>
              <option>On Hold</option>
              <option>Completed</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">WO #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{order.workOrderNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(order.type)}`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.itemSku}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.itemDescription}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-20">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(order.completedQty / order.quantity) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {order.completedQty}/{order.quantity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.dueDate}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
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

      {/* Kanban Board Tab */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-4 gap-4">
          {['pending', 'in_progress', 'on_hold', 'completed'].map(status => (
            <div key={status} className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize flex items-center gap-2">
                {status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                {status === 'in_progress' && <Play className="w-4 h-4 text-blue-500" />}
                {status === 'on_hold' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                {status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {status.replace('_', ' ')}
                <span className="ml-auto text-sm text-gray-500">
                  {mockWorkOrders.filter(o => o.status === status).length}
                </span>
              </h3>
              <div className="space-y-3">
                {mockWorkOrders
                  .filter(o => o.status === status)
                  .map(order => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{order.workOrderNumber}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadge(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{order.itemDescription}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${(order.completedQty / order.quantity) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round((order.completedQty / order.quantity) * 100)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{order.assignedTo}</span>
                        <span>{order.dueDate}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Orders by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workOrdersByType}>
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
                />
                <Bar dataKey="count" name="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ value }) => `${value}`}
                >
                  {statusDistribution.map((entry, index) => (
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
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedOrder.workOrderNumber}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedOrder.itemDescription}</h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(selectedOrder.type)}`}>
                  {selectedOrder.type}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(selectedOrder.priority)}`}>
                  {selectedOrder.priority} priority
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Item SKU</p>
                  <p className="text-gray-900 dark:text-white">{selectedOrder.itemSku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Workstation</p>
                  <p className="text-gray-900 dark:text-white">{selectedOrder.workstation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Assigned To</p>
                  <p className="text-gray-900 dark:text-white">{selectedOrder.assignedTo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                  <p className="text-gray-900 dark:text-white">{selectedOrder.dueDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Progress</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ width: `${(selectedOrder.completedQty / selectedOrder.quantity) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedOrder.completedQty} / {selectedOrder.quantity} ({Math.round((selectedOrder.completedQty / selectedOrder.quantity) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Hours</p>
                  <p className="text-gray-900 dark:text-white">{selectedOrder.estimatedHours}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Actual Hours</p>
                  <p className="text-gray-900 dark:text-white">{selectedOrder.actualHours || '-'}h</p>
                </div>
              </div>
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="text-gray-900 dark:text-white">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              {selectedOrder.status === 'pending' && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Start Work Order
                </button>
              )}
              {selectedOrder.status === 'in_progress' && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
