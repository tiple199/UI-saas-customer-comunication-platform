import { apiClient } from './client';
import type {
  ApiResponse,
  ConversationMessage,
  PublicWidgetConfig,
  RestoreConversationResponse,
  WidgetHandshakeRequest,
  WidgetHandshakeResponse,
  WidgetSendMessageRequest,
} from '../types/api';

export const widgetApi = {
  getWidgetConfig: async (channelKey: string): Promise<ApiResponse<PublicWidgetConfig>> => {
    const response = await apiClient.get<ApiResponse<PublicWidgetConfig>>(
      '/api/v1/public/widget/config',
      { params: { channelKey } }
    );
    return response.data;
  },

  handshake: async (
    payload: WidgetHandshakeRequest
  ): Promise<ApiResponse<WidgetHandshakeResponse>> => {
    const response = await apiClient.post<ApiResponse<WidgetHandshakeResponse>>(
      '/api/v1/public/widget/handshake',
      payload
    );
    return response.data;
  },

  restoreConversation: async (
    channelKey: string,
    visitorToken: string
  ): Promise<ApiResponse<RestoreConversationResponse>> => {
    const response = await apiClient.get<ApiResponse<RestoreConversationResponse>>(
      '/api/v1/public/widget/conversations/restore',
      { params: { channelKey, visitorToken } }
    );
    return response.data;
  },

  sendMessage: async (
    payload: WidgetSendMessageRequest
  ): Promise<ApiResponse<ConversationMessage>> => {
    const response = await apiClient.post<ApiResponse<ConversationMessage>>(
      '/api/v1/public/widget/messages',
      payload
    );
    return response.data;
  },
};

