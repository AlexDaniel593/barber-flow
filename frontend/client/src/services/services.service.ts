import { apiClient } from '@/lib/api-client'
import type { Service } from '@/types/api'

export const servicesApi = {
  findAll: () => apiClient.get<Service[]>('/services').then((r) => r.data),
  findOne: (id: string) => apiClient.get<Service>(`/services/${id}`).then((r) => r.data),
  findByStylist: (stylistId: string) =>
    apiClient.get<Service[]>(`/services/stylist/${stylistId}`).then((r) => r.data),
}
