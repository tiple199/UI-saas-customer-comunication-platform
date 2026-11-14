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
  InputNumber,
  Switch,
  Select,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CrownOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RobotOutlined,
  TeamOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { planApi } from '../../../api/plan';
import { isSuccess } from '../../../types/api';
import type { Plan, PlanStatus, CreatePlanRequest, UpdatePlanRequest } from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

export const isSuperAdminUser = (role?: string | null): boolean => {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return (
    normalized === 'ROLE_SUPER_ADMIN' ||
    normalized === 'SUPER_ADMIN' ||
    normalized === 'ROLE_ADMIN'
  );
};

export const PlanList: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminUser(user?.role);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);

  const [form] = Form.useForm();
  const aiEnabledValue = Form.useWatch('aiEnabled', form);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const filterParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = isSuperAdmin
        ? await planApi.getAllPlans(filterParam)
        : await planApi.getActivePlans();
      if (isSuccess(res) && res.data) {
        setPlans(res.data);
      } else {
        message.error(res.message || 'Không thể tải danh sách gói dịch vụ');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [isSuperAdmin, statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    form.resetFields();
    form.setFieldsValue({
      price: 0,
      maxUser: 5,
      maxChannel: 2,
      aiEnabled: true,
      aiQuota: 1000,
      storageLimit: 500,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      name: plan.name,
      price: plan.price,
      maxUser: plan.maxUser,
      maxChannel: plan.maxChannel,
      aiEnabled: Boolean(plan.aiEnabled),
      aiQuota: plan.aiQuota ?? 0,
      storageLimit: plan.storageLimit ?? 0,
      status: plan.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingPlan) {
        const payload: UpdatePlanRequest = {
          name: values.name.trim(),
          price: Number(values.price),
          maxUser: Number(values.maxUser),
          maxChannel: Number(values.maxChannel),
          aiEnabled: Boolean(values.aiEnabled),
          aiQuota: values.aiEnabled ? Number(values.aiQuota || 0) : 0,
          storageLimit: Number(values.storageLimit),
          status: values.status,
        };
        const res = await planApi.updatePlan(editingPlan.id, payload);
        if (isSuccess(res)) {
          message.success('Cập nhật gói dịch vụ thành công!');
          setIsModalOpen(false);
          fetchPlans();
        } else {
          message.error(res.message || 'Cập nhật gói dịch vụ thất bại');
        }
      } else {
        const payload: CreatePlanRequest = {
          name: values.name.trim(),
          price: Number(values.price),
          maxUser: Number(values.maxUser),
          maxChannel: Number(values.maxChannel),
          aiEnabled: Boolean(values.aiEnabled),
          aiQuota: values.aiEnabled ? Number(values.aiQuota || 0) : 0,
          storageLimit: Number(values.storageLimit),
          status: values.status || 'ACTIVE',
        };
        const res = await planApi.createPlan(payload);
        if (isSuccess(res)) {
          message.success('Tạo gói dịch vụ mới thành công!');
          setIsModalOpen(false);
          fetchPlans();
        } else {
          message.error(res.message || 'Tạo gói dịch vụ thất bại');
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi lưu gói dịch vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: Plan, checked: boolean) => {
    const newStatus: PlanStatus = checked ? 'ACTIVE' : 'INACTIVE';
    try {
      const res = await planApi.updatePlanStatus(plan.id, newStatus);
      if (isSuccess(res)) {
        message.success(
          newStatus === 'ACTIVE'
            ? `Đã kích hoạt gói "${plan.name}"`
            : `Đã ngừng kích hoạt gói "${plan.name}"`
        );
        setPlans((prev) =>
          prev.map((item) => (item.id === plan.id ? { ...item, status: newStatus } : item))
        );
      } else {
        message.error(res.message || 'Không thể cập nhật trạng thái gói');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái gói');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    try {
      const res = await planApi.deletePlan(planId);
      if (isSuccess(res)) {
        message.success('Đã xóa gói dịch vụ thành công');
        fetchPlans();
      } else {
        message.error(res.message || 'Xóa gói dịch vụ thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể xóa gói dịch vụ này');
    }
  };

  const handleSeedSamplePlans = async () => {
    setSeeding(true);
    const samplePlans: CreatePlanRequest[] = [
      {
        name: 'Starter (Miễn phí)',
        price: 0,
        maxUser: 3,
        maxChannel: 1,
        aiEnabled: false,
        aiQuota: 0,
        storageLimit: 100,
        status: 'ACTIVE',
      },
      {
        name: 'Professional (Pro)',
        price: 499000,
        maxUser: 15,
        maxChannel: 5,
        aiEnabled: true,
        aiQuota: 5000,
        storageLimit: 2048,
        status: 'ACTIVE',
      },
      {
        name: 'Enterprise (Doanh nghiệp)',
        price: 1499000,
        maxUser: 100,
        maxChannel: 20,
        aiEnabled: true,
        aiQuota: 50000,
        storageLimit: 10240,
        status: 'ACTIVE',
      },
    ];

    try {
      let createdCount = 0;
      for (const sample of samplePlans) {
        const exists = plans.some(
          (p) => p.name.trim().toLowerCase() === sample.name.trim().toLowerCase()
        );
        if (!exists) {
          const res = await planApi.createPlan(sample);
          if (isSuccess(res)) createdCount++;
        }
      }
      if (createdCount > 0) {
        message.success(`Đã khởi tạo ${createdCount} gói dịch vụ mẫu thành công!`);
        fetchPlans();
      } else {
        message.info('Các gói mẫu đã tồn tại trong hệ thống');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi khởi tạo gói mẫu');
    } finally {
      setSeeding(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount || Number(amount) === 0) {
      return <Tag color="green" style={{ fontWeight: 600 }}>Miễn phí (0 ₫)</Tag>;
    }
    return (
      <Text strong style={{ color: '#1677ff', fontSize: 15 }}>
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}> / tháng</Text>
      </Text>
    );
  };

  const formatStorage = (mb: number) => {
    if (!mb && mb !== 0) return '-';
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB (${mb} MB)`;
    }
    return `${mb} MB`;
  };

  const filteredPlans = plans.filter((item) => {
    if (!searchKeyword.trim()) return true;
    return item.name.toLowerCase().includes(searchKeyword.trim().toLowerCase());
  });

  const activeCount = plans.filter((p) => p.status === 'ACTIVE').length;
  const inactiveCount = plans.filter((p) => p.status === 'INACTIVE').length;
  const aiPlansCount = plans.filter((p) => p.aiEnabled).length;

  const columns: ColumnsType<Plan> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      render: (id: number) => <Text type="secondary">#{id}</Text>,
    },
    {
      title: 'Tên Gói Dịch Vụ',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Plan) => (
        <Space direction="vertical" size={2}>
          <Space size={6}>
            <CrownOutlined
              style={{ color: Number(record.price) > 0 ? '#faad14' : '#8c8c8c', fontSize: 16 }}
            />
            <Text strong style={{ fontSize: 15 }}>
              {name}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Giá Gói Cước',
      dataIndex: 'price',
      key: 'price',
      sorter: (a, b) => Number(a.price) - Number(b.price),
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Giới Hạn Tài Nguyên',
      key: 'limits',
      render: (_, record: Plan) => (
        <Space direction="vertical" size={4}>
          <Space size={6}>
            <TeamOutlined style={{ color: '#1677ff' }} />
            <Text>
              Tối đa <Text strong>{record.maxUser}</Text> nhân sự
            </Text>
          </Space>
          <Space size={6}>
            <ApiOutlined style={{ color: '#10b981' }} />
            <Text>
              Tối đa <Text strong>{record.maxChannel}</Text> kênh kết nối
            </Text>
          </Space>
          <Space size={6}>
            <DatabaseOutlined style={{ color: '#8b5cf6' }} />
            <Text>
              Lưu trữ RAG: <Text strong>{formatStorage(record.storageLimit)}</Text>
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Trợ Lý AI & Hạn Mức',
      key: 'ai',
      render: (_, record: Plan) =>
        record.aiEnabled ? (
          <Space direction="vertical" size={4}>
            <Tag icon={<RobotOutlined />} color="purple" style={{ margin: 0 }}>
              Có hỗ trợ AI RAG
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Hạn mức:{' '}
              <Text strong style={{ color: '#722ed1' }}>
                {new Intl.NumberFormat('vi-VN').format(record.aiQuota || 0)}
              </Text>{' '}
              lượt AI / tháng
            </Text>
          </Space>
        ) : (
          <Tag color="default">Không kèm AI</Tag>
        ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: PlanStatus, record: Plan) => (
        <Space size={8}>
          {isSuperAdmin && (
            <Switch
              size="small"
              checked={status === 'ACTIVE'}
              onChange={(checked) => handleToggleStatus(record, checked)}
            />
          )}
          <Tag
            icon={status === 'ACTIVE' ? <CheckCircleOutlined /> : <StopOutlined />}
            color={status === 'ACTIVE' ? 'success' : 'default'}
          >
            {status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng cung cấp'}
          </Tag>
        </Space>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            title: 'Hành Động',
            key: 'actions',
            width: 130,
            align: 'center' as const,
            render: (_: any, record: Plan) => (
              <Space size={8}>
                <Tooltip title="Chỉnh sửa gói dịch vụ">
                  <Button
                    type="text"
                    icon={<EditOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => handleOpenEditModal(record)}
                  />
                </Tooltip>
                <Popconfirm
                  title="Xóa gói dịch vụ này?"
                  description={`Bạn có chắc chắn muốn xóa gói "${record.name}" không?`}
                  onConfirm={() => handleDeletePlan(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Xóa gói dịch vụ">
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Space align="center">
            <CrownOutlined style={{ fontSize: 24, color: '#faad14' }} />
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Quản Lý Gói Dịch Vụ SaaS (Subscription Plans)
            </Title>
            <Tag color="gold" style={{ fontSize: 13, padding: '2px 10px', borderRadius: 12 }}>
              {plans.length} Gói
            </Tag>
          </Space>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
            Thiết lập định mức tài nguyên, giới hạn kênh, nhân sự, dung lượng RAG và quota AI cho từng gói dịch vụ
          </Paragraph>
        </div>

        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchPlans} loading={loading}>
            Làm mới
          </Button>
          {isSuperAdmin && (
            <>
              <Button
                icon={<ThunderboltOutlined />}
                loading={seeding}
                onClick={handleSeedSamplePlans}
              >
                Tạo 3 gói mẫu
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreateModal}
              >
                Tạo gói dịch vụ mới
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} size="small" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Tổng số Gói dịch vụ</span>}
              value={plans.length}
              prefix={<CrownOutlined style={{ color: '#faad14' }} />}
              suffix="gói"
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} size="small" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Đang hoạt động (ACTIVE)</span>}
              value={activeCount}
              valueStyle={{ color: '#10b981', fontWeight: 800 }}
              prefix={<CheckCircleOutlined />}
              suffix="gói"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} size="small" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Ngừng cung cấp (INACTIVE)</span>}
              value={inactiveCount}
              valueStyle={{ color: '#64748b', fontWeight: 800 }}
              prefix={<StopOutlined />}
              suffix="gói"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} size="small" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Gói tích hợp AI RAG</span>}
              value={aiPlansCount}
              valueStyle={{ color: '#722ed1', fontWeight: 800 }}
              prefix={<RobotOutlined />}
              suffix="gói"
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Card */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          marginBottom: 20,
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo tên gói dịch vụ..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </Col>
          {isSuperAdmin && (
            <Col xs={12} sm={6} md={6}>
              <Select
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'ALL', label: 'Tất cả trạng thái' },
                  { value: 'ACTIVE', label: 'Đang hoạt động' },
                  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
                ]}
              />
            </Col>
          )}
          <Col xs={12} sm={6} md={4}>
            <Button
              onClick={() => {
                setSearchKeyword('');
                setStatusFilter('ALL');
              }}
            >
              Đặt lại
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bảng quản lý Plan */}
      <Card
        bordered={false}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredPlans}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} gói dịch vụ`,
          }}
        />
      </Card>

      {/* Modal Tạo mới / Cập nhật Plan */}
      <Modal
        title={
          <Space>
            <CrownOutlined style={{ color: '#faad14' }} />
            <span>
              {editingPlan
                ? `Chỉnh Sửa Gói Dịch Vụ: ${editingPlan.name}`
                : 'Tạo Gói Dịch Vụ Mới (Super Admin)'}
            </span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitForm} style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="Tên gói dịch vụ"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên gói dịch vụ!' },
                  { max: 100, message: 'Tên gói không vượt quá 100 ký tự' },
                ]}
              >
                <Input placeholder="VD: Starter, Professional (Pro), Enterprise..." />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="price"
                label="Giá gói cước (VNĐ / tháng)"
                rules={[{ required: true, message: 'Vui lòng nhập giá gói!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={50000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as any}
                  placeholder="0 = Miễn phí"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0 16px' }} titlePlacement="left" plain>
            <Text type="secondary" style={{ fontSize: 12 }}>
              GIỚI HẠN TÀI NGUYÊN CÔNG TY
            </Text>
          </Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="maxUser"
                label="Số thành viên tối đa"
                rules={[{ required: true, message: 'Nhập số user tối đa' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} max={10000} addonAfter="người" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxChannel"
                label="Số kênh kết nối tối đa"
                rules={[{ required: true, message: 'Nhập số kênh tối đa' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} max={1000} addonAfter="kênh" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="storageLimit"
                label="Dung lượng RAG tối đa"
                rules={[{ required: true, message: 'Nhập giới hạn lưu trữ' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={100} addonAfter="MB" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0 16px' }} titlePlacement="left" plain>
            <Text type="secondary" style={{ fontSize: 12 }}>
              CẤU HÌNH TRỢ LÝ AI & TRẠNG THÁI
            </Text>
          </Divider>

          <Row gutter={16} align="middle">
            <Col span={8}>
              <Form.Item
                name="aiEnabled"
                label="Cho phép sử dụng AI RAG"
                valuePropName="checked"
              >
                <Switch checkedChildren="Bật AI" unCheckedChildren="Tắt AI" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="aiQuota"
                label="Hạn mức phản hồi AI / tháng"
                rules={[
                  {
                    required: Boolean(aiEnabledValue),
                    message: 'Nhập quota AI',
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={500}
                  disabled={!aiEnabledValue}
                  addonAfter="lượt"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái phát hành">
                <Select
                  options={[
                    { value: 'ACTIVE', label: 'Đang hoạt động (ACTIVE)' },
                    { value: 'INACTIVE', label: 'Ngừng hoạt động (INACTIVE)' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 12, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingPlan ? 'Lưu thay đổi' : 'Tạo gói dịch vụ'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

