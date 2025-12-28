import { Package, Truck, Users, CheckCircle, AlertTriangle, RefreshCw, AlertCircle, Info } from 'lucide-react'

export interface AnomalyResult {
  success: boolean
  anomalies?: Array<{
    index: number
    value: number
    severity: string
    deviation: number
    detectedBy: string[]
    sku?: string
    locationCode?: string
    createdAt?: string
  }>
  summary?: {
    totalRecords: number
    anomalyCount: number
    anomalyRate: number
    severityBreakdown: Record<string, number>
    byDetectionMethod: Record<string, number>
  }
  error?: string
}

export interface PatternResult {
  success: boolean
  patterns?: {
    temporal?: Array<{
      pattern: string
      description: string
      confidence: number
    }>
    behavioral?: Array<{
      pattern: string
      description: string
      confidence: number
    }>
    correlation?: Array<{
      pattern: string
      description: string
      confidence: number
    }>
  }
  summary?: {
    totalPatterns: number
    significantPatterns: number
    recommendations: string[]
  }
  error?: string
}

export type AlertTab = 'alerts' | 'anomalies' | 'patterns'

export interface AlertSeverity {
  id: string
  label: string
  icon: typeof AlertCircle
  color: string
}

export interface AlertCategory {
  id: string
  label: string
  icon: typeof Package
}

export const ALERT_SEVERITIES: AlertSeverity[] = [
  { id: 'CRITICAL', label: 'Critical', icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'ERROR', label: 'Error', icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'WARNING', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'INFO', label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-200' },
]

export const ALERT_CATEGORIES: AlertCategory[] = [
  { id: 'INVENTORY', label: 'Inventory', icon: Package },
  { id: 'ORDER', label: 'Order', icon: Package },
  { id: 'SHIPPING', label: 'Shipping', icon: Truck },
  { id: 'RECEIVING', label: 'Receiving', icon: Truck },
  { id: 'LABOR', label: 'Labor', icon: Users },
  { id: 'QUALITY', label: 'Quality', icon: CheckCircle },
  { id: 'SAFETY', label: 'Safety', icon: AlertTriangle },
  { id: 'SYSTEM', label: 'System', icon: RefreshCw },
]

export const getSeverityInfo = (severity: string) => ALERT_SEVERITIES.find(s => s.id === severity)
export const getCategoryInfo = (categoryId: string) => ALERT_CATEGORIES.find(c => c.id === categoryId)

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}
