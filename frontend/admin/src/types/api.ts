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

export interface InventoryItem {
  id: string
  name: string
  category: string
  sku: string
  quantity: number
  reserved?: number
  minStock: number
  unit: string
  pricePerUnit?: number
  isActive?: boolean
  serviceId?: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  appointmentId: string
  stylistId: string
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'card' | 'transfer'
  paidAt?: string
  createdAt?: string
  items: InvoiceItem[]
}
