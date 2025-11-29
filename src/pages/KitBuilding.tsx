import { useState } from 'react'
import {
  Package,
  ListChecks,
  Clock,
  CheckCircle,
  Plus,
  Search,
  BarChart3,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Kit {
  id: string
  kitNumber: string
  name: string
  description: string
  componentsCount: number
  buildTime: number
  status: 'active' | 'inactive' | 'discontinued'
  totalBuilt: number
  inStock: number
}

interface KitComponent {
  id: string
  sku: string
  description: string
  quantity: number
  location: string
  available: number
  status: 'available' | 'low' | 'out'
}

interface BuildOrder {
  id: string
  kitNumber: string
  kitName: string
  quantity: number
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'hold'
  assignedTo: string
  dueDate: string
  progress: number
}

const mockKits: Kit[] = [
  { id: '1', kitNumber: 'KIT-001', name: 'Starter Pack A', description: 'Basic starter kit with essential items', componentsCount: 5, buildTime: 15, status: 'active', totalBuilt: 1250, inStock: 45 },
  { id: '2', kitNumber: 'KIT-002', name: 'Premium Bundle', description: 'Premium product bundle with accessories', componentsCount: 8, buildTime: 25, status: 'active', totalBuilt: 820, inStock: 23 },
  { id: '3', kitNumber: 'KIT-003', name: 'Holiday Gift Set', description: 'Seasonal holiday gift package', componentsCount: 6, buildTime: 20, status: 'active', totalBuilt: 2100, inStock: 0 },
  { id: '4', kitNumber: 'KIT-004', name: 'Sample Pack', description: 'Product sample collection', componentsCount: 12, buildTime: 30, status: 'active', totalBuilt: 450, inStock: 78 },
  { id: '5', kitNumber: 'KIT-005', name: 'Legacy Bundle', description: 'Discontinued product bundle', componentsCount: 4, buildTime: 10, status: 'discontinued', totalBuilt: 3200, inStock: 5 },
]

const mockComponents: KitComponent[] = [
  { id: '1', sku: 'SKU-001', description: 'Widget Alpha', quantity: 2, location: 'A-01-01', available: 500, status: 'available' },
  { id: '2', sku: 'SKU-002', description: 'Widget Beta', quantity: 1, location: 'A-01-02', available: 250, status: 'available' },
  { id: '3', sku: 'SKU-003', description: 'Connector Type A', quantity: 3, location: 'B-02-01', available: 45, status: 'low' },
  { id: '4', sku: 'SKU-004', description: 'Power Adapter', quantity: 1, location: 'B-02-02', available: 180, status: 'available' },
  { id: '5', sku: 'SKU-005', description: 'User Manual', quantity: 1, location: 'C-03-01', available: 0, status: 'out' },
]

const mockBuildOrders: BuildOrder[] = [
  { id: 'BO-001', kitNumber: 'KIT-001', kitName: 'Starter Pack A', quantity: 50, priority: 'high', status: 'in_progress', assignedTo: 'John Smith', dueDate: '2024-01-16', progress: 60 },
  { id: 'BO-002', kitNumber: 'KIT-002', kitName: 'Premium Bundle', quantity: 25, priority: 'normal', status: 'pending', assignedTo: 'Sarah Johnson', dueDate: '2024-01-17', progress: 0 },
  { id: 'BO-003', kitNumber: 'KIT-003', kitName: 'Holiday Gift Set', quantity: 100, priority: 'urgent', status: 'hold', assignedTo: 'Mike Williams', dueDate: '2024-01-15', progress: 35 },
  { id: 'BO-004', kitNumber: 'KIT-001', kitName: 'Starter Pack A', quantity: 30, priority: 'low', status: 'completed', assignedTo: 'Emily Davis', dueDate: '2024-01-14', progress: 100 },
]

const productionData = [
  { day: 'Mon', built: 45, target: 50 },
  { day: 'Tue', built: 52, target: 50 },
  { day: 'Wed', built: 48, target: 50 },
  { day: 'Thu', built: 55, target: 50 },
  { day: 'Fri', built: 42, target: 50 },
]

export default function KitBuilding() {
  const [activeTab, setActiveTab] = useState<'orders' | 'kits' | 'components' | 'analytics'>('orders')
  const [selectedKit, setSelectedKit] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const getPriorityBadge = (priority: BuildOrder['priority']) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800',
    }
    return styles[priority]
  }

  const getStatusBadge = (status: BuildOrder['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      hold: 'bg-yellow-100 text-yellow-800',
    }
    return styles[status]
  }

  const stats = {
    activeOrders: mockBuildOrders.filter(o => o.status !== 'completed').length,
    completedToday: 4,
    avgBuildTime: 18,
    efficiency: 94,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kit Building</h1>
          <p className="text-gray-600 dark:text-gray-400">Assemble and manage product kits</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Build Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ListChecks className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Orders</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Build Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgBuildTime} min</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Efficiency</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.efficiency}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'orders', label: 'Build Orders' },
            { id: 'kits', label: 'Kit Definitions' },
            { id: 'components', label: 'Components' },
            { id: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Kit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockBuildOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{order.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.kitName}</p>
                        <p className="text-xs text-gray-500">{order.kitNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${getPriorityBadge(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.assignedTo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.dueDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${order.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{order.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'kits' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search kits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockKits.map((kit) => (
              <div
                key={kit.id}
                onClick={() => setSelectedKit(kit.id)}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
                  selectedKit === kit.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                } ${kit.status === 'discontinued' ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{kit.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{kit.kitNumber}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${
                    kit.status === 'active' ? 'bg-green-100 text-green-800' :
                    kit.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {kit.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{kit.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Package className="w-4 h-4" />
                    <span>{kit.componentsCount} components</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{kit.buildTime} min</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm">
                  <span className="text-gray-500">In Stock: <span className={kit.inStock === 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}>{kit.inStock}</span></span>
                  <span className="text-gray-500">Built: {kit.totalBuilt.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'components' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Components for: {selectedKit ? mockKits.find(k => k.id === selectedKit)?.name : 'Select a kit'}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty/Kit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockComponents.map((comp) => (
                  <tr key={comp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{comp.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{comp.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{comp.quantity}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{comp.location}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{comp.available}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        comp.status === 'available' ? 'bg-green-100 text-green-800' :
                        comp.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {comp.status === 'out' ? 'Out of Stock' : comp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Production</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="built" fill="#3b82f6" name="Built" />
                <Bar dataKey="target" fill="#9ca3af" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
