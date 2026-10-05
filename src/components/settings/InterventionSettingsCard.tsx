import React from 'react';
import { InterventionSettingItem } from '../../types';

interface InterventionSettingsCardProps {
  settings: InterventionSettingItem[];
  thresholdMinutes: number;
  onToggleSetting: (id: string) => void;
  onEditThreshold: () => void;
}

export const InterventionSettingsCard: React.FC<InterventionSettingsCardProps> = ({
  settings,
  thresholdMinutes,
  onToggleSetting,
  onEditThreshold,
}) => {
  return (
    <div className="settings-card settings-card-intervention">
      {/* Header */}
      <div className="settings-card-header">
        <h2 className="settings-card-title">Intervensi & Fokus</h2>
        <p className="settings-card-subtitle">
          Atur dukungan yang ingin kamu terima.
        </p>
      </div>

      {/* Switches List */}
      <div className="intervention-list">
        {settings.map((item) => (
          <div key={item.id} className="intervention-item">
            <div className="intervention-item-texts">
              <h3 className="intervention-title">{item.title}</h3>
              <p className="intervention-desc">{item.description}</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={item.enabled}
              className={`settings-toggle-switch ${item.enabled ? 'active' : ''}`}
              onClick={() => onToggleSetting(item.id)}
              aria-label={`Alihkan ${item.title}`}
            >
              <span className="toggle-switch-thumb"></span>
            </button>
          </div>
        ))}
      </div>

      {/* Distraction Limit Banner */}
      <div className="distraction-limit-banner">
        <span>Batas distraksi: {thresholdMinutes} menit · </span>
        <button
          type="button"
          className="distraction-edit-link"
          onClick={onEditThreshold}
        >
          Ubah
        </button>
      </div>
    </div>
  );
};
