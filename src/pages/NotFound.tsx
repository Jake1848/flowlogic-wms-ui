import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[150px] font-bold text-white/5 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8 text-lg">
          Looks like this inventory location doesn't exist.
          The page you're looking for may have been moved or deleted.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-12 text-gray-500 text-sm">
          Need help? <Link to="/login" className="text-purple-400 hover:text-purple-300">Contact Support</Link>
        </p>
      </div>
    </div>
  )
}
