import { NavLink } from 'react-router-dom';
import './Manager-Nav.css';
import { User } from './User';
import chatIcon from '../images/chat.png';

const LINKS = [
  { label: 'MyICs', to: '/MyICs' },
  { label: 'FeedBack Log', to: '/feedback-log' }
];

export function NavBar({ links = LINKS }) {
  return (
  <>
    <aside className="manager-sidebar">
      <div className="manager-sidebar-header">
        <img src={chatIcon} alt="chaticon" width="32" height="32"/>
        <h1>Feedback Collector</h1>
      </div>
      <User />
      <nav className="manager-nav" aria-label="Navegación principal">
        {links.map((link) => (
          <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  </>
  );
}
