import React from 'react';

export const SkeletonBox: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '16px', borderRadius = '6px', className = '', style }) => {
  return (
    <div
      className={`napas-skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const SkeletonCard: React.FC<{
  height?: number | string;
  rows?: number;
  className?: string;
}> = ({ height = 180, rows = 3, className = '' }) => {
  return (
    <div
      className={`napas-skeleton-card ${className}`}
      style={{ minHeight: height }}
    >
      <div className="skeleton-header">
        <SkeletonBox width="45%" height="18px" />
        <SkeletonBox width="20%" height="18px" borderRadius="12px" />
      </div>
      <div className="skeleton-body" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonBox
            key={i}
            width={i === rows - 1 ? '70%' : '100%'}
            height="14px"
          />
        ))}
      </div>
    </div>
  );
};

export const SkeletonMetric: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`napas-skeleton-metric ${className}`} style={{ padding: '16px' }}>
      <SkeletonBox width="50%" height="28px" borderRadius="8px" style={{ marginBottom: '8px' }} />
      <SkeletonBox width="75%" height="14px" />
    </div>
  );
};

export const SkeletonTasks: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="napas-skeleton-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="task-skeleton-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '10px',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          <SkeletonBox width="10px" height="10px" borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonBox width={`${60 + (i % 3) * 15}%`} height="14px" />
            <SkeletonBox width="35%" height="11px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart: React.FC<{ height?: number }> = ({ height = 220 }) => {
  return (
    <div
      className="napas-skeleton-chart"
      style={{
        height,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '20px 10px 10px',
        gap: '8px',
      }}
    >
      {[45, 60, 30, 80, 55, 90, 40, 70, 85, 50, 65, 95, 60, 75].map((h, idx) => (
        <div
          key={idx}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            height: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <SkeletonBox
            width="100%"
            height={`${h}%`}
            borderRadius="4px 4px 0 0"
          />
          <SkeletonBox width="14px" height="8px" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonHeatmap: React.FC = () => {
  return (
    <div className="napas-skeleton-heatmap" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0' }}>
      {[1, 2, 3, 4, 5, 6, 7].map((row) => (
        <div key={row} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <SkeletonBox width="45px" height="14px" />
          <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
              <SkeletonBox key={col} width="100%" height="24px" borderRadius="4px" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonCalendar: React.FC = () => {
  return (
    <div
      className="napas-skeleton-calendar"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        padding: '12px 0',
      }}
    >
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 6px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(0,0,0,0.05)',
            gap: '6px',
          }}
        >
          <SkeletonBox width="24px" height="11px" />
          <SkeletonBox width="22px" height="20px" borderRadius="6px" />
          <SkeletonBox width="36px" height="12px" borderRadius="8px" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonProfile: React.FC = () => {
  return (
    <div className="napas-skeleton-profile" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '24px',
          background: '#ffffff',
          borderRadius: '16px',
        }}
      >
        <SkeletonBox width="64px" height="64px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBox width="200px" height="22px" />
          <SkeletonBox width="280px" height="14px" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <SkeletonCard height={240} rows={4} />
        <SkeletonCard height={240} rows={4} />
      </div>
    </div>
  );
};
