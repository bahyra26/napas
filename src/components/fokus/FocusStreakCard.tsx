import React from 'react';
import { FocusStreakDay } from '../../types';

interface FocusStreakCardProps {
  currentStreak: number;
  targetRule: string;
  bestRecord: number;
  days: FocusStreakDay[];
  onStreakClick?: () => void;
}

export const FocusStreakCard: React.FC<FocusStreakCardProps> = ({
  currentStreak,
  targetRule,
  bestRecord,
  days,
  onStreakClick,
}) => {
  return (
    <div className="fokus-card fokus-card-streak">
      {/* Header */}
      <div className="fokus-card-header">
        <div className="fokus-header-title-wrap">
          <span className="streak-fire-emoji" role="img" aria-label="Fire">
            🔥
          </span>
          <h2 className="fokus-card-title">Focus Streak</h2>
        </div>
      </div>

      {/* Main Dark Green Banner */}
      <div
        className="fokus-streak-banner"
        onClick={onStreakClick}
        title="Streak kamu saat ini"
      >
        <div className="streak-badge-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <path d="M12 2c-.8 2.2-2.5 4.1-4 6-1.8 2.2-3 4.7-3 7.5 0 4.1 3.1 7.5 7 7.5s7-3.4 7-7.5c0-1.8-.5-3.5-1.5-4.8-.5-.7-1.3-1.8-1.5-2.2-.4-.9-.5-1.9-.5-2.9 0-.8.2-1.6.5-2.3-1.2.7-2.3 1.7-3 2.9-.6-1.4-.7-2.8-.5-4.2z" />
          </svg>
        </div>
        <div className="streak-banner-text">
          <div className="streak-banner-count">{currentStreak} hari</div>
          <div className="streak-banner-sub">{targetRule}</div>
        </div>
      </div>

      {/* Weekly Tracker Row: S, S, R, K, J, S, M */}
      <div className="streak-days-row">
        {days.map((day, idx) => (
          <div key={idx} className="streak-day-col">
            <span className="streak-day-letter">{day.letter}</span>
            <div
              className={`streak-day-circle ${day.completed ? 'completed' : 'pending'}`}
              title={`${day.dayName}: ${day.completed ? 'Tercapai' : 'Belum selesai'}`}
            >
              {day.completed && (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trophy / Best Record Card */}
      <div className="fokus-record-box">
        <div className="fokus-record-trophy-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0b845d"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34"></path>
            <path d="M6 4h12v7a6 6 0 0 1-12 0V4z"></path>
          </svg>
        </div>
        <div className="fokus-record-text">
          <span className="fokus-record-title">
            Rekor terbaikmu: {bestRecord} hari
          </span>
          <span className="fokus-record-sub">Sedikit lagi!</span>
        </div>
      </div>
    </div>
  );
};
