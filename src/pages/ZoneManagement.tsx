import { useState } from 'react'
import {
  Map,
  Grid3x3,
  Search,
  Plus,
  Edit,
  Settings,
  Package,
  Thermometer,
  Lock,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Zone {
  id: string
  zoneCode: string
  name: string
  type: 'storage' | 'picking' | 'staging' | 'receiving' | 'shipping' | 'returns' | 'hazmat' | 'cold'
  warehouse: string
  totalLocations: number
  usedLocations: number
  capacity: number
  currentUtilization: number
  temperature?: string
  restrictions?: string[]
  status: 'active' | 'inactive' | 'maintenance'
}

const mockZones: Zone[] = [
  { id: '1', zoneCode: 'ZONE-A', name: 'Primary Storage A', type: 'storage', warehouse: 'Main DC', totalLocations: 500, usedLocations: 425, capacity: 10000, currentUtilization: 85, status: 'active' },
  { id: '2', zoneCode: 'ZONE-B', name: 'Primary Storage B', type: 'storage', warehouse: 'Main DC', totalLocations: 400, usedLocations: 320, capacity: 8000, currentUtilization: 80, status: 'active' },
  { id: '3', zoneCode: 'PICK-01', name: 'Forward Pick Zone 1', type: 'picking', warehouse: 'Main DC', totalLocations: 200, usedLocations: 195, capacity: 2000, currentUtilization: 97, status: 'active' },
  { id: '4', zoneCode: 'PICK-02', name: 'Forward Pick Zone 2', type: 'picking', warehouse: 'Main DC', totalLocations: 150, usedLocations: 142, capacity: 1500, currentUtilization: 95, status: 'active' },
  { id: '5', zoneCode: 'STAGE-IN', name: 'Inbound Staging', type: 'staging', warehouse: 'Main DC', totalLocations: 50, usedLocations: 28, capacity: 500, currentUtilization: 56, status: 'active' },
  { id: '6', zoneCode: 'STAGE-OUT', name: 'Outbound Staging', type: 'staging', warehouse: 'Main DC', totalLocations: 75, usedLocations: 45, capacity: 750, currentUtilization: 60, status: 'active' },
  { id: '7', zoneCode: 'RCV-01', name: 'Receiving Dock', type: 'receiving', warehouse: 'Main DC', totalLocations: 20, usedLocations: 12, capacity: 200, currentUtilization: 60, status: 'active' },
  { id: '8', zoneCode: 'SHIP-01', name: 'Shipping Dock', type: 'shipping', warehouse: 'Main DC', totalLocations: 30, usedLocations: 18, capacity: 300, currentUtilization: 60, status: 'active' },
  { id: '9', zoneCode: 'COLD-01', name: 'Cold Storage', type: 'cold', warehouse: 'Main DC', totalLocations: 100, usedLocations: 72, capacity: 1000, currentUtilization: 72, temperature: '-20°C to 4°C', status: 'active' },
  { id: '10', zoneCode: 'HAZ-01', name: 'Hazmat Storage', type: 'hazmat', warehouse: 'Main DC', totalLocations: 50, usedLocations: 23, capacity: 250, currentUtilization: 46, restrictions: ['Flammable', 'Corrosive'], status: 'active' },
]

const utilizationByZone = [
  { zone: 'ZONE-A', utilization: 85 },
  { zone: 'ZONE-B', utilization: 80 },
  { zone: 'PICK-01', utilization: 97 },
  { zone: 'PICK-02', utilization: 95 },
  { zone: 'STAGE-IN', utilization: 56 },
  { zone: 'STAGE-OUT', utilization: 60 },
  { zone: 'COLD-01', utilization: 72 },
  { zone: 'HAZ-01', utilization: 46 },
]

export default function ZoneManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'analytics'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)

  const getTypeBadge = (type: Zone['type']) => {
    const styles: Record<Zone['type'], string> = {
      storage: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      picking: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      staging: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      receiving: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      shipping: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      returns: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      hazmat: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cold: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    }
    return styles[type]
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600 dark:text-red-400'
    if (utilization >= 75) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const filteredZones = mockZones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.zoneCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || zone.type === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  const stats = {
    totalZones: mockZones.length,
    totalLocations: mockZones.reduce((sum, z) => sum + z.totalLocations, 0),
    usedLocations: mockZones.reduce((sum, z) => sum + z.usedLocations, 0),
    avgUtilization: Math.round(mockZones.reduce((sum, z) => sum + z.currentUtilization, 0) / mockZones.length),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zone Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Warehouse zones, locations, and capacity management</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Zone
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Zones</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalZones}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Grid3x3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Locations</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalLocations.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Used Locations</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.usedLocations.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Utilization</p>
              <p className={`text-xl font-bold ${getUtilizationColor(stats.avgUtilization)}`}>{stats.avgUtilization}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Zone List', icon: Grid3x3 },
            { id: 'map', label: 'Zone Map', icon: Map },
            { id: 'analytics', label: 'Analytics', icon: Settings },
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
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search zones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option value="storage">Storage</option>
              <option value="picking">Picking</option>
              <option value="staging">Staging</option>
              <option value="receiving">Receiving</option>
              <option value="shipping">Shipping</option>
              <option value="cold">Cold Storage</option>
              <option value="hazmat">Hazmat</option>
            </select>
          </div>

          {/* Zones Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Zone Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Locations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Special</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredZones.map(zone => (
                  <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{zone.zoneCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{zone.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(zone.type)}`}>
                        {zone.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {zone.usedLocations} / {zone.totalLocations}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-24">
                          <div
                            className={`h-2 rounded-full ${
                              zone.currentUtilization >= 90 ? 'bg-red-500' :
                              zone.currentUtilization >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${zone.currentUtilization}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getUtilizationColor(zone.currentUtilization)}`}>
                          {zone.currentUtilization}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {zone.temperature && (
                          <span className="p-1 bg-cyan-100 dark:bg-cyan-900/30 rounded" title={zone.temperature}>
                            <Thermometer className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          </span>
                        )}
                        {zone.restrictions && (
                          <span className="p-1 bg-red-100 dark:bg-red-900/30 rounded" title={zone.restrictions.join(', ')}>
                            <Lock className="w-3 h-3 text-red-600 dark:text-red-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedZone(zone)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Warehouse Zone Layout</h3>
          <div className="grid grid-cols-4 gap-4">
            {mockZones.map(zone => (
              <div
                key={zone.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  zone.currentUtilization >= 90 ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20' :
                  zone.currentUtilization >= 75 ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20' :
                  'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                }`}
                onClick={() => setSelectedZone(zone)}
              >
                <div className="text-center">
                  <p className="font-mono font-bold text-gray-900 dark:text-white">{zone.zoneCode}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{zone.name}</p>
                  <p className={`text-lg font-bold mt-2 ${getUtilizationColor(zone.currentUtilization)}`}>
                    {zone.currentUtilization}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Utilization by Zone</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationByZone}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="zone" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar
                  dataKey="utilization"
                  name="Utilization %"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Zone Type Summary</h3>
            <div className="space-y-3">
              {['storage', 'picking', 'staging', 'receiving', 'shipping', 'cold', 'hazmat'].map(type => {
                const zones = mockZones.filter(z => z.type === type)
                const avgUtil = zones.length > 0 ? Math.round(zones.reduce((sum, z) => sum + z.currentUtilization, 0) / zones.length) : 0
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(type as Zone['type'])}`}>
                        {type}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{zones.length} zones</span>
                    </div>
                    <span className={`font-medium ${getUtilizationColor(avgUtil)}`}>{avgUtil}% avg</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Zone Detail Modal */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedZone.zoneCode}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedZone.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(selectedZone.type)}`}>
                    {selectedZone.type}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Warehouse</p>
                  <p className="text-gray-900 dark:text-white">{selectedZone.warehouse}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Locations</p>
                  <p className="text-gray-900 dark:text-white">{selectedZone.usedLocations} / {selectedZone.totalLocations}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
                  <p className="text-gray-900 dark:text-white">{selectedZone.capacity.toLocaleString()} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Utilization</p>
                  <p className={`font-bold ${getUtilizationColor(selectedZone.currentUtilization)}`}>
                    {selectedZone.currentUtilization}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-gray-900 dark:text-white capitalize">{selectedZone.status}</p>
                </div>
              </div>
              {selectedZone.temperature && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Temperature Range</p>
                  <p className="text-gray-900 dark:text-white">{selectedZone.temperature}</p>
                </div>
              )}
              {selectedZone.restrictions && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Restrictions</p>
                  <div className="flex gap-2 mt-1">
                    {selectedZone.restrictions.map(r => (
                      <span key={r} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedZone(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
