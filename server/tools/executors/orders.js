/**
 * Order-related tool executors
 */

export async function getLateOrders(prisma, params) {
  const lateOrders = await prisma.order.findMany({
    where: {
      requiredDate: { lt: new Date() },
      status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
    },
    include: {
      customer: { select: { name: true } },
      carrier: { select: { name: true } },
    },
    orderBy: { requiredDate: 'asc' },
    take: params.limit || 20,
  });

  return {
    success: true,
    totalLate: lateOrders.length,
    orders: lateOrders.map(o => ({
      orderNumber: o.orderNumber,
      customer: o.customer.name,
      status: o.status,
      priority: o.priority,
      requiredDate: o.requiredDate,
      daysLate: Math.ceil((Date.now() - o.requiredDate.getTime()) / (1000 * 60 * 60 * 24)),
      totalUnits: o.totalUnits,
      carrier: o.carrier?.name,
    })),
  };
}

export async function getOrderDetails(prisma, params) {
  const order = await prisma.order.findFirst({
    where: { orderNumber: params.order_number },
    include: {
      customer: true,
      carrier: { select: { name: true } },
      lines: {
        include: {
          product: { select: { sku: true, name: true } },
        },
      },
      tasks: {
        select: { taskNumber: true, type: true, status: true },
      },
      shipments: {
        select: { shipmentNumber: true, status: true, trackingNumber: true },
      },
    },
  });

  if (!order) {
    return { success: false, message: `Order ${params.order_number} not found` };
  }

  return {
    success: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      priority: order.priority,
      type: order.type,
      customer: order.customer.name,
      orderDate: order.orderDate,
      requiredDate: order.requiredDate,
      shipToAddress: `${order.shipToAddress}, ${order.shipToCity}, ${order.shipToState} ${order.shipToZipCode}`,
      carrier: order.carrier?.name,
      totalLines: order.totalLines,
      totalUnits: order.totalUnits,
      pickedUnits: order.pickedUnits,
      shippedUnits: order.shippedUnits,
    },
    lines: order.lines.map(l => ({
      lineNumber: l.lineNumber,
      sku: l.product.sku,
      productName: l.product.name,
      ordered: l.quantityOrdered,
      allocated: l.quantityAllocated,
      picked: l.quantityPicked,
      shipped: l.quantityShipped,
      status: l.status,
    })),
    tasks: order.tasks,
    shipments: order.shipments,
  };
}

export async function updateOrderPriority(prisma, params) {
  const updated = await prisma.order.updateMany({
    where: {
      id: { in: params.order_ids },
    },
    data: {
      priority: params.priority,
      notes: params.reason ? `Priority updated: ${params.reason}` : undefined,
    },
  });

  return {
    success: true,
    message: `Updated priority for ${updated.count} order(s) to ${params.priority}`,
    ordersUpdated: updated.count,
    newPriority: params.priority,
  };
}
