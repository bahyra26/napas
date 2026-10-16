import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../style.css';
import { pwaService } from './services/pwaService';

// Inisialisasi PWA & Service Worker
pwaService.registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
