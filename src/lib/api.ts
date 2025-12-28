const API_BASE = '/api'

interface ApiResponse<T = unknown> {
  data: T
  ok: boolean
  status: number
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('flowlogic_token')
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`
  const token = getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'FlowLogic', // CSRF protection header
  }

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  })

  // Handle 401 - redirect to login
  if (response.status === 401) {
    localStorage.removeItem('flowlogic_token')
    localStorage.removeItem('flowlogic_user')
    window.location.href = '/login'
  }

  const data = await response.json()

  return {
    data,
    ok: response.ok,
    status: response.status,
  }
}

const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}

export default api
