import { apiClient } from './client';
import type {
  ApiResponse,
  Channel,
  CreateChannelRequest,
  PageResponse,
  UpdateChannelRequest,
} from '../types/api';

export const channelApi = {
  getChannels: async (companyId?: number): Promise<ApiResponse<Channel[]>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<Channel[]>>('/api/v1/channels', { params });
    return response.data;
  },

  getChannelsPaged: async (
    page = 0,
    size = 10,
    companyId?: number
  ): Promise<ApiResponse<PageResponse<Channel>>> => {
    const params: Record<string, any> = { page, size };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get<ApiResponse<PageResponse<Channel>>>(
      '/api/v1/channels/paged',
      { params }
    );
    return response.data;
  },

  getChannelById: async (id: number, companyId?: number): Promise<ApiResponse<Channel>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<Channel>>(`/api/v1/channels/${id}`, {
      params,
    });
    return response.data;
  },

  getChannelByKey: async (
    channelKey: string,
    companyId?: number
  ): Promise<ApiResponse<Channel>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<Channel>>(
      `/api/v1/channels/key/${encodeURIComponent(channelKey.trim())}`,
      { params }
    );
    return response.data;
  },

  createChannel: async (
    payload: CreateChannelRequest,
    companyId?: number
  ): Promise<ApiResponse<Channel>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<Channel>>('/api/v1/channels', payload, {
      params,
    });
    return response.data;
  },

  updateChannel: async (
    id: number,
    payload: UpdateChannelRequest,
    companyId?: number
  ): Promise<ApiResponse<Channel>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.put<ApiResponse<Channel>>(`/api/v1/channels/${id}`, payload, {
      params,
    });
    return response.data;
  },

  updateChannelAi: async (
    id: number,
    enabled: boolean,
    companyId?: number
  ): Promise<ApiResponse<Channel>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.patch<ApiResponse<Channel>>(
      `/api/v1/channels/${id}/ai`,
      { enabled },
      { params }
    );
    return response.data;
  },

  regenerateChannelKey: async (
    id: number,
    companyId?: number
  ): Promise<ApiResponse<Channel>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<Channel>>(
      `/api/v1/channels/${id}/regenerate-key`,
      null,
      { params }
    );
    return response.data;
  },

  deleteChannel: async (id: number, companyId?: number): Promise<ApiResponse<void>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/channels/${id}`, {
      params,
    });
    return response.data;
  },
};
