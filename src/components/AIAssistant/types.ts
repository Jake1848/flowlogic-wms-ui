import type { LucideIcon } from 'lucide-react'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  analysis?: AnalysisResult
  actions?: SuggestedAction[]
  isTyping?: boolean
  steps?: AnalysisStep[]
}

export interface AnalysisStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed'
  detail?: string
}

export interface AnalysisResult {
  type: 'investigation' | 'root_cause' | 'recommendation' | 'fix_applied' | 'monitoring'
  title: string
  findings: Finding[]
  confidence: number
  dataPoints: DataPoint[]
  timeline?: TimelineEvent[]
}

export interface TimelineEvent {
  time: string
  event: string
  type: 'transaction' | 'error' | 'adjustment' | 'system'
  user?: string
}

export interface Finding {
  id: string
  severity: 'critical' | 'warning' | 'info' | 'success'
  description: string
  source: string
  timestamp?: string
  relatedData?: Record<string, string>
}

export interface DataPoint {
  label: string
  value: string
  trend?: 'up' | 'down' | 'stable'
  icon: LucideIcon
  change?: string
}

export interface SuggestedAction {
  id: string
  title: string
  description: string
  type: 'auto_fix' | 'manual' | 'investigate' | 'prevent'
  status: 'pending' | 'running' | 'completed' | 'failed'
  impact: 'low' | 'medium' | 'high'
  eta?: string
  details?: string[]
}

export interface ProactiveAlert {
  id: string
  type: 'warning' | 'critical' | 'info' | 'prediction'
  title: string
  description: string
  timestamp: Date
  isRead: boolean
  actionRequired: boolean
  suggestedQuery?: string
  module: string
  metric?: {
    current: number
    threshold: number
    unit: string
  }
}

export interface ActionQueueItem {
  id: string
  action: SuggestedAction
  messageId: string
  queuedAt: Date
  priority: number
}

export interface ConversationSummary {
  id: string
  title: string
  preview: string
  timestamp: Date
  messageCount: number
}

export interface InsightCard {
  id: string
  title: string
  value: string
  change: number
  changeLabel: string
  trend: 'up' | 'down' | 'stable'
  icon: LucideIcon
  color: string
  sparkline?: number[]
}

export interface Prediction {
  id: string
  title: string
  probability: number
  impact: 'low' | 'medium' | 'high'
  timeframe: string
  description: string
  preventiveAction?: string
}

// WMS Data types
export interface InventoryDiscrepancy {
  id: string
  product: string
  productName: string
  location: string
  expected: number
  actual: number
  type: 'overage' | 'shortage'
  lastMovement: string
  movedBy: string
  movedByName: string
  fromLocation: string
  cost: number
  category: string
  vendor: string
}

export interface Transaction {
  id: string
  type: string
  product: string
  qty: number
  from: string
  to: string
  user: string
  userName: string
  time: string
  status: string
  note?: string
  reason?: string
  po?: string
}

export interface WMSSystemData {
  inventory: {
    totalItems: number
    totalValue: number
    turnoverRate: number
    accuracy: number
    discrepancies: InventoryDiscrepancy[]
    recentTransactions: Transaction[]
    hotItems: { product: string; name: string; velocity: string; picks: number }[]
  }
  receiving: {
    openPOs: number
    pendingASNs: number
    todayReceipts: number
    avgReceiveTime: number
    receiptsPerHour: number
    issues: any[]
    dockUtilization: any[]
  }
  shipping: {
    pendingOrders: number
    shippedToday: number
    lateOrders: number
    avgPickTime: number
    ordersPerHour: number
    waveInProgress: string
    carrierPerformance: any[]
    lateOrderDetails: any[]
  }
  labor: {
    activeUsers: number
    totalUsers: number
    productivity: number
    avgProductivity: number
    topPerformers: any[]
    lowPerformers: any[]
    attendance: {
      present: number
      absent: number
      late: number
      onBreak: number
    }
  }
  locations: {
    totalLocations: number
    emptyLocations: number
    fullLocations: number
    partialLocations: number
    utilizationRate: number
    problemLocations: any[]
    replenishmentNeeded: any[]
  }
  systemHealth: {
    status: string
    uptime: number
    lastSync: string
    pendingTasks: number
    errors: number
    warnings: number
    integrations: any[]
    recentAlerts: any[]
  }
  analytics: {
    dailyOrders: number[]
    dailyReceipts: number[]
    inventoryTrend: number[]
    errorRate: number[]
  }
}
