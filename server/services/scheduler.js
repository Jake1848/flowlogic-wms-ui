/**
 * FlowLogic Scheduler Service
 *
 * Handles scheduled jobs for:
 * - Daily inventory analysis
 * - Weekly digest emails
 * - Scheduled WMS sync
 * - Trial ending reminders
 */

import notificationService from './notification.js';

class SchedulerService {
  constructor() {
    this.prisma = null;
    this.jobs = new Map();
    this.intervals = new Map();
  }

  /**
   * Initialize with Prisma client
   */
  initialize(prisma) {
    this.prisma = prisma;
    notificationService.setPrisma(prisma);
    console.log('📅 Scheduler service initialized');
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (!this.prisma) {
      console.error('Scheduler: Prisma not initialized');
      return;
    }

    // Run daily analysis at 6 AM
    this.scheduleDaily('daily-analysis', 6, 0, () => this.runDailyAnalysis());

    // Run weekly digest on Monday at 9 AM
    this.scheduleWeekly('weekly-digest', 1, 9, 0, () => this.sendWeeklyDigests());

    // Check for trial endings daily at 10 AM
    this.scheduleDaily('trial-check', 10, 0, () => this.checkTrialEndings());

    // Run scheduled syncs every hour
    this.scheduleInterval('scheduled-syncs', 60 * 60 * 1000, () => this.runScheduledSyncs());

    console.log('📅 Scheduled jobs started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    for (const [name, intervalId] of this.intervals) {
      clearInterval(intervalId);
      console.log(`📅 Stopped job: ${name}`);
    }
    this.intervals.clear();
    this.jobs.clear();
  }

  /**
   * Schedule a job to run daily at a specific time
   */
  scheduleDaily(name, hour, minute, callback) {
    const runJob = () => {
      const now = new Date();
      if (now.getHours() === hour && now.getMinutes() === minute) {
        console.log(`📅 Running daily job: ${name}`);
        callback().catch(err => console.error(`Job ${name} failed:`, err));
      }
    };

    // Check every minute
    const intervalId = setInterval(runJob, 60 * 1000);
    this.intervals.set(name, intervalId);
    this.jobs.set(name, { type: 'daily', hour, minute, callback });
  }

  /**
   * Schedule a job to run weekly on a specific day and time
   */
  scheduleWeekly(name, dayOfWeek, hour, minute, callback) {
    const runJob = () => {
      const now = new Date();
      if (now.getDay() === dayOfWeek && now.getHours() === hour && now.getMinutes() === minute) {
        console.log(`📅 Running weekly job: ${name}`);
        callback().catch(err => console.error(`Job ${name} failed:`, err));
      }
    };

    const intervalId = setInterval(runJob, 60 * 1000);
    this.intervals.set(name, intervalId);
    this.jobs.set(name, { type: 'weekly', dayOfWeek, hour, minute, callback });
  }

  /**
   * Schedule a job to run at a fixed interval
   */
  scheduleInterval(name, intervalMs, callback) {
    const intervalId = setInterval(() => {
      console.log(`📅 Running interval job: ${name}`);
      callback().catch(err => console.error(`Job ${name} failed:`, err));
    }, intervalMs);

    this.intervals.set(name, intervalId);
    this.jobs.set(name, { type: 'interval', intervalMs, callback });
  }

  /**
   * Run daily inventory analysis
   */
  async runDailyAnalysis() {
    console.log('📊 Starting daily inventory analysis...');

    try {
      // Get all active companies
      const companies = await this.prisma.company.findMany({
        where: { isActive: true },
        include: {
          warehouses: {
            where: { isActive: true }
          }
        }
      });

      for (const company of companies) {
        for (const warehouse of company.warehouses) {
          try {
            await this.analyzeWarehouse(warehouse.id, company.id);
          } catch (err) {
            console.error(`Analysis failed for warehouse ${warehouse.code}:`, err);
          }
        }
      }

      console.log('📊 Daily analysis complete');
    } catch (error) {
      console.error('Daily analysis error:', error);
    }
  }

  /**
   * Analyze a single warehouse for discrepancies
   */
  async analyzeWarehouse(warehouseId, companyId) {
    // Check for negative inventory
    const negativeInventory = await this.prisma.inventorySnapshot.findMany({
      where: {
        onHandQty: { lt: 0 }
      },
      take: 100
    });

    // Check for cycle count variances > 5%
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const cycleCountVariances = await this.prisma.cycleCountSnapshot.findMany({
      where: {
        countDate: { gte: yesterday },
        variancePercent: { gt: 5 }
      },
      take: 100
    });

    let criticalCount = 0;
    let totalIssues = 0;

    // Create discrepancies for negative inventory
    for (const inv of negativeInventory) {
      const existing = await this.prisma.discrepancy.findFirst({
        where: {
          sku: inv.sku,
          locationCode: inv.locationCode,
          status: 'OPEN'
        }
      });

      if (!existing) {
        await this.prisma.discrepancy.create({
          data: {
            type: 'NEGATIVE_INVENTORY',
            severity: 'CRITICAL',
            status: 'OPEN',
            sku: inv.sku,
            locationCode: inv.locationCode,
            expectedQty: 0,
            actualQty: inv.onHandQty,
            variance: inv.onHandQty,
            variancePercent: 100,
            description: `Negative inventory detected: ${inv.onHandQty} units`,
            detectedAt: new Date()
          }
        });
        criticalCount++;
        totalIssues++;
      }
    }

    // Create discrepancies for cycle count variances
    for (const cc of cycleCountVariances) {
      const existing = await this.prisma.discrepancy.findFirst({
        where: {
          sku: cc.sku,
          locationCode: cc.locationCode,
          status: 'OPEN',
          type: 'CYCLE_COUNT_VARIANCE'
        }
      });

      if (!existing) {
        const severity = cc.variancePercent > 20 ? 'CRITICAL' : cc.variancePercent > 10 ? 'HIGH' : 'MEDIUM';

        await this.prisma.discrepancy.create({
          data: {
            type: 'CYCLE_COUNT_VARIANCE',
            severity,
            status: 'OPEN',
            sku: cc.sku,
            locationCode: cc.locationCode,
            expectedQty: cc.systemQty,
            actualQty: cc.countedQty,
            variance: cc.variance,
            variancePercent: cc.variancePercent,
            description: `Cycle count variance: ${cc.variance} units (${cc.variancePercent.toFixed(1)}%)`,
            detectedAt: new Date()
          }
        });

        if (severity === 'CRITICAL') criticalCount++;
        totalIssues++;
      }
    }

    // Notify admin users if critical issues found
    if (criticalCount > 0) {
      const admins = await this.prisma.user.findMany({
        where: {
          companyId,
          role: { in: ['ADMIN', 'MANAGER'] },
          isActive: true
        }
      });

      for (const admin of admins) {
        await notificationService.notifyAnalysisComplete(admin.id, {
          totalIssues,
          criticalIssues: criticalCount,
          estimatedImpact: criticalCount * 500 // Rough estimate
        });
      }
    }

    return { totalIssues, criticalCount };
  }

  /**
   * Send weekly digest emails to all users
   */
  async sendWeeklyDigests() {
    console.log('📧 Sending weekly digest emails...');

    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        include: {
          notificationSettings: {
            where: { eventType: 'WEEKLY_DIGEST' }
          }
        }
      });

      let sent = 0;
      for (const user of users) {
        const settings = user.notificationSettings[0];
        if (!settings || settings.emailEnabled) {
          try {
            await notificationService.sendWeeklyDigest(user.id);
            sent++;
          } catch (err) {
            console.error(`Failed to send digest to ${user.email}:`, err);
          }
        }
      }

      console.log(`📧 Weekly digest sent to ${sent} users`);
    } catch (error) {
      console.error('Weekly digest error:', error);
    }
  }

  /**
   * Check for trials ending soon and send reminders
   */
  async checkTrialEndings() {
    console.log('📧 Checking trial endings...');

    try {
      // This would integrate with your billing system
      // For now, just log
      console.log('📧 Trial check complete (billing integration needed)');
    } catch (error) {
      console.error('Trial check error:', error);
    }
  }

  /**
   * Run scheduled WMS syncs
   */
  async runScheduledSyncs() {
    try {
      const now = new Date();

      const scheduledSyncs = await this.prisma.scheduledIngestion.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: now }
        }
      });

      console.log(`📥 Running ${scheduledSyncs.length} scheduled syncs`);

      for (const sync of scheduledSyncs) {
        try {
          // Update next run time
          const nextRun = this.calculateNextRun(sync.schedule);
          await this.prisma.scheduledIngestion.update({
            where: { id: sync.id },
            data: {
              lastRunAt: now,
              nextRunAt: nextRun
            }
          });

          // Trigger the sync (would connect to connector routes)
          console.log(`📥 Triggered sync: ${sync.name}`);
        } catch (err) {
          console.error(`Scheduled sync ${sync.name} failed:`, err);
        }
      }
    } catch (error) {
      console.error('Scheduled sync error:', error);
    }
  }

  /**
   * Calculate next run time from cron expression (simplified)
   */
  calculateNextRun(cronExpression) {
    // Simplified: just add 1 hour for now
    // In production, use a proper cron parser
    const next = new Date();
    next.setHours(next.getHours() + 1);
    return next;
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus() {
    const status = [];
    for (const [name, job] of this.jobs) {
      status.push({
        name,
        type: job.type,
        ...(job.type === 'daily' && { time: `${job.hour}:${job.minute.toString().padStart(2, '0')}` }),
        ...(job.type === 'weekly' && {
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][job.dayOfWeek],
          time: `${job.hour}:${job.minute.toString().padStart(2, '0')}`
        }),
        ...(job.type === 'interval' && { intervalMs: job.intervalMs })
      });
    }
    return status;
  }
}

// Singleton instance
const schedulerService = new SchedulerService();

export default schedulerService;
