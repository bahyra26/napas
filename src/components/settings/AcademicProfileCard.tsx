import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../services/api';

interface AcademicProfileCardProps {
  initialProfile: StudentProfile | null;
  onSaveProfile: (updated: Partial<StudentProfile>) => Promise<boolean>;
  onNotify: (msg: string, icon?: string) => void;
}

export const AcademicProfileCard: React.FC<AcademicProfileCardProps> = ({
  initialProfile,
  onSaveProfile,
  onNotify,
}) => {
  const [nama, setNama] = useState('');
  const [panggilan, setPanggilan] = useState('');
  const [email, setEmail] = useState('');
  const [kampus, setKampus] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [semester, setSemester] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setNama(initialProfile.nama || '');
      setPanggilan(initialProfile.panggilan || '');
      setEmail(initialProfile.email || '');
      setKampus(initialProfile.kampus || 'Universitas Gadjah Mada');
      setJurusan(initialProfile.jurusan || 'Ilmu Komputer');
      setSemester(initialProfile.semester || 6);
    }
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      onNotify('Nama lengkap wajib diisi.', '⚠️');
      return;
    }

    setIsSubmitting(true);
    const success = await onSaveProfile({
      nama: nama.trim(),
      panggilan: panggilan.trim() || nama.trim().split(' ')[0],
      email: email.trim(),
      kampus: kampus.trim() || 'Universitas Gadjah Mada',
      jurusan: jurusan.trim() || 'Ilmu Komputer',
      semester: Number(semester) || 1,
    });

    setIsSubmitting(false);
    if (success) {
      onNotify('Identitas akademik berhasil diperbarui!', '✅');
    }
  };

  return (
    <div className="settings-card academic-profile-card">
      <div className="settings-card-header">
        <div className="card-header-icon-title">
          <div className="card-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div>
            <h2 className="settings-card-title">Identitas Akademik</h2>
            <p className="settings-card-subtitle">
              Data pribadi dan status studi mahasiswa yang terdaftar di sistem.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form-grid">
        <div className="form-field-group">
          <label className="field-label" htmlFor="acad-name">
            Nama Lengkap
          </label>
          <input
            id="acad-name"
            type="text"
            className="settings-text-input"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Raka Pratama"
            required
          />
        </div>

        <div className="form-field-group">
          <label className="field-label" htmlFor="acad-nickname">
            Nama Panggilan
          </label>
          <input
            id="acad-nickname"
            type="text"
            className="settings-text-input"
            value={panggilan}
            onChange={(e) => setPanggilan(e.target.value)}
            placeholder="Contoh: Raka"
          />
        </div>

        <div className="form-field-group">
          <label className="field-label" htmlFor="acad-email">
            Email Kampus / Akun
          </label>
          <input
            id="acad-email"
            type="email"
            className="settings-text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@ugm.ac.id"
          />
        </div>

        <div className="form-field-group">
          <label className="field-label" htmlFor="acad-semester">
            Semester Aktif
          </label>
          <select
            id="acad-semester"
            className="settings-select-input"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field-group">
          <label className="field-label" htmlFor="acad-campus">
            Universitas / Kampus
          </label>
          <input
            id="acad-campus"
            type="text"
            className="settings-text-input"
            value={kampus}
            onChange={(e) => setKampus(e.target.value)}
            placeholder="Universitas Gadjah Mada"
          />
        </div>

        <div className="form-field-group">
          <label className="field-label" htmlFor="acad-major">
            Program Studi / Jurusan
          </label>
          <input
            id="acad-major"
            type="text"
            className="settings-text-input"
            value={jurusan}
            onChange={(e) => setJurusan(e.target.value)}
            placeholder="Ilmu Komputer"
          />
        </div>

        <div className="form-actions-full">
          <button
            type="submit"
            className="btn-settings-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Identitas Akademik'}
          </button>
        </div>
      </form>
    </div>
  );
};
