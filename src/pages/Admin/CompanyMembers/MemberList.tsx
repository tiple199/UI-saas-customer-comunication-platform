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
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  ReloadOutlined,
  UserOutlined,
  DeleteOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { companyApi } from '../../../api/company';
import { isSuccess } from '../../../types/api';
import type { CompanyMember } from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';

const { Text } = Typography;

export const MemberList: React.FC = () => {
  const { user, currentCompany } = useAuth();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

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

  const handleAddMember = async (values: { email: string; role: string }) => {
    if (!currentCompany) return;
    try {
      setSubmitting(true);
      const res = await companyApi.addMember(currentCompany.id, values);
      if (isSuccess(res)) {
        message.success('Thêm thành viên vào công ty thành công!');
        setIsAddModalOpen(false);
        form.resetFields();
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
        return <Tag color="blue">Nhân viên (MEMBER)</Tag>;
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>{status || 'ACTIVE'}</Tag>
      ),
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
              form.resetFields();
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

      <Modal
        title={`Thêm Thành Viên Vào ${currentCompany.name}`}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMember}
          initialValues={{ role: 'MEMBER' }}
        >
          <Form.Item
            name="email"
            label="Email Thành Viên"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không đúng định dạng!' },
            ]}
          >
            <Input placeholder="nhanvien@example.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai Trò Trong Công Ty"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select
              options={[
                { label: 'Nhân viên (MEMBER)', value: 'MEMBER' },
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
      </Modal>
    </Card>
  );
};

