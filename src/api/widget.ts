import { apiClient } from './client';
import type {
  ApiResponse,
  PublicWidgetConfig,
  WidgetHandshakeRequest,
  WidgetHandshakeResponse,
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
};

