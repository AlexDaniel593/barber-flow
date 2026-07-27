import { apiClient } from '@/lib/api-client'
import type { Service } from '@/types/api'

export type CreateServiceInput = Omit<Service, 'id'>
export type UpdateServiceInput = Partial<CreateServiceInput>

export const servicesApi = {
  findAll: () => apiClient.get<Service[]>('/services').then((r) => r.data),
  findOne: (id: string) => apiClient.get<Service>(`/services/${id}`).then((r) => r.data),
  create: (dto: CreateServiceInput) =>
    apiClient.post<Service>('/services', dto).then((r) => r.data),
  update: (id: string, dto: UpdateServiceInput) =>
    apiClient.put<Service>(`/services/${id}`, dto).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/services/${id}`).then((r) => r.data),
}
