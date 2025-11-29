import { useState } from 'react'
import {
  Send,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  Search,
  Plus,
  Eye,
  Filter,
  Truck,
  MapPin,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface OutboundShipment {
  id: string
  orderNumber: string
  customer: string
  carrier: string
  shipDate: string
  cutoffTime: string
  status: 'pending' | 'picking' | 'packing' | 'staged' | 'loaded' | 'shipped'
  orderLines: number
  units: number
  weight: number
  shipMethod: 'ground' | 'express' | 'freight' | 'ltl'
  priority: 'standard' | 'rush' | 'same_day'
  assignedDock?: string
}

const mockShipments: OutboundShipment[] = [
  {
    id: 'OB001',
    orderNumber: 'ORD-2024-9876',
    customer: 'Acme Corporation',
    carrier: 'FedEx Ground',
    shipDate: '2024-01-23',
    cutoffTime: '14:00',
    status: 'picking',
    orderLines: 15,
    units: 48,
    weight: 125.5,
    shipMethod: 'ground',
    priority: 'standard',
    assignedDock: 'Dock A',
  },
  {
    id: 'OB002',
    orderNumber: 'ORD-2024-9877',
    customer: 'Tech Solutions Inc',
    carrier: 'UPS Next Day',
    shipDate: '2024-01-23',
    cutoffTime: '12:00',
    status: 'staged',
    orderLines: 8,
    units: 24,
    weight: 45.2,
    shipMethod: 'express',
    priority: 'same_day',
    assignedDock: 'Dock B',
  },
  {
    id: 'OB003',
    orderNumber: 'ORD-2024-9878',
    customer: 'Retail Partners LLC',
    carrier: 'XPO Logistics',
    shipDate: '2024-01-23',
    cutoffTime: '16:00',
    status: 'pending',
    orderLines: 45,
    units: 288,
    weight: 1250.0,
    shipMethod: 'freight',
    priority: 'standard',
  },
  {
    id: 'OB004',
    orderNumber: 'ORD-2024-9879',
    customer: 'Global Imports',
    carrier: 'FedEx Express',
    shipDate: '2024-01-23',
    cutoffTime: '11:00',
    status: 'shipped',
    orderLines: 5,
    units: 12,
    weight: 18.8,
    shipMethod: 'express',
    priority: 'rush',
    assignedDock: 'Dock C',
  },
  {
    id: 'OB005',
    orderNumber: 'ORD-2024-9880',
    customer: 'Wholesale Distributors',
    carrier: 'Old Dominion',
    shipDate: '2024-01-24',
    cutoffTime: '10:00',
    status: 'pending',
    orderLines: 32,
    units: 156,
    weight: 890.0,
    shipMethod: 'ltl',
    priority: 'standard',
  },
]

const hourlyVolumeData = [
  { hour: '8AM', orders: 12, capacity: 15 },
  { hour: '10AM', orders: 18, capacity: 15 },
  { hour: '12PM', orders: 22, capacity: 20 },
  { hour: '2PM', orders: 25, capacity: 25 },
  { hour: '4PM', orders: 15, capacity: 20 },
  { hour: '6PM', orders: 8, capacity: 10 },
]

const shipMethodData = [
  { name: 'Ground', value: 45, color: '#3B82F6' },
  { name: 'Express', value: 25, color: '#10B981' },
  { name: 'LTL', value: 20, color: '#F59E0B' },
  { name: 'Freight', value: 10, color: '#8B5CF6' },
]

export default function OutboundPlanning() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedShipment, setSelectedShipment] = useState<OutboundShipment | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'waves' | 'loads'>('orders')

  const getStatusBadge = (status: OutboundShipment['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      picking: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      packing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      staged: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      loaded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      shipped: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getPriorityBadge = (priority: OutboundShipment['priority']) => {
    const styles = {
      standard: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      rush: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      same_day: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    const labels = {
      standard: 'Standard',
      rush: 'Rush',
      same_day: 'Same Day',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {labels[priority]}
      </span>
    )
  }

  const filteredShipments = mockShipments.filter((shipment) => {
    const matchesSearch =
      shipment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalOrders: mockShipments.length,
    picking: mockShipments.filter(s => s.status === 'picking').length,
    staged: mockShipments.filter(s => s.status === 'staged').length,
    shipped: mockShipments.filter(s => s.status === 'shipped').length,
    totalUnits: mockShipments.reduce((sum, s) => sum + s.units, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outbound Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan and manage outgoing shipments</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Calendar className="w-4 h-4" />
            Wave Planner
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Release Wave
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Picking</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.picking}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Staged</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.staged}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Shipped Today</p>
              <p className="text-xl font-bold text-green-600">{stats.shipped}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Units</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalUnits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'orders', label: 'Order Queue' },
            { id: 'waves', label: 'Wave Status' },
            { id: 'loads', label: 'Load Planning' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'orders' | 'waves' | 'loads')}
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
                placeholder="Search by order number or customer..."
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
              <option value="picking">Picking</option>
              <option value="packing">Packing</option>
              <option value="staged">Staged</option>
              <option value="shipped">Shipped</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order / Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cutoff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Lines / Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{shipment.orderNumber}</div>
                      <div className="text-sm text-gray-500">{shipment.customer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{shipment.carrier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={shipment.cutoffTime <= '12:00' ? 'text-red-600 font-medium' : 'text-gray-900 dark:text-white'}>
                          {shipment.cutoffTime}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{shipment.orderLines} lines</div>
                      <div className="text-xs text-gray-500">{shipment.units} units</div>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(shipment.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(shipment.status)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedShipment(shipment)}
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

      {activeTab === 'waves' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hourly Order Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="capacity" fill="#E5E7EB" name="Capacity" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" fill="#3B82F6" name="Orders" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ship Method Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shipMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {shipMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {shipMethodData.map((method) => (
                <div key={method.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {method.name} ({method.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Wave Status Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { wave: 'Wave 1 (8AM)', status: 'completed', orders: 45, picked: 45 },
              { wave: 'Wave 2 (11AM)', status: 'in_progress', orders: 52, picked: 38 },
              { wave: 'Wave 3 (2PM)', status: 'pending', orders: 48, picked: 0 },
            ].map((wave) => (
              <div key={wave.wave} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{wave.wave}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    wave.status === 'completed' ? 'bg-green-100 text-green-800' :
                    wave.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {wave.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{wave.picked}/{wave.orders} orders</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${(wave.picked / wave.orders) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'loads' && (
        <div className="space-y-4">
          {[
            { id: 'LOAD-001', carrier: 'FedEx Ground', trailer: 'TRL-4567', orders: 12, weight: '8,500 lbs', status: 'loading', dock: 'Dock A' },
            { id: 'LOAD-002', carrier: 'UPS', trailer: 'TRL-7890', orders: 8, weight: '3,200 lbs', status: 'staged', dock: 'Dock B' },
            { id: 'LOAD-003', carrier: 'XPO Logistics', trailer: 'TRL-1234', orders: 24, weight: '18,750 lbs', status: 'pending', dock: 'TBD' },
          ].map((load) => (
            <div key={load.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{load.id}</h3>
                    <p className="text-sm text-gray-500">{load.carrier} - {load.trailer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{load.orders}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{load.weight}</p>
                    <p className="text-xs text-gray-500">Weight</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{load.dock}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    load.status === 'loading' ? 'bg-blue-100 text-blue-800' :
                    load.status === 'staged' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {load.status.charAt(0).toUpperCase() + load.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h2>
                <button
                  onClick={() => setSelectedShipment(null)}
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
                  <p className="font-medium text-gray-900 dark:text-white">{selectedShipment.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Customer</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedShipment.customer}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Carrier</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedShipment.carrier}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Cutoff Time</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedShipment.cutoffTime}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Weight</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedShipment.weight} lbs</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Ship Method</label>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedShipment.shipMethod}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {getPriorityBadge(selectedShipment.priority)}
                {getStatusBadge(selectedShipment.status)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
