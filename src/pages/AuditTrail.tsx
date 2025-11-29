import { useState } from 'react'
import {
  History,
  User,
  Search,
  Download,
  Eye,
  Truck,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react'

interface AuditEvent {
  id: string
  timestamp: string
  user: string
  userId: string
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'approve' | 'reject' | 'transfer'
  module: string
  entityType: string
  entityId: string
  description: string
  oldValue?: string
  newValue?: string
  ipAddress: string
  sessionId: string
}

const ACTION_ICONS: Record<string, typeof Edit> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  login: User,
  logout: User,
  approve: CheckCircle,
  reject: AlertTriangle,
  transfer: Truck,
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  view: 'bg-gray-100 text-gray-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-purple-100 text-purple-800',
  approve: 'bg-green-100 text-green-800',
  reject: 'bg-red-100 text-red-800',
  transfer: 'bg-yellow-100 text-yellow-800',
}

const mockAuditEvents: AuditEvent[] = [
  { id: '1', timestamp: '2024-01-15 14:32:15', user: 'John Smith', userId: 'USR-001', action: 'update', module: 'Inventory', entityType: 'Location', entityId: 'LOC-A01-01', description: 'Updated location assignment', oldValue: 'SKU-001', newValue: 'SKU-002', ipAddress: '192.168.1.100', sessionId: 'SES-12345' },
  { id: '2', timestamp: '2024-01-15 14:28:42', user: 'Sarah Johnson', userId: 'USR-002', action: 'create', module: 'Receiving', entityType: 'Receipt', entityId: 'RCV-10045', description: 'Created new receipt for PO-8842', ipAddress: '192.168.1.101', sessionId: 'SES-12346' },
  { id: '3', timestamp: '2024-01-15 14:15:08', user: 'Mike Williams', userId: 'USR-003', action: 'approve', module: 'Orders', entityType: 'Order', entityId: 'ORD-55421', description: 'Approved order for shipping', ipAddress: '192.168.1.102', sessionId: 'SES-12347' },
  { id: '4', timestamp: '2024-01-15 14:02:33', user: 'System', userId: 'SYSTEM', action: 'transfer', module: 'Inventory', entityType: 'Transfer', entityId: 'TRF-8821', description: 'Auto-replenishment transfer completed', oldValue: 'RSV-B05', newValue: 'PRI-A01', ipAddress: '127.0.0.1', sessionId: 'SES-AUTO' },
  { id: '5', timestamp: '2024-01-15 13:55:19', user: 'Emily Davis', userId: 'USR-004', action: 'delete', module: 'Returns', entityType: 'Return', entityId: 'RET-3321', description: 'Cancelled return request', ipAddress: '192.168.1.103', sessionId: 'SES-12348' },
  { id: '6', timestamp: '2024-01-15 13:42:55', user: 'John Smith', userId: 'USR-001', action: 'login', module: 'System', entityType: 'Session', entityId: 'SES-12345', description: 'User logged in', ipAddress: '192.168.1.100', sessionId: 'SES-12345' },
  { id: '7', timestamp: '2024-01-15 13:30:11', user: 'Admin User', userId: 'USR-ADMIN', action: 'update', module: 'Settings', entityType: 'Config', entityId: 'CFG-001', description: 'Updated system configuration', oldValue: 'auto_replen: false', newValue: 'auto_replen: true', ipAddress: '192.168.1.1', sessionId: 'SES-ADMIN' },
  { id: '8', timestamp: '2024-01-15 13:15:44', user: 'Sarah Johnson', userId: 'USR-002', action: 'view', module: 'Reports', entityType: 'Report', entityId: 'RPT-DAILY', description: 'Viewed daily operations report', ipAddress: '192.168.1.101', sessionId: 'SES-12346' },
]

const MODULES = ['All', 'Inventory', 'Receiving', 'Orders', 'Shipping', 'Returns', 'Reports', 'Settings', 'System']
const ACTIONS = ['All', 'create', 'update', 'delete', 'view', 'login', 'logout', 'approve', 'reject', 'transfer']

export default function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModule, setSelectedModule] = useState('All')
  const [selectedAction, setSelectedAction] = useState('All')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  const filteredEvents = mockAuditEvents.filter(event => {
    const matchesSearch =
      event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.entityId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesModule = selectedModule === 'All' || event.module === selectedModule
    const matchesAction = selectedAction === 'All' || event.action === selectedAction
    return matchesSearch && matchesModule && matchesAction
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Trail</h1>
          <p className="text-gray-600 dark:text-gray-400">Track all system activities and changes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <Download className="w-4 h-4" />
          Export Log
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by user, description, or entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {MODULES.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white capitalize"
            >
              {ACTIONS.map(action => (
                <option key={action} value={action} className="capitalize">{action}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Event List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Module</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.map((event) => {
                const ActionIcon = ACTION_ICONS[event.action] || History
                return (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {event.timestamp}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{event.user}</p>
                          <p className="text-xs text-gray-500">{event.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs capitalize ${ACTION_COLORS[event.action]}`}>
                        <ActionIcon className="w-3 h-3" />
                        {event.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{event.module}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{event.entityType}</p>
                        <p className="text-xs font-mono text-gray-500">{event.entityId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {event.description}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Timestamp</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.timestamp}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">User</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.user} ({selectedEvent.userId})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Action</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs capitalize ${ACTION_COLORS[selectedEvent.action]}`}>
                    {selectedEvent.action}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Module</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.module}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Entity Type</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.entityType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Entity ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedEvent.entityId}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Description</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.description}</p>
              </div>
              {selectedEvent.oldValue && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Old Value</p>
                  <p className="text-sm font-mono bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded">
                    {selectedEvent.oldValue}
                  </p>
                </div>
              )}
              {selectedEvent.newValue && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">New Value</p>
                  <p className="text-sm font-mono bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                    {selectedEvent.newValue}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 uppercase">IP Address</p>
                  <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{selectedEvent.ipAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Session ID</p>
                  <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{selectedEvent.sessionId}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
