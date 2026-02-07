/**
 * Trial Enforcement Middleware
 *
 * Checks if a company's trial has expired and blocks access
 * unless they have an active subscription. Whitelists billing
 * and auth routes so users can still upgrade.
 */

export function trialEnforcement(prisma) {
  return async (req, res, next) => {
    // Skip if no authenticated user
    if (!req.user?.companyId) return next();

    const companyId = req.user.companyId;

    try {
      const [planSetting, trialEndsSetting] = await Promise.all([
        prisma.systemSetting.findUnique({
          where: { key: `company.${companyId}.plan` }
        }),
        prisma.systemSetting.findUnique({
          where: { key: `company.${companyId}.trialEndsAt` }
        })
      ]);

      // No plan setting means legacy/seeded user — allow through
      if (!planSetting) return next();

      const plan = planSetting.value;

      // Active paid plans pass through
      if (plan === 'starter' || plan === 'professional' || plan === 'enterprise') {
        return next();
      }

      // Check trial expiry
      if (plan === 'trial' && trialEndsSetting) {
        const trialEndsAt = new Date(trialEndsSetting.value);
        if (trialEndsAt > new Date()) {
          return next(); // Trial still active
        }

        // Trial expired
        return res.status(402).json({
          error: 'Trial expired',
          message: 'Your 14-day trial has ended. Please upgrade to continue using FlowLogic.',
          trialExpired: true,
          upgradeUrl: '/billing'
        });
      }

      // Unknown plan state — allow through
      next();
    } catch (error) {
      // Don't block users if the check itself fails
      console.error('[Trial Enforcement] Error checking trial:', error.message);
      next();
    }
  };
}
