import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../services/api';

interface CircadianRhythmCardProps {
  initialProfile: StudentProfile | null;
  onSaveRhythm: (updated: Partial<StudentProfile>) => Promise<boolean>;
  onNotify: (msg: string, icon?: string) => void;
}

export const CircadianRhythmCard: React.FC<CircadianRhythmCardProps> = ({
  initialProfile,
  onSaveRhythm,
  onNotify,
}) => {
  const [jamTidur, setJamTidur] = useState('23:00');
  const [jamBangun, setJamBangun] = useState('06:00');
  const [kronotipe, setKronotipe] = useState<'pagi' | 'siang' | 'malam'>('pagi');
  const [targetFokusJam, setTargetFokusJam] = useState(4.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setJamTidur((prev) => initialProfile.jam_tidur || prev || '23:00');
      setJamBangun((prev) => initialProfile.jam_bangun || prev || '06:00');
      setKronotipe((prev) => (initialProfile.kronotipe as any) || prev || 'pagi');
      setTargetFokusJam((prev) => initialProfile.target_fokus_jam || prev || 4.0);
    }
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await onSaveRhythm({
      jam_tidur: jamTidur,
      jam_bangun: jamBangun,
      kronotipe,
      target_fokus_jam: Number(targetFokusJam) || 4.0,
    });

    setIsSubmitting(false);
    if (success) {
      onNotify('Preferensi ritme harian berhasil disimpan!', '⏰');
    }
  };

  return (
    <div className="settings-card circadian-card">
      <div className="settings-card-header">
        <div className="card-header-icon-title">
          <div className="card-icon-badge color-amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <h2 className="settings-card-title">Ritme Harian &amp; Jam Fokus</h2>
            <p className="settings-card-subtitle">
              Digunakan oleh algoritma AI untuk menghitung risiko beban &amp; jadwal tidur sehat.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form-grid">
        <div className="form-field-group">
          <label className="field-label" htmlFor="rhythm-sleep">
            Target Jam Tidur Malam
          </label>
          <input
            id="rhythm-sleep"
            type="time"
            className="settings-text-input"
            value={jamTidur}
            onChange={(e) => setJamTidur(e.target.value)}
            required
          />
          <span className="field-hint">Standar rekomendasi: sebelum pukul 23:30</span>
        </div>

        <div className="form-field-group">
          <label className="field-label" htmlFor="rhythm-wake">
            Target Jam Bangun
          </label>
          <input
            id="rhythm-wake"
            type="time"
            className="settings-text-input"
            value={jamBangun}
            onChange={(e) => setJamBangun(e.target.value)}
            required
          />
          <span className="field-hint">Durasi istirahat optimal: 7–8 jam</span>
        </div>

        <div className="form-field-group full-width">
          <label className="field-label">Kronotipe Produktivitas Mahasiswa</label>
          <div className="chronotype-selector">
            <button
              type="button"
              className={`chronotype-pill ${kronotipe === 'pagi' ? 'active' : ''}`}
              onClick={() => setKronotipe('pagi')}
            >
              <span className="chrono-icon">🌅</span>
              <div className="chrono-texts">
                <strong>Pagi (Early Bird)</strong>
                <small>Fokus maksimal pukul 07.00 - 13.00</small>
              </div>
            </button>

            <button
              type="button"
              className={`chronotype-pill ${kronotipe === 'siang' ? 'active' : ''}`}
              onClick={() => setKronotipe('siang')}
            >
              <span className="chrono-icon">☀️</span>
              <div className="chrono-texts">
                <strong>Fleksibel / Siang</strong>
                <small>Fokus konsisten pukul 10.00 - 17.00</small>
              </div>
            </button>

            <button
              type="button"
              className={`chronotype-pill ${kronotipe === 'malam' ? 'active' : ''}`}
              onClick={() => setKronotipe('malam')}
            >
              <span className="chrono-icon">🌙</span>
              <div className="chrono-texts">
                <strong>Malam (Night Owl)</strong>
                <small>Fokus maksimal pukul 19.00 - 23.00</small>
              </div>
            </button>
          </div>
        </div>

        <div className="form-field-group full-width">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="field-label" htmlFor="rhythm-focus-target" style={{ margin: 0 }}>
              Target Waktu Fokus Mandiri per Hari
            </label>
            <span className="focus-hours-badge">{targetFokusJam} Jam / Hari</span>
          </div>
          <input
            id="rhythm-focus-target"
            type="range"
            min="1"
            max="8"
            step="0.5"
            className="settings-range-input"
            value={targetFokusJam}
            onChange={(e) => setTargetFokusJam(parseFloat(e.target.value))}
          />
          <div className="range-labels">
            <span>1 Jam (Ringan)</span>
            <span>4 Jam (Rata-rata Kampus)</span>
            <span>8 Jam (Maksimum)</span>
          </div>
        </div>

        <div className="form-actions-full">
          <button
            type="submit"
            className="btn-settings-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Preferensi Ritme'}
          </button>
        </div>
      </form>
    </div>
  );
};
