import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import { GlassCard } from '../components/ui/glass-card'
import { useAuth } from '../contexts/AuthContext'

export default function ModernLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
      console.log('[ModernLogin] Login successful, navigating to /intelligence')
      navigate('/intelligence')
    } catch (err: unknown) {
      const error = err as Error
      console.log('[ModernLogin] Login failed:', error.message)
      setError(error.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-dark-100 to-dark-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-pink/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-purple to-accent-pink rounded-2xl blur-2xl opacity-50 animate-pulse" />
              <img
                src="/assets/flowlogic_refined_logo_v2.png"
                alt="FlowLogic"
                className="relative w-20 h-20 rounded-2xl object-cover shadow-neon animate-float"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent mb-2">
            FlowLogic AI
          </h1>
          <p className="text-white/60">Intelligence Platform for Modern Warehouses</p>
        </div>

        {/* Login Card */}
        <GlassCard variant="gradient" className="overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Welcome Back</h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Email or Username</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/50 to-accent-pink/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-5 h-5 text-white/40 group-focus-within:text-accent-purple transition-colors" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-accent-purple/50 transition-all"
                      placeholder="admin@flowlogic.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/50 to-accent-pink/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 w-5 h-5 text-white/40 group-focus-within:text-accent-purple transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-accent-purple/50 transition-all"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-purple focus:ring-accent-purple focus:ring-offset-0" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-accent-purple hover:text-accent-pink transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full px-6 py-3 bg-gradient-to-r from-accent-purple to-accent-pink rounded-xl font-semibold text-white shadow-neon hover:shadow-[0_0_30px_rgba(139,92,246,0.8)] transition-all duration-300 disabled:opacity-50 overflow-hidden"
              >
                <div className="relative flex items-center justify-center gap-2 z-10">
                  <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                  {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </div>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-white/5 border-t border-white/10">
            <p className="text-center text-sm text-white/60">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent-purple hover:text-accent-pink transition-colors font-medium">
                Start free trial
              </Link>
            </p>
          </div>
        </GlassCard>

        {/* Bottom Info */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            Powered by Advanced AI | Enterprise Security | 24/7 Support
          </p>
        </div>
      </div>
    </div>
  )
}
