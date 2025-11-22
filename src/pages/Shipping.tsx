import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  FileText,
  Search,
  Filter,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Carrier data
const CARRIERS = [
  { id: 'ups', name: 'UPS', logo: '📦', services: ['Ground', 'Next Day Air', '2nd Day Air', '3 Day Select'] },
  { id: 'fedex', name: 'FedEx', logo: '📮', services: ['Ground', 'Express', '2Day', 'Freight'] },
  { id: 'usps', name: 'USPS', logo: '✉️', services: ['Priority', 'First Class', 'Media Mail', 'Parcel Select'] },
  { id: 'ltl', name: 'LTL Freight', logo: '🚛', services: ['Standard', 'Expedited', 'Guaranteed'] },
];

// Mock shipments
const mockShipments = [
  {
    id: 'SHP-2024-0001',
    orderId: 'ORD-45821',
    status: 'ready_to_ship',
    carrier: 'ups',
    service: 'Ground',
    customer: 'Acme Corp',
    address: '123 Main St, New York, NY 10001',
    packages: 2,
    totalWeight: 24.5,
    trackingNumber: null,
    shipDate: null,
    dock: 'D-01',
    priority: 'standard'
  },
  {
    id: 'SHP-2024-0002',
    orderId: 'ORD-45822',
    status: 'manifested',
    carrier: 'fedex',
    service: 'Express',
    customer: 'Tech Solutions Inc',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    packages: 1,
    totalWeight: 8.2,
    trackingNumber: '794644790132',
    shipDate: '2024-01-15',
    dock: 'D-02',
    priority: 'rush'
  },
  {
    id: 'SHP-2024-0003',
    orderId: 'ORD-45823',
    status: 'shipped',
    carrier: 'ups',
    service: 'Next Day Air',
    customer: 'Global Retail',
    address: '789 Pine Rd, Chicago, IL 60601',
    packages: 3,
    totalWeight: 45.0,
    trackingNumber: '1Z999AA10123456784',
    shipDate: '2024-01-15',
    dock: 'D-01',
    priority: 'rush'
  },
  {
    id: 'SHP-2024-0004',
    orderId: 'ORD-45824',
    status: 'pending_pick',
    carrier: 'ltl',
    service: 'Standard',
    customer: 'Warehouse Direct',
    address: '321 Industrial Blvd, Houston, TX 77001',
    packages: 8,
    totalWeight: 1250.0,
    trackingNumber: null,
    shipDate: null,
    dock: 'D-05',
    priority: 'standard'
  },
];

// Mock BOL data
const mockBOLs = [
  { id: 'BOL-2024-001', carrier: 'LTL Freight', proNumber: 'PRO123456', pieces: 8, weight: 1250, status: 'created' },
  { id: 'BOL-2024-002', carrier: 'LTL Freight', proNumber: 'PRO123457', pieces: 12, weight: 2100, status: 'signed' },
];

export default function Shipping() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'manifest' | 'bol'>('shipments');
  const [selectedShipment, setSelectedShipment] = useState<typeof mockShipments[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showRateShop, setShowRateShop] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'manifested': return 'bg-blue-100 text-blue-800';
      case 'ready_to_ship': return 'bg-yellow-100 text-yellow-800';
      case 'pending_pick': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'shipped': return 'Shipped';
      case 'manifested': return 'Manifested';
      case 'ready_to_ship': return 'Ready to Ship';
      case 'pending_pick': return 'Pending Pick';
      default: return status;
    }
  };

  const filteredShipments = mockShipments.filter(s =>
    filterStatus === 'all' || s.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping & Manifesting</h1>
          <p className="text-gray-500 mt-1">Manage shipments, carriers, and BOL generation</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Printer className="w-4 h-4" />
            Print Labels
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Truck className="w-4 h-4" />
            Close Manifest
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ready to Ship</p>
              <p className="text-2xl font-bold text-yellow-600">12</p>
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
              <p className="text-sm text-gray-500">Manifested Today</p>
              <p className="text-2xl font-bold text-blue-600">45</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-500">Shipped Today</p>
              <p className="text-2xl font-bold text-green-600">38</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Truck className="w-6 h-6 text-green-600" />
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
              <p className="text-sm text-gray-500">Rush Orders</p>
              <p className="text-2xl font-bold text-red-600">5</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Carrier Quick Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-3">Carrier Volume Today</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CARRIERS.map(carrier => (
            <div key={carrier.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">{carrier.logo}</span>
              <div>
                <p className="font-medium text-gray-900">{carrier.name}</p>
                <p className="text-sm text-gray-500">{Math.floor(Math.random() * 30) + 5} packages</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'shipments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Shipments
            </button>
            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manifest'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              End of Day Manifest
            </button>
            <button
              onClick={() => setActiveTab('bol')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bol'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bills of Lading
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Shipments Tab */}
          {activeTab === 'shipments' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search shipments, orders, tracking..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Status</option>
                    <option value="pending_pick">Pending Pick</option>
                    <option value="ready_to_ship">Ready to Ship</option>
                    <option value="manifested">Manifested</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </div>
              </div>

              {/* Shipment List */}
              <div className="space-y-3">
                {filteredShipments.map((shipment) => (
                  <motion.div
                    key={shipment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border rounded-lg overflow-hidden ${
                      shipment.priority === 'rush' ? 'border-red-300' : 'border-gray-200'
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedShipment(selectedShipment?.id === shipment.id ? null : shipment)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            shipment.status === 'shipped' ? 'bg-green-100' :
                            shipment.status === 'manifested' ? 'bg-blue-100' : 'bg-yellow-100'
                          }`}>
                            {shipment.status === 'shipped' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Package className="w-5 h-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{shipment.id}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-blue-600">{shipment.orderId}</span>
                              {shipment.priority === 'rush' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded font-medium">
                                  RUSH
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{shipment.customer}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-medium">{shipment.carrier.toUpperCase()} {shipment.service}</p>
                            <p className="text-xs text-gray-500">{shipment.packages} pkg • {shipment.totalWeight} lbs</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                            {getStatusLabel(shipment.status)}
                          </span>
                          {selectedShipment?.id === shipment.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {selectedShipment?.id === shipment.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Ship To</p>
                              <p className="text-sm font-medium">{shipment.address}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Dock</p>
                              <p className="text-sm font-medium">{shipment.dock}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Tracking Number</p>
                              <p className="text-sm font-mono">{shipment.trackingNumber || 'Not assigned'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Ship Date</p>
                              <p className="text-sm font-medium">{shipment.shipDate || 'Pending'}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {shipment.status === 'ready_to_ship' && (
                              <>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                                  Generate Label
                                </button>
                                <button
                                  onClick={() => setShowRateShop(true)}
                                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                >
                                  Rate Shop
                                </button>
                              </>
                            )}
                            {shipment.trackingNumber && (
                              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                                Track Package
                              </button>
                            )}
                            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Manifest Tab */}
          {activeTab === 'manifest' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">End of Day Manifest</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Close the manifest to finalize all shipments for carrier pickup. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CARRIERS.slice(0, 2).map(carrier => (
                  <div key={carrier.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{carrier.logo}</span>
                        <h4 className="font-medium text-gray-900">{carrier.name}</h4>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        Open
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Packages</p>
                        <p className="font-medium">{Math.floor(Math.random() * 20) + 5}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Weight</p>
                        <p className="font-medium">{Math.floor(Math.random() * 500) + 100} lbs</p>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Close Manifest
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOL Tab */}
          {activeTab === 'bol' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Bills of Lading</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <FileText className="w-4 h-4" />
                  Create BOL
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BOL #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRO Number</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pieces</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Weight</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockBOLs.map((bol) => (
                      <tr key={bol.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{bol.id}</td>
                        <td className="px-4 py-3">{bol.carrier}</td>
                        <td className="px-4 py-3 font-mono">{bol.proNumber}</td>
                        <td className="px-4 py-3 text-right">{bol.pieces}</td>
                        <td className="px-4 py-3 text-right">{bol.weight} lbs</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            bol.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bol.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-blue-600">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-blue-600">
                              <Download className="w-4 h-4" />
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
        </div>
      </div>

      {/* Rate Shop Modal */}
      {showRateShop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Rate Shopping</h2>
            <p className="text-sm text-gray-500 mb-4">Compare carrier rates for this shipment</p>

            <div className="space-y-3">
              {[
                { carrier: 'UPS Ground', price: '$12.45', days: '3-5 days', selected: false },
                { carrier: 'FedEx Ground', price: '$11.89', days: '3-5 days', selected: true },
                { carrier: 'USPS Priority', price: '$15.20', days: '2-3 days', selected: false },
                { carrier: 'UPS 2nd Day Air', price: '$24.50', days: '2 days', selected: false },
              ].map((rate, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                    rate.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="font-medium">{rate.carrier}</p>
                    <p className="text-sm text-gray-500">{rate.days}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{rate.price}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowRateShop(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRateShop(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Select Rate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
