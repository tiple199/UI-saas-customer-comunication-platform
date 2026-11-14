import { apiClient } from './client';
import type {
  ApiResponse,
  PageResponse,
  SuperAdminDashboardResponse,
  SuperAdminCompanyItemDto,
  SuperAdminCompanyDetailDto,
  UpdateCompanyStatusRequest,
  SuperAdminAssignPlanRequest,
  SuperAdminSubscriptionItemDto,
  SuperAdminSubscriptionStatsDto,
  ExtendSubscriptionRequest,
} from '../types/api';

export const superAdminApi = {
  getDashboardStats: async (): Promise<ApiResponse<SuperAdminDashboardResponse>> => {
    const response = await apiClient.get<ApiResponse<SuperAdminDashboardResponse>>(
      '/api/v1/super-admin/dashboard'
    );
    return response.data;
  },

  getCompanies: async (params?: {
    keyword?: string;
    status?: string;
    planId?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<SuperAdminCompanyItemDto>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<SuperAdminCompanyItemDto>>>(
      '/api/v1/super-admin/companies',
      { params }
    );
    return response.data;
  },

  getCompanyDetail: async (
    companyId: number
  ): Promise<ApiResponse<SuperAdminCompanyDetailDto>> => {
    const response = await apiClient.get<ApiResponse<SuperAdminCompanyDetailDto>>(
      `/api/v1/super-admin/companies/${companyId}`
    );
    return response.data;
  },

  updateCompanyStatus: async (
    companyId: number,
    payload: UpdateCompanyStatusRequest
  ): Promise<ApiResponse<SuperAdminCompanyItemDto>> => {
    const response = await apiClient.put<ApiResponse<SuperAdminCompanyItemDto>>(
      `/api/v1/super-admin/companies/${companyId}/status`,
      payload
    );
    return response.data;
  },

  assignPlan: async (
    companyId: number,
    payload: SuperAdminAssignPlanRequest
  ): Promise<ApiResponse<SuperAdminCompanyDetailDto>> => {
    const response = await apiClient.post<ApiResponse<SuperAdminCompanyDetailDto>>(
      `/api/v1/super-admin/companies/${companyId}/assign-plan`,
      payload
    );
    return response.data;
  },

  getSubscriptions: async (params?: {
    keyword?: string;
    status?: string;
    planId?: number;
    isPaid?: boolean;
    isExpiringSoon?: boolean;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<SuperAdminSubscriptionItemDto>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<SuperAdminSubscriptionItemDto>>>(
      '/api/v1/super-admin/subscriptions',
      { params }
    );
    return response.data;
  },

  getSubscriptionStats: async (): Promise<ApiResponse<SuperAdminSubscriptionStatsDto>> => {
    const response = await apiClient.get<ApiResponse<SuperAdminSubscriptionStatsDto>>(
      '/api/v1/super-admin/subscriptions/stats'
    );
    return response.data;
  },

  extendSubscription: async (
    id: number,
    payload: ExtendSubscriptionRequest
  ): Promise<ApiResponse<SuperAdminSubscriptionItemDto>> => {
    const response = await apiClient.post<ApiResponse<SuperAdminSubscriptionItemDto>>(
      `/api/v1/super-admin/subscriptions/${id}/extend`,
      payload
    );
    return response.data;
  },

  cancelSubscriptionToFree: async (
    id: number,
    reason?: string
  ): Promise<ApiResponse<SuperAdminSubscriptionItemDto>> => {
    const response = await apiClient.post<ApiResponse<SuperAdminSubscriptionItemDto>>(
      `/api/v1/super-admin/subscriptions/${id}/cancel-to-free`,
      { reason }
    );
    return response.data;
  },
};
