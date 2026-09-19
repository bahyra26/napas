import React, { useEffect, useState } from 'react';

export const RingkasanBeban: React.FC = () => {
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      count += 2;
      if (count >= 19) {
        count = 19;
        clearInterval(timer);
      }
      setTotalCount(count);
    }, 50);

    return () => clearInterval(timer);
  }, []);

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
          <span className="beban-val beban-red">3 hari</span>
          <span className="beban-lbl">Zona berat</span>
        </div>
        <div className="beban-stat-col">
          <span className="beban-val beban-orange">24 Sep</span>
          <span className="beban-lbl">Hari terpadat</span>
        </div>
        <div className="beban-stat-col">
          <span className="beban-val beban-green">6 hari</span>
          <span className="beban-lbl">Tanpa deadline</span>
        </div>
      </div>
    </div>
  );
};
