import { useState } from 'react'
import {
  FileText,
  TruckIcon,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  Package,
} from 'lucide-react'
import type { PurchaseOrder } from '../types/warehouse'

const mockOrders: PurchaseOrder[] = [
  { id: '1', poNumber: '8699718', warehouse: '1', source: 'H', actDate: '08/26/2025', transportation: 'T', ordered: 2736, received: 2736, flowThru: 0, receiptNumber: '61911', status: 'C', description: 'COMPLETE' },
  { id: '2', poNumber: '8502394', warehouse: '1', source: 'H', actDate: '09/04/2025', transportation: 'T', ordered: 504, received: 504, flowThru: 0, receiptNumber: '62065', status: 'C', description: 'COMPLETE' },
  { id: '3', poNumber: '8507622', warehouse: '1', source: 'H', actDate: '09/18/2025', transportation: 'T', ordered: 648, received: 648, flowThru: 0, receiptNumber: '62316', status: 'C', description: 'COMPLETE' },
  { id: '4', poNumber: '8510353', warehouse: '1', source: 'H', actDate: '09/26/2025', transportation: 'T', ordered: 1224, received: 1224, flowThru: 0, receiptNumber: '62454', status: 'C', description: 'COMPLETE' },
  { id: '5', poNumber: '8518109', warehouse: '1', source: 'H', actDate: '10/15/2025', transportation: 'T', ordered: 504, received: 504, flowThru: 0, receiptNumber: '62812', status: 'C', description: 'COMPLETE' },
  { id: '6', poNumber: '8521020', warehouse: '1', source: 'H', actDate: '10/17/2025', transportation: 'T', ordered: 504, received: 504, flowThru: 0, receiptNumber: '62849', status: 'C', description: 'COMPLETE' },
  { id: '7', poNumber: '8523630', warehouse: '1', source: 'H', actDate: '10/27/2025', transportation: 'T', ordered: 504, received: 504, flowThru: 0, receiptNumber: '63007', status: 'C', description: 'COMPLETE' },
  { id: '8', poNumber: '8526379', warehouse: '1', source: 'H', actDate: '11/04/2025', transportation: 'T', ordered: 684, received: 684, flowThru: 0, receiptNumber: '63146', status: 'C', description: 'COMPLETE' },
  { id: '9', poNumber: '8528893', warehouse: '1', source: 'H', actDate: '11/13/2025', transportation: 'T', ordered: 1332, received: 1332, flowThru: 0, receiptNumber: '63314', status: 'C', description: 'COMPLETE' },
  { id: '10', poNumber: '8531545', warehouse: '1', source: 'H', actDate: '11/18/2025', transportation: 'T', ordered: 1188, received: 1188, flowThru: 0, receiptNumber: '63373', status: 'C', description: 'COMPLETE' },
  { id: '11', poNumber: '8534022', warehouse: '1', source: 'H', actDate: '11/20/2025', transportation: 'T', ordered: 576, received: 0, flowThru: 0, receiptNumber: '0', status: 'O', description: 'OPEN' },
]

export default function OrderReceiptTracker() {
  const [center, setCenter] = useState('8')
  const [product, setProduct] = useState('896727')
  const [description] = useState('EMC ORANGE DRNK MX')
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)

  const totalOnOrder = mockOrders.reduce((sum, order) => sum + order.ordered, 0)
  const totalReceived = mockOrders.filter(o => o.status === 'C').reduce((sum, order) => sum + order.received, 0)
  const pendingOrders = mockOrders.filter(o => o.status === 'O').length
  const completedOrders = mockOrders.filter(o => o.status === 'C').length

  const getStatusBadge = (status: string, desc: string) => {
    switch (status) {
      case 'C':
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          {desc}
        </span>
      case 'O':
        return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
          <Clock className="w-3 h-3" />
          {desc}
        </span>
      case 'B':
        return <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
          <Clock className="w-3 h-3" />
          BACKORDER
        </span>
      case 'D':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
          <XCircle className="w-3 h-3" />
          DELETED
        </span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{desc}</span>
    }
  }

  const getTransportBadge = (trans: string) => {
    const labels = { T: 'Truck', R: 'Rail', B: 'Backhaul', N: 'None' }
    return <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
      <TruckIcon className="w-3 h-3" />
      {labels[trans as keyof typeof labels]}
    </span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Receipt Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">Product purchase order and receipt history (ORT)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search Criteria */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Center</label>
            <input
              type="text"
              value={center}
              onChange={(e) => setCenter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={description}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total On Order: <span className="font-semibold text-gray-900 dark:text-white">{totalOnOrder.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{mockOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{completedOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{pendingOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Received</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalReceived.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">DETAILS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">PO Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">WH</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Src</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Act Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trn</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ord</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rec</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">FThru#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rcpt#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Std Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                    selectedOrder?.id === order.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{order.poNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.warehouse}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.actDate}</td>
                  <td className="px-4 py-3">{getTransportBadge(order.transportation)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{order.ordered.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{order.received.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{order.flowThru}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{order.receiptNumber !== '0' ? order.receiptNumber : '-'}</td>
                  <td className="px-4 py-3">{getStatusBadge(order.status, order.description)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Purchase Order Tracking</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              View purchase order information for selected products including order quantities, receipt status, and transportation details.
              Click on any row to view detailed information about the purchase order.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
