import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Package,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

// IIPAA Reference Data based on FlowLogic documentation
const USAGE_CODES = [
  { code: 'P', label: 'Primary Selection', description: 'Primary selection location', color: 'bg-blue-100 text-blue-800' },
  { code: 'A', label: 'Alternate Selection', description: 'Alternate selection location', color: 'bg-cyan-100 text-cyan-800' },
  { code: 'S', label: 'Stocker Staging', description: 'Stocker staging location', color: 'bg-purple-100 text-purple-800' },
  { code: 'F', label: 'Forward Reserve', description: 'Forward reserve location', color: 'bg-green-100 text-green-800' },
  { code: 'D', label: 'Deep Reserve', description: 'Deep reserve location', color: 'bg-yellow-100 text-yellow-800' },
  { code: 'T', label: 'Flow Thru', description: 'Flow Thru location', color: 'bg-orange-100 text-orange-800' },
];

const UNIT_CODES = [
  { code: 'A', label: 'Advertisement' },
  { code: 'B', label: 'Bulk' },
  { code: 'C', label: 'Case' },
  { code: 'E', label: 'Each' },
  { code: 'I', label: 'Inner Pack' },
];

const STATUS_CODES = [
  { code: 'A', label: 'Assigned', description: 'Assigned to at least one product', color: 'bg-blue-100 text-blue-800' },
  { code: 'F', label: 'Free', description: 'Not assigned to any product', color: 'bg-green-100 text-green-800' },
  { code: 'H', label: 'Hold', description: 'Location on hold - cannot be assigned', color: 'bg-red-100 text-red-800' },
  { code: 'P', label: 'Pending', description: 'Location pending - cannot be assigned', color: 'bg-yellow-100 text-yellow-800' },
];

const DISPOSITION_CODES = [
  { code: 'D', label: 'Delete' },
  { code: 'F', label: 'Free' },
  { code: 'K', label: 'Keep' },
];

// Mock product data
const mockProducts = [
  {
    id: 'SKU-10045',
    description: 'Wireless Bluetooth Headphones',
    vendor: 'AudioTech Inc',
    casePack: 12,
    balanceOnHand: { select: 458, stocker: 24, reserve: 1200 },
    locations: [
      { usage: 'P', unit: 'E', location: 'A-12-03', category: 'S', handling: 'C', status: 'A', commingle: 'N', disposition: 'K', quantity: 45 },
      { usage: 'A', unit: 'E', location: 'A-12-04', category: 'S', handling: 'C', status: 'A', commingle: 'N', disposition: 'K', quantity: 32 },
      { usage: 'F', unit: 'C', location: 'R-05-12', category: 'R', handling: 'P', status: 'A', commingle: 'N', disposition: 'K', quantity: 150 },
      { usage: 'D', unit: 'C', location: 'R-08-24', category: 'R', handling: 'P', status: 'A', commingle: 'N', disposition: 'K', quantity: 200 },
    ]
  },
  {
    id: 'SKU-20089',
    description: 'USB-C Charging Cable 6ft',
    vendor: 'CablePro',
    casePack: 24,
    balanceOnHand: { select: 892, stocker: 48, reserve: 2400 },
    locations: [
      { usage: 'P', unit: 'E', location: 'B-05-08', category: 'S', handling: 'C', status: 'A', commingle: 'N', disposition: 'K', quantity: 120 },
      { usage: 'F', unit: 'C', location: 'R-02-15', category: 'R', handling: 'P', status: 'A', commingle: 'N', disposition: 'K', quantity: 288 },
    ]
  },
  {
    id: 'SKU-30156',
    description: 'Laptop Stand Adjustable',
    vendor: 'ErgoDesk Corp',
    casePack: 6,
    balanceOnHand: { select: 156, stocker: 12, reserve: 480 },
    locations: [
      { usage: 'P', unit: 'E', location: 'C-08-01', category: 'S', handling: 'C', status: 'A', commingle: 'N', disposition: 'K', quantity: 28 },
      { usage: 'D', unit: 'C', location: 'R-12-08', category: 'R', handling: 'P', status: 'A', commingle: 'N', disposition: 'K', quantity: 96 },
    ]
  },
];

// Available locations for assignment
const availableLocations = [
  { location: 'A-14-02', category: 'S', handling: 'C', status: 'F', commingle: 'N' },
  { location: 'B-08-05', category: 'S', handling: 'C', status: 'F', commingle: 'N' },
  { location: 'R-15-20', category: 'R', handling: 'P', status: 'F', commingle: 'N' },
  { location: 'R-16-12', category: 'R', handling: 'P', status: 'F', commingle: 'Y' },
];

export default function LocationAssignments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReference, setShowReference] = useState(false);

  const getUsageInfo = (code: string) => USAGE_CODES.find(u => u.code === code);
  const getStatusInfo = (code: string) => STATUS_CODES.find(s => s.code === code);

  const filteredProducts = mockProducts.filter(p =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Location Assignments (IIPAA)</h1>
          <p className="text-gray-500 mt-1">Maintain product location assignments and inventory placement</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReference(!showReference)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Info className="w-4 h-4" />
            Reference Guide
          </button>
        </div>
      </div>

      {/* Reference Guide Panel */}
      {showReference && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <h3 className="font-semibold text-blue-900 mb-4">IIPAA Code Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Usage Codes</h4>
              <div className="space-y-1 text-sm">
                {USAGE_CODES.map(u => (
                  <div key={u.code} className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${u.color}`}>{u.code}</span>
                    <span className="text-gray-600">{u.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Status Codes</h4>
              <div className="space-y-1 text-sm">
                {STATUS_CODES.map(s => (
                  <div key={s.code} className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${s.color}`}>{s.code}</span>
                    <span className="text-gray-600">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Unit Codes</h4>
              <div className="space-y-1 text-sm">
                {UNIT_CODES.map(u => (
                  <div key={u.code} className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-800">{u.code}</span>
                    <span className="text-gray-600">{u.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> 'R' category locations cannot be assigned as usage 'P' or 'A'.
              Locations with commingle='Y' cannot be assigned for usage 'P', 'A', or 'F'.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">Select Product</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by SKU or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{product.id}</p>
                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Product Details & Locations */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProduct ? (
            <>
              {/* Product Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedProduct.id}</h2>
                    <p className="text-gray-500">{selectedProduct.description}</p>
                    <p className="text-sm text-gray-400 mt-1">Vendor: {selectedProduct.vendor} | Case Pack: {selectedProduct.casePack}</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                </div>

                {/* Balance on Hand */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 uppercase font-medium">Selection</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedProduct.balanceOnHand.select}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600 uppercase font-medium">Stocker</p>
                    <p className="text-2xl font-bold text-purple-900">{selectedProduct.balanceOnHand.stocker}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600 uppercase font-medium">Reserve</p>
                    <p className="text-2xl font-bold text-green-900">{selectedProduct.balanceOnHand.reserve}</p>
                  </div>
                </div>
              </motion.div>

              {/* Location Assignments Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Location Assignments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hndl</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cmgl</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disp</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedProduct.locations.map((loc, idx) => {
                        const usageInfo = getUsageInfo(loc.usage);
                        const statusInfo = getStatusInfo(loc.status);
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${usageInfo?.color}`}>
                                {loc.usage} - {usageInfo?.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">{loc.unit}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="font-mono text-sm">{loc.location}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">{loc.category}</td>
                            <td className="px-4 py-3 text-sm font-mono">{loc.handling}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo?.color}`}>
                                {loc.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {loc.commingle === 'Y' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-gray-300" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">{loc.disposition}</td>
                            <td className="px-4 py-3 text-right font-medium">{loc.quantity}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-1 text-gray-400 hover:text-blue-600">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Selected</h3>
              <p className="text-gray-500">Select a product from the list to view and manage its location assignments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Location Modal */}
      {showAddModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Location Assignment</h2>
            <p className="text-sm text-gray-500 mb-6">Assign a new location to {selectedProduct.id}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  {USAGE_CODES.map(u => (
                    <option key={u.code} value={u.code}>{u.code} - {u.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Issue</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  {UNIT_CODES.map(u => (
                    <option key={u.code} value={u.code}>{u.code} - {u.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Locations</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  {availableLocations.map(loc => (
                    <option key={loc.location} value={loc.location}>
                      {loc.location} ({loc.category}/{loc.handling}) - {loc.status === 'F' ? 'Free' : 'Assigned'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disposition</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  {DISPOSITION_CODES.map(d => (
                    <option key={d.code} value={d.code}>{d.code} - {d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Assignment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
