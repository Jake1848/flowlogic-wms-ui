// Product Routes - FlowLogic WMS
import express from 'express';

const router = express.Router();

export default function productRoutes(prisma) {
  // Get all products with filters
  router.get('/', async (req, res) => {
    try {
      const {
        categoryId,
        velocityCode,
        search,
        isActive,
        page = 1,
        limit = 50,
      } = req.query;

      const where = {};

      if (categoryId) where.categoryId = categoryId;
      if (velocityCode) where.velocityCode = velocityCode;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      if (search) {
        where.OR = [
          { sku: { contains: search, mode: 'insensitive' } },
          { upc: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { code: true, name: true } },
            _count: {
              select: {
                inventory: true,
                orderLines: true,
              },
            },
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { sku: 'asc' },
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Get product categories
  router.get('/categories', async (req, res) => {
    try {
      const categories = await prisma.productCategory.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { products: true } },
          children: {
            select: { id: true, code: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get single product
  router.get('/:id', async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: {
          category: true,
          inventory: {
            include: {
              location: {
                select: { code: true, zone: { select: { name: true } } },
              },
              warehouse: { select: { code: true, name: true } },
            },
          },
          productVendors: {
            include: {
              vendor: { select: { code: true, name: true } },
            },
          },
          replenishmentRules: true,
        },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Calculate total inventory
      const totalOnHand = product.inventory.reduce(
        (sum, inv) => sum + inv.quantityOnHand,
        0
      );
      const totalAvailable = product.inventory.reduce(
        (sum, inv) => sum + inv.quantityAvailable,
        0
      );

      res.json({
        ...product,
        totalOnHand,
        totalAvailable,
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // Get product by SKU
  router.get('/sku/:sku', async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { sku: req.params.sku },
        include: {
          category: { select: { code: true, name: true } },
          inventory: {
            where: { quantityOnHand: { gt: 0 } },
            include: {
              location: { select: { code: true } },
              warehouse: { select: { code: true } },
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Get product by SKU error:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // Create product
  router.post('/', async (req, res) => {
    try {
      const productData = req.body;

      // Check if SKU already exists
      const existing = await prisma.product.findUnique({
        where: { sku: productData.sku },
      });

      if (existing) {
        return res.status(400).json({ error: 'SKU already exists' });
      }

      const product = await prisma.product.create({
        data: productData,
        include: { category: true },
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // Update product
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Don't allow SKU change
      delete updateData.sku;

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { category: true },
      });

      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Deactivate product
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Check for active inventory
      const hasInventory = await prisma.inventory.count({
        where: {
          productId: id,
          quantityOnHand: { gt: 0 },
        },
      });

      if (hasInventory > 0) {
        return res.status(400).json({
          error: 'Cannot deactivate product with active inventory',
        });
      }

      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({ success: true, message: 'Product deactivated' });
    } catch (error) {
      console.error('Deactivate product error:', error);
      res.status(500).json({ error: 'Failed to deactivate product' });
    }
  });

  // Get product inventory across locations
  router.get('/:id/inventory', async (req, res) => {
    try {
      const inventory = await prisma.inventory.findMany({
        where: { productId: req.params.id },
        include: {
          location: {
            include: { zone: { select: { code: true, name: true } } },
          },
          warehouse: { select: { code: true, name: true } },
        },
        orderBy: [
          { warehouse: { code: 'asc' } },
          { location: { code: 'asc' } },
        ],
      });

      res.json(inventory);
    } catch (error) {
      console.error('Get product inventory error:', error);
      res.status(500).json({ error: 'Failed to fetch product inventory' });
    }
  });

  // Get product transaction history
  router.get('/:id/transactions', async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;

      const transactions = await prisma.inventoryTransaction.findMany({
        where: { productId: req.params.id },
        include: {
          location: { select: { code: true } },
          user: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      });

      res.json(transactions);
    } catch (error) {
      console.error('Get product transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Bulk import products
  router.post('/import', async (req, res) => {
    try {
      const { products } = req.body;

      const results = {
        created: 0,
        updated: 0,
        errors: [],
      };

      for (const productData of products) {
        try {
          const existing = await prisma.product.findUnique({
            where: { sku: productData.sku },
          });

          if (existing) {
            await prisma.product.update({
              where: { sku: productData.sku },
              data: productData,
            });
            results.updated++;
          } else {
            await prisma.product.create({ data: productData });
            results.created++;
          }
        } catch (err) {
          results.errors.push({
            sku: productData.sku,
            error: err.message,
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({ error: 'Failed to import products' });
    }
  });

  return router;
}
