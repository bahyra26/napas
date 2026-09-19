import React, { useState } from 'react';
import { PriorityType, TaskItem } from '../../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [meta, setMeta] = useState('');
  const [priority, setPriority] = useState<PriorityType>('red');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meta.trim()) return;

    onAddTask({
      title: title.trim(),
      meta: meta.trim(),
      priority,
    });

    setTitle('');
    setMeta('');
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
            <label htmlFor="taskTitleInput">Nama Tugas</label>
            <input
              type="text"
              id="taskTitleInput"
              className="form-input"
              placeholder="Contoh: Makalah Biologi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskDueInput">Waktu Tenggat</label>
            <input
              type="text"
              id="taskDueInput"
              className="form-input"
              placeholder="Contoh: 3 hari lagi · 17.00"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Prioritas / Status</label>
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
                <span>Mendesak</span>
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
                <span>Santai</span>
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
