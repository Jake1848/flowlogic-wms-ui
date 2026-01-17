/**
 * FlowLogic Notification Service
 *
 * Handles sending notifications based on user preferences
 * Connects alerts, discrepancies, and system events to email/SMS/push
 */

import emailService from './email.js';

class NotificationService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Initialize with Prisma client
   */
  setPrisma(prisma) {
    this.prisma = prisma;
  }

  /**
   * Get notification settings for a user and event type
   */
  async getUserSettings(userId, eventType) {
    if (!this.prisma) {
      console.warn('NotificationService: Prisma not initialized');
      return null;
    }

    try {
      const setting = await this.prisma.notificationSetting.findUnique({
        where: {
          userId_eventType: {
            userId,
            eventType
          }
        }
      });

      // Return default settings if none configured
      if (!setting) {
        return {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: false,
          inAppEnabled: true,
          frequency: 'IMMEDIATE'
        };
      }

      return setting;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
  }

  /**
   * Get all users who should be notified for an event
   */
  async getNotificationRecipients(warehouseId, eventType) {
    if (!this.prisma) return [];

    try {
      // Get all users associated with this warehouse who have email enabled for this event type
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          warehouses: {
            some: {
              warehouseId
            }
          }
        },
        include: {
          notificationSettings: {
            where: {
              eventType
            }
          }
        }
      });

      // Filter to users with email enabled (or no settings = default enabled)
      return users.filter(user => {
        const settings = user.notificationSettings[0];
        return !settings || settings.emailEnabled;
      });
    } catch (error) {
      console.error('Error fetching notification recipients:', error);
      return [];
    }
  }

  /**
   * Log email sending attempt
   */
  async logEmail(userId, recipientEmail, eventType, subject, status, errorMessage = null) {
    if (!this.prisma) return;

    try {
      await this.prisma.emailLog.create({
        data: {
          userId,
          recipientEmail,
          eventType,
          subject,
          status,
          errorMessage,
          sentAt: status === 'SENT' ? new Date() : null
        }
      });
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Send alert notification to all relevant users
   */
  async notifyAlert(alert, warehouseId) {
    // Map alert severity to event type
    const eventTypeMap = {
      'critical': 'ALERT_CRITICAL',
      'high': 'ALERT_HIGH',
      'medium': 'ALERT_MEDIUM',
      'low': 'ALERT_LOW'
    };

    const eventType = eventTypeMap[alert.severity?.toLowerCase()] || 'ALERT_MEDIUM';
    const recipients = await this.getNotificationRecipients(warehouseId, eventType);

    console.log(`📧 Notifying ${recipients.length} users about alert: ${alert.title}`);

    const results = [];

    for (const user of recipients) {
      try {
        await emailService.sendAlert(user, alert);
        await this.logEmail(user.id, user.email, eventType, `[${alert.severity}] ${alert.title}`, 'SENT');
        results.push({ userId: user.id, success: true });
      } catch (error) {
        await this.logEmail(user.id, user.email, eventType, `[${alert.severity}] ${alert.title}`, 'FAILED', error.message);
        results.push({ userId: user.id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send discrepancy detected notification
   */
  async notifyDiscrepancy(discrepancy, warehouseId) {
    const recipients = await this.getNotificationRecipients(warehouseId, 'DISCREPANCY_DETECTED');

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';

    const alertData = {
      id: discrepancy.id,
      severity: discrepancy.severity,
      title: `Discrepancy Detected: ${discrepancy.sku}`,
      message: discrepancy.description || `${discrepancy.type} discrepancy found at ${discrepancy.locationCode}`,
      type: 'discrepancy',
      recommendation: `Investigate ${discrepancy.sku} at location ${discrepancy.locationCode}. Variance: ${discrepancy.variance} units.`,
      metrics: [
        { label: 'Expected', value: discrepancy.expectedQty },
        { label: 'Actual', value: discrepancy.actualQty },
        { label: 'Variance', value: `${discrepancy.variance} (${discrepancy.variancePercent}%)` }
      ]
    };

    console.log(`📧 Notifying ${recipients.length} users about discrepancy: ${discrepancy.sku}`);

    for (const user of recipients) {
      try {
        await emailService.sendAlert(user, alertData);
        await this.logEmail(user.id, user.email, 'DISCREPANCY_DETECTED', alertData.title, 'SENT');
      } catch (error) {
        await this.logEmail(user.id, user.email, 'DISCREPANCY_DETECTED', alertData.title, 'FAILED', error.message);
      }
    }
  }

  /**
   * Send analysis complete notification
   */
  async notifyAnalysisComplete(userId, analysisResults) {
    if (!this.prisma) return;

    const settings = await this.getUserSettings(userId, 'ANALYSIS_COMPLETE');
    if (!settings?.emailEnabled) return;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return;

      const baseUrl = process.env.APP_URL || 'http://localhost:5173';

      const alertData = {
        id: 'analysis',
        severity: analysisResults.criticalIssues > 0 ? 'HIGH' : 'LOW',
        title: 'Analysis Complete',
        message: `FlowLogic analysis has completed. Found ${analysisResults.totalIssues} issues requiring attention.`,
        type: 'analysis',
        recommendation: analysisResults.criticalIssues > 0
          ? `${analysisResults.criticalIssues} critical issues need immediate attention.`
          : 'Review the findings in your dashboard.',
        metrics: [
          { label: 'Total Issues', value: analysisResults.totalIssues },
          { label: 'Critical', value: analysisResults.criticalIssues },
          { label: 'Est. Impact', value: `$${analysisResults.estimatedImpact?.toLocaleString() || 0}` }
        ]
      };

      await emailService.sendAlert(user, alertData);
      await this.logEmail(user.id, user.email, 'ANALYSIS_COMPLETE', alertData.title, 'SENT');
    } catch (error) {
      console.error('Error sending analysis complete notification:', error);
    }
  }

  /**
   * Send sync failure notification
   */
  async notifySyncFailed(integration, error) {
    if (!this.prisma) return;

    try {
      // Get company admins
      const admins = await this.prisma.user.findMany({
        where: {
          companyId: integration.companyId,
          role: { in: ['ADMIN', 'MANAGER'] },
          isActive: true
        }
      });

      const baseUrl = process.env.APP_URL || 'http://localhost:5173';

      const alertData = {
        id: integration.id,
        severity: 'HIGH',
        title: `Sync Failed: ${integration.name}`,
        message: `The ${integration.type} integration "${integration.name}" failed to sync. Error: ${error}`,
        type: 'sync_failure',
        recommendation: 'Check your integration credentials and endpoint configuration.'
      };

      for (const admin of admins) {
        const settings = await this.getUserSettings(admin.id, 'SYNC_FAILED');
        if (settings?.emailEnabled !== false) {
          try {
            await emailService.sendAlert(admin, alertData);
            await this.logEmail(admin.id, admin.email, 'SYNC_FAILED', alertData.title, 'SENT');
          } catch (e) {
            await this.logEmail(admin.id, admin.email, 'SYNC_FAILED', alertData.title, 'FAILED', e.message);
          }
        }
      }
    } catch (error) {
      console.error('Error sending sync failed notification:', error);
    }
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(userId) {
    if (!this.prisma) return;

    const settings = await this.getUserSettings(userId, 'WEEKLY_DIGEST');
    if (!settings?.emailEnabled) return;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      });

      if (!user) return;

      // Get last 7 days stats
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [alerts, discrepancies] = await Promise.all([
        this.prisma.alert.count({
          where: {
            createdAt: { gte: sevenDaysAgo },
            warehouse: {
              companyId: user.companyId
            }
          }
        }),
        this.prisma.discrepancy.count({
          where: {
            createdAt: { gte: sevenDaysAgo }
          }
        })
      ]);

      const baseUrl = process.env.APP_URL || 'http://localhost:5173';

      const alertData = {
        id: 'weekly-digest',
        severity: 'LOW',
        title: 'Your Weekly FlowLogic Summary',
        message: `Here's what happened in your warehouse this week.`,
        type: 'weekly_digest',
        metrics: [
          { label: 'New Alerts', value: alerts },
          { label: 'Discrepancies', value: discrepancies }
        ]
      };

      await emailService.sendAlert(user, alertData);
      await this.logEmail(user.id, user.email, 'WEEKLY_DIGEST', alertData.title, 'SENT');
    } catch (error) {
      console.error('Error sending weekly digest:', error);
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();

export default notificationService;
