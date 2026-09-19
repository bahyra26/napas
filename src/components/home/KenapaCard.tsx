import React, { useState } from 'react';

export const KenapaCard: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card-kenapa">
      <h2 className="card-title">Kenapa skor ini?</h2>
      <ul className="info-list">
        <li className="info-item">
          {/* Calendar Icon */}
          <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span className="info-text">1 deadline dalam 7 hari</span>
        </li>
        <li className="info-item">
          {/* Moon Icon */}
          <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <span className="info-text">Tidur cukup 3 hari terakhir</span>
        </li>
        <li className="info-item">
          {/* Monitor Icon */}
          <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span className="info-text">Distraksi 8 menit</span>
        </li>
        <li className="info-item">
          {/* Eye Icon */}
          <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3.2"></circle>
          </svg>
          <span className="info-text">Kedipan normal</span>
        </li>
      </ul>

      {/* Accordion Extra Details */}
      <div className={`extra-details ${expanded ? 'open' : ''}`} id="extraDetails">
        <li className="info-item">
          <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span className="info-text">Aktivitas fisik 45 menit</span>
        </li>
        <li className="info-item">
          <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
          <span className="info-text">Hidrasi tubuh 2.1 Liter</span>
        </li>
      </div>

      <button
        className={`btn-selengkapnya ${expanded ? 'open' : ''}`}
        id="btnSelengkapnya"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <span id="btnSelengkapnyaText">
          {expanded ? 'Lebih sedikit' : 'Selengkapnya'}
        </span>
        <svg
          className="icon-double-chevron"
          viewBox="0 0 16 16"
          fill="none"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4.5l5 4 5-4"></path>
          <path d="M3 8.5l5 4 5-4"></path>
        </svg>
      </button>
    </div>
  );
};
