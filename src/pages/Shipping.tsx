import { useState, useMemo } from 'react';
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
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import {
  useShipmentList,
  useShippingSummary,
  useShippingCarriers,
  type Shipment
} from '../hooks/useShipping';

// Carrier data (fallback)
const CARRIERS = [
  { id: 'ups', name: 'UPS', logo: '📦', services: ['Ground', 'Next Day Air', '2nd Day Air', '3 Day Select'] },
  { id: 'fedex', name: 'FedEx', logo: '📮', services: ['Ground', 'Express', '2Day', 'Freight'] },
  { id: 'usps', name: 'USPS', logo: '✉️', services: ['Priority', 'First Class', 'Media Mail', 'Parcel Select'] },
  { id: 'ltl', name: 'LTL Freight', logo: '🚛', services: ['Standard', 'Expedited', 'Guaranteed'] },
];

// Mock BOL data
const mockBOLs = [
  { id: 'BOL-2024-001', carrier: 'LTL Freight', proNumber: 'PRO123456', pieces: 8, weight: 1250, status: 'created' },
  { id: 'BOL-2024-002', carrier: 'LTL Freight', proNumber: 'PRO123457', pieces: 12, weight: 2100, status: 'signed' },
];

type ShipmentStatus = 'all' | 'PENDING' | 'PICKING' | 'PACKING' | 'READY' | 'SHIPPED' | 'DELIVERED';

export default function Shipping() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'manifest' | 'bol'>('shipments');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ShipmentStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRateShop, setShowRateShop] = useState(false);
  const [page, setPage] = useState(1);

  // Use React Query hooks for real API data
  const { data: shipmentsResponse, isLoading, error, refetch } = useShipmentList({
    search: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    page,
    limit: 50,
  });

  const { data: summary } = useShippingSummary();
  const { data: carriers } = useShippingCarriers();

  // Extract shipments from response
  const shipments = useMemo(() => {
    if (!shipmentsResponse) return [];
    return Array.isArray(shipmentsResponse) ? shipmentsResponse : shipmentsResponse.data || [];
  }, [shipmentsResponse]);

  // Map status to display values
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SHIPPED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'READY':
        return 'bg-blue-100 text-blue-800';
      case 'PACKING':
      case 'PICKING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SHIPPED': return 'Shipped';
      case 'DELIVERED': return 'Delivered';
      case 'READY': return 'Ready to Ship';
      case 'PACKING': return 'Packing';
      case 'PICKING': return 'Picking';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  // Use API carriers or fallback
  const displayCarriers = carriers || CARRIERS.map(c => ({ id: c.id, name: c.name, code: c.id.toUpperCase(), services: [], isActive: true }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Shipping & Manifesting</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage shipments, carriers, and BOL generation</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
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
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ready to Ship</p>
              <p className="text-2xl font-bold text-yellow-600">{summary?.pendingShipments || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Transit</p>
              <p className="text-2xl font-bold text-blue-600">{summary?.inTransit || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Shipped Today</p>
              <p className="text-2xl font-bold text-green-600">{summary?.todayShipments || 0}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">On-Time Rate</p>
              <p className="text-2xl font-bold text-green-600">{summary?.onTimeRate ? `${summary.onTimeRate}%` : 'N/A'}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Carrier Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Carrier Volume Today</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary?.carrierBreakdown?.length ? (
            summary.carrierBreakdown.map((carrier, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{carrier.carrier}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{carrier.count} packages</p>
                </div>
              </div>
            ))
          ) : (
            CARRIERS.map(carrier => (
              <div key={carrier.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-2xl">{carrier.logo}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{carrier.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">0 packages</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'shipments'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Shipments
            </button>
            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manifest'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              End of Day Manifest
            </button>
            <button
              onClick={() => setActiveTab('bol')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bol'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as ShipmentStatus)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PICKING">Picking</option>
                    <option value="PACKING">Packing</option>
                    <option value="READY">Ready to Ship</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading shipments...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-red-600 dark:text-red-400">Failed to load shipments.</p>
                </div>
              )}

              {/* Shipment List */}
              {!isLoading && (
                <div className="space-y-3">
                  {shipments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No shipments found
                    </div>
                  ) : (
                    shipments.map((shipment: Shipment) => (
                      <motion.div
                        key={shipment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`border rounded-lg overflow-hidden ${
                          shipment.status === 'PENDING' ? 'border-yellow-300 dark:border-yellow-700' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => setSelectedShipmentId(selectedShipmentId === shipment.id ? null : shipment.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${
                                shipment.status === 'SHIPPED' || shipment.status === 'DELIVERED' ? 'bg-green-100 dark:bg-green-900/30' :
                                shipment.status === 'READY' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                              }`}>
                                {shipment.status === 'SHIPPED' || shipment.status === 'DELIVERED' ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Package className="w-5 h-5 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{shipment.shipmentNumber}</span>
                                  <span className="text-gray-400">|</span>
                                  <span className="text-blue-600 dark:text-blue-400">{shipment.orderNumber}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{shipment.customerName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{shipment.carrier} {shipment.serviceType}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{shipment.packages?.length || 0} pkg • {shipment.weight} lbs</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                                {getStatusLabel(shipment.status)}
                              </span>
                              {selectedShipmentId === shipment.id ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {selectedShipmentId === shipment.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Dimensions</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {shipment.dimensions?.length}x{shipment.dimensions?.width}x{shipment.dimensions?.height} in
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Weight</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{shipment.weight} lbs</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Tracking Number</p>
                                  <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{shipment.trackingNumber || 'Not assigned'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Ship Date</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {shipment.shipDate ? new Date(shipment.shipDate).toLocaleDateString() : 'Pending'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {shipment.status === 'READY' && (
                                  <>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                                      Generate Label
                                    </button>
                                    <button
                                      onClick={() => setShowRateShop(true)}
                                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                      Rate Shop
                                    </button>
                                  </>
                                )}
                                {shipment.trackingNumber && (
                                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                                    Track Package
                                  </button>
                                )}
                                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* Pagination */}
              {shipmentsResponse && !Array.isArray(shipmentsResponse) && shipmentsResponse.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page {shipmentsResponse.page} of {shipmentsResponse.totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= shipmentsResponse.totalPages}
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manifest Tab */}
          {activeTab === 'manifest' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">End of Day Manifest</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Close the manifest to finalize all shipments for carrier pickup. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayCarriers.slice(0, 2).map((carrier, idx) => (
                  <div key={carrier.id || idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{carrier.name}</h4>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
                        Open
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Packages</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {summary?.carrierBreakdown?.find(c => c.carrier === carrier.name)?.count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Total Weight</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">-- lbs</p>
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
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Bills of Lading</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <FileText className="w-4 h-4" />
                  Create BOL
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">BOL #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Carrier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PRO Number</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pieces</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Weight</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockBOLs.map((bol) => (
                      <tr key={bol.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{bol.id}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{bol.carrier}</td>
                        <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{bol.proNumber}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{bol.pieces}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{bol.weight} lbs</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            bol.status === 'signed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Rate Shopping</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Compare carrier rates for this shipment</p>

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
                    rate.selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{rate.carrier}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{rate.days}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{rate.price}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowRateShop(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
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
