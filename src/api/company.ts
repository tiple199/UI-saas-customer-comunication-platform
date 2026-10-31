import { apiClient } from './client';
import type { ApiResponse, Company, CompanyMember, CreateCompanyRequest } from '../types/api';

export const companyApi = {
  getMyCompanies: async (): Promise<ApiResponse<Company[]>> => {
    const response = await apiClient.get<ApiResponse<Company[]>>('/api/v1/companies');
    return response.data;
  },

  createCompany: async (payload: CreateCompanyRequest): Promise<ApiResponse<Company>> => {
    const response = await apiClient.post<ApiResponse<Company>>('/api/v1/companies', payload);
    return response.data;
  },

  switchCompany: async (companyId: number): Promise<ApiResponse<Company>> => {
    const response = await apiClient.post<ApiResponse<Company>>(`/api/v1/companies/${companyId}/switch`);
    return response.data;
  },

  getCompanyMembers: async (companyId: number): Promise<ApiResponse<CompanyMember[]>> => {
    const response = await apiClient.get<ApiResponse<CompanyMember[]>>(`/api/v1/companies/${companyId}/members`);
    return response.data;
  },

  addMember: async (
    companyId: number,
    payload: { email: string; role?: string }
  ): Promise<ApiResponse<CompanyMember>> => {
    const response = await apiClient.post<ApiResponse<CompanyMember>>(
      `/api/v1/companies/${companyId}/members`,
      payload
    );
    return response.data;
  },

  removeMember: async (companyId: number, memberUserId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/v1/companies/${companyId}/members/${memberUserId}`
    );
    return response.data;
  },
};
