import React from 'react';
import { Layout, Menu, Avatar, Space, Typography, Dropdown, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  CrownOutlined,
  LogoutOutlined,
  UserOutlined,
  SafetyCertificateFilled,
  DashboardOutlined,
  ShopOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <Space direction="vertical" size={2}>
          <Text strong>{user?.fullName || 'Super Admin'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
        </Space>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: logout,
    },
  ];

  const selectedKey = location.pathname.includes('/super-admin/companies')
    ? 'companies'
    : location.pathname.includes('/super-admin/subscriptions')
    ? 'subscriptions'
    : location.pathname.includes('/super-admin/plans')
    ? 'plans'
    : 'dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}
      >
        <Space align="center" size={12}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)',
            }}
          >
            <SafetyCertificateFilled style={{ fontSize: 20, color: '#fff' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.2 }}>
            <Space size={8} align="center">
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>
                Super Admin Portal
              </span>
              <Tag color="gold" style={{ margin: 0, fontWeight: 700, fontSize: 10 }}>
                SYSTEM OWNER
              </Tag>
            </Space>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
              Quản Trị Hệ Thống Gói Cước & Thuê Bao Toàn Nền Tảng
            </span>
          </div>
        </Space>

        <Space size={16} align="center">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: 8 }}>
              <Avatar
                style={{ backgroundColor: '#f59e0b', verticalAlign: 'middle' }}
                icon={<UserOutlined />}
              >
                {user?.fullName?.charAt(0).toUpperCase() || 'S'}
              </Avatar>
              <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: 600 }}>
                  {user?.fullName || user?.email}
                </div>
                <div style={{ color: '#fde68a', fontSize: 11, fontWeight: 500 }}>
                  {user?.role || 'ROLE_SUPER_ADMIN'}
                </div>
              </div>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sider width={240} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0, paddingTop: 12 }}
            items={[
              {
                key: 'dashboard',
                icon: <DashboardOutlined />,
                label: 'Tổng Quan Hệ Thống (Dashboard)',
                onClick: () => navigate('/super-admin/dashboard'),
              },
              {
                key: 'companies',
                icon: <ShopOutlined />,
                label: 'Quản Lý Doanh Nghiệp (Companies)',
                onClick: () => navigate('/super-admin/companies'),
              },
              {
                key: 'subscriptions',
                icon: <FieldTimeOutlined />,
                label: 'Quản Lý Thuê Bao (Subscriptions)',
                onClick: () => navigate('/super-admin/subscriptions'),
              },
              {
                key: 'plans',
                icon: <CrownOutlined />,
                label: 'Quản Lý Gói Dịch Vụ (Plans)',
                onClick: () => navigate('/super-admin/plans'),
              },
            ]}
          />
        </Sider>

        <Content style={{ padding: '24px', background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

