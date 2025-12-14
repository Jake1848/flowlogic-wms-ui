import { useState } from 'react'
import { Grid3x3, MapPin, Layers, TrendingUp, Package, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { useWarehouseList } from '../hooks/useWarehouses'

interface Zone {
  id: string
  name: string
  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'returns'
  capacity: number
  occupied: number
  temperature?: 'ambient' | 'refrigerated' | 'frozen'
  aisles: number
  locations: number
}

interface Location {
  id: string
  code: string
  zone: string
  aisle: string
  bay: string
  level: string
  type: 'pallet' | 'shelf' | 'floor' | 'bulk'
  status: 'empty' | 'partial' | 'full' | 'blocked'
  currentSKU?: string
  quantity?: number
  lastPick?: string
}

export default function Warehouse() {
  const [activeTab, setActiveTab] = useState<'zones' | 'locations' | 'slotting'>('zones')

  // Fetch warehouses from API
  const { data: warehouseData, isLoading, error, refetch } = useWarehouseList()

  // Use API data for stats
  const warehouses = warehouseData?.data || []

  // Mock zone data (zone API would be per-warehouse)
  const zones: Zone[] = [
    {
      id: '1',
      name: 'Zone A - Fast Movers',
      type: 'picking',
      capacity: 1000,
      occupied: 847,
      temperature: 'ambient',
      aisles: 8,
      locations: 240,
    },
    {
      id: '2',
      name: 'Zone B - Bulk Storage',
      type: 'storage',
      capacity: 5000,
      occupied: 3256,
      temperature: 'ambient',
      aisles: 12,
      locations: 600,
    },
    {
      id: '3',
      name: 'Zone C - Cold Storage',
      type: 'storage',
      capacity: 800,
      occupied: 623,
      temperature: 'refrigerated',
      aisles: 4,
      locations: 160,
    },
    {
      id: '4',
      name: 'Receiving Dock',
      type: 'receiving',
      capacity: 200,
      occupied: 45,
      temperature: 'ambient',
      aisles: 0,
      locations: 20,
    },
    {
      id: '5',
      name: 'Shipping Staging',
      type: 'shipping',
      capacity: 300,
      occupied: 178,
      temperature: 'ambient',
      aisles: 0,
      locations: 30,
    },
  ]

  // Mock location data
  const locations: Location[] = [
    {
      id: '1',
      code: 'A-01-02-C',
      zone: 'Zone A',
      aisle: '01',
      bay: '02',
      level: 'C',
      type: 'pallet',
      status: 'full',
      currentSKU: 'SKU-1023',
      quantity: 48,
      lastPick: '2024-11-19 14:30',
    },
    {
      id: '2',
      code: 'A-01-03-C',
      zone: 'Zone A',
      aisle: '01',
      bay: '03',
      level: 'C',
      type: 'pallet',
      status: 'partial',
      currentSKU: 'SKU-2045',
      quantity: 22,
      lastPick: '2024-11-19 15:15',
    },
    {
      id: '3',
      code: 'B-05-12-A',
      zone: 'Zone B',
      aisle: '05',
      bay: '12',
      level: 'A',
      type: 'pallet',
      status: 'empty',
    },
    {
      id: '4',
      code: 'A-02-01-D',
      zone: 'Zone A',
      aisle: '02',
      bay: '01',
      level: 'D',
      type: 'shelf',
      status: 'blocked',
      currentSKU: 'SKU-5678',
      quantity: 0,
    },
  ]

  const getZoneTypeColor = (type: Zone['type']) => {
    switch (type) {
      case 'receiving':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'storage':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'picking':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'packing':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'shipping':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getLocationStatusColor = (status: Location['status']) => {
    switch (status) {
      case 'empty':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      case 'partial':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'full':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'blocked':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    }
  }

  const getTempIcon = (temp?: Zone['temperature']) => {
    if (temp === 'frozen') return '❄️'
    if (temp === 'refrigerated') return '🧊'
    return '🌡️'
  }

  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0)
  const totalOccupied = zones.reduce((sum, z) => sum + z.occupied, 0)
  const utilizationRate = ((totalOccupied / totalCapacity) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Warehouse Layout</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage zones, locations, and optimize warehouse slotting
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-blue-700 dark:text-blue-300">Loading warehouse data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-700 dark:text-yellow-300">Unable to load from server. Showing demo data.</p>
        </div>
      )}

      {/* Warehouse Info */}
      {warehouses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Active Warehouses</h3>
          <div className="flex flex-wrap gap-2">
            {warehouses.map(wh => (
              <span key={wh.id} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                {wh.name} ({wh.code})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Zones</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {zones.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Grid3x3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Locations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {zones.reduce((sum, z) => sum + z.locations, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Utilization</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {utilizationRate}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Capacity</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {totalOccupied.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {totalCapacity.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Warehouse Map */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Warehouse Floor Plan
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`p-4 rounded-xl border-2 ${
                zone.occupied / zone.capacity > 0.9
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : zone.occupied / zone.capacity > 0.7
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-green-500 bg-green-50 dark:bg-green-900/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{getTempIcon(zone.temperature)}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getZoneTypeColor(zone.type)}`}>
                  {zone.type}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{zone.name}</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Occupied:</span>
                  <span className="font-medium">{zone.occupied}/{zone.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      zone.occupied / zone.capacity > 0.9
                        ? 'bg-red-500'
                        : zone.occupied / zone.capacity > 0.7
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${(zone.occupied / zone.capacity) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between pt-1">
                  <span>Aisles: {zone.aisles}</span>
                  <span>Locs: {zone.locations}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('zones')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'zones'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Zone Management
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'locations'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Location Directory
            </button>
            <button
              onClick={() => setActiveTab('slotting')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'slotting'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Slotting Optimization
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Zones Tab */}
          {activeTab === 'zones' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Zone Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Temperature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Utilization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Aisles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Locations
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {zone.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getZoneTypeColor(zone.type)}`}>
                          {zone.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {zone.temperature}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {zone.occupied} / {zone.capacity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(zone.occupied / zone.capacity) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {((zone.occupied / zone.capacity) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {zone.aisles}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {zone.locations}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Location Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Zone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Current SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {locations.map((location) => (
                    <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                        {location.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {location.zone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {location.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLocationStatusColor(location.status)}`}>
                          {location.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {location.currentSKU || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {location.quantity || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {location.lastPick || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Slotting Tab */}
          {activeTab === 'slotting' && (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Slotting Optimization
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered location optimization based on pick frequency and velocity
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
