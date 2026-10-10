import React, { useState } from 'react';
import { FocusDailyBar } from '../../types';

interface FokusVsDistraksiChartProps {
  data: FocusDailyBar[];
  selectedRange?: string;
  selectedPeriod?: string;
  onSelectPeriod?: (range: string, period: string) => void;
  onSelectDay?: (bar: FocusDailyBar) => void;
}

export const FokusVsDistraksiChart: React.FC<FokusVsDistraksiChartProps> = ({
  data,
  selectedRange = '7 hari terakhir',
  selectedPeriod = '7days',
  onSelectPeriod,
  onSelectDay,
}) => {
  const [hoveredBar, setHoveredBar] = useState<FocusDailyBar | null>(null);

  const getDynamicTitle = () => {
    if (selectedRange?.toLowerCase().includes('tahun') || selectedPeriod === 'year') {
      return `Fokus vs Distraksi — Tahun Ini (${new Date().getFullYear()})`;
    }
    if (selectedRange?.toLowerCase().includes('bulan') || selectedPeriod === 'month') {
      const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return `Fokus vs Distraksi — Bulan Ini (${monthName})`;
    }
    if (selectedRange?.includes('14') || selectedPeriod === '14days') {
      return 'Fokus vs Distraksi — 14 Hari Terakhir';
    }
    return 'Fokus vs Distraksi — 7 Hari Terakhir';
  };

  const periodOptions = [
    { label: '7 Hari', range: '7 hari terakhir', period: '7days' },
    { label: '14 Hari', range: '14 hari terakhir', period: '14days' },
    { label: 'Bulan Ini', range: 'Bulan ini', period: 'month' },
    { label: 'Tahun Ini', range: 'Tahun ini', period: 'year' },
  ];

  return (
    <div className="fokus-card fokus-card-chart">
      {/* Chart Top Header: Judul Dinamis + Tab Switcher + Legend */}
      <div className="chart-header-row">
        <div className="chart-title-group">
          <h2 className="fokus-card-title">{getDynamicTitle()}</h2>
          <span className="chart-period-caption">
            {selectedPeriod === 'year'
              ? 'Agregasi performa per bulan di tahun ini'
              : selectedPeriod === 'month'
              ? 'Performa per minggu sepanjang bulan ini'
              : 'Perbandingan rasio fokus vs distraksi harian'}
          </span>
        </div>

        <div className="chart-header-controls">
          {/* Quick Period Buttons on Chart Header */}
          {onSelectPeriod && (
            <div className="chart-period-tabs" role="tablist">
              {periodOptions.map((opt) => {
                const isActive =
                  selectedPeriod === opt.period ||
                  selectedRange === opt.range ||
                  selectedRange.toLowerCase().includes(opt.label.toLowerCase());
                return (
                  <button
                    key={opt.period}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`chart-period-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectPeriod(opt.range, opt.period)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend Dot */}
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
            // Calculate proportional bar height (capped at 165px for ~8 hrs max or highest relative)
            const barHeightPx = Math.max(16, Math.min(165, Math.round((bar.totalHoursNum / 8.0) * 165)));

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
                {(() => {
                  const parts = (bar.dayShort || '').trim().split(' ');
                  const dayName = parts[0] || '';
                  const dayDate = parts.slice(1).join(' ');
                  if (dayDate) {
                    return (
                      <div className="chart-bar-day-wrapper">
                        <span className="chart-bar-day-name">{dayName}</span>
                        <span className="chart-bar-day-date">{dayDate}</span>
                      </div>
                    );
                  }
                  return <div className="chart-bar-day">{bar.dayShort}</div>;
                })()}
                <div className="chart-bar-duration">{bar.totalDuration}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
