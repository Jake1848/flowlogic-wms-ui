import { useState } from 'react'
import {
  Wrench,
  Package,
  Clock,
  Users,
  CheckCircle,
  Search,
  Plus,
  Eye,
  DollarSign,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface VASWorkOrder {
  id: string
  orderNumber: string
  customer: string
  vasType: 'kitting' | 'labeling' | 'packaging' | 'assembly' | 'inspection' | 'customization'
  description: string
  quantity: number
  completedQty: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'quality_check' | 'completed'
  assignedTo: string
  dueDate: string
  laborHours: number
  laborCost: number
}

const mockWorkOrders: VASWorkOrder[] = [
  {
    id: 'VAS001',
    orderNumber: 'ORD-2024-5001',
    customer: 'Tech Solutions Inc',
    vasType: 'kitting',
    description: 'Bundle laptop with accessories kit',
    quantity: 150,
    completedQty: 85,
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'Team A',
    dueDate: '2024-01-24',
    laborHours: 12,
    laborCost: 420,
  },
  {
    id: 'VAS002',
    orderNumber: 'ORD-2024-5002',
    customer: 'Retail Partners LLC',
    vasType: 'labeling',
    description: 'Apply promotional stickers and price tags',
    quantity: 500,
    completedQty: 500,
    priority: 'medium',
    status: 'completed',
    assignedTo: 'Team B',
    dueDate: '2024-01-23',
    laborHours: 8,
    laborCost: 280,
  },
  {
    id: 'VAS003',
    orderNumber: 'ORD-2024-5003',
    customer: 'Gift Corp',
    vasType: 'packaging',
    description: 'Gift wrap with premium materials',
    quantity: 200,
    completedQty: 120,
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'Team C',
    dueDate: '2024-01-25',
    laborHours: 15,
    laborCost: 525,
  },
  {
    id: 'VAS004',
    orderNumber: 'ORD-2024-5004',
    customer: 'Electronics Plus',
    vasType: 'assembly',
    description: 'Assemble display stands with product',
    quantity: 75,
    completedQty: 0,
    priority: 'urgent',
    status: 'pending',
    assignedTo: 'Unassigned',
    dueDate: '2024-01-23',
    laborHours: 0,
    laborCost: 0,
  },
  {
    id: 'VAS005',
    orderNumber: 'ORD-2024-5005',
    customer: 'Quality Goods',
    vasType: 'inspection',
    description: '100% quality inspection before ship',
    quantity: 300,
    completedQty: 280,
    priority: 'medium',
    status: 'quality_check',
    assignedTo: 'QC Team',
    dueDate: '2024-01-24',
    laborHours: 10,
    laborCost: 350,
  },
]

const vasTypeData = [
  { name: 'Kitting', value: 35, color: '#3B82F6' },
  { name: 'Labeling', value: 25, color: '#10B981' },
  { name: 'Packaging', value: 20, color: '#F59E0B' },
  { name: 'Assembly', value: 12, color: '#8B5CF6' },
  { name: 'Other', value: 8, color: '#6B7280' },
]

const weeklyVolumeData = [
  { day: 'Mon', completed: 45, pending: 12 },
  { day: 'Tue', completed: 52, pending: 8 },
  { day: 'Wed', completed: 48, pending: 15 },
  { day: 'Thu', completed: 65, pending: 10 },
  { day: 'Fri', completed: 55, pending: 5 },
]

export default function VASOperations() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<VASWorkOrder | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'teams'>('orders')

  const getStatusBadge = (status: VASWorkOrder['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      quality_check: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      quality_check: 'QC Check',
      completed: 'Completed',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getPriorityBadge = (priority: VASWorkOrder['priority']) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  const getVasTypeIcon = (_type: VASWorkOrder['vasType']) => {
    return <Package className="w-4 h-4" />
  }

  const filteredOrders = mockWorkOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalOrders: mockWorkOrders.length,
    inProgress: mockWorkOrders.filter(o => o.status === 'in_progress').length,
    completed: mockWorkOrders.filter(o => o.status === 'completed').length,
    totalRevenue: mockWorkOrders.reduce((sum, o) => sum + o.laborCost, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VAS Operations</h1>
          <p className="text-gray-600 dark:text-gray-400">Value-added services and special handling</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New VAS Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
              <p className="text-xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Labor Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${stats.totalRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'orders', label: 'Work Orders' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'teams', label: 'Team Assignments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'orders' | 'analytics' | 'teams')}
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

      {activeTab === 'orders' && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="quality_check">QC Check</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order / Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    VAS Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{order.customer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getVasTypeIcon(order.vasType)}
                        <span className="capitalize text-gray-900 dark:text-white">{order.vasType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{order.completedQty}/{order.quantity}</span>
                          <span>{Math.round((order.completedQty / order.quantity) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(order.completedQty / order.quantity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(order.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={order.dueDate <= '2024-01-23' ? 'text-red-600 font-medium' : 'text-gray-900 dark:text-white'}>
                          {order.dueDate}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">VAS Types Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vasTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {vasTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {vasTypeData.map((type) => (
                <div key={type.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{type.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Team A', 'Team B', 'Team C', 'QC Team'].map((team) => {
            const teamOrders = mockWorkOrders.filter(o => o.assignedTo === team)
            return (
              <div key={team} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{team}</h3>
                    <p className="text-sm text-gray-500">{teamOrders.length} active orders</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {teamOrders.map((order) => (
                    <div key={order.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{order.description}</p>
                    </div>
                  ))}
                  {teamOrders.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No active orders</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">VAS Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Order Number</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Customer</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customer}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.description}</p>
              </div>
              <div className="flex gap-3">
                {getPriorityBadge(selectedOrder.priority)}
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Labor Hours</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.laborHours}h</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Labor Cost</label>
                  <p className="font-medium text-green-600">${selectedOrder.laborCost}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
