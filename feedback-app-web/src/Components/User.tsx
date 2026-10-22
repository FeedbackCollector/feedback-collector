import './User.css';

export function User() {
  return (
    <>
      <hr />
      <section aria-label="Perfil de usuario">
        <div className='user-profile'>
          <div className="user-profile__avatar" aria-hidden="true" />
          <div className='user-profile_name'>
            <span>Nombre de usuario</span>
            <p>Role</p>
          </div>
        </div>

      </section>
      <hr />
    </>
  );
}
