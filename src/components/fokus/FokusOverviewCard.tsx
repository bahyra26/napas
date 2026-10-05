import React from 'react';
import { FocusOverviewData } from '../../types';

interface FokusOverviewCardProps {
  data: FocusOverviewData;
  onRefresh?: () => void;
}

export const FokusOverviewCard: React.FC<FokusOverviewCardProps> = ({
  data,
  onRefresh,
}) => {
  // SVG Donut calculation
  // Radius = 50, Circumference = 2 * PI * 50 = ~314.16
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // 314.16
  
  // 78% fokus, 22% distraksi
  // Small 4px visual gap between arcs for sleek dashboard look
  const gap = 4;
  const focusLength = (circumference - gap * 2) * (data.focusPercent / 100);
  const distractLength = (circumference - gap * 2) * (data.distractPercent / 100);

  return (
    <div className="fokus-card fokus-card-overview">
      <div className="fokus-overview-main">
        {/* Donut Chart */}
        <div className="fokus-donut-wrapper">
          <svg
            className="fokus-donut-svg"
            viewBox="0 0 130 130"
            width="128"
            height="128"
          >
            {/* Background track */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="#e2ebe6"
              strokeWidth="14"
            />
            {/* Distraction Arc (Orange) on right side */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="#df7826"
              strokeWidth="14"
              strokeDasharray={`${distractLength} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(66 65 65)"
              className="donut-segment-distract"
            />
            {/* Focus Arc (Green) spanning the rest */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="#0b845d"
              strokeWidth="14"
              strokeDasharray={`${focusLength} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(152 65 65)"
              className="donut-segment-focus"
            />
          </svg>

          {/* Donut Center Label */}
          <div className="fokus-donut-center" onClick={onRefresh} title="Skor Fokus">
            <span className="fokus-donut-percent">{data.focusPercent}%</span>
            <span className="fokus-donut-subtext">fokus</span>
          </div>
        </div>

        {/* Stats on the right of donut */}
        <div className="fokus-stats-col">
          <h3 className="fokus-stats-title">Hari Ini</h3>

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
