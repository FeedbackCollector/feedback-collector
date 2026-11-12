import React, { useRef, useState } from 'react';
import '../styles/User.css';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from "react-router-dom";
import { API_URL } from '../service/api';
import { UserAvatar } from './UserAvatar';

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


  const token = useAuthStore((state) => state.token);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);


  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  async function handleChangePassword() {
  setMessage('');

  if (!currentPassword || !newPassword || !confirmPassword) {
    setMessage('Complete all password fields.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessage('Passwords do not match.');
    return;
  }

  if (!token) {
    setMessage('Please log in again.');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/auth/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || 'Could not update password.');
      return;
    }

    setMessage('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  } catch {
    setMessage('Could not complete the request.');
  } finally {
    setLoading(false);
  }
}

function clearPasswordFields() {

  setCurrentPassword('');
  setNewPassword('');
  setConfirmPassword('');
  setMessage('');

}

  return (
    <>
      <section className='user-section' aria-label="Perfil de usuario">
        <div className='user-profile' onClick={openModal} style={{ cursor: 'pointer' }}>
          <UserAvatar
            name={user?.name ?? ''}
            id={user?.id ?? 'unknown'}
            entityType="user"
            size={48}
            className="user-profile__avatar"
          />        
          <div className='user-profile_name'>
            <span>{user?.name}</span>
            <p style={{ color:'#5f2169', fontWeight: '600', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>
      </section>

      <dialog 
        ref={dialogRef} 
        className="profile-dialog"
        onClick={closeModal}
        onClose={clearPasswordFields}
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '0',
          margin: 0,
          borderRadius: '16px',
          backgroundColor: 'transparent',
          border: 'none',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'sans-serif'
        }}
      >
        <style>{`
          dialog.profile-dialog {
            opacity: 0;
            transition: 
              opacity 0.08s ease-in, 
              display 0.08s ease-in allow-discrete,
              overlay 0.08s ease-in allow-discrete;
          }

          dialog.profile-dialog[open] {
            opacity: 1;
            transition: 
              opacity 0.4s ease-out, 
              display 0.4s ease-out allow-discrete,
              overlay 0.4s ease-out allow-discrete;
          }

          dialog.profile-dialog::backdrop {
            background-color: #6b7280;
            opacity: 0;
            transition: 
              opacity 0.08s ease-in, 
              display 0.08s ease-in allow-discrete,
              overlay 0.08s ease-in allow-discrete;
          }

          dialog.profile-dialog[open]::backdrop {
            opacity: 0.6;
            transition: 
              opacity 0.4s ease-out, 
              display 0.4s ease-out allow-discrete,
              overlay 0.4s ease-out allow-discrete;
          }

          @starting-style {
            dialog.profile-dialog[open] {
              opacity: 0;
            }
            dialog.profile-dialog[open]::backdrop {
              opacity: 0;
            }
          }

          @media (max-width: 472px) {
            dialog.profile-dialog {
              padding: 0 20px !important;
              box-sizing: border-box;
            }
          }
        `}</style>

      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#ffffff', 
          padding: '32px', 
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          textAlign: 'left' 
        }}
      >
        <h2 tabIndex={-1} style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: 0, outline: 'none' }}>
          My Profile
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px' }}>Name</label>
            <input type="text" value={user?.name} readOnly disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px' }}>Email</label>
            <input type="text" value={user?.email} readOnly disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', color: '#4b5563', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px' }}>Role</label>
            <input type="text" value={user?.role} readOnly disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', color: '#574b63', boxSizing: 'border-box' }} />
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #f3f4f6', margin: '8px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>Change Password</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '4px' }}>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete='current-password' style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb',  boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '4px' }}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete='new-password' style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb',  boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '4px' }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete='new-password' style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb',  boxSizing: 'border-box' }} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={loading}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#374151',
              backgroundColor: '#f9fafb',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Change Password'}
          </button>
          <p role="status">{message}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', marginTop: '8px', borderTop: '1px solid #f3f4f6' }}>
          <button type="button" onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 500, borderRadius: '9999px', fontSize: '14px', border: 'none', cursor: 'pointer'}}>
            {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#e3e3e3"><path d="M5,21q-0.83,0-1.41-0.59T3,19V5Q3,4.17 3.59,3.59T5,3h7V5H5V19h7v2H5Zm11-4l-1.38-1.45L17.18,13H9V11h8.18L14.63,8.45L16,7l5,5l-5,5Z"/></svg> */}
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