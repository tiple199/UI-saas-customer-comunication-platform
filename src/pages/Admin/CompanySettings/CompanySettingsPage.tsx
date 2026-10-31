import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Alert,
  Descriptions,
  Divider,
  Avatar,
  Spin,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { companyApi } from '../../../api/company';
import { isSuccess } from '../../../types/api';
import type { Company, UpdateCompanyRequest } from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';

const { Text } = Typography;

export const CompanySettingsPage: React.FC = () => {
  const { currentCompany, reloadUser } = useAuth();
  const [companyDetail, setCompanyDetail] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchCompanyDetail = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const res = await companyApi.getCompanyById(currentCompany.id);
      if (isSuccess(res) && res.data) {
        setCompanyDetail(res.data);
        form.setFieldsValue({
          name: res.data.name,
          logoUrl: res.data.logoUrl || '',
          status: res.data.status || 'ACTIVE',
        });
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải thông tin chi tiết công ty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany) {
      fetchCompanyDetail();
    } else {
      setCompanyDetail(null);
    }
  }, [currentCompany?.id]);

  const handleUpdateCompany = async (values: UpdateCompanyRequest) => {
    if (!currentCompany) return;
    try {
      setSaving(true);
      const res = await companyApi.updateCompany(currentCompany.id, {
        name: values.name,
        logoUrl: values.logoUrl || undefined,
        status: values.status,
      });
      if (isSuccess(res) && res.data) {
        message.success('Cập nhật thông tin công ty thành công!');
        setCompanyDetail(res.data);
        await reloadUser(currentCompany.id);
      } else {
        message.error(res.message || 'Cập nhật công ty thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi cập nhật thông tin công ty');
    } finally {
      setSaving(false);
    }
  };

  if (!currentCompany) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Alert
          message="Bạn chưa có công ty hoạt động"
          description="Vui lòng tạo hoặc chọn một công ty ở thanh menu trên cùng để cấu hình thông tin công ty."
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
          <SettingOutlined style={{ color: '#1677ff' }} />
          <span>Cài Đặt Thông Tin Công Ty</span>
          <Tag color="geekblue">{currentCompany.name}</Tag>
        </Space>
      }
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchCompanyDetail} loading={loading}>
          Làm mới
        </Button>
      }
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      {loading && !companyDetail ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="Đang tải thông tin công ty..." />
        </div>
      ) : (
        <div style={{ maxWidth: 720 }}>
          {companyDetail && (
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Mã Công Ty (ID)">
                <Text code>{companyDetail.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò của bạn">
                <Tag color="blue">{companyDetail.userRole || currentCompany.userRole || 'OWNER'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái hiện tại">
                <Tag color={companyDetail.status === 'ACTIVE' ? 'green' : 'red'}>
                  {companyDetail.status || 'ACTIVE'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày khởi tạo">
                {companyDetail.createdAt
                  ? new Date(companyDetail.createdAt).toLocaleString('vi-VN')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Divider titlePlacement="left">Chỉnh sửa thông tin</Divider>

          <Form form={form} layout="vertical" onFinish={handleUpdateCompany}>
            <Form.Item
              name="name"
              label="Tên Công Ty / Tổ Chức"
              rules={[
                { required: true, message: 'Vui lòng nhập tên công ty!' },
                { max: 150, message: 'Tên công ty tối đa 150 ký tự' },
              ]}
            >
              <Input placeholder="Nhập tên công ty..." />
            </Form.Item>

            <Form.Item name="logoUrl" label="Đường dẫn Logo (URL)">
              <Input placeholder="https://example.com/logo.png" />
            </Form.Item>

            {companyDetail?.logoUrl && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ marginRight: 12 }}>
                  Xem trước Logo:
                </Text>
                <Avatar shape="square" size={48} src={companyDetail.logoUrl} icon={<BankOutlined />} />
              </div>
            )}

            <Form.Item name="status" label="Trạng Thái Hoạt Động">
              <Select
                options={[
                  { label: 'Đang hoạt động (ACTIVE)', value: 'ACTIVE' },
                  { label: 'Tạm ngưng (INACTIVE)', value: 'INACTIVE' },
                ]}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                Lưu Cài Đặt Công Ty
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </Card>
  );
};
