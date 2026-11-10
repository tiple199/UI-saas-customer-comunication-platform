import { apiClient } from './client';
import type {
  ApiResponse,
  PageResponse,
  Plan,
  PlanStatus,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '../types/api';

export const planApi = {
  createPlan: async (payload: CreatePlanRequest): Promise<ApiResponse<Plan>> => {
    const response = await apiClient.post<ApiResponse<Plan>>('/api/v1/plans', payload);
    return response.data;
  },

  getAllPlans: async (status?: PlanStatus): Promise<ApiResponse<Plan[]>> => {
    const response = await apiClient.get<ApiResponse<Plan[]>>('/api/v1/plans', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  getPlansPaged: async (
    page = 0,
    size = 10,
    status?: PlanStatus,
    sort = 'price,asc'
  ): Promise<ApiResponse<PageResponse<Plan>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<Plan>>>('/api/v1/plans/paged', {
      params: {
        page,
        size,
        sort,
        ...(status ? { status } : {}),
      },
    });
    return response.data;
  },

  getActivePlans: async (): Promise<ApiResponse<Plan[]>> => {
    const response = await apiClient.get<ApiResponse<Plan[]>>('/api/v1/plans/active');
    return response.data;
  },

  getPlanById: async (id: number): Promise<ApiResponse<Plan>> => {
    const response = await apiClient.get<ApiResponse<Plan>>(`/api/v1/plans/${id}`);
    return response.data;
  },

  updatePlan: async (id: number, payload: UpdatePlanRequest): Promise<ApiResponse<Plan>> => {
    const response = await apiClient.put<ApiResponse<Plan>>(`/api/v1/plans/${id}`, payload);
    return response.data;
  },

  updatePlanStatus: async (id: number, status: PlanStatus): Promise<ApiResponse<Plan>> => {
    const response = await apiClient.patch<ApiResponse<Plan>>(`/api/v1/plans/${id}/status`, {
      status,
    });
    return response.data;
  },

  deletePlan: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/plans/${id}`);
    return response.data;
  },

  getCompanyCurrentSubscription: async (
    companyId?: number
  ): Promise<ApiResponse<import('../types/api').CompanySubscription>> => {
    const response = await apiClient.get<ApiResponse<import('../types/api').CompanySubscription>>(
      '/api/v1/plans/current-subscription',
      {
        params: companyId ? { companyId } : {},
      }
    );
    return response.data;
  },

  upgradeSubscription: async (
    payload: import('../types/api').UpgradeSubscriptionRequest,
    companyId?: number
  ): Promise<ApiResponse<import('../types/api').UpgradeSubscriptionResponse>> => {
    const response = await apiClient.post<
      ApiResponse<import('../types/api').UpgradeSubscriptionResponse>
    >('/api/v1/plans/upgrade', payload, {
      params: companyId ? { companyId } : {},
    });
    return response.data;
  },

  calculateUpgrade: async (
    targetPlanId: number,
    durationMonths: number,
    companyId?: number
  ): Promise<ApiResponse<import('../types/api').UpgradeCalculationResponse>> => {
    const response = await apiClient.get<
      ApiResponse<import('../types/api').UpgradeCalculationResponse>
    >('/api/v1/plans/calculate-upgrade', {
      params: {
        targetPlanId,
        durationMonths,
        ...(companyId ? { companyId } : {}),
      },
    });
    return response.data;
  },

  downgradeSubscription: async (
    payload: import('../types/api').DowngradeSubscriptionRequest,
    companyId?: number
  ): Promise<ApiResponse<import('../types/api').DowngradeSubscriptionResponse>> => {
    const response = await apiClient.post<
      ApiResponse<import('../types/api').DowngradeSubscriptionResponse>
    >('/api/v1/plans/downgrade', payload, {
      params: companyId ? { companyId } : {},
    });
    return response.data;
  },

  cancelPendingDowngrade: async (
    companyId?: number
  ): Promise<ApiResponse<import('../types/api').CompanySubscription>> => {
    const response = await apiClient.delete<
      ApiResponse<import('../types/api').CompanySubscription>
    >('/api/v1/plans/downgrade/cancel', {
      params: companyId ? { companyId } : {},
    });
    return response.data;
  },

  renewSubscription: async (
    payload: import('../types/api').RenewSubscriptionRequest,
    companyId?: number
  ): Promise<ApiResponse<import('../types/api').RenewSubscriptionResponse>> => {
    const response = await apiClient.post<
      ApiResponse<import('../types/api').RenewSubscriptionResponse>
    >('/api/v1/plans/renew', payload, {
      params: companyId ? { companyId } : {},
    });
    return response.data;
  },
};

