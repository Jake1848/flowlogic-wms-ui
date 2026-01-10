/**
 * FlowLogic Email Service
 *
 * SendGrid integration for transactional emails
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@flowlogic.ai';
const FROM_NAME = 'FlowLogic';

/**
 * Email templates
 */
const templates = {
  welcome: (data) => ({
    subject: 'Welcome to FlowLogic - Let\'s Find Your Inventory Issues',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; }
          .logo { width: 48px; height: 48px; }
          .content { background: #f8fafc; border-radius: 12px; padding: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          h1 { color: #0f172a; margin-bottom: 20px; }
          .feature { display: flex; align-items: flex-start; margin: 15px 0; }
          .feature-icon { width: 24px; height: 24px; margin-right: 12px; color: #3b82f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #3b82f6; margin: 0;">FlowLogic</h2>
          </div>
          <div class="content">
            <h1>Welcome, ${data.firstName}!</h1>
            <p>You're now part of the FlowLogic family. We're excited to help you discover and fix inventory discrepancies that have been costing your operation money.</p>

            <h3>Here's what you can do next:</h3>
            <ul>
              <li><strong>Connect your WMS</strong> - Link your SAP, Manhattan, Blue Yonder, Oracle, or Infor system</li>
              <li><strong>Import inventory data</strong> - Upload snapshots or connect to real-time feeds</li>
              <li><strong>Run AI analysis</strong> - Let our engine find discrepancies you've been missing</li>
            </ul>

            <p style="text-align: center; margin-top: 30px;">
              <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
            </p>

            <p style="margin-top: 30px;">Your 14-day free trial includes full access to all features. No credit card required.</p>
          </div>
          <div class="footer">
            <p>Need help? Reply to this email or visit our <a href="${data.supportUrl}">Help Center</a></p>
            <p>&copy; ${new Date().getFullYear()} FlowLogic. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to FlowLogic, ${data.firstName}!

You're now part of the FlowLogic family. We're excited to help you discover and fix inventory discrepancies.

Here's what you can do next:
1. Connect your WMS - Link your SAP, Manhattan, Blue Yonder, Oracle, or Infor system
2. Import inventory data - Upload snapshots or connect to real-time feeds
3. Run AI analysis - Let our engine find discrepancies you've been missing

Go to your dashboard: ${data.dashboardUrl}

Your 14-day free trial includes full access to all features. No credit card required.

Need help? Reply to this email or visit: ${data.supportUrl}

- The FlowLogic Team
    `
  }),

  passwordReset: (data) => ({
    subject: 'Reset Your FlowLogic Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; }
          .content { background: #f8fafc; border-radius: 12px; padding: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #3b82f6; margin: 0;">FlowLogic</h2>
          </div>
          <div class="content">
            <h1>Password Reset Request</h1>
            <p>Hi ${data.firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </p>

            <div class="warning">
              <strong>This link expires in 1 hour.</strong> If you didn't request this reset, you can safely ignore this email.
            </div>

            <p style="font-size: 14px; color: #64748b;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${data.resetUrl}">${data.resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FlowLogic. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request

Hi ${data.firstName},

We received a request to reset your password. Visit the link below to create a new password:

${data.resetUrl}

This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.

- The FlowLogic Team
    `
  }),

  alertNotification: (data) => ({
    subject: `[${data.severity}] FlowLogic Alert: ${data.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .content { background: #f8fafc; border-radius: 12px; padding: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          .alert-critical { border-left: 4px solid #ef4444; }
          .alert-high { border-left: 4px solid #f97316; }
          .alert-medium { border-left: 4px solid #eab308; }
          .alert-low { border-left: 4px solid #3b82f6; }
          .metric { display: inline-block; background: #e2e8f0; padding: 8px 16px; border-radius: 6px; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #3b82f6; margin: 0;">FlowLogic Alert</h2>
          </div>
          <div class="content alert-${data.severity.toLowerCase()}">
            <h2 style="margin-top: 0;">${data.title}</h2>
            <p>${data.message}</p>

            ${data.metrics ? `
            <div style="margin: 20px 0;">
              ${data.metrics.map(m => `<span class="metric"><strong>${m.label}:</strong> ${m.value}</span>`).join('')}
            </div>
            ` : ''}

            ${data.recommendation ? `
            <div style="background: #ecfdf5; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <strong>Recommended Action:</strong><br>
              ${data.recommendation}
            </div>
            ` : ''}

            <p style="text-align: center; margin-top: 30px;">
              <a href="${data.alertUrl}" class="button">View in Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>You're receiving this because you have alerts enabled for ${data.alertType}.</p>
            <p><a href="${data.settingsUrl}">Manage alert preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
FlowLogic Alert - ${data.severity}

${data.title}

${data.message}

${data.recommendation ? `Recommended Action: ${data.recommendation}` : ''}

View in dashboard: ${data.alertUrl}

---
Manage alert preferences: ${data.settingsUrl}
    `
  }),

  trialEnding: (data) => ({
    subject: 'Your FlowLogic Trial Ends in 3 Days',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; }
          .content { background: #f8fafc; border-radius: 12px; padding: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          .stat { text-align: center; padding: 20px; }
          .stat-value { font-size: 36px; font-weight: bold; color: #3b82f6; }
          .stat-label { color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #3b82f6; margin: 0;">FlowLogic</h2>
          </div>
          <div class="content">
            <h1>Your Trial Ends Soon</h1>
            <p>Hi ${data.firstName},</p>
            <p>Your FlowLogic trial ends in <strong>3 days</strong>. Here's what you've discovered so far:</p>

            <div style="display: flex; justify-content: space-around; margin: 30px 0;">
              <div class="stat">
                <div class="stat-value">${data.discrepanciesFound}</div>
                <div class="stat-label">Discrepancies Found</div>
              </div>
              <div class="stat">
                <div class="stat-value">$${data.potentialSavings}</div>
                <div class="stat-label">Potential Savings</div>
              </div>
            </div>

            <p>Don't lose access to these insights. Upgrade now to continue finding and fixing inventory issues.</p>

            <p style="text-align: center; margin-top: 30px;">
              <a href="${data.upgradeUrl}" class="button">Upgrade Now</a>
            </p>

            <p style="text-align: center; margin-top: 20px;">
              <a href="${data.contactUrl}" style="color: #3b82f6;">Have questions? Talk to our team</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FlowLogic. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your FlowLogic Trial Ends in 3 Days

Hi ${data.firstName},

Your trial ends in 3 days. Here's what you've discovered:
- Discrepancies Found: ${data.discrepanciesFound}
- Potential Savings: $${data.potentialSavings}

Don't lose access. Upgrade now: ${data.upgradeUrl}

Have questions? ${data.contactUrl}

- The FlowLogic Team
    `
  })
};

export class EmailService {
  /**
   * Send an email using a template
   */
  async send(to, templateName, data) {
    const template = templates[templateName];

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html, text } = template(data);

    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject,
      html,
      text
    };

    if (!process.env.SENDGRID_API_KEY) {
      console.log('📧 Email would be sent (SendGrid not configured):');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      return { success: true, preview: true };
    }

    try {
      await sgMail.send(msg);
      console.log(`📧 Email sent to ${to}: ${subject}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcome(user, company) {
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';

    return this.send(user.email, 'welcome', {
      firstName: user.firstName,
      companyName: company.name,
      dashboardUrl: `${baseUrl}/dashboard`,
      supportUrl: `${baseUrl}/help`
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';

    return this.send(user.email, 'passwordReset', {
      firstName: user.firstName,
      resetUrl: `${baseUrl}/reset-password?token=${resetToken}`
    });
  }

  /**
   * Send alert notification
   */
  async sendAlert(user, alert) {
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';

    return this.send(user.email, 'alertNotification', {
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      recommendation: alert.recommendation,
      metrics: alert.metrics,
      alertType: alert.type,
      alertUrl: `${baseUrl}/alerts/${alert.id}`,
      settingsUrl: `${baseUrl}/settings/notifications`
    });
  }

  /**
   * Send trial ending reminder
   */
  async sendTrialEnding(user, stats) {
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';

    return this.send(user.email, 'trialEnding', {
      firstName: user.firstName,
      discrepanciesFound: stats.discrepanciesFound,
      potentialSavings: stats.potentialSavings,
      upgradeUrl: `${baseUrl}/dashboard?upgrade=true`,
      contactUrl: `${baseUrl}/contact`
    });
  }
}

export default new EmailService();
