import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Alert,
} from 'antd';
import {
  CommentOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { chatRoomApi } from '../../../api/chatRoom';
import { isSuccess } from '../../../types/api';
import type { ChatRoom, ChatRoomType } from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';

const { Text } = Typography;

export const ChatRoomAdminList: React.FC = () => {
  const { currentCompany } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const res = await chatRoomApi.getMyChatRooms(currentCompany.id);
      if (isSuccess(res) && res.data) {
        setRooms(res.data);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách phòng chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany) {
      fetchRooms();
    } else {
      setRooms([]);
    }
  }, [currentCompany?.id]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ChatRoom) => (
        <Space>
          {record.type === 'GROUP' ? (
            <TeamOutlined style={{ color: '#722ed1' }} />
          ) : (
            <UserOutlined style={{ color: '#1677ff' }} />
          )}
          <Text strong>{text || '(Hội thoại 1-1)'}</Text>
        </Space>
      ),
    },
    {
      title: 'Loại phòng',
      dataIndex: 'type',
      key: 'type',
      render: (type: ChatRoomType) =>
        type === 'GROUP' ? (
          <Tag color="purple">Nhóm nội bộ (GROUP)</Tag>
        ) : (
          <Tag color="green">Cá nhân (DIRECT)</Tag>
        ),
    },
    {
      title: 'Người tạo ID',
      dataIndex: 'createBy',
      key: 'createBy',
      render: (id: number) => (id ? <Text code>{id}</Text> : '-'),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => (val ? new Date(val).toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: () => (
        <Button
          type="link"
          icon={<WechatOutlined />}
          onClick={() => navigate('/chat')}
        >
          Mở ứng dụng chat
        </Button>
      ),
    },
  ];

  if (!currentCompany) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Alert
          message="Bạn chưa có công ty hoạt động"
          description="Vui lòng tạo hoặc chọn một công ty ở thanh menu trên cùng để quản trị phòng chat."
          type="warning"
          showIcon
          icon={<BankOutlined />}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <CommentOutlined style={{ color: '#1677ff' }} />
          <span>Quản Trị Phòng Chat Nội Bộ</span>
          <Tag color="geekblue">{currentCompany.name}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRooms} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<WechatOutlined />}
            onClick={() => navigate('/chat')}
            style={{ background: '#52c41a' }}
          >
            Vào Không Gian Chat
          </Button>
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <Table
        dataSource={rooms}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Chưa có phòng chat nào' }}
      />
    </Card>
  );
};
