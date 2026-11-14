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
  Table,
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
  ReloadOutlined,
  QrcodeOutlined,
  CopyOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { planApi } from '../../../api/plan';
import { paymentApi } from '../../../api/payment';
import { isSuccess } from '../../../types/api';
import type {
  Plan,
  CompanySubscription,
  UpgradeCalculationResponse,
  PaymentOrderResponse,
  PaymentResponse,
} from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export const CompanyPlanCatalogPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Downgrade Modal State
  const [downgradeModalOpen, setDowngradeModalOpen] = useState<boolean>(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<Plan | null>(null);
  const [downgrading, setDowngrading] = useState<boolean>(false);
  const [cancelingDowngrade, setCancelingDowngrade] = useState<boolean>(false);

  // Renew Modal State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState<boolean>(false);
  const [renewDurationMonths, setRenewDurationMonths] = useState<number>(1);
  const [renewPaymentProvider, setRenewPaymentProvider] = useState<string>('SIMULATED');
  const [renewing, setRenewing] = useState<boolean>(false);

  // Payment Order State (Hướng 1)
  const [activePaymentOrder, setActivePaymentOrder] = useState<PaymentOrderResponse | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [confirmingPayment, setConfirmingPayment] = useState<boolean>(false);
  const [cancelingPayment, setCancelingPayment] = useState<boolean>(false);

  // Payment History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

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

  // Xử lý Return URL Redirect từ Cổng thanh toán (PayOS, VNPay, Mock Sandbox)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const orderCodeParam =
      searchParams.get('orderCode') ||
      searchParams.get('vnp_TxnRef') ||
      searchParams.get('mock_paid');
    const cancelParam = searchParams.get('cancel');
    const codeParam = searchParams.get('code');
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');

    if (!orderCodeParam) return;

    const isSuccessRedirect =
      statusParam === 'PAID' ||
      (codeParam === '00' && cancelParam !== 'true') ||
      vnpResponseCode === '00' ||
      searchParams.has('mock_paid');

    const isCancelRedirect = cancelParam === 'true' || statusParam === 'CANCELLED';

    const clearUrlParams = () => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('status');
      nextParams.delete('orderCode');
      nextParams.delete('cancel');
      nextParams.delete('code');
      nextParams.delete('id');
      nextParams.delete('vnp_ResponseCode');
      nextParams.delete('vnp_TxnRef');
      nextParams.delete('mock_paid');
      setSearchParams(nextParams, { replace: true });
    };

    if (isSuccessRedirect) {
      const finalizePayment = async () => {
        try {
          const confirmRes = await paymentApi.confirmPayment({
            transactionRef: orderCodeParam,
            note: 'Xác nhận tự động qua Return URL redirect từ cổng thanh toán',
          });

          if (isSuccess(confirmRes) && confirmRes.data) {
            Modal.success({
              title: 'Thanh Toán Thành Công!',
              content: (
                <div>
                  <p>
                    Giao dịch <strong>#{orderCodeParam}</strong> đã được cổng thanh toán xác nhận thành công.
                  </p>
                  <p>Hệ thống đã tự động kích hoạt / gia hạn quyền lợi gói cước cho công ty của bạn!</p>
                </div>
              ),
              okText: 'Tuyệt vời',
              onOk: () => {
                fetchPlansAndSubscription();
              },
            });
            fetchPlansAndSubscription();
          }
        } catch {
          // Trường hợp webhook đã kích hoạt trước đó, refresh lại dữ liệu
          fetchPlansAndSubscription();
        } finally {
          clearUrlParams();
        }
      };

      finalizePayment();
    } else if (isCancelRedirect) {
      message.warning(`Giao dịch thanh toán #${orderCodeParam} đã được hủy bỏ.`);
      clearUrlParams();
    }
  }, [searchParams]);

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

  // Hiển thị tất cả các gói dịch vụ (sắp xếp theo giá tăng dần)
  const sortedPlans = [...plans].sort((a, b) => Number(a.price) - Number(b.price));

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDurationMonths(isCurrentSubscriptionAnnual ? 12 : 1);
    setPaymentProvider('SIMULATED');
    setIsUpgradeModalOpen(true);
  };

  // Polling trạng thái đơn hàng thanh toán
  useEffect(() => {
    if (!isPaymentModalOpen || !activePaymentOrder || activePaymentOrder.status !== 'PENDING') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await paymentApi.getPaymentStatus(activePaymentOrder.transactionRef);
        if (isSuccess(res) && res.data) {
          if (res.data.status === 'SUCCESS') {
            setActivePaymentOrder((prev) => (prev ? { ...prev, status: 'SUCCESS' } : null));
            message.success('Thanh toán thành công! Gói cước đã được kích hoạt.');
            fetchPlansAndSubscription();
          } else if (res.data.status === 'FAILED' || res.data.status === 'CANCELLED') {
            setActivePaymentOrder((prev) => (prev ? { ...prev, status: res.data.status } : null));
          }
        }
      } catch {
        // ignore polling error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaymentModalOpen, activePaymentOrder?.transactionRef, activePaymentOrder?.status]);

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan || !currentCompany) return;
    setUpgrading(true);
    try {
      const res = await paymentApi.createPaymentOrder(
        {
          orderType: 'UPGRADE',
          targetPlanId: selectedPlan.id,
          durationMonths,
          paymentProvider: paymentProvider,
        },
        currentCompany.id
      );

      if (isSuccess(res) && res.data) {
        setIsUpgradeModalOpen(false);
        setActivePaymentOrder(res.data);
        setIsPaymentModalOpen(true);
        if (res.data.status === 'SUCCESS') {
          message.success('Nâng cấp gói dịch vụ thành công!');
          fetchPlansAndSubscription();
        }
      } else {
        message.error(res.message || 'Khởi tạo đơn thanh toán nâng cấp thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi khởi tạo đơn thanh toán');
    } finally {
      setUpgrading(false);
    }
  };

  const handleSelectDowngrade = (plan: Plan) => {
    setSelectedDowngradePlan(plan);
    setDowngradeModalOpen(true);
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedDowngradePlan || !currentCompany) return;
    setDowngrading(true);
    try {
      const res = await planApi.downgradeSubscription(
        { targetPlanId: selectedDowngradePlan.id },
        currentCompany.id
      );
      if (isSuccess(res)) {
        message.success(
          res.message ||
            `Đã ghi nhận yêu cầu chuyển sang gói ${selectedDowngradePlan.name}. Gói mới sẽ có hiệu lực vào cuối chu kỳ hiện tại!`
        );
        setDowngradeModalOpen(false);
        fetchPlansAndSubscription();
      } else {
        message.error(res.message || 'Yêu cầu chuyển gói thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi yêu cầu chuyển gói');
    } finally {
      setDowngrading(false);
    }
  };

  const handleCancelPendingDowngrade = async () => {
    if (!currentCompany) return;
    setCancelingDowngrade(true);
    try {
      const res = await planApi.cancelPendingDowngrade(currentCompany.id);
      if (isSuccess(res)) {
        message.success('Đã hủy yêu cầu chuyển gói thành công. Công ty tiếp tục duy trì gói hiện tại!');
        fetchPlansAndSubscription();
      } else {
        message.error(res.message || 'Hủy yêu cầu chuyển gói thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi hủy yêu cầu chuyển gói');
    } finally {
      setCancelingDowngrade(false);
    }
  };

  const handleOpenRenewModal = () => {
    setRenewDurationMonths(isCurrentSubscriptionAnnual ? 12 : 1);
    setRenewPaymentProvider('SIMULATED');
    setIsRenewModalOpen(true);
  };

  const handleConfirmRenew = async () => {
    if (!currentCompany || !currentPlan) return;
    setRenewing(true);
    try {
      const res = await paymentApi.createPaymentOrder(
        {
          orderType: 'RENEW',
          durationMonths: renewDurationMonths,
          paymentProvider: renewPaymentProvider,
        },
        currentCompany.id
      );

      if (isSuccess(res) && res.data) {
        setIsRenewModalOpen(false);
        setActivePaymentOrder(res.data);
        setIsPaymentModalOpen(true);
        if (res.data.status === 'SUCCESS') {
          message.success(`Gia hạn thành công gói ${currentPlan.name}!`);
          fetchPlansAndSubscription();
        }
      } else {
        message.error(res.message || 'Khởi tạo đơn gia hạn thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi khởi tạo đơn gia hạn');
    } finally {
      setRenewing(false);
    }
  };

  const handleConfirmPaymentManual = async () => {
    if (!activePaymentOrder) return;
    setConfirmingPayment(true);
    try {
      const res = await paymentApi.confirmPayment({
        transactionRef: activePaymentOrder.transactionRef,
        note: 'Xác nhận thanh toán thủ công từ giao diện người dùng',
      });
      if (isSuccess(res)) {
        setActivePaymentOrder((prev) => (prev ? { ...prev, status: 'SUCCESS' } : null));
        message.success('Xác nhận thanh toán thành công! Gói cước đã được kích hoạt.');
        fetchPlansAndSubscription();
      } else {
        message.error(res.message || 'Xác nhận thanh toán thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleCancelPaymentOrder = async () => {
    if (!activePaymentOrder) return;
    setCancelingPayment(true);
    try {
      const res = await paymentApi.cancelPaymentOrder(activePaymentOrder.transactionRef);
      if (isSuccess(res)) {
        message.info('Đã hủy đơn giao dịch thanh toán.');
        setIsPaymentModalOpen(false);
        setActivePaymentOrder(null);
      } else {
        message.error(res.message || 'Hủy đơn giao dịch thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi hủy đơn giao dịch');
    } finally {
      setCancelingPayment(false);
    }
  };

  const handleOpenHistory = async () => {
    if (!currentCompany) return;
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await paymentApi.getCompanyPayments(currentCompany.id, 0, 50);
      if (isSuccess(res) && res.data) {
        setPaymentHistory(res.data.items || []);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tải lịch sử thanh toán');
    } finally {
      setLoadingHistory(false);
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

      {/* Banner thông báo nếu đang có yêu cầu chuyển sang gói thấp hơn chờ hiệu lực */}
      {subscription?.pendingPlanId && (
        <Alert
          type="warning"
          showIcon
          style={{
            marginBottom: 24,
            borderRadius: 12,
            background: '#fffbeb',
            borderColor: '#fde68a',
            padding: '16px 20px',
          }}
          message={
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <Text strong style={{ fontSize: 14, color: '#92400e' }}>
                  Yêu cầu chuyển gói đang chờ xử lý:
                </Text>{' '}
                <Text style={{ fontSize: 13, color: '#b45309' }}>
                  Công ty đã đăng ký chuyển sang gói <strong>{subscription.pendingPlan?.name || 'gói thấp hơn'}</strong>.
                  Gói mới sẽ chính thức có hiệu lực vào cuối chu kỳ hiện tại (ngày{' '}
                  <strong>{subscription.endAt ? new Date(subscription.endAt).toLocaleDateString('vi-VN') : ''}</strong>).
                </Text>
              </div>
              <Button
                danger
                size="middle"
                loading={cancelingDowngrade}
                onClick={handleCancelPendingDowngrade}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Hủy yêu cầu chuyển gói
              </Button>
            </div>
          }
        />
      )}

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Space size={6}>
                      <CalendarOutlined style={{ color: (() => {
                        const dLeft = Math.ceil((new Date(subscription.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return dLeft <= 7 ? '#dc2626' : '#0284c7';
                      })() }} />
                      <Text style={{ fontSize: 13, color: '#0369a1' }}>
                        Hạn dùng đến ngày:{' '}
                        <Text strong style={{ color: '#0369a1' }}>
                          {new Date(subscription.endAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </Text>
                      {(() => {
                        const dLeft = Math.ceil((new Date(subscription.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        if (dLeft <= 7) {
                          return (
                            <Tag color="red" style={{ fontWeight: 600, marginLeft: 4 }}>
                              {dLeft <= 0 ? 'Hết hạn hôm nay' : `Còn ${dLeft} ngày`}
                            </Tag>
                          );
                        }
                        return null;
                      })()}
                    </Space>

                    <Button
                      icon={<HistoryOutlined />}
                      size="small"
                      onClick={handleOpenHistory}
                      style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        height: 32,
                        padding: '0 12px',
                      }}
                    >
                      Lịch sử hóa đơn
                    </Button>

                    <Button
                      type="primary"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleOpenRenewModal}
                      style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        background: '#16a34a',
                        borderColor: '#16a34a',
                        height: 32,
                        padding: '0 12px',
                      }}
                    >
                      Gia hạn gói này
                    </Button>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 6 }}>
                  <Text strong style={{ fontSize: 13, color: '#1e3a8a' }}>
                    Tình trạng sử dụng thực tế (Usage & Quota Enforced):
                  </Text>
                </div>
                {subscription.usage ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <Tag color={subscription.usage.activeUsers >= (subscription.usage.maxUsers || 9999) ? 'red' : 'blue'} style={{ padding: '4px 10px', fontSize: 12 }}>
                      <TeamOutlined style={{ marginRight: 5 }} />
                      Thành viên: <Text strong>{subscription.usage.activeUsers}</Text> / {subscription.usage.maxUsers || '∞'}
                    </Tag>
                    <Tag color={subscription.usage.activeChannels >= (subscription.usage.maxChannels || 9999) ? 'red' : 'cyan'} style={{ padding: '4px 10px', fontSize: 12 }}>
                      <ApiOutlined style={{ marginRight: 5 }} />
                      Kênh Livechat: <Text strong>{subscription.usage.activeChannels}</Text> / {subscription.usage.maxChannels || '∞'}
                    </Tag>
                    <Tag color={(subscription.usage.usedStorageBytes / (1024 * 1024)) >= (subscription.usage.storageLimitMb || 999999) ? 'red' : 'purple'} style={{ padding: '4px 10px', fontSize: 12 }}>
                      <DatabaseOutlined style={{ marginRight: 5 }} />
                      Lưu trữ RAG: <Text strong>{(subscription.usage.usedStorageBytes / (1024 * 1024)).toFixed(1)} MB</Text> / {subscription.usage.storageLimitMb || 0} MB
                    </Tag>
                    {subscription.usage.aiEnabled ? (
                      <Tag color={subscription.usage.usedAiQuotaThisMonth >= (subscription.usage.aiQuota || 999999) ? 'red' : 'gold'} style={{ padding: '4px 10px', fontSize: 12 }}>
                        <RobotOutlined style={{ marginRight: 5 }} />
                        AI Quota tháng này: <Text strong>{subscription.usage.usedAiQuotaThisMonth}</Text> / {new Intl.NumberFormat('vi-VN').format(subscription.usage.aiQuota || 0)} lượt
                      </Tag>
                    ) : (
                      <Tag color="default" style={{ padding: '4px 10px', fontSize: 12 }}>
                        <RobotOutlined style={{ marginRight: 5 }} />
                        AI Auto-Reply: <Text type="secondary">Chưa kích hoạt ở gói này</Text>
                      </Tag>
                    )}
                  </div>
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Định mức áp dụng: Tối đa <Text strong>{subscription.plan.maxUser}</Text> thành viên •{' '}
                    <Text strong>{subscription.plan.maxChannel}</Text> kênh •{' '}
                    RAG <Text strong>{formatStorage(subscription.plan.storageLimit)}</Text>
                    {subscription.plan.aiEnabled && (
                      <> • AI Quota: <Text strong>{new Intl.NumberFormat('vi-VN').format(subscription.plan.aiQuota)}</Text> lượt/tháng</>
                    )}
                  </Text>
                )}
              </div>

              {Number(subscription.plan.price) > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #bfdbfe' }}>
                  <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b' }}>
                    {subscription.pendingPlan ? (
                      <>
                        * Ghi chú: Công ty đang có lịch chuyển sang gói <Text strong style={{ color: '#d97706' }}>{subscription.pendingPlan.name}</Text> vào ngày {new Date(subscription.endAt!).toLocaleDateString('vi-VN')}.
                      </>
                    ) : (
                      '* Lưu ý: Khi hết hạn chu kỳ, nếu không tiếp tục gia hạn hoặc nâng cấp, hệ thống sẽ tự động chuyển gói cước về mức Starter (Miễn phí).'
                    )}
                  </Text>
                </div>
              )}
            </div>
          }
        />
      )}

      {/* Danh sách Plans */}
      <Row gutter={[24, 24]} justify="center">
        {sortedPlans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const isPending = subscription?.pendingPlanId === plan.id;
          const isEnterprise = plan.price >= 1000000;
          const isPro = plan.price > 0 && plan.price < 1000000;
          const isDowngrade = currentPlan && Number(plan.price) < currentPlanPrice;
          const priceObj = formatPrice(plan.price);

          const cardContent = (
            <Card
              hoverable
              style={{
                borderRadius: 16,
                borderColor: isCurrent ? '#1677ff' : isPending ? '#f59e0b' : isPro ? '#722ed1' : '#e2e8f0',
                borderWidth: isCurrent || isPending || isPro ? 2 : 1,
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

              {/* Nút đăng ký / nâng cấp / hạ cấp / đang dùng */}
              <div style={{ marginTop: 28 }}>
                {isCurrent ? (
                  Number(plan.price) > 0 ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        disabled
                        style={{
                          flex: 1,
                          height: 44,
                          borderRadius: 10,
                          fontWeight: 600,
                          background: '#f1f5f9',
                          borderColor: '#cbd5e1',
                          color: '#475569',
                        }}
                      >
                        Đang dùng
                      </Button>
                      <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={handleOpenRenewModal}
                        style={{
                          flex: 1,
                          height: 44,
                          borderRadius: 10,
                          fontWeight: 600,
                          background: '#16a34a',
                          borderColor: '#16a34a',
                        }}
                      >
                        Gia hạn gói
                      </Button>
                    </div>
                  ) : (
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
                  )
                ) : isPending ? (
                  <Button
                    block
                    size="large"
                    disabled
                    style={{
                      height: 44,
                      borderRadius: 10,
                      fontWeight: 600,
                      background: '#fffbeb',
                      borderColor: '#fde68a',
                      color: '#b45309',
                    }}
                  >
                    Chờ kích hoạt vào cuối chu kỳ
                  </Button>
                ) : isDowngrade ? (
                  <Button
                    block
                    size="large"
                    icon={<CalendarOutlined />}
                    onClick={() => handleSelectDowngrade(plan)}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      fontWeight: 600,
                      borderColor: '#d97706',
                      color: '#d97706',
                      background: '#fff',
                    }}
                  >
                    Chuyển sang gói này (Cuối chu kỳ)
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

          let ribbonText = '';
          let ribbonColor = '';
          if (isCurrent) {
            ribbonText = 'GÓI HIỆN TẠI';
            ribbonColor = 'blue';
          } else if (isPending) {
            ribbonText = 'CHỜ KÍCH HOẠT';
            ribbonColor = 'orange';
          } else if (isPro) {
            ribbonText = 'PHỔ BIẾN';
            ribbonColor = 'purple';
          }

          return (
            <Col xs={24} sm={12} md={sortedPlans.length <= 2 ? 12 : 8} key={plan.id}>
              {ribbonText ? (
                <Badge.Ribbon text={ribbonText} color={ribbonColor}>
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
                <Radio value="SIMULATED" style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, width: '100%' }}>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <ThunderboltOutlined style={{ color: '#10b981', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Thanh toán kích hoạt ngay (Thử nghiệm / Test)</span>
                      <Tag color="success">Kích hoạt tức thì</Tag>
                    </Space>
                    <span style={{ color: '#64748b', fontSize: 12, paddingLeft: 22 }}>
                      Kích hoạt gói cước ngay lập tức mà không cần chuyển tiền thật. Phục vụ kiểm thử luồng nghiệp vụ.
                    </span>
                  </Space>
                </Radio>
                <Radio value="PAYOS" style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, width: '100%' }}>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <QrcodeOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>Cổng thanh toán PayOS (Thanh toán thật)</span>
                      <Tag color="blue">VietQR 24/7 & Auto Webhook</Tag>
                    </Space>
                    <span style={{ color: '#64748b', fontSize: 12, paddingLeft: 22 }}>
                      Quét mã VietQR động từ app ngân hàng thật. Hệ thống đối soát Webhook và tự động kích hoạt ngay khi nhận tiền.
                    </span>
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

      {/* Modal Xác Nhận Chuyển Gói Thấp Hơn (Downgrade vào cuối chu kỳ) */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#d97706', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 700 }}>
              Xác Nhận Chuyển Sang Gói {selectedDowngradePlan?.name}
            </span>
          </Space>
        }
        open={downgradeModalOpen}
        onCancel={() => setDowngradeModalOpen(false)}
        footer={null}
        width={540}
        destroyOnClose
      >
        {selectedDowngradePlan && (
          <div style={{ marginTop: 16 }}>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 20, borderRadius: 10 }}
              message={
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Quy tắc chuyển đổi gói cước:</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>
                    Gói <strong>{selectedDowngradePlan.name}</strong> sẽ chính thức được kích hoạt vào ngày{' '}
                    <strong>{subscription?.endAt ? new Date(subscription.endAt).toLocaleDateString('vi-VN') : 'kết thúc chu kỳ'}</strong>.
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                    Trong thời gian từ nay đến ngày đó, công ty vẫn được sử dụng toàn bộ tính năng và quyền lợi của gói hiện tại (<strong>{currentPlan?.name}</strong>) mà không bị gián đoạn.
                  </div>
                </div>
              }
            />

            <Card size="small" style={{ borderRadius: 10, background: '#f8fafc', marginBottom: 20, borderColor: '#e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text type="secondary">Gói hiện tại của công ty:</Text>
                <Text strong>{currentPlan?.name}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text type="secondary">Gói đăng ký chuyển sang:</Text>
                <Text strong style={{ color: '#1677ff' }}>
                  {selectedDowngradePlan.name} ({formatPrice(selectedDowngradePlan.price).amount}/tháng)
                </Text>
              </div>
              <Divider style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Thời điểm áp dụng gói mới:</Text>
                <Text strong style={{ color: '#d97706' }}>
                  {subscription?.endAt ? new Date(subscription.endAt).toLocaleDateString('vi-VN') : 'Sau khi hết hạn'}
                </Text>
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setDowngradeModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                danger
                size="large"
                loading={downgrading}
                onClick={handleConfirmDowngrade}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Xác nhận đặt lịch chuyển gói
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Gia Hạn Gói Cước Hiện Tại */}
      <Modal
        title={
          <Space>
            <ReloadOutlined style={{ color: '#16a34a', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 700 }}>
              Gia Hạn Gói Cước {currentPlan?.name}
            </span>
          </Space>
        }
        open={isRenewModalOpen}
        onCancel={() => setIsRenewModalOpen(false)}
        footer={null}
        width={540}
        destroyOnClose
      >
        {currentPlan && (
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
                  <Text type="secondary" style={{ fontSize: 12 }}>Gói đang sử dụng:</Text>
                  <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                    {currentPlan.name}
                  </Title>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPlan.price)}
                  </span>
                  <div style={{ fontSize: 11, color: '#64748b' }}>/ tháng</div>
                </div>
              </div>
            </Card>

            {/* Chọn Chu Kỳ Gia Hạn */}
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                Chọn thời gian gia hạn:
              </Text>
              <Radio.Group
                value={renewDurationMonths}
                onChange={(e) => setRenewDurationMonths(e.target.value)}
                buttonStyle="solid"
                style={{ width: '100%', display: 'flex', gap: 12 }}
              >
                <Radio.Button value={1} style={{ flex: 1, textAlign: 'center', borderRadius: 8, height: 42, lineHeight: '40px', fontWeight: 600 }}>
                  Thêm 1 Tháng
                </Radio.Button>
                <Radio.Button value={12} style={{ flex: 1, textAlign: 'center', borderRadius: 8, height: 42, lineHeight: '40px', fontWeight: 600 }}>
                  Thêm 1 Năm (12 Tháng)
                </Radio.Button>
              </Radio.Group>
            </div>

            {/* Phương Thức Thanh Toán */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                Phương thức thanh toán:
              </Text>
              <Radio.Group
                value={renewPaymentProvider}
                onChange={(e) => setRenewPaymentProvider(e.target.value)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <Radio value="SIMULATED" style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, width: '100%' }}>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <ThunderboltOutlined style={{ color: '#10b981', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Thanh toán kích hoạt ngay (Thử nghiệm / Test)</span>
                      <Tag color="success">Kích hoạt tức thì</Tag>
                    </Space>
                    <span style={{ color: '#64748b', fontSize: 12, paddingLeft: 22 }}>
                      Kích hoạt gia hạn gói cước ngay lập tức mà không cần chuyển tiền thật. Phục vụ kiểm thử luồng nghiệp vụ.
                    </span>
                  </Space>
                </Radio>
                <Radio value="PAYOS" style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, width: '100%' }}>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <QrcodeOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>Cổng thanh toán PayOS (Thanh toán thật)</span>
                      <Tag color="blue">VietQR 24/7 & Auto Webhook</Tag>
                    </Space>
                    <span style={{ color: '#64748b', fontSize: 12, paddingLeft: 22 }}>
                      Quét mã VietQR động từ app ngân hàng thật. Hệ thống đối soát Webhook và tự động gia hạn ngay khi nhận tiền.
                    </span>
                  </Space>
                </Radio>
              </Radio.Group>
            </div>

            {/* Chi Tiết Gia Hạn & Cộng Dồn Thời Gian */}
            <div
              style={{
                padding: '16px 20px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#166534' }}>
                <span>Hạn sử dụng hiện tại:</span>
                <span style={{ fontWeight: 600 }}>
                  {subscription?.endAt ? new Date(subscription.endAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#166534' }}>
                <span>Hạn sử dụng sau khi gia hạn:</span>
                <span style={{ fontWeight: 700, color: '#15803d' }}>
                  {(() => {
                    const base = subscription?.endAt && new Date(subscription.endAt).getTime() > Date.now()
                      ? new Date(subscription.endAt)
                      : new Date();
                    const d = new Date(base);
                    d.setMonth(d.getMonth() + renewDurationMonths);
                    return `${d.toLocaleDateString('vi-VN')} (+${renewDurationMonths} tháng)`;
                  })()}
                </span>
              </div>

              <Divider style={{ margin: '10px 0', borderColor: '#bbf7d0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 15, color: '#14532d' }}>Tổng thanh toán gia hạn:</Text>
                  <div style={{ fontSize: 11, color: '#166534' }}>Cộng dồn liên tục, không gián đoạn dịch vụ</div>
                </div>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    currentPlan.price * renewDurationMonths
                  )}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setIsRenewModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                loading={renewing}
                onClick={handleConfirmRenew}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  padding: '0 24px',
                  background: '#16a34a',
                  borderColor: '#16a34a',
                }}
              >
                Xác nhận thanh toán gia hạn
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Cổng Thanh Toán Chuẩn VietQR & Polling (Hướng 1) */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined style={{ color: '#1677ff', fontSize: 22 }} />
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              {activePaymentOrder?.status === 'SUCCESS'
                ? 'Thanh Toán Thành Công'
                : 'Thanh Toán Đơn Hàng Dịch Vụ'}
            </span>
          </Space>
        }
        open={isPaymentModalOpen}
        onCancel={() => {
          setIsPaymentModalOpen(false);
          setActivePaymentOrder(null);
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        {activePaymentOrder && (
          <div style={{ marginTop: 12 }}>
            {activePaymentOrder.status === 'SUCCESS' ? (
              <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                <CheckCircleOutlined style={{ fontSize: 64, color: '#16a34a', marginBottom: 16 }} />
                <Title level={3} style={{ color: '#15803d', marginBottom: 8 }}>
                  Kích Hoạt Gói Cước Thành Công!
                </Title>
                <Paragraph style={{ fontSize: 14, color: '#475569', maxWidth: 480, margin: '0 auto 24px' }}>
                  Đơn hàng <strong>{activePaymentOrder.transactionRef}</strong> ({activePaymentOrder.orderType === 'UPGRADE' ? 'Nâng cấp' : 'Gia hạn'} gói{' '}
                  <strong>{activePaymentOrder.targetPlanName}</strong>) đã được hoàn tất và hệ thống đã cập nhật định mức quyền lợi cho công ty.
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setActivePaymentOrder(null);
                    fetchPlansAndSubscription();
                  }}
                  style={{ borderRadius: 8, padding: '0 32px', fontWeight: 600 }}
                >
                  Hoàn tất & Đóng
                </Button>
              </div>
            ) : (
              <div>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16, borderRadius: 8 }}
                  message={
                    <span>
                      Vui lòng mở ứng dụng ngân hàng hoặc ví điện tử bất kỳ quét mã <strong>VietQR</strong> bên dưới để hoàn tất giao dịch tự động.
                    </span>
                  }
                />

                <Row gutter={[24, 24]} align="middle">
                  {/* Cột Trái: Ảnh QR Code VietQR */}
                  <Col xs={24} sm={11} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        padding: 12,
                        background: '#ffffff',
                        border: '2px solid #e2e8f0',
                        borderRadius: 16,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        display: 'inline-block',
                      }}
                    >
                      {activePaymentOrder.qrCodeUrl ? (
                        <img
                          src={activePaymentOrder.qrCodeUrl}
                          alt="VietQR Code"
                          style={{ width: '100%', maxWidth: 260, height: 'auto', display: 'block', borderRadius: 8 }}
                        />
                      ) : (
                        <Spin size="large" />
                      )}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Spin size="small" />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Hệ thống tự động kiểm tra giao dịch...
                      </Text>
                    </div>
                  </Col>

                  {/* Cột Phải: Thông tin chuyển khoản chi tiết */}
                  <Col xs={24} sm={13}>
                    <Card
                      size="small"
                      style={{
                        borderRadius: 12,
                        background: '#f8fafc',
                        borderColor: '#e2e8f0',
                      }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Ngân hàng thụ hưởng:</Text>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                          {activePaymentOrder.bankName || 'MB Bank'} ({activePaymentOrder.bankCode || 'MB'})
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Chủ tài khoản:</Text>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                          {activePaymentOrder.bankAccountName || 'CONG TY SAAS'}
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Số tài khoản:</Text>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', letterSpacing: 0.5 }}>
                            {activePaymentOrder.bankAccountNumber || '0987654321'}
                          </span>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(activePaymentOrder.bankAccountNumber || '');
                              message.success('Đã sao chép số tài khoản');
                            }}
                          >
                            Sao chép
                          </Button>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Số tiền thanh toán:</Text>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: 20, color: '#16a34a' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activePaymentOrder.amount)}
                          </span>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(String(activePaymentOrder.amount));
                              message.success('Đã sao chép số tiền');
                            }}
                          >
                            Sao chép
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Nội dung chuyển khoản (bắt buộc đúng):</Text>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef3c7', padding: '6px 10px', borderRadius: 6, border: '1px dashed #f59e0b' }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: '#b45309' }}>
                            {activePaymentOrder.transferContent}
                          </span>
                          <Button
                            size="small"
                            type="primary"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(activePaymentOrder.transferContent || '');
                              message.success('Đã sao chép nội dung');
                            }}
                            style={{ background: '#d97706', borderColor: '#d97706' }}
                          >
                            Sao chép
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activePaymentOrder.checkoutUrl && (
                        <Button
                          icon={<CreditCardOutlined />}
                          onClick={() => {
                            if (
                              activePaymentOrder.checkoutUrl?.includes('payos.vn') ||
                              activePaymentOrder.checkoutUrl?.includes('vnpayment.vn')
                            ) {
                              window.open(activePaymentOrder.checkoutUrl, '_blank');
                            } else {
                              // Giả lập redirect thành công ngay trên origin & port hiện tại của trình duyệt
                              window.location.href = `${window.location.origin}/admin/plans?status=PAID&orderCode=${activePaymentOrder.transactionRef}`;
                            }
                          }}
                          style={{
                            height: 38,
                            borderRadius: 8,
                            fontWeight: 600,
                            color: '#1677ff',
                            borderColor: '#1677ff',
                          }}
                        >
                          {activePaymentOrder.checkoutUrl?.includes('payos.vn')
                            ? 'Mở Trang Thanh Toán Cổng PayOS'
                            : 'Mở Trang Thanh Toán Thử Nghiệm (Giả Lập Redirect)'}
                        </Button>
                      )}

                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        loading={confirmingPayment}
                        onClick={handleConfirmPaymentManual}
                        style={{
                          height: 40,
                          borderRadius: 8,
                          fontWeight: 600,
                          background: '#16a34a',
                          borderColor: '#16a34a',
                        }}
                      >
                        Tôi đã chuyển khoản thành công (Kích hoạt ngay)
                      </Button>

                      <Button
                        danger
                        loading={cancelingPayment}
                        onClick={handleCancelPaymentOrder}
                        style={{ height: 36, borderRadius: 8 }}
                      >
                        Hủy đơn giao dịch này
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Lịch Sử Thanh Toán & Hóa Đơn */}
      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 700 }}>
              Lịch Sử Thanh Toán & Hóa Đơn Doanh Nghiệp
            </span>
          </Space>
        }
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={null}
        width={860}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          <Table
            dataSource={paymentHistory}
            rowKey="id"
            loading={loadingHistory}
            pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} giao dịch` }}
            columns={[
              {
                title: 'Mã GD',
                dataIndex: 'transactionRef',
                key: 'transactionRef',
                render: (val: string) => <Text code style={{ fontWeight: 700 }}>{val}</Text>,
              },
              {
                title: 'Loại GD',
                dataIndex: 'orderType',
                key: 'orderType',
                render: (type: string) => (
                  <Tag color={type === 'UPGRADE' ? 'blue' : 'purple'}>
                    {type === 'UPGRADE' ? 'Nâng cấp' : 'Gia hạn'}
                  </Tag>
                ),
              },
              {
                title: 'Gói cước',
                dataIndex: 'planName',
                key: 'planName',
                render: (val: string) => <Text strong>{val || 'N/A'}</Text>,
              },
              {
                title: 'Số tiền',
                dataIndex: 'amount',
                key: 'amount',
                render: (val: number) => (
                  <Text strong style={{ color: '#16a34a' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}
                  </Text>
                ),
              },
              {
                title: 'Phương thức',
                dataIndex: 'provider',
                key: 'provider',
                render: (p: string) => <Tag>{p}</Tag>,
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => {
                  if (status === 'SUCCESS') return <Tag color="green">Thành công</Tag>;
                  if (status === 'PENDING') return <Tag color="gold">Chờ thanh toán</Tag>;
                  if (status === 'CANCELLED') return <Tag color="default">Đã hủy</Tag>;
                  return <Tag color="red">Thất bại</Tag>;
                },
              },
              {
                title: 'Thời gian',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date: string) => (date ? new Date(date).toLocaleString('vi-VN') : '—'),
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};
