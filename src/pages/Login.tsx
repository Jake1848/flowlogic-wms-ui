import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Loader2, AlertCircle, Brain, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8" role="main">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-2xl shadow-purple-500/30">
                <Brain className="w-12 h-12 text-white" aria-hidden="true" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-white">
            FlowLogic
          </h1>
          <p className="mt-2 text-sm sm:text-base text-purple-200">
            AI Intelligence Platform
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Sign in to access predictive analytics
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit} aria-label="Login form">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-300 bg-red-500/20 rounded-lg border border-red-500/30" role="alert" aria-live="assertive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-200">
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
                className="mt-1 block w-full px-4 py-3 border border-white/20 rounded-lg shadow-sm
                         bg-white/10 backdrop-blur text-white placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         transition-all"
                placeholder="Enter your username"
                aria-required="true"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200">
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
                className="mt-1 block w-full px-4 py-3 border border-white/20 rounded-lg shadow-sm
                         bg-white/10 backdrop-blur text-white placeholder-gray-400
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
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg
                       text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600
                       hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/30
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              aria-busy={isLoading}
            >
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
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-center text-gray-400">
              Demo credentials: <span className="text-purple-300 font-mono">admin</span> / <span className="text-purple-300 font-mono">admin123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          FlowLogic AI Intelligence Platform v1.0.0
        </p>
      </div>
    </main>
  )
}
