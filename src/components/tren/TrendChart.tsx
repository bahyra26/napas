import React, { useState, useEffect } from 'react';
import { TREND_POINTS as FALLBACK_POINTS } from '../../data/mockData';
import { TrendPoint } from '../../types';
import { api, getStoredUserId } from '../../services/api';

const Y_AXIS_LEVELS = [
  { label: '100%', y: 30 },
  { label: '80%',  y: 70 },
  { label: '60%',  y: 110 },
  { label: '40%',  y: 150 },
  { label: '20%',  y: 190 },
  { label: '0%',   y: 230 },
];

export const TrendChart: React.FC = () => {
  const [points, setPoints] = useState<TrendPoint[]>(FALLBACK_POINTS);
  const [isTrendAlert, setIsTrendAlert] = useState<boolean>(true);
  const [trendAlertText, setTrendAlertText] = useState<string>('4 hari beruntun naik — tren memburuk');

  const [tooltip, setTooltip] = useState<{
    show: boolean;
    day: number;
    val: string;
    xPercent: number;
    yPercent: number;
    alignMode: 'center' | 'left' | 'right';
  }>({
    show: false,
    day: 0,
    val: '',
    xPercent: 0,
    yPercent: 0,
    alignMode: 'center',
  });

  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(14);

  const loadHistory = async (days: number) => {
    const userId = getStoredUserId();
    if (!userId) return;

    const history = await api.getIndexHistory(userId, days);
    if (history && history.length >= 2) {
      const total = history.length;
      const mappedPoints: TrendPoint[] = history.map((item, idx) => {
        const valNum = Number(item.index) || 0;
        const cx = total > 1 ? 66.0 + (idx / (total - 1)) * (730.0 - 66.0) : 372.5;
        const cy = 230.0 - (Math.min(100, Math.max(0, valNum)) / 100.0) * 200.0;
        return {
          day: idx + 1,
          val: `${valNum}%`,
          percentNum: valNum,
          cx: Number(cx.toFixed(1)),
          cy: Number(cy.toFixed(1)),
          isIntervention: idx === total - 3,
        };
      });
      setPoints(mappedPoints);

      const latest = history[history.length - 1];
      if (latest && latest.trend_flag) {
        setIsTrendAlert(true);
        setTrendAlertText('Index naik beruntun — tren memburuk (+10)');
      } else {
        setIsTrendAlert(false);
        setTrendAlertText('Fluktuasi harian dalam ambang kendali');
      }
    }
  };

  useEffect(() => {
    loadHistory(selectedDays);
  }, [selectedDays]);

  const handlePointInteraction = (point: TrendPoint) => {
    const xPercent = (point.cx / 770) * 100;
    const yPercent = (point.cy / 260) * 100;

    let alignMode: 'center' | 'left' | 'right' = 'center';
    if (point.day >= points.length - 4 || point.cx > 450) {
      alignMode = 'right';
    } else if (point.day <= 3 || point.cx < 190) {
      alignMode = 'left';
    }

    setHoveredPoint(point);
    setTooltip({
      show: true,
      day: point.day,
      val: point.val,
      xPercent,
      yPercent,
      alignMode,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setTooltip((prev) => ({ ...prev, show: false }));
  };

  // Build the polyline path string dynamically from points
  const polylinePath = points.map(
    (p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`
  ).join(' ');

  const interventionPoint =
    points.find((p) => p.isIntervention) || points[Math.max(0, points.length - 3)];

  return (
    <div className="tren-card card-chart-14d">
      <div className="chart-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="chart-subtitle">{selectedDays} Hari Terakhir</h2>
        <div className="chart-range-buttons" style={{ display: 'flex', gap: '6px' }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              className={`btn-range-tab ${selectedDays === d ? 'active' : ''}`}
              onClick={() => setSelectedDays(d)}
              style={{
                background: selectedDays === d ? '#01332a' : '#f0eee6',
                color: selectedDays === d ? '#ffffff' : '#333333',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {d} Hari
            </button>
          ))}
        </div>
      </div>

      <div className="chart-canvas-area" id="trendChartContainer">
        <svg className="trend-svg" viewBox="0 0 770 260" preserveAspectRatio="none">
          {/* Horizontal Gridlines & Y-Axis Labels (0% to 100% by 20%) */}
          <g className="chart-y-axis">
            {Y_AXIS_LEVELS.map((level) => (
              <g key={level.label} className="y-axis-row">
                <text x="50" y={level.y} textAnchor="end" dominantBaseline="central">
                  {level.label}
                </text>
                <line
                  x1="60"
                  y1={level.y}
                  x2="745"
                  y2={level.y}
                  stroke="#dcdad4"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>

          {/* Trend Polyline */}
          <path
            className="trend-polyline"
            d={polylinePath}
            fill="none"
            stroke="#01332a"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Intervention Marker */}
          {interventionPoint && (
            <g className="marker-group" id="interventionMarker">
              <text
                x={interventionPoint.cx}
                y={interventionPoint.cy - 16}
                textAnchor="middle"
                className="marker-label"
              >
                Intervensi
              </text>
              <circle
                cx={interventionPoint.cx}
                cy={interventionPoint.cy}
                r={5}
                className="marker-dot"
                fill="#01332a"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Hover highlight circle */}
          {hoveredPoint && !hoveredPoint.isIntervention && (
            <circle
              cx={hoveredPoint.cx}
              cy={hoveredPoint.cy}
              r={5}
              fill="#01332a"
              stroke="#ffffff"
              strokeWidth="2"
              pointerEvents="none"
            />
          )}

          {/* Transparent Hit Areas */}
          <g className="chart-hit-areas">
            {points.map((point) => (
              <circle
                key={point.day}
                cx={point.cx}
                cy={point.cy}
                r={16}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => handlePointInteraction(point)}
                onClick={() => handlePointInteraction(point)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </g>
        </svg>

        {tooltip.show && (
          <div
            className={`chart-tooltip show align-${tooltip.alignMode}`}
            id="chartTooltip"
            style={{
              left: `${tooltip.xPercent}%`,
              top: `${tooltip.yPercent}%`,
            }}
          >
            <strong>Hari {tooltip.day}</strong>: {tooltip.val}
          </div>
        )}
      </div>

      {/* Alert Pill at bottom-left */}
      <div className="chart-alert-pill">
        <svg className="alert-pill-icon" viewBox="0 0 24 24" fill="#111111">
          {isTrendAlert ? (
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          ) : (
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          )}
        </svg>
        <span>{trendAlertText}</span>
      </div>
    </div>
  );
};
