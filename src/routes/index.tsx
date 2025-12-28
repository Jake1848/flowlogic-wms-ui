import { lazy, Suspense, type FC, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
  </div>
)

// Lazy load Login page separately (public route)
const Login = lazy(() => import('../pages/Login'))
const Setup = lazy(() => import('../pages/Setup'))

// AI Intelligence Platform pages
const IntelligenceDashboard = lazy(() => import('../pages/IntelligenceDashboard'))
const Alerts = lazy(() => import('../pages/Alerts'))
const Reports = lazy(() => import('../pages/Reports'))
const DemandForecasting = lazy(() => import('../pages/DemandForecasting'))
const CostAnalytics = lazy(() => import('../pages/CostAnalytics'))
const ProductivityMetrics = lazy(() => import('../pages/ProductivityMetrics'))
const SystemHealth = lazy(() => import('../pages/SystemHealth'))
const Integrations = lazy(() => import('../pages/Integrations'))
const Settings = lazy(() => import('../pages/Settings'))
const UserManagement = lazy(() => import('../pages/UserManagement'))
const AuditTrail = lazy(() => import('../pages/AuditTrail'))
const NotificationCenter = lazy(() => import('../pages/NotificationCenter'))

// Wrap lazy components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<FC>): ReactNode => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

// Public routes (no authentication required)
export const publicRoutes: RouteObject[] = [
  { path: '/login', element: withSuspense(Login) },
  { path: '/setup', element: withSuspense(Setup) },
]

// Protected routes (authentication required) - AI Intelligence Platform
export const protectedRoutes: RouteObject[] = [
  // Default route is Intelligence Dashboard
  { path: '/', element: withSuspense(IntelligenceDashboard) },
  { path: '/intelligence', element: withSuspense(IntelligenceDashboard) },

  // Alerts & Monitoring
  { path: '/alerts', element: withSuspense(Alerts) },
  { path: '/notifications', element: withSuspense(NotificationCenter) },

  // Analytics & Reports
  { path: '/reports', element: withSuspense(Reports) },
  { path: '/forecast', element: withSuspense(DemandForecasting) },
  { path: '/costanalytics', element: withSuspense(CostAnalytics) },
  { path: '/productivity', element: withSuspense(ProductivityMetrics) },

  // System
  { path: '/systemhealth', element: withSuspense(SystemHealth) },
  { path: '/integrations', element: withSuspense(Integrations) },
  { path: '/audit', element: withSuspense(AuditTrail) },

  // Admin
  { path: '/users', element: withSuspense(UserManagement) },
  { path: '/settings', element: withSuspense(Settings) },
]

// All routes combined (for backwards compatibility)
export const routes: RouteObject[] = [
  ...publicRoutes,
  ...protectedRoutes,
  // Catch-all route redirects to intelligence dashboard
  { path: '*', element: withSuspense(IntelligenceDashboard) },
]

// Page ID to path mapping for navigation
export const pageIdToPath: Record<string, string> = {
  intelligence: '/',
  alerts: '/alerts',
  notifications: '/notifications',
  reports: '/reports',
  forecast: '/forecast',
  costanalytics: '/costanalytics',
  productivity: '/productivity',
  systemhealth: '/systemhealth',
  integrations: '/integrations',
  audit: '/audit',
  users: '/users',
  settings: '/settings',
}

// Path to page ID mapping for determining current page from URL
export const pathToPageId: Record<string, string> = {
  '/': 'intelligence',
  '/intelligence': 'intelligence',
  '/alerts': 'alerts',
  '/notifications': 'notifications',
  '/reports': 'reports',
  '/forecast': 'forecast',
  '/costanalytics': 'costanalytics',
  '/productivity': 'productivity',
  '/systemhealth': 'systemhealth',
  '/integrations': 'integrations',
  '/audit': 'audit',
  '/users': 'users',
  '/settings': 'settings',
}
