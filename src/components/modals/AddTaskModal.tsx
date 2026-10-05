import React, { useState } from 'react';
import { PriorityType } from '../../types';


export interface NewTaskPayload {
  title: string;
  meta: string;
  priority: PriorityType;
  deadlineIso: string;
  estJam: number;
  effort: number;
  mataKuliah?: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: NewTaskPayload) => void;
  matkulList?: string[];
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  matkulList = [],
}) => {
  const tomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [title, setTitle] = useState('');
  const [mataKuliah, setMataKuliah] = useState(matkulList[0] || '');
  const [customMatkul, setCustomMatkul] = useState('');
  const [dueDate, setDueDate] = useState(tomorrowStr());
  const [dueTime, setDueTime] = useState('23:59');
  const [estJam, setEstJam] = useState(2.0);
  const [priority, setPriority] = useState<PriorityType>('red');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const chosenMatkul = mataKuliah === '__custom__' || !mataKuliah ? customMatkul.trim() : mataKuliah;
    const deadlineDate = new Date(`${dueDate}T${dueTime || '23:59'}:00`);

    const effortNum = priority === 'red' ? 5 : priority === 'yellow' ? 3 : 1;

    // Format display meta e.g. "Besok · 23.59" or "8 Okt · 17.00"
    const today = new Date();
    const isTomorrow =
      deadlineDate.getDate() === today.getDate() + 1 &&
      deadlineDate.getMonth() === today.getMonth();

    const meta = isTomorrow
      ? `Besok · ${dueTime}`
      : `${deadlineDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · ${dueTime}`;

    onAddTask({
      title: title.trim(),
      meta,
      priority,
      deadlineIso: deadlineDate.toISOString(),
      estJam,
      effort: effortNum,
      mataKuliah: chosenMatkul || undefined,
    });

    setTitle('');
    setCustomMatkul('');
    setPriority('red');
    onClose();
  };

  return (
    <div
      className="modal-overlay open"
      id="taskModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h3>Tambah Tugas Baru</h3>
          <button
            type="button"
            className="modal-close-btn"
            id="modalCloseBtn"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <form id="taskForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="taskTitleInput">Nama Tugas / Aktivitas</label>
            <input
              type="text"
              id="taskTitleInput"
              className="form-input"
              placeholder="Contoh: Makalah Biologi / Laporan Praktikum"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mata Kuliah</label>
            {matkulList.length > 0 ? (
              <div className="matkul-selection-row">
                <select
                  className="form-input"
                  value={mataKuliah}
                  onChange={(e) => setMataKuliah(e.target.value)}
                >
                  {matkulList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="__custom__">+ Tulis Mata Kuliah Lain...</option>
                </select>
                {mataKuliah === '__custom__' && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Mata Kuliah Baru"
                    value={customMatkul}
                    onChange={(e) => setCustomMatkul(e.target.value)}
                    required
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Kalkulus / Struktur Data"
                value={customMatkul}
                onChange={(e) => setCustomMatkul(e.target.value)}
              />
            )}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="taskDueDate">Tanggal Deadline</label>
              <input
                type="date"
                id="taskDueDate"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="taskDueTime">Jam Tenggat</label>
              <input
                type="time"
                id="taskDueTime"
                className="form-input"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Estimasi Waktu Pengerjaan: <strong>{estJam} Jam</strong></label>
            <input
              type="range"
              min="0.5"
              max="12"
              step="0.5"
              value={estJam}
              onChange={(e) => setEstJam(parseFloat(e.target.value))}
              className="form-range"
            />
          </div>

          <div className="form-group">
            <label>Tingkat Urgensi / Beban</label>
            <div className="color-options">
              <label className="color-radio-label">
                <input
                  type="radio"
                  name="taskPriority"
                  value="red"
                  checked={priority === 'red'}
                  onChange={() => setPriority('red')}
                />
                <span className="color-pill-sample dot-red"></span>
                <span>Mendesak (Tinggi)</span>
              </label>
              <label className="color-radio-label">
                <input
                  type="radio"
                  name="taskPriority"
                  value="yellow"
                  checked={priority === 'yellow'}
                  onChange={() => setPriority('yellow')}
                />
                <span className="color-pill-sample dot-yellow"></span>
                <span>Sedang</span>
              </label>
              <label className="color-radio-label">
                <input
                  type="radio"
                  name="taskPriority"
                  value="green"
                  checked={priority === 'green'}
                  onChange={() => setPriority('green')}
                />
                <span className="color-pill-sample dot-green"></span>
                <span>Santai (Rendah)</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              id="modalCancelBtn"
              onClick={onClose}
            >
              Batal
            </button>
            <button type="submit" className="btn-submit">
              Simpan Tugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
