import React from 'react';

interface GaugeCircleProps {
  score?: number;
  trendText?: string;
  zonaLabel?: string;
  onRefresh?: () => void;
}

export const GaugeCircle: React.FC<GaugeCircleProps> = ({
  score = 18,
  trendText = '17 dari kemarin',
  zonaLabel = 'Hijau',
  onRefresh,
}) => {
  const getZoneClass = () => {
    const zl = (zonaLabel || '').toLowerCase();
    if (zl.includes('merah') || score >= 80) return 'zone-red';
    if (zl.includes('oranye') || score >= 60) return 'zone-orange';
    if (zl.includes('kuning') || score >= 30) return 'zone-yellow';
    return 'zone-green';
  };

  const zoneClass = getZoneClass();

  return (
    <div className="gauge-wrapper">
      <div
        className={`gauge-circle ${zoneClass}`}
        id="gaugeCircle"
        title="Klik untuk segarkan skor"
        onClick={onRefresh}
      >
        <span className="gauge-percent" id="gaugeValue">
          {score}%
        </span>
        <span className="gauge-trend">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
          {trendText}
        </span>
      </div>
      <div className="gauge-status">
        <span className="status-label">Zona Waspada: </span>
        <span className={`status-val ${zoneClass}`}>{zonaLabel}</span>
      </div>
    </div>
  );
};
