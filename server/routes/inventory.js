// Inventory Routes - FlowLogic WMS
import express from 'express';

const router = express.Router();

export default function inventoryRoutes(prisma) {
  // Get all inventory with filters
  router.get('/', async (req, res) => {
    try {
      const {
        warehouseId,
        locationId,
        productId,
        status,
        search,
        page = 1,
        limit = 50,
      } = req.query;

      const where = {};

      if (warehouseId) where.warehouseId = warehouseId;
      if (locationId) where.locationId = locationId;
      if (productId) where.productId = productId;
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { product: { sku: { contains: search, mode: 'insensitive' } } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
          { location: { code: { contains: search, mode: 'insensitive' } } },
          { lpn: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [inventory, total] = await Promise.all([
        prisma.inventory.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                upc: true,
                velocityCode: true,
              },
            },
            location: {
              select: {
                id: true,
                code: true,
                type: true,
                zone: { select: { code: true, name: true } },
              },
            },
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.inventory.count({ where }),
      ]);

      res.json({
        data: inventory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  // Get inventory summary/dashboard
  router.get('/summary', async (req, res) => {
    try {
      const { warehouseId } = req.query;
      const where = warehouseId ? { warehouseId } : {};

      const [
        totalItems,
        totalOnHand,
        totalAllocated,
        totalAvailable,
        statusCounts,
        lowStockProducts,
      ] = await Promise.all([
        prisma.inventory.count({ where }),
        prisma.inventory.aggregate({
          where,
          _sum: { quantityOnHand: true },
        }),
        prisma.inventory.aggregate({
          where,
          _sum: { quantityAllocated: true },
        }),
        prisma.inventory.aggregate({
          where,
          _sum: { quantityAvailable: true },
        }),
        prisma.inventory.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.inventory.findMany({
          where: {
            ...where,
            quantityOnHand: { lt: 10 },
          },
          include: {
            product: { select: { sku: true, name: true, reorderPoint: true } },
            location: { select: { code: true } },
          },
          take: 10,
        }),
      ]);

      res.json({
        totalItems,
        totalOnHand: totalOnHand._sum.quantityOnHand || 0,
        totalAllocated: totalAllocated._sum.quantityAllocated || 0,
        totalAvailable: totalAvailable._sum.quantityAvailable || 0,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        lowStockProducts,
      });
    } catch (error) {
      console.error('Get inventory summary error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory summary' });
    }
  });

  // Get single inventory record
  router.get('/:id', async (req, res) => {
    try {
      const inventory = await prisma.inventory.findUnique({
        where: { id: req.params.id },
        include: {
          product: true,
          location: {
            include: { zone: true },
          },
          warehouse: true,
          transactions: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { fullName: true } } },
          },
        },
      });

      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }

      res.json(inventory);
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  // Adjust inventory
  router.post('/:id/adjust', async (req, res) => {
    try {
      const { id } = req.params;
      const { adjustmentQuantity, reason, notes, userId } = req.body;

      const inventory = await prisma.inventory.findUnique({
        where: { id },
      });

      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }

      const quantityBefore = inventory.quantityOnHand;
      const quantityAfter = quantityBefore + adjustmentQuantity;

      if (quantityAfter < 0) {
        return res.status(400).json({ error: 'Cannot adjust below zero' });
      }

      const [updatedInventory, transaction] = await prisma.$transaction([
        prisma.inventory.update({
          where: { id },
          data: {
            quantityOnHand: quantityAfter,
            quantityAvailable: quantityAfter - inventory.quantityAllocated,
          },
        }),
        prisma.inventoryTransaction.create({
          data: {
            transactionType: adjustmentQuantity > 0 ? 'ADJUST_IN' : 'ADJUST_OUT',
            productId: inventory.productId,
            locationId: inventory.locationId,
            inventoryId: inventory.id,
            quantity: Math.abs(adjustmentQuantity),
            quantityBefore,
            quantityAfter,
            reason,
            notes,
            userId,
            referenceType: 'ADJUSTMENT',
          },
        }),
      ]);

      res.json({
        success: true,
        inventory: updatedInventory,
        transaction,
      });
    } catch (error) {
      console.error('Adjust inventory error:', error);
      res.status(500).json({ error: 'Failed to adjust inventory' });
    }
  });

  // Transfer inventory between locations
  router.post('/transfer', async (req, res) => {
    try {
      const {
        fromInventoryId,
        toLocationId,
        quantity,
        userId,
        notes,
      } = req.body;

      const fromInventory = await prisma.inventory.findUnique({
        where: { id: fromInventoryId },
        include: { product: true, location: true },
      });

      if (!fromInventory) {
        return res.status(404).json({ error: 'Source inventory not found' });
      }

      if (fromInventory.quantityAvailable < quantity) {
        return res.status(400).json({ error: 'Insufficient available quantity' });
      }

      const toLocation = await prisma.location.findUnique({
        where: { id: toLocationId },
        include: { zone: true },
      });

      if (!toLocation) {
        return res.status(404).json({ error: 'Destination location not found' });
      }

      // Find or create destination inventory
      let toInventory = await prisma.inventory.findFirst({
        where: {
          productId: fromInventory.productId,
          locationId: toLocationId,
          lotNumber: fromInventory.lotNumber,
          serialNumber: fromInventory.serialNumber,
        },
      });

      const result = await prisma.$transaction(async (tx) => {
        // Update source inventory
        const updatedFrom = await tx.inventory.update({
          where: { id: fromInventoryId },
          data: {
            quantityOnHand: { decrement: quantity },
            quantityAvailable: { decrement: quantity },
          },
        });

        // Create transfer out transaction
        await tx.inventoryTransaction.create({
          data: {
            transactionType: 'TRANSFER',
            productId: fromInventory.productId,
            locationId: fromInventory.locationId,
            inventoryId: fromInventoryId,
            quantity: -quantity,
            quantityBefore: fromInventory.quantityOnHand,
            quantityAfter: updatedFrom.quantityOnHand,
            userId,
            notes: `Transfer to ${toLocation.code}. ${notes || ''}`,
            referenceType: 'TRANSFER',
          },
        });

        // Update or create destination inventory
        let updatedTo;
        if (toInventory) {
          updatedTo = await tx.inventory.update({
            where: { id: toInventory.id },
            data: {
              quantityOnHand: { increment: quantity },
              quantityAvailable: { increment: quantity },
            },
          });
        } else {
          updatedTo = await tx.inventory.create({
            data: {
              productId: fromInventory.productId,
              locationId: toLocationId,
              warehouseId: fromInventory.warehouseId,
              quantityOnHand: quantity,
              quantityAvailable: quantity,
              lotNumber: fromInventory.lotNumber,
              serialNumber: fromInventory.serialNumber,
              expirationDate: fromInventory.expirationDate,
              status: 'AVAILABLE',
            },
          });
        }

        // Create transfer in transaction
        await tx.inventoryTransaction.create({
          data: {
            transactionType: 'TRANSFER',
            productId: fromInventory.productId,
            locationId: toLocationId,
            inventoryId: updatedTo.id,
            quantity: quantity,
            quantityBefore: toInventory ? toInventory.quantityOnHand : 0,
            quantityAfter: updatedTo.quantityOnHand,
            userId,
            notes: `Transfer from ${fromInventory.location.code}. ${notes || ''}`,
            referenceType: 'TRANSFER',
          },
        });

        return { from: updatedFrom, to: updatedTo };
      });

      res.json({
        success: true,
        fromInventory: result.from,
        toInventory: result.to,
      });
    } catch (error) {
      console.error('Transfer inventory error:', error);
      res.status(500).json({ error: 'Failed to transfer inventory' });
    }
  });

  // Get inventory transactions
  router.get('/:id/transactions', async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const transactions = await prisma.inventoryTransaction.findMany({
        where: { inventoryId: id },
        include: {
          user: { select: { fullName: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      });

      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Get discrepancies
  router.get('/discrepancies/list', async (req, res) => {
    try {
      const { warehouseId } = req.query;

      // Find inventory where actual differs from expected (based on recent counts)
      const discrepancies = await prisma.cycleCountLine.findMany({
        where: {
          variance: { not: 0 },
          status: { in: ['COUNTED', 'RECOUNTED'] },
          cycleCount: {
            warehouseId: warehouseId || undefined,
            status: { in: ['IN_PROGRESS', 'PENDING_APPROVAL'] },
          },
        },
        include: {
          product: { select: { sku: true, name: true } },
          location: { select: { code: true } },
          cycleCount: { select: { countNumber: true } },
        },
        orderBy: { countedAt: 'desc' },
        take: 50,
      });

      res.json(discrepancies);
    } catch (error) {
      console.error('Get discrepancies error:', error);
      res.status(500).json({ error: 'Failed to fetch discrepancies' });
    }
  });

  return router;
}
