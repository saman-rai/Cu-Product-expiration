import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

export default function ProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    barcode: '',
    name: '',
    category_id: '',
    supplier_id: '',
    quantity: 1,
    unit: '개',
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
        unit: product.unit || '개',
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

  // USB barcode scanner handling — keyboard wedge with debounce
  const handleBarcodeKeyDown = useCallback((e) => {
    // USB scanners typically send a barcode followed by Enter
    if (e.key === 'Enter' && barcodeRef.current?.value) {
      e.preventDefault();
      lookUpBarcode(barcodeRef.current.value);
      return;
    }
    // Debounce: wait for scanner to finish typing
    clearTimeout(scannerTimer.current);
    scannerTimer.current = setTimeout(() => {
      if (barcodeRef.current?.value) {
        lookUpBarcode(barcodeRef.current.value);
      }
    }, 100);
  }, []);

  const lookUpBarcode = async (code) => {
    if (!code || code.length < 3) return;
    try {
      const existing = await api.getProductByBarcode(code);
      // Auto-fill form from existing product
      setForm(prev => ({
        ...prev,
        barcode: code,
        name: existing.name,
        category_id: existing.category_id || '',
        supplier_id: existing.supplier_id || '',
        quantity: existing.quantity || 1,
        unit: existing.unit || '개',
        shelf_location: existing.shelf_location || '',
        expiry_date: '',
        notes: existing.notes || '',
      }));
      alert('기존 제품 정보를 불러왔습니다. 유통기한을 업데이트하세요.');
    } catch {
      // No existing product — just use the barcode
    }
  };

  // Camera barcode scanner
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
        () => {} // ignore partial reads
      );
    } catch (err) {
      console.error('Camera error:', err);
      alert('카메라를 열 수 없습니다. 다른 브라우저를 시도하거나 USB 스캐너를 사용하세요.');
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
    if (!form.name) return setError('제품명을 입력하세요.');
    if (!form.expiry_date) return setError('유통기한을 입력하세요.');

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? '제품 수정' : '새 제품 추가'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group flex-grow">
              <label>바코드</label>
              <div className="barcode-input-group">
                <input
                  ref={barcodeRef}
                  name="barcode"
                  type="text"
                  value={form.barcode}
                  onChange={handleChange}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="스캔 또는 수동 입력"
                  className="form-input"
                />
                <button type="button" className="btn btn-scan" onClick={startCameraScanner} title="카메라 스캔">
                  📷
                </button>
              </div>
            </div>
          </div>

          {scannerActive && (
            <div className="scanner-container">
              <div id="barcode-scanner" />
              <button type="button" className="btn btn-danger btn-sm" onClick={stopCameraScanner}>
                스캔 중지
              </button>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-grow">
              <label>제품명 *</label>
              <input name="name" type="text" value={form.name} onChange={handleChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label>수량</label>
              <input name="quantity" type="number" value={form.quantity} onChange={handleChange} min="1" className="form-input" style={{ width: 80 }} />
            </div>
            <div className="form-group">
              <label>단위</label>
              <select name="unit" value={form.unit} onChange={handleChange} className="form-select">
                <option>개</option>
                <option>박스</option>
                <option>봉지</option>
                <option>병</option>
                <option>캔</option>
                <option>팩</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-grow">
              <label>카테고리</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className="form-select">
                <option value="">선택 안함</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {'─'.repeat((c.parent_id ? 1 : 0))} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group flex-grow">
              <label>공급업체</label>
              <select name="supplier_id" value={form.supplier_id} onChange={handleChange} className="form-select">
                <option value="">선택 안함</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>진열장 / 선반</label>
              <input name="shelf_location" type="text" value={form.shelf_location} onChange={handleChange} placeholder="예: A-12, 3번 진열대" className="form-input" />
            </div>
            <div className="form-group">
              <label>유통기한 *</label>
              <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label>제조일자</label>
              <input name="manufactured_date" type="date" value={form.manufactured_date} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>로트번호</label>
              <input name="batch_number" type="text" value={form.batch_number} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label>매입가</label>
              <input name="cost_price" type="number" value={form.cost_price} onChange={handleChange} step="100" className="form-input" style={{ width: 120 }} />
            </div>
            <div className="form-group">
              <label>판매가</label>
              <input name="selling_price" type="number" value={form.selling_price} onChange={handleChange} step="100" className="form-input" style={{ width: 120 }} />
            </div>
          </div>

          <div className="form-group">
            <label>비고</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="form-input" />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중...' : isEdit ? '수정 완료' : '추가 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
