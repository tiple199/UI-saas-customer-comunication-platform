import React, { useEffect, useState, useRef } from 'react';
import {
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Avatar,
  Badge,
  Tabs,
  List,
  Typography,
  message,
  Empty,
  Spin,
  Alert,
  Dropdown,
  Drawer,
  Popconfirm,
  Divider,
  Segmented,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SendOutlined,
  PlusOutlined,
  ReloadOutlined,
  MessageOutlined,
  BankOutlined,
  SearchOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  MessageFilled,
  UserAddOutlined,
  DeleteOutlined,
  CustomerServiceOutlined,
  RobotOutlined,
  HistoryOutlined,
  DownOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { chatRoomApi } from '../../api/chatRoom';
import { companyApi } from '../../api/company';
import { conversationApi } from '../../api/conversation';
import { isSuccess } from '../../types/api';
import type {
  ChatRoom,
  ChatRoomMember,
  CompanyMember,
  Conversation,
  ConversationMessage,
  ConversationStatus,
  InternalMessage,
} from '../../types/api';
import { useAuth } from '../../context/AuthContext';

const { Text, Title } = Typography;

export const ChatWorkspacePage: React.FC = () => {
  const { user, logout, companies, currentCompany, switchCompany, createNewCompany } = useAuth();
  const navigate = useNavigate();

  // State phòng chat
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // State tin nhắn trong phòng active
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [sending, setSending] = useState(false);

  // State danh sách đồng nghiệp công ty
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchMemberText, setSearchMemberText] = useState('');

  // State Drawer quản lý thành viên phòng chat
  const [isRoomMembersOpen, setIsRoomMembersOpen] = useState(false);
  const [roomMembers, setRoomMembers] = useState<ChatRoomMember[]>([]);
  const [loadingRoomMembers, setLoadingRoomMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState<number[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  // State Modal tạo nhóm
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [groupForm] = Form.useForm();

  // State Modal Tạo công ty
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [submittingCompany, setSubmittingCompany] = useState(false);
  const [companyForm] = Form.useForm();

  // Tab sidebar: 'customers' (Hội thoại khách hàng), 'chats' (Phòng nội bộ), 'members' (Đồng nghiệp)
  const [sidebarTab, setSidebarTab] = useState<'customers' | 'chats' | 'members'>('customers');

  // State Hội thoại khách hàng (Customer Conversations)
  const [customerConvs, setCustomerConvs] = useState<Conversation[]>([]);
  const [activeCustomerConv, setActiveCustomerConv] = useState<Conversation | null>(null);
  const [loadingCustomerConvs, setLoadingCustomerConvs] = useState(false);
  const [customerStatusFilter, setCustomerStatusFilter] = useState<ConversationStatus | undefined>(
    undefined
  );
  const [customerMessages, setCustomerMessages] = useState<ConversationMessage[]>([]);
  const [loadingCustomerMessages, setLoadingCustomerMessages] = useState(false);
  const [restoringCustomerConv, setRestoringCustomerConv] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRooms = async () => {
    if (!currentCompany) return;
    try {
      setLoadingRooms(true);
      const res = await chatRoomApi.getMyChatRooms(currentCompany.id);
      if (isSuccess(res) && res.data) {
        setRooms(res.data);
        if (activeRoom) {
          const updated = res.data.find((r) => r.id === activeRoom.id);
          if (updated) setActiveRoom(updated);
        } else if (res.data.length > 0) {
          const savedRoomId = sessionStorage.getItem(`active_room_${currentCompany.id}`);
          const targetRoom = savedRoomId
            ? res.data.find((r) => String(r.id) === savedRoomId) || res.data[0]
            : res.data[0];
          if (targetRoom) {
            setActiveRoom(targetRoom);
            fetchMessages(targetRoom.id);
          }
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách phòng chat');
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMembers = async () => {
    if (!currentCompany) return;
    try {
      setLoadingMembers(true);
      const res = await companyApi.getCompanyMembers(currentCompany.id);
      if (isSuccess(res) && res.data) {
        setMembers(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchCustomerConversations = async (status = customerStatusFilter) => {
    if (!currentCompany) return;
    try {
      setLoadingCustomerConvs(true);
      const res = await conversationApi.getConversationsPaged(0, 50, status, currentCompany.id);
      if (isSuccess(res) && res.data) {
        const list = res.data.items || [];
        setCustomerConvs(list);
        if (activeCustomerConv) {
          const updated = list.find((c) => c.id === activeCustomerConv.id);
          if (updated) setActiveCustomerConv(updated);
        } else if (list.length > 0) {
          const savedConvId = sessionStorage.getItem(`active_customer_conv_${currentCompany.id}`);
          const targetConv = savedConvId
            ? list.find((c) => String(c.id) === savedConvId) || list[0]
            : list[0];
          if (targetConv) {
            setActiveCustomerConv(targetConv);
            fetchCustomerMessages(targetConv.id);
          }
        }
      }
    } catch (err: any) {
      message.error(
        err.response?.data?.message || 'Không thể tải danh sách cuộc hội thoại khách hàng'
      );
    } finally {
      setLoadingCustomerConvs(false);
    }
  };

  const fetchCustomerMessages = async (conversationId: number) => {
    if (!currentCompany) return;
    try {
      setLoadingCustomerMessages(true);
      const [convRes, msgRes] = await Promise.all([
        conversationApi.getConversationById(conversationId, currentCompany.id),
        conversationApi.getConversationMessages(conversationId, currentCompany.id),
      ]);
      if (isSuccess(convRes) && convRes.data) {
        setActiveCustomerConv(convRes.data);
      }
      if (isSuccess(msgRes) && msgRes.data) {
        setCustomerMessages(msgRes.data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tải tin nhắn của khách hàng');
    } finally {
      setLoadingCustomerMessages(false);
    }
  };

  const handleSelectCustomerConv = (conv: Conversation) => {
    setActiveCustomerConv(conv);
    if (currentCompany) {
      sessionStorage.setItem(`active_customer_conv_${currentCompany.id}`, String(conv.id));
    }
    fetchCustomerMessages(conv.id);
  };

  const handleRestoreCustomerConv = async () => {
    if (!activeCustomerConv || !currentCompany) return;
    try {
      setRestoringCustomerConv(true);
      const res = await conversationApi.restoreConversation(
        activeCustomerConv.id,
        currentCompany.id
      );
      if (isSuccess(res) && res.data) {
        message.success('Đã khôi phục cuộc hội thoại về trạng thái OPEN!');
        if (res.data.conversation) {
          setActiveCustomerConv(res.data.conversation);
        }
        setCustomerMessages(res.data.messages || []);
        fetchCustomerConversations(customerStatusFilter);
      } else {
        message.error(res.message || 'Khôi phục cuộc hội thoại thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi khôi phục cuộc hội thoại');
    } finally {
      setRestoringCustomerConv(false);
    }
  };

  const fetchMessages = async (roomId: number) => {
    if (!currentCompany) return;
    try {
      setLoadingMessages(true);
      const res = await chatRoomApi.getChatRoomMessages(roomId, 0, 100, currentCompany.id);
      if (isSuccess(res) && res.data) {
        const list = (res.data.items || []).slice().reverse();
        setMessages(list);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tải tin nhắn');
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchRoomMembers = async (roomId: number) => {
    if (!currentCompany) return;
    try {
      setLoadingRoomMembers(true);
      const res = await chatRoomApi.getChatRoomMembers(roomId, currentCompany.id);
      if (isSuccess(res) && res.data) {
        setRoomMembers(res.data);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách thành viên phòng');
    } finally {
      setLoadingRoomMembers(false);
    }
  };

  const handleOpenRoomMembers = () => {
    if (!activeRoom) return;
    setIsRoomMembersOpen(true);
    setSelectedNewMembers([]);
    fetchRoomMembers(activeRoom.id);
  };

  const handleAddRoomMembers = async () => {
    if (!activeRoom || !currentCompany || selectedNewMembers.length === 0) return;
    try {
      setAddingMembers(true);
      const res = await chatRoomApi.addMembers(activeRoom.id, selectedNewMembers, currentCompany.id);
      if (isSuccess(res)) {
        message.success('Đã thêm thành viên vào nhóm chat!');
        setSelectedNewMembers([]);
        fetchRoomMembers(activeRoom.id);
      } else {
        message.error(res.message || 'Thêm thành viên thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi thêm thành viên vào nhóm');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveRoomMember = async (targetUserId: number) => {
    if (!activeRoom || !currentCompany) return;
    try {
      const res = await chatRoomApi.removeMember(activeRoom.id, targetUserId, currentCompany.id);
      if (isSuccess(res)) {
        if (targetUserId === user?.id) {
          message.success('Bạn đã rời khỏi nhóm chat');
          setIsRoomMembersOpen(false);
          setActiveRoom(null);
          setMessages([]);
          fetchRooms();
        } else {
          message.success('Đã xóa thành viên khỏi nhóm chat');
          fetchRoomMembers(activeRoom.id);
        }
      } else {
        message.error(res.message || 'Xóa thành viên thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xóa thành viên khỏi phòng');
    }
  };

  useEffect(() => {
    if (currentCompany) {
      const savedTab = sessionStorage.getItem(`chat_sidebar_tab_${currentCompany.id}`) as
        | 'customers'
        | 'chats'
        | 'members'
        | null;
      if (savedTab) {
        setSidebarTab(savedTab);
      }
      setActiveRoom(null);
      setMessages([]);
      setActiveCustomerConv(null);
      setCustomerMessages([]);
      fetchCustomerConversations(customerStatusFilter);
      fetchRooms();
      fetchMembers();
    } else {
      setRooms([]);
      setMembers([]);
      setCustomerConvs([]);
      setActiveRoom(null);
      setActiveCustomerConv(null);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (currentCompany) {
      fetchCustomerConversations(customerStatusFilter);
    }
  }, [customerStatusFilter]);

  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room);
    if (currentCompany) {
      sessionStorage.setItem(`active_room_${currentCompany.id}`, String(room.id));
    }
    fetchMessages(room.id);
    chatRoomApi.markAsRead(room.id, currentCompany?.id).catch(() => {});
  };

  const handleStartDirectChat = async (targetUserId: number) => {
    if (!currentCompany) return;
    try {
      setLoadingRooms(true);
      const res = await chatRoomApi.getOrCreateDirectRoom(targetUserId, currentCompany.id);
      if (isSuccess(res) && res.data) {
        const room = res.data;
        setRooms((prev) => {
          const exists = prev.some((r) => r.id === room.id);
          return exists ? prev : [room, ...prev];
        });
        setActiveRoom(room);
        sessionStorage.setItem(`active_room_${currentCompany.id}`, String(room.id));
        setSidebarTab('chats');
        fetchMessages(room.id);
      } else {
        message.error(res.message || 'Không thể mở phòng chat');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi mở cuộc trò chuyện');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeRoom || !inputContent.trim() || !currentCompany) return;
    const textToSend = inputContent.trim();
    setInputContent('');
    try {
      setSending(true);
      const res = await chatRoomApi.sendMessage(
        activeRoom.id,
        {
          content: textToSend,
          messageType: 'TEXT',
        },
        currentCompany.id
      );
      if (isSuccess(res) && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setTimeout(scrollToBottom, 50);
      } else {
        message.error(res.message || 'Gửi tin nhắn thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleCreateGroup = async (values: { name: string; memberUserIds?: number[] }) => {
    if (!currentCompany) return;
    try {
      setSubmittingGroup(true);
      const res = await chatRoomApi.createChatRoom(
        {
          name: values.name,
          type: 'GROUP',
          memberUserIds: values.memberUserIds || [],
        },
        currentCompany.id
      );
      if (isSuccess(res) && res.data) {
        message.success(`Đã tạo nhóm "${res.data.name}" thành công!`);
        setIsGroupModalOpen(false);
        groupForm.resetFields();
        setRooms((prev) => [res.data, ...prev]);
        setActiveRoom(res.data);
        sessionStorage.setItem(`active_room_${currentCompany.id}`, String(res.data.id));
        setSidebarTab('chats');
        fetchMessages(res.data.id);
      } else {
        message.error(res.message || 'Tạo nhóm thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tạo nhóm chat');
    } finally {
      setSubmittingGroup(false);
    }
  };

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

  const filteredMembers = members.filter(
    (m) =>
      m.fullName?.toLowerCase().includes(searchMemberText.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchMemberText.toLowerCase())
  );

  // Danh sách đồng nghiệp chưa có trong phòng nhóm hiện tại
  const availableColleaguesToAdd = members.filter(
    (m) => !roomMembers.some((rm) => rm.userId === m.userId)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f0f2f5' }}>
      {/* Top Header của Chat Workspace */}
      <div
        style={{
          height: 56,
          background: '#001529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          zIndex: 10,
        }}
      >
        <Space size={16} align="center">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageFilled style={{ fontSize: 18, color: '#fff' }} />
          </div>
          <Text strong style={{ color: '#fff', fontSize: 16 }}>
            Chat Workspace
          </Text>

          {/* Chọn công ty */}
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
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setIsCompanyModalOpen(true)}
              >
                Tạo Công Ty Mới
              </Button>
            )}
          </Space>
        </Space>

        <Space size={14} align="center">
          {/* Nút quay lại trang quản trị: Chỉ hiển thị cho OWNER / ADMIN (hoặc khi chưa có công ty) */}
          {(!currentCompany ||
            currentCompany.userRole === 'OWNER' ||
            currentCompany.userRole === 'ADMIN') && (
            <Button
              type="default"
              icon={<AppstoreOutlined />}
              onClick={() => navigate('/admin/channels')}
              style={{ fontWeight: 500 }}
            >
              Về Trang Quản Trị
            </Button>
          )}

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer', padding: '4px 6px' }}>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                {user?.fullName?.charAt(0).toUpperCase()}
              </Avatar>
              <Text style={{ color: '#fff', fontSize: 13 }}>{user?.fullName || user?.email}</Text>
            </Space>
          </Dropdown>
        </Space>
      </div>

      {/* Main Chat Content */}
      <div style={{ flex: 1, padding: 12, overflow: 'hidden' }}>
        {!currentCompany ? (
          <Alert
            message="Bạn chưa chọn hoặc chưa có công ty hoạt động"
            description="Vui lòng bấm 'Tạo' ở trên thanh menu để bắt đầu trải nghiệm ứng dụng Chat."
            type="warning"
            showIcon
            icon={<BankOutlined />}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              height: '100%',
              background: '#fff',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* CỘT TRÁI: SIDEBAR */}
            <div
              style={{
                width: 350,
                borderRight: '1px solid #f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                background: '#fafafa',
              }}
            >
              <div
                style={{
                  padding: '14px 16px 12px',
                  borderBottom: '1px solid #f0f0f0',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <Title level={5} style={{ margin: 0, fontSize: 15 }}>
                      {sidebarTab === 'customers' ? 'Hỗ Trợ Khách Hàng' : 'Trò Chuyện Nội Bộ'}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {currentCompany.name}
                    </Text>
                  </div>
                  <Space size={6}>
                    {sidebarTab !== 'customers' && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          groupForm.resetFields();
                          setIsGroupModalOpen(true);
                        }}
                      >
                        Tạo nhóm
                      </Button>
                    )}
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        fetchCustomerConversations(customerStatusFilter);
                        fetchRooms();
                        fetchMembers();
                      }}
                    />
                  </Space>
                </div>

                {/* Chuyển đổi nhanh giữa Hỗ trợ Khách hàng và Chat Nội bộ (không bị tràn dấu ...) */}
                <Segmented
                  block
                  value={sidebarTab === 'customers' ? 'customers' : 'internal'}
                  onChange={(val) => {
                    const nextTab = val === 'customers' ? 'customers' : 'chats';
                    setSidebarTab(nextTab);
                    if (currentCompany) {
                      sessionStorage.setItem(`chat_sidebar_tab_${currentCompany.id}`, nextTab);
                    }
                  }}
                  options={[
                    {
                      value: 'customers',
                      label: (
                        <Space size={6}>
                          <CustomerServiceOutlined />
                          <span>Khách hàng ({customerConvs.length})</span>
                        </Space>
                      ),
                    },
                    {
                      value: 'internal',
                      label: (
                        <Space size={6}>
                          <MessageOutlined />
                          <span>Nội bộ ({rooms.length})</span>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>

              {/* Nếu đang ở chế độ Nội bộ thì hiển thị 2 tab Hội thoại / Đồng nghiệp rộng rãi */}
              {sidebarTab !== 'customers' ? (
                <div
                  style={{
                    padding: '0 16px',
                    background: '#fff',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <Tabs
                    activeKey={sidebarTab}
                    onChange={(key) => {
                      const nextTab = key as 'chats' | 'members';
                      setSidebarTab(nextTab);
                      if (currentCompany) {
                        sessionStorage.setItem(`chat_sidebar_tab_${currentCompany.id}`, nextTab);
                      }
                    }}
                    items={[
                      {
                        key: 'chats',
                        label: (
                          <Space size={6}>
                            <MessageOutlined />
                            <span>Hội thoại ({rooms.length})</span>
                          </Space>
                        ),
                      },
                      {
                        key: 'members',
                        label: (
                          <Space size={6}>
                            <TeamOutlined />
                            <span>Đồng nghiệp ({members.length})</span>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#fff',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <Select
                    placeholder="Lọc theo trạng thái hội thoại (Tất cả)"
                    allowClear
                    style={{ width: '100%' }}
                    value={customerStatusFilter}
                    onChange={(val) => setCustomerStatusFilter(val)}
                    options={[
                      { label: 'Đang mở (OPEN)', value: 'OPEN' },
                      { label: 'Chờ xử lý (PENDING)', value: 'PENDING' },
                      { label: 'Đã giải quyết (RESOLVED)', value: 'RESOLVED' },
                      { label: 'Đã đóng (CLOSED)', value: 'CLOSED' },
                    ]}
                  />
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {sidebarTab === 'customers' ? (
                  <div>

                    {loadingCustomerConvs ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin tip="Đang tải hội thoại khách hàng..." />
                      </div>
                    ) : customerConvs.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Chưa có cuộc hội thoại khách hàng nào"
                        style={{ marginTop: 40 }}
                      />
                    ) : (
                      <List
                        dataSource={customerConvs}
                        renderItem={(conv) => {
                          const isSelected = activeCustomerConv?.id === conv.id;
                          return (
                            <List.Item
                              onClick={() => handleSelectCustomerConv(conv)}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderRadius: 8,
                                marginBottom: 4,
                                border: 'none',
                                background: isSelected ? '#e6f4ff' : 'transparent',
                                transition: 'all 0.2s',
                              }}
                            >
                              <List.Item.Meta
                                avatar={
                                  <Avatar
                                    style={{
                                      backgroundColor:
                                        conv.handlingMode === 'AI' ? '#722ed1' : '#f59e0b',
                                    }}
                                    icon={<CustomerServiceOutlined />}
                                  />
                                }
                                title={
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Text strong style={{ fontSize: 13, maxWidth: 145 }} ellipsis>
                                      {conv.visitorName || `Visitor #${conv.visitorId}`}
                                    </Text>
                                    <Tag
                                      color={
                                        conv.status === 'OPEN'
                                          ? 'green'
                                          : conv.status === 'RESOLVED'
                                          ? 'blue'
                                          : 'default'
                                      }
                                      style={{
                                        fontSize: 10,
                                        margin: 0,
                                        padding: '0 4px',
                                        lineHeight: '18px',
                                      }}
                                    >
                                      {conv.status}
                                    </Tag>
                                  </div>
                                }
                                description={
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      fontSize: 11,
                                    }}
                                  >
                                    <Text type="secondary" ellipsis style={{ maxWidth: 140 }}>
                                      {conv.channelName || `Kênh #${conv.channelId}`} •{' '}
                                      {conv.handlingMode}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      {conv.updatedAt
                                        ? new Date(conv.updatedAt).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : ''}
                                    </Text>
                                  </div>
                                }
                              />
                            </List.Item>
                          );
                        }}
                      />
                    )}
                  </div>
                ) : sidebarTab === 'chats' ? (
                  loadingRooms ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Spin tip="Đang tải..." />
                    </div>
                  ) : rooms.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có cuộc trò chuyện nào"
                      style={{ marginTop: 40 }}
                    >
                      <Button size="small" type="primary" onClick={() => setSidebarTab('members')}>
                        Nhắn tin với đồng nghiệp
                      </Button>
                    </Empty>
                  ) : (
                    <List
                      dataSource={rooms}
                      renderItem={(room) => {
                        const isSelected = activeRoom?.id === room.id;
                        const isGroup = room.type === 'GROUP';
                        return (
                          <List.Item
                            onClick={() => handleSelectRoom(room)}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderRadius: 8,
                              marginBottom: 4,
                              border: 'none',
                              background: isSelected ? '#e6f4ff' : 'transparent',
                              transition: 'all 0.2s',
                            }}
                          >
                            <List.Item.Meta
                              avatar={
                                <Badge count={room.unreadCount || 0} size="small">
                                  <Avatar
                                    style={{
                                      backgroundColor: isGroup ? '#722ed1' : '#1677ff',
                                    }}
                                    icon={isGroup ? <TeamOutlined /> : <UserOutlined />}
                                  >
                                    {!isGroup && room.name ? room.name.charAt(0).toUpperCase() : null}
                                  </Avatar>
                                </Badge>
                              }
                              title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text strong style={{ fontSize: 13, maxWidth: 170 }} ellipsis>
                                    {room.name || 'Chat 1-1'}
                                  </Text>
                                  <Tag
                                    color={isGroup ? 'purple' : 'green'}
                                    style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '18px' }}
                                  >
                                    {isGroup ? 'NHÓM' : '1-1'}
                                  </Tag>
                                </div>
                              }
                              description={
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {room.updatedAt
                                    ? new Date(room.updatedAt).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'Vừa xong'}
                                </Text>
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  )
                ) : (
                  <div>
                    <Input
                      placeholder="Tìm đồng nghiệp..."
                      prefix={<SearchOutlined style={{ color: '#aaa' }} />}
                      value={searchMemberText}
                      onChange={(e) => setSearchMemberText(e.target.value)}
                      allowClear
                      style={{ marginBottom: 10 }}
                    />

                    {loadingMembers ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin tip="Đang tải đồng nghiệp..." />
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy" />
                    ) : (
                      <List
                        dataSource={filteredMembers}
                        renderItem={(member) => {
                          const isMe = member.userId === user?.id;
                          return (
                            <List.Item
                              style={{
                                padding: '10px 12px',
                                borderRadius: 8,
                                marginBottom: 4,
                                border: 'none',
                                background: '#fff',
                              }}
                              actions={
                                isMe
                                  ? [<Tag color="default">Bạn</Tag>]
                                  : [
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<MessageOutlined />}
                                        onClick={() => handleStartDirectChat(member.userId)}
                                      >
                                        Nhắn tin
                                      </Button>,
                                    ]
                              }
                            >
                              <List.Item.Meta
                                avatar={
                                  <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                                    {member.fullName?.charAt(0).toUpperCase()}
                                  </Avatar>
                                }
                                title={
                                  <Text strong style={{ fontSize: 13 }}>
                                    {member.fullName}
                                  </Text>
                                }
                                description={
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {member.role} • {member.email}
                                  </Text>
                                }
                              />
                            </List.Item>
                          );
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI: KHUNG CHAT TRỰC TIẾP */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
              {sidebarTab === 'customers' ? (
                activeCustomerConv ? (
                  <>
                    <div
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#fff',
                      }}
                    >
                      <Space size={12}>
                        <Avatar
                          size="large"
                          style={{
                            backgroundColor:
                              activeCustomerConv.handlingMode === 'AI' ? '#722ed1' : '#f59e0b',
                          }}
                          icon={<CustomerServiceOutlined />}
                        />
                        <div>
                          <Space size={8}>
                            <Title level={5} style={{ margin: 0, fontSize: 15 }}>
                              {activeCustomerConv.visitorName ||
                                `Visitor #${activeCustomerConv.visitorId}`}
                            </Title>
                            <Tag
                              color={
                                activeCustomerConv.status === 'OPEN'
                                  ? 'green'
                                  : activeCustomerConv.status === 'RESOLVED'
                                  ? 'blue'
                                  : 'default'
                              }
                            >
                              {activeCustomerConv.status}
                            </Tag>
                            <Tag
                              color={
                                activeCustomerConv.handlingMode === 'AI' ? 'purple' : 'cyan'
                              }
                              icon={
                                activeCustomerConv.handlingMode === 'AI' ? (
                                  <RobotOutlined />
                                ) : (
                                  <UserOutlined />
                                )
                              }
                            >
                              {activeCustomerConv.handlingMode}
                            </Tag>
                          </Space>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Kênh: <strong>{activeCustomerConv.channelName || `#${activeCustomerConv.channelId}`}</strong>
                            {activeCustomerConv.visitorEmail
                              ? ` • Email: ${activeCustomerConv.visitorEmail}`
                              : ''}{' '}
                            • Conversation #{activeCustomerConv.id}
                          </div>
                        </div>
                      </Space>

                      <Space>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => fetchCustomerMessages(activeCustomerConv.id)}
                          loading={loadingCustomerMessages}
                        >
                          Làm mới
                        </Button>
                        <Button
                          type={activeCustomerConv.status !== 'OPEN' ? 'primary' : 'default'}
                          icon={<HistoryOutlined />}
                          loading={restoringCustomerConv}
                          onClick={handleRestoreCustomerConv}
                        >
                          Khôi phục (Restore)
                        </Button>
                      </Space>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      {loadingCustomerMessages ? (
                        <div style={{ textAlign: 'center', margin: 'auto' }}>
                          <Spin tip="Đang tải lịch sử tin nhắn khách hàng..." />
                        </div>
                      ) : customerMessages.length === 0 ? (
                        <div style={{ margin: 'auto', textAlign: 'center' }}>
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Cuộc hội thoại này chưa có tin nhắn nào từ khách hàng."
                          />
                        </div>
                      ) : (
                        customerMessages.map((msg) => {
                          const isVisitor = msg.senderType === 'VISITOR';
                          return (
                            <div
                              key={msg.id}
                              style={{
                                display: 'flex',
                                justifyContent: isVisitor ? 'flex-start' : 'flex-end',
                                marginBottom: 4,
                              }}
                            >
                              <div
                                style={{
                                  maxWidth: '65%',
                                  padding: '10px 14px',
                                  borderRadius: isVisitor
                                    ? '14px 14px 14px 2px'
                                    : '14px 14px 2px 14px',
                                  background: isVisitor
                                    ? '#fff'
                                    : msg.senderType === 'AI'
                                    ? '#722ed1'
                                    : '#1677ff',
                                  color: isVisitor ? '#1f2937' : '#fff',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                  border: isVisitor ? '1px solid #e2e8f0' : 'none',
                                  wordBreak: 'break-word',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    marginBottom: 4,
                                    color: isVisitor ? '#d97706' : 'rgba(255,255,255,0.85)',
                                  }}
                                >
                                  {isVisitor
                                    ? activeCustomerConv.visitorName ||
                                      `Khách hàng #${msg.senderId || ''}`
                                    : msg.senderType === 'AI'
                                    ? 'AI Bot Tự Động'
                                    : `Nhân viên #${msg.senderId || ''}`}
                                </div>
                                <div style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.content}</div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    textAlign: 'right',
                                    marginTop: 4,
                                    color: isVisitor ? '#9ca3af' : 'rgba(255,255,255,0.75)',
                                  }}
                                >
                                  {msg.createdAt
                                    ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
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
                      <div ref={messagesEndRef} />
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      background: '#f9fafb',
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <CustomerServiceOutlined style={{ fontSize: 32, color: '#d97706' }} />
                    </div>
                    <Title level={4} style={{ color: '#374151', marginBottom: 8 }}>
                      Hộp Thư Hỗ Trợ Khách Hàng
                    </Title>
                    <Text type="secondary" style={{ maxWidth: 420, textAlign: 'center' }}>
                      Chọn một cuộc hội thoại khách hàng ở danh sách bên trái để xem lịch sử tin
                      nhắn hoặc khôi phục phiên trò chuyện.
                    </Text>
                  </div>
                )
              ) : activeRoom ? (
                <>
                  <div
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#fff',
                    }}
                  >
                    <Space size={12}>
                      <Avatar
                        size="large"
                        style={{
                          backgroundColor: activeRoom.type === 'GROUP' ? '#722ed1' : '#1677ff',
                        }}
                        icon={activeRoom.type === 'GROUP' ? <TeamOutlined /> : <UserOutlined />}
                      >
                        {activeRoom.type !== 'GROUP' && activeRoom.name
                          ? activeRoom.name.charAt(0).toUpperCase()
                          : null}
                      </Avatar>
                      <div>
                        <Title level={5} style={{ margin: 0, fontSize: 15 }}>
                          {activeRoom.name || 'Phòng chat 1-1'}
                        </Title>
                        <Tag color={activeRoom.type === 'GROUP' ? 'purple' : 'green'} style={{ fontSize: 11 }}>
                          {activeRoom.type === 'GROUP' ? 'Nhóm nội bộ' : 'Trò chuyện cá nhân 1-1'}
                        </Tag>
                      </div>
                    </Space>

                    <Space>
                      <Button icon={<TeamOutlined />} onClick={handleOpenRoomMembers}>
                        Thành viên phòng
                      </Button>
                    </Space>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      padding: '20px',
                      overflowY: 'auto',
                      background: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {loadingMessages ? (
                      <div style={{ textAlign: 'center', margin: 'auto' }}>
                        <Spin tip="Đang tải tin nhắn..." />
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={{ margin: 'auto', textAlign: 'center' }}>
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!"
                        />
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: 'flex',
                              justifyContent: isMine ? 'flex-end' : 'flex-start',
                              marginBottom: 4,
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '65%',
                                padding: '10px 14px',
                                borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                background: isMine ? '#1677ff' : '#fff',
                                color: isMine ? '#fff' : '#1f2937',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                wordBreak: 'break-word',
                              }}
                            >
                              <div style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.content}</div>
                              <div
                                style={{
                                  fontSize: 10,
                                  textAlign: 'right',
                                  marginTop: 4,
                                  color: isMine ? 'rgba(255,255,255,0.75)' : '#9ca3af',
                                }}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div
                    style={{
                      padding: '12px 16px',
                      borderTop: '1px solid #f0f0f0',
                      background: '#fff',
                    }}
                  >
                    <Space.Compact style={{ width: '100%' }}>
                      <Input.TextArea
                        value={inputContent}
                        onChange={(e) => setInputContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Nhập nội dung tin nhắn... (Nhấn Enter để gửi)"
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        style={{ borderRadius: '8px 0 0 8px' }}
                      />
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                        loading={sending}
                        style={{ height: 'auto', borderRadius: '0 8px 8px 0', padding: '0 20px' }}
                      >
                        Gửi
                      </Button>
                    </Space.Compact>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    background: '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <MessageOutlined style={{ fontSize: 32, color: '#0284c7' }} />
                  </div>
                  <Title level={4} style={{ color: '#374151', marginBottom: 8 }}>
                    Không Gian Giao Tiếp Nội Bộ
                  </Title>
                  <Text type="secondary" style={{ maxWidth: 400, textAlign: 'center' }}>
                    Chọn một cuộc trò chuyện từ danh sách bên trái hoặc chuyển sang tab{' '}
                    <strong>"Đồng nghiệp"</strong> để bắt đầu trò chuyện trực tiếp.
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Quản Lý Thành Viên Phòng Chat */}
      <Drawer
        title={
          <Space>
            <TeamOutlined />
            <span>Thành viên phòng ({roomMembers.length})</span>
          </Space>
        }
        placement="right"
        width={380}
        onClose={() => setIsRoomMembersOpen(false)}
        open={isRoomMembersOpen}
      >
        {activeRoom?.type === 'GROUP' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Thêm đồng nghiệp vào nhóm
            </Text>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                mode="multiple"
                placeholder="Chọn đồng nghiệp..."
                style={{ flex: 1 }}
                value={selectedNewMembers}
                onChange={setSelectedNewMembers}
                options={availableColleaguesToAdd.map((m) => ({
                  label: `${m.fullName} (${m.email})`,
                  value: m.userId,
                }))}
              />
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={handleAddRoomMembers}
                loading={addingMembers}
                disabled={selectedNewMembers.length === 0}
              >
                Thêm
              </Button>
            </Space.Compact>
            <Divider style={{ margin: '16px 0 12px' }} />
          </div>
        )}

        {loadingRoomMembers ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="Đang tải danh sách thành viên..." />
          </div>
        ) : (
          <List
            dataSource={roomMembers}
            renderItem={(rm) => {
              const colInfo = members.find((m) => m.userId === rm.userId);
              const isMe = rm.userId === user?.id;
              return (
                <List.Item
                  actions={
                    activeRoom?.type === 'GROUP'
                      ? [
                          <Popconfirm
                            key="remove"
                            title={isMe ? 'Rời khỏi nhóm chat?' : 'Xóa thành viên khỏi nhóm?'}
                            onConfirm={() => handleRemoveRoomMember(rm.userId)}
                            okText="Đồng ý"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                              {isMe ? 'Rời nhóm' : 'Xóa'}
                            </Button>
                          </Popconfirm>,
                        ]
                      : undefined
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                        {colInfo?.fullName?.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    title={
                      <Space size={6}>
                        <Text strong>{colInfo?.fullName || `User #${rm.userId}`}</Text>
                        {isMe && <Tag color="blue">Bạn</Tag>}
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {colInfo?.email || `Tham gia: ${rm.joinAt ? new Date(rm.joinAt).toLocaleDateString('vi-VN') : '-'}`}
                      </Text>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>

      {/* Modal Tạo Nhóm */}
      <Modal
        title="Tạo Nhóm Chat Nội Bộ Mới"
        open={isGroupModalOpen}
        onCancel={() => setIsGroupModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup}>
          <Form.Item
            name="name"
            label="Tên Nhóm Chat"
            rules={[
              { required: true, message: 'Vui lòng nhập tên nhóm chat!' },
              { max: 100, message: 'Tên nhóm tối đa 100 ký tự!' },
            ]}
          >
            <Input placeholder="Ví dụ: Team Kỹ Thuật, Phòng Marketing, Dự Án Alpha..." />
          </Form.Item>

          <Form.Item name="memberUserIds" label="Thêm Thành Viên Vào Nhóm">
            <Select
              mode="multiple"
              placeholder="Chọn các đồng nghiệp tham gia nhóm"
              style={{ width: '100%' }}
              options={members
                .filter((m) => m.userId !== user?.id)
                .map((m) => ({
                  label: `${m.fullName} (${m.email})`,
                  value: m.userId,
                }))}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsGroupModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submittingGroup}>
                Tạo nhóm
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Tạo Công Ty */}
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
            <Input placeholder="Ví dụ: Công ty TNHH Giải Pháp Công Nghệ" />
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
    </div>
  );
};
