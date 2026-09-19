import React from 'react';
import { CalendarDay } from '../../types';

interface CalendarGridProps {
  days: CalendarDay[];
  selectedDate: string;
  onSelectDay: (day: CalendarDay) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  selectedDate,
  onSelectDay,
}) => {
  return (
    <div className="deadline-card card-calendar-grid">
      <div className="calendar-header-row">
        <h2 className="deadline-card-subtitle">14 Hari ke Depan</h2>
        <div className="calendar-legend">
          <span className="clegend-text">Ringan</span>
          <span className="clegend-box cbox-green" title="Bebas tugas"></span>
          <span className="clegend-box cbox-yellow" title="Tugas ringan/sedang"></span>
          <span className="clegend-box cbox-red" title="Tugas berat/padat"></span>
          <span className="clegend-text">Berat</span>
        </div>
      </div>

      <div className="calendar-tiles-grid" id="calendarTilesGrid">
        {days.map((day) => {
          const isSelected = selectedDate === day.date;
          const tileClass =
            day.status === 'Berat'
              ? 'tile-red'
              : day.status === 'Sedang'
              ? 'tile-yellow'
              : 'tile-green';

          const pillClass =
            day.status === 'Berat'
              ? 'pill-red'
              : day.status === 'Sedang'
              ? 'pill-yellow'
              : 'pill-green';

          return (
            <div
              key={day.date}
              className={`day-tile ${tileClass} ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectDay(day)}
            >
              <span className="tile-day">{day.dayName}</span>
              <span className="tile-date">{day.dayNum}</span>
              <span className={`tile-pill ${pillClass}`}>{day.pillText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
