/**
 * Get severity-based color classes
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'text-red-400 bg-red-500/10 border-red-500/30'
    case 'warning':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    case 'success':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    default:
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  }
}

/**
 * Get impact-based color classes
 */
export const getImpactColor = (impact: string): string => {
  switch (impact) {
    case 'high':
      return 'bg-red-500/20 text-red-400'
    case 'medium':
      return 'bg-amber-500/20 text-amber-400'
    default:
      return 'bg-emerald-500/20 text-emerald-400'
  }
}

/**
 * Format a date as a relative time string
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return `${Math.floor(diffMins / 1440)}d ago`
}
