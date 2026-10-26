import React, { useRef } from 'react';
import './User.css';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from "react-router-dom";


export function User() {
  const user = useAuthStore((state) => state.user);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    dialogRef.current?.showModal();
  };

  const closeModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    dialogRef.current?.close();
  };

  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <hr />
      <section aria-label="Perfil de usuario">
        <div className='user-profile' onClick={openModal} style={{ cursor: 'pointer' }}>
          <div className="user-profile__avatar" aria-hidden="true" />
          <div className='user-profile_name'>
            <span>{user?.email}</span>
            <p>{user?.role}</p>
          </div>
        </div>
      </section>
      <hr />

      <dialog 
        ref={dialogRef} 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '32px',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          border: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0,
          fontFamily: 'sans-serif'
        }}
      >
        <style>{`
          dialog::backdrop {
            background-color: #6b7280;
            opacity: 0.6;
          }
        `}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: 0 }}>My Profile</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px' }}>Name</label>
              <input type="text" value="{user?.name}" readOnly disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px' }}>Email</label>
              <input type="text" value={user?.email} readOnly disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px' }}>Role</label>
              <input type="text" value={user?.role} readOnly disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid #f3f4f6', margin: '8px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>Change Password</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '4px' }}>Current Password</label>
              <input type="password" disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb',  boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '4px' }}>New Password</label>
                <input type="password" disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb',  boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '4px' }}>Confirm Password</label>
                <input type="password" disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb',  boxSizing: 'border-box' }} />
              </div>
            </div>

            <button type="button" style={{ width: 'fit-content', padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#9ca3af', backgroundColor: '#f9fafb', fontWeight: 500,  fontSize: '14px' }}>
              Change Password
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', marginTop: '8px', borderTop: '1px solid #f3f4f6' }}>
            <button type="button" onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 500, borderRadius: '9999px', fontSize: '14px', border: 'none', cursor: 'pointer'}}>
              Log out
            </button>

            <button 
              type="button"
              onClick={closeModal} 
              style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderRadius: '9999px', fontSize: '14px', fontWeight: 500, color: '#4b5563', backgroundColor: '#ffffff', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
