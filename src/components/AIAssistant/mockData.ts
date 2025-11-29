import { TruckIcon, Package, Users, Timer } from 'lucide-react'
import type { ProactiveAlert, Prediction, InsightCard, WMSSystemData } from './types'

/**
 * Comprehensive WMS data simulation
 * This mock data simulates real-time warehouse metrics
 */
export const wmsSystemData: WMSSystemData = {
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

/**
 * Initial proactive alerts shown to users
 */
export const initialAlerts: ProactiveAlert[] = [
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

/**
 * AI Predictions for proactive insights
 */
export const aiPredictions: Prediction[] = [
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

/**
 * Insight cards for the dashboard view
 */
export const insightCards: InsightCard[] = [
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

/**
 * Default conversation history
 */
export const defaultConversationHistory = [
  { id: 'conv-1', title: 'Inventory Investigation', preview: 'Investigated overage for product 287561...', timestamp: new Date(Date.now() - 3600000), messageCount: 8 },
  { id: 'conv-2', title: 'Labor Analysis', preview: 'Reviewed team performance metrics...', timestamp: new Date(Date.now() - 7200000), messageCount: 5 },
  { id: 'conv-3', title: 'Shipping Issues', preview: 'Resolved late order backlog...', timestamp: new Date(Date.now() - 86400000), messageCount: 12 },
]

/**
 * Initial welcome message from the AI assistant
 */
export const welcomeMessage = {
  id: '1',
  role: 'assistant' as const,
  content: "Hello! I'm Flow, your intelligent warehouse assistant. I have complete visibility into all operations and can investigate issues, find root causes, and execute fixes automatically. What can I help you with today?",
  timestamp: new Date(),
}
