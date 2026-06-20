import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSup, setEditSup] = useState(null);
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    setEditSup(null);
    setForm({ name: '', contact_person: '', phone: '', email: '', notes: '' });
    setShowForm(true);
  };

  const handleEdit = (s) => {
    setEditSup(s);
    setForm({ name: s.name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', notes: s.notes || '' });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" 공급업체를 삭제하시겠습니까?`)) return;
    try {
      await api.deleteSupplier(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      if (editSup) {
        await api.updateSupplier(editSup.id, form);
      } else {
        await api.createSupplier(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>공급업체 관리</h1>
        <button className="btn btn-primary" onClick={handleAdd}>+ 새 공급업체</button>
      </div>

      {suppliers.length === 0 ? (
        <div className="empty-state">등록된 공급업체가 없습니다.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>업체명</th>
                <th>담당자</th>
                <th>전화번호</th>
                <th>이메일</th>
                <th>비고</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.contact_person || '-'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>{s.email || '-'}</td>
                  <td>{s.notes || '-'}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => handleEdit(s)}>수정</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id, s.name)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editSup ? '공급업체 수정' : '새 공급업체'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>업체명 *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-group flex-grow">
                  <label>담당자</label>
                  <input type="text" value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} className="form-input" />
                </div>
                <div className="form-group flex-grow">
                  <label>전화번호</label>
                  <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="form-input" />
              </div>
              <div className="form-group">
                <label>비고</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '저장 중...' : editSup ? '수정 완료' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
