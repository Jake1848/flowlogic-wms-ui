import { useState } from 'react'
import {
  Truck,
  Clock,
  Package,
  CheckCircle,
  AlertTriangle,
  Search,
  Download,
  Upload,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useASNList, type ASN as APIASN } from '../hooks/useASN'

interface ASN {
  id: string
  asnNumber: string
  vendor: string
  poNumber: string
  expectedDate: string
  expectedTime: string
  status: 'pending' | 'in_transit' | 'arrived' | 'receiving' | 'completed' | 'discrepancy'
  totalLines: number
  totalUnits: number
  totalCases: number
  carrier: string
  trackingNumber: string
  receivedUnits?: number
}

interface ASNLine {
  lineNumber: number
  sku: string
  description: string
  expectedQty: number
  receivedQty: number
  uom: string
  status: 'pending' | 'received' | 'partial' | 'discrepancy'
}

const mockASNs: ASN[] = [
  { id: '1', asnNumber: 'ASN-2024-0015', vendor: 'Acme Supplies', poNumber: 'PO-88421', expectedDate: '2024-01-16', expectedTime: '10:00 AM', status: 'in_transit', totalLines: 12, totalUnits: 1250, totalCases: 52, carrier: 'UPS Freight', trackingNumber: '1Z999AA10123456784' },
  { id: '2', asnNumber: 'ASN-2024-0016', vendor: 'Global Parts Inc', poNumber: 'PO-88422', expectedDate: '2024-01-16', expectedTime: '02:00 PM', status: 'pending', totalLines: 8, totalUnits: 640, totalCases: 28, carrier: 'FedEx Freight', trackingNumber: '794644790112' },
  { id: '3', asnNumber: 'ASN-2024-0014', vendor: 'Tech Components', poNumber: 'PO-88420', expectedDate: '2024-01-15', expectedTime: '08:00 AM', status: 'receiving', totalLines: 15, totalUnits: 2100, totalCases: 84, carrier: 'XPO Logistics', trackingNumber: 'XPO12345678', receivedUnits: 1680 },
  { id: '4', asnNumber: 'ASN-2024-0013', vendor: 'Prime Materials', poNumber: 'PO-88419', expectedDate: '2024-01-15', expectedTime: '11:00 AM', status: 'completed', totalLines: 6, totalUnits: 480, totalCases: 20, carrier: 'Old Dominion', trackingNumber: 'OD987654321', receivedUnits: 480 },
  { id: '5', asnNumber: 'ASN-2024-0012', vendor: 'Quality Goods Co', poNumber: 'PO-88418', expectedDate: '2024-01-14', expectedTime: '03:00 PM', status: 'discrepancy', totalLines: 10, totalUnits: 890, totalCases: 38, carrier: 'Saia LTL', trackingNumber: 'SAIA11223344', receivedUnits: 845 },
]

const mockLines: ASNLine[] = [
  { lineNumber: 1, sku: 'SKU-10045', description: 'Widget Type A', expectedQty: 200, receivedQty: 200, uom: 'EA', status: 'received' },
  { lineNumber: 2, sku: 'SKU-10046', description: 'Widget Type B', expectedQty: 150, receivedQty: 150, uom: 'EA', status: 'received' },
  { lineNumber: 3, sku: 'SKU-10047', description: 'Connector Assembly', expectedQty: 100, receivedQty: 85, uom: 'EA', status: 'partial' },
  { lineNumber: 4, sku: 'SKU-10048', description: 'Power Module', expectedQty: 75, receivedQty: 0, uom: 'EA', status: 'pending' },
  { lineNumber: 5, sku: 'SKU-10049', description: 'Display Panel', expectedQty: 50, receivedQty: 55, uom: 'EA', status: 'discrepancy' },
]

const weeklyData = [
  { day: 'Mon', received: 12, expected: 15 },
  { day: 'Tue', received: 18, expected: 16 },
  { day: 'Wed', received: 14, expected: 14 },
  { day: 'Thu', received: 20, expected: 18 },
  { day: 'Fri', received: 16, expected: 20 },
]

// Map API status to UI status
function mapAPIStatus(apiStatus: string): ASN['status'] {
  const statusMap: Record<string, ASN['status']> = {
    'PENDING': 'pending',
    'VALIDATED': 'pending',
    'SCHEDULED': 'pending',
    'IN_TRANSIT': 'in_transit',
    'ARRIVED': 'arrived',
    'RECEIVING': 'receiving',
    'RECEIVED': 'completed',
    'CLOSED': 'completed',
    'CANCELLED': 'discrepancy',
  }
  return statusMap[apiStatus] || 'pending'
}

export default function ASNManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'details' | 'analytics'>('list')
  const [selectedASN, setSelectedASN] = useState<string | null>('ASN-2024-0014')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch ASNs from API
  const { data: asnData, isLoading, error, refetch } = useASNList({ search: searchTerm || undefined })

  // Map API ASNs to UI format with fallback to mock data
  const apiASNs: ASN[] = asnData?.data?.map((asn: APIASN) => {
    const totalUnits = asn.lines?.reduce((sum, line) => sum + line.quantityExpected, 0) || 0
    const receivedUnits = asn.lines?.reduce((sum, line) => sum + line.quantityReceived, 0) || 0
    return {
      id: asn.id,
      asnNumber: asn.asnNumber,
      vendor: asn.vendor?.name || 'Unknown Vendor',
      poNumber: asn.purchaseOrder?.poNumber || 'N/A',
      expectedDate: asn.expectedArrival?.split('T')[0] || '',
      expectedTime: asn.expectedArrival ? new Date(asn.expectedArrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
      status: mapAPIStatus(asn.status),
      totalLines: asn._count?.lines || asn.lines?.length || 0,
      totalUnits,
      totalCases: asn.totalCases || 0,
      carrier: asn.carrier?.name || 'Unknown Carrier',
      trackingNumber: asn.trackingNumber || asn.proNumber || '',
      receivedUnits,
    }
  }) || []

  // Use API data if available, fallback to mock
  const asns = apiASNs.length > 0 ? apiASNs : mockASNs

  const getStatusBadge = (status: ASN['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      in_transit: 'bg-blue-100 text-blue-800',
      arrived: 'bg-purple-100 text-purple-800',
      receiving: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      discrepancy: 'bg-red-100 text-red-800',
    }
    return styles[status]
  }

  const getLineStatusBadge = (status: ASNLine['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      received: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      discrepancy: 'bg-red-100 text-red-800',
    }
    return styles[status]
  }

  const filteredASNs = asns.filter(asn =>
    asn.asnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asn.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asn.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    pending: asns.filter(a => a.status === 'pending').length,
    inTransit: asns.filter(a => a.status === 'in_transit').length,
    receiving: asns.filter(a => a.status === 'receiving').length,
    discrepancies: asns.filter(a => a.status === 'discrepancy').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ASN Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Advanced Shipping Notice tracking and processing</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Upload className="w-4 h-4" />
            Import ASN
          </button>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sync EDI
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading ASNs...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400">Failed to load ASNs. Using sample data.</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receiving</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.receiving}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Discrepancies</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.discrepancies}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'ASN List' },
            { id: 'details', label: 'Line Details' },
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
      {activeTab === 'list' && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search ASN, vendor, or PO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ASN #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">PO #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expected</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lines/Units</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Carrier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredASNs.map((asn) => (
                    <tr
                      key={asn.id}
                      onClick={() => { setSelectedASN(asn.asnNumber); setActiveTab('details'); }}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedASN === asn.asnNumber ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{asn.asnNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{asn.vendor}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{asn.poNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {asn.expectedDate} {asn.expectedTime}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {asn.totalLines} / {asn.totalUnits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{asn.carrier}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(asn.status)}`}>
                          {asn.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'details' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedASN}</h3>
                <p className="text-sm text-gray-500">Vendor: Tech Components | PO: PO-88420</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Complete Receiving
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Expected Date</p>
                <p className="font-medium text-gray-900 dark:text-white">2024-01-15 08:00 AM</p>
              </div>
              <div>
                <p className="text-gray-500">Carrier</p>
                <p className="font-medium text-gray-900 dark:text-white">XPO Logistics</p>
              </div>
              <div>
                <p className="text-gray-500">Tracking</p>
                <p className="font-medium text-blue-600 font-mono">XPO12345678</p>
              </div>
              <div>
                <p className="text-gray-500">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '80%' }} />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">80%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Line</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">UOM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expected</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Variance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mockLines.map((line) => {
                    const variance = line.receivedQty - line.expectedQty
                    return (
                      <tr key={line.lineNumber} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{line.lineNumber}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{line.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{line.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{line.uom}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{line.expectedQty}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{line.receivedQty}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={variance === 0 ? 'text-gray-500' : variance > 0 ? 'text-green-600' : 'text-red-600'}>
                            {variance > 0 ? '+' : ''}{variance}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs capitalize ${getLineStatusBadge(line.status)}`}>
                            {line.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly ASN Processing</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="expected" fill="#9ca3af" name="Expected" />
                <Bar dataKey="received" fill="#3b82f6" name="Received" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
