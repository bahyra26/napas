import React from 'react';
import { TaskItem } from '../../types';

interface QuickTasksProps {
  tasks: TaskItem[];
  onDeleteTask: (id: string) => void;
  onOpenAddModal: () => void;
}

export const QuickTasks: React.FC<QuickTasksProps> = ({
  tasks,
  onDeleteTask,
  onOpenAddModal,
}) => {
  return (
    <div className="card-deadline">
      <div className="deadline-header">
        <div className="deadline-header-title">
          <svg
            className="deadline-cal-icon"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span className="deadline-title">Deadline Terdekat</span>
        </div>
        <span className="task-count-badge" id="taskCountBadge">
          {tasks.length} tugas
        </span>
      </div>

      <div className="deadline-list" id="deadlineList">
        {tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '12px 0' }}>
            Belum ada deadline terdekat.
          </p>
        ) : (
          tasks.map((task) => (
            <div className="task-card" key={task.id}>
              <span className={`task-dot dot-${task.priority}`}></span>
              <div className="task-info">
                <span className="task-title">{task.title}</span>
                <span className={`task-meta meta-${task.priority}`}>{task.meta}</span>
              </div>
              <button
                type="button"
                className="task-delete-btn"
                title="Hapus tugas"
                aria-label="Hapus"
                onClick={() => onDeleteTask(task.id)}
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="btn-tambah"
        id="btnTambahTugas"
        onClick={onOpenAddModal}
      >
        <svg
          className="icon-plus-circle"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span>Tambah Tugas</span>
      </button>
    </div>
  );
};
