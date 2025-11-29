import { useState } from 'react'
import {
  Search,
  Calendar,
  Filter,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Plus,
  Minus,
} from 'lucide-react'

// AHB - Adjustment History Browser
// Browse screen for viewing inventory adjustments with selection criteria

interface AdjustmentRecord {
  id: string
  adjustmentNumber: string
  date: string
  time: string
  distributionCenter: string
  warehouse: string
  location: string
  product: string
  productDescription: string
  vendor: string
  reasonCode: string
  reasonDescription: string
  adjustmentQty: number
  beforeQty: number
  afterQty: number
  userId: string
  userName: string
  documentNumber: string
}

const DISTRIBUTION_CENTERS = [
  { id: '8', name: 'DC 8 - Atlanta' },
  { id: '1', name: 'DC 1 - Chicago' },
  { id: '2', name: 'DC 2 - Los Angeles' },
]

const WAREHOUSES = [
  { id: '1', name: 'Warehouse 1' },
  { id: '2', name: 'Warehouse 2' },
]

const mockAdjustments: AdjustmentRecord[] = [
  { id: '1', adjustmentNumber: 'ADJ-2024-0001', date: '2024-01-15', time: '10:30:00', distributionCenter: '8', warehouse: '1', location: 'A-01-01-A', product: 'SKU-10001', productDescription: 'Widget Alpha Pro', vendor: 'VND-001', reasonCode: 'DMG', reasonDescription: 'Damaged', adjustmentQty: -5, beforeQty: 100, afterQty: 95, userId: 'USR001', userName: 'John Smith', documentNumber: 'DOC-ADJ-0001' },
  { id: '2', adjustmentNumber: 'ADJ-2024-0002', date: '2024-01-15', time: '14:20:00', distributionCenter: '8', warehouse: '1', location: 'B-02-05-C', product: 'SKU-10003', productDescription: 'Connector Assembly Kit', vendor: 'VND-003', reasonCode: 'FND', reasonDescription: 'Found', adjustmentQty: 12, beforeQty: 45, afterQty: 57, userId: 'USR002', userName: 'Mike Williams', documentNumber: 'DOC-ADJ-0002' },
  { id: '3', adjustmentNumber: 'ADJ-2024-0003', date: '2024-01-14', time: '16:45:00', distributionCenter: '8', warehouse: '1', location: 'C-03-02-B', product: 'SKU-10005', productDescription: 'Premium Gift Box Set', vendor: 'VND-002', reasonCode: 'CYC', reasonDescription: 'Cycle Count', adjustmentQty: -3, beforeQty: 28, afterQty: 25, userId: 'USR003', userName: 'Emily Davis', documentNumber: 'DOC-ADJ-0003' },
  { id: '4', adjustmentNumber: 'ADJ-2024-0004', date: '2024-01-14', time: '09:15:00', distributionCenter: '8', warehouse: '1', location: 'A-02-03-A', product: 'SKU-10002', productDescription: 'Gadget Beta Standard', vendor: 'VND-001', reasonCode: 'EXP', reasonDescription: 'Expired', adjustmentQty: -8, beforeQty: 65, afterQty: 57, userId: 'USR004', userName: 'James Brown', documentNumber: 'DOC-ADJ-0004' },
  { id: '5', adjustmentNumber: 'ADJ-2024-0005', date: '2024-01-13', time: '11:00:00', distributionCenter: '8', warehouse: '1', location: 'D-01-08-C', product: 'SKU-10007', productDescription: 'Bulk Fastener Pack', vendor: 'VND-004', reasonCode: 'RCV', reasonDescription: 'Receiving Error', adjustmentQty: 50, beforeQty: 200, afterQty: 250, userId: 'USR005', userName: 'Lisa Chen', documentNumber: 'DOC-ADJ-0005' },
  { id: '6', adjustmentNumber: 'ADJ-2024-0006', date: '2024-01-13', time: '08:30:00', distributionCenter: '8', warehouse: '1', location: 'B-04-01-A', product: 'SKU-10008', productDescription: 'Industrial Lubricant', vendor: 'VND-002', reasonCode: 'LST', reasonDescription: 'Lost', adjustmentQty: -2, beforeQty: 18, afterQty: 16, userId: 'USR001', userName: 'John Smith', documentNumber: 'DOC-ADJ-0006' },
  { id: '7', adjustmentNumber: 'ADJ-2024-0007', date: '2024-01-12', time: '15:45:00', distributionCenter: '8', warehouse: '1', location: 'A-05-02-B', product: 'SKU-10009', productDescription: 'Safety Equipment Set', vendor: 'VND-005', reasonCode: 'QC', reasonDescription: 'QC Release', adjustmentQty: 25, beforeQty: 0, afterQty: 25, userId: 'USR002', userName: 'Mike Williams', documentNumber: 'DOC-ADJ-0007' },
  { id: '8', adjustmentNumber: 'ADJ-2024-0008', date: '2024-01-12', time: '10:20:00', distributionCenter: '8', warehouse: '1', location: 'C-02-04-C', product: 'SKU-10010', productDescription: 'Electronic Component', vendor: 'VND-003', reasonCode: 'IC', reasonDescription: 'Inventory Correction', adjustmentQty: 5, beforeQty: 72, afterQty: 77, userId: 'USR003', userName: 'Emily Davis', documentNumber: 'DOC-ADJ-0008' },
]

type SearchType = 'location' | 'date' | 'product' | 'vendor'

export default function AdjustmentHistoryBrowser() {
  const [showCriteria, setShowCriteria] = useState(true)
  const [searchResults, setSearchResults] = useState<AdjustmentRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<AdjustmentRecord | null>(null)

  // Search criteria - mutually exclusive
  const [searchType, setSearchType] = useState<SearchType>('location')
  const [criteria, setCriteria] = useState({
    distributionCenter: '8',
    warehouse: '1',
    location: '',
    startDate: '',
    product: '',
    vendor: '',
  })

  const handleSearch = () => {
    // Filter based on selected criteria type (mutually exclusive)
    let results = mockAdjustments.filter(adj =>
      adj.distributionCenter === criteria.distributionCenter &&
      adj.warehouse === criteria.warehouse
    )

    switch (searchType) {
      case 'location':
        if (criteria.location) {
          results = results.filter(adj =>
            adj.location.toLowerCase().includes(criteria.location.toLowerCase())
          )
        }
        break
      case 'date':
        if (criteria.startDate) {
          results = results.filter(adj => adj.date >= criteria.startDate)
        }
        break
      case 'product':
        if (criteria.product) {
          results = results.filter(adj =>
            adj.product.toLowerCase().includes(criteria.product.toLowerCase())
          )
        }
        break
      case 'vendor':
        if (criteria.vendor) {
          results = results.filter(adj =>
            adj.vendor.toLowerCase().includes(criteria.vendor.toLowerCase())
          )
        }
        break
    }

    setSearchResults(results)
    setShowCriteria(false)
  }

  const clearSearch = () => {
    setCriteria({
      distributionCenter: '8',
      warehouse: '1',
      location: '',
      startDate: '',
      product: '',
      vendor: '',
    })
    setSearchResults([])
    setShowCriteria(true)
  }

  const totalAdjustments = searchResults.length
  const netChange = searchResults.reduce((sum, adj) => sum + adj.adjustmentQty, 0)
  const increases = searchResults.filter(adj => adj.adjustmentQty > 0).length
  const decreases = searchResults.filter(adj => adj.adjustmentQty < 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Adjustment History Browser</h1>
            <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-xs font-mono rounded">
              AHB
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Browse and search inventory adjustment records</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Tran: <span className="font-mono text-teal-600">AHB</span></span>
          <span className="text-gray-500">Mode: <span className="font-mono">{showCriteria ? 'SELECT' : 'BROWSE'}</span></span>
        </div>
      </div>

      {/* Selection Criteria Panel */}
      {showCriteria && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Adjustment Browse Selection Criteria</h3>

          {/* DC and Warehouse - Always required */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Distribution Center
              </label>
              <select
                value={criteria.distributionCenter}
                onChange={(e) => setCriteria({ ...criteria, distributionCenter: e.target.value })}
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
                value={criteria.warehouse}
                onChange={(e) => setCriteria({ ...criteria, warehouse: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {WAREHOUSES.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.id} - {wh.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mutually Exclusive Search Criteria */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Select ONE search criteria type (mutually exclusive):
            </p>

            <div className="space-y-4">
              {/* Location Search */}
              <div className={`p-4 rounded-lg border-2 transition-colors ${searchType === 'location' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    checked={searchType === 'location'}
                    onChange={() => setSearchType('location')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Search by Location</span>
                </label>
                {searchType === 'location' && (
                  <input
                    type="text"
                    value={criteria.location}
                    onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
                    placeholder="Enter location (e.g., A-01-01)"
                    className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                )}
              </div>

              {/* Date Search */}
              <div className={`p-4 rounded-lg border-2 transition-colors ${searchType === 'date' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    checked={searchType === 'date'}
                    onChange={() => setSearchType('date')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Search by Date</span>
                </label>
                {searchType === 'date' && (
                  <input
                    type="date"
                    value={criteria.startDate}
                    onChange={(e) => setCriteria({ ...criteria, startDate: e.target.value })}
                    className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                )}
              </div>

              {/* Product Search */}
              <div className={`p-4 rounded-lg border-2 transition-colors ${searchType === 'product' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    checked={searchType === 'product'}
                    onChange={() => setSearchType('product')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Search by Product</span>
                </label>
                {searchType === 'product' && (
                  <input
                    type="text"
                    value={criteria.product}
                    onChange={(e) => setCriteria({ ...criteria, product: e.target.value })}
                    placeholder="Enter product SKU"
                    className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                )}
              </div>

              {/* Vendor Search */}
              <div className={`p-4 rounded-lg border-2 transition-colors ${searchType === 'vendor' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    checked={searchType === 'vendor'}
                    onChange={() => setSearchType('vendor')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Search by Vendor</span>
                </label>
                {searchType === 'vendor' && (
                  <input
                    type="text"
                    value={criteria.vendor}
                    onChange={(e) => setCriteria({ ...criteria, vendor: e.target.value })}
                    placeholder="Enter vendor ID"
                    className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={clearSearch}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear
            </button>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {!showCriteria && searchResults.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <ArrowUpDown className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{totalAdjustments}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Increases</p>
                  <p className="text-xl font-bold text-green-600">{increases}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Minus className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Decreases</p>
                  <p className="text-xl font-bold text-red-600">{decreases}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${netChange >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <ArrowUpDown className={`w-5 h-5 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Change</p>
                  <p className={`text-xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netChange >= 0 ? '+' : ''}{netChange}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowCriteria(true)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  <Filter className="w-4 h-4" />
                  Modify Search
                </button>
                <span className="text-sm text-gray-500">
                  Showing {searchResults.length} records
                </span>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Adj #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reason</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Before</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Adj Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">After</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-4 py-3 text-sm">
                        <p className="text-gray-900 dark:text-white">{record.date}</p>
                        <p className="text-xs text-gray-500">{record.time}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{record.adjustmentNumber}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{record.location}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono text-gray-900 dark:text-white">{record.product}</p>
                        <p className="text-xs text-gray-500 truncate max-w-32">{record.productDescription}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                          {record.reasonCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{record.beforeQty}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${record.adjustmentQty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {record.adjustmentQty > 0 ? '+' : ''}{record.adjustmentQty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white font-medium">{record.afterQty}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{record.userName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Page 1 of 1
              </span>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" disabled>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Results */}
      {!showCriteria && searchResults.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Results Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No adjustments match your search criteria.
          </p>
          <button
            onClick={() => setShowCriteria(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Modify Search
          </button>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedRecord.adjustmentNumber}
              </h3>
              <button onClick={() => setSelectedRecord(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">Date/Time</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedRecord.date} {selectedRecord.time}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">DC/Warehouse</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedRecord.distributionCenter}/{selectedRecord.warehouse}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Location</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedRecord.location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Document #</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedRecord.documentNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase">Product</p>
                <p className="text-sm font-mono text-blue-600">{selectedRecord.product}</p>
                <p className="text-xs text-gray-500">{selectedRecord.productDescription}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Vendor</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedRecord.vendor}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Reason</p>
                <p className="text-lg font-mono text-gray-900 dark:text-white">{selectedRecord.reasonCode}</p>
                <p className="text-xs text-gray-500">{selectedRecord.reasonDescription}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Before</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedRecord.beforeQty}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Adjustment</p>
                <p className={`text-xl font-bold ${selectedRecord.adjustmentQty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedRecord.adjustmentQty > 0 ? '+' : ''}{selectedRecord.adjustmentQty}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">After</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedRecord.afterQty}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase mb-1">Adjusted By</p>
              <p className="text-sm text-gray-900 dark:text-white">{selectedRecord.userName} ({selectedRecord.userId})</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
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
