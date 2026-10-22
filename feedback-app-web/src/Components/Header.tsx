import { useLocation } from 'react-router-dom';
import './Header.css';

const PAGE_TITLES: Record<string, string> = {
  '/MyICs': 'My ICs',
  '/feedback-log': 'FeedBack Log'
};

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className="page-header">
      <h1>{PAGE_TITLES[pathname] ?? 'Página no encontrada'}</h1>
    </header>
  );
}
