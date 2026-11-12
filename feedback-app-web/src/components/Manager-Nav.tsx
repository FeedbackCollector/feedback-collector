import { NavLink } from 'react-router-dom';
import '../styles/Manager-Nav.css';
import { User } from './User';
import chatIcon from '../images/chat.png';
import { useAuthStore } from '../store/authStore';

const LINKS = [
  { label: 'MyICs', to: '/MyICs' },
  { label: 'FeedBack Log', to: '/feedback-log' }
];

const closeSidebar = () => {
    document.querySelector('.manager-sidebar')?.classList.remove('open');
  };

export function NavBar({ links = LINKS }: { links?: { label: string; to: string; }[] }) {
  const role = useAuthStore((state) => state.user?.role);
  const homePath = role === 'director' ? '/dashboard' : '/MyICs';
  return (
    <div>
      <aside className="manager-sidebar">
        <NavLink to={homePath} className="manager-sidebar-header">
          <img src={chatIcon} alt="" width="32" height="32" />
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
