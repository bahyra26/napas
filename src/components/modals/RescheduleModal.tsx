import React from 'react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReschedule: (targetDay: string) => void;
  availableDays?: Array<{ day: string; badge: string }>;
  currentLoadScore?: number;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirmReschedule,
  availableDays = [],
  currentLoadScore = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay open"
      id="rescheduleModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h3>Rekomendasi Reschedule</h3>
          <button
            type="button"
            className="modal-close-btn"
            id="rescheduleCloseBtn"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#585752', lineHeight: '1.5', marginBottom: '16px' }}>
          {currentLoadScore > 0 ? (
            <>
              Hari ini memiliki <strong>Load Score {currentLoadScore}/100</strong>. Pindahkan salah satu tugas ke hari yang masih berstatus <strong>Bebas</strong>:
            </>
          ) : (
            <>Pindahkan deadline tugas ke hari alternatif yang masih memiliki slot waktu luang:</>
          )}
        </p>

        {availableDays.length === 0 ? (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '20px', display: 'block', marginBottom: '6px' }}>📅</span>
            <span>Tidak ditemukan hari bebas lain dalam rentang 14 hari kalender.</span>
          </div>
        ) : (
          <div className="reschedule-recommendations">
            {availableDays.map((rec) => (
              <div
                key={rec.day}
                className="reschedule-item"
                onClick={() => onConfirmReschedule(rec.day)}
              >
                <div className="reschedule-item-info">
                  <span className="reschedule-item-day">{rec.day}</span>
                  <span className="reschedule-item-badge">{rec.badge}</span>
                </div>
                <button type="button" className="btn-pilih-reschedule">
                  Pindahkan
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '18px' }}>
          <button
            type="button"
            className="btn-cancel"
            id="rescheduleCancelBtn"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
