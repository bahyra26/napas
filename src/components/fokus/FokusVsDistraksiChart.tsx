import React, { useState } from 'react';
import { FocusDailyBar } from '../../types';

interface FokusVsDistraksiChartProps {
  data: FocusDailyBar[];
  onSelectDay?: (bar: FocusDailyBar) => void;
}

export const FokusVsDistraksiChart: React.FC<FokusVsDistraksiChartProps> = ({
  data,
  onSelectDay,
}) => {
  const [hoveredBar, setHoveredBar] = useState<FocusDailyBar | null>(null);

  return (
    <div className="fokus-card fokus-card-chart">
      {/* Chart Top Header & Legend */}
      <div className="chart-header-row">
        <h2 className="fokus-card-title">
          Fokus vs Distraksi — 7 Hari Terakhir
        </h2>

        <div className="fokus-chart-legend">
          <div className="legend-item">
            <span className="legend-dot dot-focus"></span>
            <span className="legend-text">Fokus</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-distract"></span>
            <span className="legend-text">Distraksi</span>
          </div>
        </div>
      </div>

      {/* Chart Columns Area */}
      {data.length === 0 || data.every((b) => b.totalHoursNum === 0) ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', color: '#666', fontSize: '13px' }}>
          <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📊</span>
          <strong>Belum ada rekaman sesi belajar dalam rentang ini.</strong>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
            Mulai sesi fokus di atas untuk merekam grafik perbandingan fokus vs distraksi harianmu.
          </p>
        </div>
      ) : (
        <div className="chart-bars-container">
          {data.map((bar) => {
            // Calculate proportional bar height (capped at 165px for ~8 hrs max)
            const barHeightPx = Math.max(12, Math.round((bar.totalHoursNum / 8.0) * 165));

            return (
              <div
                key={bar.id}
                className={`chart-bar-column ${hoveredBar?.id === bar.id ? 'active' : ''}`}
                onMouseEnter={() => setHoveredBar(bar)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={() => onSelectDay?.(bar)}
              >
                {/* Tooltip on hover */}
                {hoveredBar?.id === bar.id && (
                  <div className="bar-tooltip">
                    <div className="tooltip-header">{bar.dayFull}</div>
                    <div className="tooltip-row">
                      <span className="tt-dot dot-focus"></span>
                      <span>Fokus: <strong>{bar.focusDuration}</strong> ({bar.focusPercent}%)</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tt-dot dot-distract"></span>
                      <span>Distraksi: <strong>{bar.distractDuration}</strong> ({bar.distractPercent}%)</span>
                    </div>
                    <div className="tooltip-footer">
                      Total: <strong>{bar.totalDuration}</strong>
                    </div>
                  </div>
                )}

                {/* Percentage on top of bar */}
                <div className="chart-bar-percent">{bar.focusPercent}%</div>

                {/* Stacked Bar Pill */}
                <div
                  className="chart-stacked-bar"
                  style={{ height: `${barHeightPx}px` }}
                >
                  {/* Top segment: Distraksi (Orange) */}
                  <div
                    className="bar-segment segment-distract"
                    style={{ height: `${bar.distractPercent}%` }}
                    title={`Distraksi: ${bar.distractDuration} (${bar.distractPercent}%)`}
                  />
                  {/* Bottom segment: Fokus (Green) */}
                  <div
                    className="bar-segment segment-focus"
                    style={{ height: `${bar.focusPercent}%` }}
                    title={`Fokus: ${bar.focusDuration} (${bar.focusPercent}%)`}
                  />
                </div>

                {/* Day Label & Total Duration below bar */}
                <div className="chart-bar-day">{bar.dayShort}</div>
                <div className="chart-bar-duration">{bar.totalDuration}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
