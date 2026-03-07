import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Calendar, Wallet, GitCompare, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import KeHoachChiPhiToolbar from './components/KeHoachChiPhiToolbar';
import KeHoachChiPhiPlanTab from './components/KeHoachChiPhiPlanTab';
import KeHoachChiPhiActualTab from './components/KeHoachChiPhiActualTab';
import KeHoachChiPhiCompareTab from './components/KeHoachChiPhiCompareTab';
import KeHoachChiPhiReportTab from './components/KeHoachChiPhiReportTab';
import KeHoachChiPhiForm from './components/KeHoachChiPhiForm';
import { useKeHoachChiPhiStore } from './store/useKeHoachChiPhiStore';
import { useDeleteKeHoachChiPhiMany } from './hooks/use-ke-hoach-chi-phi';
import type { KeHoachChiPhiTabId } from './core/constants';
import type { KeHoachChiPhi } from './core/types';

const KeHoachChiPhiPage: React.FC = () => {
  const { t } = useTranslation();
  const { resetState, filters, selectedIds, clearSelection } = useKeHoachChiPhiStore();
  const deleteManyMutation = useDeleteKeHoachChiPhiMany(() => clearSelection());
  const [activeTab, setActiveTab] = useState<KeHoachChiPhiTabId>('ke_hoach');
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<KeHoachChiPhi | null>(null);

  const tabs = useMemo(
    () => [
      { id: 'ke_hoach', label: t('keHoachChiPhi.tabs.keHoach'), icon: Calendar },
      { id: 'thuc_chi', label: t('keHoachChiPhi.tabs.thucChi'), icon: Wallet },
      { id: 'so_sanh', label: t('keHoachChiPhi.tabs.soSanh'), icon: GitCompare },
      { id: 'bao_cao', label: t('keHoachChiPhi.tabs.baoCao'), icon: BarChart3 },
    ],
    [t]
  );

  const handleTabChange = useCallback((id: string) => {
    if (['ke_hoach', 'thuc_chi', 'so_sanh', 'bao_cao'].includes(id)) {
      setActiveTab(id as KeHoachChiPhiTabId);
    }
  }, []);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const handleAdd = useCallback(() => {
    setEditingRow(null);
    setShowForm(true);
  }, []);

  const handleEditRow = useCallback((row: KeHoachChiPhi) => {
    setEditingRow(row);
    setShowForm(true);
  }, []);

  const handleDeleteMany = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    deleteManyMutation.mutate(ids);
  }, [selectedIds, deleteManyMutation]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <KeHoachChiPhiToolbar
          activeTab={activeTab}
          onAddPlan={activeTab === 'ke_hoach' ? handleAdd : undefined}
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          onDeleteMany={handleDeleteMany}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          {activeTab === 'ke_hoach' && (
            <KeHoachChiPhiPlanTab onAddClick={handleAdd} onEditRow={handleEditRow} />
          )}
          {activeTab === 'thuc_chi' && <KeHoachChiPhiActualTab />}
          {activeTab === 'so_sanh' && <KeHoachChiPhiCompareTab />}
          {activeTab === 'bao_cao' && <KeHoachChiPhiReportTab />}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <KeHoachChiPhiForm
            initialData={editingRow ?? undefined}
            onClose={() => {
              setShowForm(false);
              setEditingRow(null);
            }}
            defaultNam={filters.nam}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KeHoachChiPhiPage;
