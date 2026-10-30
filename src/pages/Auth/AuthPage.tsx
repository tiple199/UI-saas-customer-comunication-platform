import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, MessageFilled } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { isSuccess } from '../../types/api';
import type { LoginRequest, RegisterRequest } from '../../types/api';

const { Title, Text } = Typography;

export const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [registerForm] = Form.useForm();
  const [loginForm] = Form.useForm();

  const handleLogin = async (values: LoginRequest) => {
    try {
      setLoading(true);
      const res = await authApi.login(values);
      if (isSuccess(res) && res.data) {
        message.success(res.message || 'Đăng nhập thành công!');
        login(res.data);
      } else {
        message.error(res.message || res.error || 'Đăng nhập thất bại!');
      }
    } catch (err: any) {
      const errRes = err.response?.data;
      const errMsg = errRes?.message || errRes?.error || 'Lỗi khi kết nối đến server!';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterRequest) => {
    try {
      setLoading(true);
      const res = await authApi.register(values);
      if (isSuccess(res)) {
        message.success(res.message || 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        registerForm.resetFields();
        setActiveTab('login');
        loginForm.setFieldsValue({
          email: values.email,
        });
      } else {
        const detailMsg = res.details?.join(', ');
        message.error(detailMsg || res.message || res.error || 'Đăng ký thất bại!');
      }
    } catch (err: any) {
      const errRes = err.response?.data;
      const detailMsg = errRes?.details?.join(', ');
      const errMsg = detailMsg || errRes?.message || errRes?.error || 'Đăng ký thất bại!';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '24px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
        bordered={false}
      >
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(22, 119, 255, 0.35)',
            }}
          >
            <MessageFilled style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: 0, textAlign: 'center' }}>
            Customer Communication
          </Title>
          <Text type="secondary" style={{ textAlign: 'center' }}>
            Nền tảng giao tiếp khách hàng đa kênh SaaS
          </Text>
        </Space>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'login' | 'register')}
          centered
          items={[
            {
              key: 'login',
              label: 'Đăng nhập',
              children: (
                <Form
                  form={loginForm}
                  layout="vertical"
                  onFinish={handleLogin}
                  requiredMark={false}
                  size="large"
                >
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không đúng định dạng!' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="admin@example.com" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{ marginTop: 12, height: 44, fontWeight: 600 }}
                  >
                    Đăng nhập
                  </Button>
                </Form>
              ),
            },
            {
              key: 'register',
              label: 'Đăng ký',
              children: (
                <Form
                  form={registerForm}
                  layout="vertical"
                  onFinish={handleRegister}
                  requiredMark={false}
                  size="large"
                >
                  <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không đúng định dạng!' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="name@example.com" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu!' },
                      { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Tối thiểu 6 ký tự" />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="Xác nhận mật khẩu"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận lại mật khẩu!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{ marginTop: 12, height: 44, fontWeight: 600 }}
                  >
                    Tạo tài khoản
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
