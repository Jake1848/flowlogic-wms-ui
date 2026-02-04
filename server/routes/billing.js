/**
 * FlowLogic Billing Routes
 *
 * Stripe subscription management endpoints
 */

import { Router } from 'express';
import Stripe from 'stripe';
import { BillingService, PLANS } from '../services/billing.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
});

export default function billingRoutes(prisma) {
  const router = Router();
  const billingService = new BillingService(prisma);

  /**
   * Get available plans
   */
  router.get('/plans', (req, res) => {
    const plans = Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      features: plan.features
    }));

    res.json({ plans });
  });

  /**
   * Get current subscription status
   */
  router.get('/subscription', async (req, res) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company not found' });
      }

      const status = await billingService.getSubscriptionStatus(companyId);
      res.json(status);
    } catch (error) {
      console.error('Error getting subscription:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  /**
   * Create checkout session for new subscription
   */
  router.post('/checkout', async (req, res) => {
    try {
      const { planId } = req.body;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company not found' });
      }

      if (!planId) {
        return res.status(400).json({ error: 'Plan ID is required' });
      }

      const baseUrl = process.env.APP_URL || 'http://localhost:5173';
      const session = await billingService.createCheckoutSession(
        companyId,
        planId,
        `${baseUrl}/dashboard?checkout=success`,
        `${baseUrl}/dashboard?checkout=canceled`
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  /**
   * Create customer portal session for managing subscription
   */
  router.post('/portal', async (req, res) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company not found' });
      }

      const baseUrl = process.env.APP_URL || 'http://localhost:5173';
      const session = await billingService.createPortalSession(
        companyId,
        `${baseUrl}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  /**
   * Stripe webhook handler
   * This endpoint should NOT use authentication middleware
   * Uses express.raw() middleware configured in index.js for signature verification
   */
  router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (webhookSecret && sig) {
        // req.body is a Buffer when using express.raw() middleware
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // For development without webhook signature verification
        // Parse the raw body as JSON
        const payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
        event = payload;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await billingService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handling failed' });
    }
  });

  /**
   * Get usage stats for current billing period
   */
  router.get('/usage', async (req, res) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company not found' });
      }

      // Get current usage
      const [skuCount, warehouseCount, userCount] = await Promise.all([
        prisma.inventorySnapshot.groupBy({
          by: ['sku'],
          _count: true
        }).then(r => r.length),
        prisma.warehouse.count({ where: { companyId } }),
        prisma.user.count({ where: { companyId } })
      ]);

      // Get subscription to compare against limits
      const subscription = await billingService.getSubscriptionStatus(companyId);

      res.json({
        usage: {
          skus: skuCount,
          warehouses: warehouseCount,
          users: userCount
        },
        limits: subscription.features || PLANS.STARTER.features,
        plan: subscription.plan
      });
    } catch (error) {
      console.error('Error getting usage:', error);
      res.status(500).json({ error: 'Failed to get usage' });
    }
  });

  return router;
}
