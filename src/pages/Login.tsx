import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Loader2, AlertCircle, Boxes } from 'lucide-react'
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4" role="main">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
              <Boxes className="w-12 h-12 text-white" aria-hidden="true" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            FlowLogic WMS
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-10 shadow-xl rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit} aria-label="Login form">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg" role="alert" aria-live="assertive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
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
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter your username"
                aria-required="true"
              />
            </div>

            {/* Password Field */}
            <div>
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
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter your password"
                aria-required="true"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg
                       text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Demo credentials: admin / admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          FlowLogic Warehouse Management System
        </p>
      </div>
    </main>
  )
}
