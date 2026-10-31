import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthStorageAndNotify = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Không tự động refresh đối với các API auth (login, register, refresh, logout)
    const requestUrl = originalRequest.url || '';
    if (
      requestUrl.includes('/api/v1/auth/login') ||
      requestUrl.includes('/api/v1/auth/register') ||
      requestUrl.includes('/api/v1/auth/refresh') ||
      requestUrl.includes('/api/v1/auth/logout')
    ) {
      return Promise.reject(error);
    }

    // Nếu request này đã retry 1 lần mà vẫn 401 -> đăng xuất
    if (originalRequest._retry) {
      clearAuthStorageAndNotify();
      return Promise.reject(error);
    }

    // Nếu đang có 1 tiến trình refresh khác chạy, đưa request hiện tại vào hàng đợi
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = localStorage.getItem('refresh_token');

      // Gọi trực tiếp bằng axios gốc để tránh vòng lặp interceptor
      const refreshResponse = await axios.post<ApiResponse<AuthResponse>>(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        { refreshToken: storedRefreshToken || null },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      const resData = refreshResponse.data;
      if (resData && resData.statusCode >= 200 && resData.statusCode < 300 && resData.data) {
        const { accessToken, refreshToken, user } = resData.data;

        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
        }

        // Phát sự kiện để AuthContext đồng bộ lại state
        window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: resData.data }));

        // Giải phóng hàng đợi các request đang chờ
        processQueue(null, accessToken);

        // Gắn token mới và gọi lại request ban đầu
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } else {
        processQueue(error, null);
        clearAuthStorageAndNotify();
        return Promise.reject(error);
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthStorageAndNotify();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
