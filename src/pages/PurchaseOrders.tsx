import { useState } from 'react'
import {
  ShoppingBag,
  Truck,
  Clock,
  CheckCircle,
  Search,
  Plus,
  Eye,
  Download,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { usePurchaseOrderList, type PurchaseOrder as APIPurchaseOrder } from '../hooks/usePurchaseOrders'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PurchaseOrder {
  id: string
  poNumber: string
  vendor: string
  vendorCode: string
  orderDate: string
  expectedDate: string
  status: 'draft' | 'submitted' | 'confirmed' | 'in_transit' | 'partial' | 'received' | 'closed'
  totalLines: number
  totalUnits: number
  totalValue: number
  receivedUnits: number
  warehouse: string
}

interface POLine {
  lineNumber: number
  sku: string
  description: string
  orderedQty: number
  receivedQty: number
  unitCost: number
  totalCost: number
  status: 'pending' | 'partial' | 'received'
}

const mockPOs: PurchaseOrder[] = [
  { id: '1', poNumber: 'PO-2024-0125', vendor: 'Acme Supplies Inc', vendorCode: 'VND-001', orderDate: '2024-01-10', expectedDate: '2024-01-17', status: 'in_transit', totalLines: 8, totalUnits: 1200, totalValue: 24500, receivedUnits: 0, warehouse: 'Main DC' },
  { id: '2', poNumber: 'PO-2024-0124', vendor: 'Tech Components', vendorCode: 'VND-003', orderDate: '2024-01-08', expectedDate: '2024-01-15', status: 'partial', totalLines: 12, totalUnits: 2400, totalValue: 56800, receivedUnits: 1800, warehouse: 'Main DC' },
  { id: '3', poNumber: 'PO-2024-0123', vendor: 'Global Parts Ltd', vendorCode: 'VND-002', orderDate: '2024-01-05', expectedDate: '2024-01-12', status: 'received', totalLines: 5, totalUnits: 800, totalValue: 18200, receivedUnits: 800, warehouse: 'East DC' },
  { id: '4', poNumber: 'PO-2024-0126', vendor: 'Prime Materials Co', vendorCode: 'VND-004', orderDate: '2024-01-12', expectedDate: '2024-01-22', status: 'confirmed', totalLines: 15, totalUnits: 3500, totalValue: 42000, receivedUnits: 0, warehouse: 'Main DC' },
  { id: '5', poNumber: 'PO-2024-0127', vendor: 'Quality Goods Inc', vendorCode: 'VND-005', orderDate: '2024-01-14', expectedDate: '2024-01-20', status: 'submitted', totalLines: 6, totalUnits: 950, totalValue: 15600, receivedUnits: 0, warehouse: 'West DC' },
  { id: '6', poNumber: 'PO-2024-0128', vendor: 'Acme Supplies Inc', vendorCode: 'VND-001', orderDate: '2024-01-15', expectedDate: '2024-01-18', status: 'draft', totalLines: 4, totalUnits: 600, totalValue: 8900, receivedUnits: 0, warehouse: 'Main DC' },
]

const mockLines: POLine[] = [
  { lineNumber: 1, sku: 'SKU-10001', description: 'Component A', orderedQty: 500, receivedQty: 500, unitCost: 12.50, totalCost: 6250, status: 'received' },
  { lineNumber: 2, sku: 'SKU-10002', description: 'Component B', orderedQty: 300, receivedQty: 300, unitCost: 8.75, totalCost: 2625, status: 'received' },
  { lineNumber: 3, sku: 'SKU-10003', description: 'Assembly Kit', orderedQty: 200, receivedQty: 150, unitCost: 45.00, totalCost: 9000, status: 'partial' },
  { lineNumber: 4, sku: 'SKU-10004', description: 'Connector Type X', orderedQty: 400, receivedQty: 0, unitCost: 5.25, totalCost: 2100, status: 'pending' },
  { lineNumber: 5, sku: 'SKU-10005', description: 'Power Supply Unit', orderedQty: 100, receivedQty: 100, unitCost: 85.00, totalCost: 8500, status: 'received' },
]

const weeklyData = [
  { week: 'W1', ordered: 125000, received: 98000 },
  { week: 'W2', ordered: 145000, received: 132000 },
  { week: 'W3', ordered: 118000, received: 115000 },
  { week: 'W4', ordered: 165000, received: 142000 },
]

// Map API status to UI status
function mapAPIStatus(apiStatus: string): PurchaseOrder['status'] {
  const statusMap: Record<string, PurchaseOrder['status']> = {
    'DRAFT': 'draft',
    'SUBMITTED': 'submitted',
    'CONFIRMED': 'confirmed',
    'OPEN': 'in_transit',
    'PARTIAL': 'partial',
    'RECEIVED': 'received',
    'CLOSED': 'closed',
    'CANCELLED': 'closed',
    'PENDING_APPROVAL': 'submitted',
    'APPROVED': 'confirmed',
    'ON_HOLD': 'draft',
  }
  return statusMap[apiStatus] || 'draft'
}

export default function PurchaseOrders() {
  const [activeTab, setActiveTab] = useState<'list' | 'details' | 'analytics'>('list')
  const [selectedPO, setSelectedPO] = useState<string | null>('PO-2024-0124')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch purchase orders from API
  const { data: poData, isLoading, error, refetch } = usePurchaseOrderList({ poNumber: searchTerm || undefined })

  // Map API purchase orders to UI format with fallback to mock data
  const apiPOs: PurchaseOrder[] = poData?.data?.map((po: APIPurchaseOrder) => ({
    id: String(po.id),
    poNumber: po.poNumber,
    vendor: po.vendorName,
    vendorCode: po.vendorCode,
    orderDate: po.orderDate,
    expectedDate: po.expectedDate,
    status: mapAPIStatus(po.status),
    totalLines: po.totalLines,
    totalUnits: po.totalQtyOrdered,
    totalValue: po.totalValue,
    receivedUnits: po.totalQtyReceived,
    warehouse: po.warehouseName,
  })) || []

  // Use API data if available, fallback to mock
  const purchaseOrders = apiPOs.length > 0 ? apiPOs : mockPOs

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      received: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    }
    return styles[status]
  }

  const filteredPOs = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    openPOs: purchaseOrders.filter(po => !['received', 'closed'].includes(po.status)).length,
    inTransit: purchaseOrders.filter(po => po.status === 'in_transit').length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + po.totalValue, 0),
    pendingReceipt: purchaseOrders.filter(po => ['in_transit', 'partial'].includes(po.status)).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage inbound purchase orders</p>
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
            Create PO
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading purchase orders...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400">Failed to load purchase orders. Using sample data.</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open POs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.openPOs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Receipt</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pendingReceipt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'PO List' },
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search POs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">PO #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expected</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lines/Units</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPOs.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => { setSelectedPO(po.poNumber); setActiveTab('details'); }}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedPO === po.poNumber ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{po.poNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{po.vendor}</p>
                          <p className="text-xs text-gray-500">{po.vendorCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{po.orderDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{po.expectedDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {po.totalLines} / {po.totalUnits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        ${po.totalValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {po.totalUnits > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${(po.receivedUnits / po.totalUnits) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round((po.receivedUnits / po.totalUnits) * 100)}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(po.status)}`}>
                          {po.status.replace('_', ' ')}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPO}</h3>
                <p className="text-sm text-gray-500">Vendor: Tech Components (VND-003)</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Receive
                </button>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ordered</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mockLines.map((line) => (
                    <tr key={line.lineNumber} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{line.lineNumber}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{line.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{line.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{line.orderedQty}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{line.receivedQty}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">${line.unitCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${line.totalCost.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${
                          line.status === 'received' ? 'bg-green-100 text-green-800' :
                          line.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {line.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly PO Activity</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="ordered" fill="#3b82f6" name="Ordered Value" />
                <Bar dataKey="received" fill="#22c55e" name="Received Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
