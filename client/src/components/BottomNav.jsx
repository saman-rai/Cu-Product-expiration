import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
  { to: '/dashboard', key: 'nav.home', icon: '🏠' },
  { to: '/scan', key: 'nav.scan', icon: '📷' },
  { to: '/products', key: 'nav.products', icon: '📦' },
  { to: '/expiring-soon', key: 'nav.expiring', icon: '⏰' },
  { to: '/excel', key: 'nav.more', icon: '📄' },
];

export default function BottomNav({ expiryCount }) {
  const { t } = useLanguage();

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
          <span>{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
