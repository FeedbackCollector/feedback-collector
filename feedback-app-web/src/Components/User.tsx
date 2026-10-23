import './User.css';

export function User({ user }) {
  return (
    <>
      <hr />
      <section aria-label="Perfil de usuario">
        <div className='user-profile'>
          <div className="user-profile__avatar" aria-hidden="true" />
          <div className='user-profile_name'>
            <span>{user?.email ?? 'Usuario'}</span>
            <p>{user?.role === 'director' ? 'Director' : 'Manager'}</p>
          </div>
        </div>

      </section>
      <hr />
    </>
  );
}
