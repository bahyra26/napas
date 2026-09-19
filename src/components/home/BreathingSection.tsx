import React, { useState, useEffect, useRef } from 'react';

interface BreathingSectionProps {
  onNotify?: (msg: string, icon: string) => void;
}

const PHASES = [
  { text: 'Tarik Napas (4s)', duration: 4000 },
  { text: 'Tahan Napas (7s)', duration: 7000 },
  { text: 'Hembuskan (8s)', duration: 8000 },
];

export const BreathingSection: React.FC<BreathingSectionProps> = ({ onNotify }) => {
  const [isActive, setIsActive] = useState(false);
  const [promptText, setPromptText] = useState('Tekan Untuk Mulai');
  const phaseIndexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setPromptText('Tekan Untuk Mulai');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      phaseIndexRef.current = 0;
      return;
    }

    const step = () => {
      const currentPhase = PHASES[phaseIndexRef.current];
      setPromptText(currentPhase.text);

      timeoutRef.current = window.setTimeout(() => {
        phaseIndexRef.current = (phaseIndexRef.current + 1) % PHASES.length;
        step();
      }, currentPhase.duration);
    };

    step();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive]);

  const toggleBreathing = () => {
    if (!isActive) {
      setIsActive(true);
      onNotify?.('Latihan napas dimulai. Tarik napas secara perlahan...', '🌿');
    } else {
      setIsActive(false);
      onNotify?.('Latihan napas selesai.', '✨');
    }
  };

  return (
    <div className={`breathing-section ${isActive ? 'active' : ''}`} id="breathingSection">
      <h2 className="breathing-title">Breathing</h2>
      <div className="breathing-circle-wrapper">
        <div className="breathing-pulse-aura"></div>
        <div className="breathing-circle">
          <img
            src="/assets/lungs.png"
            alt="Anatomical Lungs Outline"
            className="lungs-img"
            id="lungsImg"
          />
        </div>
      </div>
      <p className="breathing-prompt" id="breathingPrompt">
        {promptText}
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
