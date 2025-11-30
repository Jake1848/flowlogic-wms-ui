/**
 * User/labor-related tool executors
 */

export async function investigateUser(prisma, params) {
  const user = await prisma.user.findFirst({
    where: { username: params.username },
    include: {
      assignedTasks: {
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        take: 10,
      },
      laborEntries: {
        orderBy: { startTime: 'desc' },
        take: 20,
      },
    },
  });

  if (!user) {
    return { success: false, message: `No user found with username ${params.username}` };
  }

  // Calculate productivity metrics
  const completedEntries = user.laborEntries.filter(e => e.endTime && e.unitsProcessed);
  const totalUnits = completedEntries.reduce((sum, e) => sum + (e.unitsProcessed || 0), 0);
  const totalMinutes = completedEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  const unitsPerHour = totalMinutes > 0 ? Math.round((totalUnits / totalMinutes) * 60) : 0;

  return {
    success: true,
    user: {
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLoginAt,
    },
    activeTasks: user.assignedTasks.length,
    productivity: {
      unitsProcessed: totalUnits,
      totalMinutes,
      unitsPerHour,
    },
    recentActivity: user.laborEntries.map(e => ({
      type: e.activityType,
      startTime: e.startTime,
      endTime: e.endTime,
      duration: e.durationMinutes,
      unitsProcessed: e.unitsProcessed,
    })),
  };
}
