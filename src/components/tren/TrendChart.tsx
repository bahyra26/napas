import React, { useState } from 'react';
import { TREND_POINTS } from '../../data/mockData';
import { TrendPoint } from '../../types';

const Y_AXIS_LEVELS = [
  { label: '100%', y: 30 },
  { label: '80%',  y: 70 },
  { label: '60%',  y: 110 },
  { label: '40%',  y: 150 },
  { label: '20%',  y: 190 },
  { label: '0%',   y: 230 },
];

export const TrendChart: React.FC = () => {
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

  const handlePointInteraction = (point: TrendPoint) => {
    // Calculate exact percentage position from SVG viewBox (770 x 260)
    // This is 100% immune to CSS body zoom (1.25x), devicePixelRatio, and resizing
    const xPercent = (point.cx / 770) * 100;
    const yPercent = (point.cy / 260) * 100;

    // Shift alignment inward for edge points so tooltip never overflows card edges
    let alignMode: 'center' | 'left' | 'right' = 'center';
    if (point.day >= 9 || point.cx > 450) {
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

  // Build the polyline path string dynamically from TREND_POINTS
  const polylinePath = TREND_POINTS.map(
    (p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`
  ).join(' ');

  const interventionPoint =
    TREND_POINTS.find((p) => p.isIntervention) || TREND_POINTS[10];

  return (
    <div className="tren-card card-chart-14d">
      <div className="chart-header-row">
        <h2 className="chart-subtitle">14 Hari Terakhir</h2>
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

          {/* Intervention Marker at Day 11 */}
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

          {/* Hover highlight circle (appears only on hover) */}
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

          {/* Transparent Hit Areas for smooth hover & click interactions */}
          <g className="chart-hit-areas">
            {TREND_POINTS.map((point) => (
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

      {/* Warning Pill at bottom-left */}
      <div className="chart-alert-pill">
        <svg className="alert-pill-icon" viewBox="0 0 24 24" fill="#111111">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
        <span>4 hari beruntun naik — tren memburuk</span>
      </div>
    </div>
  );
};
