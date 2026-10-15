import React, { useState } from 'react';
import { api, getStoredUserId, StudentProfile } from '../../services/api';

interface DataManagementCardProps {
  profile: StudentProfile | null;
  onOpenManageModal: () => void;
  onNotify: (msg: string, icon?: string) => void;
}

export const DataManagementCard: React.FC<DataManagementCardProps> = ({
  profile,
  onOpenManageModal,
  onNotify,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    const userId = getStoredUserId();
    if (!userId) {
      onNotify('ID pengguna tidak ditemukan.', '⚠️');
      return;
    }

    setIsExporting(true);
    try {
      const [history, workloads, checkIns] = await Promise.all([
        api.getIndexHistory(userId, 30),
        api.getWorkloads(userId),
        api.getCheckIns(userId, 30),
      ]);

      const exportPayload = {
        app: 'NAPAS Mental & Focus Assistant',
        version: '2.4.0',
        exportedAt: new Date().toISOString(),
        profile,
        summary: {
          totalWorkloads: workloads.length,
          totalIndexRecords: history.length,
          totalCheckIns: checkIns.length,
        },
        dailyIndexHistory: history,
        workloadItems: workloads,
        checkIns,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `napas-data-${profile?.panggilan || 'mahasiswa'}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onNotify('Rekap data lengkap berhasil diekspor (JSON)!', '📥');
    } catch (err) {
      console.error('Export error:', err);
      onNotify('Gagal mengekspor data.', '❌');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    const userId = getStoredUserId();
    if (!userId) return;

    try {
      const history = await api.getIndexHistory(userId, 30);
      if (!history || history.length === 0) {
        onNotify('Belum ada riwayat data index untuk diekspor ke CSV.', 'ℹ️');
        return;
      }

      const headers = ['Tanggal', 'Skor Burnout (%)', 'Zona', 'Load Score', 'Stress Score', 'Checkin Score'];
      const rows = history.map((h) => [
        h.tanggal,
        h.index,
        h.zona,
        h.load_score ?? 0,
        h.stress_score ?? 0,
        h.checkin_score ?? 0,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `napas-index-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onNotify('Riwayat evaluasi berhasil diekspor (CSV)!', '📊');
    } catch {
      onNotify('Gagal membuat file CSV.', '❌');
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('napas_focus_sessions');
    sessionStorage.clear();
    onNotify('Cache dan riwayat sesi sementara berhasil dibersihkan.', '🧹');
  };

  return (
    <div className="settings-card data-management-card">
      <div className="settings-card-header">
        <div className="card-header-icon-title">
          <div className="card-icon-badge color-dark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <div>
            <h2 className="settings-card-title">Kedaulatan &amp; Manajemen Data</h2>
            <p className="settings-card-subtitle">
              Anda memegang kendali penuh. Unduh, bersihkan cache, atau kelola penyimpanan data Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="data-management-actions">
        <div className="data-export-buttons">
          <button
            type="button"
            className="btn-export-option"
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>{isExporting ? 'Mengekspor...' : 'Ekspor Rekap Lengkap (JSON)'}</span>
          </button>

          <button
            type="button"
            className="btn-export-option secondary"
            onClick={handleExportCSV}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <span>Ekspor Tren Harian (CSV)</span>
          </button>
        </div>

        <div className="data-secondary-actions">
          <button
            type="button"
            className="btn-manage-clean"
            onClick={handleClearCache}
            title="Bersihkan sesi fokus tersimpan dan cache sementara"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Bersihkan Cache Sesi</span>
          </button>

          <button
            type="button"
            className="btn-manage-reset"
            onClick={onOpenManageModal}
          >
            <span>Kelola &amp; Reset Preferensi Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
