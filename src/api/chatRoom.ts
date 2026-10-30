import { apiClient } from './client';
import type { ApiResponse, ChatRoom, CreateChatRoomRequest } from '../types/api';

export const chatRoomApi = {
  getMyChatRooms: async (companyId?: number): Promise<ApiResponse<ChatRoom[]>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<ApiResponse<ChatRoom[]>>('/api/v1/chat-rooms', { params });
    return response.data;
  },

  createChatRoom: async (
    payload: CreateChatRoomRequest,
    companyId?: number
  ): Promise<ApiResponse<ChatRoom>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<ChatRoom>>('/api/v1/chat-rooms', payload, {
      params,
    });
    return response.data;
  },

  getOrCreateDirectRoom: async (
    targetUserId: number,
    companyId?: number
  ): Promise<ApiResponse<ChatRoom>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<ChatRoom>>(
      `/api/v1/chat-rooms/direct/${targetUserId}`,
      null,
      { params }
    );
    return response.data;
  },
};
