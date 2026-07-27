import { apiClient } from '@/lib/api-client'
import type { Invoice } from '@/types/api'

export const invoicesApi = {
  findOne: (id: string) => apiClient.get<Invoice>(`/invoices/${id}`).then((r) => r.data),
  findByAppointment: (appointmentId: string) =>
    apiClient.get<Invoice>(`/invoices/by-appointment/${appointmentId}`).then((r) => r.data),
}
