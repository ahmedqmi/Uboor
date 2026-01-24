import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🚗</span>
          <span className="logo-text">عبور</span>
        </Link>
        <nav className="nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <span className="nav-icon">✈️</span>
            سافر
          </Link>
          <Link
            to="/admin"
            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <span className="nav-icon">🛡️</span>
            لوحة التحكم
          </Link>
        </nav>
      </div>
    </header>
  );
}
