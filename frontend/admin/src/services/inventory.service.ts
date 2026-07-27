import { apiClient } from '@/lib/api-client'
import type { InventoryItem } from '@/types/api'

export type CreateInventoryItemInput = Omit<InventoryItem, 'id' | 'reserved' | 'isActive'>
export type UpdateInventoryItemInput = Partial<CreateInventoryItemInput>

export interface FindInventoryFilters {
  category?: string
  lowStock?: boolean
}

export const inventoryApi = {
  findAll: (filters: FindInventoryFilters = {}) =>
    apiClient.get<InventoryItem[]>('/inventory', { params: filters }).then((r) => r.data),

  findOne: (id: string) => apiClient.get<InventoryItem>(`/inventory/${id}`).then((r) => r.data),

  create: (dto: CreateInventoryItemInput) =>
    apiClient.post<InventoryItem>('/inventory', dto).then((r) => r.data),

  update: (id: string, dto: UpdateInventoryItemInput) =>
    apiClient.put<InventoryItem>(`/inventory/${id}`, dto).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/inventory/${id}`).then((r) => r.data),

  adjustStock: (id: string, quantity: number, operation: 'add' | 'subtract', reason: string) =>
    apiClient
      .patch<InventoryItem>(`/inventory/${id}/adjust-stock`, { quantity, operation, reason })
      .then((r) => r.data),

  getLowStock: (threshold?: number) =>
    apiClient
      .get<InventoryItem[]>('/inventory/low-stock', { params: { threshold } })
      .then((r) => r.data),
}
