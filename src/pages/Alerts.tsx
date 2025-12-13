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
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAlertList, useAlertCounts, useAcknowledgeAlert, type Alert } from '../hooks/useAlerts';

// Alert severity types (maps to API severity field)
const ALERT_SEVERITIES = [
  { id: 'CRITICAL', label: 'Critical', icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'ERROR', label: 'Error', icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'WARNING', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'INFO', label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-200' },
];

// Alert type categories (maps to API type field)
const ALERT_CATEGORIES = [
  { id: 'INVENTORY', label: 'Inventory', icon: Package },
  { id: 'ORDER', label: 'Order', icon: Package },
  { id: 'SHIPPING', label: 'Shipping', icon: Truck },
  { id: 'RECEIVING', label: 'Receiving', icon: Truck },
  { id: 'LABOR', label: 'Labor', icon: Users },
  { id: 'QUALITY', label: 'Quality', icon: CheckCircle },
  { id: 'SAFETY', label: 'Safety', icon: AlertTriangle },
  { id: 'SYSTEM', label: 'System', icon: RefreshCw },
];

// Mock alerts (fallback when API unavailable)
const mockAlerts: Alert[] = [
  {
    id: 'ALT-001',
    type: 'INVENTORY',
    severity: 'CRITICAL',
    title: 'Stock Out - SKU-10045',
    message: 'Primary pick location A-12-03 is empty. Replenishment required immediately.',
    status: 'NEW',
    referenceNumber: 'SKU-10045',
    createdAt: '2024-01-15T10:32:15Z',
    updatedAt: '2024-01-15T10:32:15Z',
  },
  {
    id: 'ALT-002',
    type: 'SHIPPING',
    severity: 'CRITICAL',
    title: 'Carrier Cutoff Approaching',
    message: 'UPS Ground cutoff in 30 minutes. 12 orders pending shipment.',
    status: 'NEW',
    referenceNumber: 'WAVE-001',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'ALT-003',
    type: 'INVENTORY',
    severity: 'WARNING',
    title: 'Low Stock Warning',
    message: 'SKU-20089 below minimum threshold (24 units remaining, min: 50)',
    status: 'NEW',
    referenceNumber: 'SKU-20089',
    createdAt: '2024-01-15T10:15:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
  },
  {
    id: 'ALT-004',
    type: 'RECEIVING',
    severity: 'WARNING',
    title: 'Overdue ASN',
    message: 'ASN-45821 from ABC Trucking is 2 hours overdue.',
    status: 'ACKNOWLEDGED',
    referenceNumber: 'ASN-45821',
    acknowledgedAt: '2024-01-15T09:30:00Z',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'ALT-005',
    type: 'LABOR',
    severity: 'INFO',
    title: 'Shift Change Reminder',
    message: 'Morning shift ends in 1 hour. 8 active pickers need to complete tasks.',
    status: 'NEW',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'ALT-006',
    type: 'SYSTEM',
    severity: 'WARNING',
    title: 'Forklift Maintenance Due',
    message: 'Forklift FL-003 scheduled maintenance overdue by 2 days.',
    status: 'ACKNOWLEDGED',
    referenceNumber: 'FL-003',
    acknowledgedAt: '2024-01-15T08:30:00Z',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'ALT-007',
    type: 'SHIPPING',
    severity: 'INFO',
    title: 'Wave Completed',
    message: 'WAVE-005 completed successfully. 52 orders shipped.',
    status: 'RESOLVED',
    referenceNumber: 'WAVE-005',
    resolvedAt: '2024-01-15T07:45:00Z',
    createdAt: '2024-01-15T07:30:00Z',
    updatedAt: '2024-01-15T07:45:00Z',
  },
  {
    id: 'ALT-008',
    type: 'SYSTEM',
    severity: 'CRITICAL',
    title: 'Integration Error',
    message: 'Connection to Descartes TMS failed. Retry in progress.',
    status: 'IN_PROGRESS',
    referenceNumber: 'INT-TMS',
    createdAt: '2024-01-15T10:28:00Z',
    updatedAt: '2024-01-15T10:28:00Z',
  },
];

export default function Alerts() {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Fetch alerts from API
  const { data: alertData, isLoading, error } = useAlertList({
    severity: filterSeverity !== 'all' ? filterSeverity : undefined,
    type: filterCategory !== 'all' ? filterCategory : undefined,
  });
  const { data: alertCounts } = useAlertCounts();
  const acknowledgeAlert = useAcknowledgeAlert();

  // Use API data with fallback to mock data
  const alerts: Alert[] = alertData?.data || mockAlerts;

  const getSeverityInfo = (severity: string) => ALERT_SEVERITIES.find(s => s.id === severity);
  const getCategoryInfo = (categoryId: string) => ALERT_CATEGORIES.find(c => c.id === categoryId);

  // Helper to check if alert is acknowledged
  const isAcknowledged = (alert: Alert) =>
    alert.status === 'ACKNOWLEDGED' || alert.status === 'RESOLVED' || alert.status === 'DISMISSED';

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesCategory = filterCategory === 'all' || alert.type === filterCategory;
    const matchesAck = showAcknowledged || !isAcknowledged(alert);
    return matchesSeverity && matchesCategory && matchesAck;
  });

  // Use API counts if available, otherwise calculate from alerts
  const criticalCount = alertCounts?.critical ?? alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'NEW').length;
  const warningCount = alertCounts?.bySeverity?.WARNING ?? alerts.filter(a => a.severity === 'WARNING' && a.status === 'NEW').length;
  const unacknowledgedCount = alertCounts?.unacknowledged ?? alerts.filter(a => a.status === 'NEW').length;

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts & Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor system alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
            <Settings className="w-4 h-4" />
            Alert Rules
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <CheckCircle className="w-4 h-4" />
            Acknowledge All
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading alerts...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>Unable to load from server. Showing demo data.</span>
        </div>
      )}

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
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Today</p>
              <p className="text-2xl font-bold text-blue-600">{alertCounts?.total ?? alerts.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Severities</option>
            {ALERT_SEVERITIES.map(severity => (
              <option key={severity.id} value={severity.id}>{severity.label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {ALERT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Show Acknowledged
          </label>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No alerts matching your filters</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const severityInfo = getSeverityInfo(alert.severity);
              const categoryInfo = getCategoryInfo(alert.type);
              const SeverityIcon = severityInfo?.icon || AlertCircle;
              const CategoryIcon = categoryInfo?.icon || Package;
              const acknowledged = isAcknowledged(alert);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                    acknowledged ? 'opacity-60' : ''
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg border ${severityInfo?.color}`}>
                      <SeverityIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                        {acknowledged && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            {alert.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <CategoryIcon className="w-3 h-3" />
                          {categoryInfo?.label || alert.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                        {alert.referenceNumber && (
                          <span className="flex items-center gap-1 font-mono">
                            <MapPin className="w-3 h-3" />
                            {alert.referenceNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    {!acknowledged && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(alert.id);
                        }}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const severityInfo = getSeverityInfo(selectedAlert.severity);
                  const SeverityIcon = severityInfo?.icon || AlertCircle;
                  return (
                    <div className={`p-2 rounded-lg border ${severityInfo?.color}`}>
                      <SeverityIcon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedAlert.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAlert.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Message</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getCategoryInfo(selectedAlert.type)?.label || selectedAlert.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Severity</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getSeverityInfo(selectedAlert.severity)?.label || selectedAlert.severity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedAlert.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedAlert.referenceNumber && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
                  <p className="font-mono text-blue-600">{selectedAlert.referenceNumber}</p>
                </div>
              )}

              {selectedAlert.assignedToName && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedAlert.assignedToName}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
              {!isAcknowledged(selectedAlert) && (
                <button
                  onClick={() => {
                    handleAcknowledge(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Acknowledge
                </button>
              )}
              {selectedAlert.referenceNumber && (
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
