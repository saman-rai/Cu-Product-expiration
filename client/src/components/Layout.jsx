import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from './BottomNav';
import { api } from '../services/api';

const navItems = [
  { to: '/dashboard', key: 'nav.dashboard', icon: '📊' },
  { to: '/products', key: 'nav.products', icon: '📦' },
  { to: '/categories', key: 'nav.categories', icon: '📁' },
  { to: '/suppliers', key: 'nav.suppliers', icon: '🏭' },
  { to: '/expiring-soon', key: 'nav.expiring', icon: '⏰' },
  { to: '/excel', key: 'nav.excel', icon: '📄' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, toggleLang, lang } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expiryCount, setExpiryCount] = useState(0);

  useEffect(() => {
    api.getDashboardSummary()
      .then(data => {
        const count = (data.summary?.expired || 0) + (data.summary?.critical || 0);
        setExpiryCount(count);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🏪 {user?.store_name || 'CU 편의점'}</h2>
          <p className="user-info">{user?.username} ({user?.role === 'admin' ? t('nav.admin') : t('nav.staff')})</p>
        </div>
        <ul className="nav-list">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                onClick={() => setMenuOpen(false)}
              >
                <span style={{ position: 'relative' }}>
                  {item.icon}
                  {item.to === '/expiring-soon' && expiryCount > 0 && (
                    <span className="nav-badge">{expiryCount > 99 ? '99+' : expiryCount}</span>
                  )}
                </span>
                {t(item.key)}
              </NavLink>
            </li>
          ))}
          <li>
            <button className="nav-link lang-toggle" onClick={toggleLang}>
              🌐 {lang === 'ko' ? 'English' : '한국어'}
            </button>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            {t('nav.logout')}
          </button>
        </div>
      </nav>

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <button className="fab" onClick={() => navigate('/scan')} title={t('nav.scan')}>
        📷
      </button>

      <BottomNav expiryCount={expiryCount} />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
