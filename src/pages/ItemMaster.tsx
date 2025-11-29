import { useState } from 'react'
import {
  Package,
  Search,
  Plus,
  Edit,
  Copy,
  Archive,
  Tag,
  Box,
  Layers,
} from 'lucide-react'

interface Item {
  id: string
  sku: string
  upc: string
  description: string
  category: string
  subcategory: string
  status: 'active' | 'inactive' | 'discontinued' | 'pending'
  unitOfMeasure: string
  length: number
  width: number
  height: number
  weight: number
  caseQty: number
  palletQty: number
  value: number
  velocity: 'A' | 'B' | 'C' | 'D'
  lotTracked: boolean
  serialTracked: boolean
  hazmat: boolean
}

const mockItems: Item[] = [
  { id: '1', sku: 'SKU-10001', upc: '012345678901', description: 'Widget Alpha Pro', category: 'Electronics', subcategory: 'Widgets', status: 'active', unitOfMeasure: 'EA', length: 6, width: 4, height: 2, weight: 0.5, caseQty: 24, palletQty: 48, value: 29.99, velocity: 'A', lotTracked: false, serialTracked: true, hazmat: false },
  { id: '2', sku: 'SKU-10002', upc: '012345678902', description: 'Gadget Beta Standard', category: 'Electronics', subcategory: 'Gadgets', status: 'active', unitOfMeasure: 'EA', length: 8, width: 6, height: 4, weight: 1.2, caseQty: 12, palletQty: 36, value: 49.99, velocity: 'A', lotTracked: true, serialTracked: false, hazmat: false },
  { id: '3', sku: 'SKU-10003', upc: '012345678903', description: 'Connector Assembly Kit', category: 'Components', subcategory: 'Connectors', status: 'active', unitOfMeasure: 'KIT', length: 4, width: 3, height: 1, weight: 0.3, caseQty: 50, palletQty: 100, value: 12.50, velocity: 'B', lotTracked: true, serialTracked: false, hazmat: false },
  { id: '4', sku: 'SKU-10004', upc: '012345678904', description: 'Industrial Cleaner 1L', category: 'Chemicals', subcategory: 'Cleaners', status: 'active', unitOfMeasure: 'EA', length: 4, width: 4, height: 10, weight: 2.5, caseQty: 12, palletQty: 48, value: 18.75, velocity: 'C', lotTracked: true, serialTracked: false, hazmat: true },
  { id: '5', sku: 'SKU-10005', upc: '012345678905', description: 'Premium Gift Box Set', category: 'Packaging', subcategory: 'Gift', status: 'active', unitOfMeasure: 'SET', length: 12, width: 10, height: 6, weight: 1.8, caseQty: 6, palletQty: 24, value: 35.00, velocity: 'B', lotTracked: false, serialTracked: false, hazmat: false },
  { id: '6', sku: 'SKU-10006', upc: '012345678906', description: 'Legacy Controller Unit', category: 'Electronics', subcategory: 'Controllers', status: 'discontinued', unitOfMeasure: 'EA', length: 10, width: 8, height: 4, weight: 2.0, caseQty: 8, palletQty: 32, value: 89.99, velocity: 'D', lotTracked: true, serialTracked: true, hazmat: false },
  { id: '7', sku: 'SKU-10007', upc: '012345678907', description: 'Bulk Fastener Pack', category: 'Hardware', subcategory: 'Fasteners', status: 'active', unitOfMeasure: 'PK', length: 6, width: 4, height: 2, weight: 0.8, caseQty: 100, palletQty: 200, value: 8.50, velocity: 'A', lotTracked: false, serialTracked: false, hazmat: false },
  { id: '8', sku: 'SKU-10008', upc: '012345678908', description: 'Thermal Compound Tube', category: 'Chemicals', subcategory: 'Thermal', status: 'pending', unitOfMeasure: 'EA', length: 1, width: 1, height: 4, weight: 0.1, caseQty: 48, palletQty: 192, value: 14.99, velocity: 'C', lotTracked: true, serialTracked: false, hazmat: false },
]

const CATEGORIES = ['All', 'Electronics', 'Components', 'Chemicals', 'Packaging', 'Hardware']
const VELOCITIES = ['All', 'A', 'B', 'C', 'D']

export default function ItemMaster() {
  const [activeTab, setActiveTab] = useState<'list' | 'details' | 'dimensions'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [velocityFilter, setVelocityFilter] = useState('All')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const getStatusBadge = (status: Item['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      discontinued: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return styles[status]
  }

  const getVelocityBadge = (velocity: Item['velocity']) => {
    const styles = {
      A: 'bg-red-100 text-red-800',
      B: 'bg-yellow-100 text-yellow-800',
      C: 'bg-green-100 text-green-800',
      D: 'bg-gray-100 text-gray-800',
    }
    return styles[velocity]
  }

  const filteredItems = mockItems.filter(item => {
    const matchesSearch = item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.upc.includes(searchTerm)
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    const matchesVelocity = velocityFilter === 'All' || item.velocity === velocityFilter
    return matchesSearch && matchesCategory && matchesVelocity
  })

  const stats = {
    totalItems: mockItems.length,
    activeItems: mockItems.filter(i => i.status === 'active').length,
    hazmatItems: mockItems.filter(i => i.hazmat).length,
    lotTracked: mockItems.filter(i => i.lotTracked).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Item Master</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage product catalog and specifications</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Archive className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total SKUs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Tag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Items</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Box className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hazmat Items</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.hazmatItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lot Tracked</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.lotTracked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'list', label: 'Item List' },
            { id: 'details', label: 'Item Details' },
            { id: 'dimensions', label: 'Dimensions' },
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

      {/* Filters */}
      {activeTab === 'list' && (
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search SKU, description, or UPC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
          <select
            value={velocityFilter}
            onChange={(e) => setVelocityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {VELOCITIES.map(vel => (
              <option key={vel} value={vel}>{vel === 'All' ? 'All Velocities' : `Class ${vel}`}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">UOM</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Velocity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Flags</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-mono text-blue-600">{item.sku}</p>
                        <p className="text-xs text-gray-500">{item.upc}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white">{item.category}</p>
                        <p className="text-xs text-gray-500">{item.subcategory}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.unitOfMeasure}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getVelocityBadge(item.velocity)}`}>
                        {item.velocity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${item.value.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {item.lotTracked && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">LOT</span>}
                        {item.serialTracked && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">SN</span>}
                        {item.hazmat && <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs">HAZ</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setSelectedItem(item); setActiveTab('details'); }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="Duplicate">
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                  <input type="text" defaultValue={selectedItem?.sku || 'SKU-10001'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPC</label>
                  <input type="text" defaultValue={selectedItem?.upc || '012345678901'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input type="text" defaultValue={selectedItem?.description || 'Widget Alpha Pro'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select defaultValue={selectedItem?.category || 'Electronics'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {CATEGORIES.filter(c => c !== 'All').map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit of Measure</label>
                  <select defaultValue={selectedItem?.unitOfMeasure || 'EA'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>EA</option>
                    <option>CS</option>
                    <option>PK</option>
                    <option>KIT</option>
                    <option>SET</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value ($)</label>
                  <input type="number" step="0.01" defaultValue={selectedItem?.value || 29.99} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Velocity Class</label>
                  <select defaultValue={selectedItem?.velocity || 'A'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tracking & Flags</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="lotTracked" defaultChecked={selectedItem?.lotTracked} className="rounded" />
                <label htmlFor="lotTracked" className="text-sm text-gray-700 dark:text-gray-300">Lot Tracked</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="serialTracked" defaultChecked={selectedItem?.serialTracked} className="rounded" />
                <label htmlFor="serialTracked" className="text-sm text-gray-700 dark:text-gray-300">Serial Number Tracked</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="hazmat" defaultChecked={selectedItem?.hazmat} className="rounded" />
                <label htmlFor="hazmat" className="text-sm text-gray-700 dark:text-gray-300">Hazardous Material</label>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Quantity</label>
                  <input type="number" defaultValue={selectedItem?.caseQty || 24} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pallet Quantity</label>
                  <input type="number" defaultValue={selectedItem?.palletQty || 48} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dimensions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">L x W x H (in)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cubic (in³)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Weight (lbs)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Case Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pallet Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.length}" × {item.width}" × {item.height}"
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.length * item.width * item.height}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.weight}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.caseQty}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.palletQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
