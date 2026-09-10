import { Outlet } from 'react-router-dom';
import { HeaderV2 } from './HeaderV2';
import './v2-theme.css';

export function V2Layout() {
  return (
    <div className="v2-shell">
      <div className="v2-bg-mesh" aria-hidden="true" />
      <HeaderV2 />
      <main className="v2-main">
        <Outlet />
      </main>
    </div>
  );
}
