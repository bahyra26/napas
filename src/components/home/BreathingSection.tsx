import React, { useState, useEffect, useRef } from 'react';

interface BreathingSectionProps {
  onNotify?: (msg: string, icon: string) => void;
  onInterventionComplete?: (tipe: 'breathing', durasi: number) => void;
}

interface BreathingPhase {
  name: string;
  totalSeconds: number;
  type: 'tarik' | 'tahan' | 'hembuskan';
}

const PHASES: BreathingPhase[] = [
  { name: 'Tarik Napas', totalSeconds: 4, type: 'tarik' },
  { name: 'Tahan Napas', totalSeconds: 7, type: 'tahan' },
  { name: 'Hembuskan', totalSeconds: 8, type: 'hembuskan' },
];

export const BreathingSection: React.FC<BreathingSectionProps> = ({
  onNotify,
  onInterventionComplete,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      setPhaseIndex(0);
      setSecondsLeft(4);
      return;
    }

    startTimeRef.current = Date.now();
    let currentIdx = 0;
    let sec = PHASES[0].totalSeconds;
    setPhaseIndex(0);
    setSecondsLeft(sec);

    const timer = window.setInterval(() => {
      sec -= 1;
      if (sec <= 0) {
        currentIdx = (currentIdx + 1) % PHASES.length;
        sec = PHASES[currentIdx].totalSeconds;
        setPhaseIndex(currentIdx);
      }
      setSecondsLeft(sec);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isActive]);

  const toggleBreathing = () => {
    if (!isActive) {
      setIsActive(true);
      onNotify?.('Latihan napas 4-7-8 dimulai. Tarik napas secara perlahan...', '🌿');
    } else {
      setIsActive(false);
      const elapsedSec = Math.max(15, Math.round((Date.now() - startTimeRef.current) / 1000));
      onNotify?.(`Latihan napas selesai (${elapsedSec} detik). Pikiran lebih tenang!`, '✨');
      onInterventionComplete?.('breathing', elapsedSec);
    }
  };

  const currentPhase = PHASES[phaseIndex];

  return (
    <div
      className={`breathing-section ${isActive ? `active phase-${currentPhase.type}` : ''}`}
      id="breathingSection"
    >
      <h2 className="breathing-title">Breathing</h2>
      <div className="breathing-circle-wrapper">
        <div className="breathing-pulse-aura"></div>
        <div className="breathing-circle">
          <img
            src="./assets/lungs.png"
            alt="Anatomical Lungs Outline"
            className="lungs-img"
            id="lungsImg"
          />
          {isActive && (
            <div className="breathing-countdown-badge">
              {secondsLeft}s
            </div>
          )}
        </div>
      </div>
      <p className="breathing-prompt" id="breathingPrompt">
        {isActive ? `${currentPhase.name} (${secondsLeft}s)` : 'Tekan Untuk Mulai'}
      </p>
      <button
        type="button"
        className="breathing-play-btn"
        id="breathingBtn"
        aria-label="Mulai atau Hentikan Latihan Napas"
        onClick={toggleBreathing}
      >
        <svg
          id="breathingIcon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinejoin="round"
        >
          {isActive ? (
            <>
              <rect x="6" y="4" width="4" height="16" fill="#fff" rx="1"></rect>
              <rect x="14" y="4" width="4" height="16" fill="#fff" rx="1"></rect>
            </>
          ) : (
            <polygon className="play-triangle-icon" points="7 4 19 12 7 20 7 4"></polygon>
          )}
        </svg>
      </button>
    </div>
  );
};
