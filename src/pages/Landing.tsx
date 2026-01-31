/**
 * FlowLogic Landing Page
 *
 * Marketing page for attracting and converting customers
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  Package,
  DollarSign,
  Clock,
  Menu,
  X
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning detects inventory discrepancies before they become costly problems.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: AlertTriangle,
      title: 'Root Cause Detection',
      description: 'Automatically identify WHY discrepancies occur - from LP fragmentation to receipt posting failures.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: TrendingUp,
      title: 'Pattern Recognition',
      description: 'Identify behavioral patterns, temporal trends, and location-SKU correlations across your operations.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Shield,
      title: 'Order Integrity',
      description: 'Track every order from creation to shipment. Detect double BOM, overpicks, and underpicks.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Real-Time Alerts',
      description: 'Get instant notifications when anomalies are detected. Stop problems before they spread.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: BarChart3,
      title: 'Executive Reports',
      description: 'Auto-generated reports with financial impact analysis for leadership and stakeholders.',
      color: 'from-violet-500 to-purple-500'
    }
  ];

  const stats = [
    { value: '$200K+', label: 'Avg. yearly savings per DC', icon: DollarSign },
    { value: '15min', label: 'Setup time', icon: Clock },
    { value: '99.9%', label: 'Uptime SLA', icon: Shield },
    { value: '50+', label: 'Detection patterns', icon: Brain }
  ];

  const testimonials = [
    {
      quote: "FlowLogic found $180K in inventory discrepancies in our first month. The LP fragmentation detection alone saved us from adding more FWRD locations.",
      author: "Jake K.",
      role: "Inventory Analyst",
      company: "Major Distribution Center"
    },
    {
      quote: "We were making adjustments blindly. Now we know exactly why our inventory is off and can fix the root cause instead of just the symptoms.",
      author: "Sarah M.",
      role: "Operations Manager",
      company: "3PL Provider"
    },
    {
      quote: "The AI found patterns our team had been missing for years. Double BOM consumption was costing us thousands monthly.",
      author: "Mike R.",
      role: "DC Director",
      company: "E-commerce Fulfillment"
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 499,
      description: 'For small warehouses getting started with AI',
      features: [
        'Up to 10,000 SKUs',
        '1 warehouse',
        'Basic discrepancy detection',
        'Email alerts',
        'Standard support'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: 1499,
      description: 'For growing operations needing advanced insights',
      features: [
        'Up to 100,000 SKUs',
        'Up to 5 warehouses',
        'Advanced root cause analysis',
        'FWRD LP fragmentation detection',
        'Order integrity monitoring',
        'Custom integrations',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: null,
      description: 'For large networks with custom requirements',
      features: [
        'Unlimited SKUs',
        'Unlimited warehouses',
        'Custom AI models',
        'Dedicated success manager',
        'On-premise deployment option',
        'Custom SLA',
        '24/7 support'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img
                src="/assets/flowlogic_refined_logo_v2.png"
                alt="FlowLogic"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold">FlowLogic</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
              <a href="#integrations" className="text-slate-400 hover:text-white transition-colors">Integrations</a>
              <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
              <Link to="/login" className="text-slate-400 hover:text-white transition-colors">Sign In</Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-slate-900 border-b border-white/10"
          >
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-slate-400 hover:text-white">Features</a>
              <a href="#integrations" className="block text-slate-400 hover:text-white">Integrations</a>
              <a href="#pricing" className="block text-slate-400 hover:text-white">Pricing</a>
              <Link to="/login" className="block text-slate-400 hover:text-white">Sign In</Link>
              <Link
                to="/register"
                className="block w-full text-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600"
              >
                Start Free Trial
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Hero Logo */}
            <div className="mb-8">
              <img
                src="/assets/FlowLogicLogoNoText.png"
                alt="FlowLogic"
                className="w-40 h-40 sm:w-48 sm:h-48 mx-auto object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>AI-Powered Warehouse Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Stop Losing Money to
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Inventory Discrepancies
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10">
              FlowLogic's AI analyzes your WMS data to find the <strong className="text-white">root cause</strong> of
              inventory issues. From LP fragmentation to receipt posting failures - we find what others miss.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all font-semibold text-lg flex items-center justify-center gap-2 group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => navigate('/demo')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-semibold text-lg flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Your WMS Is Hiding
                <br />
                <span className="text-red-400">Millions in Losses</span>
              </h2>
              <div className="space-y-4 text-slate-400">
                <p>
                  Most warehouses make <strong className="text-white">$200K+ in yearly adjustments</strong> to
                  correct inventory discrepancies they don't understand.
                </p>
                <p>
                  The problem isn't your team - it's your WMS. Systems like Infor treat
                  FWRD locations as reserves, preventing LP merging. Each plate gets
                  reduced independently, creating discrepancies.
                </p>
                <p>
                  <strong className="text-white">FlowLogic finds these patterns.</strong> We analyze every
                  transaction, every location, every LP - and show you exactly where
                  the problems are.
                </p>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
              <div className="text-sm text-slate-500 mb-4">REAL EXAMPLE: FWRD LP Fragmentation</div>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">Location:</span>
                  <span className="text-amber-400">FWRD-A-01</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4" />
                  <span className="text-slate-400">SKU:</span>
                  <span className="text-white">WIDGET-123</span>
                </div>
                <div className="border-l-2 border-red-500/50 pl-4 ml-2 space-y-2">
                  <div className="text-slate-300">LP-001: 50 units</div>
                  <div className="text-slate-300">LP-002: 30 units</div>
                  <div className="text-slate-300">LP-003: 25 units</div>
                  <div className="text-slate-300">LP-004: 20 units</div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <div className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    4 plates = 4x BOH reduction risk
                  </div>
                  <div className="text-emerald-400 text-xs mt-1">
                    FlowLogic recommends: MERGE to single LP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Fix Inventory Forever
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              AI-powered analysis that finds issues humans can't see.
              From pattern recognition to root cause analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Connects to Your WMS in Minutes
          </h2>
          <p className="text-slate-400 mb-12">
            Native integrations with major WMS platforms. Custom API support for everything else.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {['SAP EWM', 'Manhattan', 'Blue Yonder', 'Oracle WMS', 'Infor WMS', 'Custom API'].map((name) => (
              <div
                key={name}
                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <span className="text-lg font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Trusted by Warehouse Professionals
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.author}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-400">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`p-6 rounded-2xl border ${
                  plan.popular
                    ? 'bg-gradient-to-b from-blue-500/10 to-purple-500/10 border-blue-500/30'
                    : 'bg-white/5 border-white/10'
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price ? (
                    <>
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-slate-400">/month</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">Custom Pricing</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.price ? '/register' : '/contact'}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Stop Losing Money?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join warehouses saving $200K+ annually with AI-powered inventory intelligence.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all font-semibold text-lg group"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-slate-500 mt-4">
            No credit card required. 14-day free trial.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/assets/flowlogic_refined_logo_v2.png"
                  alt="FlowLogic"
                  className="w-8 h-8 rounded-lg object-contain"
                />
                <span className="text-xl font-bold">FlowLogic</span>
              </div>
              <p className="text-sm text-slate-400">
                AI-powered warehouse intelligence for modern supply chains.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#integrations" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/demo" className="hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} FlowLogic. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
