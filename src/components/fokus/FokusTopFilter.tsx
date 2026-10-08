import React, { useState, useRef, useEffect } from 'react';
import { getTodayDateString } from '../../utils/dateUtils';

interface FokusTopFilterProps {
  currentDate?: string;
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export const FokusTopFilter: React.FC<FokusTopFilterProps> = ({
  currentDate = getTodayDateString(),
  selectedRange,
  onRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rangeOptions = [
    '7 hari terakhir',
    '14 hari terakhir',
    '30 hari terakhir',
    'Bulan ini',
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fokus-top-bar">
      <div className="fokus-date-badge">
        <svg
          className="fokus-cal-icon"
          width="18"
          height="18"
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

      <div className="fokus-filter-dropdown-wrapper" ref={dropdownRef}>
        <button
          type="button"
          className="fokus-filter-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Pilih rentang waktu statistik"
          title="Ubah rentang waktu data statistik di bawah"
        >
          <span>Rentang: <strong>{selectedRange}</strong></span>
          <svg
            className={`fokus-chevron-icon ${isOpen ? 'open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {isOpen && (
          <div className="fokus-filter-menu">
            {rangeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`fokus-filter-option ${selectedRange === opt ? 'active' : ''}`}
                onClick={() => {
                  onRangeChange(opt);
                  setIsOpen(false);
                }}
              >
                <span>{opt}</span>
                {selectedRange === opt && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
