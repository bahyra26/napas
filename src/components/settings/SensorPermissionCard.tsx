import React from 'react';
import { SensorPermissionItem } from '../../types';

interface SensorPermissionCardProps {
  sensors: SensorPermissionItem[];
  onToggleSensor: (id: string) => void;
}

export const SensorPermissionCard: React.FC<SensorPermissionCardProps> = ({
  sensors,
  onToggleSensor,
}) => {
  const renderIcon = (type: SensorPermissionItem['iconType']) => {
    switch (type) {
      case 'camera':
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
          </svg>
        );
      case 'window':
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8" cy="8" r="1" fill="currentColor"></circle>
          </svg>
        );
      case 'heart':
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings-card settings-card-sensor">
      {/* Header */}
      <div className="settings-card-header">
        <h2 className="settings-card-title">Izin Sensor</h2>
        <p className="settings-card-subtitle">
          Aktifkan hanya yang membuatmu nyaman.
        </p>
      </div>

      {/* Sensor List */}
      <div className="sensor-list">
        {sensors.map((sensor, idx) => (
          <React.Fragment key={sensor.id}>
            <div className="sensor-item">
              <div className="sensor-item-left">
                <div className={`sensor-icon-wrap ${sensor.enabled ? 'active' : ''}`}>
                  {renderIcon(sensor.iconType)}
                </div>

                <div className="sensor-item-texts">
                  <h3 className="sensor-title">{sensor.title}</h3>
                  <p className="sensor-desc">{sensor.description}</p>
                </div>
              </div>

              <div className="sensor-item-right">
                <span className={`sensor-status-label ${sensor.enabled ? 'on' : 'off'}`}>
                  {sensor.enabled ? 'On' : 'Off'}
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={sensor.enabled}
                  className={`settings-toggle-switch ${sensor.enabled ? 'active' : ''}`}
                  onClick={() => onToggleSensor(sensor.id)}
                  aria-label={`Alihkan ${sensor.title}`}
                >
                  <span className="toggle-switch-thumb"></span>
                </button>
              </div>
            </div>
            {idx < sensors.length - 1 && <div className="sensor-divider" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
