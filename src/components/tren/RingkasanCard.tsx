import React, { useEffect, useState } from 'react';
import { api, getStoredUserId } from '../../services/api';

export const RingkasanCard: React.FC = () => {
  const [avgScore, setAvgScore] = useState<number>(0);
  const [greenDays, setGreenDays] = useState<number>(0);
  const [orangeRedDays, setOrangeRedDays] = useState<number>(0);
  const [checkInCount, setCheckInCount] = useState<number>(0);

  useEffect(() => {
    async function loadStats() {
      const userId = getStoredUserId();
      if (!userId) return;

      const [history, checkIns] = await Promise.all([
        api.getIndexHistory(userId, 14),
        api.getCheckIns(userId, 14),
      ]);

      if (history && history.length > 0) {
        const scores = history.map((h) => Number(h.index));
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        setAvgScore(avg);

        const green = history.filter((h) => h.zona === 'hijau').length;
        const orangeRed = history.filter((h) => h.zona === 'oranye' || h.zona === 'merah').length;
        setGreenDays(green);
        setOrangeRedDays(orangeRed);
      } else {
        setAvgScore(0);
        setGreenDays(0);
        setOrangeRedDays(0);
      }

      if (checkIns && Array.isArray(checkIns)) {
        setCheckInCount(checkIns.length);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="tren-card card-ringkasan">
      <h2 className="tren-card-title">Ringkasan Evaluasi</h2>
      <div className="ringkasan-items">
        <div className="ringkasan-stat">
          <span className="stat-value color-amber" id="statAvgScore">
            {avgScore}%
          </span>
          <span className="stat-label">Rata-rata skor 14 hari</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-green">{greenDays} hari</span>
          <span className="stat-label">Hari zona hijau (prima)</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-orange">{orangeRedDays} hari</span>
          <span className="stat-label">Hari zona beban tinggi</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-dark">{checkInCount} hari</span>
          <span className="stat-label">Check-in harian aktif</span>
        </div>
      </div>
    </div>
  );
};
