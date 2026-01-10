/**
 * Task-related tool executors
 * Updated for AI Intelligence Platform - creates action recommendations
 */

export async function createTask(prisma, params) {
  // In AI Intelligence Platform, we create action recommendations instead of tasks
  // These get exported to the host WMS for execution

  const action = await prisma.actionRecommendation.create({
    data: {
      type: params.type || 'general_task',
      priority: params.priority || 3,
      sku: params.sku || null,
      locationCode: params.location_code || null,
      description: params.description || `${params.type} task`,
      instructions: params.notes || 'Created by Flow AI',
      status: 'PENDING',
    },
  });

  return {
    success: true,
    message: `Action recommendation created successfully`,
    action: {
      id: action.id,
      type: action.type,
      priority: action.priority,
      status: action.status,
      description: action.description,
    },
    note: 'This recommendation will be exported to your WMS for execution.',
  };
}
