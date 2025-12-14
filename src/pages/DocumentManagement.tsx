import { useState } from 'react'
import {
  FileText,
  Download,
  Printer,
  Search,
  Plus,
  Eye,
  FolderOpen,
  File,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useDocumentList, type Document as APIDocument } from '../hooks/useDocuments'

interface Document {
  id: string
  documentNumber: string
  type: 'bol' | 'packing_slip' | 'shipping_label' | 'invoice' | 'pod' | 'customs' | 'msds' | 'certificate'
  name: string
  relatedTo: string
  relatedType: 'order' | 'shipment' | 'receipt' | 'item' | 'vendor'
  createdDate: string
  createdBy: string
  fileSize: string
  status: 'draft' | 'final' | 'voided' | 'archived'
  printCount: number
}

interface Template {
  id: string
  name: string
  type: string
  lastModified: string
  usageCount: number
  status: 'active' | 'inactive'
}

const mockDocuments: Document[] = [
  { id: '1', documentNumber: 'BOL-2024-0145', type: 'bol', name: 'Bill of Lading - SO-112233', relatedTo: 'SO-112233', relatedType: 'shipment', createdDate: '2024-01-15 10:30', createdBy: 'John Smith', fileSize: '125 KB', status: 'final', printCount: 3 },
  { id: '2', documentNumber: 'PKS-2024-0890', type: 'packing_slip', name: 'Packing Slip - ORD-5001', relatedTo: 'ORD-5001', relatedType: 'order', createdDate: '2024-01-15 09:15', createdBy: 'Sarah Johnson', fileSize: '85 KB', status: 'final', printCount: 2 },
  { id: '3', documentNumber: 'LBL-2024-1234', type: 'shipping_label', name: 'Shipping Label - 1Z999AA1', relatedTo: 'TRK-1Z999AA1', relatedType: 'shipment', createdDate: '2024-01-15 11:00', createdBy: 'Mike Williams', fileSize: '45 KB', status: 'final', printCount: 1 },
  { id: '4', documentNumber: 'INV-2024-0567', type: 'invoice', name: 'Commercial Invoice - EXP-445', relatedTo: 'EXP-445', relatedType: 'shipment', createdDate: '2024-01-14 16:30', createdBy: 'Emily Davis', fileSize: '156 KB', status: 'final', printCount: 2 },
  { id: '5', documentNumber: 'POD-2024-0089', type: 'pod', name: 'Proof of Delivery - SO-112200', relatedTo: 'SO-112200', relatedType: 'shipment', createdDate: '2024-01-14 14:20', createdBy: 'System', fileSize: '890 KB', status: 'final', printCount: 0 },
  { id: '6', documentNumber: 'CUS-2024-0034', type: 'customs', name: 'Customs Declaration - IMP-778', relatedTo: 'IMP-778', relatedType: 'receipt', createdDate: '2024-01-14 11:45', createdBy: 'James Brown', fileSize: '234 KB', status: 'draft', printCount: 0 },
  { id: '7', documentNumber: 'MSDS-2024-0012', type: 'msds', name: 'Material Safety Data Sheet', relatedTo: 'SKU-HAZ-001', relatedType: 'item', createdDate: '2024-01-10 09:00', createdBy: 'Lisa Chen', fileSize: '512 KB', status: 'final', printCount: 5 },
  { id: '8', documentNumber: 'CERT-2024-0008', type: 'certificate', name: 'Certificate of Origin', relatedTo: 'VND-ACME', relatedType: 'vendor', createdDate: '2024-01-08 10:30', createdBy: 'Robert Kim', fileSize: '178 KB', status: 'archived', printCount: 1 },
]

const mockTemplates: Template[] = [
  { id: '1', name: 'Standard Bill of Lading', type: 'bol', lastModified: '2024-01-10', usageCount: 1250, status: 'active' },
  { id: '2', name: 'Packing Slip - Detailed', type: 'packing_slip', lastModified: '2024-01-08', usageCount: 2340, status: 'active' },
  { id: '3', name: 'Packing Slip - Simple', type: 'packing_slip', lastModified: '2024-01-05', usageCount: 890, status: 'active' },
  { id: '4', name: 'Commercial Invoice - International', type: 'invoice', lastModified: '2024-01-12', usageCount: 456, status: 'active' },
  { id: '5', name: 'Shipping Label - 4x6', type: 'shipping_label', lastModified: '2023-12-15', usageCount: 5670, status: 'active' },
  { id: '6', name: 'Customs Declaration - NAFTA', type: 'customs', lastModified: '2023-11-20', usageCount: 234, status: 'inactive' },
]

const documentsByType = [
  { type: 'BOL', count: 145 },
  { type: 'Packing Slip', count: 320 },
  { type: 'Labels', count: 890 },
  { type: 'Invoices', count: 156 },
  { type: 'POD', count: 245 },
  { type: 'Customs', count: 67 },
]

// Map API type to UI type
function mapAPIType(apiType: string): Document['type'] {
  const typeMap: Record<string, Document['type']> = {
    'BOL': 'bol',
    'PACKING_SLIP': 'packing_slip',
    'SHIPPING_LABEL': 'shipping_label',
    'INVOICE': 'invoice',
    'POD': 'pod',
    'CUSTOMS': 'customs',
    'MSDS': 'msds',
    'CERTIFICATE': 'certificate',
  }
  return typeMap[apiType] || 'certificate'
}

// Map API status to UI status
function mapAPIStatus(apiStatus: string): Document['status'] {
  const statusMap: Record<string, Document['status']> = {
    'DRAFT': 'draft',
    'FINAL': 'final',
    'VOIDED': 'voided',
    'ARCHIVED': 'archived',
  }
  return statusMap[apiStatus] || 'draft'
}

// Map API relatedType to UI relatedType
function mapAPIRelatedType(apiRelatedType: string): Document['relatedType'] {
  const relatedTypeMap: Record<string, Document['relatedType']> = {
    'ORDER': 'order',
    'SHIPMENT': 'shipment',
    'RECEIPT': 'receipt',
    'ITEM': 'item',
    'VENDOR': 'vendor',
  }
  return relatedTypeMap[apiRelatedType] || 'order'
}

export default function DocumentManagement() {
  const [activeTab, setActiveTab] = useState<'documents' | 'templates' | 'analytics'>('documents')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  // Fetch documents from API
  const { data: documentData, isLoading, error, refetch } = useDocumentList({
    search: searchTerm || undefined,
    type: typeFilter !== 'All' ? typeFilter.toUpperCase().replace(' ', '_') : undefined
  })

  // Map API documents to UI format with fallback to mock data
  const apiDocuments: Document[] = documentData?.data?.map((doc: APIDocument) => ({
    id: doc.id,
    documentNumber: doc.documentNumber,
    type: mapAPIType(doc.type),
    name: doc.name,
    relatedTo: doc.relatedTo,
    relatedType: mapAPIRelatedType(doc.relatedType),
    createdDate: doc.createdDate,
    createdBy: doc.createdBy,
    fileSize: doc.fileSize,
    status: mapAPIStatus(doc.status),
    printCount: doc.printCount,
  })) || []

  // Use API data if available, fallback to mock
  const documents = apiDocuments.length > 0 ? apiDocuments : mockDocuments

  const getTypeBadge = (type: Document['type']) => {
    const styles: Record<Document['type'], string> = {
      bol: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      packing_slip: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      shipping_label: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      invoice: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      pod: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      customs: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      msds: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      certificate: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    }
    return styles[type]
  }

  const getStatusBadge = (status: Document['status']) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      final: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      voided: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return styles[status]
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.relatedTo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || doc.type === typeFilter.toLowerCase().replace(' ', '_')
    return matchesSearch && matchesType
  })

  const stats = {
    totalDocuments: documents.length,
    todayCreated: 4,
    pendingPrint: documents.filter(d => d.printCount === 0 && d.status === 'final').length,
    templates: mockTemplates.filter(t => t.status === 'active').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Management</h1>
          <p className="text-gray-600 dark:text-gray-400">BOLs, packing slips, labels, and shipping documents</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Printer className="w-4 h-4" />
            Batch Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Create Document
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading documents...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400">Failed to load documents. Using sample data.</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created Today</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.todayCreated}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Printer className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Print</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingPrint}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Templates</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.templates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'templates', label: 'Templates', icon: FolderOpen },
            { id: 'analytics', label: 'Analytics', icon: File },
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

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
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
              <option value="bol">Bill of Lading</option>
              <option value="packing_slip">Packing Slip</option>
              <option value="shipping_label">Shipping Label</option>
              <option value="invoice">Invoice</option>
              <option value="pod">Proof of Delivery</option>
              <option value="customs">Customs</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Document #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Related To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredDocuments.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{doc.documentNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(doc.type)}`}>
                        {doc.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{doc.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{doc.relatedTo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{doc.createdDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockTemplates.map(template => (
            <div key={template.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  template.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {template.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-3">{template.type.replace('_', ' ')}</p>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                <span>Used {template.usageCount.toLocaleString()} times</span>
                <span>Modified {template.lastModified}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  Edit
                </button>
                <button className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documents by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={documentsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="count" name="Documents" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {mockDocuments.slice(0, 6).map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTypeBadge(doc.type)}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.documentNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{doc.createdBy}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{doc.createdDate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedDocument.documentNumber}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedDocument.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(selectedDocument.type)}`}>
                  {selectedDocument.type.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedDocument.status)}`}>
                  {selectedDocument.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Related To</p>
                  <p className="text-gray-900 dark:text-white font-mono">{selectedDocument.relatedTo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Related Type</p>
                  <p className="text-gray-900 dark:text-white capitalize">{selectedDocument.relatedType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created Date</p>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.createdDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created By</p>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">File Size</p>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.fileSize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Print Count</p>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.printCount}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedDocument(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
