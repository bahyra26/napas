import React from 'react';
import { CalendarDay } from '../../types';

interface AgendaDetailProps {
  selectedDay: CalendarDay;
  onOpenReschedule: () => void;
}

export const AgendaDetail: React.FC<AgendaDetailProps> = ({
  selectedDay,
  onOpenReschedule,
}) => {
  const getBadgeClass = (status: string) => {
    if (status === 'Berat') return 'badge-berat';
    if (status === 'Sedang') return 'badge-sedang';
    return 'badge-ringan';
  };

  const getLoadAdvice = () => {
    if (selectedDay.status === 'Berat') {
      return {
        text: `Load Score hari ini: ${selectedDay.load}/100 — pertimbangkan reschedule salah satu agenda`,
        className: 'agenda-load-score load-heavy',
      };
    } else if (selectedDay.status === 'Sedang') {
      return {
        text: `Load Score hari ini: ${selectedDay.load}/100 — beban kerja terkendali, jaga ritme istirahat`,
        className: 'agenda-load-score load-medium',
      };
    } else {
      return {
        text: `Load Score hari ini: ${selectedDay.load}/100 — kondisi tenang & minim tekanan`,
        className: 'agenda-load-score load-light',
      };
    }
  };

  const advice = getLoadAdvice();

  return (
    <div className="deadline-col-right">
      <div className="deadline-card card-agenda-detail" id="agendaDetailCard">
        <div className="agenda-header-row">
          <h3 className="agenda-date-title" id="agendaDateTitle">
            {selectedDay.date}
          </h3>
          <span
            className={`agenda-badge-status ${getBadgeClass(selectedDay.status)}`}
            id="agendaBadgeStatus"
          >
            {selectedDay.status}
          </span>
        </div>

        <div className="agenda-tasks-list" id="agendaTasksList">
          {selectedDay.tasks.length === 0 ? (
            <div className="agenda-empty-state">
              <span className="empty-icon">🌿</span>
              <span className="empty-text">
                Tidak ada deadline terjadwal hari ini.
                <br />
                Waktu ideal untuk relaksasi atau mencicil tugas ke depan.
              </span>
            </div>
          ) : (
            selectedDay.tasks.map((task, idx) => (
              <div className="agenda-task-item" key={idx}>
                <div className="agenda-task-info">
                  <span className="agenda-task-name">{task.title}</span>
                  <span className="agenda-task-time">{task.time}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="agenda-advice-box">
          <p className={advice.className} id="agendaLoadScore">
            {advice.text}
          </p>
          <p className="agenda-sub-hint">Klik hari lain di grid untuk lihat detailnya</p>
        </div>

        <button
          type="button"
          className="btn-reschedule"
          id="btnRescheduleAgenda"
          onClick={onOpenReschedule}
        >
          <span>Reschedule salah satu agenda</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      <div className="card-terpadat-alert">
        <svg
          className="terpadat-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span>24 September adalah hari terpadat — mulai cicil dari sekarang</span>
      </div>
    </div>
  );
};
