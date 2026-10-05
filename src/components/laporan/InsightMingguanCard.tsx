import React from 'react';
import { WeeklyInsightData } from '../../types';

interface InsightMingguanCardProps {
  data: WeeklyInsightData;
  onScoreClick?: () => void;
}

export const InsightMingguanCard: React.FC<InsightMingguanCardProps> = ({
  data,
  onScoreClick,
}) => {
  return (
    <div className="laporan-card laporan-card-insight">
      {/* Top Header Badge */}
      <div className="insight-badge">
        <span className="insight-diamond">✦</span>
        <span className="insight-badge-text">INSIGHT MINGGUAN</span>
      </div>

      {/* Main Content Area */}
      <div className="insight-main-content">
        <div className="insight-text-area">
          <h2 className="insight-title">{data.title}</h2>
          <p className="insight-description">{data.description}</p>
        </div>

        {/* Right Score Pill */}
        <div
          className="insight-score-box"
          onClick={onScoreClick}
          title="Klik untuk melihat detail skor"
        >
          <span className="insight-score-label">Kondisi minggu ini</span>
          <span className="insight-score-val">{data.weeklyScore}</span>
          <span className="insight-score-zone">{data.zoneName}</span>
        </div>
      </div>

      {/* Bottom Motivational Banner */}
      <div className="insight-bottom-banner">
        <svg
          className="insight-arrow-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
        <span className="insight-banner-text">{data.note}</span>
      </div>
    </div>
  );
};
