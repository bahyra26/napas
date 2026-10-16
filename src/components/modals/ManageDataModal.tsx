import React, { useState } from 'react';

interface ManageDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearLocalData: () => void;
  onResetPreferences: () => void;
}

export const ManageDataModal: React.FC<ManageDataModalProps> = ({
  isOpen,
  onClose,
  onClearLocalData,
  onResetPreferences,
}) => {
  const [confirmStep, setConfirmStep] = useState<'menu' | 'confirm_delete' | 'confirm_reset'>('menu');

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setConfirmStep('menu');
          onClose();
        }
      }}
    >
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3>Kelola &amp; Privasi Data Akun</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => {
              setConfirmStep('menu');
              onClose();
            }}
          >
            &times;
          </button>
        </div>

        {confirmStep === 'menu' ? (
          <div>
            <p style={{ fontSize: '12.5px', color: '#4b5563', lineHeight: '1.5', marginBottom: '16px' }}>
              Data kesehatan mental dan agenda diproses secara aman di perangkat lokal Anda. Pilih tindakan manajemen data di bawah ini:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                    Reset Preferensi Ritme &amp; Notifikasi
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Kembalikan preferensi jam tidur, kronotipe, dan notifikasi ke bawaan.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmStep('confirm_reset')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #fee2e2',
                  background: '#fef2f2',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>
                    Hapus Cache &amp; Riwayat Sesi Lokal
                  </div>
                  <div style={{ fontSize: '11px', color: '#b91c1c' }}>
                    Bersihkan riwayat fokus, sesi aktif, dan cache tersimpan.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmStep('confirm_delete')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setConfirmStep('menu');
                  onClose();
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        ) : confirmStep === 'confirm_reset' ? (
          <div>
            <div style={{ textAlign: 'center', padding: '10px 0 16px 0' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔄</span>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#b45309' }}>
                Reset Preferensi ke Bawaan?
              </h4>
              <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>
                Pengaturan target jam tidur, bangun, dan preferensi notifikasi akan dikembalikan ke setelan awal. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setConfirmStep('menu')}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetPreferences();
                  setConfirmStep('menu');
                  onClose();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#d97706',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ya, Reset Preferensi
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', padding: '10px 0 16px 0' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>⚠️</span>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#991b1b' }}>
                Konfirmasi Penghapusan Cache Lokal
              </h4>
              <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>
                Apakah Anda yakin ingin menghapus cache lokal browser? Data fokus sesi sementara akan di-reset dan halaman akan dimuat ulang.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setConfirmStep('menu')}
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearLocalData();
                  setConfirmStep('menu');
                  onClose();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
