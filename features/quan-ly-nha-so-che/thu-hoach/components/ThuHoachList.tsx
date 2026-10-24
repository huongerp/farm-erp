import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { FarmThuHoach, ThuHoachDaySuffix } from '../core/types';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import { khoangNgayTuan } from '../core/ngay-thu-hoach';
import { sumKeHoachWeek, sumThucTeWeek, formatThuDuKienShort } from '../core/utils';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: FarmThuHoach[];
  columns: ColumnConfig[];
  /** Cho phép kéo đổi bề rộng cột — truyền `resizeColumn` của store. */
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  /** Đang tải trang mới nhưng đã có dữ liệu cũ — hiện lớp phủ mờ thay vì skeleton. */
  isFetching?: boolean;
  /** Tổng số bản ghi khớp bộ lọc (phân trang ở server). */
  totalRecordsOverride?: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: FarmThuHoach) => void;
  onDelete?: (id: string) => void;
  onView?: (item: FarmThuHoach) => void;
}

const ThuHoachList: React.FC<Props> = ({
  data,
  isFetching,
  totalRecordsOverride,
  columns,
  onResizeColumn,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderDayCell = (suffix: ThuHoachDaySuffix, item: FarmThuHoach) => {
    const kh = Number(item[`ke_hoach_${suffix}`] ?? 0);
    const tt = Number(item[`thuc_te_${suffix}`] ?? 0);
    return (
      <div className="text-xs tabular-nums leading-snug py-0.5">
        <div className="whitespace-nowrap">
          <span className="text-muted-foreground">{t('thuHoach.stats.abbrKH')}</span>{' '}
          {formatNumberVN(kh)}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-muted-foreground">{t('thuHoach.stats.abbrTT')}</span>{' '}
          {formatNumberVN(tt)}
        </div>
      </div>
    );
  };

  const renderCell = (colId: string, item: FarmThuHoach) => {
    if (colId.startsWith('day_')) {
      const suf = colId.slice('day_'.length) as ThuHoachDaySuffix;
      if ((THU_HOACH_DAY_SUFFIXES as readonly string[]).includes(suf)) {
        return renderDayCell(suf, item);
      }
    }
    switch (colId) {
      case 'nam':
        return <span className="text-sm font-medium">{item.nam}</span>;
      case 'tuan':
        return <span className="text-sm text-muted-foreground">{item.tuan}</span>;
      case 'du_thu_tuan':
        return <span className="text-sm tabular-nums">{formatNumberVN(item.du_thu_tuan ?? 0)}</span>;
      case 'thu_du_kien': {
        const txt = formatThuDuKienShort(item.thu_du_kien ?? []);
        return (
          <span className="text-xs text-muted-foreground whitespace-normal" title={txt === '—' ? undefined : txt}>
            {txt}
          </span>
        );
      }
      case 'so_sanh_tuan': {
        const dt = Number(item.du_thu_tuan ?? 0);
        const kh = sumKeHoachWeek(item);
        const tt = sumThucTeWeek(item);
        return (
          <div className="text-xs tabular-nums leading-snug py-0.5">
            <div className="whitespace-nowrap">
              <span className="text-muted-foreground">{t('thuHoach.stats.abbrDT')}</span> {formatNumberVN(dt)}
            </div>
            <div className="whitespace-nowrap">
              <span className="text-muted-foreground">{t('thuHoach.stats.abbrKH')}</span> {formatNumberVN(kh)}
            </div>
            <div className="whitespace-nowrap">
              <span className="text-muted-foreground">{t('thuHoach.stats.abbrTT')}</span> {formatNumberVN(tt)}
            </div>
          </div>
        );
      }
      case 'ten_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{item.ten_chi_nhanh ?? '—'}</span>;
      case 'tong_ke_hoach':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumKeHoachWeek(item))}</span>;
      case 'tong_thuc_te':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumThucTeWeek(item))}</span>;
      case 'ghi_chu':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[240px]" title={item.ghi_chu ?? ''}>
            {item.ghi_chu ?? '—'}
          </span>
        );
      case 'ten_nguoi_tao':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]" title={item.ten_nguoi_tao ?? ''}>
            {item.ten_nguoi_tao?.trim() ? item.ten_nguoi_tao : '—'}
          </span>
        );
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                title={t('common.edit')}
                aria-label={t('common.edit')}
              >
                <Edit size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                title={t('common.delete')}
                aria-label={t('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: FarmThuHoach, isSelected: boolean) => {
    const keHoach = sumKeHoachWeek(item);
    const thucTe = sumThucTeWeek(item);
    const chenhLech = thucTe - keHoach;
    const nguoiTao = item.ten_nguoi_tao?.trim() ?? '';
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView?.(item)}
        onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
        className={cn(
          'bg-card rounded-xl border p-3.5 shadow-sm transition-all',
          isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
        )}
      >
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_chi_nhanh ?? '—'}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
            {t('thuHoach.store.colTuan')} {item.tuan}/{item.nam} · {khoangNgayTuan(item.nam, item.tuan)}
            {nguoiTao ? ` · ${nguoiTao}` : ''}
          </p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm tabular-nums">
          <div>
            <div className="text-xs text-muted-foreground">{t('thuHoach.card.duThu')}</div>
            <div className="font-semibold">{formatNumberVN(item.du_thu_tuan ?? 0)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('thuHoach.card.keHoach')}</div>
            <div className="font-semibold">{formatNumberVN(keHoach)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('thuHoach.card.thucTe')}</div>
            <div className="font-semibold">{formatNumberVN(thucTe)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('thuHoach.card.chenhLech')}</div>
            <div
              className={cn(
                'font-semibold',
                chenhLech < 0 ? 'text-rose-600 dark:text-rose-400' : chenhLech > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
              )}
            >
              {chenhLech > 0 ? '+' : ''}
              {formatNumberVN(chenhLech)}
            </div>
          </div>
        </div>
        {(item.thu_du_kien?.length ?? 0) > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('thuHoach.form.thuDuKien')}: {formatThuDuKienShort(item.thu_du_kien ?? [])}
          </p>
        )}
        {(onEdit || onDelete) && (
          <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                aria-label={t('common.edit')}
              >
                <Edit size={16} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="h-10 w-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
                aria-label={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <GenericTable<FarmThuHoach>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('thuHoach.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('thuHoach.empty')}
      emptyDescription={t('thuHoach.emptyHint')}
    />
  );
};

export default ThuHoachList;
