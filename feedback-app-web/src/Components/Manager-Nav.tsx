import { NavLink } from 'react-router-dom';
import './Manager-Nav.css';

const LINKS = [
  { label: 'MyICs', to: '/' },
  { label: 'FeedBack Log', to: '/feedback-log' }
];

export function NavBar({ links = LINKS }) {
  return (
    <header className="manager-header">
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
    </header>
  );
}
