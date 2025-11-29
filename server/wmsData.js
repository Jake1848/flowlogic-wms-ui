// Comprehensive WMS data simulation
// In production, this would connect to your actual WMS database

export const wmsData = {
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
      { id: 'TXN001', type: 'PUTAWAY', product: '287561', productName: 'VICKS VAL TWR W4', qty: 4, from: 'E481587', to: 'SA1474A', user: 'JSMITH', userName: 'John Smith', time: '2025-11-26 14:32:00', status: 'completed' },
      { id: 'TXN002', type: 'PICK', product: '287561', productName: 'VICKS VAL TWR W4', qty: 0, from: 'SA1474A', to: 'SHIP01', user: 'JSMITH', userName: 'John Smith', time: '2025-11-26 14:30:00', status: 'cancelled', note: 'Pick cancelled - wrong location' },
      { id: 'TXN003', type: 'ADJUSTMENT', product: '287561', productName: 'VICKS VAL TWR W4', qty: 4, from: 'SA1474A', to: 'SA1474A', user: 'SYSTEM', userName: 'System', time: '2025-11-26 08:00:00', status: 'completed', reason: 'Cycle count correction' },
      { id: 'TXN004', type: 'RECEIVE', product: '287561', productName: 'VICKS VAL TWR W4', qty: 52, from: 'DOCK01', to: 'E481587', user: 'KLEE', userName: 'Kevin Lee', time: '2025-11-26 09:00:00', status: 'completed', po: 'PO-2025-1234' },
      { id: 'TXN005', type: 'PUTAWAY', product: '287561', productName: 'VICKS VAL TWR W4', qty: 48, from: 'E481587', to: 'SA1474A', user: 'JSMITH', userName: 'John Smith', time: '2025-11-26 09:45:00', status: 'completed' },
      { id: 'TXN006', type: 'PICK', product: '445566', productName: 'Band-Aid Flexible', qty: 12, from: 'SA1589A', to: 'PACK01', user: 'MWILSON', userName: 'Mary Wilson', time: '2025-11-26 13:15:00', status: 'completed' },
      { id: 'TXN007', type: 'REPLENISH', product: '778899', productName: 'Neosporin Original', qty: 50, from: 'RES001', to: 'SA1590B', user: 'SYSTEM', userName: 'System', time: '2025-11-26 12:00:00', status: 'completed' },
    ],
    hotItems: [
      { product: '287561', name: 'VICKS VAL TWR W4', velocity: 'A', picks: 145, onHand: 52 },
      { product: '445566', name: 'Band-Aid Flexible', velocity: 'A', picks: 132, onHand: 89 },
      { product: '778899', name: 'Neosporin Original', velocity: 'A', picks: 98, onHand: 156 },
      { product: '112233', name: 'Crest Toothpaste', velocity: 'B', picks: 67, onHand: 234 },
      { product: '445599', name: 'Advil PM', velocity: 'B', picks: 54, onHand: 178 },
    ]
  },
  receiving: {
    openPOs: 23,
    pendingASNs: 8,
    todayReceipts: 156,
    avgReceiveTime: 45, // minutes
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
      },
      {
        id: 'RCV002',
        type: 'DAMAGED',
        po: 'PO-2025-1198',
        product: '889922',
        productName: 'Dove Body Wash',
        expected: 100,
        received: 95,
        damaged: 5,
        time: '2025-11-26 11:30:00',
        receiver: 'TNGUYEN',
        receiverName: 'Tom Nguyen',
        dock: 'DOCK03',
        carrier: 'UPS Freight',
        vendor: 'Unilever'
      }
    ],
    dockUtilization: [
      { dock: 'DOCK01', status: 'active', carrier: 'FedEx', arrival: '08:30', departure: '10:00', poCount: 3 },
      { dock: 'DOCK02', status: 'idle', carrier: null, arrival: null, departure: null, poCount: 0 },
      { dock: 'DOCK03', status: 'active', carrier: 'UPS', arrival: '09:15', departure: '11:30', poCount: 2 },
      { dock: 'DOCK04', status: 'scheduled', carrier: 'XPO', arrival: '14:00', departure: null, poCount: 5 },
    ],
    upcomingDeliveries: [
      { po: 'PO-2025-1245', vendor: 'Johnson & Johnson', carrier: 'XPO', eta: '14:00', items: 12, dock: 'DOCK04' },
      { po: 'PO-2025-1246', vendor: 'Pfizer', carrier: 'FedEx', eta: '15:30', items: 8, dock: 'DOCK01' },
      { po: 'PO-2025-1247', vendor: 'Unilever', carrier: 'UPS', eta: '16:00', items: 15, dock: 'DOCK02' },
    ]
  },
  shipping: {
    pendingOrders: 342,
    shippedToday: 1205,
    lateOrders: 12,
    avgPickTime: 3.2, // minutes per line
    ordersPerHour: 85,
    waveInProgress: 'WAVE-2025-1126-003',
    carrierPerformance: [
      { carrier: 'FedEx', onTime: 96.5, volume: 450, avgTransit: 2.1 },
      { carrier: 'UPS', onTime: 94.2, volume: 380, avgTransit: 2.3 },
      { carrier: 'USPS', onTime: 91.8, volume: 275, avgTransit: 3.5 },
      { carrier: 'DHL', onTime: 97.1, volume: 100, avgTransit: 1.8 },
    ],
    lateOrderDetails: [
      { order: 'ORD-98765', customer: 'ABC Corp', priority: 'rush', delay: '2h 15m', reason: 'Stock shortage', lines: 5 },
      { order: 'ORD-98770', customer: 'XYZ Inc', priority: 'standard', delay: '45m', reason: 'Picking backlog', lines: 3 },
      { order: 'ORD-98772', customer: 'MedSupply LLC', priority: 'rush', delay: '1h 30m', reason: 'Dock congestion', lines: 8 },
      { order: 'ORD-98780', customer: 'HealthMart', priority: 'standard', delay: '30m', reason: 'System delay', lines: 2 },
    ],
    waveStats: {
      waveId: 'WAVE-2025-1126-003',
      totalOrders: 150,
      completedOrders: 87,
      inProgress: 45,
      pending: 18,
      accuracy: 98.5,
      startTime: '2025-11-26 13:00:00'
    }
  },
  labor: {
    activeUsers: 45,
    totalUsers: 52,
    productivity: 94.2,
    avgProductivity: 89.5,
    topPerformers: [
      { user: 'JSMITH', name: 'John Smith', picks: 245, putaways: 32, accuracy: 99.2, productivity: 112, hoursWorked: 7.5 },
      { user: 'MWILSON', name: 'Mary Wilson', picks: 232, putaways: 28, accuracy: 98.8, productivity: 108, hoursWorked: 7.5 },
      { user: 'KLEE', name: 'Kevin Lee', picks: 198, putaways: 45, accuracy: 99.5, productivity: 105, hoursWorked: 7.5 },
      { user: 'SJOHNSON', name: 'Sarah Johnson', picks: 187, putaways: 22, accuracy: 98.5, productivity: 102, hoursWorked: 7.0 },
    ],
    lowPerformers: [
      { user: 'TNGUYEN', name: 'Tom Nguyen', picks: 89, putaways: 12, accuracy: 94.2, productivity: 72, issue: 'New hire - training', hoursWorked: 6.5 },
      { user: 'BGARCIA', name: 'Brian Garcia', picks: 112, putaways: 8, accuracy: 95.1, productivity: 78, issue: 'Equipment issues', hoursWorked: 7.0 },
    ],
    attendance: {
      present: 45,
      absent: 3,
      late: 2,
      onBreak: 2,
      overtime: 5
    },
    taskDistribution: {
      picking: 28,
      putaway: 8,
      receiving: 5,
      packing: 4,
      shipping: 3,
      cycle_count: 2
    }
  },
  locations: {
    totalLocations: 12500,
    emptyLocations: 2340,
    fullLocations: 8920,
    partialLocations: 1240,
    utilizationRate: 81.3,
    problemLocations: [
      { location: 'SA1474A', issue: 'Capacity exceeded', currentQty: 52, maxQty: 48, product: '287561', productName: 'VICKS VAL TWR W4' },
      { location: 'B2-15-03', issue: 'Blocked access', currentQty: 0, maxQty: 100, reason: 'Forklift maintenance' },
      { location: 'C4-22-01', issue: 'Damaged rack', currentQty: 45, maxQty: 100, reason: 'Awaiting repair' },
    ],
    replenishmentNeeded: [
      { location: 'SA1589A', product: '445566', productName: 'Band-Aid Flexible', current: 5, min: 20, max: 100, reserveLocation: 'RES-445566' },
      { location: 'SA1590B', product: '778899', productName: 'Neosporin Original', current: 8, min: 15, max: 80, reserveLocation: 'RES-778899' },
      { location: 'SA1595C', product: '112233', productName: 'Crest Toothpaste', current: 12, min: 25, max: 120, reserveLocation: 'RES-112233' },
    ],
    zones: [
      { zone: 'A', type: 'Fast Pick', locations: 2500, utilization: 92.5 },
      { zone: 'B', type: 'Medium Pick', locations: 4000, utilization: 78.3 },
      { zone: 'C', type: 'Slow Pick', locations: 3500, utilization: 65.2 },
      { zone: 'RES', type: 'Reserve', locations: 2500, utilization: 88.7 },
    ]
  },
  systemHealth: {
    status: 'healthy',
    uptime: 99.97,
    lastSync: new Date().toISOString(),
    pendingTasks: 23,
    errors: 0,
    warnings: 3,
    integrations: [
      { name: 'ERP', status: 'connected', lastSync: '2025-11-26 15:29:00', latency: 45 },
      { name: 'TMS', status: 'connected', lastSync: '2025-11-26 15:28:00', latency: 32 },
      { name: 'E-Commerce', status: 'connected', lastSync: '2025-11-26 15:30:00', latency: 78 },
      { name: 'Carrier API', status: 'connected', lastSync: '2025-11-26 15:30:00', latency: 120 },
    ],
    recentAlerts: [
      { time: '14:45', message: 'High order volume detected', severity: 'warning' },
      { time: '12:30', message: 'Cycle count completed - Zone A', severity: 'info' },
      { time: '10:15', message: 'Receiving over-receipt on PO-2025-1234', severity: 'warning' },
    ]
  },
  analytics: {
    dailyOrders: [1150, 1200, 1180, 1250, 1205],
    dailyReceipts: [140, 155, 148, 162, 156],
    inventoryTrend: [45500, 45650, 45780, 45820, 45892],
    errorRate: [0.8, 0.6, 0.5, 0.7, 0.4],
    laborEfficiency: [88.5, 90.2, 91.8, 93.5, 94.2],
    orderFulfillmentRate: [94.5, 95.2, 95.8, 96.0, 96.2],
  }
};

// Generate a system context summary for Claude
export function getSystemContext() {
  const now = new Date().toISOString();

  return `
## Current Timestamp: ${now}

## Inventory Status:
- Total Items: ${wmsData.inventory.totalItems.toLocaleString()}
- Total Value: $${wmsData.inventory.totalValue.toLocaleString()}
- Accuracy: ${wmsData.inventory.accuracy}%
- Active Discrepancies: ${wmsData.inventory.discrepancies.length}
  ${wmsData.inventory.discrepancies.map(d =>
    `  - ${d.type.toUpperCase()}: Product ${d.product} (${d.productName}) at ${d.location} - Expected: ${d.expected}, Actual: ${d.actual}`
  ).join('\n')}

## Receiving Status:
- Open POs: ${wmsData.receiving.openPOs}
- Today's Receipts: ${wmsData.receiving.todayReceipts}
- Active Issues: ${wmsData.receiving.issues.length}
  ${wmsData.receiving.issues.map(i =>
    `  - ${i.type}: PO ${i.po}, Product ${i.product} - Expected: ${i.expected}, Received: ${i.received}`
  ).join('\n')}

## Shipping Status:
- Pending Orders: ${wmsData.shipping.pendingOrders}
- Shipped Today: ${wmsData.shipping.shippedToday}
- Late Orders: ${wmsData.shipping.lateOrders}
- Current Wave: ${wmsData.shipping.waveInProgress}
  ${wmsData.shipping.lateOrderDetails.slice(0, 3).map(o =>
    `  - ${o.order} (${o.customer}): ${o.delay} late - ${o.reason}`
  ).join('\n')}

## Labor Status:
- Active Users: ${wmsData.labor.activeUsers}/${wmsData.labor.totalUsers}
- Productivity: ${wmsData.labor.productivity}%
- Top Performer: ${wmsData.labor.topPerformers[0].name} (${wmsData.labor.topPerformers[0].picks} picks, ${wmsData.labor.topPerformers[0].accuracy}% accuracy)

## Location Status:
- Total Locations: ${wmsData.locations.totalLocations.toLocaleString()}
- Utilization: ${wmsData.locations.utilizationRate}%
- Problem Locations: ${wmsData.locations.problemLocations.length}
- Replenishment Needed: ${wmsData.locations.replenishmentNeeded.length}

## System Health:
- Status: ${wmsData.systemHealth.status}
- Uptime: ${wmsData.systemHealth.uptime}%
- Pending Tasks: ${wmsData.systemHealth.pendingTasks}
- Warnings: ${wmsData.systemHealth.warnings}

## Recent Transactions (Last 5):
${wmsData.inventory.recentTransactions.slice(0, 5).map(t =>
    `- ${t.time}: ${t.type} - ${t.qty} x ${t.product} (${t.productName}) by ${t.userName} [${t.status}]`
  ).join('\n')}
`;
}

// Function to query specific data
export function queryInventory(productId) {
  const transactions = wmsData.inventory.recentTransactions.filter(t => t.product === productId);
  const discrepancy = wmsData.inventory.discrepancies.find(d => d.product === productId);
  const hotItem = wmsData.inventory.hotItems.find(h => h.product === productId);
  const receivingIssue = wmsData.receiving.issues.find(i => i.product === productId);

  return {
    transactions,
    discrepancy,
    hotItem,
    receivingIssue,
    found: transactions.length > 0 || discrepancy || hotItem || receivingIssue
  };
}

export function queryLocation(locationId) {
  const problem = wmsData.locations.problemLocations.find(p => p.location === locationId);
  const replenishment = wmsData.locations.replenishmentNeeded.find(r => r.location === locationId);
  const transactions = wmsData.inventory.recentTransactions.filter(
    t => t.from === locationId || t.to === locationId
  );

  return {
    problem,
    replenishment,
    transactions,
    found: problem || replenishment || transactions.length > 0
  };
}

export function queryUser(userId) {
  const topPerformer = wmsData.labor.topPerformers.find(p => p.user === userId);
  const lowPerformer = wmsData.labor.lowPerformers.find(p => p.user === userId);
  const transactions = wmsData.inventory.recentTransactions.filter(t => t.user === userId);

  return {
    performance: topPerformer || lowPerformer,
    isTopPerformer: !!topPerformer,
    transactions,
    found: topPerformer || lowPerformer || transactions.length > 0
  };
}
