import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Spin,
  Alert,
  Divider,
  Badge,
  Modal,
  Radio,
  message,
} from 'antd';
import {
  CrownOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  TeamOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
  CreditCardOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { planApi } from '../../../api/plan';
import { isSuccess } from '../../../types/api';
import type { Plan, CompanySubscription, UpgradeCalculationResponse } from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

export const CompanyPlanCatalogPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Upgrade Modal State
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [paymentProvider, setPaymentProvider] = useState<string>('SIMULATED');
  const [upgrading, setUpgrading] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [calculation, setCalculation] = useState<UpgradeCalculationResponse | null>(null);
  const [loadingCalc, setLoadingCalc] = useState<boolean>(false);

  const fetchPlansAndSubscription = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        planApi.getActivePlans(),
        planApi.getCompanyCurrentSubscription(currentCompany.id),
      ]);

      if (isSuccess(plansRes) && plansRes.data) {
        setPlans(plansRes.data);
      }
      if (isSuccess(subRes) && subRes.data) {
        setSubscription(subRes.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndSubscription();
  }, [currentCompany?.id]);

  // Tự động tính toán số tiền nâng cấp & khấu trừ Proration khi mở modal hoặc thay đổi gói/chu kỳ
  useEffect(() => {
    if (!isUpgradeModalOpen || !selectedPlan || !currentCompany) {
      setCalculation(null);
      return;
    }
    let isSubscribed = true;
    setLoadingCalc(true);
    planApi
      .calculateUpgrade(selectedPlan.id, durationMonths, currentCompany.id)
      .then((res) => {
        if (isSubscribed && isSuccess(res) && res.data) {
          setCalculation(res.data);
          if (res.data.annualOnly && durationMonths !== 12) {
            setDurationMonths(12);
          }
        }
      })
      .catch((err) => {
        console.error('Lỗi tính toán chi phí nâng cấp:', err);
      })
      .finally(() => {
        if (isSubscribed) setLoadingCalc(false);
      });
    return () => {
      isSubscribed = false;
    };
  }, [isUpgradeModalOpen, selectedPlan?.id, durationMonths, currentCompany?.id]);

  const formatPrice = (price: number) => {
    if (!price || Number(price) === 0) {
      return { amount: '0 ₫', period: 'Miễn phí' };
    }
    return {
      amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price),
      period: '/ tháng',
    };
  };

  const formatStorage = (mb: number) => {
    if (!mb && mb !== 0) return '-';
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
    }
    return `${mb} MB`;
  };

  const currentPlan = subscription?.plan;
  const currentPlanPrice = currentPlan ? Number(currentPlan.price) : 0;
  const currentPlanId = currentPlan?.id;

  // Kiểm tra nếu subscription hiện tại là gói theo Năm
  const isCurrentSubscriptionAnnual = Boolean(
    currentPlan &&
      currentPlanPrice > 0 &&
      subscription?.startAt &&
      subscription?.endAt &&
      (
        (new Date(subscription.endAt).getTime() - new Date(subscription.startAt).getTime()) / (1000 * 60 * 60 * 24) > 60 ||
        (new Date(subscription.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24) > 30
      )
  );

  // QUY TẮC: Chỉ hiển thị các gói có giá >= giá gói hiện tại của công ty (Ẩn các gói thấp hơn)
  const visiblePlans = plans.filter((plan) => {
    if (!currentPlan) return true;
    return Number(plan.price) >= currentPlanPrice;
  });

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDurationMonths(isCurrentSubscriptionAnnual ? 12 : 1);
    setPaymentProvider('SIMULATED');
    setIsUpgradeModalOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan || !currentCompany) return;
    setUpgrading(true);
    try {
      const res = await planApi.upgradeSubscription(
        {
          targetPlanId: selectedPlan.id,
          durationMonths,
          paymentProvider,
        },
        currentCompany.id
      );

      if (isSuccess(res) && res.data) {
        const upgradeData = res.data;
        if (upgradeData.unusedCreditAmount && upgradeData.unusedCreditAmount > 0) {
          message.success(
            `Nâng cấp thành công sang gói ${selectedPlan.name}! Đã khấu trừ ${new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(upgradeData.unusedCreditAmount)} từ gói cũ (${upgradeData.remainingDaysCredited} ngày chưa dùng).`
          );
        } else {
          message.success(res.message || `Nâng cấp thành công sang gói ${selectedPlan.name}!`);
        }
        setIsUpgradeModalOpen(false);
        fetchPlansAndSubscription();
      } else {
        message.error(res.message || 'Nâng cấp gói dịch vụ thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi nâng cấp gói dịch vụ');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" tip="Đang tải danh mục gói dịch vụ..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Banner giới thiệu */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Title level={2} style={{ marginBottom: 8, fontWeight: 700 }}>
          Gói Dịch Vụ Dành Cho Doanh Nghiệp
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 15, maxWidth: 650, margin: '0 auto' }}>
          Mở rộng quy mô công ty với hạn mức tài nguyên, kênh giao tiếp Livechat và trợ lý AI RAG chuyên nghiệp.
        </Paragraph>
      </div>

      {/* Thông tin gói hiện tại của công ty */}
      {subscription && subscription.plan && (
        <Alert
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 20 }} />}
          style={{
            marginBottom: 32,
            borderRadius: 12,
            background: '#eff6ff',
            borderColor: '#bfdbfe',
            padding: '16px 20px',
          }}
          message={
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <Space size={8}>
                  <Text strong style={{ fontSize: 14 }}>Gói cước hiện tại của công ty:</Text>
                  <Tag color="blue" style={{ fontWeight: 700, fontSize: 13, padding: '2px 8px' }}>
                    {subscription.plan.name}
                  </Tag>
                  <Tag color="green">Đang hoạt động</Tag>
                </Space>

                {subscription.endAt && Number(subscription.plan.price) > 0 && (
                  <Space size={6}>
                    <CalendarOutlined style={{ color: '#0284c7' }} />
                    <Text style={{ fontSize: 13, color: '#0369a1' }}>
                      Hạn dùng đến ngày:{' '}
                      <Text strong style={{ color: '#0369a1' }}>
                        {new Date(subscription.endAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </Text>
                  </Space>
                )}
              </div>

              <div style={{ marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Định mức áp dụng: Tối đa <Text strong>{subscription.plan.maxUser}</Text> thành viên •{' '}
                  <Text strong>{subscription.plan.maxChannel}</Text> kênh •{' '}
                  RAG <Text strong>{formatStorage(subscription.plan.storageLimit)}</Text>
                  {subscription.plan.aiEnabled && (
                    <> • AI Quota: <Text strong>{new Intl.NumberFormat('vi-VN').format(subscription.plan.aiQuota)}</Text> lượt/tháng</>
                  )}
                </Text>
              </div>

              {Number(subscription.plan.price) > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #bfdbfe' }}>
                  <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b' }}>
                    * Lưu ý: Khi hết hạn chu kỳ, nếu không tiếp tục gia hạn hoặc nâng cấp, hệ thống sẽ tự động chuyển gói cước về mức Starter (Miễn phí).
                  </Text>
                </div>
              )}
            </div>
          }
        />
      )}

      {/* Danh sách Plans (Chỉ hiển thị gói hiện tại và các gói cao hơn) */}
      <Row gutter={[24, 24]} justify="center">
        {visiblePlans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const isEnterprise = plan.price >= 1000000;
          const isPro = plan.price > 0 && plan.price < 1000000;
          const priceObj = formatPrice(plan.price);

          const cardContent = (
            <Card
              hoverable
              style={{
                borderRadius: 16,
                borderColor: isCurrent ? '#1677ff' : isPro ? '#722ed1' : '#e2e8f0',
                borderWidth: isCurrent || isPro ? 2 : 1,
                boxShadow: isPro ? '0 10px 25px -5px rgba(114, 46, 209, 0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              {/* Header Gói */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    {plan.name}
                  </Title>
                  {isPro && (
                    <Tag icon={<FireOutlined />} color="purple" style={{ margin: 0, fontWeight: 600 }}>
                      Phổ biến nhất
                    </Tag>
                  )}
                  {isEnterprise && (
                    <Tag icon={<CrownOutlined />} color="gold" style={{ margin: 0, fontWeight: 600 }}>
                      Doanh nghiệp
                    </Tag>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '16px 0 8px' }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}>
                    {priceObj.amount}
                  </span>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                    {priceObj.period}
                  </span>
                </div>
              </div>

              <Divider style={{ margin: '12px 0 20px' }} />

              {/* Danh sách quyền lợi & giới hạn tài nguyên */}
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Tài nguyên & Tính năng
                </Text>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TeamOutlined style={{ color: '#0284c7', fontSize: 13 }} />
                    </div>
                    <Text style={{ fontSize: 14 }}>
                      Tối đa <Text strong>{plan.maxUser}</Text> thành viên công ty
                    </Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ApiOutlined style={{ color: '#16a34a', fontSize: 13 }} />
                    </div>
                    <Text style={{ fontSize: 14 }}>
                      Tối đa <Text strong>{plan.maxChannel}</Text> kênh kết nối Livechat
                    </Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DatabaseOutlined style={{ color: '#9333ea', fontSize: 13 }} />
                    </div>
                    <Text style={{ fontSize: 14 }}>
                      Dung lượng tài liệu RAG: <Text strong>{formatStorage(plan.storageLimit)}</Text>
                    </Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: plan.aiEnabled ? '#faf5ff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RobotOutlined style={{ color: plan.aiEnabled ? '#722ed1' : '#94a3b8', fontSize: 13 }} />
                    </div>
                    <div>
                      <Text style={{ fontSize: 14, color: plan.aiEnabled ? '#1e293b' : '#64748b' }}>
                        {plan.aiEnabled ? (
                          <>
                            Hạn mức AI: <Text strong style={{ color: '#722ed1' }}>{new Intl.NumberFormat('vi-VN').format(plan.aiQuota)}</Text> lượt/tháng
                          </>
                        ) : (
                          'Không bao gồm Trợ lý AI'
                        )}
                      </Text>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckOutlined style={{ color: '#059669', fontSize: 12 }} />
                    </div>
                    <Text style={{ fontSize: 14 }}>
                      Chat Widget nhúng Website không giới hạn
                    </Text>
                  </div>
                </div>
              </div>

              {/* Nút đăng ký / nâng cấp / đang dùng */}
              <div style={{ marginTop: 28 }}>
                {isCurrent ? (
                  <Button
                    type="primary"
                    block
                    size="large"
                    disabled
                    style={{
                      height: 44,
                      borderRadius: 10,
                      fontWeight: 600,
                      background: '#e2e8f0',
                      borderColor: '#cbd5e1',
                      color: '#475569',
                    }}
                  >
                    Đang sử dụng gói này
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleSelectPlan(plan)}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      fontWeight: 600,
                      background: isEnterprise ? '#faad14' : '#722ed1',
                      borderColor: isEnterprise ? '#faad14' : '#722ed1',
                    }}
                  >
                    Nâng cấp lên gói này
                  </Button>
                )}
              </div>
            </Card>
          );

          return (
            <Col xs={24} sm={12} md={visiblePlans.length === 1 ? 12 : 8} key={plan.id}>
              {isCurrent ? (
                <Badge.Ribbon text="GÓI HIỆN TẠI" color="blue">
                  {cardContent}
                </Badge.Ribbon>
              ) : (
                cardContent
              )}
            </Col>
          );
        })}
      </Row>

      {/* Modal Xác Nhận Nâng Cấp Gói & Thanh Toán */}
      <Modal
        title={
          <Space>
            <CrownOutlined style={{ color: '#faad14', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 700 }}>
              Xác Nhận Nâng Cấp Gói Dịch Vụ
            </span>
          </Space>
        }
        open={isUpgradeModalOpen}
        onCancel={() => setIsUpgradeModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {selectedPlan && (
          <div style={{ marginTop: 16 }}>
            {/* Box Tóm Tắt Gói */}
            <Card
              size="small"
              style={{
                borderRadius: 12,
                background: '#f8fafc',
                borderColor: '#e2e8f0',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Gói nâng cấp:</Text>
                  <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                    {selectedPlan.name}
                  </Title>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#1677ff' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPlan.price)}
                  </span>
                  <div style={{ fontSize: 11, color: '#64748b' }}>/ tháng</div>
                </div>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ fontSize: 13, color: '#475569' }}>
                • Tối đa <Text strong>{selectedPlan.maxUser}</Text> thành viên •{' '}
                <Text strong>{selectedPlan.maxChannel}</Text> kênh •{' '}
                RAG <Text strong>{formatStorage(selectedPlan.storageLimit)}</Text>
                {selectedPlan.aiEnabled && (
                  <> • <Text strong style={{ color: '#722ed1' }}>{new Intl.NumberFormat('vi-VN').format(selectedPlan.aiQuota)}</Text> lượt AI</>
                )}
              </div>
            </Card>

            {/* Chọn Chu Kỳ Thanh Toán (Chỉ 1 tháng hoặc 1 năm) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13 }}>
                  Chọn chu kỳ đăng ký:
                </Text>
                {(calculation?.annualOnly || isCurrentSubscriptionAnnual) && (
                  <Tag color="orange" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>
                    Khóa chu kỳ 1 Năm do đang dùng gói Năm
                  </Tag>
                )}
              </div>
              <Radio.Group
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                buttonStyle="solid"
                style={{ width: '100%', display: 'flex', gap: 12 }}
              >
                <Radio.Button
                  value={1}
                  disabled={Boolean(calculation?.annualOnly || isCurrentSubscriptionAnnual)}
                  style={{ flex: 1, textAlign: 'center', borderRadius: 8, height: 42, lineHeight: '40px', fontWeight: 600 }}
                >
                  1 Tháng (Theo tháng)
                </Radio.Button>
                <Radio.Button
                  value={12}
                  style={{ flex: 1, textAlign: 'center', borderRadius: 8, height: 42, lineHeight: '40px', fontWeight: 600 }}
                >
                  1 Năm (12 Tháng)
                </Radio.Button>
              </Radio.Group>
              {(calculation?.annualOnly || isCurrentSubscriptionAnnual) && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#b45309',
                    background: '#fffbeb',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #fef3c7',
                  }}
                >
                  ℹ️ {calculation?.annualOnlyReason || 'Gói hiện tại của bạn là gói theo Năm. Khi nâng cấp lên gói cao hơn, chu kỳ thanh toán áp dụng theo Năm (12 Tháng) để bảo toàn giá trị khấu trừ tiền thừa.'}
                </div>
              )}
            </div>

            {/* Phương Thức Thanh Toán */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                Phương thức thanh toán:
              </Text>
              <Radio.Group
                value={paymentProvider}
                onChange={(e) => setPaymentProvider(e.target.value)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <Radio value="SIMULATED" style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, width: '100%' }}>
                  <Space>
                    <CreditCardOutlined style={{ color: '#10b981', fontSize: 16 }} />
                    <span style={{ fontWeight: 600 }}>Thanh toán kích hoạt ngay (Môi trường Dev / Sandbox)</span>
                  </Space>
                </Radio>
                <Radio value="VNPAY" style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, width: '100%' }}>
                  <Space>
                    <span style={{ fontWeight: 600, color: '#005baa' }}>VNPay QR / Thẻ nội địa</span>
                  </Space>
                </Radio>
                <Radio value="MOMO" style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, width: '100%' }}>
                  <Space>
                    <span style={{ fontWeight: 600, color: '#a50064' }}>Ví điện tử MoMo</span>
                  </Space>
                </Radio>
              </Radio.Group>
            </div>

            {/* Chi tiết thanh toán & Khấu trừ Proration */}
            <div
              style={{
                padding: '16px 20px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              {loadingCalc ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Spin size="small" tip="Đang tính toán chi phí khấu trừ..." />
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      fontSize: 13,
                      color: '#64748b',
                    }}
                  >
                    <span>Giá niêm yết gói {selectedPlan.name} ({durationMonths} tháng):</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        calculation ? calculation.fullNewPlanAmount : selectedPlan.price * durationMonths
                      )}
                    </span>
                  </div>

                  {calculation && calculation.unusedCreditAmount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                        padding: '6px 12px',
                        background: '#ecfdf5',
                        border: '1px dashed #10b981',
                        borderRadius: 8,
                        fontSize: 13,
                        color: '#065f46',
                      }}
                    >
                      <span>
                        Khấu trừ tiền thừa gói cũ (còn <strong>{calculation.remainingDays} ngày</strong>):
                      </span>
                      <strong style={{ color: '#059669', fontSize: 14 }}>
                        - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          calculation.unusedCreditAmount
                        )}
                      </strong>
                    </div>
                  )}

                  <Divider style={{ margin: '10px 0' }} />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <Text strong style={{ fontSize: 15, color: '#1e293b' }}>
                        Tổng thanh toán thực tế:
                      </Text>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Hạn dùng mới: {durationMonths} tháng tính từ hôm nay
                      </div>
                    </div>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#1677ff' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        calculation ? calculation.finalAmountToPay : selectedPlan.price * durationMonths
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setIsUpgradeModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                loading={upgrading}
                onClick={handleConfirmUpgrade}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  padding: '0 24px',
                }}
              >
                Xác nhận nâng cấp gói
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
