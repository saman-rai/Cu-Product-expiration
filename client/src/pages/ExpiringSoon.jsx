import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import ProductForm from './ProductForm';

const TABS = [
  { key: 'expired', tKey: 'expiring.tab_expired', icon: '🔴' },
  { key: 'today', tKey: 'expiring.tab_today', icon: '🔸' },
  { key: 'tomorrow', tKey: 'expiring.tab_tomorrow', icon: '🟡' },
  { key: 'this_week', tKey: 'expiring.tab_thisWeek', icon: '🟢' },
  { key: 'next_week', tKey: 'expiring.tab_nextWeek', icon: '🔵' },
];

const TAB_COLORS = {
  expired: '#dc3545',
  today: '#fd7e14',
  tomorrow: '#ffc107',
  this_week: '#28a745',
  next_week: '#17a2b8',
};

export default function ExpiringSoon() {
  const { t } = useLanguage();
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
        <h1>{t('expiring.title')}</h1>
        {data && <p>{t('expiring.total', { count: data.total })}</p>}
      </div>

      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
            style={activeTab === tab.key ? { borderBottomColor: TAB_COLORS[tab.key], color: TAB_COLORS[tab.key] } : {}}
          >
            {tab.icon} {t(tab.tKey)}
            {data && activeTab === tab.key && (
              <span className="tab-badge" style={{ background: TAB_COLORS[tab.key] }}>{data.total}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        {!data || data.products.length === 0 ? (
          <div className="empty-state">{t('expiring.empty')}</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('products.status')}</th>
                    <th>{t('products.name')}</th>
                    <th>{t('products.barcode')}</th>
                    <th>{t('products.expiryDate')}</th>
                    <th>{t('common.days')}</th>
                    <th>{t('products.shelf')}</th>
                    <th>{t('products.quantity')}</th>
                    <th>{t('products.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map(p => {
                    const isExpired = p.days_left < 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className={`expiry-badge level-${p.level}`}>
                            {t(`badge.${p.level}`)}
                          </span>
                        </td>
                        <td>{p.name}</td>
                        <td className="text-mono">{p.barcode || '-'}</td>
                        <td>{p.expiry_date}</td>
                        <td className={isExpired ? 'text-danger' : ''}>
                          {isExpired
                            ? t('common.daysOverdue', { days: Math.abs(p.days_left) })
                            : t('common.days', { days: p.days_left })}
                        </td>
                        <td>{p.shelf_location || '-'}</td>
                        <td>{p.quantity} {p.unit}</td>
                        <td>
                          <button className="btn btn-sm" onClick={() => setEditingProduct(p)}>
                            {t('products.editBtn')}
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
                  {t('expiring.showMore', { shown: data.products.length, total: data.total })}
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
