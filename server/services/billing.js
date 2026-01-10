/**
 * FlowLogic Billing Service
 *
 * Stripe integration for subscription management
 */

import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
});

// Subscription plans
export const PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    price: 499,
    interval: 'month',
    features: {
      maxSKUs: 10000,
      maxWarehouses: 1,
      maxUsers: 5,
      aiAnalysis: 'basic',
      support: 'email'
    }
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    price: 1499,
    interval: 'month',
    features: {
      maxSKUs: 100000,
      maxWarehouses: 5,
      maxUsers: 25,
      aiAnalysis: 'advanced',
      support: 'priority'
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    price: null, // Custom pricing
    interval: 'month',
    features: {
      maxSKUs: -1, // Unlimited
      maxWarehouses: -1,
      maxUsers: -1,
      aiAnalysis: 'custom',
      support: '24/7'
    }
  }
};

export class BillingService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Create a Stripe customer for a company
   */
  async createCustomer(company, user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: {
          companyId: company.id,
          userId: user.id
        }
      });

      // Store Stripe customer ID
      await this.prisma.company.update({
        where: { id: company.id },
        data: {
          settings: {
            ...(company.settings || {}),
            stripeCustomerId: customer.id
          }
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Get or create Stripe customer
   */
  async getOrCreateCustomer(companyId) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          where: { role: 'ADMIN' },
          take: 1
        }
      }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const stripeCustomerId = company.settings?.stripeCustomerId;

    if (stripeCustomerId) {
      try {
        return await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        // Customer may have been deleted, create new one
      }
    }

    return this.createCustomer(company, company.users[0]);
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(companyId, planId, successUrl, cancelUrl) {
    const customer = await this.getOrCreateCustomer(companyId);
    const plan = PLANS[planId.toUpperCase()];

    if (!plan || !plan.stripePriceId) {
      throw new Error('Invalid plan');
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          companyId,
          planId: plan.id
        }
      },
      metadata: {
        companyId,
        planId: plan.id
      }
    });

    return session;
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(companyId, returnUrl) {
    const customer = await this.getOrCreateCustomer(companyId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl
    });

    return session;
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(companyId) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const stripeCustomerId = company.settings?.stripeCustomerId;

    if (!stripeCustomerId) {
      return {
        status: 'trial',
        plan: 'STARTER',
        trialEndsAt: company.createdAt
          ? new Date(new Date(company.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000)
          : null,
        features: PLANS.STARTER.features
      };
    }

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return {
          status: 'expired',
          plan: null,
          features: null
        };
      }

      const subscription = subscriptions.data[0];
      const planId = subscription.metadata?.planId || 'starter';
      const plan = PLANS[planId.toUpperCase()] || PLANS.STARTER;

      return {
        status: subscription.status,
        plan: plan.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        features: plan.features
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      return {
        status: 'error',
        plan: null,
        features: PLANS.STARTER.features
      };
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const companyId = session.metadata?.companyId;
        const planId = session.metadata?.planId;

        if (companyId && planId) {
          await this.prisma.company.update({
            where: { id: companyId },
            data: {
              settings: {
                plan: planId,
                subscriptionStatus: 'active',
                stripeSubscriptionId: session.subscription
              }
            }
          });

          // Log the event
          await this.prisma.auditLog.create({
            data: {
              companyId,
              action: 'SUBSCRIPTION_CREATED',
              entityType: 'COMPANY',
              entityId: companyId,
              details: { planId, sessionId: session.id }
            }
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const companyId = subscription.metadata?.companyId;

        if (companyId) {
          await this.prisma.company.update({
            where: { id: companyId },
            data: {
              settings: {
                subscriptionStatus: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              }
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const companyId = subscription.metadata?.companyId;

        if (companyId) {
          await this.prisma.company.update({
            where: { id: companyId },
            data: {
              settings: {
                subscriptionStatus: 'canceled',
                plan: null
              }
            }
          });

          await this.prisma.auditLog.create({
            data: {
              companyId,
              action: 'SUBSCRIPTION_CANCELED',
              entityType: 'COMPANY',
              entityId: companyId,
              details: { subscriptionId: subscription.id }
            }
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        // Handle failed payment - notify user, retry logic, etc.
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }
    }
  }
}

export default BillingService;
