import { apiClient } from '@/lib/api-client'
import type { Appointment, CreateAppointmentInput } from '@/types/api'

export const appointmentsApi = {
  getByClient: (clientEmail: string) =>
    apiClient.get<Appointment[]>(`/appointments/by-client/${encodeURIComponent(clientEmail)}`).then((r) => r.data),

  create: (dto: CreateAppointmentInput) =>
    apiClient.post<Appointment>('/appointments', dto).then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),

  getAvailableSlots: (stylistId: string, date: string, serviceId?: string) =>
    apiClient
      .get<string[]>('/appointments/available-slots', {
        params: { stylistId, date, serviceId },
      })
      .then((r) => r.data),
}
