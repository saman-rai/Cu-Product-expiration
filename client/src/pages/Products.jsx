import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ProductForm from './ProductForm';

export default function Products() {
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

  useEffect(() => {
    loadProducts();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" 제품을 삭제하시겠습니까?`)) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusColors = {
    expired: '#dc3545',
    critical: '#fd7e14',
    warning: '#ffc107',
    normal: '#28a745',
    fresh: '#17a2b8',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>제품 관리</h1>
        <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowForm(true); }}>
          + 제품 추가
        </button>
      </div>

      <div className="filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="제품명 또는 바코드 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">검색</button>
        </form>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-select"
        >
          <option value="">전체 상태</option>
          <option value="expired">유통기한 초과</option>
          <option value="critical">임박 (3일)</option>
          <option value="warning">주의 (2주)</option>
          <option value="normal">여유 있음</option>
          <option value="fresh">신규</option>
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          {search || statusFilter ? '검색 결과가 없습니다.' : '등록된 제품이 없습니다. "+ 제품 추가" 버튼으로 추가하세요.'}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>바코드</th>
                <th>제품명</th>
                <th>카테고리</th>
                <th>공급업체</th>
                <th>진열장</th>
                <th>수량</th>
                <th>유통기한</th>
                <th>상태</th>
                <th>관리</th>
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
                      <span
                        className="expiry-badge"
                        style={{ backgroundColor: statusColors[p.expiry_status.level] || '#6c757d' }}
                      >
                        {p.expiry_status.label}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => { setEditProduct(p); setShowForm(true); }}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      삭제
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
