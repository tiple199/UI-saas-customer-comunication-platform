import { apiClient } from './client';
import type { ApiResponse, DocumentItem, PageResponse } from '../types/api';

export const documentApi = {
  uploadDocument: async (
    knowledgeBaseId: number,
    file: File,
    companyId?: number
  ): Promise<ApiResponse<DocumentItem>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('knowledgeBaseId', String(knowledgeBaseId));
    const params = companyId ? { companyId } : {};

    const response = await apiClient.post<ApiResponse<DocumentItem>>(
      '/api/v1/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params,
      }
    );
    return response.data;
  },

  getDocuments: async (
    knowledgeBaseId: number,
    page = 0,
    size = 20,
    search?: string,
    companyId?: number
  ): Promise<ApiResponse<PageResponse<DocumentItem>>> => {
    const params: Record<string, any> = { knowledgeBaseId, page, size };
    if (search && search.trim()) params.search = search.trim();
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get<ApiResponse<PageResponse<DocumentItem>>>(
      '/api/v1/documents',
      { params }
    );
    return response.data;
  },

  getDocumentById: async (
    id: number,
    companyId?: number
  ): Promise<ApiResponse<DocumentItem>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<DocumentItem>>(
      `/api/v1/documents/${id}`,
      { params }
    );
    return response.data;
  },

  getDownloadUrl: (id: number, companyId?: number): string => {
    const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8080';
    return `${baseUrl}/api/v1/documents/${id}/download${companyId ? `?companyId=${companyId}` : ''}`;
  },

  deleteDocument: async (id: number, companyId?: number): Promise<ApiResponse<void>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/documents/${id}`, {
      params,
    });
    return response.data;
  },
};

