import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Space,
  Typography,
  Dropdown,
  Select,
  Button,
  Modal,
  Form,
  Input,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  ApiOutlined,
  CommentOutlined,
  LogoutOutlined,
  UserOutlined,
  MessageFilled,
  BankOutlined,
  PlusOutlined,
  TeamOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const AdminLayout: React.FC = () => {
  const { user, logout, companies, currentCompany, switchCompany, createNewCompany } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [submittingCompany, setSubmittingCompany] = useState(false);
  const [companyForm] = Form.useForm();

  const handleCreateCompany = async (values: { name: string }) => {
    try {
      setSubmittingCompany(true);
      const res = await createNewCompany(values.name);
      if (res) {
        setIsCompanyModalOpen(false);
        companyForm.resetFields();
      }
    } finally {
      setSubmittingCompany(false);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <Space direction="vertical" size={2}>
          <Text strong>{user?.fullName || 'Người dùng'}</Text>
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

  const selectedKey = location.pathname.includes('/admin/members')
    ? 'members'
    : location.pathname.includes('/admin/chat-rooms')
    ? 'chat-rooms'
    : 'channels';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 10,
        }}
      >
        <Space align="center" size={12}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageFilled style={{ fontSize: 20, color: '#fff' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.2 }}>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.2 }}>
              Admin Portal
            </span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 1.2, marginTop: 2 }}>
              Bảng Quản Trị Hệ Thống SaaS
            </span>
          </div>
        </Space>

        <Space size={16} align="center">
          {/* Nút vào ứng dụng Chat */}
          <Button
            type="primary"
            icon={<WechatOutlined />}
            onClick={() => navigate('/chat')}
            style={{
              background: '#10b981',
              borderColor: '#10b981',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
            }}
          >
            Vào Ứng Dụng Chat
          </Button>

          {/* Chọn / tạo công ty */}
          <Space align="center" style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 8 }}>
            <BankOutlined style={{ color: '#60a5fa', fontSize: 16 }} />
            {companies.length > 0 ? (
              <Select
                value={currentCompany?.id}
                onChange={(val) => switchCompany(val)}
                placeholder="Chọn công ty"
                style={{ width: 180 }}
                variant="borderless"
                popupMatchSelectWidth={false}
                options={companies.map((c) => ({
                  label: `${c.name} (${c.userRole || 'MEMBER'})`,
                  value: c.id,
                }))}
              />
            ) : (
              <Text style={{ color: '#fbbf24', fontSize: 13 }}>Chưa có công ty</Text>
            )}
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setIsCompanyModalOpen(true)}
              style={{ fontSize: 12, height: 26 }}
            >
              Tạo
            </Button>
          </Space>

          {/* User profile dropdown */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
              <Avatar
                style={{ backgroundColor: '#1677ff', verticalAlign: 'middle' }}
                icon={<UserOutlined />}
              >
                {user?.fullName?.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
                <div style={{ color: '#fff', fontWeight: 500 }}>
                  {user?.fullName || user?.email}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                  {user?.role || 'USER'}
                </div>
              </div>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sider width={230} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0, paddingTop: 12 }}
            items={[
              {
                key: 'channels',
                icon: <ApiOutlined />,
                label: 'Kênh Giao Tiếp',
                onClick: () => navigate('/admin/channels'),
              },
              {
                key: 'members',
                icon: <TeamOutlined />,
                label: 'Thành Viên Công Ty',
                onClick: () => navigate('/admin/members'),
              },
              {
                key: 'chat-rooms',
                icon: <CommentOutlined />,
                label: 'Quản Lý Phòng Chat',
                onClick: () => navigate('/admin/chat-rooms'),
              },
            ]}
          />
        </Sider>

        <Content style={{ padding: '24px', background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
          {/* Key buộc React remount trang con ngay lập tức khi currentCompany thay đổi */}
          <Outlet key={currentCompany?.id ?? 'no-company'} />
        </Content>
      </Layout>

      {/* Modal Tạo công ty */}
      <Modal
        title="Tạo Công Ty Mới"
        open={isCompanyModalOpen}
        onCancel={() => setIsCompanyModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={companyForm} layout="vertical" onFinish={handleCreateCompany}>
          <Form.Item
            name="name"
            label="Tên Công Ty"
            rules={[{ required: true, message: 'Vui lòng nhập tên công ty!' }]}
          >
            <Input placeholder="Ví dụ: Công ty Cổ phần Công nghệ XYZ" autoFocus />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsCompanyModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submittingCompany}>
                Tạo và hoạt động
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};
