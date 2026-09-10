import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Plane, LayoutDashboard, ArrowRight } from 'lucide-react';
import './HeaderV2.css';

export function HeaderV2() {
  const location = useLocation();
  const isTraveler = location.pathname === '/v2';
  const isAdmin = location.pathname === '/v2/admin';

  return (
    <header className="v2-header">
      <div className="v2-header-inner">
        <Link to="/v2" className="v2-logo">
          <span className="v2-logo-mark">
            <ShieldCheck size={20} strokeWidth={2.25} />
          </span>
          <span className="v2-logo-text-group">
            <span className="v2-logo-text">عبور</span>
            <span className="v2-logo-badge">V2</span>
          </span>
        </Link>

        <nav className="v2-nav">
          <Link to="/v2" className={`v2-nav-link ${isTraveler ? 'active' : ''}`}>
            <Plane size={17} strokeWidth={2.25} className="v2-nav-icon" />
            <span>مسافر</span>
          </Link>
          <Link to="/v2/admin" className={`v2-nav-link ${isAdmin ? 'active' : ''}`}>
            <LayoutDashboard size={17} strokeWidth={2.25} className="v2-nav-icon" />
            <span>لوحة التحكم</span>
          </Link>
        </nav>

        <Link to="/" className="v2-classic-link">
          الإصدار الكلاسيكي <ArrowRight size={13} strokeWidth={2.25} />
        </Link>
      </div>
    </header>
  );
}
