import React, { useState } from 'react';
import { Card, Space, Tag, Segmented, Typography } from 'antd';
import { RiseOutlined } from '@ant-design/icons';
import type { MonthlyTrendItem } from '../../types/api';

const { Text } = Typography;

interface RevenueGrowthChartProps {
  data: MonthlyTrendItem[];
  formatCurrency: (val?: number) => string;
}

export const RevenueGrowthChart: React.FC<RevenueGrowthChartProps> = ({
  data,
  formatCurrency,
}) => {
  const [viewMode, setViewMode] = useState<string>('ALL');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return null;
  }

  // Kích thước SVG
  const width = 720;
  const height = 280;
  const paddingLeft = 75;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const baselineY = height - paddingBottom;

  // Giá trị max để scale
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000000);
  const maxCompanies = Math.max(...data.map((d) => d.newCompanies), 5);

  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  // Tọa độ các điểm doanh thu
  const points = data.map((d, index) => {
    const x = paddingLeft + index * stepX;
    const y = baselineY - (d.revenue / maxRevenue) * chartHeight;
    return { x, y, data: d };
  });

  // Tạo đường cong bezier mượt mà
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = buildSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    : '';

  // 4 mốc lưới ngang
  const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
    const val = maxRevenue * ratio;
    const y = baselineY - ratio * chartHeight;
    return { val, y };
  });

  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <Card
      bordered={false}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <RiseOutlined style={{ color: '#2563eb', fontSize: 20 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
              Xu Hướng Doanh Thu & Tăng Trưởng (6 Tháng Gần Nhất)
            </span>
          </Space>

          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as string)}
            options={[
              { label: 'Tất cả', value: 'ALL' },
              { label: 'Doanh thu', value: 'REVENUE' },
              { label: 'Công ty mới', value: 'COMPANIES' },
            ]}
          />
        </div>
      }
      style={{
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        background: '#ffffff',
      }}
    >
      {/* Legend & Hover Info Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          padding: '10px 16px',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}
      >
        <Space size={16} wrap>
          {(viewMode === 'ALL' || viewMode === 'REVENUE') && (
            <Space size={6}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#2563eb' }} />
              <Text strong style={{ fontSize: 13, color: '#1e40af' }}>
                Doanh thu (VND)
              </Text>
            </Space>
          )}

          {(viewMode === 'ALL' || viewMode === 'COMPANIES') && (
            <Space size={6}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} />
              <Text strong style={{ fontSize: 13, color: '#065f46' }}>
                Công ty mới đăng ký
              </Text>
            </Space>
          )}

          {viewMode === 'ALL' && (
            <Space size={6}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#8b5cf6' }} />
              <Text strong style={{ fontSize: 13, color: '#5b21b6' }}>
                Đơn hoàn tất
              </Text>
            </Space>
          )}
        </Space>

        {hoveredItem ? (
          <Space size={12}>
            <Tag color="blue" style={{ fontSize: 12, padding: '2px 8px', fontWeight: 600 }}>
              {hoveredItem.label}
            </Tag>
            <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 14 }}>
              {formatCurrency(hoveredItem.revenue)}
            </span>
            <Tag color="cyan">+{hoveredItem.newCompanies} cty</Tag>
            <Tag color="purple">{hoveredItem.transactionCount} đơn</Tag>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 Rê chuột vào cột mốc để xem chi tiết từng tháng
          </Text>
        )}
      </div>

      {/* SVG Vector Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', minWidth: 580, display: 'block' }}
        >
          <defs>
            {/* Gradient cho Area Chart Doanh Thu */}
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient cho Cột Bar Công Ty Mới */}
            <linearGradient id="companyBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.6" />
            </linearGradient>

            {/* Filter bóng đổ */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Đường lưới ngang & Nhãn trục Y */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 10}
                y={tick.y + 4}
                textAnchor="end"
                fontSize={11}
                fill="#64748b"
                fontFamily="sans-serif"
              >
                {tick.val >= 1000000
                  ? `${Math.round(tick.val / 1000000)}M`
                  : tick.val >= 1000
                  ? `${Math.round(tick.val / 1000)}k`
                  : '0'}
              </text>
            </g>
          ))}

          {/* Cột Bar Chart: Công ty mới */}
          {(viewMode === 'ALL' || viewMode === 'COMPANIES') &&
            data.map((d, index) => {
              const xCenter = paddingLeft + index * stepX;
              const barWidth = 24;
              const barHeight = Math.max(4, (d.newCompanies / maxCompanies) * (chartHeight * 0.7));
              const barY = baselineY - barHeight;
              const isHovered = hoveredIndex === index;

              return (
                <g key={`bar-${index}`}>
                  <rect
                    x={xCenter - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    ry={6}
                    fill="url(#companyBarGradient)"
                    opacity={isHovered ? 1 : 0.8}
                    style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIndex(index)}
                  />
                  {d.newCompanies > 0 && (
                    <text
                      x={xCenter}
                      y={barY - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                      fill="#059669"
                    >
                      +{d.newCompanies}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Area Fill Doanh Thu */}
          {(viewMode === 'ALL' || viewMode === 'REVENUE') && (
            <>
              <path d={areaPath} fill="url(#revenueGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            </>
          )}

          {/* Vùng tương tác hover từng tháng & Điểm nhấn */}
          {points.map((pt, index) => {
            const isHovered = hoveredIndex === index;
            const hitWidth = stepX;

            return (
              <g
                key={`point-zone-${index}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hit area vô hình bắt sự kiện hover dễ dàng */}
                <rect
                  x={pt.x - hitWidth / 2}
                  y={paddingTop}
                  width={hitWidth}
                  height={chartHeight + 10}
                  fill="transparent"
                />

                {/* Đường dóng dọc khi hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={baselineY}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}

                {/* Điểm nút Doanh thu */}
                {(viewMode === 'ALL' || viewMode === 'REVENUE') && (
                  <>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 7 : 4.5}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      style={{ transition: 'all 0.15s ease' }}
                    />
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12}
                        fill="#3b82f6"
                        opacity={0.2}
                      />
                    )}
                  </>
                )}

                {/* Nhãn trục X (Tên tháng) */}
                <text
                  x={pt.x}
                  y={baselineY + 22}
                  textAnchor="middle"
                  fontSize={isHovered ? 13 : 12}
                  fontWeight={isHovered ? 700 : 500}
                  fill={isHovered ? '#1e40af' : '#64748b'}
                  fontFamily="sans-serif"
                >
                  {pt.data.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Card>
  );
};

