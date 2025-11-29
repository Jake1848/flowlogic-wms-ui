import { useState } from 'react'
import {
  ScanBarcode,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Truck,
  User,
} from 'lucide-react'

interface SerialNumber {
  id: string
  serialNumber: string
  sku: string
  productName: string
  status: 'in_stock' | 'sold' | 'rma' | 'scrapped' | 'in_transit' | 'reserved'
  location: string
  receivedDate: string
  lastScanned: string
  warranty: {
    startDate: string
    endDate: string
    status: 'active' | 'expired' | 'void'
  }
  history: {
    date: string
    action: string
    location: string
    user: string
  }[]
  customer?: string
  orderNumber?: string
}

const mockSerials: SerialNumber[] = [
  {
    id: 'SN001',
    serialNumber: 'SN-2024-A7B3C9D1',
    sku: 'LAPTOP-PRO-15',
    productName: 'ProBook Laptop 15"',
    status: 'sold',
    location: 'Shipped',
    receivedDate: '2024-01-15',
    lastScanned: '2024-01-20 14:32',
    warranty: { startDate: '2024-01-20', endDate: '2026-01-20', status: 'active' },
    customer: 'John Smith',
    orderNumber: 'ORD-2024-1234',
    history: [
      { date: '2024-01-15', action: 'Received', location: 'RCV-DOCK-01', user: 'Mike T.' },
      { date: '2024-01-16', action: 'Put Away', location: 'A-05-02', user: 'Sarah L.' },
      { date: '2024-01-20', action: 'Picked', location: 'A-05-02', user: 'Tom R.' },
      { date: '2024-01-20', action: 'Shipped', location: 'SHP-DOCK-03', user: 'Lisa M.' },
    ],
  },
  {
    id: 'SN002',
    serialNumber: 'SN-2024-E5F6G7H8',
    sku: 'MONITOR-27-4K',
    productName: '27" 4K Monitor',
    status: 'in_stock',
    location: 'B-12-03',
    receivedDate: '2024-01-18',
    lastScanned: '2024-01-22 09:15',
    warranty: { startDate: '', endDate: '', status: 'void' },
    history: [
      { date: '2024-01-18', action: 'Received', location: 'RCV-DOCK-02', user: 'Mike T.' },
      { date: '2024-01-19', action: 'Put Away', location: 'B-12-03', user: 'Sarah L.' },
      { date: '2024-01-22', action: 'Cycle Count', location: 'B-12-03', user: 'Tom R.' },
    ],
  },
  {
    id: 'SN003',
    serialNumber: 'SN-2024-I9J0K1L2',
    sku: 'KEYBOARD-MECH',
    productName: 'Mechanical Keyboard RGB',
    status: 'rma',
    location: 'RMA-HOLD-01',
    receivedDate: '2024-01-10',
    lastScanned: '2024-01-23 11:45',
    warranty: { startDate: '2024-01-12', endDate: '2025-01-12', status: 'active' },
    customer: 'Jane Doe',
    orderNumber: 'ORD-2024-0987',
    history: [
      { date: '2024-01-10', action: 'Received', location: 'RCV-DOCK-01', user: 'Mike T.' },
      { date: '2024-01-11', action: 'Put Away', location: 'C-08-01', user: 'Sarah L.' },
      { date: '2024-01-12', action: 'Shipped', location: 'SHP-DOCK-01', user: 'Lisa M.' },
      { date: '2024-01-22', action: 'RMA Received', location: 'RMA-DOCK-01', user: 'Tom R.' },
      { date: '2024-01-23', action: 'RMA Processing', location: 'RMA-HOLD-01', user: 'QC Team' },
    ],
  },
  {
    id: 'SN004',
    serialNumber: 'SN-2024-M3N4O5P6',
    sku: 'MOUSE-WIRELESS',
    productName: 'Wireless Gaming Mouse',
    status: 'reserved',
    location: 'D-02-05',
    receivedDate: '2024-01-20',
    lastScanned: '2024-01-23 08:30',
    warranty: { startDate: '', endDate: '', status: 'void' },
    orderNumber: 'ORD-2024-1567',
    history: [
      { date: '2024-01-20', action: 'Received', location: 'RCV-DOCK-03', user: 'Mike T.' },
      { date: '2024-01-21', action: 'Put Away', location: 'D-02-05', user: 'Sarah L.' },
      { date: '2024-01-23', action: 'Reserved', location: 'D-02-05', user: 'System' },
    ],
  },
  {
    id: 'SN005',
    serialNumber: 'SN-2024-Q7R8S9T0',
    sku: 'HEADSET-PRO',
    productName: 'Pro Audio Headset',
    status: 'in_transit',
    location: 'In Transit',
    receivedDate: '2024-01-05',
    lastScanned: '2024-01-22 16:00',
    warranty: { startDate: '2024-01-08', endDate: '2026-01-08', status: 'active' },
    customer: 'Tech Corp',
    orderNumber: 'ORD-2024-0765',
    history: [
      { date: '2024-01-05', action: 'Received', location: 'RCV-DOCK-01', user: 'Mike T.' },
      { date: '2024-01-06', action: 'Put Away', location: 'E-15-02', user: 'Sarah L.' },
      { date: '2024-01-22', action: 'Picked', location: 'E-15-02', user: 'Tom R.' },
      { date: '2024-01-22', action: 'Shipped', location: 'SHP-DOCK-02', user: 'Lisa M.' },
    ],
  },
  {
    id: 'SN006',
    serialNumber: 'SN-2023-U1V2W3X4',
    sku: 'WEBCAM-HD',
    productName: 'HD Webcam 1080p',
    status: 'scrapped',
    location: 'Disposed',
    receivedDate: '2023-06-15',
    lastScanned: '2024-01-15 10:00',
    warranty: { startDate: '2023-06-20', endDate: '2024-06-20', status: 'expired' },
    history: [
      { date: '2023-06-15', action: 'Received', location: 'RCV-DOCK-02', user: 'Mike T.' },
      { date: '2023-06-16', action: 'Put Away', location: 'F-03-01', user: 'Sarah L.' },
      { date: '2024-01-10', action: 'Damaged', location: 'F-03-01', user: 'QC Team' },
      { date: '2024-01-15', action: 'Scrapped', location: 'SCRAP-01', user: 'Manager' },
    ],
  },
]

export default function SerialTracking() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'lookup' | 'warranty'>('list')

  const getStatusBadge = (status: SerialNumber['status']) => {
    const styles = {
      in_stock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      rma: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      scrapped: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    }
    const labels = {
      in_stock: 'In Stock',
      sold: 'Sold',
      rma: 'RMA',
      scrapped: 'Scrapped',
      in_transit: 'In Transit',
      reserved: 'Reserved',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getWarrantyBadge = (status: 'active' | 'expired' | 'void') => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      void: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const filteredSerials = mockSerials.filter((serial) => {
    const matchesSearch =
      serial.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serial.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serial.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || serial.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: mockSerials.length,
    inStock: mockSerials.filter((s) => s.status === 'in_stock').length,
    sold: mockSerials.filter((s) => s.status === 'sold').length,
    rma: mockSerials.filter((s) => s.status === 'rma').length,
    activeWarranty: mockSerials.filter((s) => s.warranty.status === 'active').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Serial Number Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400">Track serialized inventory throughout its lifecycle</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Register Serial
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ScanBarcode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tracked</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Stock</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.inStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sold/Shipped</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.sold}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In RMA</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.rma}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Warranty</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeWarranty}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Serial List' },
            { id: 'lookup', label: 'Quick Lookup' },
            { id: 'warranty', label: 'Warranty Status' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'list' | 'lookup' | 'warranty')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by serial number, SKU, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="sold">Sold</option>
              <option value="rma">RMA</option>
              <option value="in_transit">In Transit</option>
              <option value="reserved">Reserved</option>
              <option value="scrapped">Scrapped</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Serial Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Warranty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Last Scanned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSerials.map((serial) => (
                  <tr key={serial.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {serial.serialNumber}
                      </div>
                      <div className="text-xs text-gray-500">{serial.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{serial.productName}</td>
                    <td className="px-6 py-4">{getStatusBadge(serial.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {serial.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getWarrantyBadge(serial.warranty.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{serial.lastScanned}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedSerial(serial)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'lookup' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
          <div className="max-w-xl mx-auto text-center">
            <ScanBarcode className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quick Serial Lookup</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Scan or enter a serial number to view its complete history
            </p>
            <div className="relative">
              <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Enter or scan serial number..."
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Look Up Serial
            </button>
          </div>
        </div>
      )}

      {activeTab === 'warranty' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Active Warranties</h3>
                <p className="text-2xl font-bold text-green-600">{stats.activeWarranty}</p>
              </div>
            </div>
            <div className="space-y-2">
              {mockSerials
                .filter((s) => s.warranty.status === 'active')
                .map((serial) => (
                  <div key={serial.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                    <div className="font-mono font-medium">{serial.serialNumber}</div>
                    <div className="text-gray-500 dark:text-gray-400">Expires: {serial.warranty.endDate}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Expiring Soon</h3>
                <p className="text-2xl font-bold text-yellow-600">2</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Warranties expiring in the next 30 days
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Expired</h3>
                <p className="text-2xl font-bold text-red-600">
                  {mockSerials.filter((s) => s.warranty.status === 'expired').length}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Units with expired warranty coverage
            </p>
          </div>
        </div>
      )}

      {/* Serial Detail Modal */}
      {selectedSerial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Serial Details</h2>
                  <p className="font-mono text-blue-600 dark:text-blue-400">{selectedSerial.serialNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedSerial(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Product</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSerial.productName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">SKU</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSerial.sku}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedSerial.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Location</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSerial.location}</p>
                </div>
              </div>

              {/* Warranty */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Warranty Information</h3>
                <div className="flex items-center gap-4">
                  {getWarrantyBadge(selectedSerial.warranty.status)}
                  {selectedSerial.warranty.startDate && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedSerial.warranty.startDate} - {selectedSerial.warranty.endDate}
                    </span>
                  )}
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Movement History</h3>
                <div className="space-y-3">
                  {selectedSerial.history.map((event, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="w-2 h-2 mt-2 bg-blue-600 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{event.action}</span>
                          <span className="text-sm text-gray-500">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {event.user}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
