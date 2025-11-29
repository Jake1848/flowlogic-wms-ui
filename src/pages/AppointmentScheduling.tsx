import { useState } from 'react'
import {
  Calendar,
  Clock,
  Truck,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Appointment {
  id: string
  appointmentNumber: string
  type: 'inbound' | 'outbound'
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  carrier: string
  driverName?: string
  truckNumber?: string
  trailerNumber?: string
  dock: string
  scheduledDate: string
  scheduledTime: string
  actualArrival?: string
  actualDeparture?: string
  poNumbers: string[]
  expectedPallets: number
  notes?: string
}

const mockAppointments: Appointment[] = [
  { id: '1', appointmentNumber: 'APT-2024-0089', type: 'inbound', status: 'in_progress', carrier: 'XPO Logistics', driverName: 'John Smith', truckNumber: 'TRK-4521', trailerNumber: 'TRL-8890', dock: 'DOCK-01', scheduledDate: '2024-01-15', scheduledTime: '08:00', actualArrival: '07:55', poNumbers: ['PO-445566', 'PO-445567'], expectedPallets: 24, notes: 'Temperature controlled freight' },
  { id: '2', appointmentNumber: 'APT-2024-0090', type: 'inbound', status: 'scheduled', carrier: 'FedEx Freight', dock: 'DOCK-02', scheduledDate: '2024-01-15', scheduledTime: '09:30', poNumbers: ['PO-445570'], expectedPallets: 12 },
  { id: '3', appointmentNumber: 'APT-2024-0091', type: 'outbound', status: 'checked_in', carrier: 'UPS Freight', driverName: 'Mike Wilson', truckNumber: 'TRK-7823', trailerNumber: 'TRL-2234', dock: 'DOCK-05', scheduledDate: '2024-01-15', scheduledTime: '10:00', actualArrival: '09:45', poNumbers: ['SO-112233', 'SO-112234', 'SO-112235'], expectedPallets: 18 },
  { id: '4', appointmentNumber: 'APT-2024-0088', type: 'inbound', status: 'completed', carrier: 'SAIA LTL', driverName: 'Robert Davis', truckNumber: 'TRK-1122', trailerNumber: 'TRL-5566', dock: 'DOCK-03', scheduledDate: '2024-01-15', scheduledTime: '07:00', actualArrival: '06:58', actualDeparture: '08:15', poNumbers: ['PO-445560'], expectedPallets: 8 },
  { id: '5', appointmentNumber: 'APT-2024-0092', type: 'outbound', status: 'scheduled', carrier: 'J.B. Hunt', dock: 'DOCK-06', scheduledDate: '2024-01-15', scheduledTime: '11:00', poNumbers: ['SO-112240'], expectedPallets: 26 },
  { id: '6', appointmentNumber: 'APT-2024-0086', type: 'inbound', status: 'no_show', carrier: 'Old Dominion', dock: 'DOCK-04', scheduledDate: '2024-01-15', scheduledTime: '06:00', poNumbers: ['PO-445555'], expectedPallets: 15 },
  { id: '7', appointmentNumber: 'APT-2024-0093', type: 'outbound', status: 'scheduled', carrier: 'ABF Freight', dock: 'DOCK-07', scheduledDate: '2024-01-15', scheduledTime: '13:00', poNumbers: ['SO-112245', 'SO-112246'], expectedPallets: 20 },
  { id: '8', appointmentNumber: 'APT-2024-0094', type: 'inbound', status: 'scheduled', carrier: 'Estes Express', dock: 'DOCK-08', scheduledDate: '2024-01-15', scheduledTime: '14:30', poNumbers: ['PO-445580', 'PO-445581'], expectedPallets: 16 },
]

const dockStatus = [
  { dock: 'DOCK-01', status: 'occupied', appointment: 'APT-2024-0089', type: 'inbound' },
  { dock: 'DOCK-02', status: 'available', appointment: null, type: null },
  { dock: 'DOCK-03', status: 'available', appointment: null, type: null },
  { dock: 'DOCK-04', status: 'available', appointment: null, type: null },
  { dock: 'DOCK-05', status: 'occupied', appointment: 'APT-2024-0091', type: 'outbound' },
  { dock: 'DOCK-06', status: 'reserved', appointment: 'APT-2024-0092', type: 'outbound' },
  { dock: 'DOCK-07', status: 'reserved', appointment: 'APT-2024-0093', type: 'outbound' },
  { dock: 'DOCK-08', status: 'reserved', appointment: 'APT-2024-0094', type: 'inbound' },
]

const hourlySchedule = [
  { hour: '6AM', inbound: 1, outbound: 0 },
  { hour: '7AM', inbound: 1, outbound: 0 },
  { hour: '8AM', inbound: 1, outbound: 0 },
  { hour: '9AM', inbound: 1, outbound: 1 },
  { hour: '10AM', inbound: 0, outbound: 1 },
  { hour: '11AM', inbound: 0, outbound: 1 },
  { hour: '12PM', inbound: 0, outbound: 0 },
  { hour: '1PM', inbound: 0, outbound: 1 },
  { hour: '2PM', inbound: 1, outbound: 0 },
  { hour: '3PM', inbound: 0, outbound: 0 },
]

export default function AppointmentScheduling() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'docks'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const getStatusBadge = (status: Appointment['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      checked_in: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      no_show: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return styles[status]
  }

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'no_show': return <XCircle className="w-4 h-4 text-red-500" />
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />
      default: return <Calendar className="w-4 h-4 text-blue-500" />
    }
  }

  const filteredAppointments = mockAppointments.filter(apt => {
    const matchesSearch = apt.appointmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.carrier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || apt.type === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  const stats = {
    totalToday: mockAppointments.length,
    inProgress: mockAppointments.filter(a => a.status === 'in_progress' || a.status === 'checked_in').length,
    completed: mockAppointments.filter(a => a.status === 'completed').length,
    scheduled: mockAppointments.filter(a => a.status === 'scheduled').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Scheduling</h1>
          <p className="text-gray-600 dark:text-gray-400">Dock appointments and carrier scheduling</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Appointments</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalToday}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">At Dock</p>
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
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.scheduled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Appointment List', icon: Calendar },
            { id: 'calendar', label: 'Schedule View', icon: Clock },
            { id: 'docks', label: 'Dock Status', icon: MapPin },
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
                placeholder="Search appointments..."
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
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Appointment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Carrier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pallets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">{getStatusIcon(apt.status)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{apt.appointmentNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        apt.type === 'inbound'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{apt.carrier}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{apt.dock}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{apt.scheduledTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{apt.expectedPallets}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedAppointment(apt)}
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

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Schedule by Hour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlySchedule}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="inbound" name="Inbound" fill="#10B981" stackId="a" />
                <Bar dataKey="outbound" name="Outbound" fill="#3B82F6" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline View</h3>
            <div className="space-y-3">
              {mockAppointments
                .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                .map(apt => (
                  <div key={apt.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-16 text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{apt.scheduledTime}</p>
                    </div>
                    <div className={`w-1 h-12 rounded-full ${
                      apt.type === 'inbound' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{apt.carrier}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(apt.status)}`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {apt.dock} • {apt.expectedPallets} pallets • {apt.poNumbers.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Dock Status Tab */}
      {activeTab === 'docks' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dockStatus.map(dock => (
            <div
              key={dock.dock}
              className={`p-4 rounded-xl border-2 ${
                dock.status === 'occupied'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                  : dock.status === 'reserved'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
              }`}
            >
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{dock.dock}</p>
                <p className={`text-sm font-medium capitalize ${
                  dock.status === 'occupied' ? 'text-yellow-600 dark:text-yellow-400' :
                  dock.status === 'reserved' ? 'text-blue-600 dark:text-blue-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {dock.status}
                </p>
                {dock.appointment && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{dock.appointment}</p>
                )}
                {dock.type && (
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                    dock.type === 'inbound'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                  }`}>
                    {dock.type}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedAppointment.appointmentNumber}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAppointment.carrier}</h2>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedAppointment.type === 'inbound'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {selectedAppointment.type}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedAppointment.status)}`}>
                  {selectedAppointment.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dock</p>
                  <p className="text-gray-900 dark:text-white font-mono">{selectedAppointment.dock}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
                  <p className="text-gray-900 dark:text-white">{selectedAppointment.scheduledDate} {selectedAppointment.scheduledTime}</p>
                </div>
                {selectedAppointment.driverName && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Driver</p>
                    <p className="text-gray-900 dark:text-white">{selectedAppointment.driverName}</p>
                  </div>
                )}
                {selectedAppointment.truckNumber && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Truck / Trailer</p>
                    <p className="text-gray-900 dark:text-white">{selectedAppointment.truckNumber} / {selectedAppointment.trailerNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expected Pallets</p>
                  <p className="text-gray-900 dark:text-white">{selectedAppointment.expectedPallets}</p>
                </div>
                {selectedAppointment.actualArrival && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Actual Arrival</p>
                    <p className="text-gray-900 dark:text-white">{selectedAppointment.actualArrival}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">PO/SO Numbers</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedAppointment.poNumbers.map(po => (
                    <span key={po} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {po}
                    </span>
                  ))}
                </div>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="text-gray-900 dark:text-white">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              {selectedAppointment.status === 'scheduled' && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Check In
                </button>
              )}
              {selectedAppointment.status === 'checked_in' && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Start Unload
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
