import React from 'react';
import { FocusTopDistractor } from '../../types';

interface TopPencuriWaktuCardProps {
  distractors: FocusTopDistractor[];
  onItemClick?: (item: FocusTopDistractor) => void;
}

export const TopPencuriWaktuCard: React.FC<TopPencuriWaktuCardProps> = ({
  distractors,
  onItemClick,
}) => {
  return (
    <div className="fokus-card fokus-card-pencuri">
      {/* Card Header */}
      <div className="fokus-card-header">
        <div className="fokus-header-title-wrap">
          <svg
            className="fokus-clock-history-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
            <path d="M3.05 11a9 9 0 0 1 .5-2"></path>
          </svg>
          <h2 className="fokus-card-title">Top 5 Pencuri Waktu</h2>
        </div>
      </div>

      {/* Distraction List */}
      {distractors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: '#666', fontSize: '12px' }}>
          <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>✨</span>
          <span>Belum ada aplikasi/website distraksi tercatat. Bagus! Pertahankan fokus belajarmu.</span>
        </div>
      ) : (
        <div className="pencuri-list">
          {distractors.map((item) => (
            <div
              key={item.id}
              className="pencuri-item"
              onClick={() => onItemClick?.(item)}
              title={`${item.name}: ${item.durationLabel}`}
            >
              <div className="pencuri-item-info">
                <span className="pencuri-item-name">{item.name}</span>
                <span className="pencuri-item-duration">{item.durationLabel}</span>
              </div>

              <div className="pencuri-progress-track">
                <div
                  className="pencuri-progress-fill"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
