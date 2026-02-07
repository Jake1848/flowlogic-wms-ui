import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  Zap,
  Building2,
  Users,
  Package,
  Brain,
  Shield
} from 'lucide-react'
import api from '../lib/api'

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  features: {
    maxSKUs: number
    maxWarehouses: number
    maxUsers: number
    aiAnalysis: string
    support: string
  }
}

interface SubscriptionStatus {
  status: string
  plan: string
  trialEndsAt?: string
  currentPeriodEnd?: string
  features: {
    maxSKUs: number
    maxWarehouses: number
    maxUsers: number
    aiAnalysis: string
    support: string
  }
}

interface UsageData {
  usage: {
    skus: number
    warehouses: number
    users: number
  }
  limits: {
    maxSKUs: number
    maxWarehouses: number
    maxUsers: number
  }
  plan: string
}

export default function Billing() {
  const [selectedPlan] = useState<string | null>(null)

  // Fetch available plans
  const { data: plansData } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const response = await api.get<{ plans: Plan[] }>('/billing/plans')
      return response.data.plans
    }
  })

  // Fetch current subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await api.get<SubscriptionStatus>('/billing/subscription')
      return response.data
    }
  })

  // Fetch usage
  const { data: usageData } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: async () => {
      const response = await api.get<UsageData>('/billing/usage')
      return response.data
    }
  })

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await api.post<{ url: string }>('/billing/checkout', { planId })
      return response.data
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    }
  })

  // Portal mutation
  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ url: string }>('/billing/portal')
      return response.data
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    }
  })

  const plans: Plan[] = plansData || [
    {
      id: 'STARTER',
      name: 'Starter',
      price: 4.99,
      interval: 'month',
      features: { maxSKUs: 10000, maxWarehouses: 1, maxUsers: 5, aiAnalysis: 'basic', support: 'email' }
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: 14.99,
      interval: 'month',
      features: { maxSKUs: 100000, maxWarehouses: 5, maxUsers: 25, aiAnalysis: 'advanced', support: 'priority' }
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 0,
      interval: 'month',
      features: { maxSKUs: -1, maxWarehouses: -1, maxUsers: -1, aiAnalysis: 'full', support: '24/7' }
    }
  ]

  const getUsagePercent = (current: number, max: number) => {
    if (max === -1) return 0
    return Math.min(100, (current / max) * 100)
  }

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited'
    return value.toLocaleString()
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <CreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your plan and payment</p>
          </div>
        </div>
        {subscription?.status !== 'trial' && (
          <button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {portalMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Manage Subscription
          </button>
        )}
      </div>

      {/* Current Plan */}
      {subscriptionLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {subscription?.plan || 'Starter'}
                </span>
                {subscription?.status === 'trial' && (
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded-full">
                    Trial
                  </span>
                )}
                {subscription?.status === 'active' && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
            {subscription?.trialEndsAt && (
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Trial ends</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(subscription.trialEndsAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          {usageData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">SKUs</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {usageData.usage.skus.toLocaleString()} / {formatLimit(usageData.limits.maxSKUs)}
                </p>
                <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${getUsagePercent(usageData.usage.skus, usageData.limits.maxSKUs)}%` }}
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Warehouses</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {usageData.usage.warehouses} / {formatLimit(usageData.limits.maxWarehouses)}
                </p>
                <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${getUsagePercent(usageData.usage.warehouses, usageData.limits.maxWarehouses)}%` }}
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Users</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {usageData.usage.users} / {formatLimit(usageData.limits.maxUsers)}
                </p>
                <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${getUsagePercent(usageData.usage.users, usageData.limits.maxUsers)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.id
            const isPopular = plan.id === 'PROFESSIONAL'

            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 p-6 transition-all ${
                  isPopular
                    ? 'border-green-500 shadow-lg'
                    : selectedPlan === plan.id
                    ? 'border-blue-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-2">
                    {plan.price > 0 ? (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}
                        <span className="text-base font-normal text-gray-500">/mo</span>
                      </span>
                    ) : (
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">Custom</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Package className="w-4 h-4 text-green-500" />
                    {formatLimit(plan.features.maxSKUs)} SKUs
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Building2 className="w-4 h-4 text-green-500" />
                    {formatLimit(plan.features.maxWarehouses)} Warehouse{plan.features.maxWarehouses !== 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 text-green-500" />
                    {formatLimit(plan.features.maxUsers)} Users
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Brain className="w-4 h-4 text-green-500" />
                    {plan.features.aiAnalysis === 'basic' ? 'Basic' : plan.features.aiAnalysis === 'advanced' ? 'Advanced' : 'Full'} AI Analysis
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="w-4 h-4 text-green-500" />
                    {plan.features.support === 'email' ? 'Email' : plan.features.support === 'priority' ? 'Priority' : '24/7'} Support
                  </li>
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Current Plan
                  </button>
                ) : plan.id === 'ENTERPRISE' ? (
                  <a
                    href="mailto:sales@flowlogic.ai?subject=Enterprise%20Plan%20Inquiry"
                    className="w-full py-2 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <button
                    onClick={() => checkoutMutation.mutate(plan.id)}
                    disabled={checkoutMutation.isPending}
                    className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                      isPopular
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {subscription?.status === 'trial' ? 'Start Plan' : 'Upgrade'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Can I cancel anytime?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">What happens if I exceed my limits?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              We'll notify you when you're approaching your limits. You can upgrade your plan anytime to increase your capacity.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Do you offer a free trial?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Yes! All new accounts start with a 14-day free trial of the Starter plan. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
