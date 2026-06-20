import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', parent_id: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const [flat, t] = await Promise.all([
        api.getCategories(),
        api.getCategoryTree(),
      ]);
      setCategories(flat);
      setTree(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleAdd = () => {
    setEditCat(null);
    setForm({ name: '', parent_id: '', sort_order: 0 });
    setShowForm(true);
  };

  const handleEdit = (cat) => {
    setEditCat(cat);
    setForm({ name: cat.name, parent_id: cat.parent_id || '', sort_order: cat.sort_order });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return;
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = { ...form, parent_id: form.parent_id || null };
      if (editCat) {
        await api.updateCategory(editCat.id, payload);
      } else {
        await api.createCategory(payload);
      }
      setShowForm(false);
      loadCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderTree = (nodes, depth = 0) => (
    <ul className="category-tree">
      {nodes.map(node => (
        <li key={node.id}>
          <div className="category-tree-item" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
            <span className="category-name">{node.name}</span>
            <div className="category-actions">
              <button className="btn btn-sm" onClick={() => handleEdit(node)}>수정</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(node.id, node.name)}>삭제</button>
            </div>
          </div>
          {node.children?.length > 0 && renderTree(node.children, depth + 1)}
        </li>
      ))}
    </ul>
  );

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>카테고리 관리</h1>
        <button className="btn btn-primary" onClick={handleAdd}>+ 새 카테고리</button>
      </div>

      <div className="card">
        {tree.length === 0 ? (
          <div className="empty-state">카테고리가 없습니다. 추가해주세요.</div>
        ) : (
          renderTree(tree)
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editCat ? '카테고리 수정' : '새 카테고리'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>카테고리명 *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="form-input" autoFocus />
              </div>
              <div className="form-group">
                <label>상위 카테고리</label>
                <select value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))} className="form-select">
                  <option value="">최상위 (없음)</option>
                  {categories.filter(c => !c.parent_id && c.id !== editCat?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>정렬 순서</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="form-input" style={{ width: 80 }} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '저장 중...' : editCat ? '수정 완료' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
