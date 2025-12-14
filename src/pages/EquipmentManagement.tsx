import { useState } from 'react'
import {
  Truck,
  Wrench,
  Battery,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  Settings,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEquipmentList, type Equipment as APIEquipment } from '../hooks/useEquipment'

interface Equipment {
  id: string
  assetId: string
  name: string
  type: 'forklift' | 'pallet_jack' | 'reach_truck' | 'scanner' | 'printer' | 'conveyor' | 'other'
  model: string
  serialNumber: string
  location: string
  status: 'operational' | 'maintenance' | 'repair' | 'offline' | 'retired'
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  lastMaintenance: string
  nextMaintenance: string
  hoursUsed: number
  assignedTo?: string
  batteryLevel?: number
}

interface MaintenanceRecord {
  id: string
  equipmentId: string
  type: 'preventive' | 'repair' | 'inspection' | 'calibration'
  description: string
  date: string
  performedBy: string
  cost: number
  notes: string
}

const mockEquipment: Equipment[] = [
  { id: '1', assetId: 'FLT-001', name: 'Forklift #1', type: 'forklift', model: 'Toyota 8FBE15U', serialNumber: 'TYT12345678', location: 'Zone A', status: 'operational', condition: 'excellent', lastMaintenance: '2024-01-10', nextMaintenance: '2024-02-10', hoursUsed: 2450, assignedTo: 'John Smith', batteryLevel: 85 },
  { id: '2', assetId: 'FLT-002', name: 'Forklift #2', type: 'forklift', model: 'Toyota 8FBE15U', serialNumber: 'TYT12345679', location: 'Zone B', status: 'operational', condition: 'good', lastMaintenance: '2024-01-05', nextMaintenance: '2024-02-05', hoursUsed: 3120, assignedTo: 'Sarah Johnson', batteryLevel: 62 },
  { id: '3', assetId: 'RCH-001', name: 'Reach Truck #1', type: 'reach_truck', model: 'Crown RR5725', serialNumber: 'CRW98765432', location: 'Zone C', status: 'maintenance', condition: 'fair', lastMaintenance: '2024-01-12', nextMaintenance: '2024-01-15', hoursUsed: 4560, batteryLevel: 30 },
  { id: '4', assetId: 'PJK-001', name: 'Pallet Jack #1', type: 'pallet_jack', model: 'Raymond 8410', serialNumber: 'RAY55667788', location: 'Shipping', status: 'operational', condition: 'good', lastMaintenance: '2024-01-08', nextMaintenance: '2024-02-08', hoursUsed: 1890 },
  { id: '5', assetId: 'SCN-001', name: 'RF Scanner Pool', type: 'scanner', model: 'Zebra MC9300', serialNumber: 'ZBR11223344', location: 'IT Room', status: 'operational', condition: 'excellent', lastMaintenance: '2024-01-01', nextMaintenance: '2024-04-01', hoursUsed: 0 },
  { id: '6', assetId: 'PRT-001', name: 'Label Printer #1', type: 'printer', model: 'Zebra ZT410', serialNumber: 'ZBR99887766', location: 'Pack Station', status: 'repair', condition: 'poor', lastMaintenance: '2023-12-15', nextMaintenance: '2024-01-20', hoursUsed: 8500 },
  { id: '7', assetId: 'FLT-003', name: 'Forklift #3', type: 'forklift', model: 'Crown FC5200', serialNumber: 'CRW44556677', location: 'Receiving', status: 'offline', condition: 'fair', lastMaintenance: '2023-12-20', nextMaintenance: '2024-01-20', hoursUsed: 5200, batteryLevel: 0 },
]

const mockMaintenance: MaintenanceRecord[] = [
  { id: '1', equipmentId: 'FLT-001', type: 'preventive', description: 'Monthly PM - oil change, brake check', date: '2024-01-10', performedBy: 'Mike Tech', cost: 150, notes: 'All checks passed' },
  { id: '2', equipmentId: 'RCH-001', type: 'repair', description: 'Hydraulic leak repair', date: '2024-01-12', performedBy: 'External Vendor', cost: 850, notes: 'Replaced hydraulic seals' },
  { id: '3', equipmentId: 'PRT-001', type: 'repair', description: 'Printhead replacement', date: '2024-01-14', performedBy: 'Zebra Service', cost: 450, notes: 'Under warranty' },
]

const utilizationData = [
  { name: 'FLT-001', hours: 180, target: 200 },
  { name: 'FLT-002', hours: 195, target: 200 },
  { name: 'RCH-001', hours: 120, target: 200 },
  { name: 'PJK-001', hours: 160, target: 180 },
  { name: 'FLT-003', hours: 85, target: 200 },
]

// Map API status to UI status
function mapAPIStatus(apiStatus: string): Equipment['status'] {
  const statusMap: Record<string, Equipment['status']> = {
    'OPERATIONAL': 'operational',
    'MAINTENANCE': 'maintenance',
    'REPAIR': 'repair',
    'OFFLINE': 'offline',
    'RETIRED': 'retired',
  }
  return statusMap[apiStatus] || 'offline'
}

// Map API condition to UI condition
function mapAPICondition(apiCondition: string): Equipment['condition'] {
  const conditionMap: Record<string, Equipment['condition']> = {
    'EXCELLENT': 'excellent',
    'GOOD': 'good',
    'FAIR': 'fair',
    'POOR': 'poor',
  }
  return conditionMap[apiCondition] || 'fair'
}

export default function EquipmentManagement() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'maintenance' | 'analytics'>('inventory')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  // Fetch equipment from API
  const { data: equipmentData, isLoading, error, refetch } = useEquipmentList({
    search: searchTerm || undefined,
    type: typeFilter !== 'All' ? typeFilter : undefined
  })

  // Map API equipment to UI format with fallback to mock data
  const apiEquipment: Equipment[] = equipmentData?.data?.map((eq: APIEquipment) => ({
    id: eq.id,
    assetId: eq.assetId,
    name: eq.name,
    type: eq.type,
    model: eq.model,
    serialNumber: eq.serialNumber,
    location: eq.location,
    status: mapAPIStatus(eq.status),
    condition: mapAPICondition(eq.condition),
    lastMaintenance: eq.lastMaintenance || '',
    nextMaintenance: eq.nextMaintenance || '',
    hoursUsed: eq.hoursUsed,
    assignedTo: eq.assignedTo,
    batteryLevel: eq.batteryLevel,
  })) || []

  // Use API data if available, fallback to mock
  const equipment = apiEquipment.length > 0 ? apiEquipment : mockEquipment

  const getStatusBadge = (status: Equipment['status']) => {
    const styles = {
      operational: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      repair: 'bg-red-100 text-red-800',
      offline: 'bg-gray-100 text-gray-800',
      retired: 'bg-gray-200 text-gray-600',
    }
    return styles[status]
  }

  const getConditionBadge = (condition: Equipment['condition']) => {
    const styles = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    }
    return styles[condition]
  }

  const getTypeIcon = (type: Equipment['type']) => {
    switch (type) {
      case 'forklift':
      case 'reach_truck':
      case 'pallet_jack':
        return Truck
      default:
        return Settings
    }
  }

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.assetId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || eq.type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: equipment.length,
    operational: equipment.filter(e => e.status === 'operational').length,
    needsMaintenance: equipment.filter(e => e.status === 'maintenance' || e.status === 'repair').length,
    offline: equipment.filter(e => e.status === 'offline').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipment Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and maintain warehouse equipment</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading equipment...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400">Failed to load equipment. Using sample data.</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Equipment</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Operational</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.operational}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Wrench className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Needs Service</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.needsMaintenance}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Offline</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.offline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'inventory', label: 'Equipment List' },
            { id: 'maintenance', label: 'Maintenance' },
            { id: 'analytics', label: 'Utilization' },
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
      {activeTab === 'inventory' && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="All">All Types</option>
              <option value="forklift">Forklifts</option>
              <option value="reach_truck">Reach Trucks</option>
              <option value="pallet_jack">Pallet Jacks</option>
              <option value="scanner">Scanners</option>
              <option value="printer">Printers</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map((eq) => {
              const TypeIcon = getTypeIcon(eq.type)
              return (
                <div key={eq.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <TypeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{eq.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{eq.assetId}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(eq.status)}`}>
                      {eq.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Model</span>
                      <span className="text-gray-900 dark:text-white">{eq.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span className="text-gray-900 dark:text-white">{eq.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Condition</span>
                      <span className={`px-2 py-0.5 rounded text-xs capitalize ${getConditionBadge(eq.condition)}`}>
                        {eq.condition}
                      </span>
                    </div>
                    {eq.batteryLevel !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Battery</span>
                        <div className="flex items-center gap-2">
                          <Battery className={`w-4 h-4 ${eq.batteryLevel > 50 ? 'text-green-500' : eq.batteryLevel > 20 ? 'text-yellow-500' : 'text-red-500'}`} />
                          <span className="text-gray-900 dark:text-white">{eq.batteryLevel}%</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hours Used</span>
                      <span className="text-gray-900 dark:text-white">{eq.hoursUsed.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Next PM: {eq.nextMaintenance}</span>
                    {eq.assignedTo && (
                      <span className="text-blue-600">{eq.assignedTo}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'maintenance' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Maintenance History</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Log Maintenance
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Performed By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockMaintenance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{record.equipmentId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        record.type === 'preventive' ? 'bg-green-100 text-green-800' :
                        record.type === 'repair' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{record.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{record.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{record.performedBy}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${record.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Equipment Utilization (Hours)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#3b82f6" name="Actual Hours" />
                <Bar dataKey="target" fill="#9ca3af" name="Target Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
