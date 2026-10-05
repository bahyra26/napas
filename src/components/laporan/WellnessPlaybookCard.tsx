import React from 'react';
import { WellnessPlaybookItem } from '../../types';

interface WellnessPlaybookCardProps {
  items: WellnessPlaybookItem[];
  advisoryText: string;
  onActionClick?: (item: WellnessPlaybookItem) => void;
}

export const WellnessPlaybookCard: React.FC<WellnessPlaybookCardProps> = ({
  items,
  advisoryText,
  onActionClick,
}) => {
  return (
    <div className="laporan-card laporan-card-playbook">
      {/* Header Row */}
      <div className="playbook-header-row">
        <div className="playbook-header-left">
          <h2 className="playbook-title">Wellness Playbook</h2>
          <p className="playbook-subtitle">
            Langkah kecil yang bisa kamu mulai hari ini.
          </p>
        </div>

        <div className="playbook-badge-warning">
          <span className="warning-dot"></span>
          <span>Perlu perhatian</span>
        </div>
      </div>

      {/* List of 3 Playbook Items */}
      <div className="playbook-list">
        {items.map((item) => (
          <div key={item.id} className="playbook-item">
            {/* Step Number Circle */}
            <div
              className={`playbook-num-circle ${item.isPrimary ? 'primary' : 'secondary'}`}
            >
              {item.stepNumber}
            </div>

            {/* Step Info */}
            <div className="playbook-item-content">
              <h3 className="playbook-item-title">{item.title}</h3>
              <p className="playbook-item-desc">{item.description}</p>
            </div>

            {/* Step Action Button */}
            <button
              type="button"
              className={`playbook-action-btn ${item.isPrimary ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onActionClick?.(item)}
            >
              {item.actionLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Advisory Callout Box */}
      <div className="playbook-advisory-box">
        <span>{advisoryText}</span>
      </div>
    </div>
  );
};
