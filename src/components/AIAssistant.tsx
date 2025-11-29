import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot,
  X,
  Send,
  Sparkles,
  Search,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Package,
  MapPin,
  TruckIcon,
  Users,
  BarChart3,
  Zap,
  Clock,
  ArrowRight,
  Play,
  Eye,
  Mic,
  MicOff,
  History,
  Lightbulb,
  Target,
  Activity,
  AlertCircle,
  Shield,
  FileSearch,
  Workflow,
  BrainCircuit,
  Bell,
  Filter,
  ChevronRight,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  Layers,
  Boxes,
  AlertOctagon,
  Timer,
  MessageSquare,
  Wifi,
  WifiOff,
} from 'lucide-react'
import * as aiService from '../services/aiService'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  analysis?: AnalysisResult
  actions?: SuggestedAction[]
  isTyping?: boolean
  steps?: AnalysisStep[]
}

interface AnalysisStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed'
  detail?: string
}

interface AnalysisResult {
  type: 'investigation' | 'root_cause' | 'recommendation' | 'fix_applied' | 'monitoring'
  title: string
  findings: Finding[]
  confidence: number
  dataPoints: DataPoint[]
  timeline?: TimelineEvent[]
}

interface TimelineEvent {
  time: string
  event: string
  type: 'transaction' | 'error' | 'adjustment' | 'system'
  user?: string
}

interface Finding {
  id: string
  severity: 'critical' | 'warning' | 'info' | 'success'
  description: string
  source: string
  timestamp?: string
  relatedData?: Record<string, string>
}

interface DataPoint {
  label: string
  value: string
  trend?: 'up' | 'down' | 'stable'
  icon: any
  change?: string
}

interface SuggestedAction {
  id: string
  title: string
  description: string
  type: 'auto_fix' | 'manual' | 'investigate' | 'prevent'
  status: 'pending' | 'running' | 'completed' | 'failed'
  impact: 'low' | 'medium' | 'high'
  eta?: string
  details?: string[]
}

interface ProactiveAlert {
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

interface ActionQueueItem {
  id: string
  action: SuggestedAction
  messageId: string
  queuedAt: Date
  priority: number
}

interface ConversationSummary {
  id: string
  title: string
  preview: string
  timestamp: Date
  messageCount: number
}

interface InsightCard {
  id: string
  title: string
  value: string
  change: number
  changeLabel: string
  trend: 'up' | 'down' | 'stable'
  icon: any
  color: string
  sparkline?: number[]
}

interface Prediction {
  id: string
  title: string
  probability: number
  impact: 'low' | 'medium' | 'high'
  timeframe: string
  description: string
  preventiveAction?: string
}

// Comprehensive WMS data simulation
const wmsSystemData = {
  inventory: {
    totalItems: 45892,
    totalValue: 12450000,
    turnoverRate: 4.2,
    accuracy: 98.7,
    discrepancies: [
      {
        id: 'DISC001',
        product: '287561',
        productName: 'VICKS VAL TWR W4',
        location: 'SA1474A',
        expected: 48,
        actual: 52,
        type: 'overage',
        lastMovement: '2025-11-26 14:32:00',
        movedBy: 'JSMITH',
        movedByName: 'John Smith',
        fromLocation: 'E481587',
        cost: 23.50,
        category: 'Health & Beauty',
        vendor: 'Procter & Gamble'
      },
      {
        id: 'DISC002',
        product: '713902',
        productName: 'Tylenol Extra Strength',
        location: 'E481587',
        expected: 24,
        actual: 20,
        type: 'shortage',
        lastMovement: '2025-11-26 10:15:00',
        movedBy: 'MWILSON',
        movedByName: 'Mary Wilson',
        fromLocation: 'RECV01',
        cost: 18.99,
        category: 'Health & Beauty',
        vendor: 'Johnson & Johnson'
      },
      {
        id: 'DISC003',
        product: '649288',
        productName: 'Advil Liquid Gels',
        location: 'F010101',
        expected: 100,
        actual: 98,
        type: 'shortage',
        lastMovement: '2025-11-25 16:45:00',
        movedBy: 'SYSTEM',
        movedByName: 'System Auto',
        fromLocation: 'SA1589A',
        cost: 15.49,
        category: 'Health & Beauty',
        vendor: 'Pfizer'
      },
    ],
    recentTransactions: [
      { id: 'TXN001', type: 'PUTAWAY', product: '287561', qty: 4, from: 'E481587', to: 'SA1474A', user: 'JSMITH', userName: 'John Smith', time: '2025-11-26 14:32:00', status: 'completed' },
      { id: 'TXN002', type: 'PICK', product: '287561', qty: 0, from: 'SA1474A', to: 'SHIP01', user: 'JSMITH', userName: 'John Smith', time: '2025-11-26 14:30:00', status: 'cancelled', note: 'Pick cancelled - wrong location' },
      { id: 'TXN003', type: 'ADJUSTMENT', product: '287561', qty: 4, from: 'SA1474A', to: 'SA1474A', user: 'SYSTEM', userName: 'System', time: '2025-11-26 08:00:00', status: 'completed', reason: 'Cycle count correction' },
      { id: 'TXN004', type: 'RECEIVE', product: '287561', qty: 52, from: 'DOCK01', to: 'E481587', user: 'KLEE', userName: 'Kevin Lee', time: '2025-11-26 09:00:00', status: 'completed', po: 'PO-2025-1234' },
      { id: 'TXN005', type: 'PUTAWAY', product: '287561', qty: 48, from: 'E481587', to: 'SA1474A', user: 'JSMITH', userName: 'John Smith', time: '2025-11-26 09:45:00', status: 'completed' },
    ],
    hotItems: [
      { product: '287561', name: 'VICKS VAL TWR W4', velocity: 'A', picks: 145 },
      { product: '445566', name: 'Band-Aid Flexible', velocity: 'A', picks: 132 },
      { product: '778899', name: 'Neosporin Original', velocity: 'A', picks: 98 },
    ]
  },
  receiving: {
    openPOs: 23,
    pendingASNs: 8,
    todayReceipts: 156,
    avgReceiveTime: 45,
    receiptsPerHour: 18,
    issues: [
      {
        id: 'RCV001',
        type: 'OVER_RECEIVE',
        po: 'PO-2025-1234',
        product: '287561',
        productName: 'VICKS VAL TWR W4',
        expected: 48,
        received: 52,
        time: '2025-11-26 09:00:00',
        receiver: 'KLEE',
        receiverName: 'Kevin Lee',
        dock: 'DOCK01',
        carrier: 'FedEx Freight',
        vendor: 'Procter & Gamble'
      }
    ],
    dockUtilization: [
      { dock: 'DOCK01', status: 'active', carrier: 'FedEx', arrival: '08:30', departure: '10:00' },
      { dock: 'DOCK02', status: 'idle', carrier: null, arrival: null, departure: null },
      { dock: 'DOCK03', status: 'active', carrier: 'UPS', arrival: '09:15', departure: '11:30' },
    ]
  },
  shipping: {
    pendingOrders: 342,
    shippedToday: 1205,
    lateOrders: 12,
    avgPickTime: 3.2,
    ordersPerHour: 85,
    waveInProgress: 'WAVE-2025-1126-003',
    carrierPerformance: [
      { carrier: 'FedEx', onTime: 96.5, volume: 450 },
      { carrier: 'UPS', onTime: 94.2, volume: 380 },
      { carrier: 'USPS', onTime: 91.8, volume: 275 },
    ],
    lateOrderDetails: [
      { order: 'ORD-98765', customer: 'ABC Corp', priority: 'rush', delay: '2h 15m', reason: 'Stock shortage' },
      { order: 'ORD-98770', customer: 'XYZ Inc', priority: 'standard', delay: '45m', reason: 'Picking backlog' },
    ]
  },
  labor: {
    activeUsers: 45,
    totalUsers: 52,
    productivity: 94.2,
    avgProductivity: 89.5,
    topPerformers: [
      { user: 'JSMITH', name: 'John Smith', picks: 245, accuracy: 99.2, productivity: 112 },
      { user: 'MWILSON', name: 'Mary Wilson', picks: 232, accuracy: 98.8, productivity: 108 },
      { user: 'KLEE', name: 'Kevin Lee', picks: 198, accuracy: 99.5, productivity: 105 },
    ],
    lowPerformers: [
      { user: 'TNGUYEN', name: 'Tom Nguyen', picks: 89, accuracy: 94.2, productivity: 72, issue: 'New hire - training' },
    ],
    attendance: {
      present: 45,
      absent: 3,
      late: 2,
      onBreak: 2
    }
  },
  locations: {
    totalLocations: 12500,
    emptyLocations: 2340,
    fullLocations: 8920,
    partialLocations: 1240,
    utilizationRate: 81.3,
    problemLocations: [
      { location: 'SA1474A', issue: 'Capacity exceeded', currentQty: 52, maxQty: 48, product: '287561' },
      { location: 'B2-15-03', issue: 'Blocked access', currentQty: 0, maxQty: 100, reason: 'Forklift maintenance' },
    ],
    replenishmentNeeded: [
      { location: 'SA1589A', product: '445566', current: 5, min: 20, max: 100 },
      { location: 'SA1590B', product: '778899', current: 8, min: 15, max: 80 },
    ]
  },
  systemHealth: {
    status: 'healthy',
    uptime: 99.97,
    lastSync: '2025-11-26 15:30:00',
    pendingTasks: 23,
    errors: 0,
    warnings: 3,
    integrations: [
      { name: 'ERP', status: 'connected', lastSync: '2025-11-26 15:29:00' },
      { name: 'TMS', status: 'connected', lastSync: '2025-11-26 15:28:00' },
      { name: 'E-Commerce', status: 'connected', lastSync: '2025-11-26 15:30:00' },
    ],
    recentAlerts: [
      { time: '14:45', message: 'High order volume detected', severity: 'warning' },
      { time: '12:30', message: 'Cycle count completed - Zone A', severity: 'info' },
    ]
  },
  analytics: {
    dailyOrders: [1150, 1200, 1180, 1250, 1205],
    dailyReceipts: [140, 155, 148, 162, 156],
    inventoryTrend: [45500, 45650, 45780, 45820, 45892],
    errorRate: [0.8, 0.6, 0.5, 0.7, 0.4],
  }
}

// Initial proactive alerts
const initialAlerts: ProactiveAlert[] = [
  {
    id: 'alert-1',
    type: 'critical',
    title: 'Inventory Discrepancy Detected',
    description: 'Product 287561 shows +4 unit overage at location SA1474A',
    timestamp: new Date(Date.now() - 15 * 60000),
    isRead: false,
    actionRequired: true,
    suggestedQuery: 'Investigate overage for product 287561',
    module: 'Inventory Control',
    metric: { current: 52, threshold: 48, unit: 'units' }
  },
  {
    id: 'alert-2',
    type: 'warning',
    title: 'Late Orders Increasing',
    description: '12 orders now exceed SLA threshold, up from 8 an hour ago',
    timestamp: new Date(Date.now() - 45 * 60000),
    isRead: false,
    actionRequired: true,
    suggestedQuery: 'Why are there late orders?',
    module: 'Shipping',
    metric: { current: 12, threshold: 5, unit: 'orders' }
  },
  {
    id: 'alert-3',
    type: 'prediction',
    title: 'Replenishment Needed Soon',
    description: 'Location SA1589A will run out of stock in ~2 hours based on pick velocity',
    timestamp: new Date(Date.now() - 30 * 60000),
    isRead: false,
    actionRequired: false,
    suggestedQuery: 'Show replenishment needs',
    module: 'Inventory Control'
  }
]

// AI Predictions
const aiPredictions: Prediction[] = [
  {
    id: 'pred-1',
    title: 'Order Surge Expected',
    probability: 87,
    impact: 'high',
    timeframe: 'Next 4 hours',
    description: 'Based on historical patterns and current trends, expect 40% higher order volume',
    preventiveAction: 'Consider calling in additional pickers'
  },
  {
    id: 'pred-2',
    title: 'Dock Congestion Risk',
    probability: 72,
    impact: 'medium',
    timeframe: 'Next 2 hours',
    description: '3 carriers scheduled to arrive within 30-minute window',
    preventiveAction: 'Stagger dock appointments or prep additional receiving staff'
  },
  {
    id: 'pred-3',
    title: 'Inventory Stockout Risk',
    probability: 65,
    impact: 'medium',
    timeframe: 'Next 24 hours',
    description: 'Product 445566 (Band-Aid Flexible) may stockout based on current velocity',
    preventiveAction: 'Expedite inbound PO or allocate safety stock'
  }
]

// Insight cards for dashboard
const insightCards: InsightCard[] = [
  {
    id: 'ins-1',
    title: 'Order Fulfillment Rate',
    value: '96.2%',
    change: 2.1,
    changeLabel: 'vs yesterday',
    trend: 'up',
    icon: TruckIcon,
    color: 'from-emerald-500 to-teal-500',
    sparkline: [94, 95, 94.5, 95.8, 96.2]
  },
  {
    id: 'ins-2',
    title: 'Inventory Accuracy',
    value: '98.7%',
    change: -0.3,
    changeLabel: 'vs last week',
    trend: 'down',
    icon: Package,
    color: 'from-blue-500 to-indigo-500',
    sparkline: [99, 98.9, 98.8, 98.7, 98.7]
  },
  {
    id: 'ins-3',
    title: 'Labor Productivity',
    value: '94.2%',
    change: 4.7,
    changeLabel: 'vs average',
    trend: 'up',
    icon: Users,
    color: 'from-violet-500 to-purple-500',
    sparkline: [89, 91, 92, 93, 94.2]
  },
  {
    id: 'ins-4',
    title: 'Avg Pick Time',
    value: '3.2min',
    change: -8.5,
    changeLabel: 'improvement',
    trend: 'up',
    icon: Timer,
    color: 'from-amber-500 to-orange-500',
    sparkline: [3.8, 3.6, 3.5, 3.3, 3.2]
  }
]

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Flow, your intelligent warehouse assistant. I have complete visibility into all operations and can investigate issues, find root causes, and execute fixes automatically. What can I help you with today?",
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'alerts'>('chat')
  const [alerts, setAlerts] = useState<ProactiveAlert[]>(initialAlerts)
  const [actionQueue, setActionQueue] = useState<ActionQueueItem[]>([])
  const [conversationHistory] = useState<ConversationSummary[]>([
    { id: 'conv-1', title: 'Inventory Investigation', preview: 'Investigated overage for product 287561...', timestamp: new Date(Date.now() - 3600000), messageCount: 8 },
    { id: 'conv-2', title: 'Labor Analysis', preview: 'Reviewed team performance metrics...', timestamp: new Date(Date.now() - 7200000), messageCount: 5 },
    { id: 'conv-3', title: 'Shipping Issues', preview: 'Resolved late order backlog...', timestamp: new Date(Date.now() - 86400000), messageCount: 12 },
  ])
  const [showPredictions, setShowPredictions] = useState(false)
  const [filterAlertType, setFilterAlertType] = useState<'all' | 'critical' | 'warning' | 'prediction'>('all')
  const [isConnected, setIsConnected] = useState(false)
  const [useStreaming] = useState(true) // Streaming enabled by default
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const unreadAlertCount = alerts.filter(a => !a.isRead).length

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const health = await aiService.checkHealth()
      setIsConnected(health.status === 'healthy' && health.anthropicConfigured)
    }
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // Keyboard shortcut to open AI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Simulated real-time alert generation
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add a new alert occasionally (for demo purposes)
      if (Math.random() > 0.95) {
        const newAlertTypes: ProactiveAlert[] = [
          {
            id: `alert-${Date.now()}`,
            type: 'warning',
            title: 'Pick Rate Declining',
            description: 'Zone B pick rate dropped 15% in the last hour',
            timestamp: new Date(),
            isRead: false,
            actionRequired: true,
            suggestedQuery: 'Why is pick rate declining in Zone B?',
            module: 'Labor Management'
          },
          {
            id: `alert-${Date.now()}`,
            type: 'info',
            title: 'Wave Completed',
            description: 'WAVE-2025-1126-003 completed with 98.5% accuracy',
            timestamp: new Date(),
            isRead: false,
            actionRequired: false,
            module: 'Shipping'
          },
          {
            id: `alert-${Date.now()}`,
            type: 'prediction',
            title: 'Capacity Warning',
            description: 'Zone A reaching 90% capacity, consider rebalancing',
            timestamp: new Date(),
            isRead: false,
            actionRequired: false,
            suggestedQuery: 'Show Zone A capacity details',
            module: 'Location Management'
          }
        ]
        const randomAlert = newAlertTypes[Math.floor(Math.random() * newAlertTypes.length)]
        setAlerts(prev => [randomAlert, ...prev].slice(0, 10))
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a))
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const handleAlertAction = (alert: ProactiveAlert) => {
    if (alert.suggestedQuery) {
      setInput(alert.suggestedQuery)
      setActiveTab('chat')
      markAlertAsRead(alert.id)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const queueAction = (action: SuggestedAction, messageId: string) => {
    const queueItem: ActionQueueItem = {
      id: `queue-${Date.now()}`,
      action,
      messageId,
      queuedAt: new Date(),
      priority: action.impact === 'high' ? 1 : action.impact === 'medium' ? 2 : 3
    }
    setActionQueue(prev => [...prev, queueItem].sort((a, b) => a.priority - b.priority))
  }

  const removeFromQueue = (queueId: string) => {
    setActionQueue(prev => prev.filter(q => q.id !== queueId))
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const filteredAlerts = alerts.filter(a => filterAlertType === 'all' || a.type === filterAlertType)

  const simulateAnalysisSteps = async (steps: string[]): Promise<AnalysisStep[]> => {
    const analysisSteps: AnalysisStep[] = steps.map((label, i) => ({
      id: `step-${i}`,
      label,
      status: 'pending' as const
    }))

    for (let i = 0; i < analysisSteps.length; i++) {
      analysisSteps[i].status = 'running'
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last.isTyping) {
          return [...prev.slice(0, -1), { ...last, steps: [...analysisSteps] }]
        }
        return prev
      })
      await new Promise(resolve => setTimeout(resolve, 600))
      analysisSteps[i].status = 'completed'
      analysisSteps[i].detail = `✓ Found ${Math.floor(Math.random() * 10) + 1} records`
    }

    return analysisSteps
  }

  const analyzeQuery = async (query: string): Promise<{ response: string; analysis?: AnalysisResult; actions?: SuggestedAction[] }> => {
    const lowerQuery = query.toLowerCase()

    // Simulate analysis steps
    const steps = [
      'Scanning transaction logs',
      'Analyzing inventory records',
      'Checking receiving data',
      'Correlating user actions',
      'Building timeline',
    ]

    await simulateAnalysisSteps(steps)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Overage/discrepancy analysis
    if (lowerQuery.includes('overage') || lowerQuery.includes('discrepancy') || lowerQuery.includes('287561') || lowerQuery.includes('more than expected') || lowerQuery.includes('extra')) {
      const discrepancy = wmsSystemData.inventory.discrepancies[0]
      const receivingIssue = wmsSystemData.receiving.issues[0]
      const transactions = wmsSystemData.inventory.recentTransactions.filter(t => t.product === '287561')

      return {
        response: `I've completed a deep investigation of the inventory overage for product ${discrepancy.product} (${discrepancy.productName}) at location ${discrepancy.location}. I traced the issue through ${transactions.length} transactions and found the root cause.`,
        analysis: {
          type: 'root_cause',
          title: `Root Cause Analysis: ${discrepancy.productName}`,
          confidence: 96,
          findings: [
            {
              id: '1',
              severity: 'critical',
              description: `Over-receipt on ${receivingIssue.po}: Received ${receivingIssue.received} units instead of ${receivingIssue.expected} expected (+${receivingIssue.received - receivingIssue.expected} units)`,
              source: 'Receiving Module',
              timestamp: receivingIssue.time,
              relatedData: {
                'Receiver': `${receivingIssue.receiverName} (${receivingIssue.receiver})`,
                'Dock': receivingIssue.dock,
                'Carrier': receivingIssue.carrier,
                'Vendor': receivingIssue.vendor
              }
            },
            {
              id: '2',
              severity: 'warning',
              description: `Putaway of excess units: ${transactions[0].userName} moved all ${receivingIssue.received} units to select location instead of staging overage`,
              source: 'Inventory Transactions',
              timestamp: transactions[0].time
            },
            {
              id: '3',
              severity: 'info',
              description: `Prior cycle count adjustment added 4 units - this may be a duplicate correction that compounded the error`,
              source: 'Cycle Count History',
              timestamp: '2025-11-26 08:00:00'
            },
            {
              id: '4',
              severity: 'warning',
              description: `Location ${discrepancy.location} is over capacity: ${discrepancy.actual}/${wmsSystemData.locations.problemLocations[0].maxQty} units (${Math.round((discrepancy.actual/wmsSystemData.locations.problemLocations[0].maxQty)*100)}% full)`,
              source: 'Location Management'
            }
          ],
          dataPoints: [
            { label: 'Expected Qty', value: discrepancy.expected.toString(), icon: Package },
            { label: 'Actual Qty', value: discrepancy.actual.toString(), trend: 'up', icon: Package, change: `+${discrepancy.actual - discrepancy.expected}` },
            { label: 'Value Impact', value: `$${((discrepancy.actual - discrepancy.expected) * discrepancy.cost).toFixed(2)}`, icon: BarChart3 },
            { label: 'Last Activity', value: '14:32', icon: Clock },
          ],
          timeline: [
            { time: '09:00', event: `PO-2025-1234 received at ${receivingIssue.dock} - 52 units (expected 48)`, type: 'transaction', user: receivingIssue.receiverName },
            { time: '09:45', event: 'Full quantity putaway to SA1474A', type: 'transaction', user: 'John Smith' },
            { time: '08:00', event: 'Cycle count adjustment +4 units', type: 'adjustment', user: 'System' },
            { time: '14:30', event: 'Pick cancelled - wrong location flagged', type: 'error', user: 'John Smith' },
            { time: '14:32', event: 'Additional putaway attempt - location over capacity', type: 'error', user: 'John Smith' },
          ]
        },
        actions: [
          {
            id: 'a1',
            title: 'Create Inventory Adjustment',
            description: `Adjust inventory from ${discrepancy.actual} to ${discrepancy.expected} units with full audit documentation`,
            type: 'auto_fix',
            status: 'pending',
            impact: 'medium',
            eta: '< 1 min',
            details: [
              'Create adjustment record ADJ-2025-XXXX',
              `Reduce quantity by ${discrepancy.actual - discrepancy.expected} units`,
              'Link to root cause: Over-receipt on PO-2025-1234',
              'Notify inventory control team'
            ]
          },
          {
            id: 'a2',
            title: 'Move Excess to Reserve',
            description: `Transfer ${discrepancy.actual - discrepancy.expected} units to available reserve location E481590`,
            type: 'auto_fix',
            status: 'pending',
            impact: 'low',
            eta: '< 1 min',
            details: [
              'Identify best reserve location (E481590 available)',
              `Create transfer task for ${discrepancy.actual - discrepancy.expected} units`,
              'Update inventory in both locations',
              'Resolve capacity warning on SA1474A'
            ]
          },
          {
            id: 'a3',
            title: 'Flag Receiving Issue',
            description: 'Create quality alert for over-receipt pattern with vendor Procter & Gamble',
            type: 'auto_fix',
            status: 'pending',
            impact: 'low',
            details: [
              'Log receiving discrepancy against PO-2025-1234',
              'Alert receiving supervisor',
              'Add to vendor scorecard',
              'Suggest process review'
            ]
          },
          {
            id: 'a4',
            title: 'Prevent Future Occurrences',
            description: 'Update receiving validation rules to require overage approval',
            type: 'prevent',
            status: 'pending',
            impact: 'medium',
            details: [
              'Add tolerance check (>5% requires approval)',
              'Update putaway logic to stage overages',
              'Create alert rule for this vendor/product'
            ]
          }
        ]
      }
    }

    // Shortage analysis
    if (lowerQuery.includes('shortage') || lowerQuery.includes('missing') || lowerQuery.includes('less than') || lowerQuery.includes('can\'t find')) {
      const shortage = wmsSystemData.inventory.discrepancies[1]
      return {
        response: `I've investigated the inventory shortage for product ${shortage.product} (${shortage.productName}). Here's my complete analysis:`,
        analysis: {
          type: 'root_cause',
          title: `Shortage Investigation: ${shortage.productName}`,
          confidence: 89,
          findings: [
            {
              id: '1',
              severity: 'critical',
              description: `Missing ${shortage.expected - shortage.actual} units at location ${shortage.location}`,
              source: 'Inventory Balance',
              relatedData: {
                'Product': `${shortage.productName} (${shortage.product})`,
                'Location': shortage.location,
                'Category': shortage.category
              }
            },
            {
              id: '2',
              severity: 'warning',
              description: `Last putaway by ${shortage.movedByName} from ${shortage.fromLocation} - quantity may have been short`,
              source: 'Transaction History',
              timestamp: shortage.lastMovement
            },
            {
              id: '3',
              severity: 'info',
              description: 'No picks recorded from this location in last 24 hours - not a picking error',
              source: 'Pick History'
            },
            {
              id: '4',
              severity: 'info',
              description: 'Checking adjacent locations for misplaced inventory...',
              source: 'Location Scanner'
            }
          ],
          dataPoints: [
            { label: 'Expected', value: shortage.expected.toString(), icon: Package },
            { label: 'Actual', value: shortage.actual.toString(), trend: 'down', icon: Package, change: `-${shortage.expected - shortage.actual}` },
            { label: 'Value Impact', value: `$${((shortage.expected - shortage.actual) * shortage.cost).toFixed(2)}`, icon: BarChart3 },
          ],
          timeline: [
            { time: '10:15', event: 'Putaway completed from receiving', type: 'transaction', user: shortage.movedByName },
            { time: '10:00', event: 'Receiving completed - qty verified at dock', type: 'transaction', user: 'Kevin Lee' },
          ]
        },
        actions: [
          {
            id: 'a1',
            title: 'Initiate Cycle Count',
            description: 'Create immediate cycle count task for this location and product',
            type: 'auto_fix',
            status: 'pending',
            impact: 'low',
            eta: 'Immediate'
          },
          {
            id: 'a2',
            title: 'Scan Adjacent Locations',
            description: 'Check E481585, E481586, E481588, E481589 for misplaced product',
            type: 'auto_fix',
            status: 'pending',
            impact: 'low',
            eta: '< 2 min'
          },
          {
            id: 'a3',
            title: 'Review Receiving Records',
            description: 'Verify received quantity against ASN and packing slip',
            type: 'investigate',
            status: 'pending',
            impact: 'medium'
          }
        ]
      }
    }

    // Status/overview
    if (lowerQuery.includes('status') || lowerQuery.includes('overview') || lowerQuery.includes('how are we') || lowerQuery.includes('doing')) {
      return {
        response: `Here's your real-time warehouse performance overview. I'm tracking ${wmsSystemData.inventory.totalItems.toLocaleString()} items across ${wmsSystemData.locations.totalLocations.toLocaleString()} locations.`,
        analysis: {
          type: 'monitoring',
          title: 'Warehouse Operations Dashboard',
          confidence: 100,
          findings: [
            {
              id: '1',
              severity: 'info',
              description: `Orders: ${wmsSystemData.shipping.pendingOrders} pending, ${wmsSystemData.shipping.shippedToday.toLocaleString()} shipped today (${wmsSystemData.shipping.ordersPerHour}/hr)`,
              source: 'Shipping Module'
            },
            {
              id: '2',
              severity: wmsSystemData.shipping.lateOrders > 10 ? 'warning' : 'info',
              description: `${wmsSystemData.shipping.lateOrders} late orders requiring attention`,
              source: 'Order Management',
              relatedData: wmsSystemData.shipping.lateOrders > 0 ? {
                'Top Priority': wmsSystemData.shipping.lateOrderDetails[0]?.order || 'None',
                'Reason': wmsSystemData.shipping.lateOrderDetails[0]?.reason || 'N/A'
              } : undefined
            },
            {
              id: '3',
              severity: wmsSystemData.labor.productivity >= 90 ? 'success' : 'warning',
              description: `${wmsSystemData.labor.activeUsers}/${wmsSystemData.labor.totalUsers} active associates, ${wmsSystemData.labor.productivity}% productivity`,
              source: 'Labor Management'
            },
            {
              id: '4',
              severity: wmsSystemData.inventory.discrepancies.length > 2 ? 'warning' : 'info',
              description: `${wmsSystemData.inventory.discrepancies.length} inventory discrepancies, ${wmsSystemData.inventory.accuracy}% accuracy`,
              source: 'Inventory Control'
            },
            {
              id: '5',
              severity: 'info',
              description: `Receiving: ${wmsSystemData.receiving.todayReceipts} receipts today, ${wmsSystemData.receiving.openPOs} open POs`,
              source: 'Receiving Module'
            }
          ],
          dataPoints: [
            { label: 'Active Users', value: wmsSystemData.labor.activeUsers.toString(), icon: Users, change: `/${wmsSystemData.labor.totalUsers}` },
            { label: 'Productivity', value: `${wmsSystemData.labor.productivity}%`, trend: 'up', icon: Zap },
            { label: 'Orders Shipped', value: wmsSystemData.shipping.shippedToday.toLocaleString(), icon: TruckIcon },
            { label: 'Pending Tasks', value: wmsSystemData.systemHealth.pendingTasks.toString(), icon: Clock },
            { label: 'System Health', value: `${wmsSystemData.systemHealth.uptime}%`, trend: 'stable', icon: Activity },
            { label: 'Location Util', value: `${wmsSystemData.locations.utilizationRate}%`, icon: MapPin },
          ]
        },
        actions: [
          {
            id: 'a1',
            title: 'Prioritize Late Orders',
            description: `Reprioritize ${wmsSystemData.shipping.lateOrders} late orders for immediate picking`,
            type: 'auto_fix',
            status: 'pending',
            impact: 'high',
            eta: 'Immediate'
          },
          {
            id: 'a2',
            title: 'Auto-Resolve Discrepancies',
            description: `Fix ${wmsSystemData.inventory.discrepancies.filter(d => d.type === 'overage').length} overage issues automatically`,
            type: 'auto_fix',
            status: 'pending',
            impact: 'medium'
          },
          {
            id: 'a3',
            title: 'Generate Replenishment Tasks',
            description: `Create ${wmsSystemData.locations.replenishmentNeeded.length} replenishment tasks for low stock locations`,
            type: 'auto_fix',
            status: 'pending',
            impact: 'medium'
          }
        ]
      }
    }

    // Fix/repair
    if (lowerQuery.includes('fix') || lowerQuery.includes('repair') || lowerQuery.includes('resolve') || lowerQuery.includes('correct') || lowerQuery.includes('auto')) {
      return {
        response: `I've identified all issues that can be safely auto-corrected. Here's my remediation plan:`,
        analysis: {
          type: 'fix_applied',
          title: 'Automated Remediation Plan',
          confidence: 95,
          findings: [
            {
              id: '1',
              severity: 'warning',
              description: `${wmsSystemData.inventory.discrepancies.length} inventory discrepancies to resolve`,
              source: 'Inventory Control'
            },
            {
              id: '2',
              severity: 'warning',
              description: `${wmsSystemData.locations.problemLocations.length} location issues to address`,
              source: 'Location Management'
            },
            {
              id: '3',
              severity: 'info',
              description: `${wmsSystemData.locations.replenishmentNeeded.length} replenishment tasks needed`,
              source: 'Replenishment Engine'
            }
          ],
          dataPoints: [
            { label: 'Issues Found', value: (wmsSystemData.inventory.discrepancies.length + wmsSystemData.locations.problemLocations.length).toString(), icon: AlertTriangle },
            { label: 'Auto-Fixable', value: (wmsSystemData.inventory.discrepancies.length).toString(), icon: Wrench },
            { label: 'Need Review', value: '1', icon: Eye },
          ]
        },
        actions: [
          {
            id: 'a1',
            title: 'Execute All Safe Fixes',
            description: 'Apply all low/medium risk corrections with full audit trail',
            type: 'auto_fix',
            status: 'pending',
            impact: 'medium',
            eta: '< 2 min',
            details: [
              'Correct 3 inventory discrepancies',
              'Resolve 1 location capacity issue',
              'Generate 2 replenishment tasks',
              'Update all affected records'
            ]
          },
          {
            id: 'a2',
            title: 'Generate Remediation Report',
            description: 'Create detailed PDF report of all actions for supervisor review',
            type: 'auto_fix',
            status: 'pending',
            impact: 'low'
          }
        ]
      }
    }

    // Labor/productivity questions
    if (lowerQuery.includes('labor') || lowerQuery.includes('productivity') || lowerQuery.includes('worker') || lowerQuery.includes('team') || lowerQuery.includes('performance')) {
      return {
        response: `Here's your workforce analysis. I'm tracking ${wmsSystemData.labor.totalUsers} team members with ${wmsSystemData.labor.activeUsers} currently active.`,
        analysis: {
          type: 'recommendation',
          title: 'Labor Performance Analysis',
          confidence: 100,
          findings: [
            {
              id: '1',
              severity: 'success',
              description: `Top performer: ${wmsSystemData.labor.topPerformers[0].name} with ${wmsSystemData.labor.topPerformers[0].picks} picks and ${wmsSystemData.labor.topPerformers[0].accuracy}% accuracy`,
              source: 'Labor Management'
            },
            {
              id: '2',
              severity: 'info',
              description: `Team productivity at ${wmsSystemData.labor.productivity}% (${(wmsSystemData.labor.productivity - wmsSystemData.labor.avgProductivity).toFixed(1)}% above average)`,
              source: 'Performance Metrics'
            },
            {
              id: '3',
              severity: wmsSystemData.labor.lowPerformers.length > 0 ? 'warning' : 'info',
              description: wmsSystemData.labor.lowPerformers.length > 0 ?
                `${wmsSystemData.labor.lowPerformers[0].name} needs attention: ${wmsSystemData.labor.lowPerformers[0].issue}` :
                'All team members meeting performance targets',
              source: 'Performance Tracking'
            },
            {
              id: '4',
              severity: 'info',
              description: `Attendance: ${wmsSystemData.labor.attendance.present} present, ${wmsSystemData.labor.attendance.absent} absent, ${wmsSystemData.labor.attendance.late} late`,
              source: 'Time & Attendance'
            }
          ],
          dataPoints: [
            { label: 'Active', value: `${wmsSystemData.labor.activeUsers}/${wmsSystemData.labor.totalUsers}`, icon: Users },
            { label: 'Productivity', value: `${wmsSystemData.labor.productivity}%`, trend: 'up', icon: Zap },
            { label: 'Avg Picks/Hr', value: '52', icon: Target },
            { label: 'Accuracy', value: '98.4%', trend: 'stable', icon: CheckCircle },
          ]
        },
        actions: [
          {
            id: 'a1',
            title: 'Send Kudos to Top Performers',
            description: 'Automatically recognize top 3 performers with performance badges',
            type: 'auto_fix',
            status: 'pending',
            impact: 'low'
          },
          {
            id: 'a2',
            title: 'Schedule Coaching Session',
            description: `Create coaching reminder for ${wmsSystemData.labor.lowPerformers[0]?.name || 'underperforming team members'}`,
            type: 'manual',
            status: 'pending',
            impact: 'medium'
          }
        ]
      }
    }

    // Default response
    return {
      response: `I understand you're asking about "${query}". I have full access to your warehouse operations. Here's what I can help you with:`,
      analysis: {
        type: 'recommendation',
        title: 'AI Capabilities',
        confidence: 100,
        findings: [
          { id: '1', severity: 'info', description: '🔍 Investigate inventory discrepancies and find root causes', source: 'Inventory Control' },
          { id: '2', severity: 'info', description: '📦 Analyze receiving issues and over/under receipts', source: 'Receiving Module' },
          { id: '3', severity: 'info', description: '🚚 Track shipping delays and optimize fulfillment', source: 'Shipping Module' },
          { id: '4', severity: 'info', description: '👥 Monitor labor productivity and performance', source: 'Labor Management' },
          { id: '5', severity: 'info', description: '📍 Optimize locations and slotting', source: 'Location Management' },
          { id: '6', severity: 'info', description: '🔧 Auto-fix issues and apply corrections', source: 'Remediation Engine' },
        ],
        dataPoints: [
          { label: 'Items', value: wmsSystemData.inventory.totalItems.toLocaleString(), icon: Package },
          { label: 'Locations', value: wmsSystemData.locations.totalLocations.toLocaleString(), icon: MapPin },
          { label: 'Users', value: wmsSystemData.labor.totalUsers.toString(), icon: Users },
          { label: 'System', value: wmsSystemData.systemHealth.status, icon: Activity },
        ]
      }
    }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsProcessing(true)

    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
      steps: []
    }
    setMessages(prev => [...prev, typingMessage])

    // Try backend API if connected, otherwise fall back to local analysis
    if (isConnected) {
      try {
        if (useStreaming) {
          // Streaming mode
          let fullContent = ''
          await aiService.streamMessage(currentInput, sessionId, {
            onText: (text) => {
              fullContent += text
              setMessages(prev => {
                const filtered = prev.filter(m => m.id !== 'typing')
                return [...filtered, {
                  id: 'streaming',
                  role: 'assistant',
                  content: fullContent,
                  timestamp: new Date(),
                  isTyping: true,
                }]
              })
            },
            onToolStart: (tool) => {
              setMessages(prev => {
                const last = prev[prev.length - 1]
                if (last.id === 'streaming' || last.id === 'typing') {
                  return [...prev.slice(0, -1), {
                    ...last,
                    steps: [...(last.steps || []), { id: tool, label: `Using ${tool}...`, status: 'running' as const }]
                  }]
                }
                return prev
              })
            },
            onToolExecuting: () => {
              // Tool is executing
            },
            onDone: () => {
              setMessages(prev => {
                const filtered = prev.filter(m => m.id !== 'typing' && m.id !== 'streaming')
                return [...filtered, {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: fullContent,
                  timestamp: new Date(),
                }]
              })
              setIsProcessing(false)
            },
            onError: (error) => {
              console.error('Stream error:', error)
              // Fall back to local analysis
              fallbackToLocalAnalysis(currentInput)
            }
          })
          return
        } else {
          // Non-streaming mode
          const result = await aiService.sendMessage(currentInput, sessionId)
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== 'typing')
            return [...filtered, {
              id: Date.now().toString(),
              role: 'assistant',
              content: result.response,
              timestamp: new Date(),
            }]
          })
          setIsProcessing(false)
          return
        }
      } catch (error) {
        console.error('API error:', error)
        // Fall back to local analysis
      }
    }

    // Fallback to local analysis
    await fallbackToLocalAnalysis(currentInput)
  }, [input, isProcessing, isConnected, useStreaming, sessionId])

  const fallbackToLocalAnalysis = async (query: string) => {
    try {
      const result = await analyzeQuery(query)

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing' && m.id !== 'streaming')
        return [...filtered, {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
          analysis: result.analysis,
          actions: result.actions,
        }]
      })
    } catch {
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing' && m.id !== 'streaming')
        return [...filtered, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I encountered an issue while analyzing. Please try again.',
          timestamp: new Date(),
        }]
      })
    }
    setIsProcessing(false)
  }

  const executeAction = async (messageId: string, actionId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.actions) {
        return {
          ...msg,
          actions: msg.actions.map(action =>
            action.id === actionId ? { ...action, status: 'running' as const } : action
          )
        }
      }
      return msg
    }))

    await new Promise(resolve => setTimeout(resolve, 2000))

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.actions) {
        return {
          ...msg,
          actions: msg.actions.map(action =>
            action.id === actionId ? { ...action, status: 'completed' as const } : action
          )
        }
      }
      return msg
    }))

    const action = messages.find(m => m.id === messageId)?.actions?.find(a => a.id === actionId)
    if (action) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `✅ ${action.title} - Completed successfully`,
        timestamp: new Date(),
      }])
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-400'
      case 'medium': return 'bg-amber-500/20 text-amber-400'
      default: return 'bg-emerald-500/20 text-emerald-400'
    }
  }

  const quickPrompts = [
    { icon: Search, label: 'Investigate overage', prompt: 'What\'s causing the inventory overage for product 287561?' },
    { icon: BarChart3, label: 'System status', prompt: 'Show me the warehouse status overview' },
    { icon: Wrench, label: 'Auto-fix issues', prompt: 'Fix all inventory discrepancies' },
    { icon: Users, label: 'Labor report', prompt: 'How is the team performing today?' },
    { icon: AlertTriangle, label: 'Find shortages', prompt: 'Are there any inventory shortages?' },
    { icon: TruckIcon, label: 'Late orders', prompt: 'Why are there late orders?' },
  ]

  // Mini sparkline component
  const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(' ')
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-8" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
      </svg>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center text-white hover:scale-110 transition-all duration-200 z-50 group"
      >
        <Bot className="w-6 h-6" />
        {unreadAlertCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            {unreadAlertCount}
          </span>
        )}
        <span className="absolute -top-2 -left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3" />
        </span>
        <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          <div className="font-medium">Flow Assistant</div>
          <div className="text-xs text-gray-400">Ctrl+J to toggle</div>
          {unreadAlertCount > 0 && (
            <div className="text-xs text-red-400 mt-1">{unreadAlertCount} unread alerts</div>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isExpanded
        ? 'inset-4'
        : isMinimized
          ? 'bottom-6 right-6 w-80'
          : 'bottom-6 right-6 w-[520px]'
    }`}>
      <div className={`bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col ${isExpanded ? 'h-full' : ''}`} style={{ height: isMinimized ? 'auto' : isExpanded ? '100%' : '650px' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center relative">
              <BrainCircuit className="w-5 h-5 text-white" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-violet-600 ${isConnected ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                Flow
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs flex items-center gap-1">
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      Pro
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      Offline
                    </>
                  )}
                </span>
              </h3>
              <p className="text-xs text-white/70">
                {isConnected ? 'Full AI capabilities active' : 'Limited mode'} • Auto-fix enabled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-[-45deg]" />}
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'chat'
                    ? 'text-white border-b-2 border-violet-500 bg-gray-800/50'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'insights'
                    ? 'text-white border-b-2 border-violet-500 bg-gray-800/50'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <PieChart className="w-4 h-4" />
                Insights
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${
                  activeTab === 'alerts'
                    ? 'text-white border-b-2 border-violet-500 bg-gray-800/50'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <Bell className="w-4 h-4" />
                Alerts
                {unreadAlertCount > 0 && (
                  <span className="absolute top-2 right-4 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {unreadAlertCount}
                  </span>
                )}
              </button>
            </div>

            {/* Chat Tab Content */}
            {activeTab === 'chat' && (
              <>
                {/* Quick Actions */}
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(prompt.prompt); inputRef.current?.focus() }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 whitespace-nowrap transition-colors flex-shrink-0"
                      >
                        <prompt.icon className="w-3 h-3" />
                        {prompt.label}
                      </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  {message.role === 'user' ? (
                    <div className="max-w-[85%] bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-lg">
                      {message.content}
                    </div>
                  ) : message.role === 'system' ? (
                    <div className="text-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        {message.content}
                      </span>
                    </div>
                  ) : message.isTyping ? (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm inline-block">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Analyzing system data...</span>
                          </div>
                        </div>
                        {message.steps && message.steps.length > 0 && (
                          <div className="space-y-1 pl-2">
                            {message.steps.map((step) => (
                              <div key={step.id} className="flex items-center gap-2 text-xs">
                                {step.status === 'completed' ? (
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                ) : step.status === 'running' ? (
                                  <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-gray-600" />
                                )}
                                <span className={step.status === 'completed' ? 'text-gray-400' : step.status === 'running' ? 'text-violet-400' : 'text-gray-600'}>
                                  {step.label}
                                </span>
                                {step.detail && <span className="text-gray-600">{step.detail}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm text-gray-200 text-sm">
                            {message.content}
                          </div>

                          {/* Analysis Results */}
                          {message.analysis && (
                            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
                                <div className="flex items-center gap-2">
                                  <FileSearch className="w-4 h-4 text-violet-400" />
                                  <span className="font-medium text-white text-sm">{message.analysis.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full">
                                    {message.analysis.confidence}% confidence
                                  </span>
                                </div>
                              </div>

                              {/* Data Points */}
                              {message.analysis.dataPoints.length > 0 && (
                                <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-gray-700 bg-gray-900/50">
                                  {message.analysis.dataPoints.map((dp, i) => {
                                    const Icon = dp.icon
                                    return (
                                      <div key={i} className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <Icon className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs text-gray-500 truncate">{dp.label}</p>
                                          <div className="flex items-center gap-1">
                                            <p className={`text-sm font-semibold ${dp.trend === 'up' ? 'text-red-400' : dp.trend === 'down' ? 'text-amber-400' : 'text-white'}`}>
                                              {dp.value}
                                            </p>
                                            {dp.change && (
                                              <span className={`text-xs ${dp.trend === 'up' ? 'text-red-400' : dp.trend === 'down' ? 'text-amber-400' : 'text-gray-500'}`}>
                                                {dp.change}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Timeline */}
                              {message.analysis.timeline && message.analysis.timeline.length > 0 && (
                                <div className="px-4 py-3 border-b border-gray-700">
                                  <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                                    <History className="w-3 h-3" /> Event Timeline
                                  </p>
                                  <div className="space-y-2">
                                    {message.analysis.timeline.slice(0, 4).map((event, i) => (
                                      <div key={i} className="flex items-start gap-2 text-xs">
                                        <span className="text-gray-500 w-12 flex-shrink-0">{event.time}</span>
                                        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                          event.type === 'error' ? 'bg-red-400' :
                                          event.type === 'adjustment' ? 'bg-amber-400' :
                                          'bg-blue-400'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                          <span className="text-gray-300">{event.event}</span>
                                          {event.user && <span className="text-gray-500 ml-1">- {event.user}</span>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Findings */}
                              <div className="p-3 space-y-2">
                                {message.analysis.findings.map((finding) => (
                                  <div
                                    key={finding.id}
                                    className={`px-3 py-2.5 rounded-lg border ${getSeverityColor(finding.severity)}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      {finding.severity === 'critical' ? (
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      ) : finding.severity === 'warning' ? (
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      ) : finding.severity === 'success' ? (
                                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      ) : (
                                        <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm">{finding.description}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs opacity-70 flex-wrap">
                                          <span>{finding.source}</span>
                                          {finding.timestamp && (
                                            <>
                                              <span>•</span>
                                              <span>{finding.timestamp}</span>
                                            </>
                                          )}
                                        </div>
                                        {finding.relatedData && (
                                          <div className="mt-2 p-2 bg-black/20 rounded text-xs space-y-1">
                                            {Object.entries(finding.relatedData).map(([key, value]) => (
                                              <div key={key} className="flex justify-between">
                                                <span className="text-gray-500">{key}:</span>
                                                <span className="text-gray-300">{value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggested Actions */}
                          {message.actions && message.actions.length > 0 && (
                            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
                                <div className="flex items-center gap-2">
                                  <Workflow className="w-4 h-4 text-emerald-400" />
                                  <span className="font-medium text-white text-sm">Suggested Actions</span>
                                </div>
                                <button
                                  onClick={() => {
                                    message.actions?.filter(a => a.status === 'pending' && a.type === 'auto_fix')
                                      .forEach(a => executeAction(message.id, a.id))
                                  }}
                                  className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                >
                                  Execute All
                                </button>
                              </div>
                              <div className="p-3 space-y-2">
                                {message.actions.map((action) => (
                                  <div
                                    key={action.id}
                                    className="px-3 py-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-white text-sm">{action.title}</span>
                                          <span className={`text-xs px-1.5 py-0.5 rounded ${getImpactColor(action.impact)}`}>
                                            {action.impact}
                                          </span>
                                          {action.eta && (
                                            <span className="text-xs text-gray-500">{action.eta}</span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{action.description}</p>
                                        {action.details && action.status === 'pending' && (
                                          <div className="mt-2 space-y-1">
                                            {action.details.map((detail, i) => (
                                              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                                                <div className="w-1 h-1 rounded-full bg-gray-600" />
                                                {detail}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-shrink-0">
                                        {action.status === 'pending' && (action.type === 'auto_fix' || action.type === 'prevent') && (
                                          <button
                                            onClick={() => executeAction(message.id, action.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                                          >
                                            <Play className="w-3 h-3" />
                                            Execute
                                          </button>
                                        )}
                                        {action.status === 'pending' && action.type === 'investigate' && (
                                          <button
                                            onClick={() => executeAction(message.id, action.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                                          >
                                            <Search className="w-3 h-3" />
                                            Investigate
                                          </button>
                                        )}
                                        {action.status === 'pending' && action.type === 'manual' && (
                                          <div className="flex gap-1">
                                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors">
                                              <Eye className="w-3 h-3" />
                                              Review
                                            </button>
                                            <button
                                              onClick={() => queueAction(action, message.id)}
                                              className="flex items-center gap-1.5 px-2 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-medium rounded-lg transition-colors"
                                              title="Add to queue"
                                            >
                                              <Clock className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                        {action.status === 'running' && (
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 text-amber-400 text-xs rounded-lg">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Running...
                                          </div>
                                        )}
                                        {action.status === 'completed' && (
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 text-xs rounded-lg">
                                            <CheckCircle className="w-3 h-3" />
                                            Done
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsListening(!isListening)}
                      className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything... investigate issues, request fixes, get insights"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:outline-none"
                      disabled={isProcessing}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isProcessing}
                      className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg shadow-violet-500/25"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Full system access enabled
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Ctrl</kbd>
                      <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">J</kbd>
                      to toggle
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Insights Tab Content */}
            {activeTab === 'insights' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {insightCards.map((card) => {
                    const Icon = card.icon
                    return (
                      <div
                        key={card.id}
                        className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          {card.sparkline && (
                            <Sparkline
                              data={card.sparkline}
                              color={card.trend === 'up' ? '#10b981' : card.trend === 'down' ? '#ef4444' : '#6b7280'}
                            />
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-2xl font-bold text-white">{card.value}</p>
                          <p className="text-xs text-gray-400 mt-1">{card.title}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {card.trend === 'up' ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                          ) : card.trend === 'down' ? (
                            <ArrowDownRight className="w-3 h-3 text-red-400" />
                          ) : (
                            <Minus className="w-3 h-3 text-gray-400" />
                          )}
                          <span className={`text-xs ${
                            card.trend === 'up' ? 'text-emerald-400' :
                            card.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {card.change > 0 ? '+' : ''}{card.change}% {card.changeLabel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Predictions Section */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setShowPredictions(!showPredictions)}
                    className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span className="font-medium text-sm">AI Predictions</span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        {aiPredictions.length} active
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showPredictions ? 'rotate-90' : ''}`} />
                  </button>

                  {showPredictions && (
                    <div className="p-3 border-t border-gray-700 space-y-2">
                      {aiPredictions.map((pred) => (
                        <div
                          key={pred.id}
                          className="p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm">{pred.title}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getImpactColor(pred.impact)}`}>
                                  {pred.impact}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{pred.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {pred.timeframe}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="text-lg font-bold text-white">{pred.probability}%</div>
                              <div className="text-xs text-gray-500">probability</div>
                            </div>
                          </div>
                          {pred.preventiveAction && (
                            <div className="mt-3 p-2 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                              <p className="text-xs text-violet-400 flex items-start gap-1">
                                <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {pred.preventiveAction}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Conversations */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-white text-sm">Recent Conversations</span>
                  </div>
                  <div className="divide-y divide-gray-700">
                    {conversationHistory.map((conv) => (
                      <button
                        key={conv.id}
                        className="w-full p-3 text-left hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{conv.title}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{conv.preview}</p>
                          </div>
                          <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTimeAgo(conv.timestamp)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">{conv.messageCount} messages</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-center">
                    <Boxes className="w-5 h-5 text-blue-400 mx-auto" />
                    <p className="text-lg font-bold text-white mt-1">{wmsSystemData.inventory.totalItems.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Items</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-center">
                    <Layers className="w-5 h-5 text-emerald-400 mx-auto" />
                    <p className="text-lg font-bold text-white mt-1">{wmsSystemData.locations.totalLocations.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Locations</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-center">
                    <Users className="w-5 h-5 text-violet-400 mx-auto" />
                    <p className="text-lg font-bold text-white mt-1">{wmsSystemData.labor.activeUsers}/{wmsSystemData.labor.totalUsers}</p>
                    <p className="text-xs text-gray-500">Active Users</p>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts Tab Content */}
            {activeTab === 'alerts' && (
              <div className="flex-1 overflow-y-auto">
                {/* Filter Bar */}
                <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <div className="flex gap-1">
                    {(['all', 'critical', 'warning', 'prediction'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterAlertType(type)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          filterAlertType === type
                            ? type === 'critical' ? 'bg-red-500/20 text-red-400' :
                              type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                              type === 'prediction' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-violet-500/20 text-violet-400'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  {unreadAlertCount > 0 && (
                    <button
                      onClick={() => setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))}
                      className="ml-auto text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Alerts List */}
                <div className="divide-y divide-gray-800">
                  {filteredAlerts.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No alerts to display</p>
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 transition-colors ${!alert.isRead ? 'bg-gray-800/30' : ''} hover:bg-gray-800/50`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            alert.type === 'critical' ? 'bg-red-500/20' :
                            alert.type === 'warning' ? 'bg-amber-500/20' :
                            alert.type === 'prediction' ? 'bg-blue-500/20' :
                            'bg-gray-700'
                          }`}>
                            {alert.type === 'critical' ? (
                              <AlertOctagon className="w-4 h-4 text-red-400" />
                            ) : alert.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : alert.type === 'prediction' ? (
                              <Lightbulb className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Bell className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`text-sm font-medium ${!alert.isRead ? 'text-white' : 'text-gray-300'}`}>
                                  {alert.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{alert.description}</p>
                              </div>
                              <button
                                onClick={() => dismissAlert(alert.id)}
                                className="text-gray-600 hover:text-gray-400 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {alert.metric && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      alert.type === 'critical' ? 'bg-red-500' :
                                      alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min((alert.metric.current / alert.metric.threshold) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {alert.metric.current}/{alert.metric.threshold} {alert.metric.unit}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(alert.timestamp)}
                              </span>
                              <span className="text-xs text-gray-600">{alert.module}</span>
                              {alert.actionRequired && (
                                <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                                  Action required
                                </span>
                              )}
                            </div>

                            {alert.suggestedQuery && (
                              <button
                                onClick={() => handleAlertAction(alert)}
                                className="mt-3 flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                              >
                                <Search className="w-3 h-3" />
                                Investigate this issue
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Action Queue */}
                {actionQueue.length > 0 && (
                  <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Workflow className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-medium text-white">Action Queue</span>
                        <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                          {actionQueue.length} pending
                        </span>
                      </div>
                      <button className="text-xs text-emerald-400 hover:text-emerald-300">
                        Execute All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {actionQueue.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              item.priority === 1 ? 'bg-red-400' :
                              item.priority === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`} />
                            <span className="text-xs text-gray-300">{item.action.title}</span>
                          </div>
                          <button
                            onClick={() => removeFromQueue(item.id)}
                            className="text-gray-500 hover:text-gray-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
