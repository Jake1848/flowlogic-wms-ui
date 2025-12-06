const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================================
// CSGTE - Gate In/Out Maintenance
// =============================================================================

// Get all gate transactions with filtering
router.get('/transactions', asyncHandler(async (req, res) => {
  const {
    warehouseId,
    gateId,
    transactionType,
    status,
    carrierId,
    driverName,
    tractorNumber,
    trailerNumber,
    containerId,
    appointmentId,
    fromDate,
    toDate,
    page = 1,
    limit = 50
  } = req.query;

  // Simulated gate transaction data
  const transactions = [
    {
      id: 1,
      transactionNumber: 'GT-2024-001',
      transactionType: 'GATE_IN',
      status: 'COMPLETED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      gateId: 'GATE-A',
      gateName: 'Main Entrance',
      transactionTime: '2024-01-15T14:00:00Z',
      appointmentId: 'APT-2024-001',
      appointmentType: 'INBOUND',
      carrierId: 1,
      carrierCode: 'MAERSK',
      carrierName: 'Maersk Line',
      driverName: 'John Driver',
      driverPhone: '555-123-4567',
      driverLicense: 'DL123456',
      driverLicenseState: 'CA',
      tractorNumber: 'TRC-001',
      trailerNumber: 'TRL-001',
      trailerType: 'CONTAINER_CHASSIS',
      containerId: 'CONT-2024-001',
      containerSize: '40FT',
      sealNumber: 'SEAL-12345',
      sealIntact: true,
      vendorId: 1,
      vendorName: 'Acme Supplies',
      poNumbers: ['PO-2024-1001'],
      expectedPallets: 50,
      notes: 'Container shipment from Shanghai',
      photoTaken: true,
      photoUrl: '/photos/gate/GT-2024-001.jpg',
      processedBy: 'gate_operator1',
      processedAt: '2024-01-15T14:05:00Z',
      yardLocation: 'YARD-A5',
      createdAt: '2024-01-15T14:00:00Z'
    },
    {
      id: 2,
      transactionNumber: 'GT-2024-002',
      transactionType: 'GATE_IN',
      status: 'COMPLETED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      gateId: 'GATE-A',
      gateName: 'Main Entrance',
      transactionTime: '2024-01-15T14:30:00Z',
      appointmentId: null,
      appointmentType: null,
      carrierId: 5,
      carrierCode: 'UPS',
      carrierName: 'UPS Freight',
      driverName: 'Mike Smith',
      driverPhone: '555-456-7890',
      driverLicense: 'DL789012',
      driverLicenseState: 'AZ',
      tractorNumber: 'UPS-501',
      trailerNumber: 'UPS-T201',
      trailerType: 'DRY_VAN',
      containerId: null,
      containerSize: null,
      sealNumber: 'SEAL-UPS-001',
      sealIntact: true,
      vendorId: null,
      vendorName: null,
      poNumbers: [],
      expectedPallets: 5,
      notes: 'LTL delivery - no appointment',
      photoTaken: true,
      photoUrl: '/photos/gate/GT-2024-002.jpg',
      processedBy: 'gate_operator1',
      processedAt: '2024-01-15T14:35:00Z',
      yardLocation: 'YARD-B1',
      createdAt: '2024-01-15T14:30:00Z'
    },
    {
      id: 3,
      transactionNumber: 'GT-2024-003',
      transactionType: 'GATE_OUT',
      status: 'COMPLETED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      gateId: 'GATE-B',
      gateName: 'Exit Gate',
      transactionTime: '2024-01-15T18:30:00Z',
      appointmentId: 'APT-2024-001',
      appointmentType: 'INBOUND',
      carrierId: 1,
      carrierCode: 'MAERSK',
      carrierName: 'Maersk Line',
      driverName: 'John Driver',
      driverPhone: '555-123-4567',
      driverLicense: 'DL123456',
      driverLicenseState: 'CA',
      tractorNumber: 'TRC-001',
      trailerNumber: 'TRL-001',
      trailerType: 'CONTAINER_CHASSIS',
      containerId: 'CONT-2024-001',
      containerSize: '40FT',
      sealNumber: null,
      sealIntact: null,
      newSealNumber: null,
      vendorId: null,
      vendorName: null,
      customerId: null,
      customerName: null,
      poNumbers: [],
      orderNumbers: [],
      expectedPallets: 0,
      actualPallets: 0,
      notes: 'Empty container out',
      photoTaken: true,
      photoUrl: '/photos/gate/GT-2024-003.jpg',
      processedBy: 'gate_operator2',
      processedAt: '2024-01-15T18:35:00Z',
      yardLocation: null,
      podSigned: false,
      podSignedBy: null,
      createdAt: '2024-01-15T18:30:00Z'
    },
    {
      id: 4,
      transactionNumber: 'GT-2024-004',
      transactionType: 'GATE_OUT',
      status: 'COMPLETED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      gateId: 'GATE-B',
      gateName: 'Exit Gate',
      transactionTime: '2024-01-15T16:00:00Z',
      appointmentId: 'APT-2024-004',
      appointmentType: 'OUTBOUND',
      carrierId: 4,
      carrierCode: 'SWIFT',
      carrierName: 'Swift Transport',
      driverName: 'Bob Hauler',
      driverPhone: '555-789-0123',
      driverLicense: 'DL345678',
      driverLicenseState: 'TX',
      tractorNumber: 'SWIFT-101',
      trailerNumber: 'SWIFT-T501',
      trailerType: 'DRY_VAN',
      containerId: null,
      containerSize: null,
      sealNumber: null,
      sealIntact: null,
      newSealNumber: 'SEAL-OUT-001',
      vendorId: null,
      vendorName: null,
      customerId: 1,
      customerName: 'ABC Retail',
      poNumbers: [],
      orderNumbers: ['ORD-2024-001', 'ORD-2024-002'],
      expectedPallets: 20,
      actualPallets: 20,
      notes: 'Outbound shipment to ABC Retail',
      photoTaken: true,
      photoUrl: '/photos/gate/GT-2024-004.jpg',
      processedBy: 'gate_operator2',
      processedAt: '2024-01-15T16:05:00Z',
      yardLocation: null,
      podSigned: true,
      podSignedBy: 'Bob Hauler',
      createdAt: '2024-01-15T16:00:00Z'
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

// Get gate transaction by ID
router.get('/transactions/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = {
    id: parseInt(id),
    transactionNumber: 'GT-2024-001',
    transactionType: 'GATE_IN',
    status: 'COMPLETED',

    // Location
    warehouseId: 1,
    warehouseName: 'Main Distribution Center',
    gateId: 'GATE-A',
    gateName: 'Main Entrance',
    laneNumber: 1,

    // Timing
    transactionTime: '2024-01-15T14:00:00Z',
    processedAt: '2024-01-15T14:05:00Z',
    dwellTime: 5, // minutes at gate

    // Appointment
    appointmentId: 'APT-2024-001',
    appointmentType: 'INBOUND',
    appointmentStatus: 'CHECKED_IN',
    scheduledArrival: '2024-01-15T14:00:00Z',
    arrivalVariance: 0, // minutes early/late

    // Carrier
    carrierId: 1,
    carrierCode: 'MAERSK',
    carrierName: 'Maersk Line',
    carrierScac: 'MSKU',

    // Driver
    driverName: 'John Driver',
    driverPhone: '555-123-4567',
    driverLicense: 'DL123456',
    driverLicenseState: 'CA',
    driverLicenseExpiry: '2025-12-31',
    driverPhoto: '/photos/drivers/DL123456.jpg',

    // Equipment
    tractorNumber: 'TRC-001',
    tractorMake: 'Freightliner',
    tractorColor: 'White',
    trailerNumber: 'TRL-001',
    trailerType: 'CONTAINER_CHASSIS',
    trailerLength: 40,

    // Container
    containerId: 'CONT-2024-001',
    containerType: 'OCEAN_40FT',
    containerSize: '40FT',
    containerOwner: 'MAERSK',

    // Seal
    sealNumber: 'SEAL-12345',
    sealType: 'BOLT',
    sealIntact: true,
    sealVerifiedBy: 'gate_operator1',
    newSealNumber: null,

    // Cargo info
    vendorId: 1,
    vendorName: 'Acme Supplies',
    vendorCode: 'ACME',
    customerId: null,
    customerName: null,
    poNumbers: ['PO-2024-1001'],
    orderNumbers: [],
    bolNumber: 'BOL-2024-001',

    // Load details
    expectedPallets: 50,
    expectedCases: 1500,
    expectedWeight: 25000,
    weightUnit: 'KG',
    commodityType: 'General Merchandise',
    hazmat: false,
    hazmatClass: null,

    // Temperature (if applicable)
    temperatureRequired: false,
    temperature: null,
    temperatureUnit: 'F',
    temperatureVerified: false,

    // Inspection
    inspectionRequired: true,
    inspectionCompleted: true,
    inspectionResult: 'PASS',
    inspectionNotes: 'Seal intact, no visible damage',
    inspectedBy: 'gate_operator1',
    inspectedAt: '2024-01-15T14:03:00Z',

    // Photos
    photoTaken: true,
    photos: [
      { type: 'FRONT', url: '/photos/gate/GT-2024-001-front.jpg' },
      { type: 'REAR', url: '/photos/gate/GT-2024-001-rear.jpg' },
      { type: 'SEAL', url: '/photos/gate/GT-2024-001-seal.jpg' },
      { type: 'LICENSE_PLATE', url: '/photos/gate/GT-2024-001-plate.jpg' }
    ],

    // Yard assignment
    yardLocation: 'YARD-A5',
    dockDoor: null,
    dockAssignedAt: null,

    // Compliance
    dotInspectionValid: true,
    insuranceValid: true,
    driverCertified: true,
    complianceNotes: '',

    // Security
    securityCleared: true,
    securityClearanceId: 'SC-2024-001',
    visitorBadgeIssued: false,
    visitorBadgeNumber: null,

    // Notes
    notes: 'Container shipment from Shanghai',
    internalNotes: 'Regular vendor - expedite processing',
    driverInstructions: 'Proceed to Yard A5, await dock assignment',

    // Processing
    processedBy: 'gate_operator1',
    processedByName: 'Tom Wilson',

    createdAt: '2024-01-15T14:00:00Z',
    updatedAt: '2024-01-15T14:05:00Z'
  };

  res.json({
    success: true,
    data: transaction
  });
}));

// Process Gate In (CSGTE)
router.post('/in', asyncHandler(async (req, res) => {
  const {
    warehouseId,
    gateId,
    appointmentId,
    carrierId,
    carrierCode,
    driverName,
    driverPhone,
    driverLicense,
    driverLicenseState,
    tractorNumber,
    trailerNumber,
    trailerType,
    containerId,
    containerSize,
    sealNumber,
    sealIntact,
    vendorId,
    poNumbers,
    bolNumber,
    expectedPallets,
    expectedWeight,
    hazmat,
    hazmatClass,
    temperatureRequired,
    temperature,
    notes
  } = req.body;

  // Validate required fields
  if (!driverName) {
    return res.status(400).json({
      success: false,
      error: 'Driver name is required'
    });
  }

  const transactionNumber = `GT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const yardLocation = `YARD-${String.fromCharCode(65 + Math.floor(Math.random() * 4))}${Math.floor(Math.random() * 10) + 1}`;

  const gateIn = {
    id: Date.now(),
    transactionNumber,
    transactionType: 'GATE_IN',
    status: 'COMPLETED',
    warehouseId: warehouseId || 1,
    gateId: gateId || 'GATE-A',
    transactionTime: new Date().toISOString(),
    appointmentId,
    carrierId,
    carrierCode,
    driverName,
    driverPhone,
    driverLicense,
    driverLicenseState,
    tractorNumber,
    trailerNumber,
    trailerType: trailerType || 'DRY_VAN',
    containerId,
    containerSize,
    sealNumber,
    sealIntact: sealIntact !== false,
    vendorId,
    poNumbers: poNumbers || [],
    bolNumber,
    expectedPallets: expectedPallets || 0,
    expectedWeight: expectedWeight || 0,
    hazmat: hazmat || false,
    hazmatClass,
    temperatureRequired: temperatureRequired || false,
    temperature,
    notes: notes || '',
    yardLocation,
    processedBy: req.user?.username || 'gate_operator',
    processedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Gate in processed successfully',
    data: gateIn,
    instructions: {
      yardLocation,
      message: `Proceed to ${yardLocation}. Await dock assignment.`
    }
  });
}));

// Process Gate Out (CSGTE)
router.post('/out', asyncHandler(async (req, res) => {
  const {
    warehouseId,
    gateId,
    appointmentId,
    carrierId,
    carrierCode,
    driverName,
    driverLicense,
    tractorNumber,
    trailerNumber,
    containerId,
    newSealNumber,
    customerId,
    orderNumbers,
    actualPallets,
    actualWeight,
    podSigned,
    podSignedBy,
    notes
  } = req.body;

  const transactionNumber = `GT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const gateOut = {
    id: Date.now(),
    transactionNumber,
    transactionType: 'GATE_OUT',
    status: 'COMPLETED',
    warehouseId: warehouseId || 1,
    gateId: gateId || 'GATE-B',
    transactionTime: new Date().toISOString(),
    appointmentId,
    carrierId,
    carrierCode,
    driverName,
    driverLicense,
    tractorNumber,
    trailerNumber,
    containerId,
    newSealNumber,
    customerId,
    orderNumbers: orderNumbers || [],
    actualPallets: actualPallets || 0,
    actualWeight: actualWeight || 0,
    podSigned: podSigned || false,
    podSignedBy,
    notes: notes || '',
    processedBy: req.user?.username || 'gate_operator',
    processedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Gate out processed successfully',
    data: gateOut
  });
}));

// Update gate transaction
router.put('/transactions/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedTransaction = {
    id: parseInt(id),
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.username || 'system'
  };

  res.json({
    success: true,
    message: 'Gate transaction updated successfully',
    data: updatedTransaction
  });
}));

// Void gate transaction
router.post('/transactions/:id/void', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { voidReason } = req.body;

  res.json({
    success: true,
    message: `Gate transaction ${id} voided`,
    data: {
      id: parseInt(id),
      status: 'VOIDED',
      voidReason,
      voidedBy: req.user?.username || 'system',
      voidedAt: new Date().toISOString()
    }
  });
}));

// =============================================================================
// IINCA - Inbound Compliance Select Criteria
// =============================================================================

// Get inbound compliance checks
router.get('/compliance/inbound', asyncHandler(async (req, res) => {
  const {
    warehouseId,
    status,
    carrierId,
    vendorId,
    fromDate,
    toDate,
    complianceType,
    page = 1,
    limit = 50
  } = req.query;

  const complianceRecords = [
    {
      id: 1,
      gateTransactionId: 'GT-2024-001',
      appointmentId: 'APT-2024-001',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      checkDate: '2024-01-15T14:00:00Z',
      carrierId: 1,
      carrierCode: 'MAERSK',
      carrierName: 'Maersk Line',
      vendorId: 1,
      vendorName: 'Acme Supplies',
      poNumbers: ['PO-2024-1001'],
      overallStatus: 'PASS',
      checks: [
        {
          checkType: 'DRIVER_LICENSE',
          status: 'PASS',
          required: true,
          details: 'Valid CA license, expires 2025-12-31'
        },
        {
          checkType: 'SEAL_INTEGRITY',
          status: 'PASS',
          required: true,
          details: 'Seal SEAL-12345 intact'
        },
        {
          checkType: 'APPOINTMENT_MATCH',
          status: 'PASS',
          required: true,
          details: 'Matches appointment APT-2024-001'
        },
        {
          checkType: 'CARRIER_INSURANCE',
          status: 'PASS',
          required: true,
          details: 'Insurance valid through 2024-06-30'
        },
        {
          checkType: 'DOT_INSPECTION',
          status: 'PASS',
          required: false,
          details: 'Valid DOT inspection sticker'
        },
        {
          checkType: 'HAZMAT_CERTIFICATION',
          status: 'N/A',
          required: false,
          details: 'Non-hazmat shipment'
        }
      ],
      notes: 'All compliance checks passed',
      checkedBy: 'gate_operator1',
      checkedAt: '2024-01-15T14:05:00Z'
    },
    {
      id: 2,
      gateTransactionId: 'GT-2024-002',
      appointmentId: null,
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      checkDate: '2024-01-15T14:30:00Z',
      carrierId: 5,
      carrierCode: 'UPS',
      carrierName: 'UPS Freight',
      vendorId: null,
      vendorName: null,
      poNumbers: [],
      overallStatus: 'WARNING',
      checks: [
        {
          checkType: 'DRIVER_LICENSE',
          status: 'PASS',
          required: true,
          details: 'Valid AZ license'
        },
        {
          checkType: 'SEAL_INTEGRITY',
          status: 'PASS',
          required: true,
          details: 'Seal intact'
        },
        {
          checkType: 'APPOINTMENT_MATCH',
          status: 'WARNING',
          required: false,
          details: 'No appointment - unscheduled LTL delivery'
        },
        {
          checkType: 'CARRIER_INSURANCE',
          status: 'PASS',
          required: true,
          details: 'UPS master insurance policy'
        }
      ],
      notes: 'Unscheduled delivery - supervisor approval obtained',
      approvedBy: 'supervisor1',
      checkedBy: 'gate_operator1',
      checkedAt: '2024-01-15T14:35:00Z'
    },
    {
      id: 3,
      gateTransactionId: 'GT-2024-005',
      appointmentId: 'APT-2024-006',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      checkDate: '2024-01-16T08:00:00Z',
      carrierId: 6,
      carrierCode: 'UNKNOWN',
      carrierName: 'Unknown Carrier',
      vendorId: 5,
      vendorName: 'New Vendor Inc',
      poNumbers: ['PO-2024-1007'],
      overallStatus: 'FAIL',
      checks: [
        {
          checkType: 'DRIVER_LICENSE',
          status: 'FAIL',
          required: true,
          details: 'License expired 2024-01-01'
        },
        {
          checkType: 'SEAL_INTEGRITY',
          status: 'WARNING',
          required: true,
          details: 'Seal number does not match ASN'
        },
        {
          checkType: 'APPOINTMENT_MATCH',
          status: 'PASS',
          required: true,
          details: 'Matches appointment'
        },
        {
          checkType: 'CARRIER_INSURANCE',
          status: 'FAIL',
          required: true,
          details: 'No insurance certificate on file'
        }
      ],
      notes: 'Entry denied - expired license and missing insurance',
      resolution: 'DENIED_ENTRY',
      checkedBy: 'gate_operator2',
      checkedAt: '2024-01-16T08:10:00Z'
    }
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedRecords = complianceRecords.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginatedRecords,
    summary: {
      total: complianceRecords.length,
      passed: complianceRecords.filter(r => r.overallStatus === 'PASS').length,
      warnings: complianceRecords.filter(r => r.overallStatus === 'WARNING').length,
      failed: complianceRecords.filter(r => r.overallStatus === 'FAIL').length
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: complianceRecords.length,
      pages: Math.ceil(complianceRecords.length / parseInt(limit))
    }
  });
}));

// Get compliance record by ID
router.get('/compliance/inbound/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const complianceRecord = {
    id: parseInt(id),
    gateTransactionId: 'GT-2024-001',
    appointmentId: 'APT-2024-001',
    warehouseId: 1,
    warehouseName: 'Main Distribution Center',
    checkDate: '2024-01-15T14:00:00Z',

    // Carrier info
    carrierId: 1,
    carrierCode: 'MAERSK',
    carrierName: 'Maersk Line',
    carrierScac: 'MSKU',

    // Vendor info
    vendorId: 1,
    vendorCode: 'ACME',
    vendorName: 'Acme Supplies',

    // Shipment info
    poNumbers: ['PO-2024-1001'],
    bolNumber: 'BOL-2024-001',
    containerId: 'CONT-2024-001',
    sealNumber: 'SEAL-12345',

    // Driver info
    driverName: 'John Driver',
    driverLicense: 'DL123456',
    driverLicenseState: 'CA',
    driverLicenseExpiry: '2025-12-31',

    // Equipment info
    tractorNumber: 'TRC-001',
    trailerNumber: 'TRL-001',

    // Overall status
    overallStatus: 'PASS',

    // Individual checks
    checks: [
      {
        checkType: 'DRIVER_LICENSE',
        checkName: 'Driver License Verification',
        status: 'PASS',
        required: true,
        weight: 10,
        details: 'Valid CA license DL123456, expires 2025-12-31',
        verifiedAt: '2024-01-15T14:02:00Z',
        verifiedBy: 'gate_operator1'
      },
      {
        checkType: 'SEAL_INTEGRITY',
        checkName: 'Seal Integrity Check',
        status: 'PASS',
        required: true,
        weight: 10,
        details: 'Seal SEAL-12345 intact, matches ASN',
        verifiedAt: '2024-01-15T14:03:00Z',
        verifiedBy: 'gate_operator1'
      },
      {
        checkType: 'APPOINTMENT_MATCH',
        checkName: 'Appointment Verification',
        status: 'PASS',
        required: true,
        weight: 8,
        details: 'Matches appointment APT-2024-001, scheduled 14:00',
        verifiedAt: '2024-01-15T14:01:00Z',
        verifiedBy: 'system'
      },
      {
        checkType: 'CARRIER_INSURANCE',
        checkName: 'Carrier Insurance Verification',
        status: 'PASS',
        required: true,
        weight: 10,
        details: 'Insurance certificate on file, valid through 2024-06-30',
        verifiedAt: '2024-01-15T14:01:00Z',
        verifiedBy: 'system'
      },
      {
        checkType: 'DOT_INSPECTION',
        checkName: 'DOT Inspection Sticker',
        status: 'PASS',
        required: false,
        weight: 5,
        details: 'Valid DOT inspection sticker, expires 2024-07-15',
        verifiedAt: '2024-01-15T14:04:00Z',
        verifiedBy: 'gate_operator1'
      },
      {
        checkType: 'HAZMAT_CERTIFICATION',
        checkName: 'Hazmat Certification',
        status: 'N/A',
        required: false,
        weight: 0,
        details: 'Non-hazmat shipment - not required',
        verifiedAt: null,
        verifiedBy: null
      },
      {
        checkType: 'CUSTOMS_CLEARANCE',
        checkName: 'Customs Clearance Status',
        status: 'PASS',
        required: true,
        weight: 10,
        details: 'Customs cleared, entry CE-2024-001',
        verifiedAt: '2024-01-15T14:00:00Z',
        verifiedBy: 'system'
      },
      {
        checkType: 'FOOD_SAFETY',
        checkName: 'Food Safety Compliance',
        status: 'N/A',
        required: false,
        weight: 0,
        details: 'Non-food shipment - not required',
        verifiedAt: null,
        verifiedBy: null
      }
    ],

    // Score
    complianceScore: 100,
    maxScore: 100,
    scorePercent: 100,

    // Documents
    documentsRequired: ['BOL', 'PACKING_LIST', 'CUSTOMS_ENTRY'],
    documentsReceived: ['BOL', 'PACKING_LIST', 'CUSTOMS_ENTRY'],
    documentsMissing: [],

    // Notes and resolution
    notes: 'All compliance checks passed',
    internalNotes: 'Regular vendor, expedited processing',
    resolution: 'APPROVED',
    resolutionNotes: '',

    // Approval
    approvedBy: null,
    approvedAt: null,
    supervisorOverride: false,

    // Processing
    checkedBy: 'gate_operator1',
    checkedByName: 'Tom Wilson',
    checkedAt: '2024-01-15T14:05:00Z',

    createdAt: '2024-01-15T14:00:00Z',
    updatedAt: '2024-01-15T14:05:00Z'
  };

  res.json({
    success: true,
    data: complianceRecord
  });
}));

// Submit compliance check (IINCA)
router.post('/compliance/inbound', asyncHandler(async (req, res) => {
  const {
    gateTransactionId,
    appointmentId,
    warehouseId,
    carrierId,
    vendorId,
    poNumbers,
    driverName,
    driverLicense,
    driverLicenseState,
    sealNumber,
    checks,
    notes
  } = req.body;

  // Process checks and determine overall status
  let overallStatus = 'PASS';
  const requiredChecks = (checks || []).filter(c => c.required);
  const failedRequired = requiredChecks.filter(c => c.status === 'FAIL');
  const warnings = (checks || []).filter(c => c.status === 'WARNING');

  if (failedRequired.length > 0) {
    overallStatus = 'FAIL';
  } else if (warnings.length > 0) {
    overallStatus = 'WARNING';
  }

  const complianceRecord = {
    id: Date.now(),
    gateTransactionId,
    appointmentId,
    warehouseId: warehouseId || 1,
    checkDate: new Date().toISOString(),
    carrierId,
    vendorId,
    poNumbers: poNumbers || [],
    driverName,
    driverLicense,
    driverLicenseState,
    sealNumber,
    overallStatus,
    checks: checks || [],
    notes: notes || '',
    resolution: overallStatus === 'FAIL' ? 'PENDING' : 'APPROVED',
    checkedBy: req.user?.username || 'gate_operator',
    checkedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: `Compliance check completed - ${overallStatus}`,
    data: complianceRecord
  });
}));

// Override compliance failure (supervisor)
router.post('/compliance/inbound/:id/override', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { overrideReason, notes } = req.body;

  if (!overrideReason) {
    return res.status(400).json({
      success: false,
      error: 'Override reason is required'
    });
  }

  const override = {
    complianceId: id,
    overrideStatus: 'APPROVED_WITH_OVERRIDE',
    overrideReason,
    notes,
    overriddenBy: req.user?.username || 'supervisor',
    overriddenAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Compliance override approved',
    data: override
  });
}));

// =============================================================================
// Yard Management
// =============================================================================

// Get yard status
router.get('/yard/status', asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;

  const yardStatus = {
    warehouseId: warehouseId || 1,
    warehouseName: 'Main Distribution Center',
    totalSpots: 50,
    occupiedSpots: 23,
    availableSpots: 27,
    occupancyPercent: 46,
    zones: [
      {
        zoneId: 'YARD-A',
        zoneName: 'Zone A - Inbound Staging',
        totalSpots: 15,
        occupiedSpots: 8,
        availableSpots: 7,
        spots: [
          { spotId: 'YARD-A1', status: 'OCCUPIED', containerId: 'CONT-2024-002', appointmentId: 'APT-2024-002', arrivalTime: '2024-01-15T10:00:00Z' },
          { spotId: 'YARD-A2', status: 'AVAILABLE', containerId: null, appointmentId: null, arrivalTime: null },
          { spotId: 'YARD-A3', status: 'OCCUPIED', containerId: null, trailerId: 'TRL-005', appointmentId: 'APT-2024-007', arrivalTime: '2024-01-15T11:30:00Z' },
          { spotId: 'YARD-A4', status: 'AVAILABLE', containerId: null, appointmentId: null, arrivalTime: null },
          { spotId: 'YARD-A5', status: 'OCCUPIED', containerId: 'CONT-2024-001', appointmentId: 'APT-2024-001', arrivalTime: '2024-01-15T14:00:00Z' }
        ]
      },
      {
        zoneId: 'YARD-B',
        zoneName: 'Zone B - LTL Area',
        totalSpots: 10,
        occupiedSpots: 3,
        availableSpots: 7,
        spots: [
          { spotId: 'YARD-B1', status: 'OCCUPIED', trailerId: 'UPS-T201', appointmentId: null, arrivalTime: '2024-01-15T14:30:00Z' },
          { spotId: 'YARD-B2', status: 'AVAILABLE', trailerId: null, appointmentId: null, arrivalTime: null }
        ]
      },
      {
        zoneId: 'YARD-C',
        zoneName: 'Zone C - Reefer Area',
        totalSpots: 10,
        occupiedSpots: 5,
        availableSpots: 5,
        electricalHookups: true,
        spots: [
          { spotId: 'YARD-C1', status: 'OCCUPIED', containerId: 'CONT-2024-003', appointmentId: 'APT-2024-003', temperature: -18, arrivalTime: '2024-01-14T07:30:00Z' }
        ]
      },
      {
        zoneId: 'YARD-D',
        zoneName: 'Zone D - Outbound Staging',
        totalSpots: 15,
        occupiedSpots: 7,
        availableSpots: 8,
        spots: []
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  res.json({
    success: true,
    data: yardStatus
  });
}));

// Assign yard spot
router.post('/yard/assign', asyncHandler(async (req, res) => {
  const {
    gateTransactionId,
    containerId,
    trailerId,
    spotId,
    notes
  } = req.body;

  const assignment = {
    id: Date.now(),
    gateTransactionId,
    containerId,
    trailerId,
    spotId: spotId || `YARD-A${Math.floor(Math.random() * 10) + 1}`,
    assignedAt: new Date().toISOString(),
    assignedBy: req.user?.username || 'dispatcher',
    status: 'ASSIGNED',
    notes
  };

  res.json({
    success: true,
    message: `Assigned to spot ${assignment.spotId}`,
    data: assignment
  });
}));

// Move yard equipment
router.post('/yard/move', asyncHandler(async (req, res) => {
  const {
    containerId,
    trailerId,
    fromSpot,
    toSpot,
    reason,
    notes
  } = req.body;

  const move = {
    id: Date.now(),
    containerId,
    trailerId,
    fromSpot,
    toSpot,
    moveTime: new Date().toISOString(),
    movedBy: req.user?.username || 'yarddog',
    reason,
    notes,
    status: 'COMPLETED'
  };

  res.json({
    success: true,
    message: `Moved from ${fromSpot} to ${toSpot}`,
    data: move
  });
}));

// =============================================================================
// Reference Data
// =============================================================================

// Get gate list
router.get('/reference/gates', asyncHandler(async (req, res) => {
  const gates = [
    { gateId: 'GATE-A', name: 'Main Entrance', type: 'ENTRY', status: 'OPEN', lanes: 2 },
    { gateId: 'GATE-B', name: 'Exit Gate', type: 'EXIT', status: 'OPEN', lanes: 2 },
    { gateId: 'GATE-C', name: 'Employee Entrance', type: 'BOTH', status: 'OPEN', lanes: 1 },
    { gateId: 'GATE-D', name: 'Emergency Exit', type: 'EXIT', status: 'CLOSED', lanes: 1 }
  ];

  res.json({
    success: true,
    data: gates
  });
}));

// Get compliance check types
router.get('/reference/compliance-checks', asyncHandler(async (req, res) => {
  const checkTypes = [
    { code: 'DRIVER_LICENSE', name: 'Driver License Verification', required: true, description: 'Verify driver has valid license' },
    { code: 'SEAL_INTEGRITY', name: 'Seal Integrity Check', required: true, description: 'Verify seal number and integrity' },
    { code: 'APPOINTMENT_MATCH', name: 'Appointment Verification', required: true, description: 'Match to scheduled appointment' },
    { code: 'CARRIER_INSURANCE', name: 'Carrier Insurance', required: true, description: 'Verify carrier insurance is valid' },
    { code: 'DOT_INSPECTION', name: 'DOT Inspection Sticker', required: false, description: 'Check for valid DOT inspection' },
    { code: 'HAZMAT_CERTIFICATION', name: 'Hazmat Certification', required: false, description: 'Verify hazmat driver certification' },
    { code: 'CUSTOMS_CLEARANCE', name: 'Customs Clearance', required: true, description: 'Verify customs clearance for imports' },
    { code: 'FOOD_SAFETY', name: 'Food Safety Compliance', required: false, description: 'FSMA and food safety requirements' },
    { code: 'TEMPERATURE_CHECK', name: 'Temperature Verification', required: false, description: 'Verify reefer temperature' },
    { code: 'WEIGHT_CHECK', name: 'Weight Verification', required: false, description: 'Scale weight verification' }
  ];

  res.json({
    success: true,
    data: checkTypes
  });
}));

module.exports = router;
