export type UserRole = 'admin' | 'client'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface LoginResponse {
  access_token: string
  user: AuthUser
}

export interface Stylist {
  id: string
  name: string
  email: string
  phone: string
  specialties?: string[]
  workingHours?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  category: string
  isActive?: boolean
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export interface Appointment {
  id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  stylistId: string
  serviceId: string
  startTime: string
  duration: number
  status: AppointmentStatus
  paid?: boolean
  notes?: string
  totalPrice?: number
  createdAt?: string
}

export interface CreateAppointmentInput {
  clientName: string
  clientPhone: string
  clientEmail?: string
  stylistId: string
  serviceId: string
  startTime: string
  duration: number
  notes?: string
  totalPrice?: number
}

export interface CancelAppointmentInput {
  id: string
  reason?: string
}
