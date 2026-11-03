import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from '../pages/Auth/AuthPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { ChannelList } from '../pages/Channels/ChannelList';
import { MemberList } from '../pages/Admin/CompanyMembers/MemberList';
import { ChatRoomAdminList } from '../pages/Admin/ChatRooms/ChatRoomAdminList';
import { ConversationAdminList } from '../pages/Admin/Conversations/ConversationAdminList';
import { CompanySettingsPage } from '../pages/Admin/CompanySettings/CompanySettingsPage';
import { ChatWorkspacePage } from '../pages/Chat/ChatWorkspacePage';
import { Spin } from 'antd';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, currentCompany } = useAuth();

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

  // Kiểm tra nếu người dùng là thành viên thường (STAFF) trong công ty hiện tại
  const isNormalMember =
    !!currentCompany &&
    currentCompany.userRole !== 'OWNER' &&
    currentCompany.userRole !== 'ADMIN';

  const defaultHomeRoute = isNormalMember ? '/chat' : '/admin/channels';

  // Đã đăng nhập
  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultHomeRoute} replace />} />
      <Route path="/" element={<Navigate to={defaultHomeRoute} replace />} />

      {/* Không gian Quản trị Admin: Chặn hoàn toàn nếu là thành viên thường (STAFF) */}
      {isNormalMember ? (
        <Route path="/admin/*" element={<Navigate to="/chat" replace />} />
      ) : (
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="channels" replace />} />
          <Route path="channels" element={<ChannelList />} />
          <Route path="conversations" element={<ConversationAdminList />} />
          <Route path="members" element={<MemberList />} />
          <Route path="chat-rooms" element={<ChatRoomAdminList />} />
          <Route path="settings" element={<CompanySettingsPage />} />
        </Route>
      )}

      {/* Không gian Ứng dụng Trò Chuyện (Chat Workspace) */}
      <Route path="/chat" element={<ChatWorkspacePage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={defaultHomeRoute} replace />} />
    </Routes>
  );
};
