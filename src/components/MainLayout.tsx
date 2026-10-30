import React, { useState } from 'react';
import { Layout, Menu, Avatar, Space, Typography, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  ApiOutlined,
  CommentOutlined,
  LogoutOutlined,
  UserOutlined,
  MessageFilled,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { ChannelList } from '../pages/Channels/ChannelList';
import { ChatRoomList } from '../pages/ChatRooms/ChatRoomList';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedKey, setSelectedKey] = useState<'channels' | 'chatRooms'>('channels');

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
          <Title level={4} style={{ color: '#fff', margin: 0, letterSpacing: -0.5 }}>
            SaaS Communication
          </Title>
        </Space>

        <Space size={16}>
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
                onClick: () => setSelectedKey('channels'),
              },
              {
                key: 'chatRooms',
                icon: <CommentOutlined />,
                label: 'Phòng Chat',
                onClick: () => setSelectedKey('chatRooms'),
              },
            ]}
          />
        </Sider>

        <Content style={{ padding: '24px', background: '#f5f7fa', minHeight: 280 }}>
          {selectedKey === 'channels' && <ChannelList />}
          {selectedKey === 'chatRooms' && <ChatRoomList />}
        </Content>
      </Layout>
    </Layout>
  );
};
