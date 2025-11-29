import { useState } from 'react'
import {
  Layers,
  Plus,
  Minus,
  Search,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react'

// BSA - Batch Slot Adjust
// Transaction for quantity-controlled inventory adjustments for multiple products in a selection location

interface ProductDetail {
  id: string
  location: string
  product: string
  productDetail: string
  description: string
  selQty: number
  adjQty: number
  direction: 'IN' | 'OUT' | ''
}

const REASON_CODES = [
  { code: 'IC', label: 'Inventory Correction', offsetCC: 'ADJ' },
  { code: 'DMG', label: 'Damaged', offsetCC: 'DMG' },
  { code: 'EXP', label: 'Expired', offsetCC: 'EXP' },
  { code: 'FND', label: 'Found Inventory', offsetCC: 'FND' },
  { code: 'LST', label: 'Lost/Missing', offsetCC: 'LST' },
  { code: 'CYC', label: 'Cycle Count', offsetCC: 'CYC' },
  { code: 'RCV', label: 'Receiving Error', offsetCC: 'RCV' },
  { code: 'SHP', label: 'Shipping Error', offsetCC: 'SHP' },
  { code: 'TRF', label: 'Transfer', offsetCC: 'TRF' },
]

const DISTRIBUTION_CENTERS = [
  { id: '8', name: 'DC 8 - Atlanta' },
  { id: '1', name: 'DC 1 - Chicago' },
  { id: '2', name: 'DC 2 - Los Angeles' },
  { id: '3', name: 'DC 3 - Dallas' },
]

const WAREHOUSES = [
  { id: '1', name: 'Warehouse 1 - Main' },
  { id: '2', name: 'Warehouse 2 - Overflow' },
  { id: '3', name: 'Warehouse 3 - Cold Storage' },
]

// Mock product data for demo
const mockProducts: ProductDetail[] = [
  { id: '1', location: 'A-01-01-A', product: 'SKU-10001', productDetail: 'STD', description: 'Widget Alpha Pro', selQty: 100, adjQty: 0, direction: '' },
  { id: '2', location: 'A-01-01-B', product: 'SKU-10002', productDetail: 'STD', description: 'Gadget Beta Standard', selQty: 65, adjQty: 0, direction: '' },
  { id: '3', location: 'A-01-02-A', product: 'SKU-10003', productDetail: 'PRE', description: 'Connector Assembly Kit', selQty: 45, adjQty: 0, direction: '' },
  { id: '4', location: 'A-01-02-B', product: 'SKU-10004', productDetail: 'STD', description: 'Power Supply Unit', selQty: 32, adjQty: 0, direction: '' },
  { id: '5', location: 'A-01-03-A', product: 'SKU-10005', productDetail: 'STD', description: 'Premium Gift Box Set', selQty: 28, adjQty: 0, direction: '' },
]

export default function BatchSlotAdjust() {
  const [distributionCenter, setDistributionCenter] = useState('8')
  const [warehouse, setWarehouse] = useState('1')
  const [reasonCode, setReasonCode] = useState('IC')
  const [authorization, setAuthorization] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [poInvoice, setPOInvoice] = useState('')
  const [vendorCustomer, setVendorCustomer] = useState('')

  const [products, setProducts] = useState<ProductDetail[]>(mockProducts)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const selectedReason = REASON_CODES.find(rc => rc.code === reasonCode)

  const handleAdjQtyChange = (id: string, value: number) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const direction = value > 0 ? 'IN' : value < 0 ? 'OUT' : ''
        return { ...p, adjQty: value, direction }
      }
      return p
    }))
  }

  const handleDirectionToggle = (id: string) => {
    setProducts(products.map(p => {
      if (p.id === id && p.adjQty !== 0) {
        const newDirection = p.direction === 'IN' ? 'OUT' : 'IN'
        return { ...p, direction: newDirection, adjQty: p.direction === 'IN' ? -Math.abs(p.adjQty) : Math.abs(p.adjQty) }
      }
      return p
    }))
  }

  const clearRow = (id: string) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        return { ...p, adjQty: 0, direction: '' }
      }
      return p
    }))
  }

  const totalAdjustments = products.filter(p => p.adjQty !== 0).length
  const netQuantityChange = products.reduce((sum, p) => sum + p.adjQty, 0)

  const handleSubmit = () => {
    if (totalAdjustments === 0) {
      alert('No adjustments to submit')
      return
    }
    setShowConfirmModal(true)
  }

  const confirmSubmit = () => {
    // Submit logic here
    console.log('Submitting batch adjustments:', {
      distributionCenter,
      warehouse,
      reasonCode,
      offsetCC: selectedReason?.offsetCC,
      authorization,
      documentNumber,
      poInvoice,
      vendorCustomer,
      adjustments: products.filter(p => p.adjQty !== 0),
    })
    setShowConfirmModal(false)
    // Reset adjustments after submit
    setProducts(products.map(p => ({ ...p, adjQty: 0, direction: '' })))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Batch Slot Adjust</h1>
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-mono rounded">
              BSA
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Multiple selection slot adjustments for batch inventory corrections</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Tran: <span className="font-mono text-purple-600">BSA</span></span>
          <span className="text-gray-500">Mode: <span className="font-mono">COMMAND</span></span>
        </div>
      </div>

      {/* Header Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Multiple Selection Slot Adjustments</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Distribution Center
            </label>
            <select
              value={distributionCenter}
              onChange={(e) => setDistributionCenter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {DISTRIBUTION_CENTERS.map(dc => (
                <option key={dc.id} value={dc.id}>{dc.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Warehouse
            </label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {WAREHOUSES.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason Code
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {REASON_CODES.map(rc => (
                <option key={rc.code} value={rc.code}>{rc.code} - {rc.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Offset CC
            </label>
            <input
              type="text"
              value={selectedReason?.offsetCC || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Authorization
            </label>
            <input
              type="text"
              value={authorization}
              onChange={(e) => setAuthorization(e.target.value)}
              placeholder="AUTH-000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Number
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="DOC-000000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Purchase Order/Invoice
            </label>
            <input
              type="text"
              value={poInvoice}
              onChange={(e) => setPOInvoice(e.target.value)}
              placeholder="PO-000000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vendor/Customer
            </label>
            <input
              type="text"
              value={vendorCustomer}
              onChange={(e) => setVendorCustomer(e.target.value)}
              placeholder="VND-000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Items to Adjust</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalAdjustments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${netQuantityChange >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {netQuantityChange >= 0 ? (
                <Plus className="w-5 h-5 text-green-600" />
              ) : (
                <Minus className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Net Qty Change</p>
              <p className={`text-xl font-bold ${netQuantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netQuantityChange >= 0 ? '+' : ''}{netQuantityChange}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product Details</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setProducts(products.map(p => ({ ...p, adjQty: 0, direction: '' })))}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear All
            </button>
            <button
              onClick={handleSubmit}
              disabled={totalAdjustments === 0}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Adjustments
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dtl</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sel Qty</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-32">Adj Qty</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-20">Dir</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-16">Clear</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${product.adjQty !== 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{product.location}</td>
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{product.product}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{product.productDetail}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white truncate max-w-48">{product.description}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white font-mono">{product.selQty}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={product.adjQty}
                      onChange={(e) => handleAdjQtyChange(product.id, parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1 text-center border rounded-lg font-mono text-sm
                        ${product.adjQty > 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                          product.adjQty < 0 ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                          'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.adjQty !== 0 && (
                      <button
                        onClick={() => handleDirectionToggle(product.id)}
                        className={`px-2 py-1 rounded text-xs font-medium
                          ${product.direction === 'IN' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
                      >
                        {product.direction}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.adjQty !== 0 && (
                      <button
                        onClick={() => clearRow(product.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Batch Adjustment</h3>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                You are about to submit <span className="font-semibold text-gray-900 dark:text-white">{totalAdjustments}</span> inventory adjustments.
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Reason Code:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{reasonCode}</span>
                  <span className="text-gray-500">Net Change:</span>
                  <span className={`font-mono ${netQuantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netQuantityChange >= 0 ? '+' : ''}{netQuantityChange} units
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
