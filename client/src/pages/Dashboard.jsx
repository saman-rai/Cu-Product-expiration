import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import ExpiryAlertModal from '../components/ExpiryAlertModal';

export default function Dashboard() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    api.getDashboardSummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));

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

  if (!summary) return <div className="empty-state">{t('dashboard.loadError')}</div>;

  const { summary: counts, nearestExpiry, total } = summary;

  const cards = [
    { label: t('dashboard.expired'), value: counts.expired, color: '#dc3545', icon: '🔴' },
    { label: t('dashboard.critical'), value: counts.critical, color: '#fd7e14', icon: '🟠' },
    { label: t('dashboard.warning'), value: counts.warning, color: '#ffc107', icon: '🟡' },
    { label: t('dashboard.ok'), value: counts.normal + counts.fresh, color: '#28a745', icon: '🟢' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
        <p>{t('dashboard.totalProducts', { count: total })}</p>
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
        <h2 className="card-title">{t('dashboard.nearestExpiry')}</h2>
        {nearestExpiry.length === 0 ? (
          <div className="empty-state">{t('dashboard.noExpiring')}</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('products.status')}</th>
                  <th>{t('products.name')}</th>
                  <th>{t('products.barcode')}</th>
                  <th>{t('products.expiryDate')}</th>
                  <th>{t('common.days')}</th>
                  <th>{t('products.shelf')}</th>
                  <th>{t('products.quantity')}</th>
                </tr>
              </thead>
              <tbody>
                {nearestExpiry.map(p => {
                  const isExpired = p.days_left < 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className={`expiry-badge level-${p.level}`}>
                          {t(`badge.${p.level}`)}
                        </span>
                      </td>
                      <td>{p.name}</td>
                      <td className="text-mono">{p.barcode}</td>
                      <td>{p.expiry_date}</td>
                      <td className={isExpired ? 'text-danger' : ''}>
                        {isExpired
                          ? t('common.daysOverdue', { days: Math.abs(p.days_left) })
                          : t('common.days', { days: p.days_left })}
                      </td>
                      <td>{p.shelf_location || t('common.unknown')}</td>
                      <td>{p.quantity} {p.unit}</td>
                    </tr>
                  );
                })}
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
