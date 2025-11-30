import express from 'express';

const router = express.Router();

export default function createReplenishmentRoutes(prisma) {
  // Helper for async error handling
  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ============================================
  // REPLENISHMENT RULES
  // ============================================

  // List rules
  router.get('/rules', asyncHandler(async (req, res) => {
    const { productId, isActive, page = 1, limit = 50 } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [rules, total] = await Promise.all([
      prisma.replenishmentRule.findMany({
        where,
        include: {
          product: { select: { sku: true, name: true, velocityCode: true } },
        },
        orderBy: [{ priority: 'asc' }, { product: { sku: 'asc' } }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.replenishmentRule.count({ where }),
    ]);

    res.json({
      data: rules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // Get rule by ID
  router.get('/rules/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const rule = await prisma.replenishmentRule.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            velocityCode: true,
            minStock: true,
            maxStock: true,
            reorderPoint: true,
          },
        },
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json(rule);
  }));

  // Create rule
  router.post('/rules', asyncHandler(async (req, res) => {
    const { productId, sourceZoneCode, targetZoneCode, minQuantity, maxQuantity, reorderQuantity, priority } = req.body;

    if (!productId || minQuantity === undefined || maxQuantity === undefined || reorderQuantity === undefined) {
      return res.status(400).json({
        error: 'productId, minQuantity, maxQuantity, and reorderQuantity are required',
      });
    }

    // Check for existing rule
    const existing = await prisma.replenishmentRule.findFirst({
      where: { productId, targetZoneCode },
    });

    if (existing) {
      return res.status(400).json({
        error: 'Rule already exists for this product and target zone',
      });
    }

    const rule = await prisma.replenishmentRule.create({
      data: {
        productId,
        sourceZoneCode,
        targetZoneCode,
        minQuantity: parseInt(minQuantity),
        maxQuantity: parseInt(maxQuantity),
        reorderQuantity: parseInt(reorderQuantity),
        priority: priority || 5,
        isActive: true,
      },
      include: {
        product: { select: { sku: true, name: true } },
      },
    });

    res.status(201).json(rule);
  }));

  // Update rule
  router.put('/rules/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { sourceZoneCode, targetZoneCode, minQuantity, maxQuantity, reorderQuantity, priority, isActive } = req.body;

    const rule = await prisma.replenishmentRule.update({
      where: { id },
      data: {
        sourceZoneCode,
        targetZoneCode,
        minQuantity: minQuantity !== undefined ? parseInt(minQuantity) : undefined,
        maxQuantity: maxQuantity !== undefined ? parseInt(maxQuantity) : undefined,
        reorderQuantity: reorderQuantity !== undefined ? parseInt(reorderQuantity) : undefined,
        priority,
        isActive,
      },
      include: {
        product: { select: { sku: true, name: true } },
      },
    });

    res.json(rule);
  }));

  // Delete rule
  router.delete('/rules/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.replenishmentRule.delete({ where: { id } });

    res.json({ success: true, message: 'Rule deleted' });
  }));

  // Bulk create rules from products
  router.post('/rules/bulk', asyncHandler(async (req, res) => {
    const { productIds, sourceZoneCode, targetZoneCode, minQuantity, maxQuantity, reorderQuantity } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array is required' });
    }

    const rules = await prisma.replenishmentRule.createMany({
      data: productIds.map(productId => ({
        productId,
        sourceZoneCode,
        targetZoneCode,
        minQuantity: parseInt(minQuantity),
        maxQuantity: parseInt(maxQuantity),
        reorderQuantity: parseInt(reorderQuantity),
        priority: 5,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({
      created: rules.count,
      message: `Created ${rules.count} replenishment rules`,
    });
  }));

  // ============================================
  // REPLENISHMENT NEEDS
  // ============================================

  // Get locations needing replenishment
  router.get('/needs', asyncHandler(async (req, res) => {
    const { warehouseId, zoneCode, priority } = req.query;

    // Get all active rules
    const rules = await prisma.replenishmentRule.findMany({
      where: {
        isActive: true,
        targetZoneCode: zoneCode || undefined,
      },
      include: {
        product: { select: { id: true, sku: true, name: true } },
      },
    });

    // Get inventory in target zones
    const needs = [];

    for (const rule of rules) {
      // Find target locations
      const targetLocations = await prisma.location.findMany({
        where: {
          zone: {
            warehouseId: warehouseId || undefined,
            code: rule.targetZoneCode || undefined,
          },
          isReplenishable: true,
        },
        include: {
          zone: { select: { code: true, name: true, warehouseId: true } },
          inventory: {
            where: { productId: rule.productId },
          },
        },
      });

      for (const location of targetLocations) {
        const currentQty = location.inventory.reduce((sum, i) => sum + i.quantityOnHand, 0);

        if (currentQty < rule.minQuantity) {
          const needed = rule.maxQuantity - currentQty;

          // Find source inventory
          const sourceInventory = await prisma.inventory.findMany({
            where: {
              productId: rule.productId,
              quantityAvailable: { gt: 0 },
              location: {
                zone: {
                  code: rule.sourceZoneCode || undefined,
                  warehouseId: location.zone.warehouseId,
                },
              },
            },
            include: {
              location: { select: { code: true } },
            },
            orderBy: { quantityAvailable: 'desc' },
            take: 5,
          });

          const availableQty = sourceInventory.reduce((sum, i) => sum + i.quantityAvailable, 0);

          needs.push({
            rule,
            targetLocation: {
              id: location.id,
              code: location.code,
              zone: location.zone,
            },
            currentQuantity: currentQty,
            minQuantity: rule.minQuantity,
            maxQuantity: rule.maxQuantity,
            neededQuantity: needed,
            suggestedQuantity: Math.min(needed, rule.reorderQuantity, availableQty),
            sourceInventory: sourceInventory.map(i => ({
              locationCode: i.location.code,
              available: i.quantityAvailable,
            })),
            availableToReplenish: availableQty,
            priority: rule.priority,
          });
        }
      }
    }

    // Sort by priority
    needs.sort((a, b) => a.priority - b.priority);

    res.json({
      total: needs.length,
      needs,
    });
  }));

  // ============================================
  // REPLENISHMENT TASKS
  // ============================================

  // Create replenishment task
  router.post('/tasks', asyncHandler(async (req, res) => {
    const { warehouseId, productId, fromLocationId, toLocationId, quantity, priority, userId } = req.body;

    if (!warehouseId || !productId || !fromLocationId || !toLocationId || !quantity) {
      return res.status(400).json({
        error: 'warehouseId, productId, fromLocationId, toLocationId, and quantity are required',
      });
    }

    // Verify source inventory
    const sourceInventory = await prisma.inventory.findFirst({
      where: {
        productId,
        locationId: fromLocationId,
        quantityAvailable: { gte: parseInt(quantity) },
      },
    });

    if (!sourceInventory) {
      return res.status(400).json({ error: 'Insufficient inventory at source location' });
    }

    // Generate task number
    const lastTask = await prisma.task.findFirst({
      where: { warehouseId, type: 'REPLENISHMENT' },
      orderBy: { createdAt: 'desc' },
      select: { taskNumber: true },
    });

    let nextNum = 1;
    if (lastTask) {
      const parts = lastTask.taskNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const taskNumber = `TSK-RPL-${nextNum.toString().padStart(6, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskNumber,
        type: 'REPLENISHMENT',
        status: userId ? 'ASSIGNED' : 'PENDING',
        warehouseId,
        priority: priority || 5,
        assignedToId: userId,
        assignedAt: userId ? new Date() : null,
        totalLines: 1,
        totalUnits: parseInt(quantity),
        notes: 'Auto-generated replenishment task',
        details: {
          create: {
            lineNumber: 1,
            fromLocationId,
            toLocationId,
            quantityRequired: parseInt(quantity),
          },
        },
      },
      include: {
        details: {
          include: {
            fromLocation: { select: { code: true } },
          },
        },
      },
    });

    res.status(201).json(task);
  }));

  // Auto-generate replenishment tasks
  router.post('/generate', asyncHandler(async (req, res) => {
    const { warehouseId, maxTasks = 50, assignToUserId } = req.body;

    if (!warehouseId) {
      return res.status(400).json({ error: 'warehouseId is required' });
    }

    // Get active rules
    const rules = await prisma.replenishmentRule.findMany({
      where: { isActive: true },
      include: { product: true },
      orderBy: { priority: 'asc' },
    });

    const createdTasks = [];
    let taskCount = 0;

    for (const rule of rules) {
      if (taskCount >= maxTasks) break;

      // Find target locations below minimum
      const targetLocations = await prisma.location.findMany({
        where: {
          zone: {
            warehouseId,
            code: rule.targetZoneCode || undefined,
          },
          isReplenishable: true,
        },
        include: {
          zone: true,
          inventory: {
            where: { productId: rule.productId },
          },
        },
      });

      for (const location of targetLocations) {
        if (taskCount >= maxTasks) break;

        const currentQty = location.inventory.reduce((sum, i) => sum + i.quantityOnHand, 0);

        if (currentQty < rule.minQuantity) {
          // Check for existing pending task
          const existingTask = await prisma.task.findFirst({
            where: {
              type: 'REPLENISHMENT',
              status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
              details: {
                some: {
                  toLocationId: location.id,
                },
              },
            },
          });

          if (existingTask) continue;

          // Find source inventory
          const sourceInventory = await prisma.inventory.findFirst({
            where: {
              productId: rule.productId,
              quantityAvailable: { gt: 0 },
              location: {
                zone: {
                  warehouseId,
                  code: rule.sourceZoneCode || undefined,
                },
              },
            },
            orderBy: { quantityAvailable: 'desc' },
          });

          if (!sourceInventory) continue;

          const needed = rule.maxQuantity - currentQty;
          const quantity = Math.min(needed, rule.reorderQuantity, sourceInventory.quantityAvailable);

          // Generate task number
          const lastTask = await prisma.task.findFirst({
            where: { warehouseId, type: 'REPLENISHMENT' },
            orderBy: { createdAt: 'desc' },
            select: { taskNumber: true },
          });

          let nextNum = 1;
          if (lastTask) {
            const parts = lastTask.taskNumber.split('-');
            nextNum = parseInt(parts[parts.length - 1]) + 1;
          }
          const taskNumber = `TSK-RPL-${nextNum.toString().padStart(6, '0')}`;

          const task = await prisma.task.create({
            data: {
              taskNumber,
              type: 'REPLENISHMENT',
              status: assignToUserId ? 'ASSIGNED' : 'PENDING',
              warehouseId,
              priority: rule.priority,
              assignedToId: assignToUserId,
              assignedAt: assignToUserId ? new Date() : null,
              totalLines: 1,
              totalUnits: quantity,
              notes: `Auto-replenish ${rule.product.sku}`,
              details: {
                create: {
                  lineNumber: 1,
                  fromLocationId: sourceInventory.locationId,
                  toLocationId: location.id,
                  quantityRequired: quantity,
                },
              },
            },
          });

          createdTasks.push(task);
          taskCount++;
        }
      }
    }

    res.json({
      created: createdTasks.length,
      tasks: createdTasks,
    });
  }));

  // Complete replenishment (move inventory)
  router.post('/complete/:taskId', asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { userId, actualQuantity } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          details: {
            include: {
              fromLocation: true,
            },
          },
          warehouse: true,
        },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.type !== 'REPLENISHMENT') {
        throw new Error('Task is not a replenishment task');
      }

      const detail = task.details[0];
      const quantity = actualQuantity || detail.quantityRequired;

      // Get source inventory
      const sourceInventory = await tx.inventory.findFirst({
        where: {
          locationId: detail.fromLocationId,
          quantityAvailable: { gte: quantity },
        },
      });

      if (!sourceInventory) {
        throw new Error('Insufficient source inventory');
      }

      // Decrease source
      await tx.inventory.update({
        where: { id: sourceInventory.id },
        data: {
          quantityOnHand: { decrement: quantity },
          quantityAvailable: { decrement: quantity },
        },
      });

      // Find or create target inventory
      let targetInventory = await tx.inventory.findFirst({
        where: {
          productId: sourceInventory.productId,
          locationId: detail.toLocationId,
          lotNumber: sourceInventory.lotNumber || null,
        },
      });

      if (targetInventory) {
        await tx.inventory.update({
          where: { id: targetInventory.id },
          data: {
            quantityOnHand: { increment: quantity },
            quantityAvailable: { increment: quantity },
          },
        });
      } else {
        targetInventory = await tx.inventory.create({
          data: {
            productId: sourceInventory.productId,
            locationId: detail.toLocationId,
            warehouseId: task.warehouseId,
            quantityOnHand: quantity,
            quantityAvailable: quantity,
            lotNumber: sourceInventory.lotNumber,
            expirationDate: sourceInventory.expirationDate,
            status: 'AVAILABLE',
          },
        });
      }

      // Get system user
      const systemUser = await tx.user.findFirst({ where: { role: 'ADMIN' } });

      // Create transaction record
      await tx.inventoryTransaction.create({
        data: {
          transactionType: 'TRANSFER',
          productId: sourceInventory.productId,
          locationId: detail.fromLocationId,
          inventoryId: sourceInventory.id,
          quantity,
          quantityBefore: sourceInventory.quantityOnHand,
          quantityAfter: sourceInventory.quantityOnHand - quantity,
          referenceType: 'REPLENISHMENT',
          referenceId: taskId,
          referenceNumber: task.taskNumber,
          userId: userId || systemUser?.id,
          notes: `Replenishment to ${detail.toLocationId}`,
        },
      });

      // Update task
      await tx.taskDetail.update({
        where: { id: detail.id },
        data: {
          quantityCompleted: quantity,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedLines: 1,
          completedUnits: quantity,
        },
      });

      return updatedTask;
    });

    res.json(result);
  }));

  // ============================================
  // SUMMARY
  // ============================================

  router.get('/summary', asyncHandler(async (req, res) => {
    const { warehouseId } = req.query;

    const where = warehouseId ? { warehouseId } : {};

    const [
      activeRules,
      pendingTasks,
      completedToday,
      locationsNeedingReplen,
    ] = await Promise.all([
      prisma.replenishmentRule.count({ where: { isActive: true } }),
      prisma.task.count({
        where: { ...where, type: 'REPLENISHMENT', status: { in: ['PENDING', 'ASSIGNED'] } },
      }),
      prisma.task.count({
        where: {
          ...where,
          type: 'REPLENISHMENT',
          status: 'COMPLETED',
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.location.count({
        where: {
          zone: { warehouseId: warehouseId || undefined },
          isReplenishable: true,
          inventory: {
            some: {
              quantityOnHand: { lt: 10 }, // Simple threshold
            },
          },
        },
      }),
    ]);

    res.json({
      activeRules,
      pendingTasks,
      completedToday,
      locationsNeedingReplen,
    });
  }));

  return router;
}
