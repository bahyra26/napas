import React from 'react';
import { getTodayDateString } from '../../utils/dateUtils';

export interface FilterOption {
  label: string;
  value: string;
  period: '7days' | '14days' | 'month' | 'year';
  icon: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { label: '7 Hari', value: '7 hari terakhir', period: '7days', icon: '📅' },
  { label: '14 Hari', value: '14 hari terakhir', period: '14days', icon: '📆' },
  { label: 'Bulan Ini', value: 'Bulan ini', period: 'month', icon: '🗓️' },
  { label: 'Tahun Ini', value: 'Tahun ini', period: 'year', icon: '📊' },
];

interface FokusTopFilterProps {
  currentDate?: string;
  selectedRange: string;
  onRangeChange: (range: string, period?: string) => void;
}

export const FokusTopFilter: React.FC<FokusTopFilterProps> = ({
  currentDate = getTodayDateString(),
  selectedRange,
  onRangeChange,
}) => {
  return (
    <div className="fokus-top-bar">
      <div className="fokus-date-badge">
        <svg
          className="fokus-cal-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span className="fokus-date-text">{currentDate}</span>
      </div>

      {/* Segmented Control Tabs (7 Hari, 14 Hari, Bulan Ini, Tahun Ini) */}
      <div className="fokus-segmented-tabs" role="tablist" aria-label="Filter rentang statistik">
        {FILTER_OPTIONS.map((opt) => {
          const isActive =
            selectedRange === opt.value ||
            selectedRange.toLowerCase().includes(opt.label.toLowerCase());
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`fokus-seg-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onRangeChange(opt.value, opt.period)}
              title={`Tampilkan statistik ${opt.label}`}
            >
              <span className="fokus-seg-icon">{opt.icon}</span>
              <span className="fokus-seg-label">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
