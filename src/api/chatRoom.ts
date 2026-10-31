import { apiClient } from './client';
import type {
  ApiResponse,
  ChatRoom,
  CreateChatRoomRequest,
  InternalMessage,
  PageResponse,
  SendMessageRequest,
} from '../types/api';

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

  getChatRoomMessages: async (
    roomId: number,
    page: number = 0,
    size: number = 50,
    companyId?: number
  ): Promise<ApiResponse<PageResponse<InternalMessage>>> => {
    const params = {
      page,
      size,
      ...(companyId ? { companyId } : {}),
    };
    const response = await apiClient.get<ApiResponse<PageResponse<InternalMessage>>>(
      `/api/v1/chat-rooms/${roomId}/messages`,
      { params }
    );
    return response.data;
  },

  sendMessage: async (
    roomId: number,
    payload: SendMessageRequest,
    companyId?: number
  ): Promise<ApiResponse<InternalMessage>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<InternalMessage>>(
      `/api/v1/chat-rooms/${roomId}/messages`,
      payload,
      { params }
    );
    return response.data;
  },

  markAsRead: async (roomId: number, companyId?: number): Promise<ApiResponse<void>> => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post<ApiResponse<void>>(
      `/api/v1/chat-rooms/${roomId}/read`,
      null,
      { params }
    );
    return response.data;
  },
};
