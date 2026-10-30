import { apiClient } from './client';
import type { ApiResponse, Channel, CreateChannelRequest } from '../types/api';

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
};
