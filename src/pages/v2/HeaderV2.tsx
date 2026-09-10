import { Link, useLocation } from 'react-router-dom';
import './HeaderV2.css';

export function HeaderV2() {
  const location = useLocation();
  const isTraveler = location.pathname === '/v2';
  const isAdmin = location.pathname === '/v2/admin';

  return (
    <header className="v2-header">
      <div className="v2-header-inner">
        <Link to="/v2" className="v2-logo">
          <span className="v2-logo-mark">🛂</span>
          <span className="v2-logo-text-group">
            <span className="v2-logo-text">عبور</span>
            <span className="v2-logo-badge">V2</span>
          </span>
        </Link>

        <nav className="v2-nav">
          <Link to="/v2" className={`v2-nav-link ${isTraveler ? 'active' : ''}`}>
            <span className="v2-nav-icon">✈️</span>
            <span>مسافر</span>
          </Link>
          <Link to="/v2/admin" className={`v2-nav-link ${isAdmin ? 'active' : ''}`}>
            <span className="v2-nav-icon">🛡️</span>
            <span>لوحة التحكم</span>
          </Link>
        </nav>

        <Link to="/" className="v2-classic-link">
          الإصدار الكلاسيكي ↩
        </Link>
      </div>
    </header>
  );
}
