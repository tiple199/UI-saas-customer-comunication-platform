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
  Popconfirm,
  Tooltip,
  Tabs,
  Descriptions,
  Divider,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ApiOutlined,
  BankOutlined,
  KeyOutlined,
  CodeOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  SendOutlined,
  HistoryOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { channelApi } from '../../api/channel';
import { widgetApi } from '../../api/widget';
import { isSuccess } from '../../types/api';
import type {
  Channel,
  ChannelType,
  Conversation,
  ConversationMessage,
  CreateChannelRequest,
  UpdateChannelRequest,
  PublicWidgetConfig,
  WidgetHandshakeResponse,
} from '../../types/api';
import { useAuth } from '../../context/AuthContext';

const { Text, Paragraph } = Typography;

export const ChannelList: React.FC = () => {
  const { currentCompany } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);

  // State phân trang Server-side (/api/v1/channels/paged)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // State tra cứu theo Channel Key (/api/v1/channels/key/{channelKey})
  const [searchKeyText, setSearchKeyText] = useState('');
  const [searchingByKey, setSearchingByKey] = useState(false);

  // State Modal xem chi tiết kênh (/api/v1/channels/{id})
  const [detailChannel, setDetailChannel] = useState<Channel | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal tạo kênh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Modal sửa kênh
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editForm] = Form.useForm();
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Modal mã nhúng Widget & Simulator
  const [embedChannel, setEmbedChannel] = useState<Channel | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<PublicWidgetConfig | null>(null);
  const [loadingWidgetConfig, setLoadingWidgetConfig] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<WidgetHandshakeResponse | null>(null);
  const [handshaking, setHandshaking] = useState(false);
  const [handshakeForm] = Form.useForm();

  // State cho Restore Conversation & Customer Gửi Message trên Widget Simulator
  const [restoredConv, setRestoredConv] = useState<Conversation | null>(null);
  const [widgetMessages, setWidgetMessages] = useState<ConversationMessage[]>([]);
  const [restoringWidgetConv, setRestoringWidgetConv] = useState(false);
  const [widgetInputText, setWidgetInputText] = useState('');
  const [sendingWidgetMsg, setSendingWidgetMsg] = useState(false);

  // Loading state cho từng toggle AI Bot
  const [togglingAiId, setTogglingAiId] = useState<number | null>(null);

  const fetchChannels = async (targetPage = page, targetSize = pageSize) => {
    if (!currentCompany) {
      setChannels([]);
      setTotalElements(0);
      return;
    }
    try {
      setLoading(true);
      const res = await channelApi.getChannelsPaged(targetPage - 1, targetSize, currentCompany.id);
      if (isSuccess(res) && res.data) {
        setChannels(res.data.items || []);
        setTotalElements(res.data.totalElements || 0);
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
      setPage(1);
      fetchChannels(1, pageSize);
    } else {
      setChannels([]);
      setTotalElements(0);
    }
  }, [currentCompany?.id]);

  // Xem chi tiết kênh qua GET /api/v1/channels/{id}
  const handleViewChannelById = async (channelId: number) => {
    if (!currentCompany) return;
    try {
      setLoadingDetail(true);
      const res = await channelApi.getChannelById(channelId, currentCompany.id);
      if (isSuccess(res) && res.data) {
        setDetailChannel(res.data);
      } else {
        message.error(res.message || 'Không thể tải chi tiết kênh');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tải thông tin chi tiết kênh');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Tìm kiếm kênh theo Channel Key qua GET /api/v1/channels/key/{channelKey}
  const handleSearchByChannelKey = async () => {
    if (!currentCompany) return;
    const trimmed = searchKeyText.trim();
    if (!trimmed) {
      fetchChannels(1, pageSize);
      return;
    }
    try {
      setSearchingByKey(true);
      const res = await channelApi.getChannelByKey(trimmed, currentCompany.id);
      if (isSuccess(res) && res.data) {
        setDetailChannel(res.data);
        message.success(`Đã tìm thấy kênh "${res.data.name}"!`);
      } else {
        message.warning(res.message || 'Không tìm thấy kênh với mã khóa này');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không tìm thấy kênh với Channel Key đã nhập');
    } finally {
      setSearchingByKey(false);
    }
  };

  // Tự động tải cấu hình Public Widget khi mở Modal Mã nhúng
  const fetchPublicWidgetConfig = async (channelKey: string) => {
    try {
      setLoadingWidgetConfig(true);
      const res = await widgetApi.getWidgetConfig(channelKey);
      if (isSuccess(res) && res.data) {
        setWidgetConfig(res.data);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải cấu hình Public Widget');
    } finally {
      setLoadingWidgetConfig(false);
    }
  };

  const handleOpenEmbedModal = (channel: Channel) => {
    setEmbedChannel(channel);
    setWidgetConfig(null);
    setHandshakeResult(null);
    setRestoredConv(null);
    setWidgetMessages([]);
    setWidgetInputText('');
    handshakeForm.resetFields();
    fetchPublicWidgetConfig(channel.channelKey);
  };

  const handleRestoreWidgetConversation = async (channelKey: string, visitorToken: string) => {
    if (!channelKey || !visitorToken) {
      message.warning('Vui lòng thực hiện Handshake hoặc nhập Visitor Token trước!');
      return;
    }
    try {
      setRestoringWidgetConv(true);
      const res = await widgetApi.restoreConversation(channelKey, visitorToken);
      if (isSuccess(res) && res.data) {
        setRestoredConv(res.data.conversation);
        setWidgetMessages(res.data.messages || []);
        message.success(
          `Đã khôi phục hội thoại (${res.data.messages?.length || 0} tin nhắn lịch sử)!`
        );
      } else {
        message.error(res.message || 'Không thể khôi phục cuộc hội thoại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi khôi phục cuộc hội thoại từ Widget');
    } finally {
      setRestoringWidgetConv(false);
    }
  };

  const handleSendWidgetMessage = async () => {
    const token =
      handshakeResult?.visitorToken || handshakeForm.getFieldValue('visitorToken')?.trim();
    if (!embedChannel || !token) {
      message.warning('Vui lòng thực hiện Handshake trước khi gửi tin nhắn!');
      return;
    }
    const content = widgetInputText.trim();
    if (!content) return;

    try {
      setSendingWidgetMsg(true);
      const res = await widgetApi.sendMessage({
        channelKey: embedChannel.channelKey,
        visitorToken: token,
        content,
        messageType: 'TEXT',
      });
      if (isSuccess(res) && res.data) {
        setWidgetInputText('');
        setWidgetMessages((prev) => [...prev, res.data]);
        message.success('Khách hàng đã gửi tin nhắn thành công!');
      } else {
        message.error(res.message || 'Gửi tin nhắn thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi gửi tin nhắn từ Widget');
    } finally {
      setSendingWidgetMsg(false);
    }
  };

  const handleTestHandshake = async (values: { name?: string; email?: string; visitorToken?: string }) => {
    if (!embedChannel) return;
    try {
      setHandshaking(true);
      const res = await widgetApi.handshake({
        channelKey: embedChannel.channelKey,
        name: values.name || undefined,
        email: values.email || undefined,
        visitorToken: values.visitorToken || undefined,
      });
      if (isSuccess(res) && res.data) {
        setHandshakeResult(res.data);
        handshakeForm.setFieldValue('visitorToken', res.data.visitorToken);
        message.success('Kết nối Handshake thành công với Public Widget API!');
        // Tự động gọi Restore Conversation để lấy lịch sử tin nhắn hiện tại của Visitor
        handleRestoreWidgetConversation(embedChannel.channelKey, res.data.visitorToken);
      } else {
        message.error(res.message || 'Handshake thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi thực hiện Handshake Widget');
    } finally {
      setHandshaking(false);
    }
  };

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
        fetchChannels(page, pageSize);
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

  const handleEditChannel = async (values: UpdateChannelRequest) => {
    if (!currentCompany || !editingChannel) return;
    try {
      setSubmittingEdit(true);
      const res = await channelApi.updateChannel(editingChannel.id, values, currentCompany.id);
      if (isSuccess(res)) {
        message.success('Cập nhật kênh kết nối thành công!');
        setEditingChannel(null);
        fetchChannels(page, pageSize);
      } else {
        message.error(res.message || 'Cập nhật kênh thất bại!');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi cập nhật kênh kết nối');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Toggle AI Bot realtime
  const handleToggleAi = async (channel: Channel, checked: boolean) => {
    if (!currentCompany) return;
    try {
      setTogglingAiId(channel.id);
      const res = await channelApi.updateChannelAi(channel.id, checked, currentCompany.id);
      if (isSuccess(res)) {
        message.success(checked ? 'Đã bật AI Bot cho kênh này' : 'Đã tắt AI Bot');
        setChannels((prev) =>
          prev.map((c) => (c.id === channel.id ? { ...c, aiEnabled: checked } : c))
        );
      } else {
        message.error(res.message || 'Thao tác thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái AI');
    } finally {
      setTogglingAiId(null);
    }
  };

  // Tạo lại khóa kênh
  const handleRegenerateKey = async (channelId: number) => {
    if (!currentCompany) return;
    try {
      const res = await channelApi.regenerateChannelKey(channelId, currentCompany.id);
      if (isSuccess(res)) {
        message.success('Đã tạo lại khóa kết nối mới thành công!');
        fetchChannels(page, pageSize);
      } else {
        message.error(res.message || 'Tạo lại khóa thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tạo lại khóa');
    }
  };

  // Xóa kênh
  const handleDeleteChannel = async (channelId: number) => {
    if (!currentCompany) return;
    try {
      const res = await channelApi.deleteChannel(channelId, currentCompany.id);
      if (isSuccess(res)) {
        message.success('Đã xóa kênh kết nối');
        fetchChannels(page, pageSize);
      } else {
        message.error(res.message || 'Xóa kênh thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xóa kênh kết nối');
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
      width: 60,
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
      title: (
        <Space size={4}>
          <RobotOutlined style={{ color: '#1677ff' }} />
          <span>AI Bot</span>
        </Space>
      ),
      key: 'aiEnabled',
      render: (_: any, record: Channel) => (
        <Switch
          checked={!!record.aiEnabled}
          loading={togglingAiId === record.id}
          onChange={(checked) => handleToggleAi(record, checked)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
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
      render: (val: string) => (val ? new Date(val).toLocaleDateString('vi-VN') : '-'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Channel) => (
        <Space size={8}>
          {record.type === 'WEB' && (
            <Tooltip title="Xem mã nhúng & Kiểm thử Widget">
              <Button
                type="link"
                icon={<CodeOutlined />}
                onClick={() => handleOpenEmbedModal(record)}
                style={{ padding: 0 }}
              >
                Mã nhúng / Test
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Xem chi tiết kênh theo ID">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: '#10b981' }} />}
              onClick={() => handleViewChannelById(record.id)}
            />
          </Tooltip>

          <Tooltip title="Sửa tên kênh">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1677ff' }} />}
              onClick={() => {
                setEditingChannel(record);
                editForm.setFieldsValue({ name: record.name });
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Tạo lại khóa kết nối"
            description="Mã khóa cũ sẽ bị vô hiệu hóa, website nhúng sẽ cần cập nhật khóa mới. Bạn có chắc muốn tiếp tục?"
            onConfirm={() => handleRegenerateKey(record.id)}
            okText="Tạo mới"
            cancelText="Hủy"
          >
            <Tooltip title="Tạo lại khóa kết nối">
              <Button type="text" icon={<KeyOutlined style={{ color: '#faad14' }} />} />
            </Tooltip>
          </Popconfirm>

          <Popconfirm
            title="Xóa kênh kết nối"
            description={`Bạn có chắc muốn xóa kênh "${record.name}"?`}
            onConfirm={() => handleDeleteChannel(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa kênh">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
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

  const embedScript = embedChannel
    ? `<script 
  src="${window.location.origin}/widget.js" 
  data-channel-key="${embedChannel.channelKey}" 
  defer>
</script>`
    : '';

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
          <Space.Compact>
            <Input
              placeholder="Tra cứu theo Channel Key..."
              value={searchKeyText}
              onChange={(e) => setSearchKeyText(e.target.value)}
              onPressEnter={handleSearchByChannelKey}
              allowClear
              style={{ width: 220 }}
            />
            <Button
              icon={<SearchOutlined />}
              loading={searchingByKey}
              onClick={handleSearchByChannelKey}
            >
              Tra cứu
            </Button>
          </Space.Compact>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchChannels(page, pageSize)}
            loading={loading}
          >
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
        pagination={{
          current: page,
          pageSize: pageSize,
          total: totalElements,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} kênh`,
          onChange: (newPage, newSize) => {
            setPage(newPage);
            setPageSize(newSize);
            fetchChannels(newPage, newSize);
          },
        }}
        locale={{ emptyText: 'Chưa có kênh kết nối nào trong công ty này' }}
      />

      {/* Modal Xem Chi Tiết Kênh (GET /api/v1/channels/{id} & GET /api/v1/channels/key/{channelKey}) */}
      <Modal
        title={`Chi Tiết Kênh Kết Nối #${detailChannel?.id || ''}`}
        open={!!detailChannel || loadingDetail}
        onCancel={() => setDetailChannel(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailChannel(null)}>
            Đóng
          </Button>,
        ]}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spin tip="Đang tải chi tiết kênh..." />
          </div>
        ) : (
          detailChannel && (
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="ID Kênh">
                <Text code>{detailChannel.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tên Kênh">
                <Text strong>{detailChannel.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Loại Kênh">
                {getChannelTypeTag(detailChannel.type)}
              </Descriptions.Item>
              <Descriptions.Item label="Channel Key">
                <Text copyable code>
                  {detailChannel.channelKey}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng Thái">
                <Badge
                  status={detailChannel.status === 'ACTIVE' ? 'success' : 'default'}
                  text={detailChannel.status || 'ACTIVE'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="AI Bot Tự Động">
                <Tag color={detailChannel.aiEnabled ? 'green' : 'default'}>
                  {detailChannel.aiEnabled ? 'Đang bật (Enabled)' : 'Đang tắt (Disabled)'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Cấu Hình Bổ Sung (JSON)">
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {JSON.stringify(detailChannel.config || {}, null, 2)}
                </pre>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày Tạo">
                {detailChannel.createdAt
                  ? new Date(detailChannel.createdAt).toLocaleString('vi-VN')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          )
        )}
      </Modal>

      {/* Modal Tạo Kênh */}
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
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
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

      {/* Modal Sửa Tên Kênh */}
      <Modal
        title="Chỉnh Sửa Thông Tin Kênh"
        open={!!editingChannel}
        onCancel={() => setEditingChannel(null)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditChannel}>
          <Form.Item
            name="name"
            label="Tên Kênh"
            rules={[{ required: true, message: 'Vui lòng nhập tên kênh!' }]}
          >
            <Input placeholder="Tên kênh mới" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditingChannel(null)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submittingEdit}>
                Lưu thay đổi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Xem Mã Nhúng Web Widget & Kiểm thử Public Widget API */}
      <Modal
        title={`Tích Hợp Web Widget - ${embedChannel?.name}`}
        open={!!embedChannel}
        onCancel={() => setEmbedChannel(null)}
        width={650}
        footer={[
          <Button key="close" type="primary" onClick={() => setEmbedChannel(null)}>
            Đóng
          </Button>,
        ]}
      >
        <Tabs
          defaultActiveKey="code"
          items={[
            {
              key: 'code',
              label: (
                <Space>
                  <CodeOutlined />
                  <span>Mã Nhúng HTML</span>
                </Space>
              ),
              children: (
                <div>
                  <Paragraph type="secondary">
                    Dán đoạn mã dưới đây vào trước thẻ đóng <code>&lt;/body&gt;</code> trên website của bạn để hiển thị khung chat hỗ trợ khách hàng:
                  </Paragraph>
                  <Paragraph
                    copyable
                    code
                    style={{
                      padding: 14,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {embedScript}
                  </Paragraph>
                  <Alert
                    type="info"
                    showIcon
                    message="Khóa kênh kết nối (channelKey)"
                    description={
                      <div>
                        Mã khóa hiện tại: <Text code strong>{embedChannel?.channelKey}</Text>. Nếu mã này bị lộ, bạn có thể bấm nút Tạo lại khóa ở bảng quản lý.
                      </div>
                    }
                  />
                </div>
              ),
            },
            {
              key: 'simulator',
              label: (
                <Space>
                  <ThunderboltOutlined />
                  <span>Kiểm Thử Kết Nối (Live Simulator)</span>
                </Space>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>1. Cấu hình Public Widget (`GET /api/v1/public/widget/config`)</Text>
                      <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        loading={loadingWidgetConfig}
                        onClick={() => embedChannel && fetchPublicWidgetConfig(embedChannel.channelKey)}
                      >
                        Kiểm tra lại
                      </Button>
                    </Space>
                    {widgetConfig ? (
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="Tên hiển thị">{widgetConfig.name}</Descriptions.Item>
                        <Descriptions.Item label="AI Bot">
                          <Tag color={widgetConfig.aiEnabled ? 'green' : 'default'}>
                            {widgetConfig.aiEnabled ? 'Đang bật' : 'Đang tắt'}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Lời chào mở đầu" span={2}>
                          {widgetConfig.welcomeMessage}
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <Alert type="warning" message="Chưa tải được cấu hình Widget" />
                    )}
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      2. Giả lập Khách truy cập Handshake (`POST /api/v1/public/widget/handshake`)
                    </Text>
                    <Form
                      form={handshakeForm}
                      layout="vertical"
                      onFinish={handleTestHandshake}
                      size="small"
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item name="name" label="Tên khách hàng (tùy chọn)">
                          <Input placeholder="VD: Nguyễn Văn Khách" />
                        </Form.Item>
                        <Form.Item name="email" label="Email khách (tùy chọn)">
                          <Input placeholder="VD: khachhang@gmail.com" />
                        </Form.Item>
                      </div>
                      <Form.Item
                        name="visitorToken"
                        label="Visitor Token (để trống nếu là khách mới truy cập lần đầu)"
                      >
                        <Input placeholder="Token phiên khách truy cập cũ (nếu có)" />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<ThunderboltOutlined />}
                        loading={handshaking}
                      >
                        Gửi yêu cầu Handshake
                      </Button>
                    </Form>

                    {handshakeResult && (
                      <Alert
                        style={{ marginTop: 14 }}
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        message="Kết quả Handshake từ Backend (Visitor & Conversation)"
                        description={
                          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                            <div>
                              <strong>Visitor ID:</strong> <Text code>{handshakeResult.visitorId}</Text>{' '}
                              <Tag color={handshakeResult.isNewVisitor ? 'blue' : 'gold'}>
                                {handshakeResult.isNewVisitor ? 'Khách mới' : 'Khách quay lại'}
                              </Tag>
                            </div>
                            <div>
                              <strong>Visitor Token:</strong>{' '}
                              <Text copyable code>
                                {handshakeResult.visitorToken}
                              </Text>
                            </div>
                            <div>
                              <strong>Conversation ID:</strong>{' '}
                              <Text code>{handshakeResult.conversationId}</Text>{' '}
                              <Tag color="green">{handshakeResult.conversationStatus}</Tag>
                              <Tag color={handshakeResult.handlingMode === 'AI' ? 'purple' : 'cyan'}>
                                Chế độ: {handshakeResult.handlingMode}
                              </Tag>
                              <Tag color={handshakeResult.isNewConversation ? 'geekblue' : 'default'}>
                                {handshakeResult.isNewConversation ? 'Hội thoại mới' : 'Hội thoại tiếp tục'}
                              </Tag>
                            </div>
                            <div>
                              <strong>Lời chào:</strong> {handshakeResult.welcomeMessage}
                            </div>
                            <div>
                              <strong>Thời gian kết nối:</strong>{' '}
                              {new Date(handshakeResult.connectedAt).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        }
                      />
                    )}

                    <Divider style={{ margin: '14px 0' }} />

                    {/* 3 & 4. Khôi phục Conversation & Giả lập Customer gửi Message */}
                    <div>
                      <Space
                        style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}
                      >
                        <Text strong>
                          3. Khôi phục Hội thoại & Gửi tin nhắn (`restore` & `POST /messages`)
                        </Text>
                        <Button
                          size="small"
                          icon={<HistoryOutlined />}
                          loading={restoringWidgetConv}
                          onClick={() => {
                            const token =
                              handshakeResult?.visitorToken ||
                              handshakeForm.getFieldValue('visitorToken')?.trim();
                            if (embedChannel) {
                              handleRestoreWidgetConversation(embedChannel.channelKey, token);
                            }
                          }}
                        >
                          Restore Conversation
                        </Button>
                      </Space>

                      {restoredConv && (
                        <div style={{ marginBottom: 8, fontSize: 12 }}>
                          <Space wrap>
                            <Tag color="blue">Conversation #{restoredConv.id}</Tag>
                            <Tag color="green">Trạng thái: {restoredConv.status}</Tag>
                            <Tag color="purple">Xử lý: {restoredConv.handlingMode}</Tag>
                            <Text type="secondary">
                              Khách: {restoredConv.visitorName || 'Khách truy cập'}
                            </Text>
                          </Space>
                        </div>
                      )}

                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          background: '#f8fafc',
                          padding: 12,
                          maxHeight: 220,
                          overflowY: 'auto',
                          marginBottom: 10,
                        }}
                      >
                        {widgetMessages.length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '16px 0' }}>
                            <MessageOutlined style={{ fontSize: 20, marginBottom: 4 }} />
                            <div style={{ fontSize: 12 }}>
                              Chưa có tin nhắn nào. Hãy thực hiện Handshake và gửi tin nhắn bên dưới!
                            </div>
                          </div>
                        ) : (
                          widgetMessages.map((m) => {
                            const isVisitor = m.senderType === 'VISITOR';
                            return (
                              <div
                                key={m.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: isVisitor ? 'flex-end' : 'flex-start',
                                  marginBottom: 8,
                                }}
                              >
                                <div
                                  style={{
                                    maxWidth: '75%',
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    background: isVisitor ? '#1677ff' : '#fff',
                                    color: isVisitor ? '#fff' : '#1e293b',
                                    border: isVisitor ? 'none' : '1px solid #e2e8f0',
                                    fontSize: 13,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 10,
                                      opacity: 0.8,
                                      marginBottom: 2,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {m.senderType} #{m.senderId || ''}
                                  </div>
                                  <div>{m.content}</div>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      opacity: 0.7,
                                      textAlign: 'right',
                                      marginTop: 2,
                                    }}
                                  >
                                    {m.createdAt
                                      ? new Date(m.createdAt).toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : ''}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          placeholder="Nhập tin nhắn giả lập từ Khách hàng (Visitor)..."
                          value={widgetInputText}
                          onChange={(e) => setWidgetInputText(e.target.value)}
                          onPressEnter={handleSendWidgetMessage}
                          disabled={!handshakeResult && !handshakeForm.getFieldValue('visitorToken')}
                        />
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          loading={sendingWidgetMsg}
                          onClick={handleSendWidgetMessage}
                          disabled={!handshakeResult && !handshakeForm.getFieldValue('visitorToken')}
                        >
                          Customer Gửi
                        </Button>
                      </Space.Compact>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </Card>
  );
};
