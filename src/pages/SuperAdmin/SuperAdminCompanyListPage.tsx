import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Tooltip,
  Drawer,
  Modal,
  Form,
  message,
  Popconfirm,
  Row,
  Col,
  Progress,
  Divider,
  Tabs,
} from 'antd';
import {
  ShopOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  CrownOutlined,
  DatabaseOutlined,
  RobotOutlined,
  TeamOutlined,
  ApiOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { superAdminApi } from '../../api/superAdmin';
import { planApi } from '../../api/plan';
import { isSuccess } from '../../types/api';
import type {
  SuperAdminCompanyItemDto,
  SuperAdminCompanyDetailDto,
  Plan,
} from '../../types/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const SuperAdminCompanyListPage: React.FC = () => {
  const [companies, setCompanies] = useState<SuperAdminCompanyItemDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Search & Filter state
  const [keyword, setKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Detail Drawer state
  const [companyDetail, setCompanyDetail] = useState<SuperAdminCompanyDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);

  // Assign Plan Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assigningCompany, setAssigningCompany] = useState<SuperAdminCompanyItemDto | null>(null);
  const [assigning, setAssigning] = useState<boolean>(false);
  const [assignForm] = Form.useForm();

  // Load danh sách gói dịch vụ để phục vụ bộ lọc & gán gói
  useEffect(() => {
    planApi.getActivePlans().then((res) => {
      if (isSuccess(res) && res.data) {
        setPlans(res.data);
      }
    });
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getCompanies({
        keyword: keyword.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        planId: planFilter,
        page,
        size: pageSize,
      });

      if (isSuccess(res) && res.data) {
        const list = res.data.items || (res.data as any).content || [];
        setCompanies(list);
        setTotal(res.data.totalElements ?? list.length);
      }
    } catch {
      message.error('Lỗi khi tải danh sách doanh nghiệp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, pageSize, statusFilter, planFilter]);

  const handleSearch = () => {
    setPage(0);
    fetchCompanies();
  };

  const handleResetFilters = () => {
    setKeyword('');
    setStatusFilter('ALL');
    setPlanFilter(undefined);
    setPage(0);
  };

  // Mở Drawer xem chi tiết
  const handleOpenDetail = async (companyId: number) => {
    setIsDetailDrawerOpen(true);
    setLoadingDetail(true);
    try {
      const res = await superAdminApi.getCompanyDetail(companyId);
      if (isSuccess(res) && res.data) {
        setCompanyDetail(res.data);
      }
    } catch {
      message.error('Lỗi khi tải chi tiết doanh nghiệp');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Khóa / Mở khóa công ty
  const handleToggleStatus = async (record: SuperAdminCompanyItemDto) => {
    const newStatus = record.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await superAdminApi.updateCompanyStatus(record.id, {
        status: newStatus,
        reason: `Super Admin thay đổi trạng thái sang ${newStatus}`,
      });
      if (isSuccess(res)) {
        message.success(
          newStatus === 'ACTIVE'
            ? `Đã mở khóa công ty ${record.name}`
            : `Đã tạm khóa công ty ${record.name}`
        );
        fetchCompanies();
        if (companyDetail && companyDetail.id === record.id) {
          setCompanyDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // Mở Modal gán gói cước
  const handleOpenAssignPlan = (record: SuperAdminCompanyItemDto) => {
    setAssigningCompany(record);
    assignForm.resetFields();
    assignForm.setFieldsValue({
      planId: record.planId || (plans[0] ? plans[0].id : undefined),
      durationMonths: 1,
      note: 'Super Admin gán gói dịch vụ',
    });
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssignPlan = async () => {
    if (!assigningCompany) return;
    try {
      const values = await assignForm.validateFields();
      setAssigning(true);
      const res = await superAdminApi.assignPlan(assigningCompany.id, {
        planId: values.planId,
        durationMonths: values.durationMonths,
        note: values.note,
      });

      if (isSuccess(res)) {
        message.success(`Đã gán gói thành công cho công ty ${assigningCompany.name}!`);
        setIsAssignModalOpen(false);
        fetchCompanies();
        if (companyDetail && companyDetail.id === assigningCompany.id) {
          handleOpenDetail(assigningCompany.id);
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi gán gói cước');
    } finally {
      setAssigning(false);
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const columns = [
    {
      title: 'Doanh Nghiệp',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: SuperAdminCompanyItemDto) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
            }}
          >
            {name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
              {name}
            </Text>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Mã ID: <strong>#{record.id}</strong> • Tạo ngày:{' '}
              {record.createdAt ? new Date(record.createdAt).toLocaleDateString('vi-VN') : '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Chủ Sở Hữu (Owner)',
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (_: string, record: SuperAdminCompanyItemDto) => (
        <div>
          {record.ownerEmail ? (
            <>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                {record.ownerName || 'Chưa cập nhật tên'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{record.ownerEmail}</div>
            </>
          ) : (
            <Text type="secondary" italic>
              Chưa có Owner
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Gói Dịch Vụ',
      dataIndex: 'planName',
      key: 'planName',
      render: (planName: string, record: SuperAdminCompanyItemDto) => {
        const isFree = !planName || planName.toLowerCase().includes('starter') || planName.toLowerCase().includes('miễn phí');
        return (
          <div>
            <Space size={6}>
              <Tag color={isFree ? 'default' : 'purple'} style={{ fontWeight: 600, margin: 0 }}>
                {planName || 'Chưa kích hoạt'}
              </Tag>
              {record.subscriptionStatus === 'ACTIVE' && (
                <Tag color="success" style={{ fontSize: 10, margin: 0 }}>
                  ACTIVE
                </Tag>
              )}
            </Space>
            {record.subscriptionEndAt ? (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                Hết hạn: {new Date(record.subscriptionEndAt).toLocaleDateString('vi-VN')}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}>
                Thời hạn: <strong>Vĩnh viễn</strong>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Tài Nguyên Đang Dùng',
      key: 'resources',
      render: (_: any, record: SuperAdminCompanyItemDto) => (
        <Space size={12} split={<span style={{ color: '#cbd5e1' }}>•</span>}>
          <Tooltip title="Nhân sự trong công ty">
            <span>
              <TeamOutlined style={{ color: '#3b82f6', marginRight: 4 }} />
              <strong>{record.memberCount}</strong>
            </span>
          </Tooltip>
          <Tooltip title="Kênh tương tác (LiveChat, Telegram...)">
            <span>
              <ApiOutlined style={{ color: '#10b981', marginRight: 4 }} />
              <strong>{record.channelCount}</strong>
            </span>
          </Tooltip>
          <Tooltip title="Tổng số cuộc hội thoại khách hàng">
            <span>
              <MessageOutlined style={{ color: '#f59e0b', marginRight: 4 }} />
              <strong>{record.conversationCount}</strong>
            </span>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Tổng Chi Tiêu',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      render: (amount: number) => (
        <span style={{ fontWeight: 700, color: amount > 0 ? '#16a34a' : '#94a3b8' }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'ACTIVE') {
          return <Tag color="success">Hoạt động</Tag>;
        }
        if (status === 'SUSPENDED') {
          return <Tag color="error">Tạm khóa</Tag>;
        }
        return <Tag color="default">{status || 'INACTIVE'}</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: SuperAdminCompanyItemDto) => (
        <Space size={8}>
          <Tooltip title="Xem chi tiết doanh nghiệp">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleOpenDetail(record.id)}
            />
          </Tooltip>

          <Tooltip title="Gán / Nâng cấp gói cước trực tiếp">
            <Button
              type="text"
              icon={<CrownOutlined style={{ color: '#7c3aed' }} />}
              onClick={() => handleOpenAssignPlan(record)}
            />
          </Tooltip>

          <Popconfirm
            title={record.status === 'ACTIVE' ? 'Tạm khóa công ty này?' : 'Mở khóa công ty này?'}
            description={
              record.status === 'ACTIVE'
                ? 'Khi bị tạm khóa, thành viên công ty sẽ không thể đăng nhập hoặc dùng hệ thống.'
                : 'Mở lại quyền truy cập cho toàn bộ thành viên công ty.'
            }
            onConfirm={() => handleToggleStatus(record)}
            okText={record.status === 'ACTIVE' ? 'Khóa ngay' : 'Mở khóa'}
            cancelText="Hủy"
            okButtonProps={{ danger: record.status === 'ACTIVE' }}
          >
            <Tooltip title={record.status === 'ACTIVE' ? 'Tạm khóa công ty' : 'Mở khóa công ty'}>
              <Button
                type="text"
                danger={record.status === 'ACTIVE'}
                icon={record.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined style={{ color: '#16a34a' }} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
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
            <ShopOutlined style={{ fontSize: 24, color: '#4f46e5' }} />
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Quản Lý Doanh Nghiệp (Tenants)
            </Title>
            <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px', borderRadius: 12 }}>
              {total} Doanh nghiệp
            </Tag>
          </Space>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
            Danh sách toàn bộ công ty trên nền tảng, quản lý trạng thái, gói cước và tài nguyên sử dụng
          </Paragraph>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCompanies} loading={loading}>
            Làm mới
          </Button>
        </Space>
      </div>

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
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Tìm theo tên công ty hoặc email chủ sở hữu..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
            >
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="ACTIVE">Đang hoạt động</Option>
              <Option value="SUSPENDED">Đang tạm khóa</Option>
              <Option value="INACTIVE">Vô hiệu hóa</Option>
            </Select>
          </Col>

          <Col xs={12} sm={8} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo gói dịch vụ"
              value={planFilter}
              onChange={(val) => setPlanFilter(val)}
              allowClear
            >
              {plans.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.price)}/tháng)
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={24} md={6} style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Tìm kiếm
            </Button>
            <Button onClick={handleResetFilters}>Đặt lại</Button>
          </Col>
        </Row>
      </Card>

      {/* Company Table */}
      <Card
        bordered={false}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
      >
        <Table
          dataSource={companies}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page + 1,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (p, s) => {
              setPage(p - 1);
              setPageSize(s);
            },
            showTotal: (tot) => `Tổng cộng ${tot} doanh nghiệp`,
          }}
          locale={{ emptyText: 'Không tìm thấy doanh nghiệp nào phù hợp' }}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShopOutlined style={{ color: '#4f46e5', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 700 }}>
              Chi Tiết Doanh Nghiệp #{companyDetail?.id}
            </span>
          </div>
        }
        placement="right"
        width={680}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
        loading={loadingDetail}
      >
        {companyDetail && (
          <div>
            {/* Header Box */}
            <div
              style={{
                padding: '16px 20px',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                    {companyDetail.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tạo ngày: {new Date(companyDetail.createdAt).toLocaleString('vi-VN')}
                  </Text>
                </div>
                <Tag color={companyDetail.status === 'ACTIVE' ? 'success' : 'error'} style={{ fontSize: 12, padding: '2px 10px' }}>
                  {companyDetail.status || 'ACTIVE'}
                </Tag>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Chủ sở hữu:</Text>
                  <div style={{ fontWeight: 600 }}>{companyDetail.ownerName || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{companyDetail.ownerEmail || '—'}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Tổng chi tiêu:</Text>
                  <div style={{ fontWeight: 800, color: '#16a34a', fontSize: 16 }}>
                    {formatCurrency(companyDetail.totalPaid)}
                  </div>
                </Col>
              </Row>
            </div>

            <Tabs
              defaultActiveKey="overview"
              items={[
                {
                  key: 'overview',
                  label: (
                    <span>
                      <CrownOutlined style={{ marginRight: 6 }} />
                      Gói Cước & Tài Nguyên
                    </span>
                  ),
                  children: (
                    <div>
                      {/* Subscription Box */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <Text strong style={{ fontSize: 14 }}>
                            <CrownOutlined style={{ color: '#7c3aed', marginRight: 6 }} />
                            Gói Dịch Vụ Hiện Tại
                          </Text>
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<CrownOutlined />}
                            onClick={() => handleOpenAssignPlan(companyDetail)}
                          >
                            Gán Gói Khác
                          </Button>
                        </div>

                        <Card size="small" style={{ borderRadius: 10, background: '#faf5ff', borderColor: '#f3e8ff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text strong style={{ color: '#6b21a8', fontSize: 15 }}>
                              {companyDetail.planName}
                            </Text>
                            <Tag color="purple">{companyDetail.subscriptionStatus}</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            Hạn sử dụng:{' '}
                            <strong style={{ color: companyDetail.subscriptionEndAt ? '#0f172a' : '#16a34a' }}>
                              {companyDetail.subscriptionEndAt
                                ? new Date(companyDetail.subscriptionEndAt).toLocaleDateString('vi-VN')
                                : 'Vĩnh viễn (Không thời hạn)'}
                            </strong>
                          </div>
                        </Card>
                      </div>

                      {/* Quota & Usage Progress */}
                      <div style={{ marginBottom: 24 }}>
                        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
                          Định Mức & Mức Độ Sử Dụng
                        </Text>

                        {/* Nhân sự */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span>
                              <TeamOutlined style={{ marginRight: 6, color: '#3b82f6' }} />
                              Nhân sự (Members)
                            </span>
                            <span>
                              <strong>{companyDetail.memberCount}</strong> /{' '}
                              {companyDetail.maxUsers ? `${companyDetail.maxUsers} max` : 'Không giới hạn'}
                            </span>
                          </div>
                          <Progress
                            percent={
                              companyDetail.maxUsers
                                ? Math.min(100, Math.round((companyDetail.memberCount / companyDetail.maxUsers) * 100))
                                : 20
                            }
                            size="small"
                            strokeColor="#3b82f6"
                          />
                        </div>

                        {/* Kênh */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span>
                              <ApiOutlined style={{ marginRight: 6, color: '#10b981' }} />
                              Kênh tương tác (Channels)
                            </span>
                            <span>
                              <strong>{companyDetail.channelCount}</strong> /{' '}
                              {companyDetail.maxChannels ? `${companyDetail.maxChannels} max` : 'Không giới hạn'}
                            </span>
                          </div>
                          <Progress
                            percent={
                              companyDetail.maxChannels
                                ? Math.min(100, Math.round((companyDetail.channelCount / companyDetail.maxChannels) * 100))
                                : 25
                            }
                            size="small"
                            strokeColor="#10b981"
                          />
                        </div>

                        {/* Dung lượng tài liệu */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span>
                              <DatabaseOutlined style={{ marginRight: 6, color: '#8b5cf6' }} />
                              Dung lượng tài liệu RAG
                            </span>
                            <span>
                              <strong>{((companyDetail.usedStorageBytes || 0) / (1024 * 1024)).toFixed(1)} MB</strong> /{' '}
                              {companyDetail.storageLimitMb ? `${companyDetail.storageLimitMb} MB` : '100 MB'}
                            </span>
                          </div>
                          <Progress
                            percent={
                              companyDetail.storageLimitMb
                                ? Math.min(
                                    100,
                                    Math.round(
                                      ((companyDetail.usedStorageBytes || 0) /
                                        (companyDetail.storageLimitMb * 1024 * 1024)) *
                                        100
                                    )
                                  )
                                : 10
                            }
                            size="small"
                            strokeColor="#8b5cf6"
                          />
                        </div>

                        {/* Hạn mức tin nhắn AI */}
                        {companyDetail.aiEnabled && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                              <span>
                                <RobotOutlined style={{ marginRight: 6, color: '#f59e0b' }} />
                                Tin nhắn AI tháng này
                              </span>
                              <span>
                                <strong>{companyDetail.usedAiQuotaThisMonth || 0}</strong> /{' '}
                                {companyDetail.aiQuota ? `${companyDetail.aiQuota} tin` : 'Không giới hạn'}
                              </span>
                            </div>
                            <Progress
                              percent={
                                companyDetail.aiQuota
                                ? Math.min(
                                    100,
                                    Math.round(
                                      ((companyDetail.usedAiQuotaThisMonth || 0) / companyDetail.aiQuota) * 100
                                    )
                                  )
                                : 15
                              }
                              size="small"
                              strokeColor="#f59e0b"
                            />
                          </div>
                        )}
                      </div>

                      {/* Recent Payments Table */}
                      <div>
                        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 10 }}>
                          Lịch Sử Thanh Toán Gần Nhất
                        </Text>
                        <Table
                          dataSource={companyDetail.recentPayments || []}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          columns={[
                            {
                              title: 'Mã GD',
                              dataIndex: 'transactionRef',
                              key: 'transactionRef',
                              render: (t: string) => <Text style={{ fontSize: 11 }}>{t}</Text>,
                            },
                            {
                              title: 'Gói',
                              dataIndex: 'planName',
                              key: 'planName',
                            },
                            {
                              title: 'Số Tiền',
                              dataIndex: 'amount',
                              key: 'amount',
                              render: (val: number) => (
                                <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatCurrency(val)}</span>
                              ),
                            },
                            {
                              title: 'Trạng Thái',
                              dataIndex: 'status',
                              key: 'status',
                              render: (st: string) => (
                                <Tag color={st === 'SUCCESS' ? 'success' : 'default'} style={{ fontSize: 11 }}>
                                  {st}
                                </Tag>
                              ),
                            },
                            {
                              title: 'Ngày',
                              dataIndex: 'createdAt',
                              key: 'createdAt',
                              render: (d: string) => (
                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                  {d ? new Date(d).toLocaleDateString('vi-VN') : '—'}
                                </span>
                              ),
                            },
                          ]}
                          locale={{ emptyText: 'Chưa có giao dịch nào' }}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'members',
                  label: (
                    <span>
                      <TeamOutlined style={{ marginRight: 6 }} />
                      Thành Viên ({companyDetail.members?.length || 0})
                    </span>
                  ),
                  children: (
                    <Table
                      dataSource={companyDetail.members || []}
                      rowKey={(m) => m.userId}
                      pagination={{ pageSize: 6, size: 'small' }}
                      size="small"
                      columns={[
                        {
                          title: 'Thành viên',
                          key: 'name',
                          render: (_, m) => (
                            <Space size={8}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  backgroundColor: '#e0e7ff',
                                  color: '#4f46e5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: 13,
                                }}
                              >
                                {m.fullName?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                                  {m.fullName || 'Chưa đặt tên'}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{m.email}</div>
                              </div>
                            </Space>
                          ),
                        },
                        {
                          title: 'Vai trò',
                          dataIndex: 'role',
                          key: 'role',
                          width: 100,
                          render: (role: string) => {
                            let color = 'default';
                            if (role === 'OWNER') color = 'gold';
                            else if (role === 'ADMIN') color = 'blue';
                            return <Tag color={color} style={{ margin: 0, fontWeight: 600 }}>{role}</Tag>;
                          },
                        },
                        {
                          title: 'Trạng thái',
                          dataIndex: 'status',
                          key: 'status',
                          width: 100,
                          render: (st: string) => (
                            <Tag color={st === 'ACTIVE' ? 'success' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                              {st || 'ACTIVE'}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Tham gia',
                          dataIndex: 'joinedAt',
                          key: 'joinedAt',
                          width: 100,
                          render: (d: string) => (
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              {d ? new Date(d).toLocaleDateString('vi-VN') : '—'}
                            </span>
                          ),
                        },
                      ]}
                      locale={{ emptyText: 'Chưa có thành viên nào' }}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>

      {/* Modal Gán Gói Cước Trực Tiếp */}
      <Modal
        title={
          <Space>
            <CrownOutlined style={{ color: '#7c3aed', fontSize: 20 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              Gán Gói Dịch Vụ Cho: {assigningCompany?.name}
            </span>
          </Space>
        }
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        onOk={handleConfirmAssignPlan}
        confirmLoading={assigning}
        okText="Xác Nhận Gán Gói"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="planId"
            label="Chọn gói cước muốn gán"
            rules={[{ required: true, message: 'Vui lòng chọn gói cước' }]}
          >
            <Select size="large">
              {plans.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.price)}/tháng)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="durationMonths"
            label="Thời hạn sử dụng (Số tháng cộng thêm)"
            rules={[{ required: true, message: 'Vui lòng nhập số tháng' }]}
          >
            <Select size="large">
              <Option value={1}>1 Tháng</Option>
              <Option value={3}>3 Tháng</Option>
              <Option value={6}>6 Tháng</Option>
              <Option value={12}>1 Năm (12 Tháng)</Option>
              <Option value={24}>2 Năm (24 Tháng)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="Ghi chú lý do gán gói">
            <Input.TextArea
              rows={3}
              placeholder="VD: Khách hàng ký hợp đồng ngoại tuyến, Hỗ trợ dùng thử VIP..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

