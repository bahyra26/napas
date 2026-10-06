import React, { useState, useEffect } from 'react';
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

const EMPTY_OVERVIEW: FocusOverviewData = {
  date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  focusPercent: 0,
  distractPercent: 0,
  focusDuration: '0 menit',
  distractDuration: '0 menit',
  motivationalNote: 'Belum ada sesi fokus tercatat hari ini.',
};

const EMPTY_STREAK = {
  currentStreak: 0,
  targetRule: 'fokus harian',
  bestRecord: 0,
  days: [
    { letter: 'S', dayName: 'Senin', completed: false },
    { letter: 'S', dayName: 'Selasa', completed: false },
    { letter: 'R', dayName: 'Rabu', completed: false },
    { letter: 'K', dayName: 'Kamis', completed: false },
    { letter: 'J', dayName: 'Jumat', completed: false },
    { letter: 'S', dayName: 'Sabtu', completed: false },
    { letter: 'M', dayName: 'Minggu', completed: false },
  ],
};

export const FokusView: React.FC<FokusViewProps> = ({ onNotify }) => {
  const [selectedRange, setSelectedRange] = useState('7 hari terakhir');
  const [overview, setOverview] = useState<FocusOverviewData>(EMPTY_OVERVIEW);
  const [distractors, setDistractors] = useState<FocusTopDistractor[]>([]);
  const [streakInfo, setStreakInfo] = useState(EMPTY_STREAK);
  const [weeklyBars, setWeeklyBars] = useState<FocusDailyBar[]>([]);

  const fetchFocusData = async (days = 7) => {
    const userId = getStoredUserId();
    if (!userId) return;

    const data = await api.getFocusSummary(userId, days);
    if (data) {
      if (data.overview) setOverview(data.overview as FocusOverviewData);
      setDistractors(data.top_distractors || []);
      if (data.streak) setStreakInfo(data.streak);
      setWeeklyBars(data.weekly_bars || []);
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
