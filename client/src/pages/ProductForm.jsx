import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function ProductForm({ product, onClose, onSaved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    barcode: '',
    name: '',
    category_id: '',
    supplier_id: '',
    quantity: 1,
    unit: t('productForm.unit_pcs'),
    shelf_location: '',
    expiry_date: '',
    manufactured_date: '',
    batch_number: '',
    cost_price: '',
    selling_price: '',
    notes: '',
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const barcodeRef = useRef(null);
  const scannerTimer = useRef(null);
  const readerRef = useRef(null);

  const isEdit = !!product;

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        barcode: product.barcode || '',
        name: product.name || '',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        quantity: product.quantity || 1,
        unit: product.unit || t('productForm.unit_pcs'),
        shelf_location: product.shelf_location || '',
        expiry_date: product.expiry_date || '',
        manufactured_date: product.manufactured_date || '',
        batch_number: product.batch_number || '',
        cost_price: product.cost_price || '',
        selling_price: product.selling_price || '',
        notes: product.notes || '',
      });
    }
  }, [product]);

  const lookUpBarcode = useCallback(async (code) => {
    if (!code || code.length < 3) return;
    try {
      const existing = await api.getProductByBarcode(code);
      setForm(prev => ({
        ...prev,
        barcode: code,
        name: existing.name,
        category_id: existing.category_id || '',
        supplier_id: existing.supplier_id || '',
        quantity: existing.quantity || 1,
        unit: existing.unit || t('productForm.unit_pcs'),
        shelf_location: existing.shelf_location || '',
        expiry_date: '',
        notes: existing.notes || '',
      }));
      alert(t('productForm.foundExisting'));
    } catch {}
  }, [t]);

  const handleBarcodeKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && barcodeRef.current?.value) {
      e.preventDefault();
      lookUpBarcode(barcodeRef.current.value);
      return;
    }
    clearTimeout(scannerTimer.current);
    scannerTimer.current = setTimeout(() => {
      if (barcodeRef.current?.value) {
        lookUpBarcode(barcodeRef.current.value);
      }
    }, 100);
  }, [lookUpBarcode]);

  const startCameraScanner = async () => {
    setScannerActive(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const reader = new Html5Qrcode('barcode-scanner');
      readerRef.current = reader;
      await reader.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          setForm(prev => ({ ...prev, barcode: decodedText }));
          lookUpBarcode(decodedText);
          reader.stop().catch(() => {});
          setScannerActive(false);
        },
        () => {}
      );
    } catch (err) {
      console.error('Camera error:', err);
      alert(t('productForm.cameraError'));
      setScannerActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (readerRef.current) {
      try { await readerRef.current.stop(); } catch {}
      readerRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => { stopCameraScanner(); };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name) return setError(t('productForm.error_name'));
    if (!form.expiry_date) return setError(t('productForm.error_expiry'));

    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        quantity: parseInt(form.quantity, 10) || 1,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
      };
      if (isEdit) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const unitOptions = ['pcs', 'box', 'bag', 'bottle', 'can', 'pack'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('productForm.editTitle') : t('productForm.addTitle')}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group flex-grow">
              <label>{t('productForm.barcode')}</label>
              <div className="barcode-input-group">
                <input
                  ref={barcodeRef}
                  name="barcode"
                  type="text"
                  value={form.barcode}
                  onChange={handleChange}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder={t('productForm.barcodePlaceholder')}
                  className="form-input"
                />
                <button type="button" className="btn btn-scan" onClick={startCameraScanner} title={t('productForm.barcode')}>
                  {t('productForm.scan')}
                </button>
              </div>
            </div>
          </div>

          {scannerActive && (
            <div className="scanner-container">
              <div id="barcode-scanner" />
              <button type="button" className="btn btn-danger btn-sm" onClick={stopCameraScanner}>
                {t('productForm.stopScan')}
              </button>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-grow">
              <label>{t('productForm.name')}</label>
              <input name="name" type="text" value={form.name} onChange={handleChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label>{t('productForm.quantity')}</label>
              <input name="quantity" type="number" value={form.quantity} onChange={handleChange} min="1" className="form-input" style={{ width: 80 }} />
            </div>
            <div className="form-group">
              <label>{t('productForm.unit')}</label>
              <select name="unit" value={form.unit} onChange={handleChange} className="form-select">
                {unitOptions.map(u => (
                  <option key={u} value={t(`productForm.unit_${u}`)}>{t(`productForm.unit_${u}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-grow">
              <label>{t('productForm.category')}</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className="form-select">
                <option value="">{t('productForm.noCategory')}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {'─'.repeat((c.parent_id ? 1 : 0))} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group flex-grow">
              <label>{t('productForm.supplier')}</label>
              <select name="supplier_id" value={form.supplier_id} onChange={handleChange} className="form-select">
                <option value="">{t('productForm.noSupplier')}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('productForm.shelfLocation')}</label>
              <input name="shelf_location" type="text" value={form.shelf_location} onChange={handleChange} placeholder={t('productForm.shelfPlaceholder')} className="form-input" />
            </div>
            <div className="form-group">
              <label>{t('productForm.expiryDate')}</label>
              <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label>{t('productForm.manufacturedDate')}</label>
              <input name="manufactured_date" type="date" value={form.manufactured_date} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('productForm.batchNumber')}</label>
              <input name="batch_number" type="text" value={form.batch_number} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label>{t('productForm.costPrice')}</label>
              <input name="cost_price" type="number" value={form.cost_price} onChange={handleChange} step="100" className="form-input" style={{ width: 120 }} />
            </div>
            <div className="form-group">
              <label>{t('productForm.sellingPrice')}</label>
              <input name="selling_price" type="number" value={form.selling_price} onChange={handleChange} step="100" className="form-input" style={{ width: 120 }} />
            </div>
          </div>

          <div className="form-group">
            <label>{t('productForm.notes')}</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="form-input" />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>{t('productForm.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('productForm.save') : isEdit ? t('productForm.editComplete') : t('productForm.addComplete')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
