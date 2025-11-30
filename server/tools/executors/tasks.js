/**
 * Task-related tool executors
 */

export async function createTask(prisma, params) {
  // Get default warehouse
  const warehouse = await prisma.warehouse.findFirst({
    where: { isDefault: true },
  });

  if (!warehouse) {
    return { success: false, message: 'No default warehouse configured' };
  }

  // Generate task number
  const lastTask = await prisma.task.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { taskNumber: true },
  });

  let nextNum = 1;
  if (lastTask) {
    const parts = lastTask.taskNumber.split('-');
    nextNum = parseInt(parts[parts.length - 1]) + 1;
  }

  const taskNumber = `TSK-${params.type.substring(0, 3)}-${nextNum.toString().padStart(6, '0')}`;

  const task = await prisma.task.create({
    data: {
      taskNumber,
      type: params.type,
      warehouseId: warehouse.id,
      priority: params.priority || 5,
      orderId: params.order_id || null,
      notes: params.notes ? `${params.notes} [Created by Flow AI]` : 'Created by Flow AI',
      status: 'PENDING',
    },
  });

  return {
    success: true,
    message: `Task ${taskNumber} created successfully`,
    task: {
      id: task.id,
      taskNumber: task.taskNumber,
      type: task.type,
      priority: task.priority,
      status: task.status,
    },
  };
}
