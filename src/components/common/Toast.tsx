import React from 'react';

interface ToastProps {
  visible: boolean;
  message: string;
  icon: string;
}

export const Toast: React.FC<ToastProps> = ({ visible, message, icon }) => {
  return (
    <div className={`toast ${visible ? 'show' : ''}`} id="toastNotification">
      <span className="toast-icon" id="toastIcon">{icon}</span>
      <span className="toast-message" id="toastMessage">{message}</span>
    </div>
  );
};
