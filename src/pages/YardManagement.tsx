import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  MapPin,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Package,
  RefreshCw
} from 'lucide-react';

// Yard spots configuration
const YARD_LAYOUT = {
  rows: ['A', 'B', 'C', 'D', 'E'],
  spotsPerRow: 10
};

// Trailer statuses
const TRAILER_STATUSES = [
  { id: 'empty', label: 'Empty', color: 'bg-gray-100 border-gray-300' },
  { id: 'loaded', label: 'Loaded', color: 'bg-green-100 border-green-300' },
  { id: 'unloading', label: 'Unloading', color: 'bg-blue-100 border-blue-300' },
  { id: 'loading', label: 'Loading', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'sealed', label: 'Sealed', color: 'bg-purple-100 border-purple-300' },
  { id: 'hold', label: 'On Hold', color: 'bg-red-100 border-red-300' },
];

// Mock trailers in yard
const mockTrailers = [
  {
    id: 'TR-5521',
    carrier: 'ABC Trucking',
    type: 'dry_van',
    status: 'loaded',
    spot: 'A-03',
    arrivalTime: '2024-01-15 06:30',
    contents: 'Inbound - PO-45821, PO-45822',
    sealNumber: 'SL-789456',
    dock: null,
    driverPhone: '555-0123'
  },
  {
    id: 'TR-8842',
    carrier: 'UPS Freight',
    type: 'dry_van',
    status: 'loading',
    spot: null,
    arrivalTime: '2024-01-15 08:00',
    contents: 'Outbound - ORD-78521, ORD-78522',
    sealNumber: null,
    dock: 'D-06',
    driverPhone: '555-0789'
  },
  {
    id: 'TR-2234',
    carrier: 'Fast Freight',
    type: 'reefer',
    status: 'sealed',
    spot: 'B-07',
    arrivalTime: '2024-01-15 05:45',
    contents: 'Outbound - ORD-78510 (Temperature Controlled)',
    sealNumber: 'SL-456123',
    dock: null,
    temperature: '34°F',
    driverPhone: '555-0456'
  },
  {
    id: 'TR-9901',
    carrier: 'Regional Express',
    type: 'dry_van',
    status: 'empty',
    spot: 'C-02',
    arrivalTime: '2024-01-15 07:15',
    contents: 'Empty - Available for loading',
    sealNumber: null,
    dock: null,
    driverPhone: '555-0321'
  },
  {
    id: 'TR-4455',
    carrier: 'National Carriers',
    type: 'flatbed',
    status: 'hold',
    spot: 'D-05',
    arrivalTime: '2024-01-14 16:00',
    contents: 'Inbound - PO-45800 (Customs Hold)',
    sealNumber: 'SL-111222',
    dock: null,
    holdReason: 'Customs clearance pending',
    driverPhone: '555-0654'
  },
  {
    id: 'TR-7788',
    carrier: 'Swift Transport',
    type: 'dry_van',
    status: 'unloading',
    spot: null,
    arrivalTime: '2024-01-15 09:30',
    contents: 'Inbound - PO-45830',
    sealNumber: null,
    dock: 'D-03',
    driverPhone: '555-0987'
  },
];

// Generate yard spots with trailers
const generateYardSpots = () => {
  const spots: Record<string, typeof mockTrailers[0] | null> = {};
  YARD_LAYOUT.rows.forEach(row => {
    for (let i = 1; i <= YARD_LAYOUT.spotsPerRow; i++) {
      const spotId = `${row}-${String(i).padStart(2, '0')}`;
      const trailer = mockTrailers.find(t => t.spot === spotId);
      spots[spotId] = trailer || null;
    }
  });
  return spots;
};

export default function YardManagement() {
  const [selectedTrailer, setSelectedTrailer] = useState<typeof mockTrailers[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const yardSpots = generateYardSpots();

  const getStatusColor = (status: string) => {
    const statusInfo = TRAILER_STATUSES.find(s => s.id === status);
    return statusInfo?.color || 'bg-gray-100 border-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const statusInfo = TRAILER_STATUSES.find(s => s.id === status);
    return statusInfo?.label || status;
  };

  const getTrailerTypeIcon = (type: string) => {
    switch (type) {
      case 'dry_van': return '🚛';
      case 'reefer': return '❄️';
      case 'flatbed': return '🛻';
      default: return '🚚';
    }
  };

  const filteredTrailers = mockTrailers.filter(trailer => {
    const matchesSearch =
      trailer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trailer.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || trailer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const trailersAtDock = mockTrailers.filter(t => t.dock !== null);
  const trailersInYard = mockTrailers.filter(t => t.spot !== null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yard Management</h1>
          <p className="text-gray-500 mt-1">Track trailers and manage yard spot assignments</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Truck className="w-4 h-4" />
            Check In Trailer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total in Yard</p>
              <p className="text-2xl font-bold text-gray-900">{trailersInYard.length}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Truck className="w-6 h-6 text-gray-600" />
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
              <p className="text-sm text-gray-500">At Dock</p>
              <p className="text-2xl font-bold text-blue-600">{trailersAtDock.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-500">Loaded/Sealed</p>
              <p className="text-2xl font-bold text-green-600">
                {mockTrailers.filter(t => t.status === 'loaded' || t.status === 'sealed').length}
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
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Empty</p>
              <p className="text-2xl font-bold text-gray-600">
                {mockTrailers.filter(t => t.status === 'empty').length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Truck className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">On Hold</p>
              <p className="text-2xl font-bold text-red-600">
                {mockTrailers.filter(t => t.status === 'hold').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Yard Map */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-medium text-gray-900 mb-4">Yard Layout</h3>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          {TRAILER_STATUSES.map(status => (
            <div key={status.id} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 ${status.color}`}></div>
              <span className="text-gray-600">{status.label}</span>
            </div>
          ))}
        </div>

        {/* Yard Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {YARD_LAYOUT.rows.map(row => (
              <div key={row} className="flex items-center gap-2 mb-2">
                <div className="w-8 font-bold text-gray-500">{row}</div>
                <div className="flex gap-1">
                  {Array.from({ length: YARD_LAYOUT.spotsPerRow }, (_, i) => {
                    const spotId = `${row}-${String(i + 1).padStart(2, '0')}`;
                    const trailer = yardSpots[spotId];
                    return (
                      <button
                        key={spotId}
                        onClick={() => trailer && setSelectedTrailer(trailer)}
                        className={`w-14 h-10 rounded border-2 text-xs font-medium transition-all ${
                          trailer
                            ? `${getStatusColor(trailer.status)} hover:ring-2 hover:ring-blue-400`
                            : 'bg-white border-dashed border-gray-300 text-gray-400 hover:border-gray-400'
                        } ${selectedTrailer?.id === trailer?.id ? 'ring-2 ring-blue-500' : ''}`}
                        title={trailer ? `${trailer.id} - ${trailer.carrier}` : `Spot ${spotId}`}
                      >
                        {trailer ? trailer.id.slice(-4) : spotId.slice(-2)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dock Area */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">Dock Doors</h4>
          <div className="flex gap-2">
            {['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06', 'D-07', 'D-08'].map(dock => {
              const trailer = mockTrailers.find(t => t.dock === dock);
              return (
                <div
                  key={dock}
                  className={`w-16 h-12 rounded border-2 flex flex-col items-center justify-center text-xs ${
                    trailer
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <span className="font-medium">{dock}</span>
                  {trailer && <span className="text-blue-600">{trailer.id.slice(-4)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trailer List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trailers..."
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
                {TRAILER_STATUSES.map(status => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTrailers.map((trailer) => (
            <div
              key={trailer.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                selectedTrailer?.id === trailer.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedTrailer(trailer)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{getTrailerTypeIcon(trailer.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{trailer.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(trailer.status)}`}>
                        {getStatusLabel(trailer.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{trailer.carrier}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {trailer.dock ? `Dock: ${trailer.dock}` : trailer.spot ? `Spot: ${trailer.spot}` : 'Unassigned'}
                  </p>
                  <p className="text-gray-500 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {trailer.arrivalTime}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{trailer.contents}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trailer Detail Modal */}
      {selectedTrailer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getTrailerTypeIcon(selectedTrailer.type)}</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedTrailer.id}</h2>
                  <p className="text-gray-500">{selectedTrailer.carrier}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedTrailer.status)}`}>
                {getStatusLabel(selectedTrailer.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium">
                  {selectedTrailer.dock ? `Dock ${selectedTrailer.dock}` : selectedTrailer.spot || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Arrival Time</p>
                <p className="font-medium">{selectedTrailer.arrivalTime}</p>
              </div>
              {selectedTrailer.sealNumber && (
                <div>
                  <p className="text-xs text-gray-500">Seal Number</p>
                  <p className="font-mono font-medium">{selectedTrailer.sealNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Driver Phone</p>
                <p className="font-medium">{selectedTrailer.driverPhone}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500">Contents</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{selectedTrailer.contents}</p>
            </div>

            {selectedTrailer.status === 'hold' && selectedTrailer.holdReason && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Hold Reason:</strong> {selectedTrailer.holdReason}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTrailer(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Move Trailer
              </button>
              {selectedTrailer.spot && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Assign to Dock
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
