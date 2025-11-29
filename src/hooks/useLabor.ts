import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'
import type { PaginatedResponse } from './useInventory'

// Types
export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  department: 'RECEIVING' | 'PICKING' | 'PACKING' | 'SHIPPING' | 'INVENTORY' | 'MANAGEMENT'
  role: string
  shift: 'DAY' | 'EVENING' | 'NIGHT'
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
  hireDate: string
  skills: string[]
  certifications: string[]
}

export interface TimeEntry {
  id: string
  employeeId: string
  employeeName: string
  date: string
  clockIn: string
  clockOut?: string
  breakMinutes: number
  hoursWorked: number
  status: 'CLOCKED_IN' | 'CLOCKED_OUT' | 'ON_BREAK'
  taskAssignments: TaskAssignment[]
}

export interface TaskAssignment {
  id: string
  taskType: 'PICKING' | 'PACKING' | 'RECEIVING' | 'PUTAWAY' | 'REPLENISHMENT' | 'CYCLE_COUNT' | 'LOADING'
  startTime: string
  endTime?: string
  unitsProcessed: number
  linesProcessed: number
  zone?: string
  waveId?: string
}

export interface ProductivityMetric {
  employeeId: string
  employeeName: string
  department: string
  period: 'TODAY' | 'WEEK' | 'MONTH'
  unitsPerHour: number
  linesPerHour: number
  accuracy: number
  hoursWorked: number
  tasksCompleted: number
  rank?: number
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  employees: string[]
}

export interface LaborFilters {
  search?: string
  department?: string
  shift?: string
  status?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

// Query Keys
export const laborKeys = {
  all: ['labor'] as const,
  employees: () => [...laborKeys.all, 'employees'] as const,
  employeeList: (filters: LaborFilters) => [...laborKeys.employees(), filters] as const,
  employee: (id: string) => [...laborKeys.employees(), id] as const,
  timeEntries: () => [...laborKeys.all, 'timeEntries'] as const,
  timeEntryList: (filters: LaborFilters) => [...laborKeys.timeEntries(), filters] as const,
  productivity: () => [...laborKeys.all, 'productivity'] as const,
  productivityList: (period: string, department?: string) => [...laborKeys.productivity(), period, department] as const,
  shifts: () => [...laborKeys.all, 'shifts'] as const,
  summary: () => [...laborKeys.all, 'summary'] as const,
}

// Fetch employee list
export function useEmployeeList(filters: LaborFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.department) queryParams.set('department', filters.department)
  if (filters.shift) queryParams.set('shift', filters.shift)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: laborKeys.employeeList(filters),
    queryFn: () =>
      apiFetch<PaginatedResponse<Employee>>(`/api/labor/employees?${queryParams.toString()}`),
  })
}

// Fetch single employee
export function useEmployee(id: string) {
  return useQuery({
    queryKey: laborKeys.employee(id),
    queryFn: () => apiFetch<Employee>(`/api/labor/employees/${id}`),
    enabled: !!id,
  })
}

// Fetch time entries
export function useTimeEntries(filters: LaborFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.fromDate) queryParams.set('fromDate', filters.fromDate)
  if (filters.toDate) queryParams.set('toDate', filters.toDate)
  if (filters.department) queryParams.set('department', filters.department)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: laborKeys.timeEntryList(filters),
    queryFn: () =>
      apiFetch<PaginatedResponse<TimeEntry>>(`/api/labor/time-entries?${queryParams.toString()}`),
  })
}

// Fetch productivity metrics
export function useProductivityMetrics(period: 'TODAY' | 'WEEK' | 'MONTH' = 'TODAY', department?: string) {
  const queryParams = new URLSearchParams()
  queryParams.set('period', period)
  if (department) queryParams.set('department', department)

  return useQuery({
    queryKey: laborKeys.productivityList(period, department),
    queryFn: () =>
      apiFetch<ProductivityMetric[]>(`/api/labor/productivity?${queryParams.toString()}`),
  })
}

// Fetch shifts
export function useShifts() {
  return useQuery({
    queryKey: laborKeys.shifts(),
    queryFn: () => apiFetch<Shift[]>('/api/labor/shifts'),
    staleTime: 1000 * 60 * 60, // 1 hour - shifts don't change often
  })
}

// Fetch labor summary
export function useLaborSummary() {
  return useQuery({
    queryKey: laborKeys.summary(),
    queryFn: () =>
      apiFetch<{
        activeEmployees: number
        clockedIn: number
        onBreak: number
        avgProductivity: number
        totalHoursToday: number
        overtimeHours: number
        absentToday: number
      }>('/api/labor/summary'),
  })
}

// Clock in mutation
export function useClockIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: string) =>
      apiFetch<{ success: boolean; timeEntryId: string }>(`/api/labor/employees/${employeeId}/clock-in`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries() })
      queryClient.invalidateQueries({ queryKey: laborKeys.summary() })
    },
  })
}

// Clock out mutation
export function useClockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: string) =>
      apiFetch<{ success: boolean; message: string }>(`/api/labor/employees/${employeeId}/clock-out`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries() })
      queryClient.invalidateQueries({ queryKey: laborKeys.summary() })
    },
  })
}

// Start break mutation
export function useStartBreak() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: string) =>
      apiFetch<{ success: boolean; message: string }>(`/api/labor/employees/${employeeId}/break/start`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries() })
      queryClient.invalidateQueries({ queryKey: laborKeys.summary() })
    },
  })
}

// End break mutation
export function useEndBreak() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: string) =>
      apiFetch<{ success: boolean; message: string }>(`/api/labor/employees/${employeeId}/break/end`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries() })
      queryClient.invalidateQueries({ queryKey: laborKeys.summary() })
    },
  })
}

// Assign task mutation
export function useAssignTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      employeeId,
      taskType,
      zone,
      waveId,
    }: {
      employeeId: string
      taskType: TaskAssignment['taskType']
      zone?: string
      waveId?: string
    }) =>
      apiFetch<{ success: boolean; taskId: string }>(`/api/labor/employees/${employeeId}/assign-task`, {
        method: 'POST',
        body: JSON.stringify({ taskType, zone, waveId }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: laborKeys.employee(variables.employeeId) })
      queryClient.invalidateQueries({ queryKey: laborKeys.timeEntries() })
    },
  })
}

// Update employee mutation
export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string
      data: Partial<Pick<Employee, 'department' | 'role' | 'shift' | 'status' | 'skills' | 'certifications'>>
    }) =>
      apiFetch<Employee>(`/api/labor/employees/${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: laborKeys.employee(variables.employeeId) })
      queryClient.invalidateQueries({ queryKey: laborKeys.employees() })
    },
  })
}
