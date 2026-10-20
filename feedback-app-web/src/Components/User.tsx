import './User.css';

export function User() {
  return (
    <section aria-label="Perfil de usuario">
      <div className="user-profile__avatar" aria-hidden="true" />
      <span >Nombre de usuario</span>
    </section>
  );
}
