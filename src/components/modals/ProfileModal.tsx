import React, { useState } from 'react';
import { UserProfileInfo } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  user: UserProfileInfo;
  onClose: () => void;
  onSaveProfile: (updated: UserProfileInfo) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onSaveProfile,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveProfile({
      ...user,
      name: name.trim(),
      email: email.trim(),
    });
    onClose();
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h3>Kelola Profil Pengguna</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label htmlFor="profileNameInput">Nama Lengkap</label>
            <input
              id="profileNameInput"
              type="text"
              className="modal-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '13px',
                fontFamily: 'inherit',
                marginTop: '6px',
                outline: 'none',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="profileEmailInput">Email Kampus / Akun</label>
            <input
              id="profileEmailInput"
              type="email"
              className="modal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '13px',
                fontFamily: 'inherit',
                marginTop: '6px',
                outline: 'none',
              }}
            />
          </div>

          <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-save"
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#07513d',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
