/**
 * Product-related tool executors
 */

export async function searchProducts(prisma, params) {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { sku: { contains: params.query, mode: 'insensitive' } },
        { name: { contains: params.query, mode: 'insensitive' } },
        { upc: { contains: params.query, mode: 'insensitive' } },
      ],
    },
    include: {
      category: { select: { name: true } },
      _count: { select: { inventory: true } },
    },
    take: params.limit || 10,
  });

  return {
    success: true,
    resultsCount: products.length,
    products: products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      upc: p.upc,
      category: p.category?.name,
      cost: p.cost,
      price: p.price,
      inventoryLocations: p._count.inventory,
      isActive: p.isActive,
    })),
  };
}
