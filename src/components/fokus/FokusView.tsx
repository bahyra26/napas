import React, { useState, useEffect } from 'react';
import {
  FOCUS_OVERVIEW_TODAY,
  FOCUS_STREAK_INFO,
  FOCUS_TOP_DISTRACTORS,
  FOCUS_WEEKLY_BARS,
} from '../../data/mockData';
import { FocusDailyBar, FocusOverviewData, FocusTopDistractor } from '../../types';
import { FokusTopFilter } from './FokusTopFilter';
import { FokusOverviewCard } from './FokusOverviewCard';
import { TopPencuriWaktuCard } from './TopPencuriWaktuCard';
import { FocusStreakCard } from './FocusStreakCard';
import { FokusVsDistraksiChart } from './FokusVsDistraksiChart';
import { FocusSessionCard } from './FocusSessionCard';
import { api, getStoredUserId } from '../../services/api';

interface FokusViewProps {

  onNotify: (message: string, icon?: string) => void;
}

export const FokusView: React.FC<FokusViewProps> = ({ onNotify }) => {
  const [selectedRange, setSelectedRange] = useState('7 hari terakhir');
  const [overview, setOverview] = useState<FocusOverviewData>(FOCUS_OVERVIEW_TODAY);
  const [distractors, setDistractors] = useState<FocusTopDistractor[]>(FOCUS_TOP_DISTRACTORS);
  const [streakInfo, setStreakInfo] = useState(FOCUS_STREAK_INFO);
  const [weeklyBars, setWeeklyBars] = useState<FocusDailyBar[]>(FOCUS_WEEKLY_BARS);


  const fetchFocusData = async (days = 7) => {
    const userId = getStoredUserId();
    if (!userId) return;

    const data = await api.getFocusSummary(userId, days);
    if (data) {
      if (data.overview) setOverview(data.overview as FocusOverviewData);
      if (data.top_distractors && data.top_distractors.length > 0) {
        setDistractors(data.top_distractors);
      }
      if (data.streak) {
        setStreakInfo(data.streak);
      }
      if (data.weekly_bars && data.weekly_bars.length > 0) {
        setWeeklyBars(data.weekly_bars);
      }
    }
  };

  useEffect(() => {
    fetchFocusData(7);
  }, []);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onNotify(`Rentang waktu diganti ke: ${range}`, '📅');
    const days = range.includes('14') ? 14 : range.includes('30') ? 30 : 7;
    fetchFocusData(days);
  };

  const handleDistractorClick = (item: FocusTopDistractor) => {
    onNotify(`${item.name} menyita ${item.durationLabel} waktu belajarmu hari ini.`, '⏱️');
  };

  const handleStreakClick = () => {
    onNotify(
      `Streak ${streakInfo.currentStreak} hari aktif! Pertahankan rekor terbaik ${streakInfo.bestRecord} hari.`,
      '🔥'
    );
  };

  const handleBarSelect = (bar: FocusDailyBar) => {
    onNotify(
      `${bar.dayFull}: Fokus ${bar.focusDuration} (${bar.focusPercent}%) vs Distraksi ${bar.distractDuration} (${bar.distractPercent}%)`,
      '📊'
    );
  };

  const handleRefreshOverview = async () => {
    await fetchFocusData(7);
    onNotify('Data fokus hari ini berhasil diperbarui!', '✨');
  };

  return (
    <div className="fokus-container">
      {/* Top Filter and Date Row */}
      <FokusTopFilter
        currentDate={overview.date}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
      />

      {/* Interactive Focus Session & Agent Controller */}
      <FocusSessionCard
        onSessionCompleted={() => fetchFocusData(7)}
        onNotify={onNotify}
      />

      {/* Top 3 Cards Grid */}
      <div className="fokus-top-grid">

        <FokusOverviewCard
          data={overview}
          onRefresh={handleRefreshOverview}
        />
        <TopPencuriWaktuCard
          distractors={distractors}
          onItemClick={handleDistractorClick}
        />
        <FocusStreakCard
          currentStreak={streakInfo.currentStreak}
          targetRule={streakInfo.targetRule}
          bestRecord={streakInfo.bestRecord}
          days={streakInfo.days}
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
