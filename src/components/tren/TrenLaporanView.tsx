import React, { useState, useEffect } from 'react';
import { WEEKLY_INSIGHT } from '../../data/mockData';
import { WeeklyInsightData } from '../../types';
import { FokusTopFilter } from '../fokus/FokusTopFilter';
import { TrendChart } from './TrendChart';
import { RingkasanCard } from './RingkasanCard';
import { HeatmapStres } from './HeatmapStres';
import { KesimpulanCard } from './KesimpulanCard';
import { InsightMingguanCard } from '../laporan/InsightMingguanCard';
import { RefleksiHariIniCard } from '../laporan/RefleksiHariIniCard';
import { ReflectionModal } from '../modals/ReflectionModal';
import { api, getStoredUserId } from '../../services/api';

interface TrenLaporanViewProps {
  onNotify: (message: string, icon?: string) => void;
}

export const TrenLaporanView: React.FC<TrenLaporanViewProps> = ({ onNotify }) => {
  const [selectedRange, setSelectedRange] = useState('7 hari terakhir');
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '14days' | 'month' | 'year'>('7days');
  const [insight, setInsight] = useState<WeeklyInsightData>(WEEKLY_INSIGHT);
  const [savedReflection, setSavedReflection] = useState<string>('');
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);

  const fetchInsightAndJournal = async () => {
    const userId = getStoredUserId();
    if (!userId) return;

    // 1. Fetch Weekly Insight
    const insightData = await api.getWeeklyInsight(userId);
    if (insightData) {
      setInsight({
        title: insightData.title,
        description: insightData.description,
        weeklyScore: insightData.weeklyScore,
        zoneName: insightData.zoneName,
        note: insightData.note,
      });
    }

    // 2. Fetch today's check-in reflection
    const ci = await api.getTodayCheckIn(userId);
    if (ci && ci.catatan) {
      setSavedReflection(ci.catatan);
    }
  };

  useEffect(() => {
    fetchInsightAndJournal();
  }, []);

  const handleRangeChange = (range: string, period?: string) => {
    const normPeriod = (
      period ||
      (range.includes('tahun') ? 'year' : range.includes('bulan') ? 'month' : range.includes('14') ? '14days' : '7days')
    ) as any;
    setSelectedRange(range);
    setSelectedPeriod(normPeriod);
    onNotify(`Periode tren disesuaikan: ${range}`, '📅');
    fetchInsightAndJournal();
  };

  const handleSaveReflection = async (text: string) => {
    const userId = getStoredUserId();
    if (!userId) return;

    const res = await api.postCheckIn(userId, 4, text);
    if (res) {
      setSavedReflection(text);
      onNotify('Refleksi harian berhasil disimpan ke jurnal database!', '💚');
    } else {
      setSavedReflection(text);
      onNotify(`Refleksi harian tersimpan: "${text.substring(0, 32)}..."`, '💚');
    }
  };

  return (
    <div className="tren-laporan-container">
      {/* 1. Header Filter: Rentang Waktu Komprehensif */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
        <FokusTopFilter
          selectedRange={selectedRange}
          selectedPeriod={selectedPeriod}
          onRangeChange={handleRangeChange}
        />
      </div>

      {/* 2. Top Row: Evaluasi Kognitif (Insight) + Jurnal Refleksi Diri */}
      <div className="tren-laporan-top-grid">
        <InsightMingguanCard data={insight} />
        <RefleksiHariIniCard
          savedText={savedReflection}
          onOpenReflection={() => setIsReflectionOpen(true)}
        />
      </div>

      {/* 3. Middle Row: Grafik Fluktuasi Burnout 14 Hari + Ringkasan Evaluasi */}
      <div className="tren-laporan-middle-grid">
        <TrendChart />
        <RingkasanCard />
      </div>

      {/* 4. Bottom Row: Heatmap Stres Jam & Hari + Kesimpulan AI / Cetak PDF */}
      <div className="tren-laporan-bottom-grid">
        <HeatmapStres />
        <KesimpulanCard />
      </div>

      {/* Modal Jurnal Refleksi */}
      <ReflectionModal
        isOpen={isReflectionOpen}
        onClose={() => setIsReflectionOpen(false)}
        onSaveReflection={handleSaveReflection}
      />
    </div>
  );
};
