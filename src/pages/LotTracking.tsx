import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Hash,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Download
} from 'lucide-react';

// Lot control types
const LOT_CONTROL_TYPES = [
  { id: 'fifo', label: 'FIFO', description: 'First In, First Out' },
  { id: 'lifo', label: 'LIFO', description: 'Last In, First Out' },
  { id: 'fefo', label: 'FEFO', description: 'First Expired, First Out' },
  { id: 'manual', label: 'Manual', description: 'Manual lot selection' },
];

// Mock lot data
const mockLots = [
  {
    id: 'LOT-2024-001',
    sku: 'SKU-10045',
    description: 'Wireless Bluetooth Headphones',
    lotNumber: 'L240115A',
    quantity: 240,
    receivedDate: '2024-01-15',
    expirationDate: null,
    manufacturerLot: 'MFG-BT2024-001',
    status: 'active',
    locations: ['A-12-03', 'R-05-12'],
    serialized: false
  },
  {
    id: 'LOT-2024-002',
    sku: 'SKU-75521',
    description: 'Organic Protein Powder',
    lotNumber: 'L240110B',
    quantity: 500,
    receivedDate: '2024-01-10',
    expirationDate: '2025-06-30',
    manufacturerLot: 'PROT-2024-0110',
    status: 'active',
    locations: ['C-08-01', 'R-08-24'],
    serialized: false
  },
  {
    id: 'LOT-2024-003',
    sku: 'SKU-88902',
    description: 'Medical Supplies Kit',
    lotNumber: 'L240112C',
    quantity: 150,
    receivedDate: '2024-01-12',
    expirationDate: '2024-12-31',
    manufacturerLot: 'MED-2024-0112',
    status: 'expiring_soon',
    locations: ['D-02-01'],
    serialized: true,
    serialNumbers: ['SN-001', 'SN-002', 'SN-003']
  },
  {
    id: 'LOT-2024-004',
    sku: 'SKU-45678',
    description: 'Vitamin D Supplements',
    lotNumber: 'L231215D',
    quantity: 0,
    receivedDate: '2023-12-15',
    expirationDate: '2024-01-20',
    manufacturerLot: 'VIT-2023-1215',
    status: 'expired',
    locations: [],
    serialized: false
  },
  {
    id: 'LOT-2024-005',
    sku: 'SKU-99123',
    description: 'Electronic Components',
    lotNumber: 'L240108E',
    quantity: 1000,
    receivedDate: '2024-01-08',
    expirationDate: null,
    manufacturerLot: 'ELEC-2024-0108',
    status: 'on_hold',
    holdReason: 'Quality inspection pending',
    locations: ['HOLD-01'],
    serialized: true,
    serialNumbers: ['EC-1001', 'EC-1002', 'EC-1003']
  },
];

// Mock serial numbers for detail view
const mockSerialNumbers = [
  { serial: 'SN-MED-001', status: 'available', location: 'D-02-01', lastScanned: '2024-01-15 08:30' },
  { serial: 'SN-MED-002', status: 'available', location: 'D-02-01', lastScanned: '2024-01-15 08:31' },
  { serial: 'SN-MED-003', status: 'shipped', location: null, orderId: 'ORD-78521', lastScanned: '2024-01-14 14:22' },
  { serial: 'SN-MED-004', status: 'available', location: 'D-02-01', lastScanned: '2024-01-15 08:32' },
  { serial: 'SN-MED-005', status: 'quarantine', location: 'HOLD-01', lastScanned: '2024-01-13 11:45' },
];

export default function LotTracking() {
  const [activeTab, setActiveTab] = useState<'lots' | 'serials' | 'expiring'>('lots');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLot, setSelectedLot] = useState<typeof mockLots[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'depleted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSerialStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'quarantine': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiration = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredLots = mockLots.filter(lot => {
    const matchesSearch =
      lot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || lot.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const expiringLots = mockLots.filter(lot => {
    if (!lot.expirationDate) return false;
    const days = getDaysUntilExpiration(lot.expirationDate);
    return days !== null && days > 0 && days <= 90;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lot & Serial Tracking</h1>
          <p className="text-gray-500 mt-1">Track lot numbers, serial numbers, and expiration dates</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Hash className="w-4 h-4" />
            Create Lot
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
              <p className="text-sm text-gray-500">Active Lots</p>
              <p className="text-2xl font-bold text-green-600">
                {mockLots.filter(l => l.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
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
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{expiringLots.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
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
              <p className="text-sm text-gray-500">On Hold</p>
              <p className="text-2xl font-bold text-orange-600">
                {mockLots.filter(l => l.status === 'on_hold').length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
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
              <p className="text-sm text-gray-500">Serialized Items</p>
              <p className="text-2xl font-bold text-blue-600">
                {mockLots.filter(l => l.serialized).length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Hash className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lot Control Types Reference */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-3">Lot Control Methods</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LOT_CONTROL_TYPES.map((type) => (
            <div key={type.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{type.label}</p>
              <p className="text-sm text-gray-500">{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('lots')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'lots'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lot Inventory
            </button>
            <button
              onClick={() => setActiveTab('serials')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'serials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Serial Numbers
            </button>
            <button
              onClick={() => setActiveTab('expiring')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'expiring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Expiration Report ({expiringLots.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lots, SKUs, serial numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <option value="active">Active</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Lots Tab */}
          {activeTab === 'lots' && (
            <div className="space-y-3">
              {filteredLots.map((lot) => {
                const daysUntilExp = getDaysUntilExpiration(lot.expirationDate);
                return (
                  <motion.div
                    key={lot.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border rounded-lg overflow-hidden cursor-pointer ${
                      selectedLot?.id === lot.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedLot(selectedLot?.id === lot.id ? null : lot)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Hash className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-gray-900">{lot.lotNumber}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(lot.status)}`}>
                                {lot.status.replace('_', ' ')}
                              </span>
                              {lot.serialized && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  Serialized
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{lot.sku} - {lot.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{lot.quantity.toLocaleString()} units</p>
                          {lot.expirationDate && (
                            <p className={`text-sm ${daysUntilExp && daysUntilExp <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                              Exp: {lot.expirationDate}
                              {daysUntilExp !== null && ` (${daysUntilExp} days)`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedLot?.id === lot.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Manufacturer Lot</p>
                            <p className="font-mono">{lot.manufacturerLot}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Received Date</p>
                            <p>{lot.receivedDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Locations</p>
                            <p className="font-mono">{lot.locations.join(', ') || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Expiration</p>
                            <p>{lot.expirationDate || 'N/A'}</p>
                          </div>
                        </div>

                        {lot.status === 'on_hold' && lot.holdReason && (
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                            <p className="text-sm text-orange-800">
                              <strong>Hold Reason:</strong> {lot.holdReason}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            View History
                          </button>
                          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                            Adjust Quantity
                          </button>
                          {lot.status === 'on_hold' && (
                            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                              Release Hold
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Serials Tab */}
          {activeTab === 'serials' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Scanned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockSerialNumbers.map((serial) => (
                    <tr key={serial.serial} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium">{serial.serial}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSerialStatusColor(serial.status)}`}>
                          {serial.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{serial.location || '-'}</td>
                      <td className="px-4 py-3 text-blue-600">{serial.orderId || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{serial.lastScanned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Expiring Tab */}
          {activeTab === 'expiring' && (
            <div className="space-y-3">
              {expiringLots.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No lots expiring within 90 days</p>
                </div>
              ) : (
                expiringLots.map((lot) => {
                  const daysUntilExp = getDaysUntilExpiration(lot.expirationDate);
                  return (
                    <div
                      key={lot.id}
                      className={`border rounded-lg p-4 ${
                        daysUntilExp && daysUntilExp <= 30 ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-5 h-5 ${daysUntilExp && daysUntilExp <= 30 ? 'text-red-600' : 'text-yellow-600'}`} />
                            <span className="font-mono font-medium">{lot.lotNumber}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{lot.sku} - {lot.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${daysUntilExp && daysUntilExp <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {daysUntilExp} days
                          </p>
                          <p className="text-sm text-gray-500">Expires: {lot.expirationDate}</p>
                          <p className="text-sm text-gray-500">{lot.quantity} units remaining</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
