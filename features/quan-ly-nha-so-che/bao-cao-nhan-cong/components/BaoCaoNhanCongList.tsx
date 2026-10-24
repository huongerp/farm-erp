import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  sumSlCongNgay,
  sumSlCongNua,
  sumSlTangCa,
  sumSoGioTc,
  sumTongCongQuyDoiPhieu,
  sumTongGioTangCaTichPhieu,
} from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';

interface Props {
  data: FarmBaoCaoNhanCong[];
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
  /** Sắp xếp do server thực hiện. */
  sort?: SortState;
  onSort?: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: FarmBaoCaoNhanCong) => void;
  onDelete?: (id: string) => void;
  onView?: (item: FarmBaoCaoNhanCong) => void;
  /** Khi trả về false, ẩn nút sửa trên dòng đó (vẫn có thể xem chi tiết). */
  canEditRow?: (item: FarmBaoCaoNhanCong) => boolean;
  canDeleteRow?: (item: FarmBaoCaoNhanCong) => boolean;
}

const BaoCaoNhanCongList: React.FC<Props> = ({
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

  const allowEdit = (item: FarmBaoCaoNhanCong) => canEditRow?.(item) ?? true;
  const allowDelete = (item: FarmBaoCaoNhanCong) => canDeleteRow?.(item) ?? true;

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderTrangThaiBadge = (item: FarmBaoCaoNhanCong) => {
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
        {locked ? t('baoCaoNhanCong.trangThai.khoa') : t('baoCaoNhanCong.trangThai.mo')}
      </span>
    );
  };

  const renderCell = (colId: string, item: FarmBaoCaoNhanCong) => {
    switch (colId) {
      case 'ngay':
        return <span className="text-sm font-medium tabular-nums">{formatDateShort(item.ngay)}</span>;
      case 'ten_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{item.ten_chi_nhanh ?? '—'}</span>;
      case 'trang_thai':
        return renderTrangThaiBadge(item);
      case 'hinh_anh':
        return (
          <span className="text-xs text-muted-foreground" title={t('baoCaoNhanCong.list.photosOnDetailHint')}>
            {t('baoCaoNhanCong.list.photosOnDetail')}
          </span>
        );
      case 'tong_cong_ngay':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSlCongNgay(item))}</span>;
      case 'tong_cong_nua':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSlCongNua(item))}</span>;
      case 'tong_cong_quy_doi':
        return (
          <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(sumTongCongQuyDoiPhieu(item))}</span>
        );
      case 'tong_tang_ca':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSlTangCa(item))}</span>;
      case 'tong_gio_tc':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSoGioTc(item))}</span>;
      case 'tong_gio_tang_ca_tich':
        return (
          <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(sumTongGioTangCaTichPhieu(item))}</span>
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

  const renderMobileCard = (item: FarmBaoCaoNhanCong, isSelected: boolean) => {
    const nguoiTao = item.ten_nguoi_tao?.trim() ?? '';
    const soNguoiTangCa = sumSlTangCa(item);
    const tongGioTangCa = sumTongGioTangCaTichPhieu(item);
    const coTangCa = soNguoiTangCa > 0 || tongGioTangCa > 0;
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
        <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 text-sm tabular-nums">
          <div>
            <div className="text-xs text-muted-foreground">{t('baoCaoNhanCong.card.congQuyDoi')}</div>
            <div className="font-semibold text-primary">{formatNumberVN(sumTongCongQuyDoiPhieu(item))}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('baoCaoNhanCong.card.congNhanCaNgay')}</div>
            <div className="font-semibold">{formatNumberVN(sumSlCongNgay(item))}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('baoCaoNhanCong.card.congNhanNuaNgay')}</div>
            <div className="font-semibold">{formatNumberVN(sumSlCongNua(item))}</div>
          </div>
        </div>
        {coTangCa && (
          <div className="mt-2 pt-2 border-t border-border grid grid-cols-2 gap-x-3 text-sm tabular-nums">
            <div>
              <div className="text-xs text-muted-foreground">{t('baoCaoNhanCong.card.soNguoiTangCa')}</div>
              <div className="font-semibold">{formatNumberVN(soNguoiTangCa)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t('baoCaoNhanCong.card.tongGioTangCa')}</div>
              <div className="font-semibold">{formatNumberVN(tongGioTangCa)}</div>
            </div>
          </div>
        )}
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
    <GenericTable<FarmBaoCaoNhanCong>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      sort={sort}
      onSort={onSort}
      loadingText={t('baoCaoNhanCong.loading')}
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
      emptyTitle={t('baoCaoNhanCong.empty')}
      emptyDescription={t('baoCaoNhanCong.emptyHint')}
    />
  );
};

export default BaoCaoNhanCongList;
