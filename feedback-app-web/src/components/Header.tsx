import '../styles/Header.css';
import '../styles/Manager-Nav.css';

export function Header({ title }: { title: string }) {
  return (
    <header className="page-header">
      <i className="fa-solid fa-bars" onClick={() => {
        document.querySelector('.manager-sidebar')?.classList.toggle('open');
        }}></i>
      <h1>{title}</h1>
    </header>
  );
}
