import { useMatches } from 'react-router-dom';
import './Header.css';

function isHeaderHandle(handle: unknown): handle is { title: string } {
  return typeof handle === 'object'
    && handle !== null
    && 'title' in handle
    && typeof handle.title === 'string';
}

export function Header() {
  const matches = useMatches();
  const title = matches.reduce<string | undefined>((currentTitle, match) => (
    isHeaderHandle(match.handle) ? match.handle.title : currentTitle
  ), undefined) ?? 'Página no encontrada';

  return (
    <header className="page-header">
      <h1>{title}</h1>
    </header>
  );
}
