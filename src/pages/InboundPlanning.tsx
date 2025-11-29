import { useState } from 'react'
import {
  Truck,
  Calendar,
  Package,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  Filter,
  MapPin,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface InboundShipment {
  id: string
  poNumber: string
  vendor: string
  carrier: string
  expectedDate: string
  expectedTime: string
  status: 'scheduled' | 'in_transit' | 'arrived' | 'receiving' | 'completed' | 'delayed'
  pallets: number
  cartons: number
  assignedDock?: string
  priority: 'standard' | 'rush' | 'critical'
  specialHandling?: string[]
}

const mockShipments: InboundShipment[] = [
  {
    id: 'IB001',
    poNumber: 'PO-2024-5678',
    vendor: 'Tech Supplies Co',
    carrier: 'FedEx Freight',
    expectedDate: '2024-01-23',
    expectedTime: '08:00',
    status: 'in_transit',
    pallets: 24,
    cartons: 288,
    assignedDock: 'Dock 3',
    priority: 'rush',
    specialHandling: ['Fragile', 'Temperature Controlled'],
  },
  {
    id: 'IB002',
    poNumber: 'PO-2024-5679',
    vendor: 'Global Electronics',
    carrier: 'XPO Logistics',
    expectedDate: '2024-01-23',
    expectedTime: '10:30',
    status: 'scheduled',
    pallets: 18,
    cartons: 144,
    assignedDock: 'Dock 5',
    priority: 'standard',
  },
  {
    id: 'IB003',
    poNumber: 'PO-2024-5680',
    vendor: 'Office Depot',
    carrier: 'UPS Freight',
    expectedDate: '2024-01-23',
    expectedTime: '07:00',
    status: 'receiving',
    pallets: 12,
    cartons: 96,
    assignedDock: 'Dock 1',
    priority: 'standard',
  },
  {
    id: 'IB004',
    poNumber: 'PO-2024-5681',
    vendor: 'Industrial Parts Inc',
    carrier: 'Old Dominion',
    expectedDate: '2024-01-23',
    expectedTime: '14:00',
    status: 'delayed',
    pallets: 36,
    cartons: 432,
    priority: 'critical',
    specialHandling: ['Hazmat'],
  },
  {
    id: 'IB005',
    poNumber: 'PO-2024-5682',
    vendor: 'Consumer Goods Ltd',
    carrier: 'SAIA',
    expectedDate: '2024-01-24',
    expectedTime: '09:00',
    status: 'scheduled',
    pallets: 20,
    cartons: 240,
    priority: 'standard',
  },
]

const weeklyVolumeData = [
  { day: 'Mon', pallets: 85, capacity: 100 },
  { day: 'Tue', pallets: 92, capacity: 100 },
  { day: 'Wed', pallets: 78, capacity: 100 },
  { day: 'Thu', pallets: 110, capacity: 100 },
  { day: 'Fri', pallets: 95, capacity: 100 },
]

export default function InboundPlanning() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedShipment, setSelectedShipment] = useState<InboundShipment | null>(null)
  const [activeTab, setActiveTab] = useState<'schedule' | 'dock' | 'volume'>('schedule')

  const getStatusBadge = (status: InboundShipment['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      arrived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      receiving: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      delayed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    const labels = {
      scheduled: 'Scheduled',
      in_transit: 'In Transit',
      arrived: 'Arrived',
      receiving: 'Receiving',
      completed: 'Completed',
      delayed: 'Delayed',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getPriorityBadge = (priority: InboundShipment['priority']) => {
    const styles = {
      standard: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      rush: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  const filteredShipments = mockShipments.filter((shipment) => {
    const matchesSearch =
      shipment.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    todayTotal: mockShipments.filter(s => s.expectedDate === '2024-01-23').length,
    inTransit: mockShipments.filter(s => s.status === 'in_transit').length,
    receiving: mockShipments.filter(s => s.status === 'receiving').length,
    delayed: mockShipments.filter(s => s.status === 'delayed').length,
    totalPallets: mockShipments.reduce((sum, s) => sum + s.pallets, 0),
  }

  const docks = [
    { id: 'Dock 1', status: 'occupied', shipment: 'PO-2024-5680', startTime: '07:00', endTime: '10:00' },
    { id: 'Dock 2', status: 'available', shipment: null, startTime: null, endTime: null },
    { id: 'Dock 3', status: 'reserved', shipment: 'PO-2024-5678', startTime: '08:00', endTime: '11:00' },
    { id: 'Dock 4', status: 'available', shipment: null, startTime: null, endTime: null },
    { id: 'Dock 5', status: 'reserved', shipment: 'PO-2024-5679', startTime: '10:30', endTime: '13:30' },
    { id: 'Dock 6', status: 'maintenance', shipment: null, startTime: null, endTime: null },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inbound Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan and manage incoming shipments</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Calendar className="w-4 h-4" />
            Calendar View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Schedule Receipt
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Receipts</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.todayTotal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receiving Now</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.receiving}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delayed</p>
              <p className="text-xl font-bold text-red-600">{stats.delayed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pallets</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalPallets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'schedule', label: 'Delivery Schedule' },
            { id: 'dock', label: 'Dock Assignment' },
            { id: 'volume', label: 'Volume Planning' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'schedule' | 'dock' | 'volume')}
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

      {activeTab === 'schedule' && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by PO number or vendor..."
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
              <option value="scheduled">Scheduled</option>
              <option value="in_transit">In Transit</option>
              <option value="arrived">Arrived</option>
              <option value="receiving">Receiving</option>
              <option value="delayed">Delayed</option>
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
                    PO / Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Expected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Dock
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
                      <div className="font-medium text-gray-900 dark:text-white">{shipment.poNumber}</div>
                      <div className="text-sm text-gray-500">{shipment.vendor}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{shipment.carrier}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{shipment.expectedDate}</div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {shipment.expectedTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{shipment.pallets} pallets</div>
                      <div className="text-xs text-gray-500">{shipment.cartons} cartons</div>
                    </td>
                    <td className="px-6 py-4">
                      {shipment.assignedDock ? (
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          {shipment.assignedDock}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
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

      {activeTab === 'dock' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docks.map((dock) => (
            <div
              key={dock.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 ${
                dock.status === 'occupied'
                  ? 'border-green-500'
                  : dock.status === 'reserved'
                  ? 'border-blue-500'
                  : dock.status === 'maintenance'
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">{dock.id}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    dock.status === 'occupied'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : dock.status === 'reserved'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : dock.status === 'maintenance'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}
                >
                  {dock.status.charAt(0).toUpperCase() + dock.status.slice(1)}
                </span>
              </div>
              {dock.shipment ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{dock.shipment}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {dock.startTime} - {dock.endTime}
                  </div>
                </div>
              ) : dock.status === 'maintenance' ? (
                <p className="text-sm text-red-600">Under maintenance</p>
              ) : (
                <p className="text-sm text-gray-400">Available for assignment</p>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'volume' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Inbound Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="capacity" fill="#E5E7EB" name="Capacity" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pallets" fill="#3B82F6" name="Scheduled" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-400">Capacity Alert</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Thursday is over capacity by 10 pallets. Consider rescheduling non-critical shipments.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipment Details</h2>
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
                  <label className="text-sm text-gray-500">PO Number</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedShipment.poNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Vendor</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedShipment.vendor}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Carrier</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedShipment.carrier}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Expected</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedShipment.expectedDate} @ {selectedShipment.expectedTime}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {getPriorityBadge(selectedShipment.priority)}
                {getStatusBadge(selectedShipment.status)}
              </div>
              {selectedShipment.specialHandling && (
                <div>
                  <label className="text-sm text-gray-500">Special Handling</label>
                  <div className="flex gap-2 mt-1">
                    {selectedShipment.specialHandling.map((h) => (
                      <span key={h} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {h}
                      </span>
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
