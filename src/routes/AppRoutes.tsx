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
import { SuperAdminDashboardPage } from '../pages/SuperAdmin/SuperAdminDashboardPage';
import { SuperAdminCompanyListPage } from '../pages/SuperAdmin/SuperAdminCompanyListPage';
import { SuperAdminSubscriptionListPage } from '../pages/SuperAdmin/SuperAdminSubscriptionListPage';
import { CompanyPlanCatalogPage } from '../pages/Admin/Plans/CompanyPlanCatalogPage';
import { ChatWorkspacePage } from '../pages/Chat/ChatWorkspacePage';
import { Spin, Result, Button, Card, Space, Select } from 'antd';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading, currentCompany, companies, switchCompany, user, logout } = useAuth();

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
        <Route path="/login" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="companies" element={<SuperAdminCompanyListPage />} />
          <Route path="subscriptions" element={<SuperAdminSubscriptionListPage />} />
          <Route path="plans" element={<PlanList />} />
        </Route>
        <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
      </Routes>
    );
  }

  // Nếu công ty hiện tại đang bị tạm khóa (SUSPENDED)
  if (currentCompany?.status === 'SUSPENDED') {
    const otherActiveCompanies = companies.filter(
      (c) => c.id !== currentCompany.id && c.status === 'ACTIVE'
    );

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f8fafc',
          padding: 24,
        }}
      >
        <Card
          style={{
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            borderRadius: 16,
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            border: '1px solid #fed7aa',
          }}
        >
          <Result
            status="warning"
            title="Doanh Nghiệp Đang Bị Tạm Khóa"
            subTitle={
              <div>
                Doanh nghiệp <strong>{currentCompany.name}</strong> hiện đang bị tạm khóa bởi Quản trị viên hệ thống. Mọi quyền truy cập không gian làm việc, kênh tương tác và hộp thoại đều tạm ngừng.
              </div>
            }
            extra={
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {otherActiveCompanies.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                      Bạn có thể chuyển sang công ty khác đang hoạt động:
                    </div>
                    <Select
                      placeholder="Chọn công ty để chuyển sang"
                      style={{ width: '100%' }}
                      onChange={(compVal) => switchCompany(Number(compVal))}
                    >
                      {otherActiveCompanies.map((c) => (
                        <Select.Option key={c.id} value={c.id}>
                          {c.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                )}
                <Button type="primary" danger onClick={() => logout()}>
                  Đăng Xuất
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
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
