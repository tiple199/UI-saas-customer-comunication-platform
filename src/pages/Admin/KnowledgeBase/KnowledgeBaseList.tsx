import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Alert,
  Modal,
  Form,
  Input,
  Popconfirm,
  Badge,
} from 'antd';
import {
  ReadOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { knowledgeBaseApi } from '../../../api/knowledgeBase';
import { isSuccess } from '../../../types/api';
import type {
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeBaseDocumentsDrawer } from './components/KnowledgeBaseDocumentsDrawer';

const { Text, Paragraph } = Typography;

export const KnowledgeBaseList: React.FC = () => {
  const { currentCompany } = useAuth();

  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchText, setSearchText] = useState('');

  // Modal tạo mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm();

  // Modal cập nhật
  const [editingItem, setEditingItem] = useState<KnowledgeBase | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm] = Form.useForm();

  // Trạng thái xóa
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Drawer quản lý tài liệu
  const [selectedKbForDocs, setSelectedKbForDocs] = useState<KnowledgeBase | null>(null);

  const fetchKnowledgeBases = async (
    targetPage = page,
    targetSize = pageSize,
    search = searchText
  ) => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const res = await knowledgeBaseApi.getKnowledgeBasesPaged(
        targetPage - 1,
        targetSize,
        search,
        currentCompany.id
      );
      if (isSuccess(res) && res.data) {
        setItems(res.data.items || []);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách cơ sở tri thức');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany) {
      setPage(1);
      fetchKnowledgeBases(1, pageSize, searchText);
    } else {
      setItems([]);
      setTotalElements(0);
    }
  }, [currentCompany?.id]);

  const handleSearch = () => {
    setPage(1);
    fetchKnowledgeBases(1, pageSize, searchText);
  };

  const handleCreate = async (values: CreateKnowledgeBaseRequest) => {
    if (!currentCompany) return;
    try {
      setCreating(true);
      const res = await knowledgeBaseApi.createKnowledgeBase(values, currentCompany.id);
      if (isSuccess(res) && res.data) {
        message.success(`Đã tạo cơ sở tri thức "${res.data.name}" thành công!`);
        setIsCreateModalOpen(false);
        createForm.resetFields();
        fetchKnowledgeBases(1, pageSize, searchText);
      } else {
        message.error(res.message || 'Tạo cơ sở tri thức thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi tạo cơ sở tri thức');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (record: KnowledgeBase) => {
    setEditingItem(record);
    editForm.setFieldsValue({
      name: record.name,
      description: record.description || '',
    });
  };

  const handleUpdate = async (values: UpdateKnowledgeBaseRequest) => {
    if (!currentCompany || !editingItem) return;
    try {
      setUpdating(true);
      const res = await knowledgeBaseApi.updateKnowledgeBase(
        editingItem.id,
        values,
        currentCompany.id
      );
      if (isSuccess(res) && res.data) {
        message.success(`Đã cập nhật cơ sở tri thức "${res.data.name}" thành công!`);
        setEditingItem(null);
        fetchKnowledgeBases(page, pageSize, searchText);
      } else {
        message.error(res.message || 'Cập nhật cơ sở tri thức thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi cập nhật cơ sở tri thức');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!currentCompany) return;
    try {
      setDeletingId(id);
      const res = await knowledgeBaseApi.deleteKnowledgeBase(id, currentCompany.id);
      if (isSuccess(res)) {
        message.success('Đã xóa cơ sở tri thức thành công!');
        fetchKnowledgeBases(page, pageSize, searchText);
      } else {
        message.error(res.message || 'Xóa cơ sở tri thức thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xóa cơ sở tri thức');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Tên Cơ Sở Tri Thức',
      key: 'name',
      width: 250,
      render: (_: any, record: KnowledgeBase) => (
        <div>
          <Space>
            <ReadOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            <Text strong style={{ fontSize: 14 }}>
              {record.name}
            </Text>
          </Space>
          {record.description && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}
            >
              {record.description}
            </Paragraph>
          )}
        </div>
      ),
    },
    {
      title: 'Tài liệu liên kết',
      key: 'documentCount',
      width: 170,
      render: (_: any, record: KnowledgeBase) => (
        <span
          style={{ cursor: 'pointer' }}
          onClick={() => setSelectedKbForDocs(record)}
          title="Bấm để xem và tải lên tài liệu"
        >
          <Badge
            count={record.documentCount}
            showZero
            overflowCount={999}
            style={{
              backgroundColor: record.documentCount > 0 ? '#10b981' : '#94a3b8',
            }}
          >
            <Tag icon={<FileTextOutlined />} color="geekblue" style={{ padding: '2px 8px' }}>
              {record.documentCount} tài liệu
            </Tag>
          </Badge>
        </span>
      ),
    },
    {
      title: 'Cập nhật lúc',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (val: string) => (
        <span style={{ fontSize: 12, color: '#475569' }}>
          {val ? new Date(val).toLocaleString('vi-VN') : '-'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 220,
      render: (_: any, record: KnowledgeBase) => (
        <Space size={4}>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => setSelectedKbForDocs(record)}
          >
            Tài liệu ({record.documentCount})
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa cơ sở tri thức"
            description={
              <div>
                Bạn có chắc chắn muốn xóa cơ sở tri thức <strong>{record.name}</strong>?
                <br />
                <span style={{ color: '#ef4444', fontSize: 12 }}>
                  * Tất cả tài liệu và dữ liệu vector chunks liên quan sẽ bị xóa!
                </span>
              </div>
            }
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!currentCompany) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Alert
          message="Bạn chưa có công ty hoạt động"
          description="Vui lòng tạo hoặc chọn một công ty ở thanh menu trên cùng để quản lý cơ sở tri thức."
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
          <ReadOutlined style={{ color: '#1677ff', fontSize: 20 }} />
          <span>Cơ Sở Tri Thức (Knowledge Base - AI RAG)</span>
          <Tag color="geekblue">{currentCompany.name}</Tag>
        </Space>
      }
      extra={
        <Space wrap>
          <Input.Search
            placeholder="Tìm theo tên..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 220 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchKnowledgeBases(page, pageSize, searchText)}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.resetFields();
              setIsCreateModalOpen(true);
            }}
          >
            Thêm Cơ Sở Tri Thức
          </Button>
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <Alert
        message="Quản lý kho tri thức huấn luyện cho AI Bot"
        description="Các cơ sở tri thức (Knowledge Base) chứa tài liệu sản phẩm, FAQ, chính sách công ty... dùng để AI tự động tìm kiếm ngữ nghĩa (RAG) và trả lời khách hàng trên Website Live Chat."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: totalElements,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} cơ sở tri thức`,
          onChange: (newPage, newSize) => {
            setPage(newPage);
            setPageSize(newSize);
            fetchKnowledgeBases(newPage, newSize, searchText);
          },
        }}
        locale={{ emptyText: 'Chưa có cơ sở tri thức nào trong công ty này' }}
      />

      {/* Modal Thêm Mới */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1677ff' }} />
            <span>Thêm Cơ Sở Tri Thức Mới</span>
          </Space>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Tên cơ sở tri thức"
            rules={[
              { required: true, message: 'Vui lòng nhập tên cơ sở tri thức!' },
              { max: 100, message: 'Tối đa 100 ký tự!' },
            ]}
          >
            <Input placeholder="Ví dụ: Tài liệu Hỗ trợ Kỹ thuật & FAQ Sản phẩm" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả cơ sở tri thức"
            rules={[{ max: 1000, message: 'Tối đa 1000 ký tự!' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Mô tả ngắn gọn phạm vi và nội dung của cơ sở tri thức này..."
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={creating}>
                Tạo mới
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Cập Nhật */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#1677ff' }} />
            <span>Chỉnh Sửa Cơ Sở Tri Thức #{editingItem?.id}</span>
          </Space>
        }
        open={!!editingItem}
        onCancel={() => setEditingItem(null)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            name="name"
            label="Tên cơ sở tri thức"
            rules={[
              { required: true, message: 'Vui lòng nhập tên cơ sở tri thức!' },
              { max: 100, message: 'Tối đa 100 ký tự!' },
            ]}
          >
            <Input placeholder="Ví dụ: Tài liệu Hỗ trợ Kỹ thuật & FAQ Sản phẩm" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả cơ sở tri thức"
            rules={[{ max: 1000, message: 'Tối đa 1000 ký tự!' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Mô tả ngắn gọn phạm vi và nội dung của cơ sở tri thức này..."
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditingItem(null)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={updating}>
                Lưu thay đổi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer Quản lý & Tải lên tài liệu Document */}
      <KnowledgeBaseDocumentsDrawer
        knowledgeBase={selectedKbForDocs}
        open={!!selectedKbForDocs}
        onClose={() => setSelectedKbForDocs(null)}
        onDocumentChange={() => fetchKnowledgeBases(page, pageSize, searchText)}
      />
    </Card>
  );
};
