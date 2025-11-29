import { useState } from 'react'
import {
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  FileText,
  Calendar,
  Eye,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface ComplianceRecord {
  id: string
  recordNumber: string
  type: 'audit' | 'certification' | 'inspection' | 'training' | 'safety' | 'environmental'
  title: string
  description: string
  status: 'compliant' | 'non_compliant' | 'pending' | 'expired' | 'in_progress'
  dueDate: string
  completedDate?: string
  assignedTo: string
  priority: 'high' | 'medium' | 'low'
  category: string
  findings?: string
  correctiveAction?: string
}

interface Regulation {
  id: string
  code: string
  name: string
  category: string
  status: 'active' | 'pending' | 'archived'
  lastReview: string
  nextReview: string
  documentCount: number
}

const mockRecords: ComplianceRecord[] = [
  { id: '1', recordNumber: 'COMP-2024-001', type: 'audit', title: 'Q1 Safety Audit', description: 'Quarterly safety audit for warehouse operations', status: 'compliant', dueDate: '2024-03-31', completedDate: '2024-03-28', assignedTo: 'John Smith', priority: 'high', category: 'Safety', findings: 'All areas compliant' },
  { id: '2', recordNumber: 'COMP-2024-002', type: 'certification', title: 'ISO 9001 Recertification', description: 'Annual ISO 9001 quality management recertification', status: 'in_progress', dueDate: '2024-06-15', assignedTo: 'Sarah Johnson', priority: 'high', category: 'Quality' },
  { id: '3', recordNumber: 'COMP-2024-003', type: 'inspection', title: 'Fire Safety Inspection', description: 'Annual fire safety and emergency equipment inspection', status: 'pending', dueDate: '2024-02-28', assignedTo: 'Mike Williams', priority: 'high', category: 'Safety' },
  { id: '4', recordNumber: 'COMP-2024-004', type: 'training', title: 'Forklift Certification Training', description: 'OSHA forklift operator certification renewal', status: 'compliant', dueDate: '2024-01-31', completedDate: '2024-01-25', assignedTo: 'Emily Davis', priority: 'medium', category: 'Training' },
  { id: '5', recordNumber: 'COMP-2024-005', type: 'environmental', title: 'Waste Disposal Audit', description: 'Quarterly hazardous waste disposal compliance check', status: 'non_compliant', dueDate: '2024-01-15', completedDate: '2024-01-18', assignedTo: 'James Brown', priority: 'high', category: 'Environmental', findings: 'Documentation gaps found', correctiveAction: 'Update disposal logs' },
  { id: '6', recordNumber: 'COMP-2024-006', type: 'safety', title: 'PPE Compliance Check', description: 'Monthly PPE usage and availability audit', status: 'compliant', dueDate: '2024-01-31', completedDate: '2024-01-30', assignedTo: 'Lisa Chen', priority: 'medium', category: 'Safety' },
]

const mockRegulations: Regulation[] = [
  { id: '1', code: 'OSHA-1910', name: 'OSHA General Industry Standards', category: 'Safety', status: 'active', lastReview: '2024-01-01', nextReview: '2024-07-01', documentCount: 45 },
  { id: '2', code: 'EPA-RCRA', name: 'EPA Hazardous Waste Regulations', category: 'Environmental', status: 'active', lastReview: '2023-12-15', nextReview: '2024-06-15', documentCount: 28 },
  { id: '3', code: 'ISO-9001', name: 'ISO 9001 Quality Management', category: 'Quality', status: 'active', lastReview: '2024-01-10', nextReview: '2025-01-10', documentCount: 62 },
  { id: '4', code: 'DOT-HM', name: 'DOT Hazmat Transportation', category: 'Transportation', status: 'active', lastReview: '2023-11-20', nextReview: '2024-05-20', documentCount: 34 },
  { id: '5', code: 'FDA-FSMA', name: 'FDA Food Safety Modernization', category: 'Food Safety', status: 'pending', lastReview: '2023-10-01', nextReview: '2024-04-01', documentCount: 19 },
]

const complianceByCategory = [
  { category: 'Safety', compliant: 15, nonCompliant: 2, pending: 3 },
  { category: 'Quality', compliant: 12, nonCompliant: 1, pending: 4 },
  { category: 'Environmental', compliant: 8, nonCompliant: 3, pending: 2 },
  { category: 'Training', compliant: 20, nonCompliant: 0, pending: 5 },
  { category: 'Transportation', compliant: 6, nonCompliant: 1, pending: 1 },
]

const statusDistribution = [
  { name: 'Compliant', value: 61, color: '#10B981' },
  { name: 'Non-Compliant', value: 7, color: '#EF4444' },
  { name: 'Pending', value: 15, color: '#F59E0B' },
  { name: 'In Progress', value: 12, color: '#3B82F6' },
]

export default function Compliance() {
  const [activeTab, setActiveTab] = useState<'records' | 'regulations' | 'analytics'>('records')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null)

  const getStatusBadge = (status: ComplianceRecord['status']) => {
    const styles = {
      compliant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      non_compliant: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return styles[status]
  }

  const getTypeBadge = (type: ComplianceRecord['type']) => {
    const styles = {
      audit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      certification: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      inspection: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      training: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      safety: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      environmental: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    }
    return styles[type]
  }

  const getPriorityBadge = (priority: ComplianceRecord['priority']) => {
    const styles = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return styles[priority]
  }

  const filteredRecords = mockRecords.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.recordNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || record.type === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  const stats = {
    totalRecords: mockRecords.length,
    compliant: mockRecords.filter(r => r.status === 'compliant').length,
    nonCompliant: mockRecords.filter(r => r.status === 'non_compliant').length,
    pending: mockRecords.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
    complianceRate: Math.round((mockRecords.filter(r => r.status === 'compliant').length / mockRecords.length) * 100),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Regulatory compliance, audits, and certifications</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Record
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalRecords}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compliant</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.compliant}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Non-Compliant</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.nonCompliant}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending/In Progress</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Rate</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.complianceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'records', label: 'Compliance Records', icon: FileText },
            { id: 'regulations', label: 'Regulations', icon: Shield },
            { id: 'analytics', label: 'Analytics', icon: FileCheck },
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

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search compliance records..."
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
              <option value="audit">Audit</option>
              <option value="certification">Certification</option>
              <option value="inspection">Inspection</option>
              <option value="training">Training</option>
              <option value="safety">Safety</option>
              <option value="environmental">Environmental</option>
            </select>
          </div>

          {/* Records Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Record #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{record.recordNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(record.type)}`}>
                        {record.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{record.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(record.priority)}`}>
                        {record.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{record.dueDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{record.assignedTo}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRecord(record)}
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

      {/* Regulations Tab */}
      {activeTab === 'regulations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockRegulations.map(reg => (
              <div key={reg.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{reg.code}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{reg.name}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    reg.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    reg.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {reg.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Category</span>
                    <span className="text-gray-900 dark:text-white">{reg.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Review</span>
                    <span className="text-gray-900 dark:text-white">{reg.lastReview}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Next Review</span>
                    <span className="text-gray-900 dark:text-white">{reg.nextReview}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Documents</span>
                    <span className="text-gray-900 dark:text-white">{reg.documentCount}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    View Documents
                  </button>
                  <button className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance by Category */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="compliant" name="Compliant" fill="#10B981" stackId="a" />
                <Bar dataKey="nonCompliant" name="Non-Compliant" fill="#EF4444" stackId="a" />
                <Bar dataKey="pending" name="Pending" fill="#F59E0B" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ value }) => `${value}`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Due Dates */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Due Dates</h3>
            <div className="space-y-3">
              {mockRecords
                .filter(r => r.status !== 'compliant')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map(record => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        record.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                        record.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-gray-100 dark:bg-gray-600'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          record.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                          record.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{record.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{record.recordNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{record.dueDate}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">{selectedRecord.recordNumber}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRecord.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(selectedRecord.type)}`}>
                  {selectedRecord.type.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRecord.status)}`}>
                  {selectedRecord.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(selectedRecord.priority)}`}>
                  {selectedRecord.priority} priority
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{selectedRecord.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="text-gray-900 dark:text-white">{selectedRecord.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Assigned To</p>
                  <p className="text-gray-900 dark:text-white">{selectedRecord.assignedTo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                  <p className="text-gray-900 dark:text-white">{selectedRecord.dueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed Date</p>
                  <p className="text-gray-900 dark:text-white">{selectedRecord.completedDate || '-'}</p>
                </div>
              </div>
              {selectedRecord.findings && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Findings</p>
                  <p className="text-gray-900 dark:text-white">{selectedRecord.findings}</p>
                </div>
              )}
              {selectedRecord.correctiveAction && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Corrective Action</p>
                  <p className="text-gray-900 dark:text-white">{selectedRecord.correctiveAction}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
