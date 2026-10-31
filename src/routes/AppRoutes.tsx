import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from '../pages/Auth/AuthPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { ChannelList } from '../pages/Channels/ChannelList';
import { MemberList } from '../pages/Admin/CompanyMembers/MemberList';
import { ChatRoomAdminList } from '../pages/Admin/ChatRooms/ChatRoomAdminList';
import { CompanySettingsPage } from '../pages/Admin/CompanySettings/CompanySettingsPage';
import { ChatWorkspacePage } from '../pages/Chat/ChatWorkspacePage';
import { Spin } from 'antd';

export const AppRoutes: React.FC = () => {
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

  // Chưa đăng nhập -> Chỉ cho phép vào /login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Đã đăng nhập
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/admin/channels" replace />} />
      <Route path="/" element={<Navigate to="/admin/channels" replace />} />

      {/* Không gian Quản trị Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="channels" replace />} />
        <Route path="channels" element={<ChannelList />} />
        <Route path="members" element={<MemberList />} />
        <Route path="chat-rooms" element={<ChatRoomAdminList />} />
        <Route path="settings" element={<CompanySettingsPage />} />
      </Route>

      {/* Không gian Ứng dụng Trò Chuyện (Chat Workspace) */}
      <Route path="/chat" element={<ChatWorkspacePage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin/channels" replace />} />
    </Routes>
  );
};

