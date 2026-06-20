import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Suppliers() {
  const { t } = useLanguage();
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

  const openAdd = () => {
    setEditSup(null);
    setForm({ name: '', contact_person: '', phone: '', email: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditSup(s);
    setForm({ name: s.name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', notes: s.notes || '' });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ${t('suppliers.deleteConfirm')}`)) return;
    try {
      await api.deleteSupplier(id);
      load();
    } catch (err) { alert(err.message); }
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
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('suppliers.title')}</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ {t('suppliers.add')}</button>
      </div>

      {suppliers.length === 0 ? (
        <div className="empty-state">{t('suppliers.noSuppliers')}</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('suppliers.name')}</th>
                <th>{t('suppliers.contactPerson')}</th>
                <th>{t('suppliers.phone')}</th>
                <th>{t('suppliers.email')}</th>
                <th>{t('suppliers.notes')}</th>
                <th>{t('products.actions')}</th>
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
                    <button className="btn btn-sm" onClick={() => openEdit(s)}>{t('common.edit')}</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id, s.name)}>{t('common.delete')}</button>
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
              <h2>{editSup ? t('suppliers.edit') : t('suppliers.add')}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('suppliers.name')} *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-group flex-grow">
                  <label>{t('suppliers.contactPerson')}</label>
                  <input type="text" value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} className="form-input" />
                </div>
                <div className="form-group flex-grow">
                  <label>{t('suppliers.phone')}</label>
                  <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label>{t('suppliers.email')}</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="form-input" />
              </div>
              <div className="form-group">
                <label>{t('suppliers.notes')}</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('common.save') : editSup ? t('common.save') : t('suppliers.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
