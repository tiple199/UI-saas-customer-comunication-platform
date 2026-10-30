import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Badge,
} from 'antd';
import { PlusOutlined, ReloadOutlined, CommentOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { chatRoomApi } from '../../api/chatRoom';
import { isSuccess } from '../../types/api';
import type { ChatRoom, ChatRoomType, CreateChatRoomRequest } from '../../types/api';

const { Text } = Typography;

export const ChatRoomList: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await chatRoomApi.getMyChatRooms();
      if (isSuccess(res) && res.data) {
        setRooms(res.data);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Không thể tải danh sách phòng chat';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (values: CreateChatRoomRequest) => {
    try {
      setSubmitting(true);
      const payload: CreateChatRoomRequest = {
        name: values.name,
        type: values.type,
        memberUserIds: [],
      };
      const res = await chatRoomApi.createChatRoom(payload);
      if (isSuccess(res)) {
        message.success(res.message || 'Tạo phòng chat thành công!');
        setIsModalOpen(false);
        form.resetFields();
        fetchRooms();
      } else {
        message.error(res.message || res.error || 'Tạo phòng chat thất bại!');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Lỗi khi tạo phòng chat';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

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
          {record.type === 'GROUP' ? <TeamOutlined style={{ color: '#1677ff' }} /> : <UserOutlined style={{ color: '#52c41a' }} />}
          <Text strong>{text || '(Phòng chat 1-1)'}</Text>
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: ChatRoomType) =>
        type === 'GROUP' ? (
          <Tag color="purple">Nhóm (GROUP)</Tag>
        ) : (
          <Tag color="green">Cá nhân (DIRECT)</Tag>
        ),
    },
    {
      title: 'Tin chưa đọc',
      dataIndex: 'unreadCount',
      key: 'unreadCount',
      render: (unread: number) =>
        unread && unread > 0 ? (
          <Badge count={unread} overflowCount={99} />
        ) : (
          <Text type="secondary">0</Text>
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
  ];

  return (
    <Card
      title={
        <Space>
          <CommentOutlined style={{ color: '#1677ff' }} />
          <span>Danh sách Phòng Chat (Chat Rooms)</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRooms} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Tạo phòng mới
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

      <Modal
        title="Tạo Phòng Chat Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRoom}
          initialValues={{ type: 'GROUP' }}
        >
          <Form.Item
            name="name"
            label="Tên Phòng"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng chat!' }]}
          >
            <Input placeholder="Ví dụ: Nhóm CSKH Miền Bắc" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại Phòng"
            rules={[{ required: true, message: 'Vui lòng chọn loại phòng!' }]}
          >
            <Select
              options={[
                { label: 'Phòng Nhóm (GROUP)', value: 'GROUP' },
                { label: 'Phòng 1-1 (DIRECT)', value: 'DIRECT' },
              ]}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo phòng
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
