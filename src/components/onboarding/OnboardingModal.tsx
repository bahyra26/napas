import React, { useState } from 'react';
import { api, StudentProfile } from '../../services/api';

interface OnboardingModalProps {
  isOpen: boolean;
  userId: string;
  initialName?: string;
  onComplete: (profile: StudentProfile) => void;
  onNotify: (message: string, icon?: string) => void;
}

const DEFAULT_SCHEDULE: Array<{ mata_kuliah: string; hari: number; jam_mulai: string; jam_selesai: string; ruang?: string }> = [
  { mata_kuliah: 'Kalkulus 2', hari: 0, jam_mulai: '08:00', jam_selesai: '09:40', ruang: 'R.301' },
  { mata_kuliah: 'Struktur Data & Algoritma', hari: 1, jam_mulai: '10:00', jam_selesai: '11:40', ruang: 'Lab. Komp' },
  { mata_kuliah: 'Basis Data', hari: 2, jam_mulai: '13:00', jam_selesai: '14:40', ruang: 'R.204' },
  { mata_kuliah: 'Jaringan Komputer', hari: 3, jam_mulai: '08:00', jam_selesai: '09:40', ruang: 'Lab. Jarkom' },
  { mata_kuliah: 'Metodologi Penelitian', hari: 4, jam_mulai: '09:00', jam_selesai: '10:40', ruang: 'R.102' },
];

const HARI_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  userId,
  initialName = 'Mahasiswa',
  onComplete,
  onNotify,
}) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Profil
  const [panggilan, setPanggilan] = useState(initialName.split(' ')[0] || 'Dinda');
  const [kampus, setKampus] = useState('Universitas Gadjah Mada');
  const [jurusan, setJurusan] = useState('Ilmu Komputer');
  const [semester, setSemester] = useState(6);

  // Step 2: Ritme
  const [jamTidur, setJamTidur] = useState('23:00');
  const [jamBangun, setJamBangun] = useState('06:00');
  const [kronotipe, setKronotipe] = useState<'pagi' | 'siang' | 'malam'>('pagi');
  const [targetFokusJam, setTargetFokusJam] = useState(4.0);

  // Step 3: Jadwal Kuliah
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULE);
  const [newMatkul, setNewMatkul] = useState('');
  const [newHari, setNewHari] = useState(0);
  const [newJamMulai, setNewJamMulai] = useState('08:00');
  const [newJamSelesai, setNewJamSelesai] = useState('09:40');

  // Step 4: Fokus & Agent
  const [actionChoice, setActionChoice] = useState<'warn_then_close' | 'minimize' | 'close'>('warn_then_close');
  const whitelist = ['Code.exe', 'Notion', 'Docs.google', 'Word', 'Figma'];
  const [blacklist, setBlacklist] = useState(['Discord', 'YouTube', 'Instagram', 'TikTok', 'Steam', 'Mobile Legends']);
  const [newBlacklistApp, setNewBlacklistApp] = useState('');


  if (!isOpen) return null;

  const handleAddSchedule = () => {
    if (!newMatkul.trim()) return;
    setSchedules((prev) => [
      ...prev,
      {
        mata_kuliah: newMatkul.trim(),
        hari: newHari,
        jam_mulai: newJamMulai,
        jam_selesai: newJamSelesai,
      },
    ]);
    setNewMatkul('');
    onNotify('Mata kuliah ditambahkan!', '📅');
  };

  const handleRemoveSchedule = (idx: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddBlacklist = () => {
    if (!newBlacklistApp.trim()) return;
    if (!blacklist.includes(newBlacklistApp.trim())) {
      setBlacklist((prev) => [...prev, newBlacklistApp.trim()]);
    }
    setNewBlacklistApp('');
  };

  const handleRemoveBlacklist = (item: string) => {
    setBlacklist((prev) => prev.filter((b) => b !== item));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    const profilePayload: Partial<StudentProfile> = {
      panggilan,
      kampus,
      jurusan,
      semester,
      jam_tidur: jamTidur,
      jam_bangun: jamBangun,
      kronotipe,
      target_fokus_jam: targetFokusJam,
      focus_whitelist: whitelist,
      focus_blacklist: blacklist,
      agent_action: actionChoice,
      onboarded: true,
    };

    const savedProfile = await api.updateProfile(userId, profilePayload);

    // Simpan jadwal kuliah ke backend
    if (schedules.length > 0) {
      await api.bulkSetClassSchedule(
        userId,
        schedules.map((s) => ({
          user_id: userId,
          mata_kuliah: s.mata_kuliah,
          hari: s.hari,
          jam_mulai: s.jam_mulai,
          jam_selesai: s.jam_selesai,
          ruang: s.ruang,
        }))
      );
    }

    setSubmitting(false);
    onNotify(`Selamat datang, ${panggilan}! Radar burnout-mu siap digunakan.`, '🌿');
    if (savedProfile) {
      onComplete(savedProfile);
    } else {
      onComplete({ ...profilePayload, user_id: userId } as StudentProfile);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal-card">
        {/* Progress Bar */}
        <div className="onboarding-stepper">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`}>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Profil Mahasiswa */}
        {step === 1 && (
          <div className="onboarding-step-content">
            <h2 className="step-title">Hai! Kenalan dulu yuk 👋</h2>
            <p className="step-desc">NAPAS akan menyesuaikan beban akademik dan saran kesejahteraan khusus untukmu.</p>

            <div className="form-group">
              <label>Nama Panggilan</label>
              <input
                type="text"
                className="form-input"
                value={panggilan}
                onChange={(e) => setPanggilan(e.target.value)}
                placeholder="Contoh: Raka / Dinda"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Universitas / Kampus</label>
                <input
                  type="text"
                  className="form-input"
                  value={kampus}
                  onChange={(e) => setKampus(e.target.value)}
                  placeholder="Contoh: Universitas Gadjah Mada"
                />
              </div>
              <div className="form-group">
                <label>Program Studi</label>
                <input
                  type="text"
                  className="form-input"
                  value={jurusan}
                  onChange={(e) => setJurusan(e.target.value)}
                  placeholder="Contoh: Ilmu Komputer"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Semester Saat Ini: {semester}</label>
              <input
                type="range"
                min="1"
                max="12"
                value={semester}
                onChange={(e) => setSemester(parseInt(e.target.value))}
                className="form-range"
              />
            </div>

            <div className="onboarding-actions">
              <div></div>
              <button
                type="button"
                className="btn-next"
                onClick={() => setStep(2)}
                disabled={!panggilan.trim()}
              >
                Lanjut: Ritme Belajarmu →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Ritme Harian */}
        {step === 2 && (
          <div className="onboarding-step-content">
            <h2 className="step-title">Ritme Harian & Istirahatmu ⏰</h2>
            <p className="step-desc">Agar kami tidak merekomendasikan belajar larut malam atau mengganggu jam tidurmu.</p>

            <div className="form-row-2">
              <div className="form-group">
                <label>Target Jam Tidur</label>
                <input
                  type="time"
                  className="form-input"
                  value={jamTidur}
                  onChange={(e) => setJamTidur(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Target Jam Bangun</label>
                <input
                  type="time"
                  className="form-input"
                  value={jamBangun}
                  onChange={(e) => setJamBangun(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kapan kamu merasa paling produktif?</label>
              <div className="kronotipe-options">
                {[
                  { id: 'pagi', label: '🌅 Pagi Hari (08.00 - 12.00)' },
                  { id: 'siang', label: '☀️ Siang/Sore (13.00 - 17.00)' },
                  { id: 'malam', label: '🌙 Malam Hari (19.00 - 22.00)' },
                ].map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className={`btn-kronotipe ${kronotipe === k.id ? 'active' : ''}`}
                    onClick={() => setKronotipe(k.id as any)}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Target Jam Fokus per Hari: <strong>{targetFokusJam} Jam</strong></label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={targetFokusJam}
                onChange={(e) => setTargetFokusJam(parseFloat(e.target.value))}
                className="form-range"
              />
            </div>

            <div className="onboarding-actions">
              <button type="button" className="btn-back" onClick={() => setStep(1)}>
                ← Kembali
              </button>
              <button type="button" className="btn-next" onClick={() => setStep(3)}>
                Lanjut: Jadwal Kuliah →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Jadwal Kuliah */}
        {step === 3 && (
          <div className="onboarding-step-content">
            <h2 className="step-title">Jadwal Kuliah Mingguan 📚</h2>
            <p className="step-desc">Jadwal kuliah akan otomatis masuk ke <strong>Deadline Radar</strong> agar beban harianmu terbaca jelas.</p>

            <div className="schedule-preview-list">
              {schedules.map((sc, idx) => (
                <div key={idx} className="schedule-item-row">
                  <div className="sc-day-badge">{HARI_NAMES[sc.hari]}</div>
                  <div className="sc-info">
                    <span className="sc-name">{sc.mata_kuliah}</span>
                    <span className="sc-time">{sc.jam_mulai} - {sc.jam_selesai}</span>
                  </div>
                  <button type="button" className="btn-del-sc" onClick={() => handleRemoveSchedule(idx)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="add-schedule-box">
              <h4>+ Tambah Mata Kuliah</h4>
              <div className="form-row-3">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama Mata Kuliah"
                  value={newMatkul}
                  onChange={(e) => setNewMatkul(e.target.value)}
                />
                <select
                  className="form-input"
                  value={newHari}
                  onChange={(e) => setNewHari(parseInt(e.target.value))}
                >
                  {HARI_NAMES.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="time"
                    className="form-input"
                    value={newJamMulai}
                    onChange={(e) => setNewJamMulai(e.target.value)}
                    title="Jam Mulai"
                  />
                  <input
                    type="time"
                    className="form-input"
                    value={newJamSelesai}
                    onChange={(e) => setNewJamSelesai(e.target.value)}
                    title="Jam Selesai"
                  />
                  <button type="button" className="btn-add-mini" onClick={handleAddSchedule}>
                    Tambah
                  </button>
                </div>
              </div>
            </div>


            <div className="onboarding-actions">
              <button type="button" className="btn-back" onClick={() => setStep(2)}>
                ← Kembali
              </button>
              <button type="button" className="btn-next" onClick={() => setStep(4)}>
                Lanjut: Mode Fokus & Distraksi →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Proteksi Fokus & Agent */}
        {step === 4 && (
          <div className="onboarding-step-content">
            <h2 className="step-title">Fokus & Penutup Distraksi 🛡️</h2>
            <p className="step-desc">
              Saat sesi fokus aktif di laptopmu, <strong>NAPAS Focus Agent</strong> akan melindungi konsentrasimu.
            </p>

            <div className="form-group">
              <label>Aksi saat membuka aplikasi distraksi:</label>
              <div className="action-options">
                {[
                  { id: 'warn_then_close', title: '⏱️ Peringatkan 8 detik, lalu tutup', desc: 'Beri jeda agar bisa segera kembali ke pekerjaan.' },
                  { id: 'minimize', title: '🔽 Minimize otomatis', desc: 'Turunkan jendela distraksi tanpa menutup paksa.' },
                  { id: 'close', title: '🚫 Tutup langsung', desc: 'Mode disiplin tinggi: langsung menutup tab/aplikasi.' },
                ].map((a) => (
                  <label key={a.id} className={`action-card-label ${actionChoice === a.id ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="agentAction"
                      value={a.id}
                      checked={actionChoice === a.id}
                      onChange={() => setActionChoice(a.id as any)}
                    />
                    <div>
                      <strong>{a.title}</strong>
                      <p>{a.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Daftar Aplikasi yang Ingin Ditutup saat Fokus:</label>
              <div className="chips-container">
                {blacklist.map((b) => (
                  <span key={b} className="chip-tag">
                    {b}
                    <button type="button" onClick={() => handleRemoveBlacklist(b)}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="add-chip-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tambah aplikasi (mis. Netflix, Steam...)"
                  value={newBlacklistApp}
                  onChange={(e) => setNewBlacklistApp(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBlacklist(); } }}
                />
                <button type="button" className="btn-add-mini" onClick={handleAddBlacklist}>Tambah</button>
              </div>
            </div>

            <div className="onboarding-actions">
              <button type="button" className="btn-back" onClick={() => setStep(3)}>
                ← Kembali
              </button>
              <button
                type="button"
                className="btn-finish-onboarding"
                onClick={handleFinish}
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : '🎉 Selesai & Buka Dashboard!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
