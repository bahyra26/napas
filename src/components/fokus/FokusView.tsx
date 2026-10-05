import React, { useState } from 'react';
import {
  FOCUS_OVERVIEW_TODAY,
  FOCUS_STREAK_INFO,
  FOCUS_TOP_DISTRACTORS,
  FOCUS_WEEKLY_BARS,
} from '../../data/mockData';
import { FocusDailyBar, FocusTopDistractor } from '../../types';
import { FokusTopFilter } from './FokusTopFilter';
import { FokusOverviewCard } from './FokusOverviewCard';
import { TopPencuriWaktuCard } from './TopPencuriWaktuCard';
import { FocusStreakCard } from './FocusStreakCard';
import { FokusVsDistraksiChart } from './FokusVsDistraksiChart';

interface FokusViewProps {
  onNotify: (message: string, icon?: string) => void;
}

export const FokusView: React.FC<FokusViewProps> = ({ onNotify }) => {
  const [selectedRange, setSelectedRange] = useState('7 hari terakhir');
  const [distractors, setDistractors] = useState(FOCUS_TOP_DISTRACTORS);
  const [weeklyBars, setWeeklyBars] = useState(FOCUS_WEEKLY_BARS);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onNotify(`Rentang waktu diganti ke: ${range}`, '📅');
    if (range === '7 hari terakhir') {
      setWeeklyBars(FOCUS_WEEKLY_BARS);
      setDistractors(FOCUS_TOP_DISTRACTORS);
    } else {
      setWeeklyBars(
        FOCUS_WEEKLY_BARS.map((bar) => {
          const adjFocus = Math.min(92, Math.max(65, bar.focusPercent + (range.includes('14') ? 2 : -3)));
          return {
            ...bar,
            focusPercent: adjFocus,
            distractPercent: 100 - adjFocus,
          };
        })
      );
      setDistractors(FOCUS_TOP_DISTRACTORS);
    }
  };

  const handleDistractorClick = (item: FocusTopDistractor) => {
    onNotify(`${item.name} menyita ${item.durationLabel} waktu belajarmu hari ini.`, '⏱️');
  };

  const handleStreakClick = () => {
    onNotify(
      `Streak ${FOCUS_STREAK_INFO.currentStreak} hari aktif! Pertahankan rekor terbaik ${FOCUS_STREAK_INFO.bestRecord} hari.`,
      '🔥'
    );
  };

  const handleBarSelect = (bar: FocusDailyBar) => {
    onNotify(
      `${bar.dayFull}: Fokus ${bar.focusDuration} (${bar.focusPercent}%) vs Distraksi ${bar.distractDuration} (${bar.distractPercent}%)`,
      '📊'
    );
  };

  const handleRefreshOverview = () => {
    onNotify('Data fokus hari ini berhasil diperbarui!', '✨');
  };

  return (
    <div className="fokus-container">
      {/* Top Filter and Date Row */}
      <FokusTopFilter
        currentDate={FOCUS_OVERVIEW_TODAY.date}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
      />

      {/* Top 3 Cards Grid */}
      <div className="fokus-top-grid">
        <FokusOverviewCard
          data={FOCUS_OVERVIEW_TODAY}
          onRefresh={handleRefreshOverview}
        />
        <TopPencuriWaktuCard
          distractors={distractors}
          onItemClick={handleDistractorClick}
        />
        <FocusStreakCard
          currentStreak={FOCUS_STREAK_INFO.currentStreak}
          targetRule={FOCUS_STREAK_INFO.targetRule}
          bestRecord={FOCUS_STREAK_INFO.bestRecord}
          days={FOCUS_STREAK_INFO.days}
          onStreakClick={handleStreakClick}
        />
      </div>

      {/* Bottom Chart Card */}
      <div className="fokus-bottom-grid">
        <FokusVsDistraksiChart
          data={weeklyBars}
          onSelectDay={handleBarSelect}
        />
      </div>
    </div>
  );
};
