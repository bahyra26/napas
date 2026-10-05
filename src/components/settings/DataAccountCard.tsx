import React from 'react';
import { UserProfileInfo } from '../../types';
import { getTodayTimeString } from '../../utils/dateUtils';

interface DataAccountCardProps {
  user: UserProfileInfo;
  lastUpdated?: string;
  onExportData: () => void;
  onManageData: () => void;
  onManageProfile: () => void;
}

export const DataAccountCard: React.FC<DataAccountCardProps> = ({
  user,
  lastUpdated = getTodayTimeString(),
  onExportData,
  onManageData,
  onManageProfile,
}) => {
  return (
    <div className="settings-card settings-card-data-account">
      {/* Left Area: Data Controls */}
      <div className="data-account-left">
        <div className="settings-card-header">
          <h2 className="settings-card-title">Data & Akun</h2>
          <p className="settings-card-subtitle">
            Bawa atau hapus datamu kapan pun kamu butuhkan.
          </p>
        </div>

        <div className="data-actions-row">
          <button
            type="button"
            className="btn-export-data"
            onClick={onExportData}
            title="Unduh rekap data kesehatan mental dan fokus"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Ekspor data saya</span>
          </button>

          <button
            type="button"
            className="btn-manage-data"
            onClick={onManageData}
          >
            <span>Kelola / hapus data</span>
          </button>
        </div>

        <div className="data-timestamp-text">
          <span>Terakhir diperbarui: {lastUpdated}</span>
        </div>
      </div>

      {/* Right Area: Account Profile */}
      <div className="data-account-right">
        <span className="account-tag">AKUN</span>
        <h3 className="account-user-name">{user.name}</h3>
        <button
          type="button"
          className="account-manage-link"
          onClick={onManageProfile}
        >
          <span>Kelola profil →</span>
        </button>
      </div>
    </div>
  );
};
