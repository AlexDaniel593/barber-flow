import { apiClient } from '@/lib/api-client'
import type { Stylist } from '@/types/api'

export const stylistsApi = {
  findAll: () => apiClient.get<Stylist[]>('/stylists').then((r) => r.data),
  findOne: (id: string) => apiClient.get<Stylist>(`/stylists/${id}`).then((r) => r.data),
}
