import React, { useEffect, useState } from 'react';
import { useIsFetching } from '../../services/loadingTracker';

interface GlobalLoadingBarProps {
  forceActive?: boolean;
}

export const GlobalLoadingBar: React.FC<GlobalLoadingBarProps> = ({ forceActive = false }) => {
  const isFetching = useIsFetching();
  const active = forceActive || isFetching;
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: number;
    let finishTimer: number;

    if (active) {
      setVisible(true);
      setProgress((prev) => (prev > 0 ? prev : 18));
      timer = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) return prev;
          const step = Math.max(1, (88 - prev) * 0.16);
          return prev + step;
        });
      }, 160);
    } else {
      if (visible) {
        setProgress(100);
        finishTimer = window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 320);
      }
    }

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(finishTimer);
    };
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      className="global-loading-bar is-animating"
      role="progressbar"
      aria-label="Memuat data..."
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="global-loading-bar-fill"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
};
