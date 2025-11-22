import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Filter,
  Settings,
  X,
  Package,
  Truck,
  MapPin,
  Users,
  RefreshCw
} from 'lucide-react';

// Alert types
const ALERT_TYPES = [
  { id: 'critical', label: 'Critical', icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'info', label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'success', label: 'Success', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
];

// Alert categories
const ALERT_CATEGORIES = [
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'receiving', label: 'Receiving', icon: Truck },
  { id: 'labor', label: 'Labor', icon: Users },
  { id: 'equipment', label: 'Equipment', icon: Settings },
  { id: 'system', label: 'System', icon: RefreshCw },
];

// Mock alerts
const mockAlerts = [
  {
    id: 'ALT-001',
    type: 'critical',
    category: 'inventory',
    title: 'Stock Out - SKU-10045',
    message: 'Primary pick location A-12-03 is empty. Replenishment required immediately.',
    timestamp: '2024-01-15 10:32:15',
    acknowledged: false,
    location: 'A-12-03',
    relatedId: 'SKU-10045'
  },
  {
    id: 'ALT-002',
    type: 'critical',
    category: 'shipping',
    title: 'Carrier Cutoff Approaching',
    message: 'UPS Ground cutoff in 30 minutes. 12 orders pending shipment.',
    timestamp: '2024-01-15 10:30:00',
    acknowledged: false,
    location: null,
    relatedId: 'WAVE-001'
  },
  {
    id: 'ALT-003',
    type: 'warning',
    category: 'inventory',
    title: 'Low Stock Warning',
    message: 'SKU-20089 below minimum threshold (24 units remaining, min: 50)',
    timestamp: '2024-01-15 10:15:00',
    acknowledged: false,
    location: 'B-05-08',
    relatedId: 'SKU-20089'
  },
  {
    id: 'ALT-004',
    type: 'warning',
    category: 'receiving',
    title: 'Overdue ASN',
    message: 'ASN-45821 from ABC Trucking is 2 hours overdue.',
    timestamp: '2024-01-15 09:00:00',
    acknowledged: true,
    location: 'D-01',
    relatedId: 'ASN-45821'
  },
  {
    id: 'ALT-005',
    type: 'info',
    category: 'labor',
    title: 'Shift Change Reminder',
    message: 'Morning shift ends in 1 hour. 8 active pickers need to complete tasks.',
    timestamp: '2024-01-15 10:00:00',
    acknowledged: false,
    location: null,
    relatedId: null
  },
  {
    id: 'ALT-006',
    type: 'warning',
    category: 'equipment',
    title: 'Forklift Maintenance Due',
    message: 'Forklift FL-003 scheduled maintenance overdue by 2 days.',
    timestamp: '2024-01-15 08:00:00',
    acknowledged: true,
    location: 'Maintenance Bay',
    relatedId: 'FL-003'
  },
  {
    id: 'ALT-007',
    type: 'success',
    category: 'shipping',
    title: 'Wave Completed',
    message: 'WAVE-005 completed successfully. 52 orders shipped.',
    timestamp: '2024-01-15 07:45:00',
    acknowledged: true,
    location: null,
    relatedId: 'WAVE-005'
  },
  {
    id: 'ALT-008',
    type: 'critical',
    category: 'system',
    title: 'Integration Error',
    message: 'Connection to Descartes TMS failed. Retry in progress.',
    timestamp: '2024-01-15 10:28:00',
    acknowledged: false,
    location: null,
    relatedId: 'INT-TMS'
  },
];

export default function Alerts() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<typeof mockAlerts[0] | null>(null);

  const getAlertTypeInfo = (typeId: string) => ALERT_TYPES.find(t => t.id === typeId);
  const getCategoryInfo = (categoryId: string) => ALERT_CATEGORIES.find(c => c.id === categoryId);

  const filteredAlerts = mockAlerts.filter(alert => {
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesCategory = filterCategory === 'all' || alert.category === filterCategory;
    const matchesAck = showAcknowledged || !alert.acknowledged;
    return matchesType && matchesCategory && matchesAck;
  });

  const criticalCount = mockAlerts.filter(a => a.type === 'critical' && !a.acknowledged).length;
  const warningCount = mockAlerts.filter(a => a.type === 'warning' && !a.acknowledged).length;
  const unacknowledgedCount = mockAlerts.filter(a => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-500 mt-1">Monitor system alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Settings className="w-4 h-4" />
            Alert Rules
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <CheckCircle className="w-4 h-4" />
            Acknowledge All
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
              <p className="text-sm text-gray-500">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
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
              <p className="text-sm text-gray-500">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
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
              <p className="text-sm text-gray-500">Unacknowledged</p>
              <p className="text-2xl font-bold text-gray-900">{unacknowledgedCount}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Bell className="w-6 h-6 text-gray-600" />
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
              <p className="text-sm text-gray-500">Total Today</p>
              <p className="text-2xl font-bold text-blue-600">{mockAlerts.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filter:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            {ALERT_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {ALERT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show Acknowledged
          </label>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No alerts matching your filters</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const typeInfo = getAlertTypeInfo(alert.type);
              const categoryInfo = getCategoryInfo(alert.category);
              const TypeIcon = typeInfo?.icon || AlertCircle;
              const CategoryIcon = categoryInfo?.icon || Package;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg border ${typeInfo?.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        {alert.acknowledged && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CategoryIcon className="w-3 h-3" />
                          {categoryInfo?.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                        {alert.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alert.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Acknowledge action
                        }}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const typeInfo = getAlertTypeInfo(selectedAlert.type);
                  const TypeIcon = typeInfo?.icon || AlertCircle;
                  return (
                    <div className={`p-2 rounded-lg border ${typeInfo?.color}`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedAlert.title}</h2>
                  <p className="text-sm text-gray-500">{selectedAlert.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Message</p>
                <p className="text-gray-700">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium">{getCategoryInfo(selectedAlert.category)?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium">{getAlertTypeInfo(selectedAlert.type)?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Timestamp</p>
                  <p className="font-medium">{selectedAlert.timestamp}</p>
                </div>
                {selectedAlert.location && (
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-mono">{selectedAlert.location}</p>
                  </div>
                )}
              </div>

              {selectedAlert.relatedId && (
                <div>
                  <p className="text-xs text-gray-500">Related ID</p>
                  <p className="font-mono text-blue-600">{selectedAlert.relatedId}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {!selectedAlert.acknowledged && (
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Acknowledge
                </button>
              )}
              {selectedAlert.relatedId && (
                <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  View Related
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
