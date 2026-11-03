import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Space,
  Typography,
  Dropdown,
  Button,
  Modal,
  Form,
  Input,
  Tag,
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
  SettingOutlined,
  CustomerServiceOutlined,
  DownOutlined,
  CheckOutlined,
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
    : location.pathname.includes('/admin/conversations')
    ? 'conversations'
    : location.pathname.includes('/admin/chat-rooms')
    ? 'chat-rooms'
    : location.pathname.includes('/admin/settings')
    ? 'settings'
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
          <Space size={8} align="center">
            {companies.length > 0 ? (
              <Dropdown
                trigger={['click']}
                placement="bottomLeft"
                menu={{
                  items: [
                    {
                      key: 'company-header',
                      disabled: true,
                      label: (
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                          CHUYỂN ĐỔI CÔNG TY LÀM VIỆC
                        </Text>
                      ),
                    },
                    ...companies.map((c) => {
                      const isCurrent = c.id === currentCompany?.id;
                      return {
                        key: String(c.id),
                        onClick: () => {
                          if (!isCurrent) switchCompany(c.id);
                        },
                        label: (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              minWidth: 210,
                              gap: 12,
                              padding: '2px 0',
                            }}
                          >
                            <Space size={8}>
                              <BankOutlined
                                style={{ color: isCurrent ? '#1677ff' : '#64748b' }}
                              />
                              <Text strong={isCurrent} style={{ color: isCurrent ? '#1677ff' : undefined }}>
                                {c.name}
                              </Text>
                            </Space>
                            <Space size={6}>
                              <Tag
                                color={
                                  c.userRole === 'OWNER'
                                    ? 'gold'
                                    : c.userRole === 'ADMIN'
                                    ? 'blue'
                                    : 'default'
                                }
                                style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}
                              >
                                {c.userRole || 'STAFF'}
                              </Tag>
                              {isCurrent && <CheckOutlined style={{ color: '#1677ff', fontSize: 12 }} />}
                            </Space>
                          </div>
                        ),
                      };
                    }),
                    { type: 'divider' as const },
                    {
                      key: 'create-new-company',
                      icon: <PlusOutlined style={{ color: '#1677ff' }} />,
                      label: (
                        <Text strong style={{ color: '#1677ff' }}>
                          Tạo công ty mới...
                        </Text>
                      ),
                      onClick: () => setIsCompanyModalOpen(true),
                    },
                  ],
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(255, 255, 255, 0.14)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    padding: '5px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    lineHeight: 1.2,
                    transition: 'all 0.2s',
                  }}
                >
                  <BankOutlined style={{ color: '#60a5fa', fontSize: 15 }} />
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}>
                    {currentCompany?.name || 'Chọn công ty'}
                  </span>
                  {currentCompany?.userRole && (
                    <span
                      style={{
                        background:
                          currentCompany.userRole === 'OWNER'
                            ? 'rgba(250, 173, 20, 0.25)'
                            : 'rgba(22, 119, 255, 0.35)',
                        color: currentCompany.userRole === 'OWNER' ? '#ffd666' : '#91caff',
                        border:
                          currentCompany.userRole === 'OWNER'
                            ? '1px solid rgba(250, 173, 20, 0.45)'
                            : '1px solid rgba(145, 202, 255, 0.4)',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        letterSpacing: 0.3,
                      }}
                    >
                      {currentCompany.userRole}
                    </span>
                  )}
                  <DownOutlined style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }} />
                </div>
              </Dropdown>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCompanyModalOpen(true)}
              >
                Tạo Công Ty Mới
              </Button>
            )}
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
                key: 'conversations',
                icon: <CustomerServiceOutlined />,
                label: 'Hội Thoại Khách Hàng',
                onClick: () => navigate('/admin/conversations'),
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
              {
                key: 'settings',
                icon: <SettingOutlined />,
                label: 'Cài Đặt Công Ty',
                onClick: () => navigate('/admin/settings'),
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
