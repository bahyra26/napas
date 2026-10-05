import React from 'react';

interface RefleksiHariIniCardProps {
  tag?: string;
  question?: string;
  actionText?: string;
  onOpenReflection: () => void;
}

export const RefleksiHariIniCard: React.FC<RefleksiHariIniCardProps> = ({
  tag = 'REFLEKSI HARI INI',
  question = 'Hal baik apa yang ingin kamu ulang besok?',
  actionText = 'Tulis refleksi →',
  onOpenReflection,
}) => {
  return (
    <div className="laporan-card laporan-card-refleksi" onClick={onOpenReflection}>
      <span className="refleksi-tag">{tag}</span>
      <h3 className="refleksi-question">{question}</h3>
      <button
        type="button"
        className="refleksi-action-btn"
        onClick={(e) => {
          e.stopPropagation();
          onOpenReflection();
        }}
      >
        <span>{actionText}</span>
      </button>
    </div>
  );
};
