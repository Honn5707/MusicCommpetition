import { apiRequest } from './client.ts'
import type { LoginRequest, LoginResponse } from '../types/api.ts'

export function login(request: LoginRequest) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: request,
  })
}
