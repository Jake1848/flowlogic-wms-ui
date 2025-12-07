import express from 'express';
const router = express.Router();


// Helper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================================
// IADEA - Ship Notice/Manifest Data Entry
// =============================================================================

// Get all ship notices (ASN) with filtering
router.get('/', asyncHandler(async (req, res) => {
  const {
    warehouseId,
    status,
    asnNumber,
    vendorId,
    poNumber,
    containerId,
    carrierCode,
    fromDate,
    toDate,
    expectedFromDate,
    expectedToDate,
    page = 1,
    limit = 50
  } = req.query;

  // Simulated ship notice data
  const shipNotices = [
    {
      id: 1,
      asnNumber: 'ASN-2024-001',
      asnType: 'STANDARD',
      status: 'RECEIVED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      vendorId: 1,
      vendorCode: 'ACME',
      vendorName: 'Acme Supplies',
      poNumbers: ['PO-2024-1001'],
      shipDate: '2024-01-12',
      expectedArrival: '2024-01-15',
      actualArrival: '2024-01-15',
      carrierCode: 'MAERSK',
      carrierName: 'Maersk Line',
      containerId: 'CONT-2024-001',
      sealNumber: 'SEAL-12345',
      bolNumber: 'BOL-2024-001',
      proNumber: null,
      totalCases: 1500,
      receivedCases: 1485,
      totalWeight: 25000,
      weightUnit: 'KG',
      totalPallets: 50,
      appointmentId: 'APT-2024-001',
      notes: 'Standard replenishment shipment',
      createdAt: '2024-01-11T10:00:00Z',
      updatedAt: '2024-01-15T18:00:00Z'
    },
    {
      id: 2,
      asnNumber: 'ASN-2024-002',
      asnType: 'STANDARD',
      status: 'IN_TRANSIT',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      vendorId: 2,
      vendorCode: 'GLOBAL',
      vendorName: 'Global Traders',
      poNumbers: ['PO-2024-1002'],
      shipDate: '2024-01-14',
      expectedArrival: '2024-01-20',
      actualArrival: null,
      carrierCode: 'EVERGREEN',
      carrierName: 'Evergreen Marine',
      containerId: 'CONT-2024-002',
      sealNumber: 'SEAL-12346',
      bolNumber: 'BOL-2024-002',
      proNumber: null,
      totalCases: 800,
      receivedCases: 0,
      totalWeight: 15000,
      weightUnit: 'KG',
      totalPallets: 30,
      appointmentId: 'APT-2024-002',
      notes: 'Electronics shipment',
      createdAt: '2024-01-14T08:00:00Z',
      updatedAt: '2024-01-14T08:00:00Z'
    },
    {
      id: 3,
      asnNumber: 'ASN-2024-003',
      asnType: 'REEFER',
      status: 'RECEIVING',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      vendorId: 3,
      vendorCode: 'FRESH',
      vendorName: 'Fresh Foods Inc',
      poNumbers: ['PO-2024-1003'],
      shipDate: '2024-01-10',
      expectedArrival: '2024-01-14',
      actualArrival: '2024-01-14',
      carrierCode: 'HAPAG',
      carrierName: 'Hapag-Lloyd',
      containerId: 'CONT-2024-003',
      sealNumber: 'SEAL-12347',
      bolNumber: 'BOL-2024-003',
      proNumber: null,
      totalCases: 600,
      receivedCases: 350,
      totalWeight: 12000,
      weightUnit: 'KG',
      totalPallets: 25,
      temperatureRequired: true,
      temperatureMin: -20,
      temperatureMax: -15,
      temperatureUnit: 'C',
      appointmentId: 'APT-2024-003',
      notes: 'Frozen foods - maintain cold chain',
      createdAt: '2024-01-10T14:00:00Z',
      updatedAt: '2024-01-14T12:00:00Z'
    },
    {
      id: 4,
      asnNumber: 'ASN-2024-004',
      asnType: 'LTL',
      status: 'SCHEDULED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      vendorId: 4,
      vendorCode: 'TECH',
      vendorName: 'Tech Components Ltd',
      poNumbers: ['PO-2024-1005', 'PO-2024-1006'],
      shipDate: '2024-01-15',
      expectedArrival: '2024-01-17',
      actualArrival: null,
      carrierCode: 'XPO',
      carrierName: 'XPO Logistics',
      containerId: null,
      sealNumber: null,
      bolNumber: 'BOL-2024-004',
      proNumber: 'PRO-123456789',
      totalCases: 200,
      receivedCases: 0,
      totalWeight: 3000,
      weightUnit: 'KG',
      totalPallets: 8,
      appointmentId: null,
      notes: 'LTL delivery - multiple POs consolidated',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    }
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedNotices = shipNotices.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginatedNotices,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: shipNotices.length,
      pages: Math.ceil(shipNotices.length / parseInt(limit))
    }
  });
}));

// Get ship notice by ID (IADEA detail view)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shipNotice = {
    id: parseInt(id),
    asnNumber: 'ASN-2024-001',
    asnType: 'STANDARD',
    status: 'RECEIVED',

    // Warehouse
    warehouseId: 1,
    warehouseName: 'Main Distribution Center',
    warehouseCode: 'DC01',

    // Vendor
    vendorId: 1,
    vendorCode: 'ACME',
    vendorName: 'Acme Supplies',
    vendorAddress: '123 Supplier St, Commerce City, CA 90001',
    vendorContact: 'Bob Vendor',
    vendorPhone: '555-123-4567',
    vendorEmail: 'shipping@acmesupplies.com',

    // Purchase orders
    poNumbers: ['PO-2024-1001'],
    poDetails: [
      {
        poNumber: 'PO-2024-1001',
        poDate: '2024-01-10',
        totalLines: 3,
        shippedLines: 3
      }
    ],

    // Shipping dates
    shipDate: '2024-01-12',
    expectedArrival: '2024-01-15',
    actualArrival: '2024-01-15',

    // Carrier info
    carrierCode: 'MAERSK',
    carrierName: 'Maersk Line',
    carrierScac: 'MSKU',
    carrierPhone: '800-555-0100',

    // Transport details
    modeOfTransport: 'OCEAN',
    serviceType: 'FCL',
    containerId: 'CONT-2024-001',
    containerType: 'OCEAN_40FT',
    containerSize: '40',
    sealNumber: 'SEAL-12345',
    sealType: 'BOLT',

    // Documentation
    bolNumber: 'BOL-2024-001',
    bolDate: '2024-01-12',
    proNumber: null,
    masterBol: null,
    houseBol: null,
    bookingNumber: 'BK-2024-001',
    vesselName: 'MSC MAYA',
    voyageNumber: 'V123',

    // Origin/Destination
    shipFromName: 'Acme Shanghai Factory',
    shipFromAddress: '456 Factory Road',
    shipFromCity: 'Shanghai',
    shipFromCountry: 'CN',
    portOfLoading: 'SHANGHAI',
    portOfDischarge: 'LOS ANGELES',

    // Cargo summary
    totalCases: 1500,
    receivedCases: 1485,
    damagedCases: 15,
    shortCases: 0,
    totalWeight: 25000,
    grossWeight: 26500,
    tareWeight: 4000,
    netWeight: 22500,
    weightUnit: 'KG',
    totalVolume: 2500,
    volumeUnit: 'CFT',
    totalPallets: 50,

    // Temperature (if applicable)
    temperatureRequired: false,
    temperatureMin: null,
    temperatureMax: null,
    temperatureUnit: 'C',
    actualTemperature: null,

    // Hazmat
    hazmat: false,
    hazmatClass: null,
    hazmatUnNumber: null,

    // Customs
    customsEntryRequired: true,
    customsEntryNumber: 'CE-2024-001',
    customsBroker: 'Global Customs LLC',
    customsStatus: 'CLEARED',
    customsClearanceDate: '2024-01-15T09:00:00Z',
    countryOfOrigin: 'CN',
    htsCodes: ['8471.30', '8471.41'],

    // Appointment
    appointmentId: 'APT-2024-001',
    appointmentDate: '2024-01-15',
    appointmentTime: '14:00-16:00',
    dockDoor: 'DOCK-A1',

    // Line items (manifest)
    lineItems: [
      {
        lineNumber: 1,
        poNumber: 'PO-2024-1001',
        poLine: 1,
        itemCode: 'SKU-001',
        itemDescription: 'Widget A - Standard',
        uom: 'EA',
        casesShipped: 500,
        casesReceived: 495,
        casesDamaged: 5,
        unitsPerCase: 1,
        totalUnits: 500,
        weight: 5000,
        weightUnit: 'KG',
        volume: 500,
        volumeUnit: 'CFT',
        lotNumber: 'LOT-2024-001',
        serialNumbers: [],
        expirationDate: '2025-01-15',
        countryOfOrigin: 'CN',
        htsCode: '8471.30',
        palletNumbers: ['PLT-001', 'PLT-002', 'PLT-003'],
        cartonNumbers: ['CTN-001-001', 'CTN-001-500']
      },
      {
        lineNumber: 2,
        poNumber: 'PO-2024-1001',
        poLine: 2,
        itemCode: 'SKU-002',
        itemDescription: 'Widget B - Premium',
        uom: 'EA',
        casesShipped: 500,
        casesReceived: 490,
        casesDamaged: 10,
        unitsPerCase: 1,
        totalUnits: 500,
        weight: 7500,
        weightUnit: 'KG',
        volume: 750,
        volumeUnit: 'CFT',
        lotNumber: 'LOT-2024-002',
        serialNumbers: [],
        expirationDate: '2025-02-15',
        countryOfOrigin: 'CN',
        htsCode: '8471.41',
        palletNumbers: ['PLT-004', 'PLT-005', 'PLT-006'],
        cartonNumbers: ['CTN-002-001', 'CTN-002-500']
      },
      {
        lineNumber: 3,
        poNumber: 'PO-2024-1001',
        poLine: 3,
        itemCode: 'SKU-003',
        itemDescription: 'Widget C - Economy',
        uom: 'EA',
        casesShipped: 500,
        casesReceived: 500,
        casesDamaged: 0,
        unitsPerCase: 1,
        totalUnits: 500,
        weight: 4000,
        weightUnit: 'KG',
        volume: 500,
        volumeUnit: 'CFT',
        lotNumber: 'LOT-2024-003',
        serialNumbers: [],
        expirationDate: '2025-03-15',
        countryOfOrigin: 'CN',
        htsCode: '8471.30',
        palletNumbers: ['PLT-007', 'PLT-008'],
        cartonNumbers: ['CTN-003-001', 'CTN-003-500']
      }
    ],

    // Pallet details
    palletDetails: [
      { palletNumber: 'PLT-001', itemCode: 'SKU-001', cases: 167, weight: 1670, received: true },
      { palletNumber: 'PLT-002', itemCode: 'SKU-001', cases: 167, weight: 1670, received: true },
      { palletNumber: 'PLT-003', itemCode: 'SKU-001', cases: 166, weight: 1660, received: true },
      { palletNumber: 'PLT-004', itemCode: 'SKU-002', cases: 167, weight: 2505, received: true },
      { palletNumber: 'PLT-005', itemCode: 'SKU-002', cases: 167, weight: 2505, received: true },
      { palletNumber: 'PLT-006', itemCode: 'SKU-002', cases: 166, weight: 2490, received: true },
      { palletNumber: 'PLT-007', itemCode: 'SKU-003', cases: 250, weight: 2000, received: true },
      { palletNumber: 'PLT-008', itemCode: 'SKU-003', cases: 250, weight: 2000, received: true }
    ],

    // Notes
    notes: 'Standard replenishment shipment',
    vendorNotes: 'Shipped on schedule',
    receivingNotes: '15 cases damaged on arrival',
    specialInstructions: '',

    // Documents attached
    documents: [
      { type: 'BOL', name: 'BOL-2024-001.pdf', url: '/docs/bol/BOL-2024-001.pdf' },
      { type: 'PACKING_LIST', name: 'PL-2024-001.pdf', url: '/docs/pl/PL-2024-001.pdf' },
      { type: 'COMMERCIAL_INVOICE', name: 'INV-2024-001.pdf', url: '/docs/inv/INV-2024-001.pdf' },
      { type: 'CUSTOMS_ENTRY', name: 'CE-2024-001.pdf', url: '/docs/customs/CE-2024-001.pdf' }
    ],

    // EDI info
    ediReceived: true,
    ediTransactionSet: '856',
    ediReceivedAt: '2024-01-11T08:00:00Z',
    ediSenderId: 'ACME',
    ediReceiverId: 'DC01',

    // History
    history: [
      { action: 'CREATED', timestamp: '2024-01-11T08:00:00Z', user: 'system', details: 'ASN received via EDI 856' },
      { action: 'VALIDATED', timestamp: '2024-01-11T08:05:00Z', user: 'system', details: 'ASN validated against PO' },
      { action: 'APPOINTMENT_SCHEDULED', timestamp: '2024-01-12T10:00:00Z', user: 'mwilliams', details: 'Appointment APT-2024-001 scheduled' },
      { action: 'VESSEL_DEPARTED', timestamp: '2024-01-12T18:00:00Z', user: 'system', details: 'Vessel MSC MAYA departed Shanghai' },
      { action: 'CUSTOMS_SUBMITTED', timestamp: '2024-01-14T06:00:00Z', user: 'system', details: 'Customs entry submitted' },
      { action: 'CUSTOMS_CLEARED', timestamp: '2024-01-15T09:00:00Z', user: 'system', details: 'Customs cleared' },
      { action: 'ARRIVED', timestamp: '2024-01-15T14:30:00Z', user: 'gate_operator', details: 'Container arrived at gate' },
      { action: 'RECEIVING_STARTED', timestamp: '2024-01-15T15:00:00Z', user: 'jsmith', details: 'Receiving started' },
      { action: 'RECEIVING_COMPLETED', timestamp: '2024-01-15T18:00:00Z', user: 'jsmith', details: '1485/1500 cases received' }
    ],

    createdBy: 'system',
    createdAt: '2024-01-11T08:00:00Z',
    updatedAt: '2024-01-15T18:00:00Z'
  };

  res.json({
    success: true,
    data: shipNotice
  });
}));

// Create new ship notice (IADEA add mode - manual entry)
router.post('/', asyncHandler(async (req, res) => {
  const {
    asnType,
    warehouseId,
    vendorId,
    poNumbers,
    shipDate,
    expectedArrival,
    carrierCode,
    containerId,
    sealNumber,
    bolNumber,
    proNumber,
    lineItems,
    totalCases,
    totalWeight,
    totalPallets,
    temperatureRequired,
    temperatureMin,
    temperatureMax,
    notes
  } = req.body;

  // Validate required fields
  if (!vendorId) {
    return res.status(400).json({
      success: false,
      error: 'Vendor ID is required'
    });
  }

  const asnNumber = `ASN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  // Calculate totals from line items if not provided
  let calcCases = totalCases || 0;
  let calcWeight = totalWeight || 0;
  if (lineItems && lineItems.length > 0 && !totalCases) {
    calcCases = lineItems.reduce((sum, line) => sum + (line.casesShipped || 0), 0);
    calcWeight = lineItems.reduce((sum, line) => sum + (line.weight || 0), 0);
  }

  const newASN = {
    id: Date.now(),
    asnNumber,
    asnType: asnType || 'STANDARD',
    status: 'DRAFT',
    warehouseId: warehouseId || 1,
    vendorId,
    poNumbers: poNumbers || [],
    shipDate,
    expectedArrival,
    actualArrival: null,
    carrierCode,
    containerId,
    sealNumber,
    bolNumber,
    proNumber,
    totalCases: calcCases,
    receivedCases: 0,
    totalWeight: calcWeight,
    weightUnit: 'KG',
    totalPallets: totalPallets || 0,
    temperatureRequired: temperatureRequired || false,
    temperatureMin,
    temperatureMax,
    temperatureUnit: 'C',
    lineItems: (lineItems || []).map((line, idx) => ({
      lineNumber: idx + 1,
      poNumber: line.poNumber,
      poLine: line.poLine,
      itemCode: line.itemCode,
      itemDescription: line.itemDescription,
      uom: line.uom || 'EA',
      casesShipped: line.casesShipped || 0,
      casesReceived: 0,
      unitsPerCase: line.unitsPerCase || 1,
      weight: line.weight || 0,
      lotNumber: line.lotNumber,
      expirationDate: line.expirationDate
    })),
    notes: notes || '',
    ediReceived: false,
    createdBy: req.user?.username || 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Ship notice created successfully',
    data: newASN
  });
}));

// Update ship notice (IADEA change mode)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedASN = {
    id: parseInt(id),
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.username || 'system'
  };

  res.json({
    success: true,
    message: 'Ship notice updated successfully',
    data: updatedASN
  });
}));

// Delete/Cancel ship notice (IADEA delete mode)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body;

  res.json({
    success: true,
    message: `Ship notice ${id} cancelled successfully`,
    cancelReason,
    cancelledAt: new Date().toISOString(),
    cancelledBy: req.user?.username || 'system'
  });
}));

// =============================================================================
// Ship Notice Line Operations
// =============================================================================

// Add line to ship notice
router.post('/:id/lines', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    poNumber,
    poLine,
    itemCode,
    itemDescription,
    uom,
    casesShipped,
    unitsPerCase,
    weight,
    lotNumber,
    expirationDate
  } = req.body;

  const newLine = {
    asnId: id,
    lineNumber: Date.now(),
    poNumber,
    poLine,
    itemCode,
    itemDescription,
    uom: uom || 'EA',
    casesShipped: casesShipped || 0,
    casesReceived: 0,
    unitsPerCase: unitsPerCase || 1,
    weight: weight || 0,
    lotNumber,
    expirationDate,
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Line item added successfully',
    data: newLine
  });
}));

// Update line
router.put('/:id/lines/:lineNumber', asyncHandler(async (req, res) => {
  const { id, lineNumber } = req.params;
  const updates = req.body;

  const updatedLine = {
    asnId: id,
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

// Delete line
router.delete('/:id/lines/:lineNumber', asyncHandler(async (req, res) => {
  const { id, lineNumber } = req.params;

  res.json({
    success: true,
    message: `Line ${lineNumber} deleted from ASN ${id}`
  });
}));

// =============================================================================
// Ship Notice Status Operations
// =============================================================================

// Submit ship notice (finalize)
router.post('/:id/submit', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = {
    asnId: id,
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
    submittedBy: req.user?.username || 'system'
  };

  res.json({
    success: true,
    message: 'Ship notice submitted',
    data: submission
  });
}));

// Validate ship notice against PO
router.post('/:id/validate', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const validation = {
    asnId: id,
    status: 'VALIDATED',
    validatedAt: new Date().toISOString(),
    validatedBy: 'system',
    validationResults: {
      poMatch: true,
      quantityMatch: true,
      itemMatch: true,
      warnings: [],
      errors: []
    }
  };

  res.json({
    success: true,
    message: 'Ship notice validated successfully',
    data: validation
  });
}));

// Schedule appointment for ship notice
router.post('/:id/schedule-appointment', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    appointmentDate,
    appointmentTime,
    dockDoor,
    notes
  } = req.body;

  const appointmentId = `APT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const appointment = {
    asnId: id,
    appointmentId,
    appointmentDate,
    appointmentTime,
    dockDoor,
    status: 'SCHEDULED',
    scheduledBy: req.user?.username || 'system',
    scheduledAt: new Date().toISOString(),
    notes
  };

  res.json({
    success: true,
    message: 'Appointment scheduled successfully',
    data: appointment
  });
}));

// Mark ship notice as arrived
router.post('/:id/arrival', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    actualArrival,
    dockDoor,
    gateTransactionId,
    sealVerified,
    sealIntact,
    notes
  } = req.body;

  const arrival = {
    asnId: id,
    status: 'ARRIVED',
    actualArrival: actualArrival || new Date().toISOString(),
    dockDoor,
    gateTransactionId,
    sealVerified: sealVerified || true,
    sealIntact: sealIntact !== false,
    arrivedBy: req.user?.username || 'gate_operator',
    arrivedAt: new Date().toISOString(),
    notes
  };

  res.json({
    success: true,
    message: 'Arrival recorded successfully',
    data: arrival
  });
}));

// =============================================================================
// Ship Notice Receiving
// =============================================================================

// Get receiving status for ship notice
router.get('/:id/receiving-status', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const receivingStatus = {
    asnId: parseInt(id),
    asnNumber: 'ASN-2024-001',
    status: 'RECEIVED',
    totalLines: 3,
    completedLines: 3,
    partialLines: 0,
    pendingLines: 0,
    totalCases: 1500,
    receivedCases: 1485,
    damagedCases: 15,
    shortCases: 0,
    overCases: 0,
    receivedPercent: 99.0,
    receivingStartTime: '2024-01-15T15:00:00Z',
    receivingEndTime: '2024-01-15T18:00:00Z',
    receivingDurationMinutes: 180,
    receivedBy: ['jsmith', 'mjones'],
    lineStatus: [
      {
        lineNumber: 1,
        itemCode: 'SKU-001',
        casesShipped: 500,
        casesReceived: 495,
        casesDamaged: 5,
        status: 'COMPLETE',
        variance: -5,
        variancePercent: -1.0
      },
      {
        lineNumber: 2,
        itemCode: 'SKU-002',
        casesShipped: 500,
        casesReceived: 490,
        casesDamaged: 10,
        status: 'COMPLETE',
        variance: -10,
        variancePercent: -2.0
      },
      {
        lineNumber: 3,
        itemCode: 'SKU-003',
        casesShipped: 500,
        casesReceived: 500,
        casesDamaged: 0,
        status: 'COMPLETE',
        variance: 0,
        variancePercent: 0
      }
    ],
    discrepancies: [
      {
        type: 'DAMAGE',
        lineNumber: 1,
        itemCode: 'SKU-001',
        quantity: 5,
        reason: 'Damaged packaging',
        reportedBy: 'jsmith',
        reportedAt: '2024-01-15T16:00:00Z'
      },
      {
        type: 'DAMAGE',
        lineNumber: 2,
        itemCode: 'SKU-002',
        quantity: 10,
        reason: 'Product defect',
        reportedBy: 'mjones',
        reportedAt: '2024-01-15T17:00:00Z'
      }
    ]
  };

  res.json({
    success: true,
    data: receivingStatus
  });
}));

// Record receipt against ship notice
router.post('/:id/receive', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    lineNumber,
    itemCode,
    casesReceived,
    casesDamaged,
    lotNumber,
    expirationDate,
    location,
    notes
  } = req.body;

  const receipt = {
    asnId: id,
    lineNumber,
    itemCode,
    casesReceived: casesReceived || 0,
    casesDamaged: casesDamaged || 0,
    netReceived: (casesReceived || 0) - (casesDamaged || 0),
    lotNumber,
    expirationDate,
    location,
    receivedBy: req.user?.username || 'receiver',
    receivedAt: new Date().toISOString(),
    notes
  };

  res.json({
    success: true,
    message: 'Receipt recorded successfully',
    data: receipt
  });
}));

// Complete ship notice receiving
router.post('/:id/complete-receiving', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    forceComplete,
    shortageReason,
    damageNotes,
    supervisorApproval
  } = req.body;

  const completion = {
    asnId: id,
    status: 'RECEIVED',
    completedAt: new Date().toISOString(),
    completedBy: req.user?.username || 'system',
    forceComplete: forceComplete || false,
    shortageReason,
    damageNotes,
    supervisorApproval,
    requiresFollowUp: forceComplete
  };

  res.json({
    success: true,
    message: 'Ship notice receiving completed',
    data: completion
  });
}));

// =============================================================================
// EDI Integration
// =============================================================================

// Receive EDI 856 ship notice
router.post('/edi/856', asyncHandler(async (req, res) => {
  const {
    ediContent,
    senderId,
    receiverId
  } = req.body;

  // This would parse the EDI 856 and create the ASN
  const parsedASN = {
    asnNumber: `ASN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    status: 'RECEIVED_EDI',
    ediReceived: true,
    ediTransactionSet: '856',
    ediReceivedAt: new Date().toISOString(),
    ediSenderId: senderId,
    ediReceiverId: receiverId,
    ediContent: 'Parsed content would be here',
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'EDI 856 ship notice received and processed',
    data: parsedASN
  });
}));

// Generate EDI 997 acknowledgment
router.post('/:id/edi/997', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const acknowledgment = {
    asnId: id,
    ediTransactionSet: '997',
    status: 'ACCEPTED',
    generatedAt: new Date().toISOString(),
    sentTo: 'vendor',
    ediContent: 'EDI 997 content would be generated here'
  };

  res.json({
    success: true,
    message: 'EDI 997 acknowledgment generated',
    data: acknowledgment
  });
}));

// =============================================================================
// Reference Data
// =============================================================================

// Get ship notice status definitions
router.get('/reference/statuses', asyncHandler(async (req, res) => {
  const statuses = [
    { code: 'DRAFT', name: 'Draft', description: 'ASN created but not submitted' },
    { code: 'SUBMITTED', name: 'Submitted', description: 'ASN submitted' },
    { code: 'RECEIVED_EDI', name: 'Received (EDI)', description: 'Received via EDI' },
    { code: 'VALIDATED', name: 'Validated', description: 'Validated against PO' },
    { code: 'SCHEDULED', name: 'Scheduled', description: 'Appointment scheduled' },
    { code: 'IN_TRANSIT', name: 'In Transit', description: 'Shipment in transit' },
    { code: 'AT_PORT', name: 'At Port', description: 'Arrived at port' },
    { code: 'CUSTOMS_HOLD', name: 'Customs Hold', description: 'Held by customs' },
    { code: 'CUSTOMS_CLEARED', name: 'Customs Cleared', description: 'Customs cleared' },
    { code: 'ARRIVED', name: 'Arrived', description: 'Arrived at warehouse' },
    { code: 'RECEIVING', name: 'Receiving', description: 'Receiving in progress' },
    { code: 'RECEIVED', name: 'Received', description: 'Fully received' },
    { code: 'RECEIVED_PARTIAL', name: 'Received Partial', description: 'Partially received' },
    { code: 'CLOSED', name: 'Closed', description: 'ASN closed' },
    { code: 'CANCELLED', name: 'Cancelled', description: 'ASN cancelled' }
  ];

  res.json({
    success: true,
    data: statuses
  });
}));

// Get ship notice type definitions
router.get('/reference/types', asyncHandler(async (req, res) => {
  const types = [
    { code: 'STANDARD', name: 'Standard', description: 'Standard shipment' },
    { code: 'REEFER', name: 'Refrigerated', description: 'Temperature controlled' },
    { code: 'HAZMAT', name: 'Hazmat', description: 'Hazardous materials' },
    { code: 'LTL', name: 'LTL', description: 'Less than truckload' },
    { code: 'PARCEL', name: 'Parcel', description: 'Parcel/small package' },
    { code: 'AIR', name: 'Air Freight', description: 'Air freight shipment' },
    { code: 'CROSS_DOCK', name: 'Cross Dock', description: 'Cross dock shipment' }
  ];

  res.json({
    success: true,
    data: types
  });
}));

export default router;
