import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus } from 'lucide-react';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import Section from '../../../../components/shared/Section';
import { useTasks } from '../hooks/use-chuc-nang-nhiem-vu';
import { useKpiIndicatorsByTask } from '../hooks/use-kpi';
import { useDeleteKpiIndicators, useUpdateKpiIndicatorStatus } from '../hooks/use-kpi';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import KpiTable from './KpiTable';
import KpiForm from './KpiForm';
import type { KpiIndicator } from '../core/types';

const KpiTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiIndicator | null>(null);

  const { data: tasks = [] } = useTasks();
  const { data: kpis = [], isLoading: kpisLoading } = useKpiIndicatorsByTask(selectedTaskId);

  const deleteKpisMutation = useDeleteKpiIndicators();
  const updateKpiStatusMutation = useUpdateKpiIndicatorStatus();

  const taskOptions = useMemo(
    () =>
      tasks.map((task) => ({
        label: `${task.ten_nhiem_vu}${task.ten_chuc_nang ? ` (${task.ten_chuc_nang})` : ''}`,
        value: task.id,
        subLabel: task.ma_nhiem_vu,
      })),
    [tasks]
  );

  const handleAddKpi = () => {
    setEditingKpi(null);
    setShowKpiForm(true);
  };

  const handleEditKpi = (k: KpiIndicator) => {
    setEditingKpi(k);
    setShowKpiForm(true);
  };

  const handleDeleteKpi = (id: string) => {
    confirm({
      title: t('chucNangNhiemVu.deleteKpiTitle'),
      message: t('chucNangNhiemVu.deleteKpiMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteKpisMutation.mutate([id]),
    });
  };

  const handleStatusChangeKpi = (item: KpiIndicator) => {
    const newStatus = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    updateKpiStatusMutation.mutate({ ids: [item.id], status: newStatus });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Combobox
          label={t('chucNangNhiemVu.selectTask')}
          options={taskOptions}
          value={selectedTaskId}
          onChange={(v) => setSelectedTaskId(v as string | null)}
          placeholder={t('chucNangNhiemVu.selectTaskPlaceholder')}
          icon={<ClipboardList size={14} />}
          className="min-w-[280px]"
        />
      </div>

      <Section title={t('chucNangNhiemVu.kpiList')} icon={<ClipboardList size={14} />} variant="primary">
        {selectedTaskId ? (
          <>
            <div className="flex justify-between items-center mb-3">
              <Button size="sm" onClick={handleAddKpi} className="bg-primary text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t('chucNangNhiemVu.addKpi')}
              </Button>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <KpiTable
                data={kpis}
                isLoading={kpisLoading}
                onEdit={handleEditKpi}
                onDelete={handleDeleteKpi}
                onStatusChange={handleStatusChangeKpi}
              />
            </div>
            {kpis.length === 0 && !kpisLoading && (
              <p className="text-sm text-muted-foreground py-4">{t('chucNangNhiemVu.emptyKpi')}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t('chucNangNhiemVu.selectTaskPlaceholder')}</p>
        )}
      </Section>

      <AnimatePresence>
        {showKpiForm && (
          <KpiForm
            initialData={editingKpi}
            defaultIdNhiemVu={selectedTaskId}
            onClose={() => {
              setShowKpiForm(false);
              setEditingKpi(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KpiTab;
