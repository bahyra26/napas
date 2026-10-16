import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface InitialScreenLoaderProps {
  message?: string;
  subMessage?: string;
}

export const InitialScreenLoader: React.FC<InitialScreenLoaderProps> = ({
  message = 'Memuat...',
}) => {
  return (
    <div
      className="initial-screen-loader-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-main-bg, #fafaf7)',
        zIndex: 9999999,
        margin: 0,
        padding: 0,
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="initial-screen-loader-content"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          margin: 0,
          padding: 0,
        }}
      >
        <LoadingSpinner size={38} color="primary" />
        <span
          className="initial-screen-loader-text"
          style={{
            fontSize: '0.9rem',
            fontWeight: 500,
            color: 'var(--color-nav-muted, #6b6a65)',
            letterSpacing: '0.3px',
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
};
