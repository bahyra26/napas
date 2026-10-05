import React, { useEffect, useState } from 'react';
import { CalendarDay } from '../../types';

interface RingkasanBebanProps {
  days?: CalendarDay[];
}

export const RingkasanBeban: React.FC<RingkasanBebanProps> = ({ days }) => {
  const [totalCount, setTotalCount] = useState(0);

  const targetTotal = days
    ? days.reduce((sum, d) => sum + d.tasks.length, 0)
    : 19;

  const heavyDaysCount = days
    ? days.filter((d) => d.status === 'Berat').length
    : 3;

  const busiestDay = days && days.length > 0
    ? days.reduce((max, d) => (d.load > max.load ? d : max), days[0])
    : null;

  const busiestDayLabel = busiestDay
    ? `${busiestDay.dayNum} ${busiestDay.monthShort || ''}`
    : '24 Sep';

  const freeDaysCount = days
    ? days.filter((d) => d.tasks.length === 0).length
    : 6;

  useEffect(() => {
    let count = 0;
    const maxVal = targetTotal || 19;
    const timer = setInterval(() => {
      count += 2;
      if (count >= maxVal) {
        count = maxVal;
        clearInterval(timer);
      }
      setTotalCount(count);
    }, 50);

    return () => clearInterval(timer);
  }, [targetTotal]);

  return (
    <div className="deadline-card card-ringkasan-beban">
      <h2 className="deadline-card-subtitle">Ringkasan Beban</h2>
      <div className="ringkasan-beban-grid">
        <div className="beban-stat-col">
          <span className="beban-val beban-total" id="bebanTotalCount">
            {totalCount}
          </span>
          <span className="beban-lbl">Total tugas</span>
        </div>
        <div className="beban-stat-col">
          <span className="beban-val beban-red">{heavyDaysCount} hari</span>
          <span className="beban-lbl">Zona berat</span>
        </div>
        <div className="beban-stat-col">
          <span className="beban-val beban-orange">{busiestDayLabel}</span>
          <span className="beban-lbl">Hari terpadat</span>
        </div>
        <div className="beban-stat-col">
          <span className="beban-val beban-green">{freeDaysCount} hari</span>
          <span className="beban-lbl">Tanpa deadline</span>
        </div>
      </div>
    </div>
  );
};

