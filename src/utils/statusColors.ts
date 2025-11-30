/**
 * Shared status color utilities for consistent styling across the application
 */

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface StatusColorConfig {
  bg: string
  text: string
  border?: string
  darkBg?: string
  darkText?: string
}

const statusColorMap: Record<StatusType, StatusColorConfig> = {
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    darkBg: 'dark:bg-green-900/30',
    darkText: 'dark:text-green-300',
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    darkBg: 'dark:bg-yellow-900/30',
    darkText: 'dark:text-yellow-300',
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-300',
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-300',
  },
  neutral: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    darkBg: 'dark:bg-gray-700',
    darkText: 'dark:text-gray-300',
  },
}

/**
 * Get status color classes as a string
 */
export const getStatusColors = (status: StatusType, includeDark = true): string => {
  const config = statusColorMap[status]
  const classes = [config.bg, config.text]
  if (includeDark) {
    classes.push(config.darkBg ?? '', config.darkText ?? '')
  }
  return classes.filter(Boolean).join(' ')
}

/**
 * Get status badge classes (compact style for pills/badges)
 */
export const getStatusBadgeClasses = (status: StatusType): string => {
  return `px-2 py-1 text-xs font-medium rounded-full ${getStatusColors(status)}`
}

/**
 * Map common status strings to StatusType
 */
export const mapStatusToType = (status: string): StatusType => {
  const s = status.toLowerCase()

  // Success statuses
  if (['completed', 'active', 'approved', 'success', 'done', 'shipped', 'received', 'available', 'ok'].includes(s)) {
    return 'success'
  }

  // Warning statuses
  if (['pending', 'in_progress', 'processing', 'scheduled', 'warning', 'flagged', 'reserved', 'partial'].includes(s)) {
    return 'warning'
  }

  // Error statuses
  if (['failed', 'error', 'cancelled', 'rejected', 'critical', 'expired', 'overdue', 'maintenance'].includes(s)) {
    return 'error'
  }

  // Info statuses
  if (['info', 'new', 'draft', 'review', 'checked_in', 'loading', 'unloading', 'occupied'].includes(s)) {
    return 'info'
  }

  return 'neutral'
}

/**
 * Get color classes from a raw status string
 */
export const getStatusColorsFromString = (status: string, includeDark = true): string => {
  return getStatusColors(mapStatusToType(status), includeDark)
}

/**
 * Extended color utilities for specific use cases
 */
export const colorVariants = {
  // For priority levels
  priority: {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },

  // For variance/trend indicators
  trend: {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  },

  // For quantity indicators
  quantity: {
    low: 'text-red-600 dark:text-red-400',
    normal: 'text-gray-900 dark:text-gray-100',
    high: 'text-blue-600 dark:text-blue-400',
  },
}

export const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
  return colorVariants.priority[priority]
}

export const getTrendColor = (value: number): string => {
  if (value > 0) return colorVariants.trend.positive
  if (value < 0) return colorVariants.trend.negative
  return colorVariants.trend.neutral
}
