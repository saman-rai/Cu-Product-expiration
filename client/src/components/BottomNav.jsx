import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: '홈', icon: '🏠' },
  { to: '/scan', label: '스캔', icon: '📷' },
  { to: '/products', label: '제품', icon: '📦' },
  { to: '/expiring-soon', label: '소멸', icon: '⏰' },
  { to: '/excel', label: '더보기', icon: '📄' },
];

export default function BottomNav({ expiryCount }) {
  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">
            {item.icon}
            {item.to === '/expiring-soon' && expiryCount > 0 && (
              <span className="nav-badge">{expiryCount > 99 ? '99+' : expiryCount}</span>
            )}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
