import React, { useState, useEffect } from 'react';
import {
  PLAYBOOK_ADVISORY,
  WEEKLY_INSIGHT,
  WEEKLY_SUMMARY_STATS,
  WELLNESS_PLAYBOOK,
} from '../../data/mockData';
import {
  InterventionHistoryItem,
  WeeklyInsightData,
  WeeklySummaryStat,
  WellnessPlaybookItem,
} from '../../types';
import { FokusTopFilter } from '../fokus/FokusTopFilter';
import { InsightMingguanCard } from './InsightMingguanCard';
import { WellnessPlaybookCard } from './WellnessPlaybookCard';
import { RingkasanMingguIniCard } from './RingkasanMingguIniCard';
import { RiwayatIntervensiCard } from './RiwayatIntervensiCard';
import { RefleksiHariIniCard } from './RefleksiHariIniCard';
import { ReflectionModal } from '../modals/ReflectionModal';
import { api, getStoredUserId } from '../../services/api';

interface LaporanViewProps {
  onNotify: (message: string, icon?: string) => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ onNotify }) => {
  const [selectedRange, setSelectedRange] = useState('7 hari terakhir');
  const [insight, setInsight] = useState<WeeklyInsightData>(WEEKLY_INSIGHT);
  const [playbook, setPlaybook] = useState<WellnessPlaybookItem[]>(WELLNESS_PLAYBOOK);
  const [advisory, setAdvisory] = useState<string>(PLAYBOOK_ADVISORY);
  const [summaryStats, setSummaryStats] = useState<WeeklySummaryStat[]>(WEEKLY_SUMMARY_STATS);
  const [history, setHistory] = useState<InterventionHistoryItem[]>([]);
  const [savedReflection, setSavedReflection] = useState<string>('');
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);

  const fetchLaporanData = async (days = 7) => {
    const userId = getStoredUserId();
    if (!userId) return;

    // 1. Fetch Weekly Insight & Playbook
    const insightData = await api.getWeeklyInsight(userId);
    if (insightData) {
      setInsight({
        title: insightData.title,
        description: insightData.description,
        weeklyScore: insightData.weeklyScore,
        zoneName: insightData.zoneName,
        note: insightData.note,
        ai_provider: insightData.ai_provider,
      });
      if (insightData.playbook && insightData.playbook.length > 0) {
        setPlaybook(insightData.playbook);
      }
      if (insightData.advisory) {
        setAdvisory(insightData.advisory);
      }
      if (insightData.summaryStats && insightData.summaryStats.length > 0) {
        setSummaryStats(insightData.summaryStats as WeeklySummaryStat[]);
      }
    }

    // 2. Fetch Interventions History
    const interData = await api.getInterventions(userId, days);
    if (interData && interData.items) {
      const mappedHistory: InterventionHistoryItem[] = interData.items.map((item, idx) => {
        const typeLabels: Record<string, string> = {
          breathing: 'Breathing 4-7-8',
          lock: 'Focus Lock Mode',
          break: 'Microbreak 20-20-20',
          playbook: 'Wellness Playbook',
        };
        const title = typeLabels[item.tipe] || `Intervensi ${item.tipe}`;
        const status = item.selesai ? `Selesai · ${item.durasi} detik` : 'Dilewati';
        let timeStr = 'Hari ini';
        if (item.ts) {
          try {
            const dt = new Date(item.ts);
            timeStr = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          } catch {}
        }
        return {
          id: item.id || `hist-${idx}`,
          title,
          status,
          time: timeStr,
          isCompleted: item.selesai,
        };
      });
      setHistory(mappedHistory);
    } else {
      setHistory([]);
    }

    // 3. Fetch today's check-in reflection
    api.getTodayCheckIn(userId).then((ci) => {
      if (ci && ci.catatan) {
        setSavedReflection(ci.catatan);
      }
    });
  };

  useEffect(() => {
    fetchLaporanData(7);
  }, []);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onNotify(`Rentang laporan diganti ke: ${range}`, '📅');
    const days = range.includes('14') ? 14 : range.includes('30') ? 30 : 7;
    fetchLaporanData(days);
  };

  const handlePlaybookAction = async (item: WellnessPlaybookItem) => {
    const userId = getStoredUserId();
    if (!userId) return;

    onNotify(`Memulai aktivitas "${item.title}"...`, '✨');
    const res = await api.postIntervention(userId, 'playbook', 180, true);
    if (res) {
      onNotify(`Aktivitas "${item.title}" selesai dan tercatat ke riwayat!`, '🌿');
      const days = selectedRange.includes('14') ? 14 : selectedRange.includes('30') ? 30 : 7;
      fetchLaporanData(days);
    }
  };

  const handleSaveReflection = async (text: string) => {
    const userId = getStoredUserId();
    if (!userId) return;

    const res = await api.postCheckIn(userId, 4, text);
    if (res) {
      setSavedReflection(text);
      onNotify('Refleksi harian Anda berhasil disimpan!', '💚');
    } else {
      setSavedReflection(text);
      onNotify(`Refleksi harian tersimpan: "${text.substring(0, 32)}..."`, '💚');
    }
  };

  return (
    <div className="laporan-container">
      {/* Top Filter and Date Row */}
      <FokusTopFilter
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
      />

      {/* Main 2-Column Grid */}
      <div className="laporan-grid">
        {/* Left Column: Insight + Playbook */}
        <div className="laporan-col-left">
          <InsightMingguanCard
            data={insight}
          />
          <WellnessPlaybookCard
            items={playbook}
            advisoryText={advisory}
            onActionClick={handlePlaybookAction}
          />
        </div>

        {/* Right Column: Ringkasan + Riwayat + Refleksi */}
        <div className="laporan-col-right">
          <RingkasanMingguIniCard
            stats={summaryStats}
          />
          <RiwayatIntervensiCard
            history={history}
          />
          <RefleksiHariIniCard
            savedText={savedReflection}
            onOpenReflection={() => setIsReflectionOpen(true)}
          />
        </div>
      </div>

      {/* Reflection Modal */}
      <ReflectionModal
        isOpen={isReflectionOpen}
        onClose={() => setIsReflectionOpen(false)}
        onSaveReflection={handleSaveReflection}
      />
    </div>
  );
};
