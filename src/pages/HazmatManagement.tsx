import { useState } from 'react'
import {
  AlertTriangle,
  Shield,
  FileText,
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface HazmatItem {
  id: string
  sku: string
  productName: string
  unNumber: string
  hazardClass: string
  packingGroup: string
  quantity: number
  location: string
  certification: 'compliant' | 'pending' | 'expired'
  sdsExpiry: string
  specialHandling: string[]
}

const mockHazmatItems: HazmatItem[] = [
  {
    id: 'HZ001',
    sku: 'CHEM-001',
    productName: 'Industrial Cleaner Concentrate',
    unNumber: 'UN1760',
    hazardClass: '8 - Corrosive',
    packingGroup: 'III',
    quantity: 150,
    location: 'HZ-ZONE-A-01',
    certification: 'compliant',
    sdsExpiry: '2025-06-15',
    specialHandling: ['Corrosive', 'Ventilated Storage'],
  },
  {
    id: 'HZ002',
    sku: 'PAINT-005',
    productName: 'Aerosol Spray Paint',
    unNumber: 'UN1950',
    hazardClass: '2.1 - Flammable Gas',
    packingGroup: 'N/A',
    quantity: 480,
    location: 'HZ-ZONE-B-03',
    certification: 'compliant',
    sdsExpiry: '2024-12-01',
    specialHandling: ['Flammable', 'Pressure Container', 'Cool Storage'],
  },
  {
    id: 'HZ003',
    sku: 'BATT-LI-01',
    productName: 'Lithium Ion Battery Pack',
    unNumber: 'UN3481',
    hazardClass: '9 - Miscellaneous',
    packingGroup: 'II',
    quantity: 200,
    location: 'HZ-ZONE-C-02',
    certification: 'pending',
    sdsExpiry: '2024-03-15',
    specialHandling: ['Lithium Battery', 'Fire Risk', 'Segregated'],
  },
  {
    id: 'HZ004',
    sku: 'SOLV-012',
    productName: 'Acetone Solvent',
    unNumber: 'UN1090',
    hazardClass: '3 - Flammable Liquid',
    packingGroup: 'II',
    quantity: 75,
    location: 'HZ-ZONE-A-05',
    certification: 'expired',
    sdsExpiry: '2023-11-30',
    specialHandling: ['Flammable', 'Vapor Hazard', 'Grounded Container'],
  },
]

const hazardClasses = [
  { class: '1', name: 'Explosives', color: 'orange' },
  { class: '2', name: 'Gases', color: 'red' },
  { class: '3', name: 'Flammable Liquids', color: 'red' },
  { class: '4', name: 'Flammable Solids', color: 'red' },
  { class: '5', name: 'Oxidizers', color: 'yellow' },
  { class: '6', name: 'Toxic', color: 'white' },
  { class: '7', name: 'Radioactive', color: 'yellow' },
  { class: '8', name: 'Corrosive', color: 'white' },
  { class: '9', name: 'Miscellaneous', color: 'white' },
]

export default function HazmatManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<HazmatItem | null>(null)
  const [activeTab, setActiveTab] = useState<'inventory' | 'compliance' | 'shipping'>('inventory')

  const getCertBadge = (cert: HazmatItem['certification']) => {
    const styles = {
      compliant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[cert]}`}>
        {cert.charAt(0).toUpperCase() + cert.slice(1)}
      </span>
    )
  }

  const filteredItems = mockHazmatItems.filter((item) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalItems: mockHazmatItems.length,
    compliant: mockHazmatItems.filter(i => i.certification === 'compliant').length,
    pending: mockHazmatItems.filter(i => i.certification === 'pending').length,
    expired: mockHazmatItems.filter(i => i.certification === 'expired').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hazmat Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage hazardous materials compliance and storage</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <FileText className="w-4 h-4" />
            SDS Library
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            <Plus className="w-4 h-4" />
            Add Hazmat Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hazmat Items</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compliant</p>
              <p className="text-xl font-bold text-green-600">{stats.compliant}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expired SDS</p>
              <p className="text-xl font-bold text-red-600">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'inventory', label: 'Hazmat Inventory' },
            { id: 'compliance', label: 'Compliance' },
            { id: 'shipping', label: 'Shipping Requirements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'inventory' | 'compliance' | 'shipping')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'inventory' && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by SKU, product name, or UN number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    UN Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Hazard Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Location
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
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.sku}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">{item.unNumber}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded text-xs font-medium">
                        {item.hazardClass}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.location}</td>
                    <td className="px-6 py-4">{getCertBadge(item.certification)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedItem(item)}
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

      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hazard Classes in Storage</h3>
            <div className="space-y-3">
              {hazardClasses.slice(0, 6).map((hc) => (
                <div key={hc.class} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${
                      hc.color === 'red' ? 'bg-red-500 text-white' :
                      hc.color === 'orange' ? 'bg-orange-500 text-white' :
                      hc.color === 'yellow' ? 'bg-yellow-400 text-black' :
                      'bg-white border border-gray-300 text-black'
                    }`}>
                      {hc.class}
                    </div>
                    <span className="text-gray-900 dark:text-white">{hc.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {mockHazmatItems.filter(i => i.hazardClass.startsWith(hc.class)).length} items
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expiring Certifications</h3>
            <div className="space-y-3">
              {mockHazmatItems.filter(i => i.certification !== 'compliant').map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{item.productName}</span>
                    {getCertBadge(item.certification)}
                  </div>
                  <p className="text-sm text-gray-500">SDS Expiry: {item.sdsExpiry}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">DOT Shipping Requirements</h3>
          <div className="space-y-4">
            {mockHazmatItems.map((item) => (
              <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.productName}</h4>
                  <span className="font-mono text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-2 py-1 rounded">
                    {item.unNumber}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Hazard Class</p>
                    <p className="font-medium text-gray-900 dark:text-white">{item.hazardClass}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Packing Group</p>
                    <p className="font-medium text-gray-900 dark:text-white">{item.packingGroup}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Special Handling</p>
                    <div className="flex flex-wrap gap-1">
                      {item.specialHandling.map((h) => (
                        <span key={h} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Carrier Restrictions</p>
                    <p className="font-medium text-gray-900 dark:text-white">Ground Only</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hazmat Details</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Product</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedItem.productName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">SKU</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedItem.sku}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">UN Number</label>
                  <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedItem.unNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">SDS Expiry</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedItem.sdsExpiry}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Special Handling</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedItem.specialHandling.map((h) => (
                    <span key={h} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {h}
                    </span>
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
