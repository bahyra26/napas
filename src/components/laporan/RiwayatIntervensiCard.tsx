import React from 'react';
import { InterventionHistoryItem } from '../../types';

interface RiwayatIntervensiCardProps {
  history: InterventionHistoryItem[];
  onItemClick?: (item: InterventionHistoryItem) => void;
}

export const RiwayatIntervensiCard: React.FC<RiwayatIntervensiCardProps> = ({
  history,
  onItemClick,
}) => {
  return (
    <div className="laporan-card laporan-card-history">
      {/* Header */}
      <div className="history-header">
        <h2 className="history-title">Riwayat Intervensi</h2>
        <span className="history-subtitle">
          {history.length > 0 ? `${history.length} aktivitas tercatat` : 'Belum ada aktivitas'}
        </span>
      </div>

      {/* List */}
      <div className="history-list">
        {history.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 12px',
              color: '#6b7280',
              fontSize: '12px',
            }}
          >
            <span style={{ fontSize: '22px', display: 'block', marginBottom: '6px' }}>🌱</span>
            <span>Belum ada intervensi minggu ini. Jalankan latihan napas atau playbook saat butuh jeda.</span>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="history-item"
              onClick={() => onItemClick?.(item)}
              title={`${item.title} (${item.status}) - ${item.time}`}
            >
              <div className="history-item-left">
                {/* Radio outline indicator */}
                <div className={`history-radio-icon ${item.isCompleted ? 'completed' : 'skipped'}`}>
                  <span className="radio-inner-dot"></span>
                </div>

                <div className="history-item-texts">
                  <span className="history-item-title">{item.title}</span>
                  <span className={`history-item-status ${item.isCompleted ? 'completed' : 'skipped'}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="history-item-time">{item.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
