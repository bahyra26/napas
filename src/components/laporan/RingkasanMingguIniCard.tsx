import React from 'react';
import { WeeklySummaryStat } from '../../types';

interface RingkasanMingguIniCardProps {
  stats: WeeklySummaryStat[];
  onStatClick?: (stat: WeeklySummaryStat) => void;
}

export const RingkasanMingguIniCard: React.FC<RingkasanMingguIniCardProps> = ({
  stats,
  onStatClick,
}) => {
  return (
    <div className="laporan-card laporan-card-summary">
      <h2 className="summary-card-title">Ringkasan Minggu Ini</h2>

      <div className="summary-stats-list">
        {stats.map((stat, idx) => (
          <React.Fragment key={stat.id}>
            <div
              className="summary-stat-row"
              onClick={() => onStatClick?.(stat)}
              title={`${stat.value}: ${stat.label}`}
            >
              <span className={`summary-stat-val color-${stat.colorType}`}>
                {stat.value}
              </span>
              <span className="summary-stat-label">{stat.label}</span>
            </div>
            {idx < stats.length - 1 && <div className="summary-divider" />}
          </React.Fragment>
        ))}
      </div>

      <div className="summary-footer-note">
        <span>Data diringkas secara privat di perangkatmu.</span>
      </div>
    </div>
  );
};
