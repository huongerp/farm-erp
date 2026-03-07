import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, ClipboardList, Layers, Hash, FileText, Calendar, Power, Target, Eye, Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import EmptyState from '../../../../components/shared/EmptyState';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { Task, TaskResponsibleGroupCode } from '../core/types';
import type { KpiIndicator, KpiCycle } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { useKpiIndicatorsByTask } from '../hooks/use-kpi';

/** Cấu hình cột bảng con chỉ số KPI (min/max theo quy định generic) */
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
  data: Task;
  onClose: () => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (t: Task) => void;
  /** Khi true, hiển thị section Bộ chỉ số KPI với bảng con và callbacks */
  showKpiSection?: boolean;
  onAddKpi?: () => void;
  onViewKpi?: (k: KpiIndicator) => void;
  onEditKpi?: (k: KpiIndicator) => void;
  onDeleteKpi?: (id: string) => void;
}

const TaskDetailDrawer: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  showKpiSection = false,
  onAddKpi,
  onViewKpi,
  onEditKpi,
  onDeleteKpi,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;
  const { data: kpis = [], isLoading: kpisLoading } = useKpiIndicatorsByTask(showKpiSection ? data.id : null);
  const showKpiBlock = showKpiSection && typeof onAddKpi === 'function';

  const groupLabel = (code: TaskResponsibleGroupCode | null) =>
    code ? t(`chucNangNhiemVu.responsibleGroup.${code}`) : '—';

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onDelete(data.id);
            onClose();
          }}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('chucNangNhiemVu.taskDetailTitle')}
      subtitle={data.ma_nhiem_vu}
      icon={<ClipboardList size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <ClipboardList size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_nhiem_vu}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_nhiem_vu}</p>
            {data.ten_chuc_nang && (
              <p className="text-body-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Layers size={12} /> {data.ten_chuc_nang}
              </p>
            )}
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('chucNangNhiemVu.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('chucNangNhiemVu.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('chucNangNhiemVu.detailSectionInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid cols={2}>
            <DetailField label={t('chucNangNhiemVu.form.taskCode')} value={data.ma_nhiem_vu} icon={<Hash size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.taskName')} value={data.ten_nhiem_vu} icon={<ClipboardList size={12} />} />
            <DetailField label={t('chucNangNhiemVu.col.function')} value={data.ten_chuc_nang ?? '—'} icon={<Layers size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.responsibleGroup')} value={groupLabel(data.nhom_chiu_trach_nhiem)} icon={<FileText size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.order')} value={String(data.thu_tu)} icon={<Hash size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.description')} value={data.mo_ta ?? '—'} icon={<FileText size={12} />} />
            <DetailField label={t('chucNangNhiemVu.detailUpdated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {showKpiBlock && (
          <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
              <div className="flex items-center gap-2 shrink-0">
                <Target size={14} className="text-primary" />
                <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
                  {t('chucNangNhiemVu.kpiList')}
                </h4>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                  {kpisLoading ? '—' : kpis.length} {t('chucNangNhiemVu.kpiCountLabel')}
                </span>
              </div>
              <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
              <Button type="button" size="sm" onClick={onAddKpi} className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0">
                <Plus size={14} className="mr-1.5" />
                {t('chucNangNhiemVu.addKpi')}
              </Button>
            </div>
            {kpisLoading ? (
              <div className="py-6 text-center text-muted-foreground text-sm">{t('common.loading')}</div>
            ) : kpis.length === 0 ? (
              <EmptyState
                title={t('chucNangNhiemVu.emptyKpi')}
                description={t('chucNangNhiemVu.emptyKpiHint')}
                icon={<Target className="w-10 h-10 text-muted-foreground" />}
                action={
                  <Button type="button" size="sm" onClick={onAddKpi} className="bg-primary text-white hover:bg-primary/90">
                    <Plus size={14} className="mr-2" />
                    {t('chucNangNhiemVu.addKpi')}
                  </Button>
                }
              />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[0])}>#</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[1])}>{t('chucNangNhiemVu.col.name')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[2])}>{t('chucNangNhiemVu.col.unit')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[3])}>{t('chucNangNhiemVu.col.target')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[4])}>{t('chucNangNhiemVu.col.cycle')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[5])}>{t('chucNangNhiemVu.col.order')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[6])}>{t('chucNangNhiemVu.col.status')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs text-center min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[7])}>{t('chucNangNhiemVu.col.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                      {kpis.map((kpi, idx) => (
                        <tr key={kpi.id} className="hover:bg-muted/60 transition-colors">
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[0])}>{idx + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-foreground min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[1])}>{kpi.ten_chi_so}</td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[2])}>{kpi.don_vi}</td>
                          <td className="px-4 py-2.5 min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[3])}>{kpi.chi_tieu_nguong}</td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[4])}>{cycleLabel(kpi.chu_ky_danh_gia, t)}</td>
                          <td className="px-4 py-2.5 tabular-nums min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[5])}>{kpi.thu_tu}</td>
                          <td className="px-4 py-2.5 min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[6])}>
                            {kpi.trang_thai === 1 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{t('chucNangNhiemVu.active')}</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">{t('chucNangNhiemVu.inactive')}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center min-w-0" style={getColumnCellStyle(KPI_SUB_COLUMNS[7])} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-0.5">
                              {onViewKpi && (
                                <button type="button" onClick={() => onViewKpi(kpi)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-all" title={t('common.view')}>
                                  <Eye size={14} />
                                </button>
                              )}
                              {onEditKpi && (
                                <button type="button" onClick={() => onEditKpi(kpi)} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all" title={t('common.edit')}>
                                  <Edit size={14} />
                                </button>
                              )}
                              {onDeleteKpi && (
                                <button type="button" onClick={() => onDeleteKpi(kpi.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all" title={t('common.delete')}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {onStatusChange && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onStatusChange(data)} className="text-muted-foreground">
              <Power size={14} className="mr-1.5" />
              {isActive ? t('chucNangNhiemVu.deactivate') : t('chucNangNhiemVu.activate')}
            </Button>
          </div>
        )}
      </div>
    </GenericDrawer>
  );
};

export default TaskDetailDrawer;
