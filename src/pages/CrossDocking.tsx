import { useState } from 'react'
import {
  ArrowLeftRight,
  Truck,
  Clock,
  CheckCircle,
  Target,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface CrossDockShipment {
  id: string
  inboundTrailer: string
  outboundTrailer: string
  origin: string
  destination: string
  pallets: number
  cases: number
  status: 'pending' | 'staging' | 'in_transit' | 'completed'
  arrivalTime: string
  departureTime: string
  dockDoor: string
}

interface DockAssignment {
  door: string
  type: 'inbound' | 'outbound' | 'cross-dock'
  trailer: string
  status: 'available' | 'occupied' | 'loading' | 'unloading'
  shipments: number
}

const mockShipments: CrossDockShipment[] = [
  { id: 'XD-001', inboundTrailer: 'TRL-4501', outboundTrailer: 'TRL-5021', origin: 'Chicago DC', destination: 'Detroit Hub', pallets: 8, cases: 156, status: 'in_transit', arrivalTime: '08:30 AM', departureTime: '10:00 AM', dockDoor: 'Door 5' },
  { id: 'XD-002', inboundTrailer: 'TRL-4502', outboundTrailer: 'TRL-5022', origin: 'Indianapolis', destination: 'Columbus', pallets: 12, cases: 245, status: 'staging', arrivalTime: '09:15 AM', departureTime: '11:30 AM', dockDoor: 'Door 7' },
  { id: 'XD-003', inboundTrailer: 'TRL-4503', outboundTrailer: 'TRL-5023', origin: 'Louisville', destination: 'Cincinnati', pallets: 6, cases: 98, status: 'pending', arrivalTime: '10:00 AM', departureTime: '12:00 PM', dockDoor: 'Door 3' },
  { id: 'XD-004', inboundTrailer: 'TRL-4504', outboundTrailer: 'TRL-5024', origin: 'Nashville', destination: 'Memphis', pallets: 15, cases: 312, status: 'completed', arrivalTime: '06:00 AM', departureTime: '08:30 AM', dockDoor: 'Door 1' },
  { id: 'XD-005', inboundTrailer: 'TRL-4505', outboundTrailer: 'TRL-5025', origin: 'St. Louis', destination: 'Kansas City', pallets: 10, cases: 189, status: 'staging', arrivalTime: '09:45 AM', departureTime: '11:00 AM', dockDoor: 'Door 8' },
]

const mockDockAssignments: DockAssignment[] = [
  { door: 'Door 1', type: 'cross-dock', trailer: 'TRL-5024', status: 'available', shipments: 0 },
  { door: 'Door 2', type: 'inbound', trailer: 'TRL-4510', status: 'unloading', shipments: 2 },
  { door: 'Door 3', type: 'cross-dock', trailer: '-', status: 'available', shipments: 1 },
  { door: 'Door 4', type: 'outbound', trailer: 'TRL-5030', status: 'loading', shipments: 3 },
  { door: 'Door 5', type: 'cross-dock', trailer: 'TRL-5021', status: 'loading', shipments: 1 },
  { door: 'Door 6', type: 'inbound', trailer: '-', status: 'available', shipments: 0 },
  { door: 'Door 7', type: 'cross-dock', trailer: 'TRL-5022', status: 'occupied', shipments: 1 },
  { door: 'Door 8', type: 'cross-dock', trailer: 'TRL-5025', status: 'occupied', shipments: 1 },
]

const throughputData = [
  { hour: '6 AM', inbound: 12, outbound: 8, crossdock: 5 },
  { hour: '8 AM', inbound: 18, outbound: 15, crossdock: 10 },
  { hour: '10 AM', inbound: 22, outbound: 20, crossdock: 15 },
  { hour: '12 PM', inbound: 15, outbound: 18, crossdock: 12 },
  { hour: '2 PM', inbound: 20, outbound: 22, crossdock: 14 },
  { hour: '4 PM', inbound: 16, outbound: 25, crossdock: 8 },
]

const statusDistribution = [
  { name: 'Completed', value: 35, color: '#22c55e' },
  { name: 'In Transit', value: 25, color: '#3b82f6' },
  { name: 'Staging', value: 28, color: '#f59e0b' },
  { name: 'Pending', value: 12, color: '#6b7280' },
]

export default function CrossDocking() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'dock' | 'analytics'>('shipments')

  const getStatusBadge = (status: CrossDockShipment['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      staging: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    }
    return styles[status]
  }

  const getDockStatusColor = (status: DockAssignment['status']) => {
    const colors = {
      available: 'bg-green-500',
      occupied: 'bg-yellow-500',
      loading: 'bg-blue-500',
      unloading: 'bg-purple-500',
    }
    return colors[status]
  }

  const stats = {
    activeShipments: mockShipments.filter(s => s.status !== 'completed').length,
    completedToday: mockShipments.filter(s => s.status === 'completed').length,
    avgDwellTime: 45,
    onTimeRate: 94,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cross-Docking</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage flow-through and cross-dock operations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <ArrowLeftRight className="w-4 h-4" />
          New Cross-Dock
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Shipments</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeShipments}</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Dwell Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgDwellTime} min</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On-Time Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.onTimeRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'shipments', label: 'Shipments' },
            { id: 'dock', label: 'Dock Status' },
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
      {activeTab === 'shipments' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Inbound</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Outbound</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Freight</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Window</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{shipment.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{shipment.inboundTrailer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{shipment.outboundTrailer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white">{shipment.origin}</p>
                        <p className="text-gray-500">→ {shipment.destination}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {shipment.pallets} pallets / {shipment.cases} cases
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{shipment.dockDoor}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {shipment.arrivalTime} - {shipment.departureTime}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(shipment.status)}`}>
                        {shipment.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dock' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockDockAssignments.map((dock) => (
            <div key={dock.door} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">{dock.door}</h3>
                <div className={`w-3 h-3 rounded-full ${getDockStatusColor(dock.status)}`} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    dock.type === 'cross-dock' ? 'bg-purple-100 text-purple-800' :
                    dock.type === 'inbound' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {dock.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trailer:</span>
                  <span className="text-gray-900 dark:text-white font-mono">{dock.trailer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-gray-900 dark:text-white capitalize">{dock.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipments:</span>
                  <span className="text-gray-900 dark:text-white">{dock.shipments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hourly Throughput</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={throughputData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="inbound" fill="#3b82f6" name="Inbound" />
                  <Bar dataKey="outbound" fill="#22c55e" name="Outbound" />
                  <Bar dataKey="crossdock" fill="#a855f7" name="Cross-Dock" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ value }) => `${value}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
