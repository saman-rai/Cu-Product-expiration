import { useState, useRef } from 'react';
import { api } from '../services/api';

export default function ExcelImport() {
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

    // Basic preview using FileReader
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const XLSX = require('xlsx');
        // We can't use require in the browser easily, skip preview for now
        // Just show file name
        setPreview({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' });
      } catch {
        setPreview({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' });
      }
    };
    reader.readAsArrayBuffer(f);
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>엑셀 가져오기</h1>
      </div>

      <div className="card">
        <h2 className="card-title">1. 템플릿 다운로드</h2>
        <p className="card-desc">
          HQ에서 받은 데이터 형식에 맞게 템플릿을 다운로드하세요.
          바코드, 제품명, 유통기한은 필수 항목입니다.
        </p>
        <button className="btn btn-primary" onClick={() => api.downloadTemplate()}>
          📄 템플릿 다운로드
        </button>
      </div>

      <div className="card">
        <h2 className="card-title">2. 파일 업로드</h2>
        <p className="card-desc">
          .xlsx 또는 .xls 파일을 선택하세요. 기존 바코드는 업데이트되고 새 바코드는 추가됩니다.
        </p>
        <div className="file-upload">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="file-input"
          />
          {preview && (
            <div className="file-info">
              <span>📎 {preview.name} ({preview.size})</span>
            </div>
          )}
        </div>
        {file && (
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? '가져오는 중...' : '🚀 가져오기 시작'}
          </button>
        )}
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      {result && (
        <div className="card">
          <h2 className="card-title">3. 가져오기 결과</h2>
          <div className="import-results">
            <div className="result-item result-success">
              ✅ <strong>{result.imported}</strong>개 새 제품 추가
            </div>
            <div className="result-item result-info">
              📝 <strong>{result.updated}</strong>개 기존 제품 업데이트
            </div>
            {result.errors?.length > 0 && (
              <div className="result-item result-error">
                ❌ <strong>{result.errors.length}</strong>개 오류
                <ul className="error-list">
                  {result.errors.map((err, i) => (
                    <li key={i}>행 {err.row}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">내보내기</h2>
        <p className="card-desc">현재 등록된 모든 제품을 엑셀 파일로 내보냅니다.</p>
        <button className="btn btn-primary" onClick={() => api.exportExcel()}>
          📥 엑셀 내보내기
        </button>
      </div>
    </div>
  );
}
