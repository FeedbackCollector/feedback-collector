import { NavLink } from 'react-router-dom';
import './Manager-Nav.css';
import { User } from './User';

const LINKS = [
  { label: 'MyICs', to: '/MyICs' },
  { label: 'FeedBack Log', to: '/feedback-log' }
];

export function NavBar({ links = LINKS }) {
  return (
    <aside className="manager-sidebar">
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
  );
}
