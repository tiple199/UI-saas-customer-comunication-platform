import { apiClient } from './client';
import type {
  ApiResponse,
  Conversation,
  ConversationMessage,
  ConversationStatus,
  CreateConversationRequest,
  HandlingMode,
  PageResponse,
  RestoreConversationResponse,
  SendMessageRequest,
} from '../types/api';

export const conversationApi = {
  createConversation: async (
    payload: CreateConversationRequest,
    companyId?: number
  ): Promise<ApiResponse<Conversation>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<Conversation>>(
      '/api/v1/conversations',
      payload,
      { params }
    );
    return response.data;
  },

  getConversations: async (companyId?: number): Promise<ApiResponse<Conversation[]>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<Conversation[]>>('/api/v1/conversations', {
      params,
    });
    return response.data;
  },

  getConversationsPaged: async (
    page = 0,
    size = 20,
    status?: ConversationStatus,
    companyId?: number
  ): Promise<ApiResponse<PageResponse<Conversation>>> => {
    const params: Record<string, any> = { page, size };
    if (status) params.status = status;
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get<ApiResponse<PageResponse<Conversation>>>(
      '/api/v1/conversations/paged',
      { params }
    );
    return response.data;
  },

  getConversationById: async (
    id: number,
    companyId?: number
  ): Promise<ApiResponse<Conversation>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<Conversation>>(
      `/api/v1/conversations/${id}`,
      { params }
    );
    return response.data;
  },

  restoreConversation: async (
    id: number,
    companyId?: number
  ): Promise<ApiResponse<RestoreConversationResponse>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<RestoreConversationResponse>>(
      `/api/v1/conversations/${id}/restore`,
      null,
      { params }
    );
    return response.data;
  },

  getConversationMessages: async (
    id: number,
    companyId?: number
  ): Promise<ApiResponse<ConversationMessage[]>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<ConversationMessage[]>>(
      `/api/v1/conversations/${id}/messages`,
      { params }
    );
    return response.data;
  },

  assignStaff: async (
    id: number,
    assigneeId?: number | null,
    companyId?: number
  ): Promise<ApiResponse<Conversation>> => {
    const params = companyId ? { companyId } : {};
    const payload = assigneeId ? { assigneeId } : {};
    const response = await apiClient.post<ApiResponse<Conversation>>(
      `/api/v1/conversations/${id}/assign`,
      payload,
      { params }
    );
    return response.data;
  },

  sendStaffMessage: async (
    id: number,
    payload: SendMessageRequest,
    companyId?: number
  ): Promise<ApiResponse<ConversationMessage>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<ConversationMessage>>(
      `/api/v1/conversations/${id}/messages`,
      payload,
      { params }
    );
    return response.data;
  },

  updateStatus: async (
    id: number,
    status: ConversationStatus,
    companyId?: number
  ): Promise<ApiResponse<Conversation>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.patch<ApiResponse<Conversation>>(
      `/api/v1/conversations/${id}/status`,
      { status },
      { params }
    );
    return response.data;
  },

  updateHandlingMode: async (
    id: number,
    handlingMode: HandlingMode,
    companyId?: number
  ): Promise<ApiResponse<Conversation>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.patch<ApiResponse<Conversation>>(
      `/api/v1/conversations/${id}/handling-mode`,
      { handlingMode },
      { params }
    );
    return response.data;
  },
};

