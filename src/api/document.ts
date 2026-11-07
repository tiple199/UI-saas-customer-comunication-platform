import { apiClient } from './client';
import type { ApiResponse, DocumentChunkSearchResult, DocumentItem, DocumentPreview, PageResponse, RagAskRequest, RagAskResponse, RagContextResponse } from '../types/api';

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

  getDocumentPreview: async (
    id: number,
    companyId?: number
  ): Promise<ApiResponse<DocumentPreview>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<DocumentPreview>>(
      `/api/v1/documents/${id}/preview`,
      { params }
    );
    return response.data;
  },

  downloadDocument: async (
    id: number,
    fileName: string,
    companyId?: number
  ): Promise<void> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get(`/api/v1/documents/${id}/download`, {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  getViewBlobUrl: async (
    id: number,
    fileType: string,
    companyId?: number
  ): Promise<string> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get(`/api/v1/documents/${id}/view`, {
      params,
      responseType: 'blob',
    });

    const lower = fileType.toLowerCase();
    const mime = lower.includes('pdf')
      ? 'application/pdf'
      : lower.includes('txt')
      ? 'text/plain;charset=utf-8'
      : lower.includes('json')
      ? 'application/json'
      : lower.includes('csv')
      ? 'text/csv;charset=utf-8'
      : String(response.headers['content-type'] || 'application/octet-stream');

    const blob = new Blob([response.data], { type: mime });
    return window.URL.createObjectURL(blob);
  },

  getDownloadUrl: (id: number, companyId?: number): string => {
    const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8080';
    return `${baseUrl}/api/v1/documents/${id}/download${companyId ? `?companyId=${companyId}` : ''}`;
  },

  processDocument: async (
    id: number,
    companyId?: number
  ): Promise<ApiResponse<DocumentItem>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<DocumentItem>>(
      `/api/v1/documents/${id}/process`,
      null,
      { params }
    );
    return response.data;
  },

  searchSimilarChunks: async (
    knowledgeBaseId: number,
    query: string,
    topK = 5,
    minScore = 0.3,
    companyId?: number
  ): Promise<ApiResponse<DocumentChunkSearchResult[]>> => {
    const params: Record<string, any> = { knowledgeBaseId, query, topK, minScore };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get<ApiResponse<DocumentChunkSearchResult[]>>(
      '/api/v1/documents/search',
      { params }
    );
    return response.data;
  },

  buildRagContext: async (
    query: string,
    options?: {
      knowledgeBaseId?: number;
      conversationId?: number;
      topK?: number;
      minScore?: number;
      companyId?: number;
    }
  ): Promise<ApiResponse<RagContextResponse>> => {
    const params: Record<string, any> = {
      query,
      topK: options?.topK ?? 5,
      minScore: options?.minScore ?? 0.35,
    };
    if (options?.knowledgeBaseId) params.knowledgeBaseId = options.knowledgeBaseId;
    if (options?.conversationId) params.conversationId = options.conversationId;
    if (options?.companyId) params.companyId = options.companyId;

    const response = await apiClient.get<ApiResponse<RagContextResponse>>(
      '/api/v1/documents/rag-context',
      { params }
    );
    return response.data;
  },

  askRag: async (
    request: RagAskRequest,
    companyId?: number
  ): Promise<ApiResponse<RagAskResponse>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<RagAskResponse>>(
      '/api/v1/documents/ask',
      request,
      { params }
    );
    return response.data;
  },

  deleteDocument: async (id: number, companyId?: number): Promise<ApiResponse<void>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/documents/${id}`, {
      params,
    });
    return response.data;
  },

  deleteDocumentsBatch: async (
    documentIds: number[],
    companyId?: number
  ): Promise<ApiResponse<void>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<void>>(
      '/api/v1/documents/batch-delete',
      documentIds,
      { params }
    );
    return response.data;
  },
};


