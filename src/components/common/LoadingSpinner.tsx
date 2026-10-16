import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  color?: 'primary' | 'white' | 'muted' | 'accent' | string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label,
  className = '',
  style,
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'xs'
      ? 14
      : size === 'sm'
      ? 18
      : size === 'lg'
      ? 36
      : 24;

  const strokeColor =
    color === 'primary'
      ? 'var(--color-primary-green, #0a5445)'
      : color === 'white'
      ? '#ffffff'
      : color === 'muted'
      ? 'var(--color-nav-muted, #6b6a65)'
      : color === 'accent'
      ? 'var(--color-logo-green, #0b7656)'
      : color;

  return (
    <div
      className={`napas-spinner-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: label ? '8px' : '0',
        ...style,
      }}
      role="status"
      aria-live="polite"
    >
      <svg
        className="napas-spinner-svg"
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'napasSpin 0.85s linear infinite',
          flexShrink: 0,
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={strokeColor}
          strokeWidth="3"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="napas-spinner-label">{label}</span>}
    </div>
  );
};
