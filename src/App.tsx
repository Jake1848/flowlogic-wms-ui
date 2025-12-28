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

// Layout for authenticated pages
function AuthenticatedLayout() {
  const { sidebarOpen, toggleSidebar } = useWMSStore()
  const location = useLocation()
  const routeElement = useRoutes(protectedRoutes)

  // Determine current page from URL path
  const currentPage = pathToPageId[location.pathname] || 'intelligence'

  // Close sidebar on route change for mobile
  useEffect(() => {
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
