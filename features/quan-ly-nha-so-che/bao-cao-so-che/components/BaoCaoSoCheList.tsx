import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { FarmBaoCaoSoChe } from '../core/types';
import { sumTienThuongKpiThuong } from '../core/types';
import { phamCapTongKgRow } from '../core/pham-cap-derived';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';

interface Props {
  data: FarmBaoCaoSoChe[];
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
  onEdit?: (item: FarmBaoCaoSoChe) => void;
  onDelete?: (id: string) => void;
  onView?: (item: FarmBaoCaoSoChe) => void;
  canEditRow?: (item: FarmBaoCaoSoChe) => boolean;
  canDeleteRow?: (item: FarmBaoCaoSoChe) => boolean;
}

const BaoCaoSoCheList: React.FC<Props> = ({
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

  const allowEdit = (item: FarmBaoCaoSoChe) => canEditRow?.(item) ?? true;
  const allowDelete = (item: FarmBaoCaoSoChe) => canDeleteRow?.(item) ?? true;

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderTrangThaiBadge = (item: FarmBaoCaoSoChe) => {
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
        {locked ? t('baoCaoSoChe.trangThai.khoa') : t('baoCaoSoChe.trangThai.mo')}
      </span>
    );
  };

  const renderCell = (colId: string, item: FarmBaoCaoSoChe) => {
    const rowIndex = data.indexOf(item);
    const stt = (page - 1) * pageSize + rowIndex + 1;

    switch (colId) {
      case 'stt':
        return <span className="text-sm font-medium tabular-nums text-muted-foreground">{stt}</span>;
      case 'ngay':
        return <span className="text-sm font-medium tabular-nums">{formatDateShort(item.ngay)}</span>;
      case 'ten_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{item.ten_chi_nhanh ?? '—'}</span>;
      case 'trang_thai':
        return renderTrangThaiBadge(item);
      case 'don_vi_tinh':
        return <span className="text-sm tabular-nums">{item.don_vi_tinh?.trim() ? item.don_vi_tinh : '—'}</span>;
      case 'sl_buong_ton_dau_ngay':
        return <span className="text-sm tabular-nums">{formatNumberVN(item.sl_buong_ton_dau_ngay)}</span>;
      case 'tong_buong_thu_hoach':
        return <span className="text-sm tabular-nums">{formatNumberVN(item.tong_buong_thu_hoach)}</span>;
      case 'tong_buong_khong_so_che':
        return <span className="text-sm tabular-nums">{formatNumberVN(item.tong_buong_khong_so_che)}</span>;
      case 'tong_buong_so_che':
        return <span className="text-sm tabular-nums">{formatNumberVN(item.tong_buong_so_che)}</span>;
      case 'sl_buong_ton_cuoi_ngay':
        return <span className="text-sm tabular-nums">{formatNumberVN(item.sl_buong_ton_cuoi_ngay)}</span>;
      case 'danh_gia_loi_qc_pct': {
        const qc = item.danh_gia_loi_qc_pct;
        return (
          <span className={cn('text-sm tabular-nums', qc > 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-muted-foreground')}>
            {formatNumberVN(qc)}%
          </span>
        );
      }
      case 'tong_thung_pham_cap': {
        const total = (item.pham_cap ?? []).reduce((s, r) => s + (r.so_thung ?? 0), 0);
        return <span className="text-sm tabular-nums">{formatNumberVN(total)}</span>;
      }
      case 'tong_kg_pham_cap': {
        const totalKg = (item.pham_cap ?? []).reduce((s, r) => s + phamCapTongKgRow(r), 0);
        return <span className="text-sm tabular-nums">{formatNumberVN(totalKg)}</span>;
      }
      case 'nang_suat_thuc_te': {
        const kpiRow = (item.kpi_thuong ?? []).find((k) =>
          k.ten_hang_muc?.includes('Năng suất')
        );
        const val = kpiRow?.thuc_te?.trim();
        return <span className="text-sm tabular-nums">{val ? val : '—'}</span>;
      }
      case 'tong_thuong_kpi':
        return (
          <span className="text-sm tabular-nums font-semibold text-primary">
            {formatNumberVN(sumTienThuongKpiThuong(item.kpi_thuong ?? []))}
          </span>
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

  const renderMobileCard = (item: FarmBaoCaoSoChe, isSelected: boolean) => {
    const tongKg = (item.pham_cap ?? []).reduce((s, r) => s + phamCapTongKgRow(r), 0);
    const tongThuong = sumTienThuongKpiThuong(item.kpi_thuong ?? []);
    const qc = item.danh_gia_loi_qc_pct;
    const nguoiTao = item.ten_nguoi_tao?.trim() ?? '';
    const soBuong: Array<[string, number]> = [
      [t('baoCaoSoChe.store.colTonDau'), item.sl_buong_ton_dau_ngay],
      [t('baoCaoSoChe.store.colThuHoach'), item.tong_buong_thu_hoach],
      [t('baoCaoSoChe.store.colKhongSoChe'), item.tong_buong_khong_so_che],
      [t('baoCaoSoChe.store.colSoChe'), item.tong_buong_so_che],
      [t('baoCaoSoChe.store.colTonCuoi'), item.sl_buong_ton_cuoi_ngay],
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
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">{t('baoCaoSoChe.card.soBuong')}</p>
          <div className="mt-1 grid grid-cols-3 gap-x-3 gap-y-1.5 text-sm tabular-nums">
            {soBuong.map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-semibold">{formatNumberVN(value)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border grid grid-cols-3 gap-x-3 text-sm tabular-nums">
          <div>
            <div className="text-xs text-muted-foreground">{t('baoCaoSoChe.card.tongKg')}</div>
            <div className="font-semibold">{formatNumberVN(tongKg)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('baoCaoSoChe.card.loiQc')}</div>
            <div className={cn('font-semibold', qc > 0 && 'text-rose-600 dark:text-rose-400')}>
              {formatNumberVN(qc)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('baoCaoSoChe.card.thuongKpi')}</div>
            <div className="font-semibold text-primary">{formatNumberVN(tongThuong)}</div>
          </div>
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
    <GenericTable<FarmBaoCaoSoChe>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      sort={sort}
      onSort={onSort}
      loadingText={t('baoCaoSoChe.loading')}
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
      emptyTitle={t('baoCaoSoChe.empty')}
      emptyDescription={t('baoCaoSoChe.emptyHint')}
    />
  );
};

export default BaoCaoSoCheList;
