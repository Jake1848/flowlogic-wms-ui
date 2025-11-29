import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Search,
  Plus,
  Eye,
  ClipboardCheck,
  ShieldAlert,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface SafetyIncident {
  id: string
  type: 'injury' | 'near_miss' | 'property_damage' | 'environmental' | 'fire' | 'other'
  severity: 'minor' | 'moderate' | 'serious' | 'critical'
  date: string
  time: string
  location: string
  description: string
  employee?: string
  witnesses: string[]
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  rootCause?: string
  correctiveActions?: string[]
}

interface SafetyTraining {
  id: string
  name: string
  type: 'forklift' | 'hazmat' | 'fire_safety' | 'first_aid' | 'ppe' | 'ergonomics'
  completedBy: number
  totalRequired: number
  dueDate: string
  status: 'on_track' | 'behind' | 'completed'
}

const mockIncidents: SafetyIncident[] = [
  {
    id: 'INC001',
    type: 'near_miss',
    severity: 'moderate',
    date: '2024-01-22',
    time: '14:35',
    location: 'Aisle B-12',
    description: 'Forklift nearly struck pedestrian at blind corner',
    employee: 'John Smith',
    witnesses: ['Mike Thompson', 'Sarah Lee'],
    status: 'investigating',
    rootCause: 'Inadequate visibility at intersection',
  },
  {
    id: 'INC002',
    type: 'injury',
    severity: 'minor',
    date: '2024-01-20',
    time: '09:15',
    location: 'Receiving Dock 3',
    description: 'Employee sustained minor cut while opening carton',
    employee: 'Jane Doe',
    witnesses: ['Tom Rogers'],
    status: 'resolved',
    rootCause: 'Improper use of cutting tool',
    correctiveActions: ['Retrained on proper box cutting technique', 'Issued new safety cutters'],
  },
  {
    id: 'INC003',
    type: 'property_damage',
    severity: 'moderate',
    date: '2024-01-18',
    time: '16:45',
    location: 'Storage Zone C',
    description: 'Pallet rack damaged by forklift impact',
    witnesses: ['Lisa Martinez'],
    status: 'closed',
    rootCause: 'Operator error due to rushed timeline',
    correctiveActions: ['Rack repaired', 'Operator counseled', 'Added floor markings'],
  },
  {
    id: 'INC004',
    type: 'environmental',
    severity: 'minor',
    date: '2024-01-15',
    time: '11:20',
    location: 'Hazmat Storage',
    description: 'Small chemical spill during transfer',
    employee: 'Bob Wilson',
    witnesses: ['Amy Chen', 'Carlos Rodriguez'],
    status: 'closed',
    rootCause: 'Worn seal on transfer container',
    correctiveActions: ['Spill cleaned per protocol', 'Container replaced', 'Inspection schedule updated'],
  },
]

const mockTrainings: SafetyTraining[] = [
  { id: 'TR001', name: 'Forklift Certification', type: 'forklift', completedBy: 45, totalRequired: 52, dueDate: '2024-02-15', status: 'behind' },
  { id: 'TR002', name: 'Fire Safety & Evacuation', type: 'fire_safety', completedBy: 120, totalRequired: 120, dueDate: '2024-01-31', status: 'completed' },
  { id: 'TR003', name: 'Hazmat Handling', type: 'hazmat', completedBy: 18, totalRequired: 25, dueDate: '2024-02-28', status: 'on_track' },
  { id: 'TR004', name: 'First Aid & CPR', type: 'first_aid', completedBy: 30, totalRequired: 40, dueDate: '2024-03-15', status: 'on_track' },
  { id: 'TR005', name: 'PPE Requirements', type: 'ppe', completedBy: 115, totalRequired: 120, dueDate: '2024-02-01', status: 'behind' },
  { id: 'TR006', name: 'Ergonomics Training', type: 'ergonomics', completedBy: 95, totalRequired: 100, dueDate: '2024-02-20', status: 'on_track' },
]

const incidentTrendData = [
  { month: 'Aug', incidents: 5, nearMisses: 8 },
  { month: 'Sep', incidents: 3, nearMisses: 12 },
  { month: 'Oct', incidents: 4, nearMisses: 6 },
  { month: 'Nov', incidents: 2, nearMisses: 9 },
  { month: 'Dec', incidents: 1, nearMisses: 7 },
  { month: 'Jan', incidents: 2, nearMisses: 4 },
]

const incidentsByType = [
  { type: 'Near Miss', count: 15 },
  { type: 'Minor Injury', count: 8 },
  { type: 'Property', count: 5 },
  { type: 'Environmental', count: 3 },
  { type: 'Serious Injury', count: 1 },
]

export default function SafetyManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incidents' | 'training' | 'inspections'>('dashboard')

  const getSeverityBadge = (severity: SafetyIncident['severity']) => {
    const styles = {
      minor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      moderate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      serious: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      critical: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity]}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type: SafetyIncident['type']) => {
    const styles = {
      injury: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      near_miss: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      property_damage: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      environmental: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      fire: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    const labels = {
      injury: 'Injury',
      near_miss: 'Near Miss',
      property_damage: 'Property Damage',
      environmental: 'Environmental',
      fire: 'Fire',
      other: 'Other',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {labels[type]}
      </span>
    )
  }

  const getStatusBadge = (status: SafetyIncident['status']) => {
    const styles = {
      reported: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      investigating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTrainingStatusBadge = (status: SafetyTraining['status']) => {
    const styles = {
      on_track: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      behind: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    }
    const labels = {
      on_track: 'On Track',
      behind: 'Behind',
      completed: 'Completed',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const filteredIncidents = mockIncidents.filter(
    (incident) =>
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    daysWithoutIncident: 3,
    totalIncidentsYTD: 12,
    openInvestigations: mockIncidents.filter((i) => i.status === 'investigating').length,
    trainingCompliance: Math.round(
      (mockTrainings.reduce((sum, t) => sum + t.completedBy, 0) /
        mockTrainings.reduce((sum, t) => sum + t.totalRequired, 0)) *
        100
    ),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Safety Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track incidents, training, and safety compliance</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <FileText className="w-4 h-4" />
            Safety Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Plus className="w-4 h-4" />
            Report Incident
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 shadow-sm text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-green-100">Days Without Incident</p>
              <p className="text-3xl font-bold">{stats.daysWithoutIncident}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Incidents YTD</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalIncidentsYTD}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open Investigations</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.openInvestigations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Training Compliance</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.trainingCompliance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'incidents', label: 'Incidents' },
            { id: 'training', label: 'Training' },
            { id: 'inspections', label: 'Inspections' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'dashboard' | 'incidents' | 'training' | 'inspections')}
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

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Incident Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incidentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} name="Incidents" />
                  <Line type="monotone" dataKey="nearMisses" stroke="#F59E0B" strokeWidth={2} name="Near Misses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Incidents by Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidentsByType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Incidents</h3>
            <div className="space-y-3">
              {mockIncidents.slice(0, 3).map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      incident.type === 'injury' ? 'bg-red-100 dark:bg-red-900/30' :
                      incident.type === 'near_miss' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        incident.type === 'injury' ? 'text-red-600' :
                        incident.type === 'near_miss' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{incident.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{incident.location}</span>
                        <span>•</span>
                        <span>{incident.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getTypeBadge(incident.type)}
                    {getStatusBadge(incident.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
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
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{incident.date}</div>
                      <div className="text-xs text-gray-500">{incident.time}</div>
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(incident.type)}</td>
                    <td className="px-6 py-4">{getSeverityBadge(incident.severity)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{incident.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {incident.description}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(incident.status)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedIncident(incident)}
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

      {activeTab === 'training' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockTrainings.map((training) => (
            <div key={training.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{training.name}</h3>
                    <p className="text-sm text-gray-500">Due: {training.dueDate}</p>
                  </div>
                </div>
                {getTrainingStatusBadge(training.status)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {training.completedBy}/{training.totalRequired}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      training.status === 'completed' ? 'bg-blue-600' :
                      training.status === 'behind' ? 'bg-red-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${(training.completedBy / training.totalRequired) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'inspections' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
          <ClipboardCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Safety Inspections</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Schedule and track regular safety inspections
          </p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Schedule Inspection
          </button>
        </div>
      )}

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Incident Report</h2>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-3">
                {getTypeBadge(selectedIncident.type)}
                {getSeverityBadge(selectedIncident.severity)}
                {getStatusBadge(selectedIncident.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Date & Time</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedIncident.date} at {selectedIncident.time}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Location</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedIncident.location}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedIncident.description}</p>
              </div>

              {selectedIncident.employee && (
                <div>
                  <label className="text-sm text-gray-500">Employee Involved</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedIncident.employee}</p>
                </div>
              )}

              {selectedIncident.witnesses.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Witnesses</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedIncident.witnesses.join(', ')}
                  </p>
                </div>
              )}

              {selectedIncident.rootCause && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <label className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">Root Cause</label>
                  <p className="text-yellow-900 dark:text-yellow-300">{selectedIncident.rootCause}</p>
                </div>
              )}

              {selectedIncident.correctiveActions && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <label className="text-sm text-green-800 dark:text-green-400 font-medium">Corrective Actions</label>
                  <ul className="list-disc list-inside text-green-900 dark:text-green-300">
                    {selectedIncident.correctiveActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
