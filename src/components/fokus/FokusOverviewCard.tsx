import React from 'react';
import { FocusOverviewData } from '../../types';

interface FokusOverviewCardProps {
  data: FocusOverviewData;
  periodLabel?: string;
  onRefresh?: () => void;
}

export const FokusOverviewCard: React.FC<FokusOverviewCardProps> = ({
  data,
  periodLabel = 'Hari Ini',
  onRefresh,
}) => {
  // SVG Donut calculation
  // Radius = 48, Circumference = 2 * PI * 48 = ~301.59
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  
  const focusPct = Math.min(100, Math.max(0, data.focusPercent || 0));
  const distractPct = Math.min(100 - focusPct, Math.max(0, data.distractPercent || 0));

  const focusLength = (focusPct / 100) * circumference;
  const distractLength = (distractPct / 100) * circumference;

  return (
    <div className="fokus-card fokus-card-overview">
      <div className="fokus-overview-main">
        {/* Donut Chart */}
        <div className="fokus-donut-wrapper">
          <svg
            className="fokus-donut-svg"
            viewBox="0 0 120 120"
            width="124"
            height="124"
          >
            {/* Background track (soft emerald/mint, eliminates white broken gap) */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="rgba(11, 132, 93, 0.15)"
              strokeWidth="12"
            />
            {/* Distraction Arc (Orange) - seamlessly fills remaining share */}
            {distractPct > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#df7826"
                strokeWidth="12"
                strokeDasharray={`${distractLength} ${circumference}`}
                strokeDashoffset={-focusLength}
                className="donut-segment-distract"
              />
            )}
            {/* Focus Arc (Emerald Green) - starts at 12 o'clock */}
            {focusPct > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#0b845d"
                strokeWidth="12"
                strokeDasharray={`${focusLength} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap={distractPct > 0 ? 'butt' : 'round'}
                className="donut-segment-focus"
              />
            )}
          </svg>

          {/* Donut Center Label */}
          <div className="fokus-donut-center" onClick={onRefresh} title="Skor Fokus (Klik untuk segarkan)">
            <span className="fokus-donut-percent">{data.focusPercent}%</span>
            <span className="fokus-donut-subtext">fokus</span>
          </div>
        </div>

        {/* Stats on the right of donut */}
        <div className="fokus-stats-col">
          <h3 className="fokus-stats-title">{periodLabel}</h3>

          <div className="fokus-stat-item">
            <div className="fokus-stat-icon-wrap icon-green">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="fokus-stat-details">
              <span className="fokus-stat-time">{data.focusDuration}</span>
              <span className="fokus-stat-label">fokus</span>
            </div>
          </div>

          <div className="fokus-stat-item">
            <div className="fokus-stat-icon-wrap icon-orange">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="fokus-stat-details">
              <span className="fokus-stat-time">{data.distractDuration}</span>
              <span className="fokus-stat-label">distraksi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Banner at bottom */}
      <div className="fokus-motive-banner">
        <span>{data.motivationalNote}</span>
      </div>
    </div>
  );
};
