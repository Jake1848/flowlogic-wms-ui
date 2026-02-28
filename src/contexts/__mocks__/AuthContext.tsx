import { createContext, useContext, type ReactNode } from 'react'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'PICKER' | 'PACKER' | 'RECEIVER' | 'SHIPPER' | 'VIEWER'
  company: { id: string; code: string; name: string }
  warehouses: { id: string; code: string; name: string; isDefault: boolean }[]
  defaultWarehouseId?: string
  lastLoginAt?: string
}

const mockUser: User = {
  id: '1',
  username: 'admin',
  email: 'admin@flowlogic.ai',
  firstName: 'Admin',
  lastName: 'User',
  fullName: 'Admin User',
  role: 'ADMIN',
  company: { id: '1', code: 'DEMO', name: 'Demo Company' },
  warehouses: [{ id: '1', code: 'WH1', name: 'Main Warehouse', isDefault: true }],
}

const mockAuthValue = {
  user: mockUser,
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  refreshToken: async () => {},
  clearError: () => {},
}

const AuthContext = createContext(mockAuthValue)

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function getAuthToken(): string | null {
  return 'mock-token'
}

export function getAuthHeaders(): HeadersInit {
  return { Authorization: 'Bearer mock-token' }
}
