import { useState, useRef } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function ExcelImport() {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError('');
    setPreview({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' });
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const res = await api.importExcel(file);
      setResult(res);
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const resultLabel = (count, keyOne, keyMany) =>
    count === 1 ? t(keyOne) : t(keyMany, { count });

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('excel.title')}</h1>
      </div>

      <div className="card">
        <h2 className="card-title">{t('excel.step1')}</h2>
        <p className="card-desc">{t('excel.step1Desc')}</p>
        <button className="btn btn-primary" onClick={() => api.downloadTemplate()}>
          📄 {t('excel.downloadTemplate')}
        </button>
      </div>

      <div className="card">
        <h2 className="card-title">{t('excel.step2')}</h2>
        <p className="card-desc">{t('excel.step2Desc')}</p>
        <div className="file-upload">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="file-input" />
          {preview && (
            <div className="file-info">
              <span>📎 {preview.name} ({preview.size})</span>
            </div>
          )}
          {!preview && <p className="file-info" style={{ color: 'var(--gray-400)' }}>{t('excel.noFile')}</p>}
        </div>
        {file && (
          <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
            {importing ? t('excel.importing') : `🚀 ${t('excel.import')}`}
          </button>
        )}
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      {result && (
        <div className="card">
          <h2 className="card-title">{t('excel.step3')}</h2>
          <div className="import-results">
            <div className="result-item result-success">
              {resultLabel(result.imported, 'excel.result_imported_one', 'excel.result_imported')}
            </div>
            <div className="result-item result-info">
              {resultLabel(result.updated, 'excel.result_updated_one', 'excel.result_updated')}
            </div>
            {result.errors?.length > 0 && (
              <div className="result-item result-error">
                {resultLabel(result.errors.length, 'excel.result_errors_one', 'excel.result_errors')}
                <ul className="error-list">
                  {result.errors.map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">{t('excel.export')}</h2>
        <p className="card-desc">{t('excel.step1Desc')}</p>
        <button className="btn btn-primary" onClick={() => api.exportExcel()}>
          📥 {t('excel.export')}
        </button>
      </div>
    </div>
  );
}
