import { apiClient } from './client';
import type {
  ApiResponse,
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  PageResponse,
} from '../types/api';

export const knowledgeBaseApi = {
  createKnowledgeBase: async (
    payload: CreateKnowledgeBaseRequest,
    companyId?: number
  ): Promise<ApiResponse<KnowledgeBase>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<KnowledgeBase>>(
      '/api/v1/knowledge-bases',
      payload,
      { params }
    );
    return response.data;
  },

  getKnowledgeBases: async (companyId?: number): Promise<ApiResponse<KnowledgeBase[]>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<KnowledgeBase[]>>('/api/v1/knowledge-bases', {
      params,
    });
    return response.data;
  },

  getKnowledgeBasesPaged: async (
    page = 0,
    size = 20,
    search?: string,
    companyId?: number
  ): Promise<ApiResponse<PageResponse<KnowledgeBase>>> => {
    const params: Record<string, any> = { page, size };
    if (search && search.trim()) params.search = search.trim();
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get<ApiResponse<PageResponse<KnowledgeBase>>>(
      '/api/v1/knowledge-bases/paged',
      { params }
    );
    return response.data;
  },

  getKnowledgeBaseById: async (
    id: number,
    companyId?: number
  ): Promise<ApiResponse<KnowledgeBase>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<KnowledgeBase>>(
      `/api/v1/knowledge-bases/${id}`,
      { params }
    );
    return response.data;
  },

  updateKnowledgeBase: async (
    id: number,
    payload: UpdateKnowledgeBaseRequest,
    companyId?: number
  ): Promise<ApiResponse<KnowledgeBase>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.put<ApiResponse<KnowledgeBase>>(
      `/api/v1/knowledge-bases/${id}`,
      payload,
      { params }
    );
    return response.data;
  },

  deleteKnowledgeBase: async (id: number, companyId?: number): Promise<ApiResponse<void>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/knowledge-bases/${id}`, {
      params,
    });
    return response.data;
  },
};

