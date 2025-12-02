import express from 'express';

const router = express.Router();

export default function createWorkOrderRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // Work order types
  const WORK_ORDER_TYPES = ['ASSEMBLY', 'DISASSEMBLY', 'REWORK', 'REPAIR', 'PACKAGING', 'LABELING', 'KITTING', 'INSPECTION', 'OTHER'];
  const WORK_ORDER_STATUSES = ['NEW', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

  // ============================================
  // WORK ORDER CRUD
  // ============================================

  // List work orders
  router.get('/', asyncHandler(async (req, res) => {
    const { warehouseId, type, status, priority, assignedToId, page = 1, limit = 20 } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          warehouse: { select: { code: true, name: true } },
          assignedTo: { select: { fullName: true } },
          product: { select: { sku: true, name: true } },
          _count: { select: { components: true, laborEntries: true } },
        },
        orderBy: [{ priority: 'asc' }, { scheduledDate: 'asc' }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.workOrder.count({ where }),
    ]);

    res.json({
      data: workOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get work order by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        warehouse: { select: { code: true, name: true } },
        assignedTo: { select: { id: true, fullName: true } },
        createdBy: { select: { fullName: true } },
        product: { select: { id: true, sku: true, name: true, uom: true } },
        sourceLocation: { select: { code: true } },
        targetLocation: { select: { code: true } },
        components: {
          include: {
            product: { select: { sku: true, name: true, uom: true } },
            location: { select: { code: true } },
          },
          orderBy: { lineNumber: 'asc' },
        },
        laborEntries: {
          include: {
            user: { select: { fullName: true } },
          },
          orderBy: { startTime: 'desc' },
        },
      },
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json(workOrder);
  }));

  // Create work order
  router.post('/', asyncHandler(async (req, res) => {
    const {
      warehouseId,
      type,
      productId,
      quantity,
      priority,
      scheduledDate,
      dueDate,
      sourceLocationId,
      targetLocationId,
      instructions,
      notes,
      components,
      userId,
    } = req.body;

    if (!warehouseId || !type || !productId || !quantity) {
      return res.status(400).json({
        error: 'warehouseId, type, productId, and quantity are required'
      });
    }

    if (!WORK_ORDER_TYPES.includes(type)) {
      return res.status(400).json({
        error: 'Invalid work order type',
        validTypes: WORK_ORDER_TYPES,
      });
    }

    // Generate work order number
    const lastWO = await prisma.workOrder.findFirst({
      where: { warehouseId },
      orderBy: { createdAt: 'desc' },
      select: { workOrderNumber: true },
    });

    let nextNum = 1;
    if (lastWO) {
      const parts = lastWO.workOrderNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const workOrderNumber = `WO-${type.substring(0, 3)}-${nextNum.toString().padStart(6, '0')}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber,
        warehouseId,
        type,
        productId,
        quantityRequired: parseInt(quantity),
        quantityCompleted: 0,
        priority: priority || 'NORMAL',
        status: 'NEW',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        sourceLocationId,
        targetLocationId,
        instructions,
        notes,
        createdById: userId,
        components: components && components.length > 0 ? {
          create: components.map((comp, idx) => ({
            lineNumber: idx + 1,
            productId: comp.productId,
            quantityRequired: parseInt(comp.quantity),
            quantityConsumed: 0,
            locationId: comp.locationId,
          })),
        } : undefined,
      },
      include: {
        product: { select: { sku: true, name: true } },
        components: {
          include: {
            product: { select: { sku: true, name: true } },
          },
        },
      },
    });

    res.status(201).json(workOrder);
  }));

  // Update work order
  router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.workOrderNumber;
    delete updateData.warehouseId;
    delete updateData.createdAt;
    delete updateData.components;

    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate);
    }
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    if (updateData.quantityRequired) {
      updateData.quantityRequired = parseInt(updateData.quantityRequired);
    }

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: updateData,
    });

    res.json(workOrder);
  }));

  // ============================================
  // WORK ORDER LIFECYCLE
  // ============================================

  // Schedule work order
  router.patch('/:id/schedule', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { scheduledDate, assignedToId } = req.body;

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        assignedToId,
      },
    });

    res.json(workOrder);
  }));

  // Start work order
  router.patch('/:id/start', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    if (!['NEW', 'SCHEDULED'].includes(workOrder.status)) {
      return res.status(400).json({ error: 'Work order cannot be started from current status' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          assignedToId: userId || workOrder.assignedToId,
        },
      });

      // Create labor entry
      if (userId) {
        await tx.laborEntry.create({
          data: {
            userId,
            warehouseId: workOrder.warehouseId,
            workOrderId: id,
            activityType: workOrder.type,
            startTime: new Date(),
          },
        });
      }

      return updated;
    });

    res.json(result);
  }));

  // Record production/progress
  router.post('/:id/record', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantityCompleted, componentsConsumed, notes, userId } = req.body;

    if (!quantityCompleted) {
      return res.status(400).json({ error: 'quantityCompleted is required' });
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { components: true },
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Work order is not in progress' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update work order quantity
      const newCompleted = workOrder.quantityCompleted + parseInt(quantityCompleted);
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          quantityCompleted: newCompleted,
          notes: notes ? `${workOrder.notes || ''}\n${new Date().toISOString()}: ${notes}` : workOrder.notes,
        },
      });

      // Update component consumption
      if (componentsConsumed && Array.isArray(componentsConsumed)) {
        for (const comp of componentsConsumed) {
          await tx.workOrderComponent.update({
            where: { id: comp.componentId },
            data: {
              quantityConsumed: {
                increment: parseInt(comp.quantity),
              },
            },
          });

          // Decrement inventory if location specified
          const component = workOrder.components.find(c => c.id === comp.componentId);
          if (component && component.locationId) {
            const inventory = await tx.inventory.findFirst({
              where: {
                productId: component.productId,
                locationId: component.locationId,
              },
            });

            if (inventory) {
              await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                  quantityOnHand: { decrement: parseInt(comp.quantity) },
                  quantityAvailable: { decrement: parseInt(comp.quantity) },
                },
              });

              await tx.inventoryTransaction.create({
                data: {
                  inventoryId: inventory.id,
                  productId: component.productId,
                  locationId: component.locationId,
                  type: 'CONSUME',
                  quantity: -parseInt(comp.quantity),
                  quantityBefore: inventory.quantityOnHand,
                  quantityAfter: inventory.quantityOnHand - parseInt(comp.quantity),
                  reason: `Work order ${workOrder.workOrderNumber}`,
                  reference: workOrder.workOrderNumber,
                  userId,
                },
              });
            }
          }
        }
      }

      return updated;
    });

    res.json(result);
  }));

  // Put on hold
  router.patch('/:id/hold', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, userId } = req.body;

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'ON_HOLD',
        notes: reason ? `HOLD: ${reason}` : 'Put on hold',
      },
    });

    // Close any open labor entries
    await prisma.laborEntry.updateMany({
      where: { workOrderId: id, endTime: null },
      data: { endTime: new Date(), notes: 'Work order on hold' },
    });

    res.json(workOrder);
  }));

  // Resume from hold
  router.patch('/:id/resume', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    if (workOrder.status !== 'ON_HOLD') {
      return res.status(400).json({ error: 'Work order is not on hold' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });

      if (userId) {
        await tx.laborEntry.create({
          data: {
            userId,
            warehouseId: workOrder.warehouseId,
            workOrderId: id,
            activityType: workOrder.type,
            startTime: new Date(),
          },
        });
      }

      return updated;
    });

    res.json(result);
  }));

  // Complete work order
  router.patch('/:id/complete', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { finalQuantity, targetLocationId, notes, userId } = req.body;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    if (!['IN_PROGRESS', 'ON_HOLD'].includes(workOrder.status)) {
      return res.status(400).json({ error: 'Work order cannot be completed from current status' });
    }

    const completedQty = finalQuantity ? parseInt(finalQuantity) : workOrder.quantityCompleted;
    const locationId = targetLocationId || workOrder.targetLocationId;

    const result = await prisma.$transaction(async (tx) => {
      // Update work order
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          quantityCompleted: completedQty,
          notes: notes ? `${workOrder.notes || ''}\nCompleted: ${notes}` : workOrder.notes,
        },
      });

      // Add finished goods to inventory
      if (locationId && completedQty > 0) {
        let inventory = await tx.inventory.findFirst({
          where: {
            productId: workOrder.productId,
            locationId,
            warehouseId: workOrder.warehouseId,
          },
        });

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantityOnHand: { increment: completedQty },
              quantityAvailable: { increment: completedQty },
            },
          });
        } else {
          inventory = await tx.inventory.create({
            data: {
              warehouseId: workOrder.warehouseId,
              productId: workOrder.productId,
              locationId,
              quantityOnHand: completedQty,
              quantityAllocated: 0,
              quantityAvailable: completedQty,
              status: 'AVAILABLE',
            },
          });
        }

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            productId: workOrder.productId,
            toLocationId: locationId,
            type: 'PRODUCE',
            quantity: completedQty,
            quantityBefore: inventory.quantityOnHand - completedQty,
            quantityAfter: inventory.quantityOnHand,
            reason: `Work order ${workOrder.workOrderNumber} completed`,
            reference: workOrder.workOrderNumber,
            userId,
          },
        });
      }

      // Close labor entries
      await tx.laborEntry.updateMany({
        where: { workOrderId: id, endTime: null },
        data: { endTime: new Date() },
      });

      return updated;
    });

    res.json(result);
  }));

  // Cancel work order
  router.patch('/:id/cancel', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    if (workOrder.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel completed work order' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        },
      });

      // Close labor entries
      await tx.laborEntry.updateMany({
        where: { workOrderId: id, endTime: null },
        data: { endTime: new Date(), notes: 'Work order cancelled' },
      });

      return updated;
    });

    res.json(result);
  }));

  // ============================================
  // COMPONENT MANAGEMENT
  // ============================================

  // Add component to work order
  router.post('/:id/components', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productId, quantity, locationId } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'productId and quantity are required' });
    }

    // Get next line number
    const lastComponent = await prisma.workOrderComponent.findFirst({
      where: { workOrderId: id },
      orderBy: { lineNumber: 'desc' },
    });

    const component = await prisma.workOrderComponent.create({
      data: {
        workOrderId: id,
        lineNumber: (lastComponent?.lineNumber || 0) + 1,
        productId,
        quantityRequired: parseInt(quantity),
        quantityConsumed: 0,
        locationId,
      },
      include: {
        product: { select: { sku: true, name: true } },
      },
    });

    res.status(201).json(component);
  }));

  // Update component
  router.put('/:id/components/:componentId', asyncHandler(async (req, res) => {
    const { componentId } = req.params;
    const { quantity, locationId } = req.body;

    const component = await prisma.workOrderComponent.update({
      where: { id: componentId },
      data: {
        quantityRequired: quantity ? parseInt(quantity) : undefined,
        locationId,
      },
    });

    res.json(component);
  }));

  // Remove component
  router.delete('/:id/components/:componentId', asyncHandler(async (req, res) => {
    const { componentId } = req.params;

    await prisma.workOrderComponent.delete({
      where: { id: componentId },
    });

    res.json({ success: true });
  }));

  // ============================================
  // KIT BUILDING
  // ============================================

  // Create kit build work order
  router.post('/kit-build', asyncHandler(async (req, res) => {
    const { warehouseId, kitProductId, quantity, scheduledDate, userId } = req.body;

    if (!warehouseId || !kitProductId || !quantity) {
      return res.status(400).json({
        error: 'warehouseId, kitProductId, and quantity are required'
      });
    }

    // Get kit product and components
    const kitProduct = await prisma.product.findUnique({
      where: { id: kitProductId },
      include: {
        kitComponents: {
          include: {
            component: { select: { id: true, sku: true, name: true } },
          },
        },
      },
    });

    if (!kitProduct) {
      return res.status(404).json({ error: 'Kit product not found' });
    }

    if (!kitProduct.isKit || kitProduct.kitComponents.length === 0) {
      return res.status(400).json({ error: 'Product is not a kit or has no components' });
    }

    // Generate work order number
    const lastWO = await prisma.workOrder.findFirst({
      where: { warehouseId },
      orderBy: { createdAt: 'desc' },
      select: { workOrderNumber: true },
    });

    let nextNum = 1;
    if (lastWO) {
      const parts = lastWO.workOrderNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const workOrderNumber = `WO-KIT-${nextNum.toString().padStart(6, '0')}`;

    // Create work order with components
    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber,
        warehouseId,
        type: 'KITTING',
        productId: kitProductId,
        quantityRequired: parseInt(quantity),
        quantityCompleted: 0,
        priority: 'NORMAL',
        status: 'NEW',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        createdById: userId,
        components: {
          create: kitProduct.kitComponents.map((kc, idx) => ({
            lineNumber: idx + 1,
            productId: kc.componentId,
            quantityRequired: kc.quantity * parseInt(quantity),
            quantityConsumed: 0,
          })),
        },
      },
      include: {
        product: { select: { sku: true, name: true } },
        components: {
          include: {
            product: { select: { sku: true, name: true } },
          },
        },
      },
    });

    res.status(201).json(workOrder);
  }));

  // ============================================
  // SUMMARY & STATS
  // ============================================

  // Work order summary
  router.get('/summary/stats', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};

    const [
      total,
      byStatus,
      byType,
      overdue,
      recentCompleted,
    ] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.workOrder.groupBy({
        by: ['type'],
        where: { ...where, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        _count: true,
      }),
      prisma.workOrder.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      prisma.workOrder.findMany({
        where: { ...where, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: {
          workOrderNumber: true,
          type: true,
          quantityCompleted: true,
          completedAt: true,
        },
      }),
    ]);

    res.json({
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      byType: byType.map(t => ({ type: t.type, count: t._count })),
      overdue,
      recentCompleted,
    });
  }));

  return router;
}
