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
  Modal,
  Form,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  CrownOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { superAdminApi } from '../../api/superAdmin';
import { planApi } from '../../api/plan';
import { isSuccess } from '../../types/api';
import type {
  SuperAdminSubscriptionItemDto,
  SuperAdminSubscriptionStatsDto,
  Plan,
} from '../../types/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const SuperAdminSubscriptionListPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SuperAdminSubscriptionItemDto[]>([]);
  const [stats, setStats] = useState<SuperAdminSubscriptionStatsDto | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Search & Filter state
  const [keyword, setKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<number | undefined>(undefined);
  const [isPaidFilter, setIsPaidFilter] = useState<boolean | undefined>(undefined);
  const [isExpiringSoonFilter, setIsExpiringSoonFilter] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Extend Subscription Modal state
  const [isExtendModalOpen, setIsExtendModalOpen] = useState<boolean>(false);
  const [selectedSub, setSelectedSub] = useState<SuperAdminSubscriptionItemDto | null>(null);
  const [extending, setExtending] = useState<boolean>(false);
  const [extendForm] = Form.useForm();

  // Load danh sách Plan mẫu để hiển thị bộ lọc
  useEffect(() => {
    planApi.getActivePlans().then((res) => {
      if (isSuccess(res) && res.data) {
        setPlans(res.data);
      }
    });
  }, []);

  // Load thống kê KPI
  const fetchStats = async () => {
    try {
      const res = await superAdminApi.getSubscriptionStats();
      if (isSuccess(res) && res.data) {
        setStats(res.data);
      }
    } catch {
      // Ignore or log
    }
  };

  // Load danh sách Subscription
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getSubscriptions({
        keyword: keyword.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        planId: planFilter,
        isPaid: isPaidFilter,
        isExpiringSoon: isExpiringSoonFilter ? true : undefined,
        page,
        size: pageSize,
      });

      if (isSuccess(res) && res.data) {
        const list = res.data.items || (res.data as any).content || [];
        setSubscriptions(list);
        setTotal(res.data.totalElements ?? list.length);
      }
    } catch {
      message.error('Lỗi khi tải danh sách thuê bao');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, pageSize, statusFilter, planFilter, isPaidFilter, isExpiringSoonFilter]);

  const handleSearch = () => {
    setPage(0);
    fetchSubscriptions();
  };

  const handleResetFilters = () => {
    setKeyword('');
    setStatusFilter('ALL');
    setPlanFilter(undefined);
    setIsPaidFilter(undefined);
    setIsExpiringSoonFilter(false);
    setPage(0);
  };

  // Mở modal gia hạn
  const handleOpenExtend = (record: SuperAdminSubscriptionItemDto) => {
    setSelectedSub(record);
    extendForm.resetFields();
    extendForm.setFieldsValue({
      months: 1,
      note: 'Super Admin gia hạn thời gian sử dụng',
    });
    setIsExtendModalOpen(true);
  };

  const handleConfirmExtend = async () => {
    if (!selectedSub) return;
    try {
      const values = await extendForm.validateFields();
      setExtending(true);
      const res = await superAdminApi.extendSubscription(selectedSub.id, {
        months: values.months,
        note: values.note,
      });

      if (isSuccess(res)) {
        message.success(`Đã gia hạn thêm ${values.months} tháng cho công ty ${selectedSub.companyName}!`);
        setIsExtendModalOpen(false);
        fetchSubscriptions();
        fetchStats();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi gia hạn thuê bao');
    } finally {
      setExtending(false);
    }
  };

  // Chuyển về gói Starter
  const handleCancelToFree = async (record: SuperAdminSubscriptionItemDto) => {
    try {
      const res = await superAdminApi.cancelSubscriptionToFree(
        record.id,
        'Super Admin chủ động chuyển về gói Starter'
      );
      if (isSuccess(res)) {
        message.success(`Đã chuyển thuê bao của công ty ${record.companyName} về gói Starter!`);
        fetchSubscriptions();
        fetchStats();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi chuyển gói cước');
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const columns = [
    {
      title: 'Doanh Nghiệp (Tenant)',
      key: 'company',
      render: (_: any, record: SuperAdminSubscriptionItemDto) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
            }}
          >
            {record.companyName?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <Space size={6} align="center">
              <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                {record.companyName || 'Công ty #' + record.companyId}
              </Text>
              {record.companyStatus === 'SUSPENDED' && (
                <Tag color="error" style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>
                  Đang khóa
                </Tag>
              )}
            </Space>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Owner: <strong>{record.ownerName || '—'}</strong> ({record.ownerEmail || '—'})
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Gói Dịch Vụ',
      key: 'plan',
      render: (_: any, record: SuperAdminSubscriptionItemDto) => {
        const isFree = !record.planPrice || record.planPrice === 0;
        return (
          <div>
            <Tag color={isFree ? 'default' : 'purple'} style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>
              {record.planName || 'Chưa đặt tên'}
            </Tag>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
              {isFree ? 'Miễn phí' : `${formatCurrency(record.planPrice)} / tháng`}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => {
        if (st === 'ACTIVE') return <Tag color="success">Đang hoạt động</Tag>;
        if (st === 'EXPIRED') return <Tag color="error">Hết hạn</Tag>;
        return <Tag color="default">{st || 'INACTIVE'}</Tag>;
      },
    },
    {
      title: 'Ngày Kích Hoạt',
      dataIndex: 'startAt',
      key: 'startAt',
      render: (d: string) => (
        <span style={{ fontSize: 12, color: '#475569' }}>
          {d ? new Date(d).toLocaleDateString('vi-VN') : '—'}
        </span>
      ),
    },
    {
      title: 'Thời Hạn Sử Dụng',
      key: 'expiration',
      render: (_: any, record: SuperAdminSubscriptionItemDto) => {
        if (record.isLifetime) {
          return (
            <Tag color="green" style={{ fontWeight: 600, padding: '2px 8px' }}>
              Vĩnh viễn
            </Tag>
          );
        }

        if (!record.endAt) {
          return <span style={{ color: '#94a3b8' }}>Chưa thiết lập</span>;
        }

        const days = record.daysRemaining ?? 0;
        return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
              {new Date(record.endAt).toLocaleDateString('vi-VN')}
            </div>
            <div style={{ marginTop: 3 }}>
              {days < 0 ? (
                <Tag color="error" style={{ fontSize: 10, margin: 0 }}>
                  Đã hết hạn {Math.abs(days)} ngày
                </Tag>
              ) : days <= 7 ? (
                <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontSize: 10, margin: 0 }}>
                  Còn {days} ngày
                </Tag>
              ) : (
                <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>
                  Còn {days} ngày
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Kế Hoạch Tiếp Theo',
      key: 'pendingPlan',
      render: (_: any, record: SuperAdminSubscriptionItemDto) => {
        if (!record.pendingPlanName) {
          return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
        }
        return (
          <Tooltip title="Gói này sẽ tự động áp dụng khi chu kỳ hiện tại kết thúc">
            <Tag color="orange" style={{ margin: 0 }}>
              Sắp hạ sang: {record.pendingPlanName}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: SuperAdminSubscriptionItemDto) => (
        <Space size={8}>
          <Tooltip title="Gia hạn thêm thời hạn">
            <Button
              type="text"
              icon={<CalendarOutlined style={{ color: '#3b82f6' }} />}
              onClick={() => handleOpenExtend(record)}
            />
          </Tooltip>

          {!record.isLifetime && (
            <Popconfirm
              title="Chuyển ngay về gói Starter?"
              description="Thuê bao này sẽ kết thúc chu kỳ trả phí và rơi về gói miễn phí ngay lập tức."
              onConfirm={() => handleCancelToFree(record)}
              okText="Hạ về Starter"
              cancelText="Hủy"
            >
              <Tooltip title="Hạ cấp về gói Starter (Miễn phí)">
                <Button
                  type="text"
                  danger
                  icon={<RollbackOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
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
            <CrownOutlined style={{ fontSize: 24, color: '#7c3aed' }} />
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              Quản Lý Thuê Bao (Subscriptions)
            </Title>
            <Tag color="purple" style={{ fontSize: 13, padding: '2px 10px', borderRadius: 12 }}>
              {total} Thuê bao
            </Tag>
          </Space>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
            Theo dõi tình trạng gói cước của tất cả doanh nghiệp, thời hạn sử dụng, cảnh báo sắp hết hạn và doanh thu định kỳ (MRR)
          </Paragraph>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchStats();
              fetchSubscriptions();
            }}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* KPI Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Tổng Thuê Bao</span>}
              value={stats?.totalSubscriptions ?? 0}
              valueStyle={{ color: '#4f46e5', fontWeight: 800 }}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Đang Hoạt Động (Active)</span>}
              value={stats?.activeSubscriptions ?? 0}
              valueStyle={{ color: '#16a34a', fontWeight: 800 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Gói Trả Phí (Paid)</span>}
              value={stats?.paidSubscriptions ?? 0}
              valueStyle={{ color: '#7c3aed', fontWeight: 800 }}
              suffix={<span style={{ fontSize: 12, color: '#94a3b8' }}>/ {stats?.freeSubscriptions ?? 0} free</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={5}>
          <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Sắp Hết Hạn (≤ 7 ngày)</span>}
              value={stats?.expiringIn7Days ?? 0}
              valueStyle={{ color: (stats?.expiringIn7Days ?? 0) > 0 ? '#dc2626' : '#64748b', fontWeight: 800 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>MRR Định Kỳ Ước Tính</span>}
              value={stats?.estimatedMrr ? formatCurrency(stats.estimatedMrr) : '0 đ'}
              valueStyle={{ color: '#0284c7', fontWeight: 800, fontSize: 18 }}
              prefix={<DollarCircleOutlined />}
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
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo tên công ty hoặc gói cước..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>

          <Col xs={12} sm={6} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo gói dịch vụ"
              value={planFilter}
              onChange={(val) => setPlanFilter(val)}
              allowClear
            >
              {plans.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
            >
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="ACTIVE">Đang hoạt động</Option>
              <Option value="EXPIRED">Đã hết hạn</Option>
              <Option value="INACTIVE">Vô hiệu hóa</Option>
            </Select>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Loại gói"
              value={isPaidFilter === undefined ? 'ALL' : isPaidFilter ? 'PAID' : 'FREE'}
              onChange={(val) => {
                if (val === 'ALL') setIsPaidFilter(undefined);
                else if (val === 'PAID') setIsPaidFilter(true);
                else setIsPaidFilter(false);
              }}
            >
              <Option value="ALL">Tất cả loại gói</Option>
              <Option value="PAID">Gói có phí (Pro, Enterprise)</Option>
              <Option value="FREE">Gói miễn phí (Starter)</Option>
            </Select>
          </Col>
        </Row>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <Space>
            <Button
              type={isExpiringSoonFilter ? 'primary' : 'default'}
              danger={isExpiringSoonFilter}
              icon={<ClockCircleOutlined />}
              onClick={() => setIsExpiringSoonFilter(!isExpiringSoonFilter)}
            >
              {isExpiringSoonFilter ? 'Đang lọc: Sắp hết hạn' : 'Sắp hết hạn (≤ 7 ngày)'}
            </Button>
          </Space>

          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Tìm kiếm
            </Button>
            <Button onClick={handleResetFilters}>Đặt lại</Button>
          </Space>
        </div>
      </Card>

      {/* Subscription Table */}
      <Card
        bordered={false}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
      >
        <Table
          dataSource={subscriptions}
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
            showTotal: (tot) => `Tổng cộng ${tot} thuê bao`,
          }}
          locale={{ emptyText: 'Không tìm thấy thuê bao nào phù hợp' }}
        />
      </Card>

      {/* Modal Gia Hạn Thuê Bao */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#3b82f6', fontSize: 20 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              Gia Hạn Thuê Bao: {selectedSub?.companyName}
            </span>
          </Space>
        }
        open={isExtendModalOpen}
        onCancel={() => setIsExtendModalOpen(false)}
        onOk={handleConfirmExtend}
        confirmLoading={extending}
        okText="Xác Nhận Gia Hạn"
        cancelText="Hủy"
        destroyOnClose
      >
        <div style={{ marginBottom: 16, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>
            Gói hiện tại: <strong>{selectedSub?.planName}</strong>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Hạn dùng hiện tại:{' '}
            <strong>
              {selectedSub?.isLifetime
                ? 'Vĩnh viễn'
                : selectedSub?.endAt
                ? new Date(selectedSub.endAt).toLocaleDateString('vi-VN')
                : 'Chưa có'}
            </strong>
          </div>
        </div>

        <Form form={extendForm} layout="vertical">
          <Form.Item
            name="months"
            label="Số tháng muốn gia hạn thêm"
            rules={[{ required: true, message: 'Vui lòng chọn số tháng' }]}
          >
            <Select size="large">
              <Option value={1}>1 Tháng</Option>
              <Option value={3}>3 Tháng</Option>
              <Option value={6}>6 Tháng</Option>
              <Option value={12}>1 Năm (12 Tháng)</Option>
              <Option value={24}>2 Năm (24 Tháng)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="Ghi chú lý do gia hạn">
            <Input.TextArea
              rows={3}
              placeholder="VD: Hỗ trợ khách hàng thanh toán chuyển khoản ngoại tuyến, Đền bù sự cố..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

