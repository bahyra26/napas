import React from 'react';

interface GaugeCircleProps {
  score?: number;
  trendText?: string;
  zonaLabel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const GaugeCircle: React.FC<GaugeCircleProps> = ({
  score = 18,
  trendText = '17 dari kemarin',
  zonaLabel = 'Hijau',
  onRefresh,
  isRefreshing = false,
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
        className={`gauge-circle ${zoneClass} ${isRefreshing ? 'is-refreshing' : ''}`}
        id="gaugeCircle"
        title={isRefreshing ? 'Sedang memperbarui skor...' : 'Klik untuk segarkan skor'}
        onClick={isRefreshing ? undefined : onRefresh}
      >
        <span className="gauge-percent" id="gaugeValue">
          {isRefreshing ? '...' : `${score}%`}
        </span>
        <span className="gauge-trend">
          <svg
            className={isRefreshing ? 'spinning' : ''}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isRefreshing ? (
              <>
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </>
            ) : (
              <>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </>
            )}
          </svg>
          {isRefreshing ? 'Memperbarui...' : trendText}
        </span>
      </div>
      <div className="gauge-status">
        <span className="status-label">Zona Waspada: </span>
        <span className={`status-val ${zoneClass}`}>{zonaLabel}</span>
      </div>
    </div>
  );
};
