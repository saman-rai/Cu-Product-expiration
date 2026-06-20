import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function ExpiryAlertModal({ alerts, onClose }) {
  const [dismiss, setDismiss] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const hasAlerts = alerts.today.length > 0 || alerts.tomorrow.length > 0 || alerts.expired.length > 0;
  if (!hasAlerts) return null;

  const handleClose = () => {
    if (dismiss) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('expiryAlertDismissed', today);
    }
    onClose();
  };

  const renderSection = (title, icon, items, color, viewGroup) => (
    <div className="alert-section">
      <div className="alert-section-header" style={{ borderLeftColor: color }}>
        <span>{icon} {title} <strong>({items.length})</strong></span>
      </div>
      {items.length === 0 ? (
        <div className="alert-empty">{t('alert.none')}</div>
      ) : (
        <div className="alert-items">
          {items.slice(0, 10).map(item => (
            <div key={item.id} className="alert-item">
              <div className="alert-item-name">{item.name}</div>
              <div className="alert-item-meta">
                {item.barcode && <span className="text-mono">{item.barcode}</span>}
                <span>{item.expiry_date}</span>
                {item.shelf_location && <span>{item.shelf_location}</span>}
                <span>{item.quantity}{item.unit}</span>
              </div>
            </div>
          ))}
          {items.length > 10 && (
            <button
              className="alert-view-all"
              onClick={() => { onClose(); navigate(`/expiring-soon?group=${viewGroup}`); }}
            >
              {t('alert.viewAll', { count: items.length - 10 })}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2>{t('alert.title')}</h2>
          <button className="btn-close" onClick={handleClose}>✕</button>
        </div>

        {alerts.expired.length > 0 && renderSection(t('alert.expired'), '🔴', alerts.expired, '#dc3545', 'expired')}
        {alerts.today.length > 0 && renderSection(t('alert.today'), '🟠', alerts.today, '#fd7e14', 'today')}
        {alerts.tomorrow.length > 0 && renderSection(t('alert.tomorrow'), '🟡', alerts.tomorrow, '#ffc107', 'tomorrow')}

        <label className="alert-dismiss-label">
          <input type="checkbox" checked={dismiss} onChange={e => setDismiss(e.target.checked)} />
          {t('alert.dismiss')}
        </label>

        <div className="modal-actions">
          <button className="btn" onClick={() => { onClose(); navigate('/expiring-soon'); }}>
            {t('alert.viewFull')}
          </button>
          <button className="btn btn-primary" onClick={handleClose}>
            {t('alert.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
