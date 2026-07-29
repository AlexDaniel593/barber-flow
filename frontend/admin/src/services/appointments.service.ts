import { apiClient } from '@/lib/api-client'
import type { Appointment, AppointmentStatus } from '@/types/api'

export interface FindAppointmentsFilters {
  status?: AppointmentStatus
  stylistId?: string
  date?: string
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

export const appointmentsApi = {
  findAll: (filters: FindAppointmentsFilters = {}) =>
    apiClient.get<Appointment[]>('/appointments', { params: filters }).then((r) => r.data),

  create: (dto: CreateAppointmentInput) =>
    apiClient.post<Appointment>('/appointments', dto).then((r) => r.data),

  findOne: (id: string) => apiClient.get<Appointment>(`/appointments/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: AppointmentStatus, notes?: string) =>
    apiClient
      .patch<Appointment>(`/appointments/${id}/status`, { id, status, notes })
      .then((r) => r.data),

  getByStylist: (stylistId: string, date?: string) =>
    apiClient
      .get<Appointment[]>(`/appointments/by-stylist/${stylistId}`, { params: { date } })
      .then((r) => r.data),
}
