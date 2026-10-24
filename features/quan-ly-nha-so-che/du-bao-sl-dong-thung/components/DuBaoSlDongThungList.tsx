import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';

interface Props {
  data: FarmDuBaoSlDongThung[];
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
  sort?: SortState;
  onSort?: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: FarmDuBaoSlDongThung) => void;
  onDelete?: (id: string) => void;
  onView?: (item: FarmDuBaoSlDongThung) => void;
  canEditRow?: (item: FarmDuBaoSlDongThung) => boolean;
  canDeleteRow?: (item: FarmDuBaoSlDongThung) => boolean;
}

const DuBaoSlDongThungList: React.FC<Props> = ({
  data,
  isFetching,
  totalRecordsOverride,
  sort,
  onSort,
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
  canEditRow,
  canDeleteRow,
}) => {
  const { t } = useTranslation();
  const allowEdit = (item: FarmDuBaoSlDongThung) => canEditRow?.(item) ?? true;
  const allowDelete = (item: FarmDuBaoSlDongThung) => canDeleteRow?.(item) ?? true;

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderTrangThaiBadge = (item: FarmDuBaoSlDongThung) => {
    const locked = item.trang_thai === 'khoa';
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
          locked
            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100'
            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
        )}
      >
        {locked ? t('duBaoSlDongThung.trangThai.khoa') : t('duBaoSlDongThung.trangThai.mo')}
      </span>
    );
  };

  const renderCell = (colId: string, item: FarmDuBaoSlDongThung) => {
    const kpi = computeDuBaoSlDongThungKpiFromFarm(item);
    switch (colId) {
      case 'ngay':
        return <span className="text-sm font-medium tabular-nums">{formatDateShort(item.ngay)}</span>;
      case 'ten_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{item.ten_chi_nhanh ?? '—'}</span>;
      case 'trang_thai':
        return renderTrangThaiBadge(item);
      case 'tong_so_thung_ke_hoach':
        return (
          <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(kpi.tong_so_thung_ke_hoach)}</span>
        );
      case 'tong_so_thung_thuc_te':
        return (
          <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(kpi.tong_so_thung_thuc_te)}</span>
        );
      case 'ghi_chu':
        return (
          <div
            className="text-sm text-muted-foreground max-h-28 max-w-[320px] overflow-y-auto whitespace-pre-wrap leading-snug"
            title={item.ghi_chu ?? undefined}
          >
            {item.ghi_chu?.trim() ? item.ghi_chu : '—'}
          </div>
        );
      case 'ten_nguoi_tao':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]" title={item.ten_nguoi_tao ?? ''}>
            {item.ten_nguoi_tao?.trim() ? item.ten_nguoi_tao : '—'}
          </span>
        );
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap" title={item.tg_tao}>
            {formatDateTimeShort(item.tg_tao)}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap" title={item.tg_cap_nhat}>
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'tong_buong_nhap_ke_hoach':
        return <span className="text-sm tabular-nums text-right">{formatNumberVN(item.tong_buong_nhap_ke_hoach)}</span>;
      case 'tong_buong_nhap_thuc_te':
        return <span className="text-sm tabular-nums text-right">{formatNumberVN(item.tong_buong_nhap_thuc_te)}</span>;
      case 'ty_le_thu_hoi_ke_hoach':
        return (
          <span className="text-sm tabular-nums">
            {formatNumberVN(Math.round(item.ty_le_thu_hoi_ke_hoach * 10000) / 100)}%
          </span>
        );
      case 'ty_le_thu_hoi_thuc_te':
        return (
          <span className="text-sm tabular-nums">
            {formatNumberVN(Math.round(item.ty_le_thu_hoi_thuc_te * 10000) / 100)}%
          </span>
        );
      case 'quy_cach_dong_thung_ke_hoach':
        return <span className="text-sm tabular-nums">{formatNumberVN(item.quy_cach_dong_thung_ke_hoach)}</span>;
      case 'quy_cach_dong_thung_thuc_te':
        return <span className="text-sm tabular-nums">{formatNumberVN(item.quy_cach_dong_thung_thuc_te)}</span>;
      case 'can_nang_binh_quan_buong': {
        const kpiBq = computeDuBaoSlDongThungKpiFromFarm(item);
        return (
          <span className="text-sm tabular-nums">
            {kpiBq.can_nang_binh_quan_buong != null ? formatNumberVN(kpiBq.can_nang_binh_quan_buong) : '—'}
          </span>
        );
      }
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && allowEdit(item) && (
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
            {onDelete && allowDelete(item) && (
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

  const renderMobileCard = (item: FarmDuBaoSlDongThung, isSelected: boolean) => {
    const kpi = computeDuBaoSlDongThungKpiFromFarm(item);
    const nguoiTao = item.ten_nguoi_tao?.trim() ?? '';
    const phanTram = (v: number) => `${formatNumberVN(Math.round(Number(v) * 10000) / 100)}%`;
    const cot = [
      {
        key: 'kh',
        tieuDe: t('duBaoSlDongThung.card.keHoach'),
        thung: kpi.tong_so_thung_ke_hoach,
        kg: kpi.tong_khoi_luong_ke_hoach,
        tyLe: item.ty_le_thu_hoi_ke_hoach,
      },
      {
        key: 'tt',
        tieuDe: t('duBaoSlDongThung.card.thucTe'),
        thung: kpi.tong_so_thung_thuc_te,
        kg: kpi.tong_khoi_luong_thuc_te,
        tyLe: item.ty_le_thu_hoi_thuc_te,
      },
    ];
    const hasAction = (onEdit && allowEdit(item)) || (onDelete && allowDelete(item));
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_chi_nhanh ?? '—'}</h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
              {formatYmdToDisplay(item.ngay)}
              {nguoiTao ? ` · ${nguoiTao}` : ''}
            </p>
          </div>
          <div className="shrink-0">{renderTrangThaiBadge(item)}</div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 text-sm tabular-nums">
          {cot.map((c) => (
            <div key={c.key} className="space-y-1.5 rounded-lg bg-muted/40 px-2.5 py-2">
              <div className="text-xs font-semibold text-foreground">{c.tieuDe}</div>
              <div>
                <div className="text-xs text-muted-foreground">{t('duBaoSlDongThung.card.tongThung')}</div>
                <div className="font-semibold text-primary">{formatNumberVN(c.thung)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t('duBaoSlDongThung.card.tongKhoiLuong')}</div>
                <div className="font-semibold">{formatNumberVN(c.kg)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t('duBaoSlDongThung.card.tyLeThuHoi')}</div>
                <div className="font-semibold">{phanTram(c.tyLe)}</div>
              </div>
            </div>
          ))}
        </div>
        {hasAction && (
          <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
            {onEdit && allowEdit(item) && (
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
            {onDelete && allowDelete(item) && (
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
    <GenericTable<FarmDuBaoSlDongThung>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      sort={sort}
      onSort={onSort}
      loadingText={t('duBaoSlDongThung.loading')}
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
      emptyTitle={t('duBaoSlDongThung.empty')}
      emptyDescription={t('duBaoSlDongThung.emptyHint')}
    />
  );
};

export default DuBaoSlDongThungList;
