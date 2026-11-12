import { apiClient } from './client';
import type {
  ApiResponse,
  PageResponse,
  CreatePaymentOrderRequest,
  PaymentOrderResponse,
  PaymentResponse,
  ConfirmPaymentRequest,
} from '../types/api';

export const paymentApi = {
  createPaymentOrder: async (
    payload: CreatePaymentOrderRequest,
    companyId?: number
  ): Promise<ApiResponse<PaymentOrderResponse>> => {
    const headers = companyId ? { 'X-Company-Id': String(companyId) } : undefined;
    const response = await apiClient.post<ApiResponse<PaymentOrderResponse>>(
      '/api/v1/payments/create-order',
      payload,
      {
        headers,
        params: companyId ? { companyId } : undefined,
      }
    );
    return response.data;
  },

  confirmPayment: async (payload: ConfirmPaymentRequest): Promise<ApiResponse<PaymentResponse>> => {
    const response = await apiClient.post<ApiResponse<PaymentResponse>>('/api/v1/payments/confirm', payload);
    return response.data;
  },

  cancelPaymentOrder: async (transactionRef: string): Promise<ApiResponse<PaymentResponse>> => {
    const response = await apiClient.post<ApiResponse<PaymentResponse>>(
      `/api/v1/payments/${transactionRef}/cancel`
    );
    return response.data;
  },

  getPaymentStatus: async (transactionRef: string): Promise<ApiResponse<PaymentResponse>> => {
    const response = await apiClient.get<ApiResponse<PaymentResponse>>(
      `/api/v1/payments/check-status/${transactionRef}`
    );
    return response.data;
  },

  getCompanyPayments: async (
    companyId: number,
    page = 0,
    size = 10
  ): Promise<ApiResponse<PageResponse<PaymentResponse>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<PaymentResponse>>>(
      `/api/v1/companies/${companyId}/payments`,
      {
        params: { page, size, sort: 'createdAt,desc' },
      }
    );
    return response.data;
  },

  getPaymentById: async (paymentId: number): Promise<ApiResponse<PaymentResponse>> => {
    const response = await apiClient.get<ApiResponse<PaymentResponse>>(`/api/v1/payments/${paymentId}`);
    return response.data;
  },
};

