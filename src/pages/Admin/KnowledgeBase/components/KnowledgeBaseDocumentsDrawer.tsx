import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Upload,
  Popconfirm,
  Input,
  Spin,
} from 'antd';
import {
  InboxOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FileOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { documentApi } from '../../../../api/document';
import { isSuccess } from '../../../../types/api';
import type { DocumentItem, KnowledgeBase } from '../../../../types/api';
import { useAuth } from '../../../../context/AuthContext';

const { Text } = Typography;

interface Props {
  knowledgeBase: KnowledgeBase | null;
  open: boolean;
  onClose: () => void;
  onDocumentChange?: () => void;
}

export const KnowledgeBaseDocumentsDrawer: React.FC<Props> = ({
  knowledgeBase,
  open,
  onClose,
  onDocumentChange,
}) => {
  const { currentCompany } = useAuth();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDocuments = async (
    targetPage = page,
    targetSize = pageSize,
    search = searchText
  ) => {
    if (!currentCompany || !knowledgeBase) return;
    try {
      setLoading(true);
      const res = await documentApi.getDocuments(
        knowledgeBase.id,
        targetPage - 1,
        targetSize,
        search,
        currentCompany.id
      );
      if (isSuccess(res) && res.data) {
        setDocuments(res.data.items || []);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && knowledgeBase) {
      setPage(1);
      setSearchText('');
      fetchDocuments(1, pageSize, '');
    } else {
      setDocuments([]);
      setTotalElements(0);
    }
  }, [open, knowledgeBase?.id]);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    if (!currentCompany || !knowledgeBase) return;
    try {
      setUploading(true);
      const res = await documentApi.uploadDocument(
        knowledgeBase.id,
        file as File,
        currentCompany.id
      );
      if (isSuccess(res) && res.data) {
        message.success(`Đã tải lên tài liệu "${res.data.fileName}" thành công!`);
        onSuccess?.(res.data);
        fetchDocuments(page, pageSize, searchText);
        onDocumentChange?.();
      } else {
        const errorMsg = res.message || 'Tải lên tài liệu thất bại';
        message.error(errorMsg);
        onError?.(new Error(errorMsg));
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi khi tải lên file';
      message.error(errorMsg);
      onError?.(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!currentCompany) return;
    try {
      setDeletingId(id);
      const res = await documentApi.deleteDocument(id, currentCompany.id);
      if (isSuccess(res)) {
        message.success('Đã xóa tài liệu thành công!');
        fetchDocuments(page, pageSize, searchText);
        onDocumentChange?.();
      } else {
        message.error(res.message || 'Xóa tài liệu thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xóa tài liệu');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (fileType?: string) => {
    const lower = (fileType || '').toLowerCase();
    if (lower.includes('pdf')) {
      return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 18 }} />;
    }
    if (lower.includes('doc')) {
      return <FileWordOutlined style={{ color: '#2563eb', fontSize: 18 }} />;
    }
    if (lower.includes('csv') || lower.includes('excel') || lower.includes('xls')) {
      return <FileExcelOutlined style={{ color: '#10b981', fontSize: 18 }} />;
    }
    if (lower.includes('txt') || lower.includes('md') || lower.includes('json')) {
      return <FileTextOutlined style={{ color: '#8b5cf6', fontSize: 18 }} />;
    }
    return <FileOutlined style={{ color: '#64748b', fontSize: 18 }} />;
  };

  const columns = [
    {
      title: 'Tên Tài Liệu',
      key: 'fileName',
      render: (_: any, record: DocumentItem) => (
        <Space align="start">
          {getFileIcon(record.fileType)}
          <div>
            <Text strong style={{ fontSize: 13, wordBreak: 'break-all' }}>
              {record.fileName}
            </Text>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {record.fileType?.toUpperCase()} • {formatFileSize(record.fileSize)}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        switch (status) {
          case 'UPLOADED':
            return (
              <Tag color="blue" icon={<CheckCircleOutlined />}>
                ĐÃ TẢI LÊN
              </Tag>
            );
          case 'READY':
            return (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                SẴN SÀNG
              </Tag>
            );
          case 'PROCESSING':
            return <Tag color="gold">ĐANG XỬ LÝ</Tag>;
          case 'FAILED':
            return <Tag color="red">THẤT BẠI</Tag>;
          default:
            return <Tag>{status}</Tag>;
        }
      },
    },
    {
      title: 'Phân đoạn (Chunks)',
      dataIndex: 'chunkCount',
      key: 'chunkCount',
      width: 140,
      render: (val: number) => (
        <Tag color="purple">
          {val > 0 ? `${val} đoạn vector` : 'Chưa phân tích'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tải',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (val: string) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {val ? new Date(val).toLocaleString('vi-VN') : '-'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 130,
      render: (_: any, record: DocumentItem) => (
        <Space size={2}>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              window.open(documentApi.getDownloadUrl(record.id, currentCompany?.id), '_blank');
            }}
          >
            Tải
          </Button>
          <Popconfirm
            title="Xác nhận xóa tài liệu"
            description="Bạn có chắc muốn xóa vĩnh viễn tài liệu này khỏi cơ sở tri thức?"
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

  return (
    <Drawer
      title={
        <Space>
          <FileTextOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <span>Tài Liệu Của Cơ Sở Tri Thức: </span>
          <Text strong style={{ color: '#1677ff' }}>
            {knowledgeBase?.name}
          </Text>
        </Space>
      }
      placement="right"
      width={780}
      onClose={onClose}
      open={open}
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchDocuments(page, pageSize, searchText)}
          loading={loading}
        >
          Làm mới
        </Button>
      }
    >
      {/* Vùng kéo thả Upload Tài liệu */}
      <div style={{ marginBottom: 20 }}>
        <Spin spinning={uploading} tip="Đang tải tệp lên máy chủ...">
          <Upload.Dragger
            name="file"
            multiple={false}
            showUploadList={false}
            customRequest={handleUpload}
            accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
            disabled={uploading}
            style={{
              padding: '16px 12px',
              background: '#f8fafc',
              borderColor: '#cbd5e1',
              borderRadius: 8,
            }}
          >
            <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
              <InboxOutlined style={{ color: '#1677ff', fontSize: 36 }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              Kéo thả hoặc nhấp để chọn tệp tài liệu tải lên
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
              Hỗ trợ: PDF (.pdf), Word (.docx, .doc), Văn bản (.txt, .md), Bảng tính (.csv, .json). Tối đa 25MB.
            </p>
          </Upload.Dragger>
        </Spin>
      </div>

      {/* Tìm kiếm & Bảng danh sách tài liệu */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 14 }}>
          Danh sách tệp tài liệu ({totalElements})
        </Text>
        <Input.Search
          placeholder="Tìm kiếm tài liệu..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={() => {
            setPage(1);
            fetchDocuments(1, pageSize, searchText);
          }}
          style={{ width: 220 }}
        />
      </div>

      <Table
        dataSource={documents}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: totalElements,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} tài liệu`,
          onChange: (newPage, newSize) => {
            setPage(newPage);
            setPageSize(newSize);
            fetchDocuments(newPage, newSize, searchText);
          },
        }}
        locale={{ emptyText: 'Chưa có tài liệu nào trong cơ sở tri thức này' }}
      />
    </Drawer>
  );
};
