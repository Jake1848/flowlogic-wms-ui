import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

// Types
export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER' | 'RECEIVER' | 'SHIPPER' | 'VIEWER'
  company: {
    id: string
    code: string
    name: string
  }
  warehouses: {
    id: string
    code: string
    name: string
    isDefault: boolean
  }[]
  defaultWarehouseId?: string
  lastLoginAt?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  refreshToken: () => Promise<void>
  clearError: () => void
}

export interface RegisterData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
}

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001')
const TOKEN_KEY = 'flowlogic_token'
const USER_KEY = 'flowlogic_user'

// Create context
const AuthContext = createContext<AuthContextValue | null>(null)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Login
  const login = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed')
      }

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))

      setState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }))
      throw error
    }
  }, [])

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    // Optionally notify server
    const token = state.token
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignore errors on logout
      })
    }

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  }, [state.token])

  // Register
  const register = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Registration failed')
      }

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))

      setState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }))
      throw error
    }
  }, [])

  // Refresh token
  const refreshToken = useCallback(async () => {
    if (!state.token) return

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
      })

      if (!response.ok) {
        // Token expired or invalid, logout
        logout()
        return
      }

      const data = await response.json()
      localStorage.setItem(TOKEN_KEY, data.token)

      setState(prev => ({
        ...prev,
        token: data.token,
      }))
    } catch {
      // Token refresh failed, logout
      logout()
    }
  }, [state.token, logout])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    register,
    refreshToken,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Get token for API calls (can be used outside React components)
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// Helper to create authenticated fetch headers
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return token
    ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}
