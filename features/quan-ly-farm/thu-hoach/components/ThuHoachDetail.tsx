import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Sprout, ClipboardList, MessageSquare } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmThuHoach } from '../core/types';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import { cn, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import {
  sumKeHoachWeek,
  sumThucTeWeek,
  sumChenhLechWeek,
  thuHoachDayColumnLabel,
  formatThuDuKienShort,
} from '../core/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import ThucTeDialog from './ThucTeDialog';
import ThuHoachTraoDoiDialog from './ThuHoachTraoDoiDialog';

interface Props {
  data: FarmThuHoach;
  onClose: () => void;
  onEdit?: (item: FarmThuHoach) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const ThuHoachDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const [showThucTe, setShowThucTe] = useState(false);
  const [showTraoDoi, setShowTraoDoi] = useState(false);

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [];
    if (canUpdate) {
      actions.push({
        label: t('thuHoach.detail.toolbar.thucTe'),
        icon: <ClipboardList size={16} />,
        onClick: () => setShowThucTe(true),
        variant: 'info',
      });
      actions.push({
        label: t('thuHoach.detail.toolbar.traoDoi'),
        icon: <MessageSquare size={16} />,
        onClick: () => setShowTraoDoi(true),
        variant: 'secondary',
      });
    }
    return actions;
  }, [canUpdate, t]);

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {canUpdate && onEdit && (
          <Button
            onClick={() => {
              onEdit(data);
              onClose();
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
        {canDelete && onDelete && (
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
        )}
      </div>
    </div>
  );

  return (
    <>
      <GenericDrawer
        title={t('thuHoach.detail.title')}
        subtitle={`${data.ten_chi_nhanh ?? '—'} · ${t('thuHoach.store.colNam')} ${data.nam} — ${t('thuHoach.store.colTuan')} ${data.tuan}`}
        icon={<Sprout className="text-emerald-600" size={22} />}
        onClose={onClose}
        footer={renderFooter}
        maxWidthClass={DRAWER_WIDTH_DETAIL}
      >
        <div className="space-y-5">
          {toolbarActions.length > 0 && (
            <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
          )}

          <DetailSection title={t('thuHoach.detail.keHoach')} icon={<Sprout size={14} />} variant="primary">
            <DetailFieldGrid cols={2}>
              <DetailField label={t('thuHoach.store.colNam')} value={String(data.nam)} />
              <DetailField label={t('thuHoach.store.colTuan')} value={String(data.tuan)} />
              <DetailField
                label={t('thuHoach.form.duThuTuan')}
                value={formatNumberVN(data.du_thu_tuan ?? 0)}
              />
              <DetailField
                label={t('thuHoach.form.thuDuKien')}
                value={(data.thu_du_kien?.length ?? 0) > 0 ? formatThuDuKienShort(data.thu_du_kien ?? []) : ''}
                emptyText="—"
              />
              <DetailField
                label={t('thuHoach.store.colBranch')}
                value={data.ten_chi_nhanh ?? '—'}
                className="sm:col-span-2"
              />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={t('thuHoach.detail.dailyBreakdown')} icon={<ClipboardList size={14} />} variant="primary">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/25 px-3 py-2 text-sm tabular-nums">
              <span className="font-medium text-foreground shrink-0">{t('thuHoach.detail.weekTotals')}</span>
              <span className="whitespace-nowrap">
                <span className="text-muted-foreground">{t('thuHoach.stats.abbrDT')}</span>{' '}
                {formatNumberVN(data.du_thu_tuan ?? 0)}
              </span>
              <span className="whitespace-nowrap">
                <span className="text-muted-foreground">{t('thuHoach.stats.abbrKH')}</span>{' '}
                {formatNumberVN(sumKeHoachWeek(data))}
              </span>
              <span className="whitespace-nowrap">
                <span className="text-muted-foreground">{t('thuHoach.stats.abbrTT')}</span>{' '}
                {formatNumberVN(sumThucTeWeek(data))}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap font-medium',
                  sumChenhLechWeek(data) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                <span className="text-muted-foreground font-normal">{t('thuHoach.stats.abbrCL')}</span>{' '}
                {formatNumberVN(sumChenhLechWeek(data))}
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border/80 bg-card -mx-0.5">
              <table className="w-full min-w-[520px] text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th
                      scope="col"
                      className="sticky left-0 z-[1] bg-muted/40 px-2 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {t('thuHoach.detail.dailyTableMetric')}
                    </th>
                    {THU_HOACH_DAY_SUFFIXES.map((s) => (
                      <th
                        key={s}
                        scope="col"
                        className="px-2 py-2 text-center text-xs font-semibold text-foreground tabular-nums whitespace-nowrap"
                      >
                        {thuHoachDayColumnLabel(s)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/70">
                    <th
                      scope="row"
                      className="sticky left-0 z-[1] bg-card px-2 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap border-r border-border/50"
                    >
                      {t('thuHoach.detail.keHoach')}
                    </th>
                    {THU_HOACH_DAY_SUFFIXES.map((s) => (
                      <td key={s} className="px-2 py-2 text-center tabular-nums text-foreground">
                        {formatNumberVN(Number(data[`ke_hoach_${s}` as keyof FarmThuHoach] ?? 0))}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/70">
                    <th
                      scope="row"
                      className="sticky left-0 z-[1] bg-card px-2 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap border-r border-border/50"
                    >
                      {t('thuHoach.detail.thucTe')}
                    </th>
                    {THU_HOACH_DAY_SUFFIXES.map((s) => (
                      <td key={s} className="px-2 py-2 text-center tabular-nums text-foreground">
                        {formatNumberVN(Number(data[`thuc_te_${s}` as keyof FarmThuHoach] ?? 0))}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="sticky left-0 z-[1] bg-card px-2 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap border-r border-border/50"
                    >
                      {t('thuHoach.detail.chenhLechRow')}
                    </th>
                    {THU_HOACH_DAY_SUFFIXES.map((s) => {
                      const kh = Number(data[`ke_hoach_${s}` as keyof FarmThuHoach] ?? 0);
                      const tt = Number(data[`thuc_te_${s}` as keyof FarmThuHoach] ?? 0);
                      const cl = tt - kh;
                      return (
                        <td
                          key={s}
                          className={cn(
                            'px-2 py-2 text-center tabular-nums font-medium',
                            cl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {formatNumberVN(cl)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </DetailSection>

          <DetailSection title={t('thuHoach.form.ghiChu')} variant="muted">
            <DetailFieldGrid cols={1}>
              <DetailField label={t('thuHoach.form.ghiChu')} value={data.ghi_chu ?? ''} emptyText="—" />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={t('thuHoach.detail.traoDoi')} icon={<MessageSquare size={14} />} variant="muted">
            {(data.trao_doi ?? '').trim() ? (
              <pre className="text-sm whitespace-pre-wrap break-words text-foreground font-sans m-0 leading-relaxed">
                {data.trao_doi}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground/70 italic m-0">—</p>
            )}
          </DetailSection>

          <DetailSection title={t('thuHoach.store.colUpdated')} variant="muted">
            <DetailField label={t('thuHoach.store.colUpdated')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </DetailSection>
        </div>
      </GenericDrawer>

      <AnimatePresence>
        {showThucTe && <ThucTeDialog data={data} onClose={() => setShowThucTe(false)} />}
        {showTraoDoi && <ThuHoachTraoDoiDialog data={data} onClose={() => setShowTraoDoi(false)} />}
      </AnimatePresence>
    </>
  );
};

export default ThuHoachDetail;
