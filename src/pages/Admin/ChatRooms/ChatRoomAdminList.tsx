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
} from 'antd';
import {
  CommentOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  WechatOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { chatRoomApi } from '../../../api/chatRoom';
import { companyApi } from '../../../api/company';
import { isSuccess } from '../../../types/api';
import type { ChatRoom, ChatRoomMember, ChatRoomType, CompanyMember } from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';

const { Text } = Typography;

export const ChatRoomAdminList: React.FC = () => {
  const { currentCompany } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);

  // State xem chi tiết phòng & thành viên
  const [detailRoom, setDetailRoom] = useState<ChatRoom | null>(null);
  const [roomMembers, setRoomMembers] = useState<ChatRoomMember[]>([]);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchRooms = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const [roomRes, compMemRes] = await Promise.all([
        chatRoomApi.getMyChatRooms(currentCompany.id),
        companyApi.getCompanyMembers(currentCompany.id).catch(() => null),
      ]);
      if (isSuccess(roomRes) && roomRes.data) {
        setRooms(roomRes.data);
      }
      if (compMemRes && isSuccess(compMemRes) && compMemRes.data) {
        setCompanyMembers(compMemRes.data);
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

  const handleViewRoomDetail = async (room: ChatRoom) => {
    if (!currentCompany) return;
    setDetailRoom(room);
    setRoomMembers([]);
    try {
      setLoadingDetail(true);
      const [infoRes, membersRes] = await Promise.all([
        chatRoomApi.getChatRoomById(room.id, currentCompany.id),
        chatRoomApi.getChatRoomMembers(room.id, currentCompany.id),
      ]);
      if (isSuccess(infoRes) && infoRes.data) {
        setDetailRoom(infoRes.data);
      }
      if (isSuccess(membersRes) && membersRes.data) {
        setRoomMembers(membersRes.data);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tải chi tiết phòng chat');
    } finally {
      setLoadingDetail(false);
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
      render: (_: any, record: ChatRoom) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewRoomDetail(record)}
          >
            Chi tiết & Thành viên
          </Button>
          <Button
            type="link"
            icon={<WechatOutlined />}
            onClick={() => {
              if (currentCompany) {
                sessionStorage.setItem(`active_room_${currentCompany.id}`, String(record.id));
              }
              navigate('/chat');
            }}
          >
            Mở chat
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

      {/* Modal Chi tiết Phòng & Thành viên */}
      <Modal
        title={`Chi Tiết Phòng Chat #${detailRoom?.id}`}
        open={!!detailRoom}
        onCancel={() => setDetailRoom(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailRoom(null)}>
            Đóng
          </Button>,
        ]}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spin tip="Đang tải thông tin phòng..." />
          </div>
        ) : (
          detailRoom && (
            <div>
              <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Tên phòng">
                  <Text strong>{detailRoom.name || '(Hội thoại 1-1)'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Loại phòng">
                  <Tag color={detailRoom.type === 'GROUP' ? 'purple' : 'green'}>
                    {detailRoom.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {detailRoom.createdAt
                    ? new Date(detailRoom.createdAt).toLocaleString('vi-VN')
                    : '-'}
                </Descriptions.Item>
              </Descriptions>

              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Danh sách thành viên trong phòng ({roomMembers.length})
              </Text>
              <List
                bordered
                size="small"
                dataSource={roomMembers}
                renderItem={(rm) => {
                  const info = companyMembers.find((m) => m.userId === rm.userId);
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar size="small" icon={<UserOutlined />} />}
                        title={info ? `${info.fullName} (${info.email})` : `User ID #${rm.userId}`}
                        description={`Tham gia lúc: ${rm.joinAt ? new Date(rm.joinAt).toLocaleString('vi-VN') : '-'}`}
                      />
                    </List.Item>
                  );
                }}
              />
            </div>
          )
        )}
      </Modal>
    </Card>
  );
};
