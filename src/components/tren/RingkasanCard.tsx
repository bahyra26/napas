import React, { useEffect, useState } from 'react';
import { api, getStoredUserId } from '../../services/api';

export const RingkasanCard: React.FC = () => {
  const [avgScore, setAvgScore] = useState<number>(33);
  const [greenDays, setGreenDays] = useState<number>(6);
  const [orangeRedDays, setOrangeRedDays] = useState<number>(3);
  const [interventionCount, setInterventionCount] = useState<number>(5);

  useEffect(() => {
    async function loadStats() {
      const userId = getStoredUserId();
      if (!userId) return;

      const [history, interStats] = await Promise.all([
        api.getIndexHistory(userId, 14),
        api.getInterventions(userId, 14),
      ]);

      if (history && history.length > 0) {
        const scores = history.map((h) => Number(h.index));
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        setAvgScore(avg);

        const green = history.filter((h) => h.zona === 'hijau').length;
        const orangeRed = history.filter((h) => h.zona === 'oranye' || h.zona === 'merah').length;
        setGreenDays(green);
        setOrangeRedDays(orangeRed);
      }

      if (interStats) {
        setInterventionCount(interStats.total);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="tren-card card-ringkasan">
      <h2 className="tren-card-title">Ringkasan</h2>
      <div className="ringkasan-items">
        <div className="ringkasan-stat">
          <span className="stat-value color-amber" id="statAvgScore">
            {avgScore}%
          </span>
          <span className="stat-label">Rata-rata skor 14 hari</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-green">{greenDays} hari</span>
          <span className="stat-label">Hari zona hijau</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-orange">{orangeRedDays} hari</span>
          <span className="stat-label">Hari zona oranye/merah</span>
        </div>
        <div className="ringkasan-stat">
          <span className="stat-value color-dark">{interventionCount} kali</span>
          <span className="stat-label">Intervensi terpicu</span>
        </div>
      </div>
    </div>
  );
};
