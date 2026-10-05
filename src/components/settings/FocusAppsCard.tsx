import React from 'react';

interface FocusAppsCardProps {
  apps: string[];
  onAddApp: () => void;
  onRemoveApp?: (appName: string) => void;
  onManageWhitelist: () => void;
}

export const FocusAppsCard: React.FC<FocusAppsCardProps> = ({
  apps,
  onAddApp,
  onRemoveApp,
  onManageWhitelist,
}) => {
  return (
    <div className="settings-card settings-card-apps">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Aplikasi Fokus</h2>
        <p className="settings-card-subtitle">
          Aplikasi ini tidak dihitung sebagai distraksi.
        </p>
      </div>

      {/* App Pills Row */}
      <div className="focus-apps-pill-row">
        {apps.map((app) => (
          <div key={app} className="focus-app-pill">
            <span className="app-pill-label">{app}</span>
            {onRemoveApp && (
              <button
                type="button"
                className="app-pill-remove-btn"
                onClick={() => onRemoveApp(app)}
                title={`Hapus ${app} dari whitelist`}
              >
                &times;
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className="focus-app-add-pill"
          onClick={onAddApp}
          title="Tambah aplikasi fokus baru"
        >
          <span>+ Tambah</span>
        </button>
      </div>

      {/* Whitelist Link */}
      <div className="focus-apps-footer">
        <button
          type="button"
          className="whitelist-link-btn"
          onClick={onManageWhitelist}
        >
          <span>Whitelist aplikasi →</span>
        </button>
      </div>
    </div>
  );
};
