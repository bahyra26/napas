import React, { useState } from 'react';

interface KenapaCardProps {
  alasan?: string[];
}

export const KenapaCard: React.FC<KenapaCardProps> = ({ alasan }) => {
  const [expanded, setExpanded] = useState(false);

  const getReasonIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('deadline') || lower.includes('tugas') || lower.includes('beban')) {
      return (
        <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      );
    }
    if (lower.includes('tidur') || lower.includes('malam') || lower.includes('check-in')) {
      return (
        <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      );
    }
    if (lower.includes('distraksi') || lower.includes('layar') || lower.includes('fokus')) {
      return (
        <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      );
    }
    if (lower.includes('kedipan') || lower.includes('alis') || lower.includes('wajah') || lower.includes('visual')) {
      return (
        <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3.2"></circle>
        </svg>
      );
    }
    return (
      <svg className="info-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    );
  };

  const defaultReasons = [
    '1 deadline dalam 7 hari',
    'Tidur cukup 3 hari terakhir',
    'Distraksi 8 menit',
    'Kedipan normal',
  ];

  const items = (alasan && alasan.length > 0) ? alasan : defaultReasons;
  const primaryItems = items.slice(0, 4);
  const extraItems = items.slice(4);

  return (
    <div className="card-kenapa">
      <h2 className="card-title">Kenapa skor ini?</h2>
      <ul className="info-list">
        {primaryItems.map((item, idx) => (
          <li className="info-item" key={idx}>
            {getReasonIcon(item)}
            <span className="info-text">{item}</span>
          </li>
        ))}
      </ul>

      {/* Accordion Extra Details */}
      {extraItems.length > 0 && (
        <div className={`extra-details ${expanded ? 'open' : ''}`} id="extraDetails">
          {extraItems.map((item, idx) => (
            <li className="info-item" key={`extra-${idx}`}>
              {getReasonIcon(item)}
              <span className="info-text">{item}</span>
            </li>
          ))}
        </div>
      )}

      {extraItems.length > 0 && (
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
      )}
    </div>
  );
};
