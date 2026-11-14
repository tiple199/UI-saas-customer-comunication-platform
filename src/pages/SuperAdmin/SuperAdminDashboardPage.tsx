import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Tag,
  Progress,
  Spin,
  Alert,
} from 'antd';
import {
  DollarCircleOutlined,
  ShopOutlined,
  CrownOutlined,
  UsergroupAddOutlined,
  ReloadOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '../../api/superAdmin';
import { RevenueGrowthChart } from '../../components/charts/RevenueGrowthChart';
import { isSuccess } from '../../types/api';
import type { SuperAdminDashboardResponse } from '../../types/api';

const { Title, Text, Paragraph } = Typography;

export const SuperAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SuperAdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getDashboardStats();
      if (isSuccess(res) && res.data) {
        setData(res.data);
        setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatNumber = (val?: number) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0);
  };

  // Màu sắc phân bố gói cước
  const getPlanColor = (index: number) => {
    const colors = ['#1677ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[index % colors.length];
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Bảng Điều Khiển Quản Trị Hệ Thống (SaaS Overview)
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
            Theo dõi thời gian thực doanh thu, tăng trưởng doanh nghiệp, người dùng và phân bổ gói dịch vụ
          </Paragraph>
        </div>

        <Space>
          {lastUpdated && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Cập nhật lúc: <strong>{lastUpdated}</strong>
            </Text>
          )}
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchDashboardData}
            style={{ borderRadius: 8 }}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<CrownOutlined />}
            onClick={() => navigate('/super-admin/plans')}
            style={{
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              borderColor: '#4338ca',
            }}
          >
            Quản lý gói dịch vụ
          </Button>
        </Space>
      </div>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="Đang tải dữ liệu số liệu hệ thống..." />
        </div>
      ) : (
        <>
          {/* Row 1: KPI Overview Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* Card 1: Tổng Doanh Thu */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 14,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                  border: '1px solid #dcfce7',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                      Tổng Doanh Thu Toàn Sàn
                    </Text>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                      {formatCurrency(data?.totalRevenue)}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16a34a',
                      fontSize: 22,
                    }}
                  >
                    <DollarCircleOutlined />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Tag color="success" style={{ margin: 0, fontWeight: 600 }}>
                    Tháng này
                  </Tag>
                  <Text strong style={{ color: '#166534' }}>
                    {formatCurrency(data?.revenueThisMonth)}
                  </Text>
                </div>
              </Card>
            </Col>

            {/* Card 2: Doanh Nghiệp (Tenants) */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 14,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                  border: '1px solid #dbeafe',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                      Doanh Nghiệp (Tenants)
                    </Text>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8', marginTop: 4 }}>
                      {formatNumber(data?.totalCompanies)}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontSize: 22,
                    }}
                  >
                    <ShopOutlined />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                    +{data?.newCompaniesThisMonth || 0} mới
                  </Tag>
                  <Text type="secondary">trong tháng hiện tại</Text>
                </div>
              </Card>
            </Col>

            {/* Card 3: Thuê Bao Đang Hoạt Động */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 14,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                  border: '1px solid #f3e8ff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                      Thuê Bao Đang Hoạt Động
                    </Text>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#7e22ce', marginTop: 4 }}>
                      {formatNumber(data?.activeSubscriptions)}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#f3e8ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9333ea',
                      fontSize: 22,
                    }}
                  >
                    <CrownOutlined />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
                    Tỷ lệ kích hoạt
                  </Tag>
                  <Text strong style={{ color: '#6b21a8' }}>
                    {data?.totalCompanies
                      ? `${Math.round(((data?.activeSubscriptions || 0) / data.totalCompanies) * 100)}%`
                      : '100%'}
                  </Text>
                </div>
              </Card>
            </Col>

            {/* Card 4: Tổng Người Dùng Toàn Sàn */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 14,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  border: '1px solid #fef3c7',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                      Người Dùng & Tương Tác
                    </Text>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                      {formatNumber(data?.totalUsers)} Users
                    </div>
                  </div>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#d97706',
                      fontSize: 22,
                    }}
                  >
                    <UsergroupAddOutlined />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>
                    {formatNumber(data?.totalConversations)} Hội thoại
                  </Tag>
                  <Text type="secondary">qua {data?.totalChannels || 0} kênh</Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Row 2: Biểu đồ Doanh Thu 6 Tháng & Phân Bố Gói Cước */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* Cột Trái: Biểu Đồ Doanh Thu & Tăng Trưởng 6 Tháng */}
            <Col xs={24} lg={15}>
              <RevenueGrowthChart
                data={data?.monthlyTrends || []}
                formatCurrency={formatCurrency}
              />
            </Col>

            {/* Cột Phải: Phân Bố Gói Cước (Market Share) */}
            <Col xs={24} lg={9}>
              <Card
                bordered={false}
                title={
                  <Space>
                    <PieChartOutlined style={{ color: '#8b5cf6', fontSize: 18 }} />
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      Phân Bố Thị Phần Gói Dịch Vụ
                    </span>
                  </Space>
                }
                style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', height: '100%' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {data?.planDistributions && data.planDistributions.length > 0 ? (
                    data.planDistributions.map((plan, idx) => (
                      <div
                        key={plan.planId || idx}
                        style={{
                          padding: '12px 16px',
                          background: '#f8fafc',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Space size={8}>
                            <div
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: getPlanColor(idx),
                              }}
                            />
                            <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                              {plan.planName}
                            </Text>
                          </Space>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              {plan.companyCount} công ty
                            </span>
                            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>
                              ({plan.percentage}%)
                            </span>
                          </div>
                        </div>
                        <Progress
                          percent={plan.percentage}
                          showInfo={false}
                          strokeColor={getPlanColor(idx)}
                          size={['100%', 7]}
                        />
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'right' }}>
                          Giá niêm yết: {formatCurrency(plan.monthlyPrice)} / tháng
                        </div>
                      </div>
                    ))
                  ) : (
                    <Alert message="Chưa có dữ liệu thuê bao đăng ký gói" type="info" showIcon />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

