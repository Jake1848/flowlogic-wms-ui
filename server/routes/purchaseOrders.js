import express from 'express';
const router = express.Router();


// Helper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================================
// IMPOA - Purchase Order Maintenance
// =============================================================================

// Get all purchase orders with filtering (IRPOA - Browse)
router.get('/', asyncHandler(async (req, res) => {
  const {
    warehouseId,
    status,
    poNumber,
    vendorId,
    buyerId,
    fromDate,
    toDate,
    expectedFromDate,
    expectedToDate,
    itemCode,
    department,
    priority,
    page = 1,
    limit = 50
  } = req.query;

  // Simulated purchase order data
  const purchaseOrders = [
    {
      id: 1,
      poNumber: 'PO-2024-1001',
      poType: 'STANDARD',
      status: 'RECEIVED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      vendorId: 1,
      vendorCode: 'ACME',
      vendorName: 'Acme Supplies',
      buyerId: 'JSMITH',
      buyerName: 'John Smith',
      department: 'RECEIVING',
      orderDate: '2024-01-10',
      expectedDate: '2024-01-15',
      receivedDate: '2024-01-15',
      cancelDate: null,
      priority: 'NORMAL',
      totalLines: 3,
      receivedLines: 3,
      openLines: 0,
      totalQtyOrdered: 1500,
      totalQtyReceived: 1485,
      totalQtyOpen: 0,
      totalValue: 45000.00,
      receivedValue: 44550.00,
      currency: 'USD',
      paymentTerms: 'NET30',
      freightTerms: 'PREPAID',
      fob: 'DESTINATION',
      shipVia: 'OCEAN',
      containerId: 'CONT-2024-001',
      appointmentId: 'APT-2024-001',
      notes: 'Standard replenishment order',
      createdAt: '2024-01-08T10:00:00Z',
      updatedAt: '2024-01-15T18:00:00Z'
    },
    {
      id: 2,
      poNumber: 'PO-2024-1002',
      poType: 'STANDARD',
      status: 'OPEN',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      vendorId: 2,
      vendorCode: 'GLOBAL',
      vendorName: 'Global Traders',
      buyerId: 'MWILLIAMS',
      buyerName: 'Mary Williams',
      department: 'ELECTRONICS',
      orderDate: '2024-01-12',
      expectedDate: '2024-01-20',
      receivedDate: null,
      cancelDate: null,
      priority: 'HIGH',
      totalLines: 5,
      receivedLines: 0,
      openLines: 5,
      totalQtyOrdered: 800,
      totalQtyReceived: 0,
      totalQtyOpen: 800,
      totalValue: 120000.00,
      receivedValue: 0,
      currency: 'USD',
      paymentTerms: 'NET45',
      freightTerms: 'COLLECT',
      fob: 'ORIGIN',
      shipVia: 'OCEAN',
      containerId: 'CONT-2024-002',
      appointmentId: 'APT-2024-002',
      notes: 'Electronics shipment - handle with care',
      createdAt: '2024-01-12T08:00:00Z',
      updatedAt: '2024-01-12T08:00:00Z'
    },
    {
      id: 3,
      poNumber: 'PO-2024-1003',
      poType: 'BLANKET',
      status: 'PARTIAL',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      vendorId: 3,
      vendorCode: 'FRESH',
      vendorName: 'Fresh Foods Inc',
      buyerId: 'RJOHNSON',
      buyerName: 'Robert Johnson',
      department: 'FOOD',
      orderDate: '2024-01-08',
      expectedDate: '2024-01-14',
      receivedDate: null,
      cancelDate: null,
      priority: 'URGENT',
      totalLines: 5,
      receivedLines: 3,
      openLines: 2,
      totalQtyOrdered: 600,
      totalQtyReceived: 350,
      totalQtyOpen: 250,
      totalValue: 18000.00,
      receivedValue: 10500.00,
      currency: 'USD',
      paymentTerms: 'NET15',
      freightTerms: 'PREPAID',
      fob: 'DESTINATION',
      shipVia: 'REEFER',
      containerId: 'CONT-2024-003',
      appointmentId: 'APT-2024-003',
      notes: 'Frozen foods - maintain cold chain',
      createdAt: '2024-01-08T14:00:00Z',
      updatedAt: '2024-01-14T12:00:00Z'
    },
    {
      id: 4,
      poNumber: 'PO-2024-1004',
      poType: 'DROP_SHIP',
      status: 'CANCELLED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      vendorId: 4,
      vendorCode: 'TECH',
      vendorName: 'Tech Components Ltd',
      buyerId: 'JSMITH',
      buyerName: 'John Smith',
      department: 'ELECTRONICS',
      orderDate: '2024-01-05',
      expectedDate: '2024-01-12',
      receivedDate: null,
      cancelDate: '2024-01-10',
      priority: 'LOW',
      totalLines: 2,
      receivedLines: 0,
      openLines: 0,
      totalQtyOrdered: 100,
      totalQtyReceived: 0,
      totalQtyOpen: 0,
      totalValue: 5000.00,
      receivedValue: 0,
      currency: 'USD',
      paymentTerms: 'NET30',
      freightTerms: 'PREPAID',
      fob: 'ORIGIN',
      shipVia: 'AIR',
      containerId: null,
      appointmentId: null,
      notes: 'Cancelled due to vendor inability to fulfill',
      cancelReason: 'VENDOR_STOCKOUT',
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-10T11:00:00Z'
    }
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedPOs = purchaseOrders.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginatedPOs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: purchaseOrders.length,
      pages: Math.ceil(purchaseOrders.length / parseInt(limit))
    }
  });
}));

// Get purchase order by ID (IMPOA detail/IRPOA detail)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const purchaseOrder = {
    id: parseInt(id),
    poNumber: 'PO-2024-1001',
    poType: 'STANDARD',
    status: 'RECEIVED',

    // Warehouse info
    warehouseId: 1,
    warehouseName: 'Main Distribution Center',
    warehouseCode: 'DC01',

    // Vendor info
    vendorId: 1,
    vendorCode: 'ACME',
    vendorName: 'Acme Supplies',
    vendorAddress: '123 Supplier St, Commerce City, CA 90001',
    vendorContact: 'Bob Vendor',
    vendorPhone: '555-123-4567',
    vendorEmail: 'orders@acmesupplies.com',

    // Buyer info
    buyerId: 'JSMITH',
    buyerName: 'John Smith',
    buyerEmail: 'jsmith@company.com',
    buyerPhone: '555-987-6543',
    department: 'RECEIVING',

    // Dates
    orderDate: '2024-01-10',
    expectedDate: '2024-01-15',
    receivedDate: '2024-01-15',
    cancelDate: null,
    closeDate: '2024-01-15',

    // Priority and urgency
    priority: 'NORMAL',
    rushOrder: false,

    // Terms
    paymentTerms: 'NET30',
    paymentDueDate: '2024-02-14',
    freightTerms: 'PREPAID',
    fob: 'DESTINATION',
    incoterms: 'DDP',

    // Shipping
    shipVia: 'OCEAN',
    carrierCode: 'MAERSK',
    carrierName: 'Maersk Line',
    containerId: 'CONT-2024-001',
    appointmentId: 'APT-2024-001',
    trackingNumber: 'MSKU1234567',

    // Ship to address
    shipToName: 'Main Distribution Center',
    shipToAddress: '1000 Warehouse Blvd',
    shipToCity: 'Phoenix',
    shipToState: 'AZ',
    shipToZip: '85001',
    shipToCountry: 'USA',

    // Quantity summary
    totalLines: 3,
    receivedLines: 3,
    openLines: 0,
    cancelledLines: 0,
    totalQtyOrdered: 1500,
    totalQtyReceived: 1485,
    totalQtyOpen: 0,
    totalQtyCancelled: 0,
    totalQtyDamaged: 15,

    // Value summary
    subtotal: 43000.00,
    taxAmount: 0,
    freightAmount: 2000.00,
    totalValue: 45000.00,
    receivedValue: 44550.00,
    currency: 'USD',

    // Compliance
    qualityInspectionRequired: true,
    qualityInspectionStatus: 'PASSED',
    customsRequired: true,
    customsStatus: 'CLEARED',
    customsEntryNumber: 'CE-2024-001',

    // Line items
    lineItems: [
      {
        lineNumber: 1,
        itemCode: 'SKU-001',
        itemDescription: 'Widget A - Standard',
        uom: 'EA',
        qtyOrdered: 500,
        qtyReceived: 495,
        qtyOpen: 0,
        qtyCancelled: 0,
        qtyDamaged: 5,
        unitCost: 10.00,
        extendedCost: 5000.00,
        receivedCost: 4950.00,
        status: 'RECEIVED',
        lotNumber: 'LOT-2024-001',
        expirationDate: '2025-01-15',
        receivedDate: '2024-01-15',
        location: 'A-01-01',
        qualityStatus: 'PASSED',
        notes: '5 units damaged in transit'
      },
      {
        lineNumber: 2,
        itemCode: 'SKU-002',
        itemDescription: 'Widget B - Premium',
        uom: 'EA',
        qtyOrdered: 500,
        qtyReceived: 490,
        qtyOpen: 0,
        qtyCancelled: 0,
        qtyDamaged: 10,
        unitCost: 15.00,
        extendedCost: 7500.00,
        receivedCost: 7350.00,
        status: 'RECEIVED',
        lotNumber: 'LOT-2024-002',
        expirationDate: '2025-02-15',
        receivedDate: '2024-01-15',
        location: 'A-02-01',
        qualityStatus: 'PASSED',
        notes: '10 units damaged - vendor notified'
      },
      {
        lineNumber: 3,
        itemCode: 'SKU-003',
        itemDescription: 'Widget C - Economy',
        uom: 'EA',
        qtyOrdered: 500,
        qtyReceived: 500,
        qtyOpen: 0,
        qtyCancelled: 0,
        qtyDamaged: 0,
        unitCost: 8.00,
        extendedCost: 4000.00,
        receivedCost: 4000.00,
        status: 'RECEIVED',
        lotNumber: 'LOT-2024-003',
        expirationDate: '2025-03-15',
        receivedDate: '2024-01-15',
        location: 'B-01-01',
        qualityStatus: 'PASSED',
        notes: ''
      }
    ],

    // Notes and messages
    notes: 'Standard replenishment order',
    vendorNotes: 'Confirmed shipment date 2024-01-12',
    receivingNotes: '15 cases damaged on arrival - photos taken',
    internalNotes: 'Vendor credit requested for damaged items',

    // Messages (IREME)
    messages: [
      {
        id: 1,
        messageType: 'CONFIRMATION',
        direction: 'INBOUND',
        sentBy: 'vendor',
        sentAt: '2024-01-11T10:00:00Z',
        subject: 'PO Confirmation',
        body: 'Order confirmed. Ship date 2024-01-12.',
        read: true
      },
      {
        id: 2,
        messageType: 'SHIPMENT',
        direction: 'INBOUND',
        sentBy: 'vendor',
        sentAt: '2024-01-12T14:00:00Z',
        subject: 'Shipment Notice',
        body: 'Order shipped. Container CONT-2024-001, Seal SEAL-12345',
        read: true
      },
      {
        id: 3,
        messageType: 'DISCREPANCY',
        direction: 'OUTBOUND',
        sentBy: 'JSMITH',
        sentAt: '2024-01-15T19:00:00Z',
        subject: 'Damage Report',
        body: '15 cases received damaged. Photos attached. Request credit.',
        read: false,
        attachments: ['damage_report_001.pdf', 'photos.zip']
      }
    ],

    // History
    history: [
      { action: 'CREATED', timestamp: '2024-01-08T10:00:00Z', user: 'JSMITH', details: 'PO created' },
      { action: 'SUBMITTED', timestamp: '2024-01-08T10:30:00Z', user: 'JSMITH', details: 'Sent to vendor' },
      { action: 'CONFIRMED', timestamp: '2024-01-11T10:00:00Z', user: 'system', details: 'Vendor confirmed' },
      { action: 'SHIPPED', timestamp: '2024-01-12T14:00:00Z', user: 'system', details: 'Vendor shipped' },
      { action: 'RECEIVED', timestamp: '2024-01-15T18:00:00Z', user: 'JSMITH', details: '1485/1500 received' },
      { action: 'CLOSED', timestamp: '2024-01-15T18:30:00Z', user: 'JSMITH', details: 'PO closed' }
    ],

    createdBy: 'JSMITH',
    createdAt: '2024-01-08T10:00:00Z',
    updatedAt: '2024-01-15T18:30:00Z'
  };

  res.json({
    success: true,
    data: purchaseOrder
  });
}));

// Create new purchase order (IMPOA add mode)
router.post('/', asyncHandler(async (req, res) => {
  const {
    poType,
    warehouseId,
    vendorId,
    buyerId,
    department,
    expectedDate,
    priority,
    paymentTerms,
    freightTerms,
    fob,
    shipVia,
    lineItems,
    notes
  } = req.body;

  // Validate required fields
  if (!vendorId) {
    return res.status(400).json({
      success: false,
      error: 'Vendor ID is required'
    });
  }

  const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  // Calculate totals from line items
  let totalQty = 0;
  let totalValue = 0;
  const processedLines = (lineItems || []).map((line, idx) => {
    const extCost = (line.qtyOrdered || 0) * (line.unitCost || 0);
    totalQty += line.qtyOrdered || 0;
    totalValue += extCost;
    return {
      lineNumber: idx + 1,
      itemCode: line.itemCode,
      itemDescription: line.itemDescription,
      uom: line.uom || 'EA',
      qtyOrdered: line.qtyOrdered || 0,
      qtyReceived: 0,
      qtyOpen: line.qtyOrdered || 0,
      unitCost: line.unitCost || 0,
      extendedCost: extCost,
      status: 'OPEN',
      notes: line.notes || ''
    };
  });

  const newPO = {
    id: Date.now(),
    poNumber,
    poType: poType || 'STANDARD',
    status: 'DRAFT',
    warehouseId: warehouseId || 1,
    vendorId,
    buyerId: buyerId || req.user?.username,
    department,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate,
    receivedDate: null,
    priority: priority || 'NORMAL',
    paymentTerms: paymentTerms || 'NET30',
    freightTerms: freightTerms || 'PREPAID',
    fob: fob || 'DESTINATION',
    shipVia,
    totalLines: processedLines.length,
    totalQtyOrdered: totalQty,
    totalQtyReceived: 0,
    totalQtyOpen: totalQty,
    totalValue,
    receivedValue: 0,
    currency: 'USD',
    lineItems: processedLines,
    notes: notes || '',
    createdBy: req.user?.username || 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Purchase order created successfully',
    data: newPO
  });
}));

// Update purchase order (IMPOA change mode)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedPO = {
    id: parseInt(id),
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.username || 'system'
  };

  res.json({
    success: true,
    message: 'Purchase order updated successfully',
    data: updatedPO
  });
}));

// Delete/Cancel purchase order (IMPOA delete mode)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body;

  res.json({
    success: true,
    message: `Purchase order ${id} cancelled successfully`,
    cancelReason,
    cancelledAt: new Date().toISOString(),
    cancelledBy: req.user?.username || 'system'
  });
}));

// =============================================================================
// PO Line Item Operations
// =============================================================================

// Add line item to PO
router.post('/:id/lines', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    itemCode,
    itemDescription,
    uom,
    qtyOrdered,
    unitCost,
    notes
  } = req.body;

  const newLine = {
    poId: id,
    lineNumber: Date.now(), // Would be calculated properly
    itemCode,
    itemDescription,
    uom: uom || 'EA',
    qtyOrdered: qtyOrdered || 0,
    qtyReceived: 0,
    qtyOpen: qtyOrdered || 0,
    unitCost: unitCost || 0,
    extendedCost: (qtyOrdered || 0) * (unitCost || 0),
    status: 'OPEN',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Line item added successfully',
    data: newLine
  });
}));

// Update line item
router.put('/:id/lines/:lineNumber', asyncHandler(async (req, res) => {
  const { id, lineNumber } = req.params;
  const updates = req.body;

  const updatedLine = {
    poId: id,
    lineNumber: parseInt(lineNumber),
    ...updates,
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Line item updated successfully',
    data: updatedLine
  });
}));

// Delete/Cancel line item
router.delete('/:id/lines/:lineNumber', asyncHandler(async (req, res) => {
  const { id, lineNumber } = req.params;
  const { cancelReason } = req.body;

  res.json({
    success: true,
    message: `Line ${lineNumber} cancelled from PO ${id}`,
    cancelReason
  });
}));

// =============================================================================
// PO Status Operations
// =============================================================================

// Submit PO to vendor
router.post('/:id/submit', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sendMethod, emailTo, faxTo } = req.body;

  const submission = {
    poId: id,
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
    submittedBy: req.user?.username || 'system',
    sendMethod: sendMethod || 'EMAIL',
    sentTo: emailTo || faxTo
  };

  res.json({
    success: true,
    message: 'Purchase order submitted to vendor',
    data: submission
  });
}));

// Approve PO
router.post('/:id/approve', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const approval = {
    poId: id,
    status: 'APPROVED',
    approvedAt: new Date().toISOString(),
    approvedBy: req.user?.username || 'system',
    notes
  };

  res.json({
    success: true,
    message: 'Purchase order approved',
    data: approval
  });
}));

// Close PO
router.post('/:id/close', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { closeReason, forceClose } = req.body;

  const closure = {
    poId: id,
    status: 'CLOSED',
    closedAt: new Date().toISOString(),
    closedBy: req.user?.username || 'system',
    closeReason,
    forceClose: forceClose || false
  };

  res.json({
    success: true,
    message: 'Purchase order closed',
    data: closure
  });
}));

// Reopen PO
router.post('/:id/reopen', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reopenReason } = req.body;

  const reopen = {
    poId: id,
    status: 'OPEN',
    reopenedAt: new Date().toISOString(),
    reopenedBy: req.user?.username || 'system',
    reopenReason
  };

  res.json({
    success: true,
    message: 'Purchase order reopened',
    data: reopen
  });
}));

// =============================================================================
// IRPUC - P.O. Analysis Screen
// =============================================================================

// Get PO analysis/summary
router.get('/:id/analysis', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const analysis = {
    poId: parseInt(id),
    poNumber: 'PO-2024-1001',
    vendorName: 'Acme Supplies',

    // Receipt analysis
    receiptSummary: {
      totalOrdered: 1500,
      totalReceived: 1485,
      totalShort: 0,
      totalOver: 0,
      totalDamaged: 15,
      totalRejected: 0,
      fillRate: 99.0,
      onTimeDelivery: false,
      daysLate: 0,
      daysEarly: 0
    },

    // Cost analysis
    costSummary: {
      originalPOValue: 45000.00,
      receivedValue: 44550.00,
      varianceAmount: -450.00,
      variancePercent: -1.0,
      damageCreditRequested: 450.00,
      damageCreditReceived: 0,
      freightCost: 2000.00,
      actualLandedCost: 46550.00,
      expectedLandedCost: 47000.00
    },

    // Quality analysis
    qualitySummary: {
      inspectionRequired: true,
      inspectionPassed: true,
      defectRate: 1.0,
      defectsByType: [
        { type: 'DAMAGED_PACKAGING', count: 10 },
        { type: 'PRODUCT_DEFECT', count: 5 }
      ],
      qualityScore: 99
    },

    // Vendor performance
    vendorPerformance: {
      onTimeDeliveryRate: 95.0,
      fillRate: 98.5,
      qualityScore: 97.0,
      averageLeadTime: 5,
      thisOrderLeadTime: 5,
      totalOrdersYTD: 24,
      totalValueYTD: 540000.00
    },

    // Line item analysis
    lineAnalysis: [
      {
        lineNumber: 1,
        itemCode: 'SKU-001',
        itemDescription: 'Widget A - Standard',
        ordered: 500,
        received: 495,
        damaged: 5,
        variance: -5,
        variancePercent: -1.0,
        unitCost: 10.00,
        costVariance: -50.00,
        status: 'COMPLETE'
      },
      {
        lineNumber: 2,
        itemCode: 'SKU-002',
        itemDescription: 'Widget B - Premium',
        ordered: 500,
        received: 490,
        damaged: 10,
        variance: -10,
        variancePercent: -2.0,
        unitCost: 15.00,
        costVariance: -150.00,
        status: 'COMPLETE'
      },
      {
        lineNumber: 3,
        itemCode: 'SKU-003',
        itemDescription: 'Widget C - Economy',
        ordered: 500,
        received: 500,
        damaged: 0,
        variance: 0,
        variancePercent: 0,
        unitCost: 8.00,
        costVariance: 0,
        status: 'COMPLETE'
      }
    ],

    // Timeline analysis
    timeline: [
      { event: 'PO Created', date: '2024-01-08', planned: '2024-01-08', variance: 0 },
      { event: 'PO Submitted', date: '2024-01-08', planned: '2024-01-08', variance: 0 },
      { event: 'Vendor Confirmed', date: '2024-01-11', planned: '2024-01-10', variance: 1 },
      { event: 'Shipped', date: '2024-01-12', planned: '2024-01-11', variance: 1 },
      { event: 'Received', date: '2024-01-15', planned: '2024-01-15', variance: 0 },
      { event: 'PO Closed', date: '2024-01-15', planned: '2024-01-15', variance: 0 }
    ],

    // Recommendations
    recommendations: [
      {
        type: 'INFO',
        message: 'Vendor has 95% on-time delivery rate - consider for future orders'
      },
      {
        type: 'WARNING',
        message: '15 damaged units received - damage claim should be filed'
      },
      {
        type: 'ACTION',
        message: 'Request vendor credit of $450.00 for damaged items'
      }
    ],

    generatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: analysis
  });
}));

// Get PO comparison (compare multiple POs)
router.post('/analysis/compare', asyncHandler(async (req, res) => {
  const { poNumbers } = req.body;

  const comparison = {
    purchaseOrders: (poNumbers || []).map((poNum, idx) => ({
      poNumber: poNum,
      vendorName: `Vendor ${idx + 1}`,
      totalValue: 45000 + (idx * 5000),
      receivedValue: 44000 + (idx * 4800),
      fillRate: 98 - idx,
      onTimeDelivery: idx === 0,
      qualityScore: 97 - idx,
      leadTimeDays: 5 + idx
    })),
    summary: {
      totalPOs: (poNumbers || []).length,
      totalValue: 135000,
      averageFillRate: 97,
      averageQualityScore: 96
    },
    generatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: comparison
  });
}));

// =============================================================================
// IREME - P.O. Message Maintenance
// =============================================================================

// Get messages for a PO
router.get('/:id/messages', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { messageType, direction, page = 1, limit = 20 } = req.query;

  const messages = [
    {
      id: 1,
      poId: id,
      messageType: 'CONFIRMATION',
      direction: 'INBOUND',
      sentBy: 'vendor',
      senderName: 'Acme Supplies',
      sentAt: '2024-01-11T10:00:00Z',
      subject: 'PO Confirmation - PO-2024-1001',
      body: 'Order confirmed. Expected ship date: 2024-01-12. Please advise of any changes.',
      read: true,
      readAt: '2024-01-11T10:30:00Z',
      attachments: []
    },
    {
      id: 2,
      poId: id,
      messageType: 'SHIPMENT',
      direction: 'INBOUND',
      sentBy: 'vendor',
      senderName: 'Acme Supplies',
      sentAt: '2024-01-12T14:00:00Z',
      subject: 'Shipment Notice - PO-2024-1001',
      body: 'Order shipped via Maersk Line.\nContainer: CONT-2024-001\nSeal: SEAL-12345\nETA: 2024-01-15',
      read: true,
      readAt: '2024-01-12T15:00:00Z',
      attachments: ['BOL-2024-001.pdf', 'packing_list.pdf']
    },
    {
      id: 3,
      poId: id,
      messageType: 'DISCREPANCY',
      direction: 'OUTBOUND',
      sentBy: 'JSMITH',
      senderName: 'John Smith',
      sentAt: '2024-01-15T19:00:00Z',
      subject: 'Damage Report - PO-2024-1001',
      body: 'We have received your shipment with the following discrepancies:\n- 15 cases damaged\n- SKU-001: 5 units\n- SKU-002: 10 units\n\nPlease see attached photos and issue credit.',
      read: false,
      readAt: null,
      attachments: ['damage_report.pdf', 'photos.zip']
    }
  ];

  res.json({
    success: true,
    data: messages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: messages.length,
      pages: 1
    }
  });
}));

// Send message for a PO (IREME add)
router.post('/:id/messages', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    messageType,
    recipientType,
    recipientEmail,
    subject,
    body,
    attachments
  } = req.body;

  const newMessage = {
    id: Date.now(),
    poId: id,
    messageType: messageType || 'GENERAL',
    direction: 'OUTBOUND',
    sentBy: req.user?.username || 'system',
    senderName: req.user?.name || 'System',
    recipientType: recipientType || 'VENDOR',
    recipientEmail,
    sentAt: new Date().toISOString(),
    subject,
    body,
    read: false,
    attachments: attachments || [],
    status: 'SENT'
  };

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: newMessage
  });
}));

// Mark message as read
router.patch('/:id/messages/:messageId/read', asyncHandler(async (req, res) => {
  const { id, messageId } = req.params;

  res.json({
    success: true,
    message: 'Message marked as read',
    data: {
      poId: id,
      messageId: parseInt(messageId),
      read: true,
      readAt: new Date().toISOString(),
      readBy: req.user?.username || 'system'
    }
  });
}));

// =============================================================================
// Reference Data
// =============================================================================

// Get PO status definitions
router.get('/reference/statuses', asyncHandler(async (req, res) => {
  const statuses = [
    { code: 'DRAFT', name: 'Draft', description: 'PO created but not submitted' },
    { code: 'PENDING_APPROVAL', name: 'Pending Approval', description: 'Awaiting internal approval' },
    { code: 'APPROVED', name: 'Approved', description: 'Internally approved' },
    { code: 'SUBMITTED', name: 'Submitted', description: 'Sent to vendor' },
    { code: 'CONFIRMED', name: 'Confirmed', description: 'Vendor confirmed order' },
    { code: 'OPEN', name: 'Open', description: 'Active PO awaiting receipt' },
    { code: 'PARTIAL', name: 'Partial', description: 'Partially received' },
    { code: 'RECEIVED', name: 'Received', description: 'Fully received' },
    { code: 'CLOSED', name: 'Closed', description: 'PO completed and closed' },
    { code: 'CANCELLED', name: 'Cancelled', description: 'PO cancelled' },
    { code: 'ON_HOLD', name: 'On Hold', description: 'PO on hold' }
  ];

  res.json({
    success: true,
    data: statuses
  });
}));

// Get PO type definitions
router.get('/reference/types', asyncHandler(async (req, res) => {
  const types = [
    { code: 'STANDARD', name: 'Standard', description: 'Regular purchase order' },
    { code: 'BLANKET', name: 'Blanket', description: 'Standing order with multiple releases' },
    { code: 'CONTRACT', name: 'Contract', description: 'Based on contract terms' },
    { code: 'DROP_SHIP', name: 'Drop Ship', description: 'Direct ship to customer' },
    { code: 'CONSIGNMENT', name: 'Consignment', description: 'Consignment inventory' },
    { code: 'EMERGENCY', name: 'Emergency', description: 'Rush/emergency order' }
  ];

  res.json({
    success: true,
    data: types
  });
}));

// Get payment terms
router.get('/reference/payment-terms', asyncHandler(async (req, res) => {
  const terms = [
    { code: 'NET10', name: 'Net 10', days: 10 },
    { code: 'NET15', name: 'Net 15', days: 15 },
    { code: 'NET30', name: 'Net 30', days: 30 },
    { code: 'NET45', name: 'Net 45', days: 45 },
    { code: 'NET60', name: 'Net 60', days: 60 },
    { code: 'NET90', name: 'Net 90', days: 90 },
    { code: '2/10NET30', name: '2% 10 Net 30', days: 30, discount: 2, discountDays: 10 },
    { code: 'COD', name: 'Cash on Delivery', days: 0 },
    { code: 'CIA', name: 'Cash in Advance', days: -1 },
    { code: 'EOM', name: 'End of Month', days: 30 }
  ];

  res.json({
    success: true,
    data: terms
  });
}));

// Get freight terms
router.get('/reference/freight-terms', asyncHandler(async (req, res) => {
  const terms = [
    { code: 'PREPAID', name: 'Prepaid', description: 'Vendor pays freight' },
    { code: 'COLLECT', name: 'Collect', description: 'Buyer pays freight' },
    { code: 'PREPAID_ADD', name: 'Prepaid & Add', description: 'Vendor prepays, adds to invoice' },
    { code: 'THIRD_PARTY', name: 'Third Party', description: 'Third party pays freight' }
  ];

  res.json({
    success: true,
    data: terms
  });
}));

export default router;
