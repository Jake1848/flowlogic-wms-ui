// Location Routes - FlowLogic WMS
import express from 'express';

const router = express.Router();

export default function locationRoutes(prisma) {
  // Get all locations with filters
  router.get('/', async (req, res) => {
    try {
      const {
        warehouseId,
        zoneId,
        type,
        isActive,
        search,
        page = 1,
        limit = 100,
      } = req.query;

      const where = {};

      if (zoneId) where.zoneId = zoneId;
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      if (warehouseId) {
        where.zone = { warehouseId };
      }

      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { aisle: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [locations, total] = await Promise.all([
        prisma.location.findMany({
          where,
          include: {
            zone: {
              select: { code: true, name: true, type: true, warehouse: { select: { code: true } } },
            },
            _count: {
              select: { inventory: true },
            },
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { pickSequence: 'asc' },
        }),
        prisma.location.count({ where }),
      ]);

      res.json({
        data: locations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  // Get zones
  router.get('/zones', async (req, res) => {
    try {
      const { warehouseId } = req.query;

      const zones = await prisma.zone.findMany({
        where: warehouseId ? { warehouseId } : undefined,
        include: {
          warehouse: { select: { code: true, name: true } },
          _count: { select: { locations: true } },
        },
        orderBy: { pickSequence: 'asc' },
      });

      res.json(zones);
    } catch (error) {
      console.error('Get zones error:', error);
      res.status(500).json({ error: 'Failed to fetch zones' });
    }
  });

  // Get location utilization
  router.get('/utilization', async (req, res) => {
    try {
      const { warehouseId } = req.query;

      const zones = await prisma.zone.findMany({
        where: warehouseId ? { warehouseId } : undefined,
        include: {
          locations: {
            include: {
              _count: {
                select: { inventory: true },
              },
            },
          },
        },
      });

      const utilization = zones.map(zone => {
        const totalLocations = zone.locations.length;
        const occupiedLocations = zone.locations.filter(
          loc => loc._count.inventory > 0
        ).length;

        return {
          zoneCode: zone.code,
          zoneName: zone.name,
          zoneType: zone.type,
          totalLocations,
          occupiedLocations,
          emptyLocations: totalLocations - occupiedLocations,
          utilizationRate: totalLocations > 0
            ? Math.round((occupiedLocations / totalLocations) * 100)
            : 0,
        };
      });

      const totals = utilization.reduce(
        (acc, zone) => ({
          totalLocations: acc.totalLocations + zone.totalLocations,
          occupiedLocations: acc.occupiedLocations + zone.occupiedLocations,
        }),
        { totalLocations: 0, occupiedLocations: 0 }
      );

      res.json({
        zones: utilization,
        summary: {
          ...totals,
          emptyLocations: totals.totalLocations - totals.occupiedLocations,
          overallUtilization: totals.totalLocations > 0
            ? Math.round((totals.occupiedLocations / totals.totalLocations) * 100)
            : 0,
        },
      });
    } catch (error) {
      console.error('Get utilization error:', error);
      res.status(500).json({ error: 'Failed to fetch utilization' });
    }
  });

  // Get single location
  router.get('/:id', async (req, res) => {
    try {
      const location = await prisma.location.findUnique({
        where: { id: req.params.id },
        include: {
          zone: {
            include: { warehouse: true },
          },
          inventory: {
            include: {
              product: {
                select: { sku: true, name: true, upc: true },
              },
            },
          },
        },
      });

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json(location);
    } catch (error) {
      console.error('Get location error:', error);
      res.status(500).json({ error: 'Failed to fetch location' });
    }
  });

  // Get location by code
  router.get('/code/:code', async (req, res) => {
    try {
      const { warehouseId } = req.query;

      const location = await prisma.location.findFirst({
        where: {
          code: req.params.code,
          ...(warehouseId && { zone: { warehouseId } }),
        },
        include: {
          zone: { select: { code: true, name: true } },
          inventory: {
            include: {
              product: { select: { sku: true, name: true } },
            },
          },
        },
      });

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json(location);
    } catch (error) {
      console.error('Get location by code error:', error);
      res.status(500).json({ error: 'Failed to fetch location' });
    }
  });

  // Create location
  router.post('/', async (req, res) => {
    try {
      const locationData = req.body;

      const location = await prisma.location.create({
        data: locationData,
        include: {
          zone: { select: { code: true, name: true } },
        },
      });

      res.status(201).json(location);
    } catch (error) {
      console.error('Create location error:', error);
      res.status(500).json({ error: 'Failed to create location' });
    }
  });

  // Update location
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const location = await prisma.location.update({
        where: { id },
        data: updateData,
        include: {
          zone: { select: { code: true, name: true } },
        },
      });

      res.json(location);
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  // Create zone
  router.post('/zones', async (req, res) => {
    try {
      const zoneData = req.body;

      const zone = await prisma.zone.create({
        data: zoneData,
        include: {
          warehouse: { select: { code: true, name: true } },
        },
      });

      res.status(201).json(zone);
    } catch (error) {
      console.error('Create zone error:', error);
      res.status(500).json({ error: 'Failed to create zone' });
    }
  });

  // Get replenishment needed locations
  router.get('/replenishment/needed', async (req, res) => {
    try {
      const { warehouseId } = req.query;

      const locations = await prisma.location.findMany({
        where: {
          type: 'PICK_FACE',
          isReplenishable: true,
          ...(warehouseId && { zone: { warehouseId } }),
        },
        include: {
          zone: { select: { code: true } },
          inventory: {
            include: {
              product: {
                select: { sku: true, name: true, reorderPoint: true },
              },
            },
          },
        },
      });

      // Filter to locations below minimum
      const needsReplenishment = locations.filter(loc => {
        if (!loc.minQuantity) return false;
        const totalQty = loc.inventory.reduce(
          (sum, inv) => sum + inv.quantityOnHand,
          0
        );
        return totalQty < loc.minQuantity;
      }).map(loc => ({
        locationId: loc.id,
        locationCode: loc.code,
        zoneCode: loc.zone.code,
        currentQuantity: loc.inventory.reduce(
          (sum, inv) => sum + inv.quantityOnHand,
          0
        ),
        minQuantity: loc.minQuantity,
        maxQuantity: loc.maxQuantity,
        products: loc.inventory.map(inv => ({
          sku: inv.product.sku,
          name: inv.product.name,
          quantity: inv.quantityOnHand,
        })),
      }));

      res.json(needsReplenishment);
    } catch (error) {
      console.error('Get replenishment needed error:', error);
      res.status(500).json({ error: 'Failed to fetch replenishment data' });
    }
  });

  // Bulk create locations
  router.post('/bulk', async (req, res) => {
    try {
      const { zoneId, prefix, startNumber, endNumber, type } = req.body;

      const locations = [];
      for (let i = startNumber; i <= endNumber; i++) {
        locations.push({
          zoneId,
          code: `${prefix}${i.toString().padStart(3, '0')}`,
          type: type || 'STORAGE',
          pickSequence: i,
        });
      }

      const created = await prisma.location.createMany({
        data: locations,
        skipDuplicates: true,
      });

      res.status(201).json({
        success: true,
        created: created.count,
      });
    } catch (error) {
      console.error('Bulk create locations error:', error);
      res.status(500).json({ error: 'Failed to create locations' });
    }
  });

  return router;
}
