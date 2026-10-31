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
  Switch,
  message,
  Typography,
  Badge,
  Alert,
} from 'antd';
import { PlusOutlined, ReloadOutlined, ApiOutlined, CheckCircleOutlined, BankOutlined } from '@ant-design/icons';
import { channelApi } from '../../api/channel';
import { isSuccess } from '../../types/api';
import type { Channel, ChannelType, CreateChannelRequest } from '../../types/api';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

export const ChannelList: React.FC = () => {
  const { currentCompany } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchChannels = async () => {
    if (!currentCompany) {
      setChannels([]);
      return;
    }
    try {
      setLoading(true);
      const res = await channelApi.getChannels(currentCompany.id);
      if (isSuccess(res) && res.data) {
        setChannels(res.data);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Không thể tải danh sách kênh kết nối';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany) {
      fetchChannels();
    } else {
      setChannels([]);
    }
  }, [currentCompany?.id]);

  const handleCreateChannel = async (values: CreateChannelRequest) => {
    if (!currentCompany) return;
    try {
      setSubmitting(true);
      const payload: CreateChannelRequest = {
        name: values.name,
        type: values.type,
        aiEnabled: !!values.aiEnabled,
        config: {},
      };
      const res = await channelApi.createChannel(payload, currentCompany.id);
      if (isSuccess(res)) {
        message.success(res.message || 'Tạo kênh kết nối thành công!');
        setIsModalOpen(false);
        form.resetFields();
        fetchChannels();
      } else {
        message.error(res.message || res.error || 'Tạo kênh thất bại!');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Lỗi khi tạo kênh kết nối';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getChannelTypeTag = (type: ChannelType) => {
    switch (type) {
      case 'WEB':
        return <Tag color="blue">WEB WIDGET</Tag>;
      case 'TELEGRAM':
        return <Tag color="cyan">TELEGRAM</Tag>;
      case 'FACEBOOK':
        return <Tag color="purple">FACEBOOK</Tag>;
      case 'ZALO':
        return <Tag color="geekblue">ZALO</Tag>;
      default:
        return <Tag>{type}</Tag>;
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
      title: 'Tên kênh',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Loại kênh',
      dataIndex: 'type',
      key: 'type',
      render: (type: ChannelType) => getChannelTypeTag(type),
    },
    {
      title: 'Channel Key',
      dataIndex: 'channelKey',
      key: 'channelKey',
      render: (key: string) => (
        <Text copyable code style={{ fontSize: 13 }}>
          {key}
        </Text>
      ),
    },
    {
      title: 'AI Bot',
      dataIndex: 'aiEnabled',
      key: 'aiEnabled',
      render: (enabled: boolean) =>
        enabled ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Bật
          </Tag>
        ) : (
          <Tag color="default">Tắt</Tag>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const isOnline = status === 'ACTIVE' || status === 'CONNECTING';
        return <Badge status={isOnline ? 'success' : 'default'} text={status || 'ACTIVE'} />;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => (val ? new Date(val).toLocaleString('vi-VN') : '-'),
    },
  ];

  if (!currentCompany) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Alert
          message="Bạn chưa có công ty hoạt động"
          description="Để tạo và quản lý các kênh giao tiếp (Website, Telegram, Zalo...), bạn cần tạo hoặc chọn một công ty trước. Vui lòng bấm nút 'Tạo' ở góc trên bên phải thanh tiêu đề."
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
          <ApiOutlined style={{ color: '#1677ff' }} />
          <span>Danh sách Kênh Giao Tiếp</span>
          <Tag color="geekblue">{currentCompany.name}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchChannels} loading={loading}>
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
            Tạo kênh mới
          </Button>
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <Table
        dataSource={channels}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Chưa có kênh kết nối nào trong công ty này' }}
      />

      <Modal
        title={`Tạo Kênh Mới cho ${currentCompany.name}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateChannel}
          initialValues={{ type: 'WEB', aiEnabled: false }}
        >
          <Form.Item
            name="name"
            label="Tên Kênh"
            rules={[{ required: true, message: 'Vui lòng nhập tên kênh!' }]}
          >
            <Input placeholder="Ví dụ: Website Hỗ trợ Khách hàng" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại Kênh"
            rules={[{ required: true, message: 'Vui lòng chọn loại kênh!' }]}
          >
            <Select
              options={[
                { label: 'Web Widget', value: 'WEB' },
                { label: 'Telegram Bot', value: 'TELEGRAM' },
                { label: 'Facebook Messenger', value: 'FACEBOOK' },
                { label: 'Zalo OA', value: 'ZALO' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="aiEnabled"
            label="Tự động kích hoạt AI Bot trả lời"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo kênh
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
