import React, { useState, useEffect } from 'react';
import { HEATMAP_DATA as FALLBACK_DATA, HEATMAP_HOURS as FALLBACK_HOURS } from '../../data/mockData';
import { HeatmapRow } from '../../types';
import { api, getStoredUserId } from '../../services/api';

interface HeatmapStresProps {
  onCellInteract: (info: string) => void;
}

export const HeatmapStres: React.FC<HeatmapStresProps> = ({ onCellInteract }) => {
  const [hours, setHours] = useState<string[]>(FALLBACK_HOURS);
  const [rows, setRows] = useState<HeatmapRow[]>(FALLBACK_DATA);
  const [peakHours, setPeakHours] = useState<string>('pukul 14:00 - 18:00');
  const [heaviestDay, setHeaviestDay] = useState<string>(
    'Hari Selasa dan Jumat adalah hari dengan akumulasi stres tertinggi minggu ini.'
  );
  const [advice, setAdvice] = useState<string>(
    'Pertimbangkan untuk menjadwalkan jeda istirahat pendek atau latihan napas sebelum jam 2 siang.'
  );

  useEffect(() => {
    async function loadHeatmap() {
      const userId = getStoredUserId();
      if (!userId) return;

      const data = await api.getHeatmap(userId, 7);
      if (data && data.rows && data.rows.length > 0) {
        setHours(data.hours || FALLBACK_HOURS);
        setRows(data.rows as HeatmapRow[]);
        if (data.peak_stress_hours) {
          setPeakHours(data.peak_stress_hours);
        }
        if (data.heaviest_day) {
          setHeaviestDay(data.heaviest_day);
        }
        if (data.advice) {
          setAdvice(data.advice);
        }
      }
    }

    loadHeatmap();
  }, []);

  return (
    <div className="tren-card card-heatmap-wrap">
      <div className="heatmap-col">
        <h2 className="tren-card-title">Heatmap Stres per Jam &amp; Hari</h2>
        <div className="heatmap-matrix-wrapper">
          {/* Column Hour Headers */}
          <div className="heatmap-header-row">
            <span className="hm-corner"></span>
            {hours.map((hr) => (
              <span key={hr} className="hm-th">
                {hr}
              </span>
            ))}
          </div>

          {/* 7 Rows (Sen s/d Min) */}
          <div className="heatmap-rows">
            {rows.map((row) => (
              <div className="hm-row" key={row.dayName}>
                <span className="hm-day">{row.dayName}</span>
                <div className="hm-cells">
                  {row.cells.map((cell, idx) => (
                    <span
                      key={idx}
                      className={`hm-cell cell-${cell.level}`}
                      data-info={cell.info}
                      title={cell.info}
                      onMouseEnter={() => onCellInteract(cell.info)}
                      onClick={() => onCellInteract(cell.info)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keterangan Column */}
      <div className="keterangan-col">
        <h2 className="tren-card-title">Keterangan</h2>
        <div className="keterangan-list">
          <div className="ket-point">
            <span className="ket-bullet">•</span>
            <div className="ket-text-block">
              <span className="ket-title">Waktu Puncak Stress</span>
              <p className="ket-desc">
                Tingkat stres Anda paling tinggi sering terpantau pada {peakHours}.
              </p>
            </div>
          </div>
          <div className="ket-point">
            <span className="ket-bullet">•</span>
            <div className="ket-text-block">
              <span className="ket-title">Pola Hari Terberat</span>
              <p className="ket-desc">{heaviestDay}</p>
            </div>
          </div>
          <div className="ket-point">
            <span className="ket-bullet">•</span>
            <div className="ket-text-block">
              <span className="ket-title">Saran Singkat</span>
              <p className="ket-desc">{advice}</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span className="legend-text">Ringan</span>
          <span className="legend-box box-green" title="Ringan"></span>
          <span className="legend-box box-peach" title="Sedang"></span>
          <span className="legend-box box-red" title="Berat"></span>
          <span className="legend-text">Berat</span>
        </div>
      </div>
    </div>
  );
};
