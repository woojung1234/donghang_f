// 파일: src/consume/component/ExpenseChart.js
// 노인분들을 위한 큰 그래프 컴포넌트

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './ExpenseChart.css';

const ExpenseChart = ({ data, period }) => {
  if (!data || (!data.timeline && !data.categories)) {
    return (
      <div className="chart-container">
        <div className="chart-loading">
          📊 차트 데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  // 타임라인 데이터 포맷팅
  const formatTimelineData = (timeline) => {
    if (!timeline || timeline.length === 0) return [];
    
    return timeline.map((item, index) => {
      let label = '';
      const date = new Date(item.period);
      
      switch (period) {
        case 'daily':
          label = `${date.getMonth() + 1}/${date.getDate()}`;
          break;
        case 'weekly':
          label = `${date.getMonth() + 1}월 ${Math.ceil(date.getDate() / 7)}주`;
          break;
        case 'monthly':
          label = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        default:
          label = `${index + 1}`;
      }
      
      return {
        ...item,
        label,
        amount: item.totalAmount || 0,
        count: item.count || 0
      };
    });
  };

  // 카테고리 데이터 색상
  const CATEGORY_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const timelineData = formatTimelineData(data.timeline);
  const categoryData = data.categories || [];

  // 금액 포맷팅 함수
  const formatAmount = (amount) => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만원`;
    } else if (amount >= 1000) {
      return `${Math.round(amount / 1000)}천원`;
    }
    return `${amount}원`;
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            💰 {formatAmount(payload[0].value)}
          </p>
          {payload[0].payload.count && (
            <p className="tooltip-count">
              📝 {payload[0].payload.count}회
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      {/* 타임라인 차트 */}
      {timelineData.length > 0 && (
        <div className="chart-section">
          <h3 className="chart-section-title">
            📈 {period === 'daily' ? '일별' : period === 'weekly' ? '주별' : '월별'} 소비 추이
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 14, fill: '#333' }}
                  tickLine={{ stroke: '#666' }}
                />
                <YAxis 
                  tick={{ fontSize: 14, fill: '#333' }}
                  tickLine={{ stroke: '#666' }}
                  tickFormatter={formatAmount}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#FF6B6B" 
                  strokeWidth={4}
                  dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#FF6B6B', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 카테고리별 막대 차트 */}
      {categoryData.length > 0 && (
        <div className="chart-section">
          <h3 className="chart-section-title">
            📊 카테고리별 소비 현황
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 14, fill: '#333' }}
                  tickLine={{ stroke: '#666' }}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 14, fill: '#333' }}
                  tickLine={{ stroke: '#666' }}
                  tickFormatter={formatAmount}
                />
                <Tooltip 
                  formatter={(value) => [formatAmount(value), '소비금액']}
                  labelStyle={{ color: '#333', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="totalAmount" 
                  fill="#4ECDC4"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 카테고리별 파이 차트 */}
      {categoryData.length > 0 && (
        <div className="chart-section">
          <h3 className="chart-section-title">
            🥧 카테고리별 소비 비율
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="totalAmount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatAmount(value), '소비금액']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 요약 정보 */}
      {data.summary && (
        <div className="chart-summary">
          <h3 className="chart-section-title">📋 요약 정보</h3>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <div className="summary-label">총 소비금액</div>
                <div className="summary-value">{formatAmount(data.summary.totalAmount)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📝</div>
              <div className="summary-content">
                <div className="summary-label">총 소비횟수</div>
                <div className="summary-value">{data.summary.totalCount}회</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <div className="summary-label">평균 소비금액</div>
                <div className="summary-value">{formatAmount(data.summary.avgAmount)}</div>
              </div>
            </div>
            {data.summary.maxAmount > 0 && (
              <div className="summary-card">
                <div className="summary-icon">⬆️</div>
                <div className="summary-content">
                  <div className="summary-label">최대 소비금액</div>
                  <div className="summary-value">{formatAmount(data.summary.maxAmount)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseChart;