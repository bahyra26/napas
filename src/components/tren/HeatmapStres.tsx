import React from 'react';
import { HEATMAP_DATA, HEATMAP_HOURS } from '../../data/mockData';

interface HeatmapStresProps {
  onCellInteract: (info: string) => void;
}

export const HeatmapStres: React.FC<HeatmapStresProps> = ({ onCellInteract }) => {
  return (
    <div className="tren-card card-heatmap-wrap">
      <div className="heatmap-col">
        <h2 className="tren-card-title">Heatmap Stres per Jam &amp; Hari</h2>
        <div className="heatmap-matrix-wrapper">
          {/* Column Hour Headers */}
          <div className="heatmap-header-row">
            <span className="hm-corner"></span>
            {HEATMAP_HOURS.map((hr) => (
              <span key={hr} className="hm-th">
                {hr}
              </span>
            ))}
          </div>

          {/* 7 Rows (Sen s/d Min) */}
          <div className="heatmap-rows">
            {HEATMAP_DATA.map((row) => (
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
                Tingkat stres Anda paling tinggi (merah) sering terpantau pada pukul 14:00 - 18:00.
              </p>
            </div>
          </div>
          <div className="ket-point">
            <span className="ket-bullet">•</span>
            <div className="ket-text-block">
              <span className="ket-title">Pola Hari Terberat</span>
              <p className="ket-desc">
                Hari Selasa dan Jumat adalah hari dengan akumulasi stres tertinggi minggu ini.
              </p>
            </div>
          </div>
          <div className="ket-point">
            <span className="ket-bullet">•</span>
            <div className="ket-text-block">
              <span className="ket-title">Saran Singkat</span>
              <p className="ket-desc">
                Pertimbangkan untuk menjadwalkan jeda istirahat pendek atau latihan napas sebelum jam 2 siang.
              </p>
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
