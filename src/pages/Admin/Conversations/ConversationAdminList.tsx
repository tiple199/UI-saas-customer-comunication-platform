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
  Modal,
  Descriptions,
  List,
  Avatar,
  Spin,
  Select,
  Form,
  InputNumber,
} from 'antd';
import {
  CustomerServiceOutlined,
  ReloadOutlined,
  UserOutlined,
  BankOutlined,
  WechatOutlined,
  EyeOutlined,
  HistoryOutlined,
  RobotOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { conversationApi } from '../../../api/conversation';
import { isSuccess } from '../../../types/api';
import type {
  Conversation,
  ConversationMessage,
  ConversationStatus,
  CreateConversationRequest,
  HandlingMode,
} from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';

const { Text } = Typography;

export const ConversationAdminList: React.FC = () => {
  const { currentCompany } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | undefined>(undefined);

  // Modal xem chi tiết & lịch sử tin nhắn
  const [detailConv, setDetailConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<ConversationMessage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  // Modal tạo Conversation thủ công (POST /api/v1/conversations)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm();

  const fetchConversations = async (
    targetPage = page,
    targetSize = pageSize,
    targetStatus = statusFilter
  ) => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const res = await conversationApi.getConversationsPaged(
        targetPage - 1,
        targetSize,
        targetStatus,
        currentCompany.id
      );
      if (isSuccess(res) && res.data) {
        setConversations(res.data.items || []);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách hội thoại khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany) {
      setPage(1);
      fetchConversations(1, pageSize, statusFilter);
    } else {
      setConversations([]);
      setTotalElements(0);
    }
  }, [currentCompany?.id, statusFilter]);

  const handleViewDetail = async (conv: Conversation) => {
    if (!currentCompany) return;
    setDetailConv(conv);
    setConvMessages([]);
    try {
      setLoadingDetail(true);
      const [infoRes, msgRes] = await Promise.all([
        conversationApi.getConversationById(conv.id, currentCompany.id),
        conversationApi.getConversationMessages(conv.id, currentCompany.id),
      ]);
      if (isSuccess(infoRes) && infoRes.data) {
        setDetailConv(infoRes.data);
      }
      if (isSuccess(msgRes) && msgRes.data) {
        setConvMessages(msgRes.data);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tải chi tiết cuộc hội thoại');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRestoreConversation = async (convId: number) => {
    if (!currentCompany) return;
    try {
      setRestoringId(convId);
      const res = await conversationApi.restoreConversation(convId, currentCompany.id);
      if (isSuccess(res) && res.data) {
        message.success('Đã khôi phục (mở lại) cuộc hội thoại thành công!');
        if (detailConv?.id === convId) {
          setDetailConv(res.data.conversation);
          setConvMessages(res.data.messages || []);
        }
        fetchConversations(page, pageSize, statusFilter);
      } else {
        message.error(res.message || 'Khôi phục thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi khôi phục cuộc hội thoại');
    } finally {
      setRestoringId(null);
    }
  };

  const handleCreateConversation = async (values: CreateConversationRequest) => {
    if (!currentCompany) return;
    try {
      setCreating(true);
      const res = await conversationApi.createConversation(values, currentCompany.id);
      if (isSuccess(res) && res.data) {
        message.success(`Đã tạo/lấy cuộc hội thoại #${res.data.id} thành công!`);
        setIsCreateModalOpen(false);
        createForm.resetFields();
        fetchConversations(1, pageSize, statusFilter);
      } else {
        message.error(res.message || 'Tạo cuộc hội thoại thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tạo cuộc hội thoại');
    } finally {
      setCreating(false);
    }
  };

  const getStatusTag = (status: ConversationStatus) => {
    switch (status) {
      case 'OPEN':
        return <Tag color="green">ĐANG MỞ (OPEN)</Tag>;
      case 'PENDING':
        return <Tag color="gold">CHỜ XỬ LÝ (PENDING)</Tag>;
      case 'RESOLVED':
        return <Tag color="blue">ĐÃ GIẢI QUYẾT (RESOLVED)</Tag>;
      case 'CLOSED':
        return <Tag color="default">ĐÃ ĐÓNG (CLOSED)</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getHandlingModeTag = (mode: HandlingMode) =>
    mode === 'AI' ? (
      <Tag color="purple" icon={<RobotOutlined />}>
        AI BOT
      </Tag>
    ) : (
      <Tag color="cyan" icon={<UserOutlined />}>
        NHÂN VIÊN (HUMAN)
      </Tag>
    );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Khách hàng (Visitor)',
      key: 'visitor',
      render: (_: any, record: Conversation) => (
        <div>
          <Text strong>{record.visitorName || `Visitor #${record.visitorId}`}</Text>
          {record.visitorEmail && (
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.visitorEmail}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Kênh kết nối',
      key: 'channel',
      render: (_: any, record: Conversation) => (
        <Tag color="geekblue">{record.channelName || `Channel #${record.channelId}`}</Tag>
      ),
    },
    {
      title: 'Chế độ xử lý',
      dataIndex: 'handlingMode',
      key: 'handlingMode',
      render: (mode: HandlingMode) => getHandlingModeTag(mode),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: ConversationStatus) => getStatusTag(status),
    },
    {
      title: 'Cập nhật lúc',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (val: string) => (val ? new Date(val).toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Conversation) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem tin nhắn
          </Button>
          {record.status !== 'OPEN' && (
            <Button
              type="link"
              icon={<HistoryOutlined />}
              loading={restoringId === record.id}
              onClick={() => handleRestoreConversation(record.id)}
            >
              Restore
            </Button>
          )}
          <Button
            type="link"
            icon={<WechatOutlined />}
            onClick={() => {
              if (currentCompany) {
                sessionStorage.setItem(
                  `active_customer_conv_${currentCompany.id}`,
                  String(record.id)
                );
                sessionStorage.setItem(`chat_sidebar_tab_${currentCompany.id}`, 'customers');
              }
              navigate('/chat');
            }}
          >
            Mở tại Workspace
          </Button>
        </Space>
      ),
    },
  ];

  if (!currentCompany) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Alert
          message="Bạn chưa có công ty hoạt động"
          description="Vui lòng tạo hoặc chọn một công ty ở thanh menu trên cùng để xem hội thoại khách hàng."
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
          <CustomerServiceOutlined style={{ color: '#1677ff' }} />
          <span>Hội Thoại Khách Hàng (Customer Conversations)</span>
          <Tag color="geekblue">{currentCompany.name}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 190 }}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { label: 'Đang mở (OPEN)', value: 'OPEN' },
              { label: 'Chờ xử lý (PENDING)', value: 'PENDING' },
              { label: 'Đã giải quyết (RESOLVED)', value: 'RESOLVED' },
              { label: 'Đã đóng (CLOSED)', value: 'CLOSED' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchConversations(page, pageSize, statusFilter)}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.resetFields();
              setIsCreateModalOpen(true);
            }}
          >
            Tạo hội thoại
          </Button>
          <Button
            type="primary"
            icon={<WechatOutlined />}
            onClick={() => {
              sessionStorage.setItem(`chat_sidebar_tab_${currentCompany.id}`, 'customers');
              navigate('/chat');
            }}
            style={{ background: '#10b981', borderColor: '#10b981' }}
          >
            Hộp Thư Hỗ Trợ
          </Button>
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <Table
        dataSource={conversations}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: totalElements,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} cuộc hội thoại`,
          onChange: (newPage, newSize) => {
            setPage(newPage);
            setPageSize(newSize);
            fetchConversations(newPage, newSize, statusFilter);
          },
        }}
        locale={{ emptyText: 'Chưa có cuộc hội thoại khách hàng nào' }}
      />

      {/* Modal Xem Chi Tiết & Lịch Sử Tin Nhắn */}
      <Modal
        title={`Chi Tiết Hội Thoại Khách Hàng #${detailConv?.id || ''}`}
        open={!!detailConv}
        onCancel={() => setDetailConv(null)}
        width={620}
        footer={[
          detailConv && detailConv.status !== 'OPEN' ? (
            <Button
              key="restore"
              icon={<HistoryOutlined />}
              loading={restoringId === detailConv.id}
              onClick={() => handleRestoreConversation(detailConv.id)}
            >
              Khôi phục về OPEN
            </Button>
          ) : null,
          <Button key="close" type="primary" onClick={() => setDetailConv(null)}>
            Đóng
          </Button>,
        ]}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spin tip="Đang tải chi tiết và lịch sử tin nhắn..." />
          </div>
        ) : (
          detailConv && (
            <div>
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Khách hàng">
                  <Text strong>{detailConv.visitorName || `Visitor #${detailConv.visitorId}`}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {detailConv.visitorEmail || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Kênh">
                  {detailConv.channelName || `Channel #${detailConv.channelId}`}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(detailConv.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Chế độ xử lý">
                  {getHandlingModeTag(detailConv.handlingMode)}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lúc">
                  {detailConv.updatedAt
                    ? new Date(detailConv.updatedAt).toLocaleString('vi-VN')
                    : '-'}
                </Descriptions.Item>
              </Descriptions>

              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Lịch sử tin nhắn ({convMessages.length})
              </Text>
              <List
                bordered
                size="small"
                style={{ maxHeight: 280, overflowY: 'auto', background: '#f8fafc' }}
                dataSource={convMessages}
                locale={{ emptyText: 'Chưa có tin nhắn nào trong cuộc hội thoại này' }}
                renderItem={(msg) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size="small"
                          style={{
                            backgroundColor:
                              msg.senderType === 'VISITOR'
                                ? '#f59e0b'
                                : msg.senderType === 'AI'
                                ? '#722ed1'
                                : '#1677ff',
                          }}
                          icon={msg.senderType === 'AI' ? <RobotOutlined /> : <UserOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <Tag
                            color={
                              msg.senderType === 'VISITOR'
                                ? 'orange'
                                : msg.senderType === 'AI'
                                ? 'purple'
                                : 'blue'
                            }
                          >
                            {msg.senderType}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleString('vi-VN')
                              : ''}
                          </Text>
                        </Space>
                      }
                      description={<Text style={{ color: '#1e293b' }}>{msg.content}</Text>}
                    />
                  </List.Item>
                )}
              />
            </div>
          )
        )}
      </Modal>

      {/* Modal Tạo Cuộc Hội Thoại (POST /api/v1/conversations) */}
      <Modal
        title="Khởi Tạo Cuộc Hội Thoại Khách Hàng"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateConversation}>
          <Form.Item
            name="channelId"
            label="Channel ID (ID Kênh đang hoạt động)"
            rules={[{ required: true, message: 'Vui lòng nhập Channel ID!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="Ví dụ: 1" />
          </Form.Item>
          <Form.Item
            name="visitorId"
            label="Visitor ID (ID Khách truy cập)"
            rules={[{ required: true, message: 'Vui lòng nhập Visitor ID!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="Ví dụ: 1" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={creating}>
                Tạo hội thoại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

