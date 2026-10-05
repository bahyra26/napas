import React, { useState } from 'react';

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReflection: (text: string) => void;
  promptQuestion?: string;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  isOpen,
  onClose,
  onSaveReflection,
  promptQuestion = 'Hal baik apa yang ingin kamu ulang besok?',
}) => {
  const [reflectionText, setReflectionText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    onSaveReflection(reflectionText.trim());
    setReflectionText('');
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
          <h3>Refleksi Hari Ini</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#064e3b' }}>
              {promptQuestion}
            </label>
            <textarea
              className="modal-textarea"
              rows={4}
              placeholder="Tuliskan pengalaman positif, pelajaran kecil, atau kebiasaan baik hari ini..."
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              autoFocus
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1.5px solid #d1d5db',
                fontSize: '13px',
                fontFamily: 'inherit',
                marginTop: '8px',
                resize: 'none',
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
              Simpan Refleksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
