import React, { useState } from 'react';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddApp: (appName: string) => void;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({
  isOpen,
  onClose,
  onAddApp,
}) => {
  const [appName, setAppName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    onAddApp(appName.trim());
    setAppName('');
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
          <h3>Tambah Aplikasi Fokus</h3>
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
          <div className="form-group">
            <label htmlFor="appNameInput">Nama Aplikasi</label>
            <input
              id="appNameInput"
              type="text"
              className="modal-input"
              placeholder="Contoh: Figma, Obsidian, Zoom..."
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              autoFocus
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

          <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
              Tambahkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
