import { useState } from 'react'
import {
  Truck,
  Plus,
  Search,
  FileText,
  Check,
  X,
  AlertTriangle,
  Package,
  Printer,
} from 'lucide-react'

// VRM - Vendor Return Management
// Transaction for generating vendor returns for multiple products with multiple pallets

interface VendorReturnLine {
  id: string
  product: string
  productDetail: string
  description: string
  palletId: string
  quantity: number
  reason: string
  lotNumber: string
  expirationDate: string
}

interface VendorReturn {
  id: string
  returnId: string
  vendorId: string
  vendorName: string
  authorizationId: string
  status: 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  createdDate: string
  createdBy: string
  approvedBy?: string
  approvedDate?: string
  totalItems: number
  totalPallets: number
  notes: string
  lines: VendorReturnLine[]
}

// Return reason codes (kept for future dropdown implementation)
export const RETURN_REASONS = [
  { code: 'DEF', label: 'Defective Product' },
  { code: 'DMG', label: 'Damaged in Transit' },
  { code: 'EXP', label: 'Expired/Near Expiry' },
  { code: 'WRG', label: 'Wrong Item Received' },
  { code: 'OVR', label: 'Overstock Return' },
  { code: 'RCL', label: 'Product Recall' },
  { code: 'QTY', label: 'Quantity Discrepancy' },
]

const DISTRIBUTION_CENTERS = [
  { id: '8', name: 'DC 8 - Atlanta' },
  { id: '1', name: 'DC 1 - Chicago' },
  { id: '2', name: 'DC 2 - Los Angeles' },
]

const WAREHOUSES = [
  { id: '1', name: 'Warehouse 1' },
  { id: '2', name: 'Warehouse 2' },
]

const mockVendors = [
  { id: 'VND-001', name: 'Acme Supplies Inc' },
  { id: 'VND-002', name: 'Global Parts Ltd' },
  { id: 'VND-003', name: 'Tech Components' },
  { id: 'VND-004', name: 'Prime Materials Co' },
]

const mockReturns: VendorReturn[] = [
  {
    id: '1',
    returnId: 'VRM-2024-0001',
    vendorId: 'VND-001',
    vendorName: 'Acme Supplies Inc',
    authorizationId: 'VRA-001',
    status: 'approved',
    createdDate: '2024-01-15',
    createdBy: 'John Smith',
    approvedBy: 'Sarah Johnson',
    approvedDate: '2024-01-16',
    totalItems: 3,
    totalPallets: 5,
    notes: 'Defective batch from shipment RCV-2024-0089',
    lines: [
      { id: '1', product: 'SKU-10001', productDetail: 'STD', description: 'Widget Alpha Pro', palletId: 'PLT-00125', quantity: 48, reason: 'DEF', lotNumber: 'LOT-A001', expirationDate: '2025-06-15' },
      { id: '2', product: 'SKU-10001', productDetail: 'STD', description: 'Widget Alpha Pro', palletId: 'PLT-00126', quantity: 48, reason: 'DEF', lotNumber: 'LOT-A001', expirationDate: '2025-06-15' },
      { id: '3', product: 'SKU-10002', productDetail: 'PRE', description: 'Gadget Beta Premium', palletId: 'PLT-00130', quantity: 24, reason: 'DMG', lotNumber: 'LOT-B002', expirationDate: '2025-03-20' },
    ],
  },
  {
    id: '2',
    returnId: 'VRM-2024-0002',
    vendorId: 'VND-003',
    vendorName: 'Tech Components',
    authorizationId: '',
    status: 'draft',
    createdDate: '2024-01-17',
    createdBy: 'Mike Williams',
    totalItems: 1,
    totalPallets: 2,
    notes: 'Near expiration product return',
    lines: [
      { id: '1', product: 'SKU-10005', productDetail: 'STD', description: 'Power Supply Unit', palletId: 'PLT-00145', quantity: 36, reason: 'EXP', lotNumber: 'LOT-E005', expirationDate: '2024-02-28' },
      { id: '2', product: 'SKU-10005', productDetail: 'STD', description: 'Power Supply Unit', palletId: 'PLT-00146', quantity: 36, reason: 'EXP', lotNumber: 'LOT-E005', expirationDate: '2024-02-28' },
    ],
  },
]

export default function SupplierReturns() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'query'>('list')
  const [returns] = useState<VendorReturn[]>(mockReturns)
  const [selectedReturn, setSelectedReturn] = useState<VendorReturn | null>(null)
  const [showQueryModal, setShowQueryModal] = useState(false)

  // Query criteria state
  const [queryCriteria, setQueryCriteria] = useState({
    distributionCenter: '8',
    warehouse: '1',
    vendorReturnId: '',
    vendorId: '',
    authorizationId: '',
    productId: '',
    productDetailId: '',
  })

  // Create form state
  const [createForm, setCreateForm] = useState({
    distributionCenter: '8',
    warehouse: '1',
    vendorId: '',
    authorizationId: '',
    notes: '',
    lines: [] as VendorReturnLine[],
  })

  const getStatusBadge = (status: VendorReturn['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    return styles[status]
  }

  const stats = {
    total: returns.length,
    draft: returns.filter(r => r.status === 'draft').length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Returns</h1>
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-mono rounded">
              VRM
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Vendor return management for product returns to suppliers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQueryModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Search className="w-4 h-4" />
            Query
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Return
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Returns</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Drafts</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.draft}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Return List' },
            { id: 'create', label: 'Create Return' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Return ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Authorization</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Items</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pallets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{ret.returnId}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{ret.vendorName}</p>
                        <p className="text-xs text-gray-500 font-mono">{ret.vendorId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {ret.authorizationId || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{ret.totalItems}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{ret.totalPallets}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white">{ret.createdBy}</p>
                        <p className="text-xs text-gray-500">{ret.createdDate}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(ret.status)}`}>
                        {ret.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </button>
                        {ret.status === 'draft' && (
                          <button className="text-green-600 hover:text-green-800 text-sm">
                            Submit
                          </button>
                        )}
                        {ret.status === 'pending' && (
                          <button className="text-purple-600 hover:text-purple-800 text-sm">
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Header Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Vendor Return</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">Tran: <span className="font-mono text-orange-600">VRM</span></span>
                <span className="text-gray-500">Mode: <span className="font-mono">ADD</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  DC ID
                </label>
                <select
                  value={createForm.distributionCenter}
                  onChange={(e) => setCreateForm({ ...createForm, distributionCenter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {DISTRIBUTION_CENTERS.map(dc => (
                    <option key={dc.id} value={dc.id}>{dc.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WHSE ID
                </label>
                <select
                  value={createForm.warehouse}
                  onChange={(e) => setCreateForm({ ...createForm, warehouse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {WAREHOUSES.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vendor ID
                </label>
                <select
                  value={createForm.vendorId}
                  onChange={(e) => setCreateForm({ ...createForm, vendorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select vendor...</option>
                  {mockVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.id} - {v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Authorization ID
                </label>
                <input
                  type="text"
                  value={createForm.authorizationId}
                  onChange={(e) => setCreateForm({ ...createForm, authorizationId: e.target.value })}
                  placeholder="VRA-000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Product Lines */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product Details</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="p-6">
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No products added yet</p>
                <p className="text-sm mt-1">Click "Add Product" to select products and pallets for return</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              rows={3}
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="Enter return notes..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <div className="flex gap-3 mt-4 justify-end">
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Save as Draft
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Query Criteria</h3>
                <div className="flex items-center gap-4 text-sm mt-1">
                  <span className="text-gray-500">Tran: <span className="font-mono text-orange-600">VRM</span></span>
                  <span className="text-gray-500">Mode: <span className="font-mono">SELECT</span></span>
                </div>
              </div>
              <button onClick={() => setShowQueryModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DC ID</label>
                  <select
                    value={queryCriteria.distributionCenter}
                    onChange={(e) => setQueryCriteria({ ...queryCriteria, distributionCenter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {DISTRIBUTION_CENTERS.map(dc => (
                      <option key={dc.id} value={dc.id}>{dc.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WHSE ID</label>
                  <select
                    value={queryCriteria.warehouse}
                    onChange={(e) => setQueryCriteria({ ...queryCriteria, warehouse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {WAREHOUSES.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Return ID</label>
                <input
                  type="text"
                  value={queryCriteria.vendorReturnId}
                  onChange={(e) => setQueryCriteria({ ...queryCriteria, vendorReturnId: e.target.value })}
                  placeholder="VRM-0000-0000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor ID</label>
                <select
                  value={queryCriteria.vendorId}
                  onChange={(e) => setQueryCriteria({ ...queryCriteria, vendorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Vendors</option>
                  {mockVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.id} - {v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authorization ID</label>
                <input
                  type="text"
                  value={queryCriteria.authorizationId}
                  onChange={(e) => setQueryCriteria({ ...queryCriteria, authorizationId: e.target.value })}
                  placeholder="VRA-000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product ID</label>
                <input
                  type="text"
                  value={queryCriteria.productId}
                  onChange={(e) => setQueryCriteria({ ...queryCriteria, productId: e.target.value })}
                  placeholder="SKU-00000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Detail ID</label>
                <input
                  type="text"
                  value={queryCriteria.productDetailId}
                  onChange={(e) => setQueryCriteria({ ...queryCriteria, productDetailId: e.target.value })}
                  placeholder="Enter product detail"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowQueryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowQueryModal(false)
                    // Apply query logic here
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedReturn.returnId}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(selectedReturn.status)}`}>
                    {selectedReturn.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created by {selectedReturn.createdBy} on {selectedReturn.createdDate}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Printer className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => setSelectedReturn(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Header Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase">Vendor</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReturn.vendorName}</p>
                <p className="text-xs text-gray-500 font-mono">{selectedReturn.vendorId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Authorization</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedReturn.authorizationId || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Items</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReturn.totalItems}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Pallets</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReturn.totalPallets}</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Return Lines</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pallet</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedReturn.lines.map(line => (
                      <tr key={line.id}>
                        <td className="px-3 py-2">
                          <p className="font-mono text-blue-600">{line.product}</p>
                          <p className="text-xs text-gray-500">{line.productDetail}</p>
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{line.description}</td>
                        <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-400">{line.palletId}</td>
                        <td className="px-3 py-2 text-center text-gray-900 dark:text-white">{line.quantity}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                            {line.reason}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-400">{line.lotNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {selectedReturn.notes && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {selectedReturn.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Close
              </button>
              {selectedReturn.status === 'draft' && (
                <>
                  <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    Edit
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Submit for Approval
                  </button>
                </>
              )}
              {selectedReturn.status === 'pending' && (
                <>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Reject
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Approve
                  </button>
                </>
              )}
              {selectedReturn.status === 'approved' && (
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Generate Work Units
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
