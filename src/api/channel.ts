import { apiClient } from './client';
import type { ApiResponse, Channel, CreateChannelRequest, UpdateChannelRequest } from '../types/api';

export const channelApi = {
  getChannels: async (companyId?: number): Promise<ApiResponse<Channel[]>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<Channel[]>>('/api/v1/channels', { params });
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
