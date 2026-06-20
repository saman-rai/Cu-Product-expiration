import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import { api } from '../services/api';

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: '📊' },
  { to: '/products', label: '제품 관리', icon: '📦' },
  { to: '/categories', label: '카테고리', icon: '📁' },
  { to: '/suppliers', label: '공급업체', icon: '🏭' },
  { to: '/expiring-soon', label: '소멸 임박', icon: '⏰' },
  { to: '/excel', label: '엑셀 가져오기', icon: '📄' },
];

export default function Layout() {
  const { user, logout } = useAuth();
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
      {/* Mobile menu toggle */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* Sidebar */}
      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🏪 {user?.store_name || 'CU 편의점'}</h2>
          <p className="user-info">{user?.username} ({user?.role === 'admin' ? '관리자' : '직원'})</p>
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
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            로그아웃
          </button>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Floating Action Button (mobile) */}
      <button className="fab" onClick={() => navigate('/scan')} title="빠른 스캔">
        📷
      </button>

      {/* Bottom Navigation (mobile) */}
      <BottomNav expiryCount={expiryCount} />

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
