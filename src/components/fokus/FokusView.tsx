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
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '14days' | 'month' | 'year'>('7days');
  const [overview, setOverview] = useState<FocusOverviewData>(EMPTY_OVERVIEW);
  const [distractors, setDistractors] = useState<FocusTopDistractor[]>([]);
  const [streakInfo, setStreakInfo] = useState(EMPTY_STREAK);
  const [weeklyBars, setWeeklyBars] = useState<FocusDailyBar[]>([]);

  const fetchFocusData = async (rangeStr = '7 hari terakhir', periodStr = '7days') => {
    const userId = getStoredUserId();
    if (!userId) return;

    let days = 7;
    if (periodStr === 'year' || rangeStr.toLowerCase().includes('tahun')) {
      days = 365;
    } else if (periodStr === 'month' || rangeStr.toLowerCase().includes('bulan')) {
      days = 30;
    } else if (periodStr === '14days' || rangeStr.includes('14')) {
      days = 14;
    }

    const data = await api.getFocusSummary(userId, days, periodStr);
    if (data) {
      if (data.overview) setOverview(data.overview as FocusOverviewData);
      setDistractors(data.top_distractors || []);
      if (data.streak) setStreakInfo(data.streak);
      setWeeklyBars(data.weekly_bars || []);
    }
  };

  useEffect(() => {
    fetchFocusData(selectedRange, selectedPeriod);
  }, []);

  const handleRangeChange = (range: string, period?: string) => {
    const normPeriod = (period || (range.includes('tahun') ? 'year' : range.includes('bulan') ? 'month' : range.includes('14') ? '14days' : '7days')) as any;
    setSelectedRange(range);
    setSelectedPeriod(normPeriod);
    onNotify(`Periode diganti ke: ${range}`, '📅');
    fetchFocusData(range, normPeriod);
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
    await fetchFocusData(selectedRange, selectedPeriod);
    onNotify('Data fokus hari ini berhasil diperbarui!', '✨');
  };

  return (
    <div className="fokus-container">
      {/* 1. Ruang Belajar & Guard Website Fokus (Action Hub) */}
      <FocusSessionCard
        onSessionCompleted={() => {
          fetchFocusData(selectedRange, selectedPeriod);
        }}
        onNotify={onNotify}
      />

      {/* 2. Header Bagian Statistik & Analisis Performa Belajar */}
      <div className="fokus-analytics-header">
        <div className="fokus-analytics-title-group">
          <div className="fokus-analytics-badge">
            <span className="analytics-pulse-dot"></span>
            <span>Statistik & Analisis</span>
          </div>
          <h2 className="fokus-analytics-heading">Ringkasan & Analisis Performa Belajar</h2>
          <p className="fokus-analytics-subheading">
            Rekapitulasi efisiensi fokus harian, streak konsistensi, dan website pencuri waktu
          </p>
        </div>

        {/* Tab Filter Rentang Waktu (7 Hari, 14 Hari, Bulan Ini, Tahun Ini) */}
        <FokusTopFilter
          currentDate={overview.date}
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
        />
      </div>

      {/* 3. Top 3 Cards Grid */}
      <div className="fokus-top-grid">
        <FokusOverviewCard
          data={overview}
          periodLabel={selectedRange === '7 hari terakhir' ? 'Hari Ini' : selectedRange}
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

      {/* 4. Bottom Chart Card */}
      <div className="fokus-bottom-grid">
        <FokusVsDistraksiChart
          data={weeklyBars}
          selectedRange={selectedRange}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={handleRangeChange}
          onSelectDay={handleBarSelect}
        />
      </div>
    </div>
  );
};
