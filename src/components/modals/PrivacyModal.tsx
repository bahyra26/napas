import React from 'react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3>Arsitektur Privasi On-Device NAPAS</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', marginTop: '4px' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              marginBottom: '14px',
            }}
          >
            <strong style={{ color: '#065f46' }}>🛡️ Jaminan Privasi Tanpa Rekaman Wajah:</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#047857' }}>
              Kamera hanya digunakan untuk mendeteksi landmark 3D (frekuensi kedipan &amp; ketegangan alis) langsung di memori browser (WebAssembly). Tidak ada foto atau video yang pernah disimpan atau dikirim ke internet.
            </p>
          </div>

          <ul style={{ paddingLeft: '18px', margin: '0 0 16px 0', fontSize: '12.5px', color: '#4b5563' }}>
            <li style={{ marginBottom: '6px' }}>
              <strong>Zero Biometric Cloud Storage:</strong> Data wajah langsung dibuang seketika setelah nilai numerik ketegangan dihitung.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>Kendali Penuh Izin Sensor:</strong> Anda bebas mematikan kamera atau pelacakan jendela kapan saja lewat sakelar di tab Settings.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>Enkripsi Sesi Kalender:</strong> Akses Google Calendar hanya menggunakan token OAuth terotorisasi untuk sinkronisasi agenda akademik.
            </li>
          </ul>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
