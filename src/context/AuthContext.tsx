import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSuccess } from '../types/api';
import type { User, AuthResponse } from '../types/api';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadUser = async () => {
    try {
      const res = await authApi.getMe();
      if (isSuccess(res) && res.data) {
        setUser(res.data);
        localStorage.setItem('user_info', JSON.stringify(res.data));
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (token) {
      reloadUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (authData: AuthResponse) => {
    setToken(authData.accessToken);
    setUser(authData.user);
    localStorage.setItem('access_token', authData.accessToken);
    localStorage.setItem('user_info', JSON.stringify(authData.user));
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
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        reloadUser,
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
