import React from 'react';

interface RefleksiHariIniCardProps {
  tag?: string;
  question?: string;
  savedText?: string;
  actionText?: string;
  onOpenReflection: () => void;
}

export const RefleksiHariIniCard: React.FC<RefleksiHariIniCardProps> = ({
  tag = 'REFLEKSI HARI INI',
  question = 'Hal baik apa yang ingin kamu ulang besok?',
  savedText,
  actionText,
  onOpenReflection,
}) => {
  const buttonLabel = actionText || (savedText ? 'Ubah refleksi ✏️' : 'Tulis refleksi →');

  return (
    <div
      className="laporan-card laporan-card-refleksi"
      onClick={onOpenReflection}
      style={{ cursor: 'pointer' }}
    >
      <span className="refleksi-tag">{tag}</span>
      <h3 className="refleksi-question">{question}</h3>
      {savedText && (
        <div
          style={{
            margin: '8px 0 12px 0',
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: '8px',
            fontSize: '12.5px',
            color: '#064e3b',
            fontStyle: 'italic',
            lineHeight: '1.4',
            borderLeft: '3px solid #059669',
          }}
        >
          "{savedText}"
        </div>
      )}
      <button
        type="button"
        className="refleksi-action-btn"
        onClick={(e) => {
          e.stopPropagation();
          onOpenReflection();
        }}
      >
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
};
