import React, { useState } from 'react';
import { MoodType } from '../../types';

interface MoodCheckinProps {
  onMoodSelect: (mood: MoodType, icon: string, score: number, jamTidur?: number, energi?: number) => void;
  currentScore?: number;
}

export const MoodCheckin: React.FC<MoodCheckinProps> = ({ onMoodSelect, currentScore }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(() => {
    if (currentScore === 5) return 'Bahagia / Senang';
    if (currentScore === 3) return 'Netral';
    if (currentScore && currentScore <= 2) return 'Sedih';
    return null;
  });

  const [jamTidur, setJamTidur] = useState<number>(7);
  const [energi, setEnergi] = useState<number>(3);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const handleSelect = (mood: MoodType, icon: string, score: number) => {
    setSelectedMood(mood);
    onMoodSelect(mood, icon, score, jamTidur, energi);
  };

  const handleUpdateSleepOrEnergy = (newSleep?: number, newEnergy?: number) => {
    const s = newSleep !== undefined ? newSleep : jamTidur;
    const e = newEnergy !== undefined ? newEnergy : energi;
    if (newSleep !== undefined) setJamTidur(newSleep);
    if (newEnergy !== undefined) setEnergi(newEnergy);

    if (selectedMood) {
      const score = selectedMood === 'Bahagia / Senang' ? 5 : selectedMood === 'Netral' ? 3 : 1;
      const icon = selectedMood === 'Bahagia / Senang' ? '😊' : selectedMood === 'Netral' ? '😐' : '😔';
      onMoodSelect(selectedMood, icon, score, s, e);
    }
  };

  return (
    <div className="col col-mid">
      <div className="checkin-header">
        <div className="checkin-title-wrapper">
          <svg
            className="checkin-badge"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0a5445"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
          </svg>
          <h2 className="checkin-title">Check In</h2>
        </div>
        <p className="checkin-sub">
          Bagaimana<br />kondisimu hari ini?
        </p>
      </div>

      <div className="mood-list">
        {/* Happy Button (Skor: 5) */}
        <button
          type="button"
          className={`mood-btn mood-happy ${selectedMood === 'Bahagia / Senang' ? 'active' : ''}`}
          onClick={() => handleSelect('Bahagia / Senang', '😊', 5)}
        >
          <svg className="mood-icon" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="9" cy="9.5" r="1" fill="#111111"></circle>
            <circle cx="15" cy="9.5" r="1" fill="#111111"></circle>
            <path d="M8 14.5c1.5 2 4.5 2 8 0"></path>
          </svg>
          <span>Bahagia / Senang</span>
          <span className="mood-check-badge">✓</span>
        </button>

        {/* Neutral Button (Skor: 3) */}
        <button
          type="button"
          className={`mood-btn mood-neutral ${selectedMood === 'Netral' ? 'active' : ''}`}
          onClick={() => handleSelect('Netral', '😐', 3)}
        >
          <svg className="mood-icon" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="9" cy="9.5" r="1" fill="#111111"></circle>
            <circle cx="15" cy="9.5" r="1" fill="#111111"></circle>
            <line x1="8.5" y1="15" x2="15.5" y2="15"></line>
          </svg>
          <span>Netral</span>
          <span className="mood-check-badge">✓</span>
        </button>

        {/* Sad Button (Skor: 1) */}
        <button
          type="button"
          className={`mood-btn mood-sad ${selectedMood === 'Sedih' ? 'active' : ''}`}
          onClick={() => handleSelect('Sedih', '😔', 1)}
        >
          <svg className="mood-icon" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="9" cy="9.5" r="1" fill="#111111"></circle>
            <circle cx="15" cy="9.5" r="1" fill="#111111"></circle>
            <path d="M15.5 16.5c-1.5-2-4.5-2-7 0"></path>
          </svg>
          <span>Sedih / Lelah</span>
          <span className="mood-check-badge">✓</span>
        </button>
      </div>

      {/* Mini Sleep & Energy Evaluator */}
      <div className="checkin-extra-box">
        <button
          type="button"
          className="btn-toggle-sleep-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          <span>😴 Tidur semalam: <strong>{jamTidur} jam</strong> · ⚡ Energi: <strong>{energi}/5</strong></span>
          <span className="toggle-chevron">{showDetails ? '▲' : '▼'}</span>
        </button>

        {showDetails && (
          <div className="sleep-energy-controls">
            <div className="mini-control-group">
              <label>Durasi Tidur Semalam:</label>
              <div className="sleep-quick-chips">
                {[4, 5, 6, 7, 8, 9].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`btn-sleep-chip ${jamTidur === val ? 'active' : ''}`}
                    onClick={() => handleUpdateSleepOrEnergy(val, undefined)}
                  >
                    {val}j
                  </button>
                ))}
              </div>
            </div>

            <div className="mini-control-group">
              <label>Tingkat Energi:</label>
              <div className="energy-quick-chips">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`btn-energy-chip ${energi === val ? 'active' : ''}`}
                    onClick={() => handleUpdateSleepOrEnergy(undefined, val)}
                  >
                    {val === 1 ? '1 🪫' : val === 5 ? '5 ⚡' : val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
