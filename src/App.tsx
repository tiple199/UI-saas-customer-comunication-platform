import React from 'react';
import { ConfigProvider, Spin, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/Auth/AuthPage';
import { MainLayout } from './components/MainLayout';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f8fafc',
        }}
      >
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return isAuthenticated ? <MainLayout /> : <AuthPage />;
};

export const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
