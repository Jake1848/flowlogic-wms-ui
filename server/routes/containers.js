import express from 'express';
const router = express.Router();


// Helper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================================
// IMRCA - Container Receiving Maintenance
// =============================================================================

// Get all containers with filtering
router.get('/', asyncHandler(async (req, res) => {
  const {
    warehouseId,
    status,
    containerId,
    appointmentId,
    poNumber,
    vendorId,
    containerType,
    fromDate,
    toDate,
    page = 1,
    limit = 50
  } = req.query;

  const where = {};

  if (warehouseId) where.warehouseId = parseInt(warehouseId);
  if (status) where.status = status;
  if (containerId) where.containerId = { contains: containerId, mode: 'insensitive' };
  if (appointmentId) where.appointmentId = appointmentId;
  if (poNumber) where.poNumber = { contains: poNumber, mode: 'insensitive' };
  if (vendorId) where.vendorId = parseInt(vendorId);
  if (containerType) where.containerType = containerType;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  // Simulated container data for development
  const containers = [
    {
      id: 1,
      containerId: 'CONT-2024-001',
      containerType: 'OCEAN_40FT',
      status: 'RECEIVED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      appointmentId: 'APT-001',
      poNumber: 'PO-2024-1001',
      vendorId: 1,
      vendorName: 'Acme Supplies',
      sealNumber: 'SEAL-12345',
      carrierCode: 'MAERSK',
      carrierName: 'Maersk Line',
      billOfLading: 'BOL-2024-001',
      vesselName: 'MSC MAYA',
      voyageNumber: 'V123',
      portOfOrigin: 'SHANGHAI',
      portOfDischarge: 'LOS ANGELES',
      estimatedArrival: '2024-01-15T10:00:00Z',
      actualArrival: '2024-01-15T14:30:00Z',
      receivedDate: '2024-01-15T15:00:00Z',
      receivedBy: 'jsmith',
      dockDoor: 'DOCK-A1',
      expectedCases: 1500,
      receivedCases: 1485,
      damagedCases: 15,
      temperature: null,
      humidity: null,
      notes: 'Minor damage to 15 cases on pallet 23',
      customsStatus: 'CLEARED',
      customsClearanceDate: '2024-01-15T09:00:00Z',
      demurrageStartDate: null,
      returnDueDate: '2024-01-22T17:00:00Z',
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-15T15:00:00Z'
    },
    {
      id: 2,
      containerId: 'CONT-2024-002',
      containerType: 'OCEAN_20FT',
      status: 'IN_TRANSIT',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      appointmentId: 'APT-002',
      poNumber: 'PO-2024-1002',
      vendorId: 2,
      vendorName: 'Global Traders',
      sealNumber: 'SEAL-12346',
      carrierCode: 'EVERGREEN',
      carrierName: 'Evergreen Marine',
      billOfLading: 'BOL-2024-002',
      vesselName: 'EVER ACE',
      voyageNumber: 'V456',
      portOfOrigin: 'HONG KONG',
      portOfDischarge: 'LONG BEACH',
      estimatedArrival: '2024-01-20T08:00:00Z',
      actualArrival: null,
      receivedDate: null,
      receivedBy: null,
      dockDoor: null,
      expectedCases: 800,
      receivedCases: 0,
      damagedCases: 0,
      temperature: null,
      humidity: null,
      notes: '',
      customsStatus: 'PENDING',
      customsClearanceDate: null,
      demurrageStartDate: null,
      returnDueDate: null,
      createdAt: '2024-01-12T10:00:00Z',
      updatedAt: '2024-01-12T10:00:00Z'
    },
    {
      id: 3,
      containerId: 'CONT-2024-003',
      containerType: 'REEFER_40FT',
      status: 'UNLOADING',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      appointmentId: 'APT-003',
      poNumber: 'PO-2024-1003',
      vendorId: 3,
      vendorName: 'Fresh Foods Inc',
      sealNumber: 'SEAL-12347',
      carrierCode: 'HAPAG',
      carrierName: 'Hapag-Lloyd',
      billOfLading: 'BOL-2024-003',
      vesselName: 'BERLIN EXPRESS',
      voyageNumber: 'V789',
      portOfOrigin: 'ROTTERDAM',
      portOfDischarge: 'NEW YORK',
      estimatedArrival: '2024-01-14T06:00:00Z',
      actualArrival: '2024-01-14T07:30:00Z',
      receivedDate: '2024-01-14T09:00:00Z',
      receivedBy: 'mwilliams',
      dockDoor: 'DOCK-C3',
      expectedCases: 600,
      receivedCases: 350,
      damagedCases: 0,
      temperature: -18.5,
      humidity: 45,
      notes: 'Refrigerated cargo - maintain temp at -18C',
      customsStatus: 'CLEARED',
      customsClearanceDate: '2024-01-14T05:00:00Z',
      demurrageStartDate: null,
      returnDueDate: '2024-01-21T17:00:00Z',
      createdAt: '2024-01-08T14:00:00Z',
      updatedAt: '2024-01-14T12:00:00Z'
    }
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedContainers = containers.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginatedContainers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: containers.length,
      pages: Math.ceil(containers.length / parseInt(limit))
    }
  });
}));

// Get container by ID (IMRCA detail view)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const container = {
    id: parseInt(id),
    containerId: 'CONT-2024-001',
    containerType: 'OCEAN_40FT',
    containerSize: '40',
    status: 'RECEIVED',
    warehouseId: 1,
    warehouseName: 'Main Distribution Center',

    // Appointment info
    appointmentId: 'APT-001',
    appointmentDate: '2024-01-15',
    appointmentTime: '14:00',

    // PO and vendor info
    poNumber: 'PO-2024-1001',
    vendorId: 1,
    vendorName: 'Acme Supplies',
    vendorCode: 'ACME',

    // Shipping details
    sealNumber: 'SEAL-12345',
    carrierCode: 'MAERSK',
    carrierName: 'Maersk Line',
    driverName: 'John Driver',
    driverLicense: 'DL123456',
    tractorNumber: 'TRC-001',
    trailerNumber: 'TRL-001',

    // Shipping documentation
    billOfLading: 'BOL-2024-001',
    vesselName: 'MSC MAYA',
    voyageNumber: 'V123',
    bookingNumber: 'BK-2024-001',

    // Port info
    portOfOrigin: 'SHANGHAI',
    portOfDischarge: 'LOS ANGELES',
    finalDestination: 'PHOENIX',

    // Dates
    estimatedArrival: '2024-01-15T10:00:00Z',
    actualArrival: '2024-01-15T14:30:00Z',
    receivedDate: '2024-01-15T15:00:00Z',
    receivedBy: 'jsmith',
    gateInTime: '2024-01-15T14:00:00Z',
    gateOutTime: null,
    unloadStartTime: '2024-01-15T15:30:00Z',
    unloadEndTime: '2024-01-15T18:00:00Z',

    // Dock assignment
    dockDoor: 'DOCK-A1',
    yardLocation: 'YARD-B12',

    // Case counts
    expectedCases: 1500,
    receivedCases: 1485,
    damagedCases: 15,
    shortCases: 0,
    overCases: 0,

    // Weight
    grossWeight: 25000,
    tareWeight: 4000,
    netWeight: 21000,
    weightUnit: 'KG',

    // Dimensions
    length: 40,
    width: 8,
    height: 8.5,
    dimensionUnit: 'FT',

    // Temperature (for reefer)
    temperature: null,
    humidity: null,
    temperatureUnit: 'C',

    // Customs
    customsStatus: 'CLEARED',
    customsClearanceDate: '2024-01-15T09:00:00Z',
    customsEntryNumber: 'CE-2024-001',
    customsBroker: 'Global Customs LLC',

    // Demurrage
    demurrageStartDate: null,
    freeTimeExpiry: '2024-01-22T17:00:00Z',
    returnDueDate: '2024-01-22T17:00:00Z',
    returnDepot: 'LA Container Depot',

    // Inspection
    inspectionRequired: true,
    inspectionStatus: 'PASSED',
    inspectionDate: '2024-01-15T15:15:00Z',
    inspectedBy: 'Quality Team',

    // Notes and documents
    notes: 'Minor damage to 15 cases on pallet 23',
    internalNotes: 'Vendor notified about damaged cases',

    // Line items (what's in the container)
    lineItems: [
      {
        lineNumber: 1,
        itemCode: 'SKU-001',
        description: 'Widget A',
        expectedQty: 500,
        receivedQty: 495,
        damagedQty: 5,
        uom: 'EA',
        lotNumber: 'LOT-2024-001',
        expirationDate: '2025-01-15'
      },
      {
        lineNumber: 2,
        itemCode: 'SKU-002',
        description: 'Widget B',
        expectedQty: 500,
        receivedQty: 490,
        damagedQty: 10,
        uom: 'EA',
        lotNumber: 'LOT-2024-002',
        expirationDate: '2025-02-15'
      },
      {
        lineNumber: 3,
        itemCode: 'SKU-003',
        description: 'Widget C',
        expectedQty: 500,
        receivedQty: 500,
        damagedQty: 0,
        uom: 'EA',
        lotNumber: 'LOT-2024-003',
        expirationDate: '2025-03-15'
      }
    ],

    // Audit trail
    history: [
      { action: 'CREATED', timestamp: '2024-01-10T08:00:00Z', user: 'system', details: 'Container record created from PO' },
      { action: 'APPOINTMENT_SCHEDULED', timestamp: '2024-01-12T10:00:00Z', user: 'mwilliams', details: 'Appointment scheduled for 2024-01-15' },
      { action: 'GATE_IN', timestamp: '2024-01-15T14:00:00Z', user: 'gate_operator', details: 'Container arrived at gate' },
      { action: 'CUSTOMS_CLEARED', timestamp: '2024-01-15T14:30:00Z', user: 'system', details: 'Customs clearance confirmed' },
      { action: 'RECEIVING_STARTED', timestamp: '2024-01-15T15:00:00Z', user: 'jsmith', details: 'Receiving initiated at DOCK-A1' },
      { action: 'RECEIVING_COMPLETED', timestamp: '2024-01-15T18:00:00Z', user: 'jsmith', details: 'Receiving completed - 1485/1500 cases' }
    ],

    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T18:00:00Z'
  };

  res.json({
    success: true,
    data: container
  });
}));

// Create new container (IMRCA add mode)
router.post('/', asyncHandler(async (req, res) => {
  const {
    containerId,
    containerType,
    containerSize,
    warehouseId,
    appointmentId,
    poNumber,
    vendorId,
    sealNumber,
    carrierCode,
    billOfLading,
    vesselName,
    voyageNumber,
    bookingNumber,
    portOfOrigin,
    portOfDischarge,
    estimatedArrival,
    expectedCases,
    notes
  } = req.body;

  // Validate required fields
  if (!containerId) {
    return res.status(400).json({
      success: false,
      error: 'Container ID is required'
    });
  }

  const newContainer = {
    id: Date.now(),
    containerId,
    containerType: containerType || 'OCEAN_40FT',
    containerSize: containerSize || '40',
    status: 'SCHEDULED',
    warehouseId: warehouseId || 1,
    appointmentId,
    poNumber,
    vendorId,
    sealNumber,
    carrierCode,
    billOfLading,
    vesselName,
    voyageNumber,
    bookingNumber,
    portOfOrigin,
    portOfDischarge,
    estimatedArrival,
    actualArrival: null,
    receivedDate: null,
    receivedBy: null,
    dockDoor: null,
    expectedCases: expectedCases || 0,
    receivedCases: 0,
    damagedCases: 0,
    customsStatus: 'PENDING',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user?.username || 'system'
  };

  res.status(201).json({
    success: true,
    message: 'Container created successfully',
    data: newContainer
  });
}));

// Update container (IMRCA change mode)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedContainer = {
    id: parseInt(id),
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.username || 'system'
  };

  res.json({
    success: true,
    message: 'Container updated successfully',
    data: updatedContainer
  });
}));

// Delete container (IMRCA delete mode)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: `Container ${id} deleted successfully`
  });
}));

// =============================================================================
// IMSCA - Container Return and Transfer Maintenance
// =============================================================================

// Get container return/transfer status
router.get('/:id/return-status', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const returnStatus = {
    containerId: id,
    containerNumber: 'CONT-2024-001',
    status: 'PENDING_RETURN',
    emptyDate: '2024-01-15T18:00:00Z',
    returnDueDate: '2024-01-22T17:00:00Z',
    returnDepot: 'LA Container Depot',
    returnDepotAddress: '1234 Port Blvd, Los Angeles, CA 90731',
    freeTimeDays: 7,
    freeTimeExpiry: '2024-01-22T17:00:00Z',
    demurrageRate: 150.00,
    demurrageAccrued: 0,
    chassisNumber: 'CHS-001',
    chassisReturnDepot: 'Same as container',
    carrierInstructions: 'Return empty container to depot. Sweep clean.',
    returnBolNumber: null,
    actualReturnDate: null,
    returnConfirmation: null,
    transfers: []
  };

  res.json({
    success: true,
    data: returnStatus
  });
}));

// Schedule container return (IMSCA)
router.post('/:id/schedule-return', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    returnDate,
    returnDepot,
    carrierCode,
    driverName,
    tractorNumber,
    notes
  } = req.body;

  const returnSchedule = {
    containerId: id,
    scheduledReturnDate: returnDate,
    returnDepot,
    carrierCode,
    driverName,
    tractorNumber,
    notes,
    status: 'RETURN_SCHEDULED',
    scheduledBy: req.user?.username || 'system',
    scheduledAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Container return scheduled successfully',
    data: returnSchedule
  });
}));

// Confirm container return (IMSCA)
router.post('/:id/confirm-return', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    returnDate,
    returnDepot,
    returnBolNumber,
    returnConfirmationNumber,
    chassisReturned,
    notes
  } = req.body;

  const returnConfirmation = {
    containerId: id,
    actualReturnDate: returnDate || new Date().toISOString(),
    returnDepot,
    returnBolNumber,
    returnConfirmationNumber,
    chassisReturned: chassisReturned || true,
    status: 'RETURNED',
    confirmedBy: req.user?.username || 'system',
    confirmedAt: new Date().toISOString(),
    notes
  };

  res.json({
    success: true,
    message: 'Container return confirmed successfully',
    data: returnConfirmation
  });
}));

// Transfer container between locations (IMSCA)
router.post('/:id/transfer', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    fromLocation,
    toLocation,
    transferDate,
    transferReason,
    carrierCode,
    driverName,
    notes
  } = req.body;

  const transfer = {
    id: Date.now(),
    containerId: id,
    fromLocation,
    toLocation,
    transferDate: transferDate || new Date().toISOString(),
    transferReason,
    carrierCode,
    driverName,
    status: 'IN_TRANSIT',
    createdBy: req.user?.username || 'system',
    createdAt: new Date().toISOString(),
    notes
  };

  res.json({
    success: true,
    message: 'Container transfer initiated successfully',
    data: transfer
  });
}));

// =============================================================================
// IMRRA - Dallas Transaction Maintenance (Container transactions log)
// =============================================================================

// Get container transaction history
router.get('/:id/transactions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fromDate, toDate, transactionType, page = 1, limit = 50 } = req.query;

  const transactions = [
    {
      id: 1,
      containerId: id,
      transactionType: 'GATE_IN',
      transactionCode: 'GI',
      transactionDate: '2024-01-15T14:00:00Z',
      location: 'GATE-A',
      operator: 'gate_operator',
      details: {
        sealNumber: 'SEAL-12345',
        sealIntact: true,
        driverName: 'John Driver',
        tractorNumber: 'TRC-001'
      },
      notes: '',
      createdAt: '2024-01-15T14:00:00Z'
    },
    {
      id: 2,
      containerId: id,
      transactionType: 'DOCK_ASSIGNMENT',
      transactionCode: 'DA',
      transactionDate: '2024-01-15T14:30:00Z',
      location: 'DOCK-A1',
      operator: 'dispatcher',
      details: {
        previousLocation: 'YARD-A5',
        newLocation: 'DOCK-A1'
      },
      notes: 'Moved to dock for unloading',
      createdAt: '2024-01-15T14:30:00Z'
    },
    {
      id: 3,
      containerId: id,
      transactionType: 'SEAL_BREAK',
      transactionCode: 'SB',
      transactionDate: '2024-01-15T15:00:00Z',
      location: 'DOCK-A1',
      operator: 'jsmith',
      details: {
        sealNumber: 'SEAL-12345',
        sealCondition: 'INTACT',
        witnessedBy: 'supervisor1'
      },
      notes: 'Seal broken for receiving',
      createdAt: '2024-01-15T15:00:00Z'
    },
    {
      id: 4,
      containerId: id,
      transactionType: 'RECEIVING_START',
      transactionCode: 'RS',
      transactionDate: '2024-01-15T15:05:00Z',
      location: 'DOCK-A1',
      operator: 'jsmith',
      details: {
        poNumber: 'PO-2024-1001',
        expectedCases: 1500
      },
      notes: '',
      createdAt: '2024-01-15T15:05:00Z'
    },
    {
      id: 5,
      containerId: id,
      transactionType: 'RECEIVING_COMPLETE',
      transactionCode: 'RC',
      transactionDate: '2024-01-15T18:00:00Z',
      location: 'DOCK-A1',
      operator: 'jsmith',
      details: {
        receivedCases: 1485,
        damagedCases: 15,
        shortCases: 0,
        overCases: 0
      },
      notes: '15 cases damaged on pallet 23',
      createdAt: '2024-01-15T18:00:00Z'
    },
    {
      id: 6,
      containerId: id,
      transactionType: 'EMPTY',
      transactionCode: 'EM',
      transactionDate: '2024-01-15T18:30:00Z',
      location: 'DOCK-A1',
      operator: 'jsmith',
      details: {
        sweptClean: true,
        inspectionPassed: true
      },
      notes: 'Container empty and ready for return',
      createdAt: '2024-01-15T18:30:00Z'
    }
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginatedTransactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: transactions.length,
      pages: Math.ceil(transactions.length / parseInt(limit))
    }
  });
}));

// Add container transaction (IMRRA)
router.post('/:id/transactions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    transactionType,
    transactionCode,
    location,
    details,
    notes
  } = req.body;

  const transaction = {
    id: Date.now(),
    containerId: id,
    transactionType,
    transactionCode,
    transactionDate: new Date().toISOString(),
    location,
    operator: req.user?.username || 'system',
    details: details || {},
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Transaction recorded successfully',
    data: transaction
  });
}));

// Update container transaction (IMRRA maintenance)
router.put('/:id/transactions/:transactionId', asyncHandler(async (req, res) => {
  const { id, transactionId } = req.params;
  const updates = req.body;

  const updatedTransaction = {
    id: parseInt(transactionId),
    containerId: id,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.username || 'system'
  };

  res.json({
    success: true,
    message: 'Transaction updated successfully',
    data: updatedTransaction
  });
}));

// Delete container transaction (IMRRA)
router.delete('/:id/transactions/:transactionId', asyncHandler(async (req, res) => {
  const { id, transactionId } = req.params;

  res.json({
    success: true,
    message: `Transaction ${transactionId} deleted from container ${id}`
  });
}));

// =============================================================================
// IMAJA - Container Total Balance Adjustment
// =============================================================================

// Get container balance summary
router.get('/:id/balance', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const balance = {
    containerId: id,
    containerNumber: 'CONT-2024-001',
    poNumber: 'PO-2024-1001',

    // Expected vs Actual
    expectedCases: 1500,
    receivedCases: 1485,
    variance: -15,
    variancePercent: -1.0,

    // Breakdown by status
    damagedCases: 15,
    shortCases: 0,
    overCases: 0,
    rejectedCases: 0,

    // By item
    itemBalances: [
      {
        itemCode: 'SKU-001',
        description: 'Widget A',
        expectedQty: 500,
        receivedQty: 495,
        damagedQty: 5,
        adjustedQty: 0,
        finalQty: 495,
        variance: -5
      },
      {
        itemCode: 'SKU-002',
        description: 'Widget B',
        expectedQty: 500,
        receivedQty: 490,
        damagedQty: 10,
        adjustedQty: 0,
        finalQty: 490,
        variance: -10
      },
      {
        itemCode: 'SKU-003',
        description: 'Widget C',
        expectedQty: 500,
        receivedQty: 500,
        damagedQty: 0,
        adjustedQty: 0,
        finalQty: 500,
        variance: 0
      }
    ],

    // Adjustments history
    adjustments: [],

    // Status
    balanceStatus: 'VARIANCE_EXISTS',
    lastReconciled: null,
    reconciledBy: null,

    calculatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: balance
  });
}));

// Submit balance adjustment (IMAJA)
router.post('/:id/balance/adjust', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    adjustments,
    adjustmentReason,
    notes,
    supervisorApproval
  } = req.body;

  // adjustments is array of { itemCode, adjustmentQty, adjustmentType, reason }
  if (!adjustments || !Array.isArray(adjustments)) {
    return res.status(400).json({
      success: false,
      error: 'Adjustments array is required'
    });
  }

  const adjustmentRecord = {
    id: Date.now(),
    containerId: id,
    adjustments: adjustments.map((adj, idx) => ({
      lineNumber: idx + 1,
      itemCode: adj.itemCode,
      adjustmentQty: adj.adjustmentQty,
      adjustmentType: adj.adjustmentType, // ADD, SUBTRACT, DAMAGE, REJECT
      reason: adj.reason
    })),
    adjustmentReason,
    notes,
    supervisorApproval,
    status: supervisorApproval ? 'APPROVED' : 'PENDING_APPROVAL',
    submittedBy: req.user?.username || 'system',
    submittedAt: new Date().toISOString(),
    approvedBy: supervisorApproval ? req.user?.username : null,
    approvedAt: supervisorApproval ? new Date().toISOString() : null
  };

  res.json({
    success: true,
    message: 'Balance adjustment submitted successfully',
    data: adjustmentRecord
  });
}));

// Reconcile container balance (IMAJA final)
router.post('/:id/balance/reconcile', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    reconciledItems,
    notes,
    forceReconcile
  } = req.body;

  const reconciliation = {
    containerId: id,
    reconciledItems,
    status: 'RECONCILED',
    reconciledBy: req.user?.username || 'system',
    reconciledAt: new Date().toISOString(),
    notes,
    forceReconcile: forceReconcile || false,
    variancesAccepted: forceReconcile
  };

  res.json({
    success: true,
    message: 'Container balance reconciled successfully',
    data: reconciliation
  });
}));

// =============================================================================
// Container Types and Status Reference
// =============================================================================

// Get container type definitions
router.get('/reference/types', asyncHandler(async (req, res) => {
  const types = [
    { code: 'OCEAN_20FT', name: '20ft Standard Container', length: 20, unit: 'FT' },
    { code: 'OCEAN_40FT', name: '40ft Standard Container', length: 40, unit: 'FT' },
    { code: 'OCEAN_40FT_HC', name: '40ft High Cube Container', length: 40, unit: 'FT', height: 9.5 },
    { code: 'OCEAN_45FT', name: '45ft Container', length: 45, unit: 'FT' },
    { code: 'REEFER_20FT', name: '20ft Refrigerated Container', length: 20, unit: 'FT', refrigerated: true },
    { code: 'REEFER_40FT', name: '40ft Refrigerated Container', length: 40, unit: 'FT', refrigerated: true },
    { code: 'FLAT_RACK', name: 'Flat Rack Container', collapsible: true },
    { code: 'OPEN_TOP', name: 'Open Top Container', openTop: true },
    { code: 'TANK', name: 'Tank Container', liquid: true },
    { code: 'DOMESTIC_53FT', name: '53ft Domestic Trailer', length: 53, unit: 'FT', domestic: true }
  ];

  res.json({
    success: true,
    data: types
  });
}));

// Get container status definitions
router.get('/reference/statuses', asyncHandler(async (req, res) => {
  const statuses = [
    { code: 'SCHEDULED', name: 'Scheduled', description: 'Container scheduled for arrival' },
    { code: 'IN_TRANSIT', name: 'In Transit', description: 'Container in transit to warehouse' },
    { code: 'AT_PORT', name: 'At Port', description: 'Container arrived at port, awaiting pickup' },
    { code: 'CUSTOMS_HOLD', name: 'Customs Hold', description: 'Container held by customs' },
    { code: 'GATE_IN', name: 'Gate In', description: 'Container checked in at gate' },
    { code: 'IN_YARD', name: 'In Yard', description: 'Container in yard awaiting dock' },
    { code: 'AT_DOCK', name: 'At Dock', description: 'Container at dock door' },
    { code: 'UNLOADING', name: 'Unloading', description: 'Container being unloaded' },
    { code: 'RECEIVED', name: 'Received', description: 'Container receiving completed' },
    { code: 'EMPTY', name: 'Empty', description: 'Container emptied and ready for return' },
    { code: 'RETURN_SCHEDULED', name: 'Return Scheduled', description: 'Empty return scheduled' },
    { code: 'RETURNED', name: 'Returned', description: 'Container returned to depot' },
    { code: 'CANCELLED', name: 'Cancelled', description: 'Container shipment cancelled' }
  ];

  res.json({
    success: true,
    data: statuses
  });
}));

// Get transaction type definitions
router.get('/reference/transaction-types', asyncHandler(async (req, res) => {
  const transactionTypes = [
    { code: 'GI', name: 'Gate In', description: 'Container arrived at gate' },
    { code: 'GO', name: 'Gate Out', description: 'Container departed through gate' },
    { code: 'YM', name: 'Yard Move', description: 'Container moved within yard' },
    { code: 'DA', name: 'Dock Assignment', description: 'Container assigned to dock door' },
    { code: 'SB', name: 'Seal Break', description: 'Container seal broken for receiving' },
    { code: 'RS', name: 'Receiving Start', description: 'Receiving process started' },
    { code: 'RC', name: 'Receiving Complete', description: 'Receiving process completed' },
    { code: 'EM', name: 'Empty', description: 'Container emptied' },
    { code: 'IN', name: 'Inspection', description: 'Container inspected' },
    { code: 'HD', name: 'Hold', description: 'Container placed on hold' },
    { code: 'RL', name: 'Release', description: 'Container released from hold' },
    { code: 'DM', name: 'Damage', description: 'Damage recorded' },
    { code: 'AD', name: 'Adjustment', description: 'Balance adjustment made' },
    { code: 'TR', name: 'Transfer', description: 'Container transferred' },
    { code: 'RT', name: 'Return', description: 'Container returned to depot' }
  ];

  res.json({
    success: true,
    data: transactionTypes
  });
}));

export default router;
