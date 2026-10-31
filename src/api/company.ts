import { apiClient } from './client';
import type {
  ApiResponse,
  Company,
  CompanyMember,
  CreateCompanyRequest,
  CreateMemberAccountRequest,
  UpdateCompanyRequest,
} from '../types/api';

export const companyApi = {
  getMyCompanies: async (): Promise<ApiResponse<Company[]>> => {
    const response = await apiClient.get<ApiResponse<Company[]>>('/api/v1/companies');
    return response.data;
  },

  getCompanyById: async (companyId: number): Promise<ApiResponse<Company>> => {
    const response = await apiClient.get<ApiResponse<Company>>(`/api/v1/companies/${companyId}`);
    return response.data;
  },

  createCompany: async (payload: CreateCompanyRequest): Promise<ApiResponse<Company>> => {
    const response = await apiClient.post<ApiResponse<Company>>('/api/v1/companies', payload);
    return response.data;
  },

  updateCompany: async (
    companyId: number,
    payload: UpdateCompanyRequest
  ): Promise<ApiResponse<Company>> => {
    const response = await apiClient.put<ApiResponse<Company>>(
      `/api/v1/companies/${companyId}`,
      payload
    );
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

  createMemberAccount: async (
    companyId: number,
    payload: CreateMemberAccountRequest
  ): Promise<ApiResponse<CompanyMember>> => {
    const response = await apiClient.post<ApiResponse<CompanyMember>>(
      `/api/v1/companies/${companyId}/members/create-account`,
      payload
    );
    return response.data;
  },

  updateMemberStatus: async (
    companyId: number,
    memberUserId: number,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<ApiResponse<CompanyMember>> => {
    const response = await apiClient.patch<ApiResponse<CompanyMember>>(
      `/api/v1/companies/${companyId}/members/${memberUserId}/status`,
      { status }
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
