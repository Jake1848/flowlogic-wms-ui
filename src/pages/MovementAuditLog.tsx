import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
} from 'lucide-react';

interface MovementRecord {
  id: string;
  dateTime: string;
  transactionType: string;
  transactionId: string;
  location: string;
  product: string;
  productDescription: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  uom: string;
  userId: string;
  reference: string;
  logType: string;
}

interface SearchCriteria {
  distributionCenter: string;
  warehouse: string;
  fromDate: string;
  toDate: string;
  product: string;
  logType: string;
}

// Demo data for movement records
const generateDemoMovements = (): MovementRecord[] => {
  const movements: MovementRecord[] = [];
  const logTypes = ['RECEIPT', 'SHIPMENT', 'TRANSFER', 'ADJUSTMENT', 'CYCLE_COUNT', 'RETURN'];
  const transTypes = ['RCV', 'SHP', 'TRN', 'ADJ', 'CYC', 'RTN'];
  const products = [
    { id: 'PRD001', desc: 'Widget Assembly Kit' },
    { id: 'PRD002', desc: 'Electronic Component A' },
    { id: 'PRD003', desc: 'Fastener Pack 100ct' },
    { id: 'PRD004', desc: 'Circuit Board Type B' },
    { id: 'PRD005', desc: 'Power Supply Unit' },
    { id: 'PRD006', desc: 'Connector Cable 6ft' },
    { id: 'PRD007', desc: 'Mounting Bracket Steel' },
    { id: 'PRD008', desc: 'Enclosure Box Large' },
  ];
  const users = ['JSMITH', 'MJONES', 'AWILSON', 'KBROWN', 'SYSTEM'];

  const baseDate = new Date('2025-11-28');

  for (let i = 0; i < 50; i++) {
    const logTypeIdx = Math.floor(Math.random() * logTypes.length);
    const product = products[Math.floor(Math.random() * products.length)];
    const dateOffset = Math.floor(Math.random() * 30);
    const date = new Date(baseDate);
    date.setDate(date.getDate() - dateOffset);
    const hour = Math.floor(Math.random() * 12) + 6;
    const minute = Math.floor(Math.random() * 60);

    let fromLoc = '';
    let toLoc = '';
    const aisle = String.fromCharCode(65 + Math.floor(Math.random() * 8));
    const bay = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
    const level = String(Math.floor(Math.random() * 4) + 1);
    const location = `${aisle}-${bay}-${level}`;

    switch (logTypes[logTypeIdx]) {
      case 'RECEIPT':
        fromLoc = 'RECEIVING';
        toLoc = location;
        break;
      case 'SHIPMENT':
        fromLoc = location;
        toLoc = 'SHIPPING';
        break;
      case 'TRANSFER':
        fromLoc = location;
        const aisle2 = String.fromCharCode(65 + Math.floor(Math.random() * 8));
        const bay2 = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
        const level2 = String(Math.floor(Math.random() * 4) + 1);
        toLoc = `${aisle2}-${bay2}-${level2}`;
        break;
      case 'ADJUSTMENT':
      case 'CYCLE_COUNT':
        fromLoc = location;
        toLoc = location;
        break;
      case 'RETURN':
        fromLoc = 'RETURNS';
        toLoc = location;
        break;
    }

    movements.push({
      id: `MOV${String(10000 + i).padStart(6, '0')}`,
      dateTime: `${date.toISOString().split('T')[0]} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      transactionType: transTypes[logTypeIdx],
      transactionId: `${transTypes[logTypeIdx]}${String(1000 + Math.floor(Math.random() * 9000)).padStart(5, '0')}`,
      location: location,
      product: product.id,
      productDescription: product.desc,
      fromLocation: fromLoc,
      toLocation: toLoc,
      quantity: Math.floor(Math.random() * 500) + 1,
      uom: 'EA',
      userId: users[Math.floor(Math.random() * users.length)],
      reference: Math.random() > 0.5 ? `PO-${Math.floor(Math.random() * 90000) + 10000}` : '',
      logType: logTypes[logTypeIdx],
    });
  }

  return movements.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
};

const MovementAuditLog: React.FC = () => {
  const [showCriteria, setShowCriteria] = useState(true);
  const [criteria, setCriteria] = useState<SearchCriteria>({
    distributionCenter: '8',
    warehouse: '1',
    fromDate: '',
    toDate: new Date().toISOString().split('T')[0],
    product: '',
    logType: 'ALL',
  });
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<MovementRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 15;

  const logTypeOptions = [
    { value: 'ALL', label: 'ALL' },
    { value: 'RECEIPT', label: 'Receipt' },
    { value: 'SHIPMENT', label: 'Shipment' },
    { value: 'TRANSFER', label: 'Transfer' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'CYCLE_COUNT', label: 'Cycle Count' },
    { value: 'RETURN', label: 'Return' },
  ];

  const handleSearch = async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    let results = generateDemoMovements();

    // Filter by date range
    if (criteria.fromDate) {
      results = results.filter(m => m.dateTime >= criteria.fromDate);
    }
    if (criteria.toDate) {
      results = results.filter(m => m.dateTime.split(' ')[0] <= criteria.toDate);
    }

    // Filter by product
    if (criteria.product) {
      const searchProduct = criteria.product.toLowerCase();
      results = results.filter(m =>
        m.product.toLowerCase().includes(searchProduct) ||
        m.productDescription.toLowerCase().includes(searchProduct)
      );
    }

    // Filter by log type
    if (criteria.logType !== 'ALL') {
      results = results.filter(m => m.logType === criteria.logType);
    }

    setMovements(results);
    setCurrentPage(1);
    setShowCriteria(false);
    setIsLoading(false);
  };

  const handleReset = () => {
    setCriteria({
      distributionCenter: '8',
      warehouse: '1',
      fromDate: '',
      toDate: new Date().toISOString().split('T')[0],
      product: '',
      logType: 'ALL',
    });
  };

  const getMovementIcon = (logType: string) => {
    switch (logType) {
      case 'RECEIPT':
      case 'RETURN':
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      case 'SHIPMENT':
        return <ArrowUp className="h-4 w-4 text-red-600" />;
      case 'TRANSFER':
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
      default:
        return <ArrowLeftRight className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogTypeColor = (logType: string) => {
    switch (logType) {
      case 'RECEIPT':
        return 'bg-green-100 text-green-800';
      case 'SHIPMENT':
        return 'bg-blue-100 text-blue-800';
      case 'TRANSFER':
        return 'bg-purple-100 text-purple-800';
      case 'ADJUSTMENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CYCLE_COUNT':
        return 'bg-orange-100 text-orange-800';
      case 'RETURN':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate summary stats
  const summaryStats = {
    totalRecords: movements.length,
    receipts: movements.filter(m => m.logType === 'RECEIPT').length,
    shipments: movements.filter(m => m.logType === 'SHIPMENT').length,
    transfers: movements.filter(m => m.logType === 'TRANSFER').length,
    adjustments: movements.filter(m => m.logType === 'ADJUSTMENT').length,
    totalQuantity: movements.reduce((sum, m) => sum + m.quantity, 0),
  };

  // Pagination
  const totalPages = Math.ceil(movements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = movements.slice(startIndex, startIndex + itemsPerPage);

  const exportToCSV = () => {
    const headers = ['Date/Time', 'Trans Type', 'Trans ID', 'Product', 'Description', 'From', 'To', 'Qty', 'UOM', 'User', 'Reference'];
    const rows = movements.map(m => [
      m.dateTime,
      m.transactionType,
      m.transactionId,
      m.product,
      m.productDescription,
      m.fromLocation,
      m.toLocation,
      m.quantity,
      m.uom,
      m.userId,
      m.reference,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movement_audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movement Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">MAL - Product Movement Browse | Tran: IBPMA</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
            Mode: FIND
          </span>
          <button
            onClick={() => setShowCriteria(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Search className="h-4 w-4" />
            Search Criteria
          </button>
          {movements.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Search Criteria Modal */}
      {showCriteria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-700">PRODUCT MOVEMENT BROWSE CRITERIA</h2>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span>Tran: IBPMA</span>
                  <span>Mode: FIND</span>
                </div>
              </div>
              <button onClick={() => setShowCriteria(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Center</label>
                  <input
                    type="text"
                    value={criteria.distributionCenter}
                    onChange={(e) => setCriteria({ ...criteria, distributionCenter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={criteria.warehouse}
                      onChange={(e) => setCriteria({ ...criteria, warehouse: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r hover:bg-gray-300">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={criteria.fromDate}
                    onChange={(e) => setCriteria({ ...criteria, fromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={criteria.toDate}
                    onChange={(e) => setCriteria({ ...criteria, toDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <input
                  type="text"
                  value={criteria.product}
                  onChange={(e) => setCriteria({ ...criteria, product: e.target.value })}
                  placeholder="Product ID or description"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Log Type</label>
                <div className="flex">
                  <button className="px-3 py-2 bg-gray-200 border border-r-0 border-gray-300 rounded-l hover:bg-gray-300">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <select
                    value={criteria.logType}
                    onChange={(e) => setCriteria({ ...criteria, logType: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r focus:ring-blue-500 focus:border-blue-500"
                  >
                    {logTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={() => setShowCriteria(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {isLoading ? 'Searching...' : 'Find'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {movements.length > 0 && (
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.totalRecords}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Receipts</p>
            <p className="text-2xl font-bold text-green-600">{summaryStats.receipts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Shipments</p>
            <p className="text-2xl font-bold text-blue-600">{summaryStats.shipments}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Transfers</p>
            <p className="text-2xl font-bold text-purple-600">{summaryStats.transfers}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Adjustments</p>
            <p className="text-2xl font-bold text-yellow-600">{summaryStats.adjustments}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Total Quantity</p>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.totalQuantity.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {movements.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trans ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedMovements.map((movement) => (
                  <tr
                    key={movement.id}
                    onClick={() => setSelectedMovement(movement)}
                    className="hover:bg-blue-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.logType)}
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getLogTypeColor(movement.logType)}`}>
                          {movement.transactionType}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{movement.dateTime}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{movement.transactionId}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{movement.product}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{movement.productDescription}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{movement.fromLocation}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{movement.toLocation}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{movement.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{movement.userId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{movement.reference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, movements.length)} of {movements.length} records
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Movement Records</h3>
          <p className="text-gray-500 mb-4">Use the search criteria to find product movement history.</p>
          <button
            onClick={() => setShowCriteria(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open Search Criteria
          </button>
        </div>
      )}

      {/* Movement Detail Modal */}
      {selectedMovement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getMovementIcon(selectedMovement.logType)}
                <h2 className="text-lg font-semibold">Movement Detail</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getLogTypeColor(selectedMovement.logType)}`}>
                  {selectedMovement.logType.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setSelectedMovement(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Movement ID</label>
                    <p className="text-lg font-mono">{selectedMovement.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
                    <p className="text-lg font-mono">{selectedMovement.transactionId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date/Time</label>
                    <p className="text-lg">{selectedMovement.dateTime}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">User</label>
                    <p className="text-lg">{selectedMovement.userId}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Product</label>
                    <p className="text-lg font-medium">{selectedMovement.product}</p>
                    <p className="text-sm text-gray-600">{selectedMovement.productDescription}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Quantity</label>
                    <p className="text-lg font-bold">{selectedMovement.quantity} {selectedMovement.uom}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Reference</label>
                    <p className="text-lg">{selectedMovement.reference || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Movement Flow */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500 mb-3">Movement Flow</label>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">From Location</p>
                    <p className="px-4 py-2 bg-white border border-gray-300 rounded font-mono text-lg">
                      {selectedMovement.fromLocation}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <ArrowLeftRight className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">To Location</p>
                    <p className="px-4 py-2 bg-white border border-gray-300 rounded font-mono text-lg">
                      {selectedMovement.toLocation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedMovement(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementAuditLog;
