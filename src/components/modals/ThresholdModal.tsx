import React, { useState } from 'react';

interface ThresholdModalProps {
  isOpen: boolean;
  currentThreshold: number;
  onClose: () => void;
  onSaveThreshold: (minutes: number) => void;
}

export const ThresholdModal: React.FC<ThresholdModalProps> = ({
  isOpen,
  currentThreshold,
  onClose,
  onSaveThreshold,
}) => {
  const [selected, setSelected] = useState(currentThreshold);

  if (!isOpen) return null;

  const options = [3, 5, 10, 15, 20];

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h3>Batas Toleransi Distraksi</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '14px' }}>
          Tentukan durasi penggunaan aplikasi distraksi sebelum NAPAS memicu intervensi Focus Lock.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {options.map((m) => (
            <label
              key={m}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: selected === m ? '1.5px solid #07513d' : '1px solid #e5e7eb',
                background: selected === m ? '#f0fdf4' : '#fff',
                cursor: 'pointer',
                fontWeight: selected === m ? 700 : 500,
                fontSize: '12.5px',
                color: '#111827',
              }}
            >
              <span>{m} menit {m === 5 && '(Rekomendasi default)'}</span>
              <input
                type="radio"
                name="threshold"
                value={m}
                checked={selected === m}
                onChange={() => setSelected(m)}
              />
            </label>
          ))}
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
            type="button"
            className="btn-save"
            onClick={() => {
              onSaveThreshold(selected);
              onClose();
            }}
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
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
