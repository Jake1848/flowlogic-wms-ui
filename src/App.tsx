import { useRoutes, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import AIAssistant from './components/AIAssistant'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { useWMSStore } from './store/useWMSStore'
import { publicRoutes, protectedRoutes, pathToPageId } from './routes'
import { queryClient } from './lib/queryClient'

// ============================================
// DEBUG LOGGING UTILITY
// ============================================
const DEBUG_PREFIX = '%c[FlowLogic]'
const log = {
  info: (msg: string, ...args: unknown[]) => console.log(DEBUG_PREFIX + ' ' + msg, 'color: #3b82f6;', ...args),
  success: (msg: string, ...args: unknown[]) => console.log(DEBUG_PREFIX + ' ' + msg, 'color: #10b981;', ...args),
  warn: (msg: string, ...args: unknown[]) => console.log(DEBUG_PREFIX + ' ' + msg, 'color: #f59e0b;', ...args),
  error: (msg: string, ...args: unknown[]) => console.log(DEBUG_PREFIX + ' ' + msg, 'color: #ef4444;', ...args),
  component: (name: string, action: string, data?: unknown) => {
    console.log(`%c[Component: ${name}] ${action}`, 'color: #8b5cf6; font-weight: bold;', data || '')
  },
  render: (name: string, props?: unknown) => {
    console.log(`%c[RENDER] ${name}`, 'color: #ec4899; font-style: italic;', props || '')
  }
}

console.log('%c[App.tsx] Module loaded', 'color: #10b981; font-weight: bold;')

// Layout for authenticated pages
function AuthenticatedLayout() {
  const { sidebarOpen, toggleSidebar, darkMode } = useWMSStore()
  const location = useLocation()
  const routeElement = useRoutes(protectedRoutes)

  // Determine current page from URL path
  const currentPage = pathToPageId[location.pathname] || 'intelligence'

  // DEBUG: Log every render
  log.render('AuthenticatedLayout', {
    pathname: location.pathname,
    currentPage,
    sidebarOpen,
    darkMode
  })

  // DEBUG: Check dark mode class
  useEffect(() => {
    const isDarkClass = document.documentElement.classList.contains('dark')
    log.info('Dark mode check:', { darkMode, hasDarkClass: isDarkClass })

    // Log main container classes
    const mainEl = document.querySelector('main')
    if (mainEl) {
      log.info('Main element classes:', mainEl.className)
      const styles = getComputedStyle(mainEl)
      log.info('Main element computed bg:', styles.backgroundColor)
    }
  }, [darkMode])

  // Close sidebar on route change for mobile
  useEffect(() => {
    log.component('AuthenticatedLayout', 'Route changed to: ' + location.pathname)

    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        toggleSidebar()
      }
    }

    // Close sidebar on mobile when route changes
    if (window.innerWidth < 1024 && sidebarOpen) {
      toggleSidebar()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [location.pathname])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar currentPage={currentPage} />

      <div className={`
        flex-1 flex flex-col overflow-hidden transition-all duration-300
        ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}
        ml-0
      `}>
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
          {routeElement}
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}

// Main app content with conditional routing
function AppContent() {
  const location = useLocation()

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => route.path === location.pathname)

  // Render public routes without protection
  const publicRouteElement = useRoutes(publicRoutes)

  // If on a public route, just render it
  if (isPublicRoute) {
    return <>{publicRouteElement}</>
  }

  // For protected routes, wrap with ProtectedRoute
  return (
    <ProtectedRoute>
      <AuthenticatedLayout />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
