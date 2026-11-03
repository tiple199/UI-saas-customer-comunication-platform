import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  message,
  Popconfirm,
  Alert,
  Avatar,
  Tabs,
  Switch,
  Tooltip,
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  ReloadOutlined,
  UserOutlined,
  DeleteOutlined,
  BankOutlined,
  MailOutlined,
  LockOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { companyApi } from '../../../api/company';
import { isSuccess } from '../../../types/api';
import type { CompanyMember, CreateMemberAccountRequest } from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';

const { Text } = Typography;

export const MemberList: React.FC = () => {
  const { user, currentCompany } = useAuth();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal thêm thành viên
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'invite' | 'create'>('invite');
  const [submitting, setSubmitting] = useState(false);
  const [inviteForm] = Form.useForm();
  const [createForm] = Form.useForm();

  // Loading state cho việc đổi trạng thái active/inactive
  const [updatingStatusUserId, setUpdatingStatusUserId] = useState<number | null>(null);

  const fetchMembers = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const res = await companyApi.getCompanyMembers(currentCompany.id);
      if (isSuccess(res) && res.data) {
        setMembers(res.data);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany) {
      fetchMembers();
    } else {
      setMembers([]);
    }
  }, [currentCompany?.id]);

  // Tab 1: Mời người dùng đã có email trên hệ thống
  const handleInviteMember = async (values: { email: string; role: string }) => {
    if (!currentCompany) return;
    try {
      setSubmitting(true);
      const res = await companyApi.addMember(currentCompany.id, values);
      if (isSuccess(res)) {
        message.success('Thêm thành viên vào công ty thành công!');
        setIsAddModalOpen(false);
        inviteForm.resetFields();
        fetchMembers();
      } else {
        message.error(res.message || 'Thêm thành viên thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi thêm thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  // Tab 2: Tạo tài khoản mới trực tiếp cho nhân viên
  const handleCreateAccount = async (values: CreateMemberAccountRequest) => {
    if (!currentCompany) return;
    try {
      setSubmitting(true);
      const res = await companyApi.createMemberAccount(currentCompany.id, values);
      if (isSuccess(res)) {
        message.success(`Đã tạo tài khoản cho "${values.fullName}" và thêm vào công ty!`);
        setIsAddModalOpen(false);
        createForm.resetFields();
        fetchMembers();
      } else {
        message.error(res.message || 'Tạo tài khoản thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tạo tài khoản nhân viên');
    } finally {
      setSubmitting(false);
    }
  };

  // Thay đổi trạng thái ACTIVE / INACTIVE của nhân viên
  const handleToggleMemberStatus = async (record: CompanyMember, checked: boolean) => {
    if (!currentCompany) return;
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
    try {
      setUpdatingStatusUserId(record.userId);
      const res = await companyApi.updateMemberStatus(currentCompany.id, record.userId, newStatus);
      if (isSuccess(res)) {
        message.success(`Đã ${checked ? 'kích hoạt' : 'đình chỉ'} tài khoản của ${record.fullName}`);
        setMembers((prev) =>
          prev.map((m) => (m.userId === record.userId ? { ...m, status: newStatus } : m))
        );
      } else {
        message.error(res.message || 'Không thể cập nhật trạng thái');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setUpdatingStatusUserId(null);
    }
  };

  // Xóa thành viên khỏi công ty
  const handleRemoveMember = async (memberUserId: number) => {
    if (!currentCompany) return;
    try {
      const res = await companyApi.removeMember(currentCompany.id, memberUserId);
      if (isSuccess(res)) {
        message.success('Đã xóa thành viên khỏi công ty');
        fetchMembers();
      } else {
        message.error(res.message || 'Xóa thành viên thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xóa thành viên');
    }
  };

  const getRoleTag = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Tag color="volcano">Chủ sở hữu (OWNER)</Tag>;
      case 'ADMIN':
        return <Tag color="orange">Quản trị viên (ADMIN)</Tag>;
      default:
        return <Tag color="blue">Nhân viên (STAFF)</Tag>;
    }
  };

  const columns = [
    {
      title: 'Thành viên',
      key: 'user',
      render: (_: any, record: CompanyMember) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
            {record.fullName?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{record.fullName}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => getRoleTag(role),
    },
    {
      title: 'Trạng thái hoạt động',
      key: 'status',
      render: (_: any, record: CompanyMember) => {
        const isOwner = record.role === 'OWNER';
        const isMe = record.userId === user?.id;
        const isActive = record.status === 'ACTIVE';

        // Không cho phép tự khóa chính mình hoặc khóa OWNER
        if (isOwner || isMe) {
          return (
            <Tag color={isActive ? 'success' : 'default'}>
              {record.status || 'ACTIVE'}
            </Tag>
          );
        }

        return (
          <Tooltip title={isActive ? 'Click để đình chỉ hoạt động' : 'Click để kích hoạt lại'}>
            <Switch
              checked={isActive}
              loading={updatingStatusUserId === record.userId}
              onChange={(checked) => handleToggleMemberStatus(record, checked)}
              checkedChildren="Hoạt động"
              unCheckedChildren="Đình chỉ"
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (val: string) => (val ? new Date(val).toLocaleDateString('vi-VN') : '-'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: CompanyMember) => {
        const isMe = record.userId === user?.id;
        const isOwner = record.role === 'OWNER';
        if (isMe || isOwner) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Popconfirm
            title="Xóa thành viên"
            description={`Bạn có chắc muốn xóa ${record.fullName} khỏi công ty?`}
            onConfirm={() => handleRemoveMember(record.userId)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  if (!currentCompany) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Alert
          message="Bạn chưa có công ty hoạt động"
          description="Vui lòng tạo hoặc chọn một công ty ở thanh menu trên cùng để quản lý nhân sự."
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
          <TeamOutlined style={{ color: '#1677ff' }} />
          <span>Danh sách Thành Viên Công Ty</span>
          <Tag color="geekblue">{currentCompany.name}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchMembers} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              inviteForm.resetFields();
              createForm.resetFields();
              setIsAddModalOpen(true);
            }}
          >
            Thêm thành viên
          </Button>
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <Table
        dataSource={members}
        columns={columns}
        rowKey="userId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal Thêm Thành Viên Đa Năng */}
      <Modal
        title={`Thêm Thành Viên Vào ${currentCompany.name}`}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Tabs
          activeKey={activeModalTab}
          onChange={(k) => setActiveModalTab(k as 'invite' | 'create')}
          items={[
            {
              key: 'invite',
              label: (
                <Space>
                  <MailOutlined />
                  <span>Mời qua Email</span>
                </Space>
              ),
              children: (
                <Form
                  form={inviteForm}
                  layout="vertical"
                  onFinish={handleInviteMember}
                  initialValues={{ role: 'STAFF' }}
                >
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Dành cho người dùng đã có tài khoản sẵn trên hệ thống."
                  />
                  <Form.Item
                    name="email"
                    label="Email Thành Viên"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không đúng định dạng!' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="nhanvien@example.com" />
                  </Form.Item>

                  <Form.Item
                    name="role"
                    label="Vai Trò Trong Công Ty"
                    rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                  >
                    <Select
                      options={[
                        { label: 'Nhân viên (STAFF)', value: 'STAFF' },
                        { label: 'Quản trị viên (ADMIN)', value: 'ADMIN' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Space>
                      <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
                      <Button type="primary" htmlType="submit" loading={submitting}>
                        Thêm ngay
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'create',
              label: (
                <Space>
                  <UserSwitchOutlined />
                  <span>Tạo tài khoản mới</span>
                </Space>
              ),
              children: (
                <Form
                  form={createForm}
                  layout="vertical"
                  onFinish={handleCreateAccount}
                  initialValues={{ role: 'STAFF' }}
                >
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Tạo ngay tài khoản và cấp quyền gia nhập công ty trong một bước."
                  />

                  <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn B" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email đăng nhập"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không đúng định dạng!' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="nhanvienmoi@example.com" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Mật khẩu khởi tạo"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu!' },
                      { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Tối thiểu 6 ký tự" />
                  </Form.Item>

                  <Form.Item
                    name="role"
                    label="Vai Trò"
                    rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                  >
                    <Select
                      options={[
                        { label: 'Nhân viên (STAFF)', value: 'STAFF' },
                        { label: 'Quản trị viên (ADMIN)', value: 'ADMIN' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Space>
                      <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
                      <Button type="primary" htmlType="submit" loading={submitting}>
                        Tạo và cấp quyền
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Modal>
    </Card>
  );
};
