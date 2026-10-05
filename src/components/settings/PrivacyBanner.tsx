import React from 'react';

interface PrivacyBannerProps {
  onLearnMore?: () => void;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ onLearnMore }) => {
  return (
    <div className="settings-privacy-banner" onClick={onLearnMore}>
      <div className="privacy-banner-left">
        <div className="privacy-circle-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0b845d"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="4 4"></path>
          </svg>
        </div>

        <div className="privacy-banner-texts">
          <h2 className="privacy-banner-title">
            Kamu memegang kendali penuh atas datamu
          </h2>
          <p className="privacy-banner-desc">
            Video kamera tidak pernah disimpan atau dikirim. NAPAS hanya memproses sinyal agregat di perangkatmu dan semua sensor memerlukan persetujuan.
          </p>
        </div>
      </div>

      <div className="privacy-badge-pill">
        <span>Privat di perangkat</span>
      </div>
    </div>
  );
};
