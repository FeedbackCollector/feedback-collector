import '../styles/Header.css';
import '../styles/Manager-Nav.css';
import { usePendingStore } from '../store/pendingStore';

export function Header({ title }: { title: string }) {
  const pendingCount = usePendingStore((state) => state.pendingCount);
  return (
    <header className="page-header">
      <span className="header-menu">
        <i className="fa-solid fa-bars" onClick={() => {
          document.querySelector('.manager-sidebar')?.classList.toggle('open');
          }}></i>
        {pendingCount > 0 && (
          <span
            className="header-menu-dot"
            role="status"
            aria-label={`${pendingCount} pending manager approvals`}
          />
        )}
      </span>
      <h1>{title}</h1>
      <div id="page-header-actions" className="page-header-actions" />
    </header>
  );
}
