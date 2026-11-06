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
  Modal,
  Alert,
  Tooltip,
  Tabs,
} from 'antd';
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FileOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  CopyOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ExportOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { documentApi } from '../../../../api/document';
import { isSuccess } from '../../../../types/api';
import type { DocumentItem, DocumentPreview, KnowledgeBase } from '../../../../types/api';
import { useAuth } from '../../../../context/AuthContext';

const { Text, Paragraph } = Typography;

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

  // Download & Delete state
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewData, setPreviewData] = useState<DocumentPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      setSelectedRowKeys([]);
      fetchDocuments(1, pageSize, '');
    } else {
      setDocuments([]);
      setTotalElements(0);
      setSelectedRowKeys([]);
    }
  }, [open, knowledgeBase?.id]);

  const beforeUpload = (file: File) => {
    const isLt25M = file.size / 1024 / 1024 <= 25;
    if (!isLt25M) {
      message.error(`Tệp "${file.name}" vượt quá dung lượng tối đa 25MB!`);
      return Upload.LIST_IGNORE;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'doc', 'txt', 'md', 'csv', 'json'];
    if (!ext || !allowed.includes(ext)) {
      message.error(`Định dạng .${ext || 'không xác định'} không được hỗ trợ. Chỉ chấp nhận: PDF, Word, TXT, MD, CSV, JSON.`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

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

  const handleDownload = async (doc: DocumentItem) => {
    if (!currentCompany) return;
    try {
      setDownloadingId(doc.id);
      await documentApi.downloadDocument(doc.id, doc.fileName, currentCompany.id);
      message.success(`Đang tải về "${doc.fileName}"!`);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải về tài liệu');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!currentCompany) return;
    try {
      setDeletingId(id);
      const res = await documentApi.deleteDocument(id, currentCompany.id);
      if (isSuccess(res)) {
        message.success('Đã xóa tài liệu thành công!');
        setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
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

  const handleBatchDelete = async () => {
    if (!currentCompany || selectedRowKeys.length === 0) return;
    try {
      setBatchDeleting(true);
      const ids = selectedRowKeys.map((k) => Number(k));
      const res = await documentApi.deleteDocumentsBatch(ids, currentCompany.id);
      if (isSuccess(res)) {
        message.success(`Đã xóa thành công ${ids.length} tài liệu!`);
        setSelectedRowKeys([]);
        fetchDocuments(page, pageSize, searchText);
        onDocumentChange?.();
      } else {
        message.error(res.message || 'Xóa các tài liệu thất bại');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xóa các tài liệu');
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleProcess = async (doc: DocumentItem) => {
    if (!currentCompany) return;
    try {
      setProcessingId(doc.id);
      const res = await documentApi.processDocument(doc.id, currentCompany.id);
      if (isSuccess(res) && res.data) {
        message.success(`Đã xử lý xong: tạo ${res.data.chunkCount || 0} phân đoạn vector thành công!`);
        fetchDocuments(page, pageSize, searchText);
        onDocumentChange?.();
        if (previewDoc && previewDoc.id === doc.id) {
          setPreviewDoc(res.data);
          const previewRes = await documentApi.getDocumentPreview(doc.id, currentCompany.id);
          if (isSuccess(previewRes) && previewRes.data) {
            setPreviewData(previewRes.data);
          }
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi bóc tách và phân đoạn tài liệu');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenPreview = async (doc: DocumentItem) => {
    if (!currentCompany) return;
    setPreviewDoc(doc);
    setPreviewData(null);
    setPdfBlobUrl(null);
    try {
      setLoadingPreview(true);
      const res = await documentApi.getDocumentPreview(doc.id, currentCompany.id);
      if (isSuccess(res) && res.data) {
        setPreviewData(res.data);
      }

      // Nếu là PDF -> Tải blob url có xác thực Bearer token để hiển thị trong iframe
      if (doc.fileType?.toLowerCase().includes('pdf')) {
        const url = await documentApi.getViewBlobUrl(doc.id, 'pdf', currentCompany.id);
        setPdfBlobUrl(url);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tải bản xem trước tài liệu');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl);
    }
    setPreviewDoc(null);
    setPreviewData(null);
    setPdfBlobUrl(null);
    setIsFullscreen(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderFileTypeAvatar = (fileType?: string) => {
    const lower = (fileType || '').toLowerCase();
    if (lower.includes('pdf')) {
      return (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FilePdfOutlined style={{ color: '#ef4444', fontSize: 18 }} />
        </div>
      );
    }
    if (lower.includes('doc')) {
      return (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileWordOutlined style={{ color: '#2563eb', fontSize: 18 }} />
        </div>
      );
    }
    if (lower.includes('csv') || lower.includes('excel') || lower.includes('xls')) {
      return (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileExcelOutlined style={{ color: '#059669', fontSize: 18 }} />
        </div>
      );
    }
    if (lower.includes('txt') || lower.includes('md') || lower.includes('json')) {
      return (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#ede9fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileTextOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
        </div>
      );
    }
    return (
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FileOutlined style={{ color: '#64748b', fontSize: 18 }} />
      </div>
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
            Đã tải lên
          </span>
        );
      case 'READY':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            Sẵn sàng
          </span>
        );
      case 'PROCESSING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
            }}
          >
            <Spin size="small" style={{ fontSize: 10 }} />
            Đang xử lý
          </span>
        );
      case 'FAILED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
            Thất bại
          </span>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const renderChunkBadge = (count?: number) => {
    if (count && count > 0) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: '#faf5ff',
            color: '#7e22ce',
            border: '1px solid #e9d5ff',
          }}
        >
          ⚡ {count} đoạn
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 9px',
          borderRadius: 20,
          fontSize: 11,
          color: '#94a3b8',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        Chưa phân tích
      </span>
    );
  };

  const columns = [
    {
      title: 'Tên Tài Liệu',
      key: 'fileName',
      render: (_: any, record: DocumentItem) => (
        <Space align="center" size={12}>
          {renderFileTypeAvatar(record.fileType)}
          <div>
            <Text
              strong
              style={{
                fontSize: 13,
                wordBreak: 'break-all',
                cursor: 'pointer',
                color: '#1e293b',
              }}
              className="hover:text-blue-600 transition-colors"
              onClick={() => handleOpenPreview(record)}
              title="Bấm để xem chi tiết tài liệu"
            >
              {record.fileName}
            </Text>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
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
      render: (status: string) => renderStatusBadge(status),
    },
    {
      title: 'Phân đoạn (Chunks)',
      dataIndex: 'chunkCount',
      key: 'chunkCount',
      width: 140,
      render: (val: number) => renderChunkBadge(val),
    },
    {
      title: 'Ngày tải',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 135,
      render: (val: string) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {val ? new Date(val).toLocaleDateString('vi-VN') : '-'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 190,
      render: (_: any, record: DocumentItem) => (
        <Space size={6}>
          <Tooltip
            title={
              record.status === 'READY'
                ? 'Bóc tách & phân đoạn lại (Re-parse & Chunk)'
                : 'Bóc tách văn bản và phân đoạn (Parse & Chunk)'
            }
          >
            <Button
              size="small"
              icon={record.status === 'READY' ? <ReloadOutlined /> : <ThunderboltOutlined />}
              loading={processingId === record.id}
              onClick={() => handleProcess(record)}
              style={
                record.status === 'READY'
                  ? { color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }
                  : { color: '#d97706', borderColor: '#fde68a', background: '#fffbeb', fontWeight: 600 }
              }
            >
              {record.status === 'READY' ? 'Làm lại' : 'Xử lý'}
            </Button>
          </Tooltip>
          <Tooltip title="Xem chi tiết tài liệu">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleOpenPreview(record)}
            />
          </Tooltip>
          <Tooltip title="Tải tệp về máy tính">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              loading={downloadingId === record.id}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa tài liệu"
            description="Tài liệu và toàn bộ phân đoạn vector liên quan sẽ bị xóa vĩnh viễn!"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
          >
            <Tooltip title="Xóa tài liệu">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
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
        width={820}
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
          <Spin spinning={uploading} tip="Đang tải tài liệu lên máy chủ...">
            <Upload.Dragger
              name="file"
              multiple={false}
              showUploadList={false}
              beforeUpload={beforeUpload}
              customRequest={handleUpload}
              accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
              disabled={uploading}
              style={{
                padding: '24px 16px',
                background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)',
                borderColor: '#93c5fd',
                borderRadius: 12,
                borderWidth: 1.5,
                borderStyle: 'dashed',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <CloudUploadOutlined style={{ color: '#2563eb', fontSize: 26 }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 6px' }}>
                Kéo thả tài liệu vào đây hoặc <span style={{ color: '#2563eb' }}>chọn từ máy tính</span>
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Hỗ trợ: <strong>PDF</strong>, Word (<strong>.docx, .doc</strong>), Văn bản (<strong>.txt, .md</strong>), Bảng (<strong>.csv, .json</strong>) • Tối đa 25MB
              </p>
            </Upload.Dragger>
          </Spin>
        </div>

        {/* Thanh công cụ và Tìm kiếm */}
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Space>
            <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
              Danh sách tài liệu ({totalElements})
            </Text>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Xóa ${selectedRowKeys.length} tài liệu đã chọn?`}
                description="Các tài liệu và phân mảnh vector liên quan sẽ bị xóa vĩnh viễn!"
                onConfirm={handleBatchDelete}
                okText="Xóa tất cả"
                cancelText="Hủy"
                okButtonProps={{ danger: true, loading: batchDeleting }}
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  Xóa ({selectedRowKeys.length}) tệp đã chọn
                </Button>
              </Popconfirm>
            )}
          </Space>

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
          rowSelection={{
            selectedRowKeys,
            onChange: (newSelectedKeys) => setSelectedRowKeys(newSelectedKeys),
          }}
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

      {/* Modal Xem Trước Tài Liệu (Preview Modal) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {renderFileTypeAvatar(previewDoc?.fileType)}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                  {previewDoc?.fileName}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {formatFileSize(previewDoc?.fileSize)} • {previewDoc?.createdAt ? new Date(previewDoc.createdAt).toLocaleString('vi-VN') : ''}
                </div>
              </div>
            </div>
            <Space size={8}>
              {pdfBlobUrl && (
                <Tooltip title="Mở trong tab trình duyệt mới">
                  <Button
                    size="small"
                    icon={<ExportOutlined />}
                    onClick={() => window.open(pdfBlobUrl, '_blank')}
                  >
                    Mở tab mới
                  </Button>
                </Tooltip>
              )}
              <Tooltip title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}>
                <Button
                  size="small"
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                />
              </Tooltip>
            </Space>
          </div>
        }
        open={!!previewDoc}
        onCancel={handleClosePreview}
        width={isFullscreen ? '96vw' : 1050}
        style={{ top: isFullscreen ? 12 : 25 }}
        destroyOnClose
        footer={[
          previewDoc ? (
            <Button
              key="process"
              icon={previewDoc.status === 'READY' ? <ReloadOutlined /> : <ThunderboltOutlined />}
              loading={processingId === previewDoc.id}
              onClick={() => handleProcess(previewDoc)}
              style={
                previewDoc.status === 'READY'
                  ? { color: '#059669', borderColor: '#a7f3d0' }
                  : { color: '#d97706', borderColor: '#fde68a', fontWeight: 600 }
              }
            >
              {previewDoc.status === 'READY' ? 'Bóc tách lại' : 'Bóc tách & Phân đoạn'}
            </Button>
          ) : null,
          previewData?.isText && previewData.textContent ? (
            <Button
              key="copy"
              icon={<CopyOutlined />}
              onClick={() => {
                if (previewData.textContent) {
                  navigator.clipboard.writeText(previewData.textContent);
                  message.success('Đã sao chép toàn bộ nội dung vào clipboard!');
                }
              }}
            >
              Sao chép tất cả
            </Button>
          ) : null,
          previewDoc ? (
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloadingId === previewDoc.id}
              onClick={() => handleDownload(previewDoc)}
            >
              Tải về máy
            </Button>
          ) : null,
          <Button key="close" onClick={handleClosePreview}>
            Đóng
          </Button>,
        ]}
      >
        {loadingPreview ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Đang tải bản xem trước tài liệu..." />
          </div>
        ) : previewDoc ? (
          <div>
            {/* Thanh thông số tài liệu dạng Card Sleek */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                  Định dạng
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {previewDoc.fileType?.toUpperCase()} Document
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                  Dung lượng
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {formatFileSize(previewDoc.fileSize)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                  Trạng thái xử lý
                </span>
                <div>{renderStatusBadge(previewDoc.status)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                  Phân đoạn AI (Chunks)
                </span>
                <div>{renderChunkBadge(previewDoc.chunkCount)}</div>
              </div>
            </div>

            {/* Xem trước PDF */}
            {previewDoc.fileType?.toLowerCase().includes('pdf') ? (
              <div>
                {previewDoc.status !== 'READY' && (
                  <Alert
                    message="Tài liệu chưa được phân tích bóc tách"
                    description={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          Bấm nút "Bóc tách & Phân đoạn" để hệ thống trích xuất văn bản và chia đoạn cho AI RAG học.
                        </span>
                        <Button
                          type="primary"
                          size="small"
                          icon={<ThunderboltOutlined />}
                          loading={processingId === previewDoc.id}
                          onClick={() => handleProcess(previewDoc)}
                          style={{ background: '#f59e0b', borderColor: '#d97706' }}
                        >
                          Bóc tách ngay
                        </Button>
                      </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: 14, borderRadius: 8 }}
                  />
                )}

                {previewData?.textContent ? (
                  <Tabs
                    defaultActiveKey="pdf"
                    items={[
                      {
                        key: 'pdf',
                        label: '📄 Bản xem trước PDF gốc',
                        children: pdfBlobUrl ? (
                          <div
                            style={{
                              borderRadius: 10,
                              overflow: 'hidden',
                              border: '1px solid #cbd5e1',
                              background: '#525659',
                              height: isFullscreen ? 'calc(90vh - 210px)' : '600px',
                              transition: 'height 0.2s',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                          >
                            <iframe
                              src={`${pdfBlobUrl}#view=FitH&toolbar=1`}
                              title="Bản xem trước PDF"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                display: 'block',
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '50px 0' }}>
                            <Spin tip="Đang tạo bản xem trước PDF..." />
                          </div>
                        ),
                      },
                      {
                        key: 'extracted',
                        label: `⚡ Phân đoạn AI (${previewDoc.chunkCount > 0 ? `${previewDoc.chunkCount} đoạn` : 'Đã trích xuất'})`,
                        children: (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {previewData.truncated && (
                              <Alert
                                message="Bản xem trước đã rút gọn"
                                description="Tài liệu rất dài, đang hiển thị 60,000 ký tự đầu tiên."
                                type="info"
                                showIcon
                                style={{ borderRadius: 8 }}
                              />
                            )}
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                maxHeight: isFullscreen ? 'calc(90vh - 230px)' : '550px',
                                overflowY: 'auto',
                                paddingRight: 4,
                              }}
                            >
                              {previewData.textContent.split('\n\n---\n\n').map((chunkText, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: 8,
                                      paddingBottom: 6,
                                      borderBottom: '1px solid #f1f5f9',
                                    }}
                                  >
                                    <Space size={8}>
                                      <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
                                        Phân đoạn #{idx + 1}
                                      </Tag>
                                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                        {chunkText.length} ký tự
                                      </span>
                                    </Space>
                                    <Tooltip title="Sao chép phân đoạn này">
                                      <Button
                                        size="small"
                                        type="text"
                                        icon={<CopyOutlined />}
                                        onClick={() => {
                                          navigator.clipboard.writeText(chunkText);
                                          message.success(`Đã sao chép phân đoạn #${idx + 1}!`);
                                        }}
                                      />
                                    </Tooltip>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      lineHeight: 1.6,
                                      color: '#334155',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {chunkText}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                ) : pdfBlobUrl ? (
                  <div
                    style={{
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid #cbd5e1',
                      background: '#525659',
                      height: isFullscreen ? 'calc(90vh - 140px)' : '620px',
                      transition: 'height 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <iframe
                      src={`${pdfBlobUrl}#view=FitH&toolbar=1`}
                      title="Bản xem trước PDF"
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block',
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Spin tip="Đang tạo bản xem trước PDF..." />
                  </div>
                )}
              </div>
            ) : previewData?.isText || previewData?.textContent ? (
              /* Xem trước Text / Markdown / CSV / JSON hoặc Word đã bóc tách */
              <div>
                {previewData?.truncated && (
                  <Alert
                    message="Bản xem trước đã rút gọn"
                    description="Tệp văn bản dài, đang hiển thị 60,000 ký tự đầu tiên. Bấm 'Tải về máy' để xem toàn bộ tệp."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12, borderRadius: 8 }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    maxHeight: isFullscreen ? 'calc(90vh - 160px)' : '550px',
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {(previewData?.textContent || '')
                    .split('\n\n---\n\n')
                    .map((chunkText, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '12px 16px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                            paddingBottom: 6,
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <Space size={8}>
                            <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
                              Phân đoạn #{idx + 1}
                            </Tag>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              {chunkText.length} ký tự
                            </span>
                          </Space>
                          <Tooltip title="Sao chép phân đoạn này">
                            <Button
                              size="small"
                              type="text"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                navigator.clipboard.writeText(chunkText);
                                message.success(`Đã sao chép phân đoạn #${idx + 1}!`);
                              }}
                            />
                          </Tooltip>
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: '#334155',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {chunkText}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              /* Tệp Office (Word, Excel) chưa xử lý */
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 24px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px dashed #cbd5e1',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  {renderFileTypeAvatar(previewDoc.fileType)}
                </div>
                <Paragraph strong style={{ fontSize: 17, margin: '0 0 6px', color: '#1e293b' }}>
                  {previewDoc.fileName}
                </Paragraph>
                <Paragraph type="secondary" style={{ maxWidth: 500, margin: '0 auto 20px', fontSize: 13, lineHeight: 1.6 }}>
                  Tài liệu văn phòng định dạng <strong>{previewDoc.fileType?.toUpperCase()}</strong>. Bấm nút <strong>"Bóc tách & Phân đoạn"</strong> bên dưới để trích xuất văn bản phục vụ AI hỏi đáp, hoặc tải tệp về máy để xem.
                </Paragraph>
                <Space size={10}>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    loading={processingId === previewDoc.id}
                    onClick={() => handleProcess(previewDoc)}
                    style={{ background: '#f59e0b', borderColor: '#d97706' }}
                  >
                    Bóc tách & Phân đoạn ngay
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    loading={downloadingId === previewDoc.id}
                    onClick={() => handleDownload(previewDoc)}
                  >
                    Tải về máy ({formatFileSize(previewDoc.fileSize)})
                  </Button>
                </Space>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
};
