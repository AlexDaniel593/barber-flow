import { apiClient } from '@/lib/api-client'
import type { Stylist } from '@/types/api'

export type CreateStylistInput = Omit<Stylist, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateStylistInput = Partial<CreateStylistInput>

export const stylistsApi = {
  findAll: () => apiClient.get<Stylist[]>('/stylists').then((r) => r.data),
  findOne: (id: string) => apiClient.get<Stylist>(`/stylists/${id}`).then((r) => r.data),
  create: (dto: CreateStylistInput) =>
    apiClient.post<Stylist>('/stylists', dto).then((r) => r.data),
  update: (id: string, dto: UpdateStylistInput) =>
    apiClient.put<Stylist>(`/stylists/${id}`, dto).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/stylists/${id}`).then((r) => r.data),
}
