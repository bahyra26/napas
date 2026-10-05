import React, { useEffect, useState } from 'react';
import { api, getStoredUserId } from '../../services/api';

export const KesimpulanCard: React.FC = () => {
  const [conclusion, setConclusion] = useState<string>(
    'Kondisi kesejahteraan Anda stabil. Tetap jaga ritme tidur dan ambil jeda singkat di antara waktu belajar.'
  );

  useEffect(() => {
    async function evaluateTrend() {
      const userId = getStoredUserId();
      if (!userId) return;

      const [history, profile] = await Promise.all([
        api.getIndexHistory(userId, 14),
        api.getProfile(userId),
      ]);

      if (history && history.length >= 4) {
        const lastIndex = Number(history[history.length - 1]?.index || 20);
        const prevAvg =
          history.slice(0, -1).reduce((sum, h) => sum + Number(h.index), 0) / (history.length - 1);

        const diff = Math.round(lastIndex - prevAvg);
        const name = profile?.panggilan || 'Anda';
        const bedTime = profile?.jam_tidur || '23.00';

        if (diff >= 8) {
          setConclusion(
            `Kondisi beban mental ${name} meningkat ${diff}% dibandingkan hari-hari sebelumnya. Kami menyarankan untuk memprioritaskan istirahat sebelum pukul ${bedTime} dan mencicil tugas besar dengan Auto-Planner.`
          );
        } else if (diff <= -6) {
          setConclusion(
            `Kabar baik! Kondisi kesejahteraan ${name} membaik ${Math.abs(diff)}% dengan beban akademik yang lebih terkendali. Pertahankan kebiasaan fokus ini!`
          );
        } else {
          setConclusion(
            `Kondisi kesejahteraan ${name} relatif stabil di zona yang aman. Tetap jaga batas layar sebelum pukul ${bedTime} agar kualitas tidur tetap optimal.`
          );
        }
      }
    }

    evaluateTrend();
  }, []);

  return (
    <div className="tren-card card-kesimpulan">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 className="tren-card-title" style={{ margin: 0 }}>Kesimpulan & Rekomendasi</h2>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-print-summary"
          style={{
            background: '#e8f5e9',
            color: '#0b845d',
            border: '1px solid #c8e6c9',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📄 Cetak / Simpan PDF
        </button>
      </div>
      <p className="kesimpulan-paragraph">{conclusion}</p>
    </div>
  );
};
