import { useState } from 'react'
import {
  ArrowUpDown,
  Plus,
  Minus,
  Search,
  Clock,
  AlertTriangle,
  FileText,
  Package,
  MapPin,
  X,
  Check,
  ChevronDown,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// SIA - Single Item Adjust
// Transaction for quantity-controlled inventory adjustments for a single product in a location

interface AdjustmentDetail {
  id: string
  licensePlate: string
  codeDate: string
  lot: string
  quantity: number
  adjustQty: number
  direction: 'IN' | 'OUT'
  position: string
}

interface Adjustment {
  id: string
  adjustmentNumber: string
  distributionCenter: string
  warehouse: string
  reasonCode: string
  location: string
  licensePlate: string
  product: string
  productDetail: string
  size: string
  pack: string
  poInvoice: string
  receiptId: string
  documentNumber: string
  vendorCustomer: string
  authorization: string
  netAdjustment: number
  netWeightAdjustment: number
  totalQuantity: number
  totalWeight: number
  bonusProduct: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdBy: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  notes: string
  details: AdjustmentDetail[]
}

const REASON_CODES = [
  { code: 'DMG', label: 'Damaged', type: 'decrease' },
  { code: 'EXP', label: 'Expired', type: 'decrease' },
  { code: 'FND', label: 'Found Inventory', type: 'increase' },
  { code: 'LST', label: 'Lost/Missing', type: 'decrease' },
  { code: 'CYC', label: 'Cycle Count Variance', type: 'increase' },
  { code: 'RCV', label: 'Receiving Error', type: 'increase' },
  { code: 'SHP', label: 'Shipping Error', type: 'decrease' },
  { code: 'RET', label: 'Return to Stock', type: 'increase' },
  { code: 'SCR', label: 'Scrap', type: 'decrease' },
  { code: 'QC', label: 'QC Hold Release', type: 'increase' },
  { code: 'IC', label: 'Inventory Correction', type: 'increase' },
  { code: 'TRF', label: 'Transfer Adjustment', type: 'increase' },
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

const mockAdjustments: Adjustment[] = [
  {
    id: '1',
    adjustmentNumber: 'SIA-2024-0125',
    distributionCenter: '8',
    warehouse: '1',
    reasonCode: 'DMG',
    location: 'A-01-01-A',
    licensePlate: 'LP-00125847',
    product: 'SKU-10001',
    productDetail: 'Widget Alpha Pro',
    size: 'LG',
    pack: '12/CS',
    poInvoice: 'PO-2024-0589',
    receiptId: 'RCV-2024-1125',
    documentNumber: 'DOC-ADJ-0125',
    vendorCustomer: 'VND-001',
    authorization: 'AUTH-001',
    netAdjustment: -5,
    netWeightAdjustment: -12.5,
    totalQuantity: 95,
    totalWeight: 237.5,
    bonusProduct: '',
    status: 'completed',
    createdBy: 'John Smith',
    createdAt: '2024-01-15 10:30',
    approvedBy: 'Sarah Johnson',
    approvedAt: '2024-01-15 11:15',
    notes: 'Damaged during putaway - forklift incident',
    details: [
      { id: '1', licensePlate: 'LP-00125847', codeDate: '2024-06-15', lot: 'LOT-A001', quantity: 100, adjustQty: -5, direction: 'OUT', position: '1' },
    ],
  },
  {
    id: '2',
    adjustmentNumber: 'SIA-2024-0126',
    distributionCenter: '8',
    warehouse: '1',
    reasonCode: 'FND',
    location: 'B-02-05-C',
    licensePlate: 'LP-00126584',
    product: 'SKU-10003',
    productDetail: 'Connector Assembly Kit',
    size: 'STD',
    pack: '24/CS',
    poInvoice: '',
    receiptId: '',
    documentNumber: 'DOC-ADJ-0126',
    vendorCustomer: '',
    authorization: '',
    netAdjustment: 12,
    netWeightAdjustment: 6.0,
    totalQuantity: 57,
    totalWeight: 28.5,
    bonusProduct: '',
    status: 'pending',
    createdBy: 'Mike Williams',
    createdAt: '2024-01-15 14:20',
    notes: 'Found during inventory cleanup behind rack',
    details: [
      { id: '1', licensePlate: 'LP-00126584', codeDate: '2024-08-20', lot: 'LOT-B002', quantity: 45, adjustQty: 12, direction: 'IN', position: '1' },
    ],
  },
]

const adjustmentTrends = [
  { day: 'Mon', increases: 12, decreases: 8 },
  { day: 'Tue', increases: 8, decreases: 15 },
  { day: 'Wed', increases: 15, decreases: 10 },
  { day: 'Thu', increases: 6, decreases: 12 },
  { day: 'Fri', increases: 10, decreases: 7 },
]

export default function InventoryAdjustments() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'analytics'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showSelectCriteria, setShowSelectCriteria] = useState(false)
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null)

  // Create form state
  const [createForm, setCreateForm] = useState({
    distributionCenter: '8',
    warehouse: '1',
    reasonCode: '',
    location: '',
    licensePlate: '',
    product: '',
    productDetail: '',
    size: '',
    pack: '',
    poInvoice: '',
    receiptId: '',
    documentNumber: '',
    vendorCustomer: '',
    authorization: '',
    netAdjustment: 0,
    netWeightAdjustment: 0,
    bonusProduct: '',
    notes: '',
  })

  // Select criteria state
  const [selectCriteria, setSelectCriteria] = useState({
    distributionCenter: '8',
    warehouse: '1',
    location: '',
    licensePlate: '',
    product: '',
    productDetail: '',
  })

  const getStatusBadge = (status: Adjustment['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    }
    return styles[status]
  }

  const filteredAdjustments = mockAdjustments.filter(adj => {
    const matchesSearch = adj.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.adjustmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || adj.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const stats = {
    pending: mockAdjustments.filter(a => a.status === 'pending').length,
    totalAdjustments: mockAdjustments.length,
    totalValue: mockAdjustments.reduce((sum, a) => sum + Math.abs(a.netAdjustment) * 29.99, 0),
    netChange: mockAdjustments.reduce((sum, a) => sum + a.netAdjustment, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Single Item Adjust</h1>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-mono rounded">
              SIA
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Quantity-controlled inventory adjustments for single products</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSelectCriteria(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Search className="w-4 h-4" />
            Select Criteria
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowUpDown className="w-4 h-4" />
            New Adjustment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Adjustments</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalAdjustments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ArrowUpDown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Net Unit Change</p>
              <p className={`text-xl font-bold ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.netChange >= 0 ? '+' : ''}{stats.netChange}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value Impact</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Adjustment List' },
            { id: 'create', label: 'Create Adjustment' },
            { id: 'analytics', label: 'Analytics' },
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
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by adjustment #, SKU, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Completed</option>
              <option>Rejected</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Adjustment #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">DC/WH</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Net Adj</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAdjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{adj.adjustmentNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {adj.distributionCenter}/{adj.warehouse}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{adj.location}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-mono text-gray-900 dark:text-white">{adj.product}</p>
                          <p className="text-xs text-gray-500 truncate max-w-32">{adj.productDetail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                          {adj.reasonCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {adj.netAdjustment > 0 ? (
                            <Plus className="w-4 h-4 text-green-600" />
                          ) : (
                            <Minus className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${adj.netAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(adj.netAdjustment)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{adj.totalQuantity}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{adj.createdBy}</p>
                          <p className="text-xs text-gray-500">{adj.createdAt}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(adj.status)}`}>
                          {adj.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedAdjustment(adj)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
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

      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Header Section - DC/Warehouse/Reason */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Single Inventory Adjustment</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">Tran: <span className="font-mono text-blue-600">SIA</span></span>
                <span className="text-gray-500">Mode: <span className="font-mono">SELECT</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Distribution Center
                </label>
                <select
                  value={createForm.distributionCenter}
                  onChange={(e) => setCreateForm({ ...createForm, distributionCenter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {DISTRIBUTION_CENTERS.map(dc => (
                    <option key={dc.id} value={dc.id}>{dc.id} - {dc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse
                </label>
                <select
                  value={createForm.warehouse}
                  onChange={(e) => setCreateForm({ ...createForm, warehouse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {WAREHOUSES.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.id} - {wh.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason Code
                </label>
                <select
                  value={createForm.reasonCode}
                  onChange={(e) => setCreateForm({ ...createForm, reasonCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select reason...</option>
                  {REASON_CODES.map(rc => (
                    <option key={rc.code} value={rc.code}>{rc.code} - {rc.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  value={createForm.licensePlate}
                  onChange={(e) => setCreateForm({ ...createForm, licensePlate: e.target.value })}
                  placeholder="LP-00000000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Item Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Location & Product Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                      placeholder="A-01-01-A"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={createForm.product}
                      onChange={(e) => setCreateForm({ ...createForm, product: e.target.value })}
                      placeholder="SKU-00000"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Detail
                  </label>
                  <select
                    value={createForm.productDetail}
                    onChange={(e) => setCreateForm({ ...createForm, productDetail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="STD">Standard</option>
                    <option value="PRE">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={createForm.size}
                    onChange={(e) => setCreateForm({ ...createForm, size: e.target.value })}
                    placeholder="Size"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pack
                  </label>
                  <input
                    type="text"
                    value={createForm.pack}
                    onChange={(e) => setCreateForm({ ...createForm, pack: e.target.value })}
                    placeholder="12/CS"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PO/Invoice
                  </label>
                  <input
                    type="text"
                    value={createForm.poInvoice}
                    onChange={(e) => setCreateForm({ ...createForm, poInvoice: e.target.value })}
                    placeholder="PO-0000000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vend/Cust
                  </label>
                  <input
                    type="text"
                    value={createForm.vendorCustomer}
                    onChange={(e) => setCreateForm({ ...createForm, vendorCustomer: e.target.value })}
                    placeholder="VND-000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Receipt I.D.
                  </label>
                  <input
                    type="text"
                    value={createForm.receiptId}
                    onChange={(e) => setCreateForm({ ...createForm, receiptId: e.target.value })}
                    placeholder="RCV-0000000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Number
                  </label>
                  <input
                    type="text"
                    value={createForm.documentNumber}
                    onChange={(e) => setCreateForm({ ...createForm, documentNumber: e.target.value })}
                    placeholder="DOC-ADJ-0000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bonus Product
                </label>
                <input
                  type="text"
                  value={createForm.bonusProduct}
                  onChange={(e) => setCreateForm({ ...createForm, bonusProduct: e.target.value })}
                  placeholder="Bonus product SKU (if applicable)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Right Column - Adjustment Values */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Authorization
                </label>
                <input
                  type="text"
                  value={createForm.authorization}
                  onChange={(e) => setCreateForm({ ...createForm, authorization: e.target.value })}
                  placeholder="AUTH-000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Net Adjustment
                  </label>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={createForm.netAdjustment}
                      onChange={(e) => setCreateForm({ ...createForm, netAdjustment: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-mono"
                    />
                    <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Net Weight Adjustment
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.netWeightAdjustment}
                    onChange={(e) => setCreateForm({ ...createForm, netWeightAdjustment: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">--</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Weight</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">-- lbs</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Enter adjustment notes..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Submit Adjustment
              </button>
            </div>
          </div>

          {/* Inventory Adjustment Details Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Adjustment Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">License</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lot</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Adjust</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dir</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No inventory details loaded. Enter location and product above to view available inventory.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Adjustment Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adjustmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="increases" fill="#22c55e" name="Increases" />
                  <Bar dataKey="decreases" fill="#ef4444" name="Decreases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Reason Codes</h3>
            <div className="space-y-3">
              {REASON_CODES.slice(0, 5).map((rc, idx) => (
                <div key={rc.code} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{rc.code}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{rc.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{15 - idx * 2}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Criteria Modal */}
      {showSelectCriteria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Criteria</h3>
              <button onClick={() => setShowSelectCriteria(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DC</label>
                  <select
                    value={selectCriteria.distributionCenter}
                    onChange={(e) => setSelectCriteria({ ...selectCriteria, distributionCenter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {DISTRIBUTION_CENTERS.map(dc => (
                      <option key={dc.id} value={dc.id}>{dc.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warehouse</label>
                  <select
                    value={selectCriteria.warehouse}
                    onChange={(e) => setSelectCriteria({ ...selectCriteria, warehouse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {WAREHOUSES.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={selectCriteria.location}
                  onChange={(e) => setSelectCriteria({ ...selectCriteria, location: e.target.value })}
                  placeholder="Enter location"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Plate</label>
                <input
                  type="text"
                  value={selectCriteria.licensePlate}
                  onChange={(e) => setSelectCriteria({ ...selectCriteria, licensePlate: e.target.value })}
                  placeholder="Enter license plate"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
                <input
                  type="text"
                  value={selectCriteria.product}
                  onChange={(e) => setSelectCriteria({ ...selectCriteria, product: e.target.value })}
                  placeholder="Enter product SKU"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSelectCriteria(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSelectCriteria(false)
                    // Apply filter logic here
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

      {/* Adjustment Detail Modal */}
      {selectedAdjustment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-3xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedAdjustment.adjustmentNumber}
                </h3>
                <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(selectedAdjustment.status)}`}>
                  {selectedAdjustment.status}
                </span>
              </div>
              <button onClick={() => setSelectedAdjustment(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">DC/Warehouse</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {selectedAdjustment.distributionCenter}/{selectedAdjustment.warehouse}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Location</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedAdjustment.location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">License Plate</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedAdjustment.licensePlate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Reason Code</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedAdjustment.reasonCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">Product</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedAdjustment.product}</p>
                <p className="text-xs text-gray-500">{selectedAdjustment.productDetail}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Size/Pack</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedAdjustment.size} / {selectedAdjustment.pack}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">PO/Invoice</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {selectedAdjustment.poInvoice || '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Net Adjustment</p>
                <p className={`text-xl font-bold ${selectedAdjustment.netAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedAdjustment.netAdjustment > 0 ? '+' : ''}{selectedAdjustment.netAdjustment}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Net Weight Adj</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedAdjustment.netWeightAdjustment} lbs
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Total Quantity</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedAdjustment.totalQuantity}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Total Weight</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedAdjustment.totalWeight} lbs</p>
              </div>
            </div>

            {selectedAdjustment.details.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjustment Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adjust</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedAdjustment.details.map(detail => (
                        <tr key={detail.id}>
                          <td className="px-3 py-2 font-mono">{detail.licensePlate}</td>
                          <td className="px-3 py-2">{detail.codeDate}</td>
                          <td className="px-3 py-2 font-mono">{detail.lot}</td>
                          <td className="px-3 py-2">{detail.quantity}</td>
                          <td className="px-3 py-2">
                            <span className={detail.adjustQty > 0 ? 'text-green-600' : 'text-red-600'}>
                              {detail.adjustQty > 0 ? '+' : ''}{detail.adjustQty}
                            </span>
                          </td>
                          <td className="px-3 py-2">{detail.direction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedAdjustment.notes && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {selectedAdjustment.notes}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedAdjustment(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Close
              </button>
              {selectedAdjustment.status === 'pending' && (
                <>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Reject
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
