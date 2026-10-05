import React, { useState } from 'react';
import {
  INTERVENTION_HISTORY,
  PLAYBOOK_ADVISORY,
  WEEKLY_INSIGHT,
  WEEKLY_SUMMARY_STATS,
  WELLNESS_PLAYBOOK,
} from '../../data/mockData';
import {
  InterventionHistoryItem,
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

interface LaporanViewProps {
  onNotify: (message: string, icon?: string) => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ onNotify }) => {
  const [selectedRange, setSelectedRange] = useState('7 hari terakhir');
  const [insight] = useState(WEEKLY_INSIGHT);
  const [playbook] = useState(WELLNESS_PLAYBOOK);
  const [summaryStats] = useState(WEEKLY_SUMMARY_STATS);
  const [history] = useState(INTERVENTION_HISTORY);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onNotify(`Rentang laporan diganti ke: ${range}`, '📅');
  };

  const handlePlaybookAction = (item: WellnessPlaybookItem) => {
    onNotify(`Aktivitas dimulai: "${item.title}"`, '✨');
  };

  const handleStatClick = (stat: WeeklySummaryStat) => {
    onNotify(`${stat.label}: ${stat.value} dalam 7 hari terakhir.`, '📊');
  };

  const handleHistoryItemClick = (item: InterventionHistoryItem) => {
    onNotify(`Intervensi: ${item.title} (${item.status}) pada ${item.time}`, '🧘‍♂️');
  };

  const handleSaveReflection = (text: string) => {
    onNotify(`Refleksi harian tersimpan: "${text.substring(0, 32)}..."`, '💚');
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
            onScoreClick={() => onNotify('Skor 68: Beban kognitif sedang, disarankan intervensi teratur.', 'ℹ️')}
          />
          <WellnessPlaybookCard
            items={playbook}
            advisoryText={PLAYBOOK_ADVISORY}
            onActionClick={handlePlaybookAction}
          />
        </div>

        {/* Right Column: Ringkasan + Riwayat + Refleksi */}
        <div className="laporan-col-right">
          <RingkasanMingguIniCard
            stats={summaryStats}
            onStatClick={handleStatClick}
          />
          <RiwayatIntervensiCard
            history={history}
            onItemClick={handleHistoryItemClick}
          />
          <RefleksiHariIniCard
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
