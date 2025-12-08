import { useState, useMemo } from 'react'
import { Package, CheckCircle, AlertCircle, Truck, ClipboardCheck, RefreshCw, Search } from 'lucide-react'
import {
  useReceiptList,
  useReceivingSummary,
  usePurchaseOrders,
  type Receipt,
  type PurchaseOrder
} from '../hooks/useReceiving'

type ReceiptStatus = 'all' | 'SCHEDULED' | 'ARRIVED' | 'RECEIVING' | 'COMPLETED';
type POStatus = 'all' | 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED';

export default function Receiving() {
  const [activeTab, setActiveTab] = useState<'pos' | 'asn' | 'putaway'>('pos')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | POStatus>('all')
  const [page, setPage] = useState(1)

  // Use React Query hooks for real API data
  const { data: receiptsResponse, isLoading: receiptsLoading, error: receiptsError, refetch: refetchReceipts } = useReceiptList({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 50,
  })

  const { data: purchaseOrdersData, isLoading: posLoading, error: posError } = usePurchaseOrders()
  const { data: summary } = useReceivingSummary()

  // Extract receipts from response
  const receipts = useMemo(() => {
    if (!receiptsResponse) return []
    return Array.isArray(receiptsResponse) ? receiptsResponse : receiptsResponse.data || []
  }, [receiptsResponse])

  // Filter purchase orders locally if needed
  const purchaseOrders = useMemo(() => {
    if (!purchaseOrdersData) return []
    return purchaseOrdersData
  }, [purchaseOrdersData])

  const isLoading = activeTab === 'pos' ? posLoading : receiptsLoading
  const error = activeTab === 'pos' ? posError : receiptsError

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
      case 'COMPLETED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'PARTIALLY_RECEIVED':
      case 'RECEIVING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'ARRIVED':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'CANCELLED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Scheduled'
      case 'ARRIVED': return 'Arrived'
      case 'RECEIVING': return 'Receiving'
      case 'COMPLETED': return 'Completed'
      case 'DRAFT': return 'Draft'
      case 'SUBMITTED': return 'Submitted'
      case 'CONFIRMED': return 'Confirmed'
      case 'PARTIALLY_RECEIVED': return 'Partial'
      case 'RECEIVED': return 'Received'
      case 'CANCELLED': return 'Cancelled'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Receiving</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage inbound shipments, purchase orders, and putaway operations
          </p>
        </div>
        <button
          onClick={() => refetchReceipts()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Expected Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {summary?.scheduledToday || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {summary?.inProgress || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Package className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {summary?.completedToday || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pending Putaway</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {summary?.pendingPutaway || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <ClipboardCheck className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('pos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pos'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('asn')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'asn'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Receipts / ASN
            </button>
            <button
              onClick={() => setActiveTab('putaway')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'putaway'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Putaway Queue
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'pos' ? 'Search by PO number or vendor...' : 'Search by receipt or supplier...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReceiptStatus | POStatus)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              {activeTab === 'pos' ? (
                <>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PARTIALLY_RECEIVED">Partial</option>
                  <option value="RECEIVED">Received</option>
                </>
              ) : (
                <>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ARRIVED">Arrived</option>
                  <option value="RECEIVING">Receiving</option>
                  <option value="COMPLETED">Completed</option>
                </>
              )}
            </select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-600 dark:text-red-400">Failed to load data.</p>
            </div>
          )}

          {/* Purchase Orders Tab */}
          {activeTab === 'pos' && !isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Expected Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Lines
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Value
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
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po: PurchaseOrder) => (
                      <tr
                        key={po.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {po.poNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {po.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {po.totalLines || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          ${(po.totalValue || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
                            {getStatusLabel(po.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 dark:text-blue-400 hover:underline mr-3">
                            View
                          </button>
                          {po.status === 'CONFIRMED' && (
                            <button className="text-green-600 dark:text-green-400 hover:underline">
                              Receive
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ASN/Receipts Tab */}
          {activeTab === 'asn' && !isLoading && (
            <div className="space-y-4">
              {receipts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No receipts found
                </div>
              ) : (
                receipts.map((receipt: Receipt) => (
                  <div
                    key={receipt.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {receipt.receiptNumber}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(receipt.status)}`}>
                            {getStatusLabel(receipt.status)}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">PO:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                              {receipt.poNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Supplier:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">
                              {receipt.supplierName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">
                              {receipt.scheduledDate ? new Date(receipt.scheduledDate).toLocaleDateString() : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Progress:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">
                              {receipt.totalReceivedQty || 0} / {receipt.totalExpectedQty || 0} units
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((receipt.totalReceivedQty || 0) / (receipt.totalExpectedQty || 1)) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm transition-colors">
                          View
                        </button>
                        {(receipt.status === 'ARRIVED' || receipt.status === 'RECEIVING') && (
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                            Continue Receiving
                          </button>
                        )}
                        {receipt.status === 'SCHEDULED' && (
                          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Pagination for receipts */}
              {receiptsResponse && !Array.isArray(receiptsResponse) && receiptsResponse.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page {receiptsResponse.page} of {receiptsResponse.totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= receiptsResponse.totalPages}
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Putaway Queue Tab */}
          {activeTab === 'putaway' && (
            <div className="text-center py-12">
              <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Putaway Queue
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {summary?.pendingPutaway || 0} items waiting to be put away
              </p>
              {(summary?.pendingPutaway || 0) > 0 && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Start Putaway
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
