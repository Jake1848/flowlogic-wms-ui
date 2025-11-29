import { useState } from 'react'
import {
  Truck,
  Weight,
  Maximize,
  Route,
  Clock,
  RefreshCw,
  Building2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Load {
  id: string
  trailerId: string
  destination: string
  stops: number
  orders: number
  pallets: number
  weight: number
  cubeUtilization: number
  weightUtilization: number
  status: 'planning' | 'optimized' | 'loading' | 'loaded' | 'dispatched'
  departureTime: string
  route: string
}

interface Stop {
  sequence: number
  customer: string
  address: string
  orders: number
  pallets: number
  weight: number
  deliveryWindow: string
}

const mockLoads: Load[] = [
  { id: 'LOAD-001', trailerId: 'TRL-4521', destination: 'Chicago Hub', stops: 5, orders: 24, pallets: 18, weight: 32500, cubeUtilization: 85, weightUtilization: 72, status: 'optimized', departureTime: '06:00 AM', route: 'RT-101' },
  { id: 'LOAD-002', trailerId: 'TRL-4522', destination: 'Detroit DC', stops: 3, orders: 18, pallets: 22, weight: 41000, cubeUtilization: 92, weightUtilization: 91, status: 'loading', departureTime: '07:30 AM', route: 'RT-102' },
  { id: 'LOAD-003', trailerId: 'TRL-4523', destination: 'Indianapolis', stops: 8, orders: 35, pallets: 16, weight: 28000, cubeUtilization: 75, weightUtilization: 62, status: 'planning', departureTime: '09:00 AM', route: 'RT-103' },
  { id: 'LOAD-004', trailerId: 'TRL-4524', destination: 'Columbus', stops: 4, orders: 21, pallets: 20, weight: 38500, cubeUtilization: 88, weightUtilization: 85, status: 'loaded', departureTime: '05:00 AM', route: 'RT-104' },
  { id: 'LOAD-005', trailerId: 'TRL-4525', destination: 'Cleveland', stops: 6, orders: 28, pallets: 14, weight: 25000, cubeUtilization: 68, weightUtilization: 55, status: 'dispatched', departureTime: '04:30 AM', route: 'RT-105' },
]

const mockStops: Stop[] = [
  { sequence: 1, customer: 'ABC Retail', address: '123 Main St, Suburb A', orders: 5, pallets: 4, weight: 7200, deliveryWindow: '8:00-10:00 AM' },
  { sequence: 2, customer: 'XYZ Wholesale', address: '456 Oak Ave, Suburb B', orders: 3, pallets: 3, weight: 5800, deliveryWindow: '10:00-12:00 PM' },
  { sequence: 3, customer: 'Quick Mart #42', address: '789 Pine Rd, Suburb C', orders: 8, pallets: 5, weight: 8500, deliveryWindow: '12:00-2:00 PM' },
  { sequence: 4, customer: 'MegaStore', address: '321 Elm Blvd, City D', orders: 4, pallets: 3, weight: 5500, deliveryWindow: '2:00-4:00 PM' },
  { sequence: 5, customer: 'Corner Shop', address: '654 Maple Dr, City E', orders: 4, pallets: 3, weight: 5500, deliveryWindow: '4:00-6:00 PM' },
]

const utilizationData = [
  { load: 'LOAD-001', cube: 85, weight: 72 },
  { load: 'LOAD-002', cube: 92, weight: 91 },
  { load: 'LOAD-003', cube: 75, weight: 62 },
  { load: 'LOAD-004', cube: 88, weight: 85 },
  { load: 'LOAD-005', cube: 68, weight: 55 },
]

export default function LoadPlanning() {
  const [activeTab, setActiveTab] = useState<'loads' | 'stops' | 'optimization' | 'analytics'>('loads')
  const [selectedLoad, setSelectedLoad] = useState<string | null>('LOAD-001')
  const [isOptimizing, setIsOptimizing] = useState(false)

  const handleOptimize = () => {
    setIsOptimizing(true)
    setTimeout(() => setIsOptimizing(false), 2500)
  }

  const getStatusBadge = (status: Load['status']) => {
    const styles = {
      planning: 'bg-gray-100 text-gray-800',
      optimized: 'bg-blue-100 text-blue-800',
      loading: 'bg-yellow-100 text-yellow-800',
      loaded: 'bg-green-100 text-green-800',
      dispatched: 'bg-purple-100 text-purple-800',
    }
    return styles[status]
  }

  const stats = {
    totalLoads: mockLoads.length,
    avgCubeUtil: Math.round(mockLoads.reduce((sum, l) => sum + l.cubeUtilization, 0) / mockLoads.length),
    avgWeightUtil: Math.round(mockLoads.reduce((sum, l) => sum + l.weightUtilization, 0) / mockLoads.length),
    totalStops: mockLoads.reduce((sum, l) => sum + l.stops, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Load Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">Optimize trailer loads and delivery routes</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Truck className="w-4 h-4" />
            New Load
          </button>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Route className="w-4 h-4" />
                Optimize Routes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Loads</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalLoads}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Maximize className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Cube Util</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgCubeUtil}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Weight className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Weight Util</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgWeightUtil}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Stops</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalStops}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'loads', label: 'Load List' },
            { id: 'stops', label: 'Stop Sequence' },
            { id: 'optimization', label: 'Optimization' },
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
      {activeTab === 'loads' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Load ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trailer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stops</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pallets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Weight</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cube %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Departure</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockLoads.map((load) => (
                  <tr
                    key={load.id}
                    onClick={() => setSelectedLoad(load.id)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedLoad === load.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{load.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{load.trailerId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{load.destination}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{load.stops}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{load.pallets}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{load.weight.toLocaleString()} lbs</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${load.cubeUtilization >= 80 ? 'bg-green-500' : load.cubeUtilization >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${load.cubeUtilization}%` }}
                          />
                        </div>
                        <span className="text-sm">{load.cubeUtilization}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{load.departureTime}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(load.status)}`}>
                        {load.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stops' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stop Sequence - {selectedLoad || 'Select a load'}
            </h3>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Route className="w-4 h-4" />
              Resequence
            </button>
          </div>
          <div className="space-y-3">
            {mockStops.map((stop) => (
              <div key={stop.sequence} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {stop.sequence}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{stop.customer}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stop.address}</p>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
                  <p>{stop.orders} orders / {stop.pallets} pallets</p>
                  <p>{stop.weight.toLocaleString()} lbs</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{stop.deliveryWindow}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'optimization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Optimization Goals</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Goal
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="cube">Maximize Cube Utilization</option>
                  <option value="weight">Maximize Weight Utilization</option>
                  <option value="stops">Minimize Stops per Load</option>
                  <option value="distance">Minimize Total Distance</option>
                  <option value="cost">Minimize Shipping Cost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Cube Utilization (%)
                </label>
                <input
                  type="number"
                  defaultValue={70}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Stops per Load
                </label>
                <input
                  type="number"
                  defaultValue={10}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="respectWindows" defaultChecked className="rounded" />
                <label htmlFor="respectWindows" className="text-sm text-gray-700 dark:text-gray-300">
                  Respect delivery windows
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="lifo" defaultChecked className="rounded" />
                <label htmlFor="lifo" className="text-sm text-gray-700 dark:text-gray-300">
                  LIFO loading sequence
                </label>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Constraints</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Trailer Weight (lbs)
                </label>
                <input
                  type="number"
                  defaultValue={45000}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Pallets per Trailer
                </label>
                <input
                  type="number"
                  defaultValue={26}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Driver Hours Limit
                </label>
                <input
                  type="number"
                  defaultValue={11}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="hazmat" className="rounded" />
                <label htmlFor="hazmat" className="text-sm text-gray-700 dark:text-gray-300">
                  Separate hazmat items
                </label>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Load Utilization Comparison</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="load" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cube" fill="#3b82f6" name="Cube %" />
                <Bar dataKey="weight" fill="#22c55e" name="Weight %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
