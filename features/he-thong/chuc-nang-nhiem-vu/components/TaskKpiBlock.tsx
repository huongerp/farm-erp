import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Target, Eye, Edit, Trash2, Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import EmptyState from '../../../../components/shared/EmptyState';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { Task } from '../core/types';
import type { KpiIndicator, KpiCycle } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useKpiIndicatorsByTask } from '../hooks/use-kpi';

const KPI_SUB_COLUMNS = [
  { id: 'stt', minWidth: 40, maxWidth: 56 },
  { id: 'name', minWidth: 180, maxWidth: 320 },
  { id: 'unit', minWidth: 80, maxWidth: 140 },
  { id: 'target', minWidth: 120, maxWidth: 220 },
  { id: 'cycle', minWidth: 90, maxWidth: 120 },
  { id: 'order', minWidth: 64, maxWidth: 80 },
  { id: 'status', minWidth: 96, maxWidth: 140 },
  { id: 'actions', minWidth: 96, maxWidth: 120 },
] as const;

const cycleLabel = (cycle: KpiCycle, t: (k: string) => string) => {
  switch (cycle) {
    case 'month': return t('chucNangNhiemVu.form.cycleMonth');
    case 'quarter': return t('chucNangNhiemVu.form.cycleQuarter');
    case 'year': return t('chucNangNhiemVu.form.cycleYear');
    default: return cycle;
  }
};

interface Props {
  task: Task;
  onAddKpi: () => void;
  onViewKpi: (k: KpiIndicator) => void;
  onEditKpi: (k: KpiIndicator) => void;
  onDeleteKpi: (id: string) => void;
}

const TaskKpiBlock: React.FC<Props> = ({ task, onAddKpi, onViewKpi, onEditKpi, onDeleteKpi }) => {
  const { t } = useTranslation();
  const { data: kpis = [], isLoading: kpisLoading } = useKpiIndicatorsByTask(task.id);

  return (
    <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
      {/* Header: Nhiệm vụ (cấp 2) */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-muted/30 border-b border-border/70">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
            <ClipboardList size={14} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{task.ten_nhiem_vu}</p>
            <p className="text-xs text-muted-foreground font-mono">{task.ma_nhiem_vu}</p>
          </div>
        </div>
        <Button type="button" size="sm" onClick={onAddKpi} className="shrink-0 h-8 px-2.5 text-xs bg-primary text-white hover:bg-primary/90">
          <Plus size={12} className="mr-1" />
          {t('chucNangNhiemVu.addKpi')}
        </Button>
      </div>

      {/* Bảng KPI inline (cấp 3) */}
      <div className="p-2">
        {kpisLoading ? (
          <div className="py-4 text-center text-muted-foreground text-xs">{t('common.loading')}</div>
        ) : kpis.length === 0 ? (
          <EmptyState
            title={t('chucNangNhiemVu.emptyKpi')}
            description={t('chucNangNhiemVu.emptyKpiHint')}
            icon={<Target className="w-8 h-8 text-muted-foreground" />}
            className="py-4"
            action={
              <Button type="button" size="sm" onClick={onAddKpi} className="text-xs bg-primary text-white hover:bg-primary/90">
                <Plus size={12} className="mr-1.5" />
                {t('chucNangNhiemVu.addKpi')}
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded border border-border/50">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-3 py-1.5 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[0])}>#</th>
                  <th className="px-3 py-1.5 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[1])}>{t('chucNangNhiemVu.col.name')}</th>
                  <th className="px-3 py-1.5 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[2])}>{t('chucNangNhiemVu.col.unit')}</th>
                  <th className="px-3 py-1.5 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[3])}>{t('chucNangNhiemVu.col.target')}</th>
                  <th className="px-3 py-1.5 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[4])}>{t('chucNangNhiemVu.col.cycle')}</th>
                  <th className="px-3 py-1.5 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[5])}>{t('chucNangNhiemVu.col.order')}</th>
                  <th className="px-3 py-1.5 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[6])}>{t('chucNangNhiemVu.col.status')}</th>
                  <th className="px-3 py-1.5 font-semibold text-foreground/80 text-xs text-center min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[7])}>{t('chucNangNhiemVu.col.actions')}</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border/50">
                {kpis.map((kpi, idx) => (
                  <tr key={kpi.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums text-xs min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[0])}>{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-foreground text-xs min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[1])}>{kpi.ten_chi_so}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[2])}>{kpi.don_vi}</td>
                    <td className="px-3 py-2 text-xs min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[3])}>{kpi.chi_tieu_nguong}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[4])}>{cycleLabel(kpi.chu_ky_danh_gia, t)}</td>
                    <td className="px-3 py-2 tabular-nums text-xs min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[5])}>{kpi.thu_tu}</td>
                    <td className="px-3 py-2 min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[6])}>
                      {kpi.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">{t('chucNangNhiemVu.active')}</span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">{t('chucNangNhiemVu.inactive')}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[7])} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-0.5">
                        <button type="button" onClick={() => onViewKpi(kpi)} className="p-1 text-muted-foreground hover:bg-muted rounded" title={t('common.view')}>
                          <Eye size={12} />
                        </button>
                        <button type="button" onClick={() => onEditKpi(kpi)} className="p-1 text-primary hover:bg-primary/10 rounded" title={t('common.edit')}>
                          <Edit size={12} />
                        </button>
                        <button type="button" onClick={() => onDeleteKpi(kpi.id)} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded" title={t('common.delete')}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskKpiBlock;
