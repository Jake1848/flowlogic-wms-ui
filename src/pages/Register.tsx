/**
 * FlowLogic Registration Page
 *
 * Self-service signup for new customers
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companySize: '',
    role: '',
    acceptTerms: false
  });

  const companySizes = [
    { value: 'small', label: '1-10 employees' },
    { value: 'medium', label: '11-50 employees' },
    { value: 'large', label: '51-200 employees' },
    { value: 'enterprise', label: '200+ employees' }
  ];

  const roles = [
    { value: 'analyst', label: 'Inventory Analyst' },
    { value: 'manager', label: 'Operations Manager' },
    { value: 'director', label: 'DC Director' },
    { value: 'executive', label: 'Executive/C-Level' },
    { value: 'it', label: 'IT/Systems' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.companyName) {
      setError('Please enter your company name');
      return false;
    }
    if (!formData.companySize) {
      setError('Please select your company size');
      return false;
    }
    if (!formData.role) {
      setError('Please select your role');
      return false;
    }
    if (!formData.acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }

    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          companySize: formData.companySize,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Auto-login: store token and redirect to dashboard
      localStorage.setItem('flowlogic_token', data.token);
      localStorage.setItem('flowlogic_user', JSON.stringify(data.user));
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    '14-day free trial',
    'No credit card required',
    'Full access to all features',
    'Cancel anytime'
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/flowlogic_refined_logo_v2.png"
              alt="FlowLogic"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="text-2xl font-bold text-white">FlowLogic</span>
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Start finding inventory issues in minutes
            </h2>
            <p className="text-white/80">
              Join warehouses saving $200K+ annually with AI-powered inventory intelligence.
            </p>
          </div>

          <ul className="space-y-4">
            {benefits.map((benefit, i) => (
              <motion.li
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 text-white"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                {benefit}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="text-white/60 text-sm">
          &copy; {new Date().getFullYear()} FlowLogic. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img
              src="/assets/flowlogic_refined_logo_v2.png"
              alt="FlowLogic"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="text-2xl font-bold text-white">FlowLogic</span>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-500' : 'bg-slate-700'
              }`}>
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm hidden sm:inline">Account</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-500' : 'bg-slate-700'
              }`}>
                2
              </div>
              <span className="text-sm hidden sm:inline">Company</span>
            </div>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              {step === 1 ? 'Create your account' : 'Tell us about your company'}
            </h1>
            <p className="text-slate-400 text-center mb-8">
              {step === 1
                ? 'Start your 14-day free trial'
                : 'Help us customize your experience'}
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="John"
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@company.com"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Your company name"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Company Size</label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="" className="bg-slate-900">Select size</option>
                      {companySizes.map(size => (
                        <option key={size.value} value={size.value} className="bg-slate-900">
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Your Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="" className="bg-slate-900">Select role</option>
                      {roles.map(role => (
                        <option key={role.value} value={role.value} className="bg-slate-900">
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-slate-400">
                      I agree to the{' '}
                      <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {step === 1 ? 'Continue' : 'Create Account'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          <p className="text-center text-slate-400 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
