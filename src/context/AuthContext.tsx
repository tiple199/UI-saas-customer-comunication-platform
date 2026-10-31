import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSuccess } from '../types/api';
import type { User, AuthResponse, Company } from '../types/api';
import { authApi } from '../api/auth';
import { companyApi } from '../api/company';
import { message } from 'antd';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  companies: Company[];
  currentCompany: Company | null;
  login: (authData: AuthResponse) => void;
  logout: () => Promise<void>;
  reloadUser: (targetCompanyId?: number) => Promise<void>;
  fetchCompanies: (activeCompanyId?: number | null) => Promise<void>;
  switchCompany: (companyId: number) => Promise<boolean>;
  createNewCompany: (name: string) => Promise<Company | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);

  const fetchCompanies = async (activeCompanyId?: number | null) => {
    try {
      const res = await companyApi.getMyCompanies();
      if (isSuccess(res) && res.data) {
        setCompanies(res.data);

        let targetId = activeCompanyId;
        if (targetId === undefined) {
          const stored = localStorage.getItem('user_info');
          const parsed = stored ? JSON.parse(stored) : null;
          targetId = parsed?.currentCompanyId || user?.currentCompanyId || null;
        }

        if (targetId) {
          const matched = res.data.find((c) => c.id === targetId);
          setCurrentCompany(matched || res.data[0] || null);
        } else if (res.data.length > 0) {
          setCurrentCompany(res.data[0]);
        } else {
          setCurrentCompany(null);
        }
      }
    } catch {
      // ignore
    }
  };

  const reloadUser = async (targetCompanyId?: number) => {
    try {
      const res = await authApi.getMe();
      if (isSuccess(res) && res.data) {
        setUser(res.data);
        localStorage.setItem('user_info', JSON.stringify(res.data));
        const effectiveId = targetCompanyId !== undefined ? targetCompanyId : res.data.currentCompanyId;
        await fetchCompanies(effectiveId);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  // Lắng nghe sự kiện từ Axios Interceptor khi tự động refresh token hoặc khi refresh thất bại
  useEffect(() => {
    const handleTokenRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent<AuthResponse>;
      if (customEvent.detail) {
        setToken(customEvent.detail.accessToken);
        if (customEvent.detail.user) {
          setUser(customEvent.detail.user);
        }
      }
    };

    const handleForceLogout = () => {
      setToken(null);
      setUser(null);
      setCompanies([]);
      setCurrentCompany(null);
    };

    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth:logout', handleForceLogout);

    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth:logout', handleForceLogout);
    };
  }, []);

  useEffect(() => {
    if (token) {
      reloadUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (authData: AuthResponse) => {
    setToken(authData.accessToken);
    setUser(authData.user);
    localStorage.setItem('access_token', authData.accessToken);
    if (authData.refreshToken) {
      localStorage.setItem('refresh_token', authData.refreshToken);
    }
    localStorage.setItem('user_info', JSON.stringify(authData.user));
    fetchCompanies(authData.user.currentCompanyId);
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
      setCompanies([]);
      setCurrentCompany(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
    }
  };

  const switchCompany = async (companyId: number): Promise<boolean> => {
    try {
      const res = await companyApi.switchCompany(companyId);
      if (isSuccess(res) && res.data) {
        message.success(`Đã chuyển sang công ty "${res.data.name}"`);

        setCurrentCompany(res.data);

        setUser((prev) => (prev ? { ...prev, currentCompanyId: companyId } : prev));
        const stored = localStorage.getItem('user_info');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.currentCompanyId = companyId;
            localStorage.setItem('user_info', JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }

        await reloadUser(companyId);
        return true;
      } else {
        message.error(res.message || 'Không thể chuyển công ty');
        return false;
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi chuyển công ty');
      return false;
    }
  };

  const createNewCompany = async (name: string): Promise<Company | null> => {
    try {
      const res = await companyApi.createCompany({ name });
      if (isSuccess(res) && res.data) {
        message.success(`Tạo công ty "${res.data.name}" thành công!`);
        setCurrentCompany(res.data);
        setUser((prev) => (prev ? { ...prev, currentCompanyId: res.data.id } : prev));
        await reloadUser(res.data.id);
        return res.data;
      } else {
        message.error(res.message || 'Tạo công ty thất bại');
        return null;
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tạo công ty');
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        companies,
        currentCompany,
        login,
        logout,
        reloadUser,
        fetchCompanies,
        switchCompany,
        createNewCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
