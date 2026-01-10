/**
 * User-related tool executors
 * Updated for AI Intelligence Platform
 */

export async function investigateUser(prisma, params) {
  const user = await prisma.user.findFirst({
    where: { username: params.username },
    include: {
      company: { select: { name: true } },
      warehouses: {
        include: {
          warehouse: { select: { name: true, code: true } },
        },
      },
    },
  });

  if (!user) {
    return { success: false, message: `No user found with username ${params.username}` };
  }

  // Get audit logs for this user
  const recentActivity = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    success: true,
    user: {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      company: user.company?.name,
      isActive: user.isActive,
      lastLogin: user.lastLoginAt,
    },
    assignedWarehouses: user.warehouses.map(uw => ({
      code: uw.warehouse.code,
      name: uw.warehouse.name,
      isDefault: uw.isDefault,
    })),
    recentActivity: recentActivity.map(log => ({
      action: log.action,
      entityType: log.entityType,
      timestamp: log.createdAt,
    })),
    note: 'Labor and task tracking is managed in your host WMS.',
  };
}
