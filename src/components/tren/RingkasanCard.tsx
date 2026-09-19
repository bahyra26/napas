import React, { useEffect, useState } from 'react';

export const RingkasanCard: React.FC = () => {
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      count += 3;
      if (count >= 33) {
        count = 33;
        clearInterval(timer);
      }
      setAvgScore(count);
    }, 45);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="tren-card card-ringkasan">
      <h2 className="tren-card-title">Ringkasan</h2>
      <div className="ringkasan-items">
        <div className="ringkasan-stat">
          <span className="stat-value color-amber" id="statAvgScore">
            {avgScore}
          </span>
          <span className="stat-label">Rata-rata skor 14 hari</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-green">6 hari</span>
          <span className="stat-label">Hari zona hijau</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-orange">3 hari</span>
          <span className="stat-label">Hari zona oranye/merah</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-dark">5 kali</span>
          <span className="stat-label">Intervensi terpicu</span>
        </div>
      </div>
    </div>
  );
};
