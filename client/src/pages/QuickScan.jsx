import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function QuickScan() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [scannerReady, setScannerReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ name: '', expiry_date: '', quantity: 1, category_id: '' });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ updated: 0, added: 0 });
  const readerRef = useRef(null);
  const scannerContainerRef = useRef(null);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!document.getElementById('quick-scanner')) {
        const div = document.createElement('div');
        div.id = 'quick-scanner';
        scannerContainerRef.current?.appendChild(div);
      }
      const reader = new Html5Qrcode('quick-scanner');
      readerRef.current = reader;
      setScanning(true);

      await reader.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => { handleScan(decodedText); },
        () => {}
      );
      setScannerReady(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError(t('scan.cameraError'));
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (readerRef.current) {
      try { await readerRef.current.stop(); } catch {}
      try { await readerRef.current.clear(); } catch {}
      readerRef.current = null;
    }
    setScannerReady(false);
    setScanning(false);
  };

  const handleScan = async (code) => {
    setBarcode(code);
    try {
      const existing = await api.getProductByBarcode(code);
      setProduct(existing);
      setIsNew(false);
      setForm({
        name: existing.name,
        expiry_date: '',
        quantity: existing.quantity || 1,
        category_id: existing.category_id || '',
      });
      setError('');
    } catch {
      setProduct(null);
      setIsNew(true);
      setForm({ name: '', expiry_date: '', quantity: 1, category_id: '' });
      setError('');
    }
  };

  const handleManualBarcode = useCallback(async () => {
    if (!barcode || barcode.length < 3) return;
    await handleScan(barcode);
  }, [barcode]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleManualBarcode(); }
  };

  const handleUpdateExpiry = async () => {
    if (!form.expiry_date) return setError(t('scan.error_expiry'));
    setSaving(true);
    try {
      await api.updateProduct(product.id, { ...product, expiry_date: form.expiry_date });
      setStats(prev => ({ ...prev, updated: prev.updated + 1 }));
      resetScan();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleAddProduct = async () => {
    if (!form.name) return setError(t('scan.error_name'));
    if (!form.expiry_date) return setError(t('scan.error_expiry'));
    setSaving(true);
    try {
      await api.createProduct({ barcode, name: form.name, expiry_date: form.expiry_date, quantity: form.quantity, category_id: form.category_id || null });
      setStats(prev => ({ ...prev, added: prev.added + 1 }));
      resetScan();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const resetScan = () => {
    setBarcode('');
    setProduct(null);
    setIsNew(false);
    setForm({ name: '', expiry_date: '', quantity: 1, category_id: '' });
    setError('');
    if (readerRef.current) {
      try { readerRef.current.resume(); } catch {}
    }
  };

  const stopAndGo = () => { stopScanner(); navigate('/products'); };

  return (
    <div className="page scan-page">
      <div className="page-header">
        <h1>{t('scan.title')}</h1>
        <button className="btn btn-sm" onClick={stopAndGo}>{t('scan.goToProducts')}</button>
      </div>

      {stats.updated > 0 || stats.added > 0 ? (
        <div className="scan-stats">
          <span className="scan-stat scan-stat-updated">{t('scan.updated', { count: stats.updated })}</span>
          <span className="scan-stat scan-stat-added">{t('scan.added', { count: stats.added })}</span>
        </div>
      ) : null}

      <div className="form-row" style={{ marginBottom: '1rem' }}>
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('scan.barcodePlaceholder')}
          className="form-input"
          style={{ flex: 1, fontSize: '1rem', minHeight: 44 }}
        />
        <button className="btn btn-primary" onClick={handleManualBarcode} style={{ minHeight: 44 }}>
          {t('scan.lookup')}
        </button>
      </div>

      <div ref={scannerContainerRef} className="scanner-container" style={{ display: scanning ? 'block' : 'none' }}>
        {!scannerReady && scanning && <div className="loading"><div className="spinner" /></div>}
      </div>

      {!scanning && !product && <div className="empty-state">{t('scan.cameraError')}</div>}

      {error && <div className="alert alert-error">{error}</div>}

      {product && !isNew && (
        <div className="scan-result scan-result-existing">
          <div className="scan-result-header">
            <span className="expiry-badge" style={{ background: '#2563eb' }}>{t('scan.existingProduct')}</span>
          </div>
          <h3>{product.name}</h3>
          <div className="scan-result-info">
            <div><strong>{t('scan.barcode', { code: '' })}</strong> {product.barcode}</div>
            <div><strong>{t('scan.currentExpiry', { date: product.expiry_date })}</strong></div>
            {product.category_name && <div><strong>{t('scan.category', { name: product.category_name })}</strong></div>}
            {product.shelf_location && <div><strong>{t('scan.shelf', { location: product.shelf_location })}</strong></div>}
          </div>
          <div className="scan-result-form">
            <label><strong>{t('scan.newExpiry')}</strong></label>
            <input
              type="date"
              value={form.expiry_date}
              onChange={e => setForm(prev => ({ ...prev, expiry_date: e.target.value }))}
              className="form-input"
              style={{ fontSize: '1rem', minHeight: 44, marginBottom: '0.75rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleUpdateExpiry} disabled={saving} style={{ flex: 1, minHeight: 44 }}>
                {saving ? t('scan.saving') : t('scan.updateExpiry')}
              </button>
              <button className="btn" onClick={resetScan} style={{ minHeight: 44 }}>{t('scan.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {isNew && (
        <div className="scan-result scan-result-new">
          <div className="scan-result-header">
            <span className="expiry-badge" style={{ background: '#28a745' }}>{t('scan.newProduct')}</span>
          </div>
          <p className="scan-result-barcode">{t('scan.barcode', { code: barcode })}</p>

          <div className="scan-result-form">
            <div className="form-group">
              <label>{t('productForm.name')}</label>
              <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder={t('scan.namePlaceholder')} className="form-input" style={{ fontSize: '1rem', minHeight: 44 }} />
            </div>
            <div className="form-row">
              <div className="form-group flex-grow">
                <label>{t('productForm.expiryDate')}</label>
                <input type="date" value={form.expiry_date} onChange={e => setForm(prev => ({ ...prev, expiry_date: e.target.value }))} className="form-input" style={{ fontSize: '1rem', minHeight: 44 }} />
              </div>
              <div className="form-group" style={{ minWidth: 80 }}>
                <label>{t('productForm.quantity')}</label>
                <input type="number" value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))} min="1" className="form-input" style={{ fontSize: '1rem', minHeight: 44 }} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('productForm.category')}</label>
              <select value={form.category_id} onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))} className="form-select" style={{ fontSize: '1rem', minHeight: 44 }}>
                <option value="">{t('productForm.noCategory')}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleAddProduct} disabled={saving} style={{ flex: 1, minHeight: 44 }}>
                {saving ? t('scan.saving') : t('scan.addProduct')}
              </button>
              <button className="btn" onClick={resetScan} style={{ minHeight: 44 }}>{t('scan.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
