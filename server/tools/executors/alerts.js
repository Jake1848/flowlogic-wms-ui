/**
 * Alert-related tool executors
 */

export async function getAlerts(prisma, params) {
  const where = { isResolved: false };
  if (params.severity) where.severity = params.severity;

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: params.limit || 20,
  });

  return {
    success: true,
    totalAlerts: alerts.length,
    alerts: alerts.map(a => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      suggestedAction: a.suggestedAction,
      createdAt: a.createdAt,
    })),
  };
}

export async function createAlert(prisma, params) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { isDefault: true },
  });

  const alert = await prisma.alert.create({
    data: {
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      suggestedAction: params.suggested_action,
      warehouseId: warehouse?.id,
      aiConfidence: 0.9,
    },
  });

  return {
    success: true,
    message: `Alert created: ${params.title}`,
    alert: {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
    },
  };
}
