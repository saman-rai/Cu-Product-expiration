import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ExpiryAlertModal from '../components/ExpiryAlertModal';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    api.getDashboardSummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));

    // Check expiry alerts for login popup
    const dismissed = localStorage.getItem('expiryAlertDismissed');
    const today = new Date().toISOString().split('T')[0];

    if (dismissed !== today) {
      api.getExpiryAlerts()
        .then(data => {
          const hasAlerts = data.today.length > 0 || data.tomorrow.length > 0 || data.expired.length > 0;
          if (hasAlerts) {
            setAlerts(data);
            setShowAlerts(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  if (!summary) return <div className="empty-state">데이터를 불러올 수 없습니다.</div>;

  const { summary: counts, nearestExpiry, total } = summary;

  const cards = [
    { label: '유통기한 초과', value: counts.expired, color: '#dc3545', icon: '🔴' },
    { label: '임박 (3일 이내)', value: counts.critical, color: '#fd7e14', icon: '🟠' },
    { label: '주의 (2주 이내)', value: counts.warning, color: '#ffc107', icon: '🟡' },
    { label: '여유 있음', value: counts.normal + counts.fresh, color: '#28a745', icon: '🟢' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>대시보드</h1>
        <p>총 {total}개 제품</p>
      </div>

      <div className="summary-cards">
        {cards.map(card => (
          <div key={card.label} className="summary-card" style={{ borderLeftColor: card.color }}>
            <div className="summary-card-icon">{card.icon}</div>
            <div className="summary-card-body">
              <div className="summary-card-value">{card.value}</div>
              <div className="summary-card-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="card-title">⚠️ 유통기한 임박 제품</h2>
        {nearestExpiry.length === 0 ? (
          <div className="empty-state">✅ 임박 제품이 없습니다.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>제품명</th>
                  <th>바코드</th>
                  <th>유통기한</th>
                  <th>남은일수</th>
                  <th>진열장</th>
                  <th>수량</th>
                </tr>
              </thead>
              <tbody>
                {nearestExpiry.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className={`expiry-badge level-${p.level}`}>
                        {p.level === 'expired' ? '초과' : p.level === 'critical' ? '임박' : '주의'}
                      </span>
                    </td>
                    <td>{p.name}</td>
                    <td className="text-mono">{p.barcode}</td>
                    <td>{p.expiry_date}</td>
                    <td className={p.days_left < 0 ? 'text-danger' : ''}>
                      {p.days_left < 0 ? `${Math.abs(p.days_left)}일 초과` : `${p.days_left}일`}
                    </td>
                    <td>{p.shelf_location || '-'}</td>
                    <td>{p.quantity} {p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAlerts && alerts && (
        <ExpiryAlertModal
          alerts={alerts}
          onClose={() => setShowAlerts(false)}
        />
      )}
    </div>
  );
}
