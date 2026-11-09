import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from '../pages/Auth/AuthPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';
import { ChannelList } from '../pages/Channels/ChannelList';
import { MemberList } from '../pages/Admin/CompanyMembers/MemberList';
import { ChatRoomAdminList } from '../pages/Admin/ChatRooms/ChatRoomAdminList';
import { ConversationAdminList } from '../pages/Admin/Conversations/ConversationAdminList';
import { KnowledgeBaseList } from '../pages/Admin/KnowledgeBase/KnowledgeBaseList';
import { CompanySettingsPage } from '../pages/Admin/CompanySettings/CompanySettingsPage';
import { PlanList, isSuperAdminUser } from '../pages/Admin/Plans/PlanList';
import { CompanyPlanCatalogPage } from '../pages/Admin/Plans/CompanyPlanCatalogPage';
import { ChatWorkspacePage } from '../pages/Chat/ChatWorkspacePage';
import { Spin } from 'antd';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, currentCompany, user } = useAuth();

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

  // Nếu là tài khoản Super Admin hệ thống (nằm ngoài Company) -> Đi thẳng vào Super Admin Portal
  const isSuperAdmin = isSuperAdminUser(user?.role);
  if (isSuperAdmin) {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/super-admin/plans" replace />} />
        <Route path="/" element={<Navigate to="/super-admin/plans" replace />} />
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="plans" replace />} />
          <Route path="plans" element={<PlanList />} />
        </Route>
        <Route path="*" element={<Navigate to="/super-admin/plans" replace />} />
      </Routes>
    );
  }

  // Kiểm tra nếu người dùng là thành viên thường (STAFF) trong công ty hiện tại
  const isNormalMember =
    !!currentCompany &&
    currentCompany.userRole !== 'OWNER' &&
    currentCompany.userRole !== 'ADMIN';

  const defaultHomeRoute = isNormalMember ? '/chat' : '/admin/channels';

  // Đã đăng nhập với tư cách User thuộc Company
  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultHomeRoute} replace />} />
      <Route path="/" element={<Navigate to={defaultHomeRoute} replace />} />

      {/* Chặn User thường truy cập vào /super-admin */}
      <Route path="/super-admin/*" element={<Navigate to={defaultHomeRoute} replace />} />

      {/* Không gian Quản trị Công ty (Tenant Admin): Chặn nếu là thành viên thường (STAFF) */}
      {isNormalMember ? (
        <Route path="/admin/*" element={<Navigate to="/chat" replace />} />
      ) : (
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="channels" replace />} />
          <Route path="channels" element={<ChannelList />} />
          <Route path="conversations" element={<ConversationAdminList />} />
          <Route path="knowledge-bases" element={<KnowledgeBaseList />} />
          <Route path="members" element={<MemberList />} />
          <Route path="chat-rooms" element={<ChatRoomAdminList />} />
          <Route path="plans" element={<CompanyPlanCatalogPage />} />
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
