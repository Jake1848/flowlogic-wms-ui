import { useState } from 'react'
import {
  FileCode,
  ArrowRightLeft,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Upload,
  Eye,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface EDITransaction {
  id: string
  transactionId: string
  type: '850' | '855' | '856' | '810' | '997' | '940' | '945' | '944' | '943'
  direction: 'inbound' | 'outbound'
  tradingPartner: string
  status: 'pending' | 'processing' | 'completed' | 'error' | 'acknowledged'
  documentNumber: string
  timestamp: string
  fileSize: string
  errorMessage?: string
}

interface TradingPartner {
  id: string
  partnerId: string
  name: string
  status: 'active' | 'inactive' | 'testing'
  transactionTypes: string[]
  lastActivity: string
  totalTransactions: number
  errorRate: number
}

const mockTransactions: EDITransaction[] = [
  { id: '1', transactionId: 'EDI-20240115-001', type: '850', direction: 'inbound', tradingPartner: 'WALMART', status: 'completed', documentNumber: 'PO-445566', timestamp: '2024-01-15 10:30:00', fileSize: '12.5 KB' },
  { id: '2', transactionId: 'EDI-20240115-002', type: '855', direction: 'outbound', tradingPartner: 'WALMART', status: 'completed', documentNumber: 'PO-445566', timestamp: '2024-01-15 10:32:00', fileSize: '8.2 KB' },
  { id: '3', transactionId: 'EDI-20240115-003', type: '856', direction: 'outbound', tradingPartner: 'TARGET', status: 'processing', documentNumber: 'ASN-789012', timestamp: '2024-01-15 11:00:00', fileSize: '15.8 KB' },
  { id: '4', transactionId: 'EDI-20240115-004', type: '810', direction: 'outbound', tradingPartner: 'AMAZON', status: 'error', documentNumber: 'INV-334455', timestamp: '2024-01-15 09:45:00', fileSize: '6.4 KB', errorMessage: 'Invalid segment: N1*ST' },
  { id: '5', transactionId: 'EDI-20240115-005', type: '940', direction: 'inbound', tradingPartner: 'COSTCO', status: 'completed', documentNumber: 'WO-998877', timestamp: '2024-01-15 08:15:00', fileSize: '22.1 KB' },
  { id: '6', transactionId: 'EDI-20240115-006', type: '997', direction: 'outbound', tradingPartner: 'COSTCO', status: 'acknowledged', documentNumber: 'ACK-998877', timestamp: '2024-01-15 08:16:00', fileSize: '1.2 KB' },
  { id: '7', transactionId: 'EDI-20240114-089', type: '945', direction: 'outbound', tradingPartner: 'HOME DEPOT', status: 'completed', documentNumber: 'SHIP-112233', timestamp: '2024-01-14 16:30:00', fileSize: '18.9 KB' },
  { id: '8', transactionId: 'EDI-20240114-088', type: '850', direction: 'inbound', tradingPartner: 'LOWES', status: 'pending', documentNumber: 'PO-667788', timestamp: '2024-01-14 15:00:00', fileSize: '14.3 KB' },
]

const mockPartners: TradingPartner[] = [
  { id: '1', partnerId: 'WALMART', name: 'Walmart Inc.', status: 'active', transactionTypes: ['850', '855', '856', '810', '997'], lastActivity: '2024-01-15 10:32:00', totalTransactions: 15420, errorRate: 0.3 },
  { id: '2', partnerId: 'TARGET', name: 'Target Corporation', status: 'active', transactionTypes: ['850', '855', '856', '810'], lastActivity: '2024-01-15 11:00:00', totalTransactions: 8920, errorRate: 0.5 },
  { id: '3', partnerId: 'AMAZON', name: 'Amazon.com', status: 'active', transactionTypes: ['850', '856', '810', '997'], lastActivity: '2024-01-15 09:45:00', totalTransactions: 25680, errorRate: 1.2 },
  { id: '4', partnerId: 'COSTCO', name: 'Costco Wholesale', status: 'active', transactionTypes: ['940', '945', '944', '997'], lastActivity: '2024-01-15 08:16:00', totalTransactions: 6540, errorRate: 0.2 },
  { id: '5', partnerId: 'HOMEDEPOT', name: 'The Home Depot', status: 'active', transactionTypes: ['850', '855', '856', '810'], lastActivity: '2024-01-14 16:30:00', totalTransactions: 4230, errorRate: 0.8 },
  { id: '6', partnerId: 'LOWES', name: 'Lowe\'s Companies', status: 'testing', transactionTypes: ['850', '855'], lastActivity: '2024-01-14 15:00:00', totalTransactions: 125, errorRate: 3.2 },
]

const transactionVolume = [
  { date: 'Mon', inbound: 245, outbound: 312 },
  { date: 'Tue', inbound: 289, outbound: 356 },
  { date: 'Wed', inbound: 312, outbound: 398 },
  { date: 'Thu', inbound: 276, outbound: 342 },
  { date: 'Fri', inbound: 334, outbound: 412 },
  { date: 'Sat', inbound: 156, outbound: 189 },
  { date: 'Sun', inbound: 98, outbound: 124 },
]

const errorTrend = [
  { week: 'W1', errors: 12, total: 1520 },
  { week: 'W2', errors: 8, total: 1680 },
  { week: 'W3', errors: 15, total: 1890 },
  { week: 'W4', errors: 6, total: 1750 },
]

const EDI_TYPES: Record<string, string> = {
  '850': 'Purchase Order',
  '855': 'PO Acknowledgment',
  '856': 'Advance Ship Notice',
  '810': 'Invoice',
  '997': 'Functional Acknowledgment',
  '940': 'Warehouse Ship Order',
  '945': 'Warehouse Shipping Advice',
  '944': 'Warehouse Stock Transfer',
  '943': 'Warehouse Stock Transfer',
}

export default function EDIManagement() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'partners' | 'analytics'>('transactions')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedTransaction, setSelectedTransaction] = useState<EDITransaction | null>(null)

  const getStatusBadge = (status: EDITransaction['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      acknowledged: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    }
    return styles[status]
  }

  const getDirectionIcon = (direction: EDITransaction['direction']) => {
    return direction === 'inbound' ? (
      <Download className="w-4 h-4 text-green-500" />
    ) : (
      <Upload className="w-4 h-4 text-blue-500" />
    )
  }

  const filteredTransactions = mockTransactions.filter(txn => {
    const matchesSearch = txn.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.tradingPartner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || txn.type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    totalToday: mockTransactions.length,
    completed: mockTransactions.filter(t => t.status === 'completed' || t.status === 'acknowledged').length,
    errors: mockTransactions.filter(t => t.status === 'error').length,
    pending: mockTransactions.filter(t => t.status === 'pending' || t.status === 'processing').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EDI Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Electronic Data Interchange transactions and partners</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Upload className="w-4 h-4" />
            Send EDI
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Transactions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalToday}</p>
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
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.errors}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'transactions', label: 'Transactions', icon: FileCode },
            { id: 'partners', label: 'Trading Partners', icon: ArrowRightLeft },
            { id: 'analytics', label: 'Analytics', icon: FileText },
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

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
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
              <option value="850">850 - Purchase Order</option>
              <option value="855">855 - PO Acknowledgment</option>
              <option value="856">856 - Advance Ship Notice</option>
              <option value="810">810 - Invoice</option>
              <option value="997">997 - Functional Ack</option>
              <option value="940">940 - Ship Order</option>
              <option value="945">945 - Shipping Advice</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Direction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Partner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">{getDirectionIcon(txn.direction)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-blue-600 dark:text-blue-400">{txn.transactionId}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{txn.type}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{EDI_TYPES[txn.type]}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{txn.tradingPartner}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{txn.documentNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{txn.timestamp}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedTransaction(txn)}
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

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockPartners.map(partner => (
            <div key={partner.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{partner.name}</h3>
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{partner.partnerId}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  partner.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  partner.status === 'testing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {partner.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Transactions</span>
                  <span className="text-gray-900 dark:text-white font-medium">{partner.totalTransactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Error Rate</span>
                  <span className={`font-medium ${partner.errorRate > 1 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {partner.errorRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Activity</span>
                  <span className="text-gray-900 dark:text-white">{partner.lastActivity}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Supported Types</p>
                <div className="flex flex-wrap gap-1">
                  {partner.transactionTypes.map(type => (
                    <span key={type} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Volume (This Week)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="inbound" name="Inbound" fill="#10B981" />
                <Bar dataKey="outbound" name="Outbound" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={errorTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" tick={{ fill: '#9CA3AF' }} />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line type="monotone" dataKey="errors" name="Errors" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Partner Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    <th className="pb-3">Partner</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Transactions</th>
                    <th className="pb-3">Error Rate</th>
                    <th className="pb-3">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {mockPartners.map(partner => (
                    <tr key={partner.id}>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{partner.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{partner.partnerId}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          partner.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          partner.status === 'testing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {partner.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-900 dark:text-white">{partner.totalTransactions.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`font-medium ${partner.errorRate > 1 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {partner.errorRate}%
                        </span>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{partner.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDirectionIcon(selectedTransaction.direction)}
                  <div>
                    <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedTransaction.transactionId}</span>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{EDI_TYPES[selectedTransaction.type]}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedTransaction.status)}`}>
                  {selectedTransaction.status}
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {selectedTransaction.type}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trading Partner</p>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.tradingPartner}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Document Number</p>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.documentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Timestamp</p>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.timestamp}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">File Size</p>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.fileSize}</p>
                </div>
              </div>
              {selectedTransaction.errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Error Message</p>
                  <p className="text-sm text-red-800 dark:text-red-300">{selectedTransaction.errorMessage}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View Raw EDI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
