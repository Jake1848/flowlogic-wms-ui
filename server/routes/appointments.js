const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================================
// IMRAA - Appointment Maintenance
// =============================================================================

// Get all appointments with filtering
router.get('/', asyncHandler(async (req, res) => {
  const {
    warehouseId,
    status,
    appointmentType,
    appointmentDate,
    fromDate,
    toDate,
    carrierId,
    vendorId,
    poNumber,
    containerId,
    dockDoor,
    page = 1,
    limit = 50
  } = req.query;

  // Simulated appointment data for development
  const appointments = [
    {
      id: 1,
      appointmentNumber: 'APT-2024-001',
      appointmentType: 'INBOUND',
      status: 'COMPLETED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      scheduledDate: '2024-01-15',
      scheduledTimeSlot: '14:00-16:00',
      scheduledArrival: '2024-01-15T14:00:00Z',
      actualArrival: '2024-01-15T14:30:00Z',
      checkInTime: '2024-01-15T14:35:00Z',
      checkOutTime: '2024-01-15T18:30:00Z',
      dockDoor: 'DOCK-A1',
      carrierId: 1,
      carrierName: 'Maersk Line',
      carrierCode: 'MAERSK',
      driverName: 'John Driver',
      driverPhone: '555-123-4567',
      driverLicense: 'DL123456',
      tractorNumber: 'TRC-001',
      trailerNumber: 'TRL-001',
      containerId: 'CONT-2024-001',
      sealNumber: 'SEAL-12345',
      vendorId: 1,
      vendorName: 'Acme Supplies',
      poNumbers: ['PO-2024-1001'],
      expectedPallets: 50,
      actualPallets: 48,
      expectedCases: 1500,
      actualCases: 1485,
      expectedWeight: 25000,
      actualWeight: 24800,
      weightUnit: 'KG',
      commodityType: 'General Merchandise',
      temperatureRequired: false,
      temperature: null,
      notes: 'Dock A1 - Regular receiving',
      specialInstructions: '',
      createdBy: 'mwilliams',
      createdAt: '2024-01-12T10:00:00Z',
      updatedAt: '2024-01-15T18:30:00Z'
    },
    {
      id: 2,
      appointmentNumber: 'APT-2024-002',
      appointmentType: 'INBOUND',
      status: 'SCHEDULED',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      scheduledDate: '2024-01-20',
      scheduledTimeSlot: '08:00-10:00',
      scheduledArrival: '2024-01-20T08:00:00Z',
      actualArrival: null,
      checkInTime: null,
      checkOutTime: null,
      dockDoor: 'DOCK-B2',
      carrierId: 2,
      carrierName: 'Evergreen Marine',
      carrierCode: 'EVERGREEN',
      driverName: null,
      driverPhone: null,
      driverLicense: null,
      tractorNumber: null,
      trailerNumber: null,
      containerId: 'CONT-2024-002',
      sealNumber: 'SEAL-12346',
      vendorId: 2,
      vendorName: 'Global Traders',
      poNumbers: ['PO-2024-1002'],
      expectedPallets: 30,
      actualPallets: null,
      expectedCases: 800,
      actualCases: null,
      expectedWeight: 15000,
      actualWeight: null,
      weightUnit: 'KG',
      commodityType: 'Electronics',
      temperatureRequired: false,
      temperature: null,
      notes: '',
      specialInstructions: 'Handle with care - fragile items',
      createdBy: 'system',
      createdAt: '2024-01-14T08:00:00Z',
      updatedAt: '2024-01-14T08:00:00Z'
    },
    {
      id: 3,
      appointmentNumber: 'APT-2024-003',
      appointmentType: 'INBOUND',
      status: 'RECEIVING',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      scheduledDate: '2024-01-14',
      scheduledTimeSlot: '06:00-08:00',
      scheduledArrival: '2024-01-14T06:00:00Z',
      actualArrival: '2024-01-14T07:30:00Z',
      checkInTime: '2024-01-14T07:45:00Z',
      checkOutTime: null,
      dockDoor: 'DOCK-C3',
      carrierId: 3,
      carrierName: 'Hapag-Lloyd',
      carrierCode: 'HAPAG',
      driverName: 'Mike Trucker',
      driverPhone: '555-987-6543',
      driverLicense: 'DL654321',
      tractorNumber: 'TRC-003',
      trailerNumber: 'TRL-003',
      containerId: 'CONT-2024-003',
      sealNumber: 'SEAL-12347',
      vendorId: 3,
      vendorName: 'Fresh Foods Inc',
      poNumbers: ['PO-2024-1003'],
      expectedPallets: 25,
      actualPallets: null,
      expectedCases: 600,
      actualCases: 350,
      expectedWeight: 12000,
      actualWeight: null,
      weightUnit: 'KG',
      commodityType: 'Frozen Foods',
      temperatureRequired: true,
      temperature: -18,
      notes: 'Refrigerated - maintain temp',
      specialInstructions: 'Priority unload - cold chain',
      createdBy: 'jsmith',
      createdAt: '2024-01-10T14:00:00Z',
      updatedAt: '2024-01-14T12:00:00Z'
    },
    {
      id: 4,
      appointmentNumber: 'APT-2024-004',
      appointmentType: 'OUTBOUND',
      status: 'LOADING',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      scheduledDate: '2024-01-14',
      scheduledTimeSlot: '10:00-12:00',
      scheduledArrival: '2024-01-14T10:00:00Z',
      actualArrival: '2024-01-14T10:15:00Z',
      checkInTime: '2024-01-14T10:20:00Z',
      checkOutTime: null,
      dockDoor: 'DOCK-D4',
      carrierId: 4,
      carrierName: 'Swift Transport',
      carrierCode: 'SWIFT',
      driverName: 'Bob Hauler',
      driverPhone: '555-456-7890',
      driverLicense: 'DL789012',
      tractorNumber: 'TRC-004',
      trailerNumber: 'TRL-004',
      containerId: null,
      sealNumber: null,
      vendorId: null,
      vendorName: null,
      customerId: 1,
      customerName: 'ABC Retail',
      orderNumbers: ['ORD-2024-001', 'ORD-2024-002'],
      expectedPallets: 20,
      actualPallets: 15,
      expectedCases: 400,
      actualCases: 300,
      expectedWeight: 8000,
      actualWeight: null,
      weightUnit: 'KG',
      commodityType: 'Mixed Merchandise',
      temperatureRequired: false,
      temperature: null,
      notes: 'Outbound to ABC Retail',
      specialInstructions: '',
      createdBy: 'dispatcher',
      createdAt: '2024-01-13T16:00:00Z',
      updatedAt: '2024-01-14T11:00:00Z'
    }
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedAppointments = appointments.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginatedAppointments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: appointments.length,
      pages: Math.ceil(appointments.length / parseInt(limit))
    }
  });
}));

// Get appointment by ID (IMRAA detail view)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = {
    id: parseInt(id),
    appointmentNumber: 'APT-2024-001',
    appointmentType: 'INBOUND',
    status: 'COMPLETED',
    warehouseId: 1,
    warehouseName: 'Main Distribution Center',

    // Scheduling
    scheduledDate: '2024-01-15',
    scheduledTimeSlot: '14:00-16:00',
    scheduledArrival: '2024-01-15T14:00:00Z',
    scheduledDeparture: '2024-01-15T18:00:00Z',
    estimatedDuration: 240, // minutes

    // Actual times
    actualArrival: '2024-01-15T14:30:00Z',
    checkInTime: '2024-01-15T14:35:00Z',
    dockAssignedTime: '2024-01-15T14:40:00Z',
    unloadStartTime: '2024-01-15T15:00:00Z',
    unloadEndTime: '2024-01-15T18:00:00Z',
    checkOutTime: '2024-01-15T18:30:00Z',
    actualDuration: 240, // minutes

    // Dock assignment
    dockDoor: 'DOCK-A1',
    yardLocation: null,
    laneNumber: null,

    // Carrier info
    carrierId: 1,
    carrierName: 'Maersk Line',
    carrierCode: 'MAERSK',
    carrierScac: 'MSKU',
    carrierPhone: '800-555-0100',
    carrierEmail: 'dispatch@maersk.com',

    // Driver info
    driverName: 'John Driver',
    driverPhone: '555-123-4567',
    driverLicense: 'DL123456',
    driverLicenseState: 'CA',

    // Equipment
    tractorNumber: 'TRC-001',
    trailerNumber: 'TRL-001',
    trailerType: '53FT_DRY',
    containerId: 'CONT-2024-001',
    containerSize: '40FT',
    chassisNumber: 'CHS-001',
    sealNumber: 'SEAL-12345',
    sealIntact: true,

    // Vendor/Customer
    vendorId: 1,
    vendorName: 'Acme Supplies',
    vendorCode: 'ACME',
    customerId: null,
    customerName: null,

    // Purchase orders
    poNumbers: ['PO-2024-1001'],
    poDetails: [
      {
        poNumber: 'PO-2024-1001',
        vendorName: 'Acme Supplies',
        expectedCases: 1500,
        receivedCases: 1485,
        status: 'RECEIVED'
      }
    ],

    // Quantities
    expectedPallets: 50,
    actualPallets: 48,
    expectedCases: 1500,
    actualCases: 1485,
    expectedWeight: 25000,
    actualWeight: 24800,
    weightUnit: 'KG',
    expectedCube: 2500,
    actualCube: null,
    cubeUnit: 'CFT',

    // Commodity
    commodityType: 'General Merchandise',
    hazmat: false,
    hazmatClass: null,
    temperatureRequired: false,
    temperature: null,
    temperatureMin: null,
    temperatureMax: null,
    temperatureUnit: 'F',

    // Status details
    lateArrival: true,
    lateMinutes: 30,
    detentionStart: null,
    detentionMinutes: 0,
    noShow: false,
    cancelled: false,
    cancelReason: null,

    // Compliance
    bolReceived: true,
    bolNumber: 'BOL-2024-001',
    podSigned: true,
    podSignedBy: 'John Receiver',
    podSignedAt: '2024-01-15T18:00:00Z',
    inspectionRequired: true,
    inspectionCompleted: true,
    inspectionResult: 'PASS',

    // Notes
    notes: 'Dock A1 - Regular receiving',
    specialInstructions: '',
    internalNotes: '30 min late due to traffic',
    driverNotes: '',

    // Receiving details
    receivingDetails: {
      startTime: '2024-01-15T15:00:00Z',
      endTime: '2024-01-15T18:00:00Z',
      receivedBy: 'jsmith',
      totalLines: 3,
      completedLines: 3,
      discrepancies: [
        {
          type: 'DAMAGE',
          itemCode: 'SKU-001',
          expectedQty: 500,
          actualQty: 495,
          variance: -5,
          reason: 'Damaged in transit'
        }
      ]
    },

    // History/Audit
    history: [
      { action: 'CREATED', timestamp: '2024-01-12T10:00:00Z', user: 'mwilliams', details: 'Appointment created' },
      { action: 'DOCK_ASSIGNED', timestamp: '2024-01-14T16:00:00Z', user: 'dispatcher', details: 'Assigned to DOCK-A1' },
      { action: 'CHECKED_IN', timestamp: '2024-01-15T14:35:00Z', user: 'gate_operator', details: 'Driver checked in at gate' },
      { action: 'RECEIVING_STARTED', timestamp: '2024-01-15T15:00:00Z', user: 'jsmith', details: 'Receiving initiated' },
      { action: 'RECEIVING_COMPLETED', timestamp: '2024-01-15T18:00:00Z', user: 'jsmith', details: '1485/1500 cases received' },
      { action: 'CHECKED_OUT', timestamp: '2024-01-15T18:30:00Z', user: 'gate_operator', details: 'Driver checked out' }
    ],

    createdBy: 'mwilliams',
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-15T18:30:00Z'
  };

  res.json({
    success: true,
    data: appointment
  });
}));

// Create new appointment (IMRAA add mode)
router.post('/', asyncHandler(async (req, res) => {
  const {
    appointmentType,
    warehouseId,
    scheduledDate,
    scheduledTimeSlot,
    dockDoor,
    carrierId,
    vendorId,
    customerId,
    poNumbers,
    orderNumbers,
    containerId,
    expectedPallets,
    expectedCases,
    expectedWeight,
    commodityType,
    temperatureRequired,
    temperature,
    notes,
    specialInstructions
  } = req.body;

  // Validate required fields
  if (!scheduledDate) {
    return res.status(400).json({
      success: false,
      error: 'Scheduled date is required'
    });
  }

  const appointmentNumber = `APT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const newAppointment = {
    id: Date.now(),
    appointmentNumber,
    appointmentType: appointmentType || 'INBOUND',
    status: 'SCHEDULED',
    warehouseId: warehouseId || 1,
    scheduledDate,
    scheduledTimeSlot,
    scheduledArrival: `${scheduledDate}T${scheduledTimeSlot?.split('-')[0] || '08:00'}:00Z`,
    actualArrival: null,
    checkInTime: null,
    checkOutTime: null,
    dockDoor,
    carrierId,
    vendorId,
    customerId,
    poNumbers: poNumbers || [],
    orderNumbers: orderNumbers || [],
    containerId,
    expectedPallets: expectedPallets || 0,
    actualPallets: null,
    expectedCases: expectedCases || 0,
    actualCases: null,
    expectedWeight: expectedWeight || 0,
    actualWeight: null,
    commodityType,
    temperatureRequired: temperatureRequired || false,
    temperature,
    notes: notes || '',
    specialInstructions: specialInstructions || '',
    createdBy: req.user?.username || 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: newAppointment
  });
}));

// Update appointment (IMRAA change mode)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedAppointment = {
    id: parseInt(id),
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.username || 'system'
  };

  res.json({
    success: true,
    message: 'Appointment updated successfully',
    data: updatedAppointment
  });
}));

// Delete/Cancel appointment (IMRAA delete mode)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body;

  res.json({
    success: true,
    message: `Appointment ${id} cancelled successfully`,
    cancelReason
  });
}));

// =============================================================================
// Appointment Check-in/Check-out
// =============================================================================

// Check in appointment (driver arrival)
router.post('/:id/check-in', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    driverName,
    driverPhone,
    driverLicense,
    driverLicenseState,
    tractorNumber,
    trailerNumber,
    containerId,
    sealNumber,
    sealIntact,
    notes
  } = req.body;

  const checkIn = {
    appointmentId: id,
    checkInTime: new Date().toISOString(),
    checkedInBy: req.user?.username || 'gate_operator',
    driverName,
    driverPhone,
    driverLicense,
    driverLicenseState,
    tractorNumber,
    trailerNumber,
    containerId,
    sealNumber,
    sealIntact,
    status: 'CHECKED_IN',
    notes
  };

  res.json({
    success: true,
    message: 'Appointment checked in successfully',
    data: checkIn
  });
}));

// Assign dock door
router.post('/:id/assign-dock', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dockDoor, notes } = req.body;

  if (!dockDoor) {
    return res.status(400).json({
      success: false,
      error: 'Dock door is required'
    });
  }

  const assignment = {
    appointmentId: id,
    dockDoor,
    assignedAt: new Date().toISOString(),
    assignedBy: req.user?.username || 'dispatcher',
    status: 'AT_DOCK',
    notes
  };

  res.json({
    success: true,
    message: `Dock ${dockDoor} assigned to appointment`,
    data: assignment
  });
}));

// Check out appointment (driver departure)
router.post('/:id/check-out', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    newSealNumber,
    podSigned,
    podSignedBy,
    notes
  } = req.body;

  const checkOut = {
    appointmentId: id,
    checkOutTime: new Date().toISOString(),
    checkedOutBy: req.user?.username || 'gate_operator',
    newSealNumber,
    podSigned,
    podSignedBy,
    status: 'COMPLETED',
    notes
  };

  res.json({
    success: true,
    message: 'Appointment checked out successfully',
    data: checkOut
  });
}));

// =============================================================================
// IRRCD - Review Partially Received Appointment
// =============================================================================

// Get partially received appointments
router.get('/status/partial', asyncHandler(async (req, res) => {
  const { warehouseId, fromDate, toDate, page = 1, limit = 50 } = req.query;

  const partialAppointments = [
    {
      id: 3,
      appointmentNumber: 'APT-2024-003',
      appointmentType: 'INBOUND',
      status: 'RECEIVING',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      scheduledDate: '2024-01-14',
      dockDoor: 'DOCK-C3',
      carrierId: 3,
      carrierName: 'Hapag-Lloyd',
      vendorId: 3,
      vendorName: 'Fresh Foods Inc',
      containerId: 'CONT-2024-003',
      poNumbers: ['PO-2024-1003'],
      expectedCases: 600,
      actualCases: 350,
      receivedPercent: 58.3,
      remainingCases: 250,
      lastActivityTime: '2024-01-14T12:00:00Z',
      receivingStartTime: '2024-01-14T09:00:00Z',
      elapsedMinutes: 180,
      receivedBy: 'jsmith',
      notes: 'Lunch break - resuming at 13:00',
      poDetails: [
        {
          poNumber: 'PO-2024-1003',
          totalLines: 5,
          completedLines: 3,
          partialLines: 1,
          pendingLines: 1,
          items: [
            { itemCode: 'FRZ-001', description: 'Frozen Peas', expected: 150, received: 150, status: 'COMPLETE' },
            { itemCode: 'FRZ-002', description: 'Frozen Corn', expected: 100, received: 100, status: 'COMPLETE' },
            { itemCode: 'FRZ-003', description: 'Frozen Carrots', expected: 150, received: 100, status: 'PARTIAL' },
            { itemCode: 'FRZ-004', description: 'Frozen Broccoli', expected: 100, received: 0, status: 'PENDING' },
            { itemCode: 'FRZ-005', description: 'Mixed Vegetables', expected: 100, received: 0, status: 'PENDING' }
          ]
        }
      ]
    },
    {
      id: 5,
      appointmentNumber: 'APT-2024-005',
      appointmentType: 'INBOUND',
      status: 'RECEIVING',
      warehouseId: 1,
      warehouseName: 'Main Distribution Center',
      scheduledDate: '2024-01-14',
      dockDoor: 'DOCK-A2',
      carrierId: 5,
      carrierName: 'XPO Logistics',
      vendorId: 4,
      vendorName: 'Tech Components Ltd',
      containerId: null,
      poNumbers: ['PO-2024-1005', 'PO-2024-1006'],
      expectedCases: 200,
      actualCases: 75,
      receivedPercent: 37.5,
      remainingCases: 125,
      lastActivityTime: '2024-01-14T11:30:00Z',
      receivingStartTime: '2024-01-14T10:00:00Z',
      elapsedMinutes: 90,
      receivedBy: 'rjohnson',
      notes: 'Waiting for forklift',
      poDetails: [
        {
          poNumber: 'PO-2024-1005',
          totalLines: 2,
          completedLines: 1,
          partialLines: 1,
          pendingLines: 0,
          items: [
            { itemCode: 'TECH-001', description: 'Circuit Boards', expected: 50, received: 50, status: 'COMPLETE' },
            { itemCode: 'TECH-002', description: 'Power Supplies', expected: 50, received: 25, status: 'PARTIAL' }
          ]
        },
        {
          poNumber: 'PO-2024-1006',
          totalLines: 2,
          completedLines: 0,
          partialLines: 0,
          pendingLines: 2,
          items: [
            { itemCode: 'TECH-003', description: 'Memory Modules', expected: 50, received: 0, status: 'PENDING' },
            { itemCode: 'TECH-004', description: 'CPU Units', expected: 50, received: 0, status: 'PENDING' }
          ]
        }
      ]
    }
  ];

  res.json({
    success: true,
    data: partialAppointments,
    summary: {
      totalPartial: partialAppointments.length,
      totalExpectedCases: 800,
      totalReceivedCases: 425,
      overallPercent: 53.1
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: partialAppointments.length,
      pages: 1
    }
  });
}));

// Get detailed partial receiving status for an appointment (IRRCD detail)
router.get('/:id/partial-status', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partialStatus = {
    appointmentId: parseInt(id),
    appointmentNumber: 'APT-2024-003',
    status: 'RECEIVING',
    dockDoor: 'DOCK-C3',

    // Overall progress
    expectedCases: 600,
    receivedCases: 350,
    remainingCases: 250,
    receivedPercent: 58.3,

    // Time tracking
    scheduledArrival: '2024-01-14T06:00:00Z',
    actualArrival: '2024-01-14T07:30:00Z',
    receivingStartTime: '2024-01-14T09:00:00Z',
    lastActivityTime: '2024-01-14T12:00:00Z',
    elapsedMinutes: 180,
    estimatedRemainingMinutes: 120,

    // Worker assignment
    receivingTeam: [
      { userId: 'jsmith', name: 'John Smith', role: 'LEAD', casesReceived: 200 },
      { userId: 'mjones', name: 'Mary Jones', role: 'RECEIVER', casesReceived: 150 }
    ],

    // PO breakdown
    purchaseOrders: [
      {
        poNumber: 'PO-2024-1003',
        vendorName: 'Fresh Foods Inc',
        status: 'PARTIAL',
        totalLines: 5,
        completedLines: 3,
        partialLines: 1,
        pendingLines: 1,
        expectedCases: 600,
        receivedCases: 350,
        items: [
          {
            lineNumber: 1,
            itemCode: 'FRZ-001',
            description: 'Frozen Peas',
            uom: 'CS',
            expectedQty: 150,
            receivedQty: 150,
            remainingQty: 0,
            status: 'COMPLETE',
            location: 'FRZ-A-01',
            lotNumber: 'LOT-FRZ-001',
            expirationDate: '2024-06-15',
            completedAt: '2024-01-14T09:30:00Z',
            completedBy: 'jsmith'
          },
          {
            lineNumber: 2,
            itemCode: 'FRZ-002',
            description: 'Frozen Corn',
            uom: 'CS',
            expectedQty: 100,
            receivedQty: 100,
            remainingQty: 0,
            status: 'COMPLETE',
            location: 'FRZ-A-02',
            lotNumber: 'LOT-FRZ-002',
            expirationDate: '2024-07-15',
            completedAt: '2024-01-14T10:00:00Z',
            completedBy: 'jsmith'
          },
          {
            lineNumber: 3,
            itemCode: 'FRZ-003',
            description: 'Frozen Carrots',
            uom: 'CS',
            expectedQty: 150,
            receivedQty: 100,
            remainingQty: 50,
            status: 'PARTIAL',
            location: 'FRZ-B-01',
            lotNumber: 'LOT-FRZ-003',
            expirationDate: '2024-08-15',
            lastReceivedAt: '2024-01-14T12:00:00Z',
            lastReceivedBy: 'mjones'
          },
          {
            lineNumber: 4,
            itemCode: 'FRZ-004',
            description: 'Frozen Broccoli',
            uom: 'CS',
            expectedQty: 100,
            receivedQty: 0,
            remainingQty: 100,
            status: 'PENDING',
            location: null,
            lotNumber: null,
            expirationDate: null
          },
          {
            lineNumber: 5,
            itemCode: 'FRZ-005',
            description: 'Mixed Vegetables',
            uom: 'CS',
            expectedQty: 100,
            receivedQty: 0,
            remainingQty: 100,
            status: 'PENDING',
            location: null,
            lotNumber: null,
            expirationDate: null
          }
        ]
      }
    ],

    // Issues/Discrepancies found
    discrepancies: [
      {
        type: 'DAMAGE',
        itemCode: 'FRZ-001',
        quantity: 3,
        reportedBy: 'jsmith',
        reportedAt: '2024-01-14T09:25:00Z',
        notes: 'Torn packaging'
      }
    ],

    // Hold status
    onHold: false,
    holdReason: null,
    holdBy: null,
    holdAt: null,

    // Notes
    notes: 'Lunch break - resuming at 13:00',
    receivingNotes: 'Temperature checked at -18C on arrival. Good condition.',

    lastUpdated: '2024-01-14T12:00:00Z'
  };

  res.json({
    success: true,
    data: partialStatus
  });
}));

// Resume partial receiving
router.post('/:id/resume-receiving', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const resume = {
    appointmentId: id,
    resumedAt: new Date().toISOString(),
    resumedBy: req.user?.username || 'system',
    status: 'RECEIVING',
    notes
  };

  res.json({
    success: true,
    message: 'Receiving resumed successfully',
    data: resume
  });
}));

// Complete partial receiving (close with discrepancy)
router.post('/:id/complete-partial', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    shortItems,
    damageItems,
    overItems,
    closureReason,
    supervisorApproval,
    notes
  } = req.body;

  const completion = {
    appointmentId: id,
    completedAt: new Date().toISOString(),
    completedBy: req.user?.username || 'system',
    status: 'COMPLETED_WITH_VARIANCE',
    shortItems: shortItems || [],
    damageItems: damageItems || [],
    overItems: overItems || [],
    closureReason,
    supervisorApproval,
    notes,
    requiresFollowUp: (shortItems?.length > 0 || damageItems?.length > 0)
  };

  res.json({
    success: true,
    message: 'Partial receiving completed with variance',
    data: completion
  });
}));

// =============================================================================
// Dock Door Management
// =============================================================================

// Get dock door availability
router.get('/docks/availability', asyncHandler(async (req, res) => {
  const { warehouseId, date } = req.query;

  const dockAvailability = [
    {
      dockDoor: 'DOCK-A1',
      dockType: 'INBOUND',
      status: 'OCCUPIED',
      currentAppointment: 'APT-2024-001',
      currentCarrier: 'Maersk Line',
      estimatedFreeTime: '2024-01-15T18:30:00Z',
      capabilities: ['CONTAINER', 'TRAILER', 'LTL'],
      temperatureControlled: false
    },
    {
      dockDoor: 'DOCK-A2',
      dockType: 'INBOUND',
      status: 'AVAILABLE',
      currentAppointment: null,
      currentCarrier: null,
      estimatedFreeTime: null,
      capabilities: ['CONTAINER', 'TRAILER', 'LTL'],
      temperatureControlled: false
    },
    {
      dockDoor: 'DOCK-B1',
      dockType: 'INBOUND',
      status: 'SCHEDULED',
      currentAppointment: null,
      scheduledAppointment: 'APT-2024-006',
      scheduledTime: '2024-01-15T16:00:00Z',
      capabilities: ['TRAILER', 'LTL'],
      temperatureControlled: false
    },
    {
      dockDoor: 'DOCK-C3',
      dockType: 'INBOUND',
      status: 'OCCUPIED',
      currentAppointment: 'APT-2024-003',
      currentCarrier: 'Hapag-Lloyd',
      estimatedFreeTime: '2024-01-14T15:00:00Z',
      capabilities: ['CONTAINER', 'TRAILER', 'REEFER'],
      temperatureControlled: true
    },
    {
      dockDoor: 'DOCK-D4',
      dockType: 'OUTBOUND',
      status: 'OCCUPIED',
      currentAppointment: 'APT-2024-004',
      currentCarrier: 'Swift Transport',
      estimatedFreeTime: '2024-01-14T12:30:00Z',
      capabilities: ['TRAILER'],
      temperatureControlled: false
    },
    {
      dockDoor: 'DOCK-D5',
      dockType: 'OUTBOUND',
      status: 'AVAILABLE',
      currentAppointment: null,
      currentCarrier: null,
      estimatedFreeTime: null,
      capabilities: ['TRAILER', 'PARCEL'],
      temperatureControlled: false
    }
  ];

  res.json({
    success: true,
    data: dockAvailability,
    summary: {
      totalDocks: dockAvailability.length,
      available: dockAvailability.filter(d => d.status === 'AVAILABLE').length,
      occupied: dockAvailability.filter(d => d.status === 'OCCUPIED').length,
      scheduled: dockAvailability.filter(d => d.status === 'SCHEDULED').length
    }
  });
}));

// Get time slots for a date
router.get('/schedule/time-slots', asyncHandler(async (req, res) => {
  const { warehouseId, date, appointmentType } = req.query;

  const timeSlots = [
    { slot: '06:00-08:00', available: 2, booked: 1, total: 3 },
    { slot: '08:00-10:00', available: 1, booked: 2, total: 3 },
    { slot: '10:00-12:00', available: 0, booked: 3, total: 3 },
    { slot: '12:00-14:00', available: 3, booked: 0, total: 3 },
    { slot: '14:00-16:00', available: 2, booked: 1, total: 3 },
    { slot: '16:00-18:00', available: 3, booked: 0, total: 3 }
  ];

  res.json({
    success: true,
    data: timeSlots,
    date: date || new Date().toISOString().split('T')[0]
  });
}));

// =============================================================================
// Appointment Status Reference
// =============================================================================

// Get appointment status definitions
router.get('/reference/statuses', asyncHandler(async (req, res) => {
  const statuses = [
    { code: 'SCHEDULED', name: 'Scheduled', description: 'Appointment scheduled, awaiting arrival' },
    { code: 'CONFIRMED', name: 'Confirmed', description: 'Carrier confirmed appointment' },
    { code: 'IN_TRANSIT', name: 'In Transit', description: 'Carrier en route' },
    { code: 'ARRIVED', name: 'Arrived', description: 'Arrived at facility, not yet checked in' },
    { code: 'CHECKED_IN', name: 'Checked In', description: 'Driver checked in at gate' },
    { code: 'IN_YARD', name: 'In Yard', description: 'Vehicle in yard awaiting dock' },
    { code: 'AT_DOCK', name: 'At Dock', description: 'Vehicle at assigned dock door' },
    { code: 'RECEIVING', name: 'Receiving', description: 'Unloading/receiving in progress' },
    { code: 'LOADING', name: 'Loading', description: 'Loading in progress' },
    { code: 'COMPLETED', name: 'Completed', description: 'Appointment completed successfully' },
    { code: 'COMPLETED_WITH_VARIANCE', name: 'Completed with Variance', description: 'Completed with discrepancies' },
    { code: 'CANCELLED', name: 'Cancelled', description: 'Appointment cancelled' },
    { code: 'NO_SHOW', name: 'No Show', description: 'Carrier did not arrive' },
    { code: 'RESCHEDULED', name: 'Rescheduled', description: 'Appointment rescheduled' }
  ];

  res.json({
    success: true,
    data: statuses
  });
}));

// Get appointment types
router.get('/reference/types', asyncHandler(async (req, res) => {
  const types = [
    { code: 'INBOUND', name: 'Inbound', description: 'Receiving shipment' },
    { code: 'OUTBOUND', name: 'Outbound', description: 'Shipping/loading' },
    { code: 'TRANSFER_IN', name: 'Transfer In', description: 'Inbound transfer from another facility' },
    { code: 'TRANSFER_OUT', name: 'Transfer Out', description: 'Outbound transfer to another facility' },
    { code: 'RETURN', name: 'Return', description: 'Customer return/RMA' },
    { code: 'EMPTY_RETURN', name: 'Empty Return', description: 'Empty container/trailer return' },
    { code: 'PICKUP', name: 'Pickup', description: 'Will call pickup' },
    { code: 'DROP_TRAILER', name: 'Drop Trailer', description: 'Drop and hook' }
  ];

  res.json({
    success: true,
    data: types
  });
}));

module.exports = router;
