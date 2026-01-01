import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'

// ============================================
// FLOWLOGIC DEBUG LOGGING - BUILD INFO
// ============================================
const BUILD_VERSION = 'v2.1.0-shadcn-upgrade'
const BUILD_TIMESTAMP = new Date().toISOString()

console.log('%c╔═══════════════════════════════════════════════════════════╗', 'color: #8b5cf6; font-weight: bold;')
console.log('%c║       FLOWLOGIC UI - DEBUG MODE ENABLED                   ║', 'color: #8b5cf6; font-weight: bold;')
console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #8b5cf6; font-weight: bold;')
console.log('%c[INIT] Build Version: ' + BUILD_VERSION, 'color: #10b981; font-weight: bold;')
console.log('%c[INIT] Build Timestamp: ' + BUILD_TIMESTAMP, 'color: #10b981;')
console.log('%c[INIT] User Agent: ' + navigator.userAgent, 'color: #6b7280;')
console.log('%c[INIT] Window Size: ' + window.innerWidth + 'x' + window.innerHeight, 'color: #6b7280;')

// Log CSS loading
console.log('%c[CSS] Checking stylesheets...', 'color: #3b82f6;')
document.querySelectorAll('link[rel="stylesheet"]').forEach((link, i) => {
  const href = (link as HTMLLinkElement).href
  console.log('%c[CSS] Stylesheet ' + i + ': ' + href, 'color: #3b82f6;')
})

// Log computed styles on root
setTimeout(() => {
  const root = document.documentElement
  const styles = getComputedStyle(root)
  console.log('%c[CSS] Root CSS Variables:', 'color: #f59e0b; font-weight: bold;')
  console.log('  --primary:', styles.getPropertyValue('--primary') || 'NOT SET')
  console.log('  --background:', styles.getPropertyValue('--background') || 'NOT SET')
  console.log('  --foreground:', styles.getPropertyValue('--foreground') || 'NOT SET')
}, 100)

// Expose debug info globally
;(window as unknown as Record<string, unknown>).FLOWLOGIC_DEBUG = {
  version: BUILD_VERSION,
  timestamp: BUILD_TIMESTAMP,
  checkStyles: () => {
    const root = document.documentElement
    const styles = getComputedStyle(root)
    return {
      primary: styles.getPropertyValue('--primary'),
      background: styles.getPropertyValue('--background'),
      foreground: styles.getPropertyValue('--foreground'),
    }
  },
  listStylesheets: () => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => (l as HTMLLinkElement).href)
  }
}

console.log('%c[INIT] Debug helpers available at window.FLOWLOGIC_DEBUG', 'color: #8b5cf6;')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
