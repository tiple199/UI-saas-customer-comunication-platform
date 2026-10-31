import { apiClient } from './client';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '../types/api';

export const authApi = {
  login: async (payload: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', payload);
    return response.data;
  },

  register: async (payload: RegisterRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/api/v1/auth/register', payload);
    return response.data;
  },

  refresh: async (refreshToken?: string | null): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/refresh', {
      refreshToken: refreshToken || localStorage.getItem('refresh_token') || null,
    });
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/api/v1/auth/me');
    return response.data;
  },

  logout: async (refreshToken?: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/v1/auth/logout', {
      refreshToken: refreshToken || localStorage.getItem('refresh_token') || null,
    });
    return response.data;
  },
};
