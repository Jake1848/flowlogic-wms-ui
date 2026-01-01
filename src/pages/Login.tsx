import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Loader2, AlertCircle, Brain, Sparkles, Shield, Zap, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// ============================================
// LOGIN PAGE DEBUG LOGGING
// ============================================
console.log('%c[Login.tsx] Module loaded - MODERN SPLIT-SCREEN VERSION', 'color: #8b5cf6; font-weight: bold; font-size: 16px;')

export default function Login() {
  // DEBUG: Log render
  console.log('%c[Login] Component rendering...', 'color: #ec4899; font-weight: bold;')

  useEffect(() => {
    console.log('%c[Login] MOUNTED - Checking visual elements...', 'color: #10b981; font-weight: bold;')

    // Check for gradient elements
    const gradients = document.querySelectorAll('[class*="gradient"]')
    console.log('%c[Login] Found ' + gradients.length + ' gradient elements', 'color: #3b82f6;')

    // Check for the split-screen layout
    const leftPanel = document.querySelector('[class*="lg:w-1/2"][class*="bg-gradient"]')
    console.log('%c[Login] Left panel (gradient bg):', 'color: #f59e0b;', leftPanel ? 'FOUND' : 'NOT FOUND')

    // Check for animated blur elements
    const blurElements = document.querySelectorAll('[class*="blur-3xl"]')
    console.log('%c[Login] Found ' + blurElements.length + ' blur-3xl animated elements', 'color: #8b5cf6;')

    // Check for feature cards
    const featureCards = document.querySelectorAll('[class*="backdrop-blur"]')
    console.log('%c[Login] Found ' + featureCards.length + ' backdrop-blur feature cards', 'color: #10b981;')

    // Log body/main classes
    const main = document.querySelector('main')
    if (main) {
      console.log('%c[Login] Main element classes:', 'color: #6b7280;', main.className)
    }

    // Check the form container
    const formContainer = document.querySelector('[class*="rounded-2xl"][class*="shadow-xl"]')
    console.log('%c[Login] Form container:', 'color: #f59e0b;', formContainer ? 'FOUND with modern styling' : 'NOT FOUND')

    return () => console.log('%c[Login] UNMOUNTED', 'color: #ef4444;')
  }, [])
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Get the page they were trying to access
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch {
      // Error is handled by the context
    }
  }

  return (
    <main className="min-h-screen flex" role="main">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl shadow-purple-500/30">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 p-1 bg-emerald-500 rounded-full border-2 border-slate-900">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">FlowLogic</h1>
                <p className="text-purple-300 text-sm">AI Intelligence Platform</p>
              </div>
            </div>

            {/* Hero text */}
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Transform your<br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  warehouse operations
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-md">
                Leverage AI-powered analytics, real-time anomaly detection, and predictive forecasting to optimize your supply chain.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2.5 rounded-lg bg-blue-500/20">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Predictive Analytics</h3>
                  <p className="text-sm text-gray-400">AI-powered demand forecasting</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2.5 rounded-lg bg-purple-500/20">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Real-time Detection</h3>
                  <p className="text-sm text-gray-400">Instant anomaly identification</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2.5 rounded-lg bg-emerald-500/20">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Enterprise Security</h3>
                  <p className="text-sm text-gray-400">SOC 2 compliant infrastructure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl shadow-purple-500/30">
                  <Brain className="w-10 h-10 text-white" aria-hidden="true" />
                </div>
                <div className="absolute -top-2 -right-2 p-1 bg-emerald-500 rounded-full">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">FlowLogic</h1>
            <p className="text-gray-500 dark:text-gray-400">AI Intelligence Platform</p>
          </div>

          {/* Welcome text */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-8">
            <form className="space-y-6" onSubmit={handleSubmit} aria-label="Login form">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800" role="alert" aria-live="assertive">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username or Email
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3.5 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm
                           bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all"
                  placeholder="Enter your username"
                  aria-required="true"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm
                           bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all"
                  placeholder="Enter your password"
                  aria-required="true"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl
                         text-base font-semibold text-white
                         bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
                         hover:from-blue-700 hover:via-purple-700 hover:to-pink-700
                         shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                         overflow-hidden group"
                aria-busy={isLoading}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" aria-hidden="true" />
                    <span>Sign in</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Demo:</span>
                <code className="px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-800 font-mono text-xs text-purple-600 dark:text-purple-400">admin</code>
                <span>/</span>
                <code className="px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-800 font-mono text-xs text-purple-600 dark:text-purple-400">admin123</code>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-600">
            FlowLogic AI Intelligence Platform v2.0.0
          </p>
        </div>
      </div>
    </main>
  )
}
