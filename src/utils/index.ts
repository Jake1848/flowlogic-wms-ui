/**
 * Shared utilities barrel export
 */

// Date, time, and number formatters
export {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatCompactNumber,
  capitalize,
  truncate,
} from './formatters'

// Status color utilities
export {
  getStatusColors,
  getStatusBadgeClasses,
  mapStatusToType,
  getStatusColorsFromString,
  getPriorityColor,
  getTrendColor,
  colorVariants,
  type StatusType,
  type StatusColorConfig,
} from './statusColors'

// Mock data generators
export {
  SeededRandom,
  generateTimeSeriesData,
  generateMultiMetricData,
  mockPatterns,
  type TimeSeriesDataPoint,
  type MultiMetricDataPoint,
} from './dataGenerators'
