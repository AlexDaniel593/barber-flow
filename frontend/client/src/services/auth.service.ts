import { apiClient } from '@/lib/api-client'
import type { AuthUser, LoginResponse } from '@/types/api'

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  profile: () => apiClient.get<AuthUser>('/auth/profile').then((r) => r.data),
}
