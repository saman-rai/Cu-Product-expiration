import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import ProductForm from './ProductForm';

const STATUS_OPTIONS = [
  { value: '', key: 'products.allStatus' },
  { value: 'expired', key: 'badge.expired' },
  { value: 'critical', key: 'badge.critical' },
  { value: 'warning', key: 'badge.warning' },
  { value: 'normal', key: 'badge.normal' },
  { value: 'fresh', key: 'badge.fresh' },
];

const statusColors = {
  expired: '#dc3545',
  critical: '#fd7e14',
  warning: '#ffc107',
  normal: '#28a745',
  fresh: '#17a2b8',
};

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.expiry_status = statusFilter;
      const data = await api.getProducts(params);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [statusFilter]);

  const handleSearch = (e) => { e.preventDefault(); loadProducts(); };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ${t('products.deleteConfirm')}`)) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('products.title')}</h1>
        <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowForm(true); }}>
          + {t('products.add')}
        </button>
      </div>

      <div className="filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder={t('products.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">{t('products.searchButton')}</button>
        </form>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select">
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{t(o.key)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">{t('products.noProducts')}</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('products.barcode')}</th>
                <th>{t('products.name')}</th>
                <th>{t('products.category')}</th>
                <th>{t('products.supplier')}</th>
                <th>{t('products.shelf')}</th>
                <th>{t('products.quantity')}</th>
                <th>{t('products.expiryDate')}</th>
                <th>{t('products.status')}</th>
                <th>{t('products.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="text-mono">{p.barcode || '-'}</td>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.category_name || '-'}</td>
                  <td>{p.supplier_name || '-'}</td>
                  <td>{p.shelf_location || '-'}</td>
                  <td>{p.quantity} {p.unit}</td>
                  <td>{p.expiry_date}</td>
                  <td>
                    {p.expiry_status && (
                      <span className="expiry-badge" style={{ backgroundColor: statusColors[p.expiry_status.level] || '#6c757d' }}>
                        {t(`badge.${p.expiry_status.level}`, {}, p.expiry_status.label)}
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => { setEditProduct(p); setShowForm(true); }}>
                      {t('products.editBtn')}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id, p.name)}>
                      {t('products.deleteBtn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={() => { setShowForm(false); setEditProduct(null); loadProducts(); }}
        />
      )}
    </div>
  );
}
