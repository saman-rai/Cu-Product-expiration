import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import ProductForm from './ProductForm';

const TABS = [
  { key: 'expired', label: '유통기한 초과', icon: '🔴' },
  { key: 'today', label: '오늘', icon: '🔸' },
  { key: 'tomorrow', label: '내일', icon: '🟡' },
  { key: 'this_week', label: '이번 주', icon: '🟢' },
  { key: 'next_week', label: '다음 주', icon: '🔵' },
];

const TAB_COLORS = {
  expired: '#dc3545',
  today: '#fd7e14',
  tomorrow: '#ffc107',
  this_week: '#28a745',
  next_week: '#17a2b8',
};

export default function ExpiringSoon() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGroup = searchParams.get('group') || 'today';
  const [activeTab, setActiveTab] = useState(initialGroup);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const limit = 50;

  useEffect(() => {
    setActiveTab(searchParams.get('group') || 'today');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    api.getExpiringProducts(activeTab, limit, 0)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ group: key });
  };

  const loadMore = () => {
    const newOffset = offset + limit;
    api.getExpiringProducts(activeTab, limit, newOffset)
      .then(res => {
        setData(prev => ({
          products: [...(prev?.products || []), ...res.products],
          total: res.total,
          group: res.group,
        }));
        setOffset(newOffset);
      })
      .catch(() => {});
  };

  if (loading) return <div className="page"><div className="loading"><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>⏰ 소멸 임박 제품</h1>
        {data && <p>총 {data.total}개</p>}
      </div>

      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
            style={activeTab === tab.key ? { borderBottomColor: TAB_COLORS[tab.key], color: TAB_COLORS[tab.key] } : {}}
          >
            {tab.icon} {tab.label}
            {data && activeTab === tab.key && (
              <span className="tab-badge" style={{ background: TAB_COLORS[tab.key] }}>{data.total}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        {!data || data.products.length === 0 ? (
          <div className="empty-state">✅ 해당 기간에 소멸 예정인 제품이 없습니다.</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>제품명</th>
                    <th>바코드</th>
                    <th>유통기한</th>
                    <th>남은일수</th>
                    <th>진열장</th>
                    <th>수량</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map(p => {
                    const isExpired = p.days_left < 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className={`expiry-badge level-${p.level}`}>
                            {p.level === 'expired' ? '초과' : p.level === 'critical' ? '임박' : p.level === 'warning' ? '주의' : p.level === 'normal' ? '여유' : '신규'}
                          </span>
                        </td>
                        <td>{p.name}</td>
                        <td className="text-mono">{p.barcode || '-'}</td>
                        <td>{p.expiry_date}</td>
                        <td className={isExpired ? 'text-danger' : ''}>
                          {isExpired ? `${Math.abs(p.days_left)}일 초과` : `${p.days_left}일`}
                        </td>
                        <td>{p.shelf_location || '-'}</td>
                        <td>{p.quantity} {p.unit}</td>
                        <td>
                          <button className="btn btn-sm" onClick={() => setEditingProduct(p)}>
                            수정
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data.products.length < data.total && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button className="btn" onClick={loadMore}>
                  더 보기 ({data.products.length} / {data.total})
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null);
            api.getExpiringProducts(activeTab, limit, 0).then(setData).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
