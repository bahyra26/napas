import React, { useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'warning',
  icon,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const defaultIcon =
    variant === 'danger' ? '🗑️' : variant === 'warning' ? '⚠️' : '✨';

  return (
    <div
      className="modal-overlay open confirm-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmModalTitle"
    >
      <div className={`modal-card confirm-modal-card variant-${variant}`}>
        {/* Accent Icon Badge */}
        <div className={`confirm-icon-badge variant-${variant}`}>
          {icon || defaultIcon}
        </div>

        {/* Content */}
        <div className="confirm-modal-body">
          <h3 id="confirmModalTitle" className="confirm-modal-title">
            {title}
          </h3>
          <div className="confirm-modal-message">{message}</div>
        </div>

        {/* Action Buttons */}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn-confirm-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-confirm-action variant-${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="confirm-btn-loading">
                <LoadingSpinner size="sm" color="white" />
                <span>Memproses...</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
