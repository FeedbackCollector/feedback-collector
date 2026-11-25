import { NavLink } from 'react-router-dom';
import '../styles/Manager-Nav.css';
import { User } from './User';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePendingStore } from '../store/pendingStore';
import { countPendingManagers } from '../service/ManagementApi';

const chat = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#4B286D"><path d="M6,14h8V12H6v2Zm0-3H18V9H6v2ZM6,8H18V6H6V8ZM2,22V4Q2,3.17 2.59,2.59T4,2H20q0.83,0 1.41,0.59T22,4V16q0,0.82-0.59,1.41T20,18H6L2,22Zm3.15-6H20V4H4V17.13L5.15,16ZM4,16V4V16Z"/></svg>
const LINKS = [
  { label: 'MyICs', to: '/my-ics' },
  { label: 'AllICs', to: '/all-ics' },
  { label: 'Feedback Log', to: '/feedback-log' }
];

const closeSidebar = () => {
    document.querySelector('.manager-sidebar')?.classList.remove('open');
  };

export function NavBar({ links = LINKS }: { links?: { label: string; to: string; }[] }) {
  const role = useAuthStore((state) => state.user?.role);
  const token = useAuthStore((state) => state.token);
  const pendingCount = usePendingStore((state) => state.pendingCount);
  const setPendingCount = usePendingStore((state) => state.setPendingCount);

  useEffect(() => {
    if (role !== 'director' || !token) {
      setPendingCount(0);
      return;
    }
    countPendingManagers(token).then(setPendingCount).catch(() => setPendingCount(0));
  }, [role, token, setPendingCount]);

  const homePath = role === 'director' ? '/dashboard' : '/my-ics';
  return (
    <div>
      <aside className="manager-sidebar">
        <NavLink to={homePath} className="manager-sidebar-header">
          {chat}
          <h1>Feedback Collector</h1>
        </NavLink>
        
        <User />
        
        <nav className="manager-nav" aria-label="Navegación principal">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              {link.label}
              {link.to === '/management' && pendingCount > 0 && (
                <span
                  className="nav-badge"
                  aria-label={`${pendingCount} pending manager approvals`}
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
      <button
        className="manager-overlay"
        type="button"
        aria-label="Close sidebar"
        onClick={closeSidebar}
        />
    </div>
  );
}
