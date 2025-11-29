import { Router } from 'express';

export default function dockRoutes(prisma) {
  const router = Router();

  // Get all docks with current status
  router.get('/', async (req, res) => {
    try {
      const { warehouseId } = req.query;

      const where = { isActive: true };
      if (warehouseId) where.warehouseId = warehouseId;

      const docks = await prisma.dock.findMany({
        where,
        include: {
          warehouse: { select: { code: true, name: true } },
          receipts: {
            where: {
              status: { in: ['SCHEDULED', 'CHECKED_IN', 'RECEIVING'] }
            },
            take: 1,
            orderBy: { receiptDate: 'desc' }
          },
          shipments: {
            where: {
              status: { in: ['PICKING', 'PACKING', 'LOADING', 'READY'] }
            },
            take: 1,
            orderBy: { shipDate: 'desc' }
          }
        },
        orderBy: { code: 'asc' }
      });

      res.json(docks);
    } catch (error) {
      console.error('Get docks error:', error);
      res.status(500).json({ error: 'Failed to fetch docks' });
    }
  });

  // Get dock appointments/scheduled receipts for a date
  router.get('/appointments', async (req, res) => {
    try {
      const { date, warehouseId } = req.query;

      // Parse date or use today
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const where = {
        expectedDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
      if (warehouseId) where.warehouseId = warehouseId;

      // Get inbound appointments (receipts)
      const inboundAppointments = await prisma.receipt.findMany({
        where,
        include: {
          dock: { select: { id: true, code: true, name: true } },
          vendor: { select: { code: true, name: true } },
          purchaseOrder: { select: { id: true, poNumber: true } },
          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  caseQty: true,
                  palletQty: true
                }
              }
            }
          }
        },
        orderBy: { expectedDate: 'asc' }
      });

      // Get outbound appointments (shipments)
      const outboundWhere = {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
      if (warehouseId) outboundWhere.warehouseId = warehouseId;

      const outboundAppointments = await prisma.shipment.findMany({
        where: outboundWhere,
        include: {
          dock: { select: { id: true, code: true, name: true } },
          carrier: { select: { code: true, name: true } },
          order: { select: { id: true, orderNumber: true } },
          lines: {
            include: {
              orderLine: {
                include: {
                  product: {
                    select: {
                      id: true,
                      sku: true,
                      name: true,
                      caseQty: true,
                      palletQty: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { scheduledDate: 'asc' }
      });

      // Transform inbound appointments with metrics
      const inbound = inboundAppointments.map(receipt => {
        const poNumbers = receipt.purchaseOrderId ? [receipt.purchaseOrder?.poNumber] : [];
        const skuSet = new Set(receipt.lines.map(line => line.product.sku));

        // Calculate pallets and cases from lines
        let totalCases = 0;
        let totalPallets = 0;
        let totalUnits = 0;

        receipt.lines.forEach(line => {
          totalUnits += line.quantityExpected;
          const product = line.product;
          if (product.caseQty && product.caseQty > 0) {
            totalCases += Math.ceil(line.quantityExpected / product.caseQty);
          }
          if (product.palletQty && product.palletQty > 0) {
            totalPallets += Math.ceil(line.quantityExpected / product.palletQty);
          }
        });

        return {
          id: receipt.id,
          type: 'inbound',
          appointmentNumber: receipt.receiptNumber,
          status: receipt.status.toLowerCase(),
          scheduledTime: receipt.expectedDate,
          dock: receipt.dock,
          carrier: receipt.carrierName || receipt.vendor?.name || 'Unknown',
          vendorCode: receipt.vendor?.code,
          vendorName: receipt.vendor?.name,
          trackingNumber: receipt.trackingNumber,
          bolNumber: receipt.bolNumber,
          sealNumber: receipt.sealNumber,
          // Metrics
          poCount: poNumbers.filter(Boolean).length,
          poNumbers: poNumbers.filter(Boolean),
          skuCount: skuSet.size,
          skus: Array.from(skuSet),
          palletCount: totalPallets,
          caseCount: totalCases,
          unitCount: totalUnits,
          lineCount: receipt.lines.length,
          notes: receipt.notes
        };
      });

      // Transform outbound appointments with metrics
      const outbound = outboundAppointments.map(shipment => {
        const orderNumbers = shipment.orderId ? [shipment.order?.orderNumber] : [];
        const skuSet = new Set();

        let totalCases = 0;
        let totalPallets = 0;
        let totalUnits = 0;

        shipment.lines.forEach(line => {
          if (line.orderLine?.product) {
            const product = line.orderLine.product;
            skuSet.add(product.sku);
            totalUnits += line.quantity || 0;
            if (product.caseQty && product.caseQty > 0) {
              totalCases += Math.ceil((line.quantity || 0) / product.caseQty);
            }
            if (product.palletQty && product.palletQty > 0) {
              totalPallets += Math.ceil((line.quantity || 0) / product.palletQty);
            }
          }
        });

        return {
          id: shipment.id,
          type: 'outbound',
          appointmentNumber: shipment.shipmentNumber,
          status: shipment.status.toLowerCase(),
          scheduledTime: shipment.scheduledDate,
          dock: shipment.dock,
          carrier: shipment.carrier?.name || 'Unknown',
          carrierCode: shipment.carrier?.code,
          trackingNumber: shipment.trackingNumber,
          bolNumber: shipment.bolNumber,
          sealNumber: shipment.sealNumber,
          trailerNumber: shipment.trailerNumber,
          // Metrics
          orderCount: orderNumbers.filter(Boolean).length,
          orderNumbers: orderNumbers.filter(Boolean),
          skuCount: skuSet.size,
          skus: Array.from(skuSet),
          palletCount: totalPallets,
          caseCount: totalCases,
          unitCount: totalUnits,
          lineCount: shipment.lines.length,
          notes: shipment.notes
        };
      });

      // Combine and sort by scheduled time
      const appointments = [...inbound, ...outbound].sort((a, b) =>
        new Date(a.scheduledTime) - new Date(b.scheduledTime)
      );

      // Summary stats
      const summary = {
        totalInbound: inbound.length,
        totalOutbound: outbound.length,
        totalPOs: inbound.reduce((sum, apt) => sum + apt.poCount, 0),
        totalOrders: outbound.reduce((sum, apt) => sum + apt.orderCount, 0),
        totalSKUs: new Set([...inbound.flatMap(a => a.skus), ...outbound.flatMap(a => a.skus)]).size,
        totalPallets: appointments.reduce((sum, apt) => sum + apt.palletCount, 0),
        totalCases: appointments.reduce((sum, apt) => sum + apt.caseCount, 0),
        totalUnits: appointments.reduce((sum, apt) => sum + apt.unitCount, 0),
        byStatus: {
          scheduled: appointments.filter(a => a.status === 'scheduled' || a.status === 'new').length,
          checkedIn: appointments.filter(a => a.status === 'checked_in').length,
          inProgress: appointments.filter(a => ['receiving', 'loading', 'picking', 'packing'].includes(a.status)).length,
          completed: appointments.filter(a => a.status === 'completed' || a.status === 'received').length
        }
      };

      res.json({
        date: targetDate.toISOString().split('T')[0],
        appointments,
        summary
      });
    } catch (error) {
      console.error('Get appointments error:', error);
      // Return demo data if database fails
      res.json({
        date: new Date().toISOString().split('T')[0],
        appointments: getDemoAppointments(),
        summary: {
          totalInbound: 4,
          totalOutbound: 3,
          totalPOs: 6,
          totalOrders: 5,
          totalSKUs: 24,
          totalPallets: 42,
          totalCases: 186,
          totalUnits: 3720,
          byStatus: { scheduled: 2, checkedIn: 2, inProgress: 2, completed: 1 }
        },
        _demo: true
      });
    }
  });

  // Get single appointment details
  router.get('/appointments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.query;

      if (type === 'outbound') {
        const shipment = await prisma.shipment.findUnique({
          where: { id },
          include: {
            dock: true,
            carrier: true,
            order: {
              include: {
                lines: {
                  include: {
                    product: true
                  }
                }
              }
            },
            lines: {
              include: {
                orderLine: {
                  include: {
                    product: true
                  }
                }
              }
            },
            packages: true
          }
        });

        if (!shipment) {
          return res.status(404).json({ error: 'Shipment not found' });
        }

        res.json(transformShipmentDetails(shipment));
      } else {
        const receipt = await prisma.receipt.findUnique({
          where: { id },
          include: {
            dock: true,
            vendor: true,
            purchaseOrder: {
              include: {
                lines: {
                  include: {
                    product: true
                  }
                }
              }
            },
            lines: {
              include: {
                product: true,
                poLine: true
              }
            }
          }
        });

        if (!receipt) {
          return res.status(404).json({ error: 'Receipt not found' });
        }

        res.json(transformReceiptDetails(receipt));
      }
    } catch (error) {
      console.error('Get appointment details error:', error);
      res.status(500).json({ error: 'Failed to fetch appointment details' });
    }
  });

  // Check in an appointment
  router.post('/appointments/:id/checkin', async (req, res) => {
    try {
      const { id } = req.params;
      const { type, dockId, trailerNumber, sealNumber, driverName, driverPhone } = req.body;

      if (type === 'outbound') {
        const shipment = await prisma.shipment.update({
          where: { id },
          data: {
            status: 'LOADING',
            dockId,
            trailerNumber,
            sealNumber
          }
        });

        // Update dock status
        if (dockId) {
          await prisma.dock.update({
            where: { id: dockId },
            data: { currentStatus: 'OCCUPIED' }
          });
        }

        res.json({ success: true, shipment });
      } else {
        const receipt = await prisma.receipt.update({
          where: { id },
          data: {
            status: 'CHECKED_IN',
            dockId,
            sealNumber
          }
        });

        if (dockId) {
          await prisma.dock.update({
            where: { id: dockId },
            data: { currentStatus: 'OCCUPIED' }
          });
        }

        res.json({ success: true, receipt });
      }
    } catch (error) {
      console.error('Check in error:', error);
      res.status(500).json({ error: 'Failed to check in appointment' });
    }
  });

  // Complete an appointment
  router.post('/appointments/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;

      if (type === 'outbound') {
        const shipment = await prisma.shipment.update({
          where: { id },
          data: {
            status: 'SHIPPED',
            actualShipDate: new Date()
          },
          include: { dock: true }
        });

        // Free up dock
        if (shipment.dockId) {
          await prisma.dock.update({
            where: { id: shipment.dockId },
            data: { currentStatus: 'AVAILABLE' }
          });
        }

        res.json({ success: true, shipment });
      } else {
        const receipt = await prisma.receipt.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedDate: new Date()
          },
          include: { dock: true }
        });

        if (receipt.dockId) {
          await prisma.dock.update({
            where: { id: receipt.dockId },
            data: { currentStatus: 'AVAILABLE' }
          });
        }

        res.json({ success: true, receipt });
      }
    } catch (error) {
      console.error('Complete appointment error:', error);
      res.status(500).json({ error: 'Failed to complete appointment' });
    }
  });

  // Get dock schedule summary for dashboard
  router.get('/summary', async (req, res) => {
    try {
      const { warehouseId } = req.query;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const where = { warehouseId };

      // Get dock counts
      const docks = await prisma.dock.findMany({
        where: { ...where, isActive: true }
      });

      const availableDocks = docks.filter(d => d.currentStatus === 'AVAILABLE').length;
      const occupiedDocks = docks.filter(d => d.currentStatus === 'OCCUPIED').length;
      const maintenanceDocks = docks.filter(d => d.currentStatus === 'MAINTENANCE').length;

      // Get today's inbound appointments
      const inboundToday = await prisma.receipt.count({
        where: {
          ...where,
          expectedDate: { gte: today, lt: tomorrow }
        }
      });

      // Get today's outbound appointments
      const outboundToday = await prisma.shipment.count({
        where: {
          ...where,
          scheduledDate: { gte: today, lt: tomorrow }
        }
      });

      // Get waiting appointments (scheduled but not checked in)
      const waitingInbound = await prisma.receipt.count({
        where: {
          ...where,
          status: { in: ['NEW', 'SCHEDULED'] },
          expectedDate: { gte: today, lt: tomorrow }
        }
      });

      const waitingOutbound = await prisma.shipment.count({
        where: {
          ...where,
          status: { in: ['PENDING', 'READY'] },
          scheduledDate: { gte: today, lt: tomorrow }
        }
      });

      res.json({
        totalDocks: docks.length,
        availableDocks,
        occupiedDocks,
        maintenanceDocks,
        inboundToday,
        outboundToday,
        waitingCheckin: waitingInbound + waitingOutbound
      });
    } catch (error) {
      console.error('Get dock summary error:', error);
      // Return demo data
      res.json({
        totalDocks: 8,
        availableDocks: 5,
        occupiedDocks: 2,
        maintenanceDocks: 1,
        inboundToday: 8,
        outboundToday: 12,
        waitingCheckin: 2,
        _demo: true
      });
    }
  });

  return router;
}

// Helper to transform receipt details
function transformReceiptDetails(receipt) {
  const lines = receipt.lines.map(line => ({
    id: line.id,
    lineNumber: line.lineNumber,
    product: {
      id: line.product.id,
      sku: line.product.sku,
      name: line.product.name,
      caseQty: line.product.caseQty,
      palletQty: line.product.palletQty
    },
    quantityExpected: line.quantityExpected,
    quantityReceived: line.quantityReceived,
    quantityDamaged: line.quantityDamaged,
    quantityRejected: line.quantityRejected,
    uom: line.uom,
    lotNumber: line.lotNumber,
    status: line.status
  }));

  // Calculate metrics
  const skuSet = new Set(lines.map(l => l.product.sku));
  let totalCases = 0;
  let totalPallets = 0;

  lines.forEach(line => {
    if (line.product.caseQty > 0) {
      totalCases += Math.ceil(line.quantityExpected / line.product.caseQty);
    }
    if (line.product.palletQty > 0) {
      totalPallets += Math.ceil(line.quantityExpected / line.product.palletQty);
    }
  });

  return {
    id: receipt.id,
    type: 'inbound',
    receiptNumber: receipt.receiptNumber,
    status: receipt.status,
    receiptDate: receipt.receiptDate,
    expectedDate: receipt.expectedDate,
    completedDate: receipt.completedDate,
    dock: receipt.dock,
    vendor: receipt.vendor,
    purchaseOrder: receipt.purchaseOrder ? {
      id: receipt.purchaseOrder.id,
      poNumber: receipt.purchaseOrder.poNumber,
      status: receipt.purchaseOrder.status
    } : null,
    carrier: receipt.carrierName,
    trackingNumber: receipt.trackingNumber,
    bolNumber: receipt.bolNumber,
    sealNumber: receipt.sealNumber,
    lines,
    metrics: {
      poCount: receipt.purchaseOrderId ? 1 : 0,
      skuCount: skuSet.size,
      palletCount: totalPallets,
      caseCount: totalCases,
      totalUnits: receipt.totalUnits,
      receivedUnits: receipt.receivedUnits,
      lineCount: lines.length
    },
    notes: receipt.notes
  };
}

// Helper to transform shipment details
function transformShipmentDetails(shipment) {
  const lines = shipment.lines.map(line => ({
    id: line.id,
    product: line.orderLine?.product ? {
      id: line.orderLine.product.id,
      sku: line.orderLine.product.sku,
      name: line.orderLine.product.name,
      caseQty: line.orderLine.product.caseQty,
      palletQty: line.orderLine.product.palletQty
    } : null,
    quantity: line.quantity,
    uom: line.uom
  }));

  const skuSet = new Set(lines.filter(l => l.product).map(l => l.product.sku));
  let totalCases = 0;
  let totalPallets = 0;

  lines.forEach(line => {
    if (line.product) {
      if (line.product.caseQty > 0) {
        totalCases += Math.ceil(line.quantity / line.product.caseQty);
      }
      if (line.product.palletQty > 0) {
        totalPallets += Math.ceil(line.quantity / line.product.palletQty);
      }
    }
  });

  return {
    id: shipment.id,
    type: 'outbound',
    shipmentNumber: shipment.shipmentNumber,
    status: shipment.status,
    scheduledDate: shipment.scheduledDate,
    shipDate: shipment.shipDate,
    actualShipDate: shipment.actualShipDate,
    dock: shipment.dock,
    carrier: shipment.carrier,
    order: shipment.order ? {
      id: shipment.order.id,
      orderNumber: shipment.order.orderNumber
    } : null,
    trackingNumber: shipment.trackingNumber,
    bolNumber: shipment.bolNumber,
    sealNumber: shipment.sealNumber,
    trailerNumber: shipment.trailerNumber,
    lines,
    packages: shipment.packages,
    metrics: {
      orderCount: shipment.orderId ? 1 : 0,
      skuCount: skuSet.size,
      palletCount: totalPallets,
      caseCount: totalCases,
      totalUnits: lines.reduce((sum, l) => sum + (l.quantity || 0), 0),
      lineCount: lines.length,
      packageCount: shipment.packages?.length || 0
    },
    notes: shipment.notes
  };
}

// Demo appointments data
function getDemoAppointments() {
  const now = new Date();
  return [
    {
      id: 'apt-001',
      type: 'inbound',
      appointmentNumber: 'RCV-2024-001',
      status: 'checked_in',
      scheduledTime: new Date(now.setHours(8, 0, 0, 0)).toISOString(),
      dock: { id: 'd-02', code: 'D-02', name: 'Dock 2' },
      carrier: 'ABC Trucking',
      vendorName: 'Acme Supplies',
      trackingNumber: 'TRK-445521',
      bolNumber: 'BOL-8821',
      poCount: 2,
      poNumbers: ['PO-45821', 'PO-45822'],
      skuCount: 8,
      palletCount: 12,
      caseCount: 48,
      unitCount: 960,
      lineCount: 8
    },
    {
      id: 'apt-002',
      type: 'inbound',
      appointmentNumber: 'RCV-2024-002',
      status: 'scheduled',
      scheduledTime: new Date(now.setHours(10, 0, 0, 0)).toISOString(),
      dock: { id: 'd-04', code: 'D-04', name: 'Dock 4' },
      carrier: 'Fast Freight',
      vendorName: 'Global Parts Inc',
      poCount: 1,
      poNumbers: ['PO-45825'],
      skuCount: 4,
      palletCount: 6,
      caseCount: 24,
      unitCount: 480,
      lineCount: 4
    },
    {
      id: 'apt-003',
      type: 'outbound',
      appointmentNumber: 'SHP-2024-001',
      status: 'loading',
      scheduledTime: new Date(now.setHours(9, 0, 0, 0)).toISOString(),
      dock: { id: 'd-06', code: 'D-06', name: 'Dock 6' },
      carrier: 'UPS Freight',
      trackingNumber: 'UP-8842',
      orderCount: 3,
      orderNumbers: ['ORD-78521', 'ORD-78522', 'ORD-78523'],
      skuCount: 12,
      palletCount: 18,
      caseCount: 72,
      unitCount: 1440,
      lineCount: 12
    },
    {
      id: 'apt-004',
      type: 'outbound',
      appointmentNumber: 'SHP-2024-002',
      status: 'scheduled',
      scheduledTime: new Date(now.setHours(14, 0, 0, 0)).toISOString(),
      dock: null,
      carrier: 'FedEx Freight',
      orderCount: 2,
      orderNumbers: ['ORD-78530', 'ORD-78531'],
      skuCount: 6,
      palletCount: 8,
      caseCount: 32,
      unitCount: 640,
      lineCount: 6
    }
  ];
}
