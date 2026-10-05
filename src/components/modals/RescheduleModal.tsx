import React from 'react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReschedule: (targetDay: string) => void;
  availableDays?: Array<{ day: string; badge: string }>;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirmReschedule,
  availableDays,
}) => {
  if (!isOpen) return null;

  const recommendations = availableDays && availableDays.length > 0
    ? availableDays
    : [
        { day: 'Rabu, 18 September', badge: 'Bebas Tugas · Optimal' },
        { day: 'Sabtu, 21 September', badge: 'Bebas Tugas · Akhir Pekan' },
        { day: 'Kamis, 26 September', badge: 'Bebas Tugas' },
      ];

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
          Hari ini memiliki beban tinggi (<strong>Load Score 78/100</strong>). Pindahkan salah satu agenda ke hari yang masih berstatus <strong>Bebas</strong> untuk menurunkan tingkat stres:
        </p>
        <div className="reschedule-recommendations">
          {recommendations.map((rec) => (
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
