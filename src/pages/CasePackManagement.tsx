import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Edit2,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Case Pack Change Scenarios from FlowLogic documentation
const CASE_PACK_SCENARIOS = [
  {
    id: 'zero_inventory',
    title: 'Zero Inventory',
    description: 'Change case pack when no inventory exists in the system',
    steps: [
      'Verify case pack requirements',
      'Go to IMPRC screen',
      'Use Modify function',
      'Navigate to CASE field',
      'Change to the new case pack value'
    ],
    complexity: 'simple',
    estimatedTime: '5 min'
  },
  {
    id: 'detail_one_only',
    title: 'Inventory in Detail One Only',
    description: 'Change case pack when inventory exists only in primary locations (Detail 1)',
    steps: [
      'Verify case pack requirements',
      'Adjust ALL inventory OUT with IC code',
      'Go to IMPRC screen',
      'Use Modify > CASE to change case pack',
      'Adjust inventory back IN with IC code'
    ],
    complexity: 'moderate',
    estimatedTime: '15 min'
  },
  {
    id: 'reserves_only',
    title: 'Different Details in Reserves Only',
    description: 'Change case pack when inventory exists only in reserve locations with different details',
    steps: [
      'Verify case pack in ALL locations',
      'Adjust all Detail One inventory OUT with IC code',
      'Go to IMPRC screen',
      'Use Modify > CASE to change case pack',
      'Pallet Move inventory from Detail 2 location to Primary',
      'Pallet Move same inventory back to original location (converts to Detail 1)',
      'Repeat for each LIP, one at a time',
      'Once all inventory is Detail One, adjust back to Primary'
    ],
    complexity: 'complex',
    estimatedTime: '30-45 min'
  },
  {
    id: 'multiple_details',
    title: 'Multiple Details Including Detail One in Reserves',
    description: 'Cannot change case pack until Detail One empties from reserve locations',
    steps: [
      'Verify ALL locations',
      'Check for reserves with case pack matching primary',
      'WAIT: Case pack cannot be changed until Detail One empties from reserve',
      'Monitor inventory levels',
      'Once Detail One is clear from reserves, proceed with appropriate scenario'
    ],
    complexity: 'blocked',
    estimatedTime: 'Variable - Wait required'
  }
];

// Mock products with case pack info
const mockProducts = [
  {
    id: 'SKU-10045',
    description: 'Wireless Bluetooth Headphones',
    currentCasePack: 12,
    proposedCasePack: 24,
    vendor: 'AudioTech Inc',
    inventoryStatus: 'detail_one_only',
    locations: [
      { location: 'A-12-03', type: 'Primary', detail: 1, casePack: 12, quantity: 45 },
      { location: 'A-12-04', type: 'Alternate', detail: 1, casePack: 12, quantity: 32 },
    ]
  },
  {
    id: 'SKU-20089',
    description: 'USB-C Charging Cable 6ft',
    currentCasePack: 24,
    proposedCasePack: 36,
    vendor: 'CablePro',
    inventoryStatus: 'zero_inventory',
    locations: []
  },
  {
    id: 'SKU-30156',
    description: 'Laptop Stand Adjustable',
    currentCasePack: 6,
    proposedCasePack: 8,
    vendor: 'ErgoDesk Corp',
    inventoryStatus: 'reserves_only',
    locations: [
      { location: 'R-05-12', type: 'Forward Reserve', detail: 2, casePack: 6, quantity: 150 },
      { location: 'R-08-24', type: 'Deep Reserve', detail: 2, casePack: 6, quantity: 200 },
    ]
  },
  {
    id: 'SKU-40221',
    description: 'Mechanical Keyboard RGB',
    currentCasePack: 4,
    proposedCasePack: 6,
    vendor: 'KeyMaster',
    inventoryStatus: 'multiple_details',
    locations: [
      { location: 'B-05-08', type: 'Primary', detail: 1, casePack: 4, quantity: 28 },
      { location: 'R-02-15', type: 'Forward Reserve', detail: 1, casePack: 4, quantity: 96 },
      { location: 'R-10-08', type: 'Deep Reserve', detail: 2, casePack: 4, quantity: 144 },
    ]
  },
];

export default function CasePackManagement() {
  const [activeTab, setActiveTab] = useState<'pending' | 'guide'>('pending');
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'zero_inventory': return 'bg-green-100 text-green-800';
      case 'detail_one_only': return 'bg-yellow-100 text-yellow-800';
      case 'reserves_only': return 'bg-orange-100 text-orange-800';
      case 'multiple_details': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-orange-100 text-orange-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScenarioInfo = (status: string) => CASE_PACK_SCENARIOS.find(s => s.id === status);

  const filteredProducts = mockProducts.filter(p =>
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Pack Management</h1>
          <p className="text-gray-500 mt-1">Manage case pack changes using IMPRC procedures</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" />
          Request Case Pack Change
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Changes</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ready to Process</p>
              <p className="text-2xl font-bold text-green-600">1</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Require Adjustment</p>
              <p className="text-2xl font-bold text-orange-600">2</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Edit2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Blocked</p>
              <p className="text-2xl font-bold text-red-600">1</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Changes
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'guide'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Process Guide
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Product List */}
              {filteredProducts.map((product) => {
                const scenario = getScenarioInfo(product.inventoryStatus);
                const isSelected = selectedProduct?.id === product.id;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedProduct(isSelected ? null : product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Package className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{product.id}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(product.inventoryStatus)}`}>
                                {scenario?.title}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{product.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">{product.currentCasePack}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="text-lg font-bold text-blue-600">{product.proposedCasePack}</span>
                          </div>
                          <p className="text-xs text-gray-500">Case Pack Change</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-200 bg-gray-50"
                        >
                          <div className="p-4">
                            {/* Location Details */}
                            {product.locations.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Inventory Locations</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Detail</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Case Pack</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {product.locations.map((loc, idx) => (
                                        <tr key={idx} className="bg-white">
                                          <td className="px-3 py-2 font-mono">{loc.location}</td>
                                          <td className="px-3 py-2">{loc.type}</td>
                                          <td className="px-3 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs ${
                                              loc.detail === 1 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                            }`}>
                                              Detail {loc.detail}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-center">{loc.casePack}</td>
                                          <td className="px-3 py-2 text-right font-medium">{loc.quantity}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Required Steps */}
                            {scenario && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Required Steps</h4>
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getComplexityColor(scenario.complexity)}`}>
                                      {scenario.complexity.charAt(0).toUpperCase() + scenario.complexity.slice(1)}
                                    </span>
                                    <span className="text-xs text-gray-500">Est: {scenario.estimatedTime}</span>
                                  </div>
                                  <ol className="space-y-2">
                                    {scenario.steps.map((step, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                                          {idx + 1}
                                        </span>
                                        <span className="text-gray-700">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {product.inventoryStatus === 'zero_inventory' && (
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                  Process Change in IMPRC
                                </button>
                              )}
                              {product.inventoryStatus === 'detail_one_only' && (
                                <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                                  Start IC Adjustment
                                </button>
                              )}
                              {product.inventoryStatus === 'reserves_only' && (
                                <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                                  Start Pallet Move Process
                                </button>
                              )}
                              {product.inventoryStatus === 'multiple_details' && (
                                <button className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed" disabled>
                                  Blocked - Wait for Detail One to Clear
                                </button>
                              )}
                              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                View History
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Case Pack Change Procedures</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      The procedure for changing case packs depends on the current inventory status.
                      Use the IMPRC screen to modify case pack values after following the appropriate steps.
                    </p>
                  </div>
                </div>
              </div>

              {CASE_PACK_SCENARIOS.map((scenario) => (
                <div key={scenario.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedScenario(expandedScenario === scenario.id ? null : scenario.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getComplexityColor(scenario.complexity)}`}>
                        {scenario.complexity.charAt(0).toUpperCase() + scenario.complexity.slice(1)}
                      </span>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{scenario.title}</h4>
                        <p className="text-sm text-gray-500">{scenario.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{scenario.estimatedTime}</span>
                      {expandedScenario === scenario.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedScenario === scenario.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 bg-gray-50 p-4"
                      >
                        <h5 className="font-medium text-gray-700 mb-3">Step-by-Step Procedure</h5>
                        <ol className="space-y-3">
                          {scenario.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700">{step}</p>
                                {step.includes('IMPRC') && (
                                  <p className="text-xs text-blue-600 mt-1">System: IMPRC Screen</p>
                                )}
                                {step.includes('IC code') && (
                                  <p className="text-xs text-purple-600 mt-1">System: Inventory Control</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>

                        {scenario.id === 'multiple_details' && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-700">
                                <strong>Important:</strong> If there are reserves with the same case pack as shown in the primary,
                                the case pack CANNOT be changed until Detail One empties from the reserve locations.
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
