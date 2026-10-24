import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import { getTrangThaiPhieuBadgeClass, trangThaiToI18nKey } from '../core/constants';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: PhieuKho[];
  loai: LoaiPhieuKhoTab;
  columns: ColumnConfig[];
  /** Cho phép kéo đổi bề rộng cột — truyền `resizeColumn` của store. */
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  isFetching?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: PhieuKho) => void;
  onDelete?: (id: string) => void;
  onView?: (item: PhieuKho) => void;
  /** Nếu có: chỉ hiển thị nút Sửa khi canEditItem(item) === true. */
  canEditItem?: (item: PhieuKho) => boolean;
  /** Nếu có: chỉ hiển thị nút Xoá khi canDeleteItem(item) === true. */
  canDeleteItem?: (item: PhieuKho) => boolean;
  /** Phân trang server: tổng bản ghi khớp lọc (khác `data.length` khi `data` chỉ một trang). */
  serverTotalCount?: number;
}

const PhieuKhoList: React.FC<Props> = ({
  data,
  loai,
  columns,
  onResizeColumn,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  isFetching,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
  canEditItem,
  canDeleteItem,
  serverTotalCount,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(() => {
    const base = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);
    let out = base;
    if (loai !== 'chuyen') out = out.filter((c) => c.id !== 'ten_kho_den');
    if (loai !== 'nhap') out = out.filter((c) => c.id !== 'ten_nha_cung_cap' && c.id !== 'so_po_don_dat_hang');
    if (loai !== 'xuat') out = out.filter((c) => c.id !== 'ten_khach_hang');
    return out;
  }, [columns, loai]);

  const columnsForTable = useMemo(() => {
    const getColumnLabel = (col: ColumnConfig) => {
      if (col.id === 'ten_kho') return loai === 'nhap' ? t('phieuKho.form.warehouseTo') : t('phieuKho.form.warehouseFrom');
      if (col.id === 'ten_kho_den') return t('phieuKho.form.warehouseTo');
      return col.label;
    };
    return visibleColumns.map((col) => ({ ...col, label: getColumnLabel(col) }));
  }, [visibleColumns, loai, t]);

  const renderStatusBadge = (item: PhieuKho) => (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        getTrangThaiPhieuBadgeClass(item.trang_thai),
      )}
    >
      {t(`phieuKho.status.${trangThaiToI18nKey(item.trang_thai)}`)}
    </span>
  );

  const renderCell = (colId: string, item: PhieuKho) => {
    switch (colId) {
      case 'so_phieu':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.so_phieu}
          </span>
        );
      case 'ngay':
        return <span className="text-sm text-muted-foreground">{item.ngay}</span>;
      case 'ten_kho':
        return <span className="text-sm text-muted-foreground">{item.ten_kho ?? '—'}</span>;
      case 'ten_kho_den':
        return <span className="text-sm text-muted-foreground">{item.ten_kho_den ?? '—'}</span>;
      case 'ten_nha_cung_cap':
        return <span className="text-sm text-muted-foreground">{item.ten_nha_cung_cap ?? '—'}</span>;
      case 'so_po_don_dat_hang':
        return (
          <span
            className="text-sm text-muted-foreground font-mono whitespace-nowrap"
            title={item.so_po_don_dat_hang ?? undefined}
          >
            {item.so_po_don_dat_hang ?? '—'}
          </span>
        );
      case 'ten_khach_hang':
        return <span className="text-sm text-muted-foreground">{item.ten_khach_hang ?? '—'}</span>;
      case 'ten_nguoi_tao':
        return <span className="text-sm text-muted-foreground">{item.ten_nguoi_tao ?? '—'}</span>;
      case 'tg_tao':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_tao)}</span>;
      case 'mo_ta':
        return <span className="text-xs text-muted-foreground line-clamp-2">{item.mo_ta ?? '—'}</span>;
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'ten_nguoi_duyet':
        return (
          <span className="text-sm text-muted-foreground">
            {item.ten_nguoi_duyet ?? (item.id_nguoi_duyet != null ? `#${item.id_nguoi_duyet}` : '—')}
          </span>
        );
      case 'tong_so_dong':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatNumberVN(item.tong_so_dong ?? 0, { maxFractionDigits: 0 })}
          </span>
        );
      case 'tong_so_luong':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatNumberVN(item.tong_so_luong ?? 0)}
          </span>
        );
      case 'tong_tien':
        return (
          <span className="text-sm font-medium text-foreground tabular-nums">
            {formatNumberVN(item.tong_tien ?? 0)}
          </span>
        );
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (!canEditItem || canEditItem(item)) && (
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
            {onDelete && (!canDeleteItem || canDeleteItem(item)) && (
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

  const renderMobileCard = (item: PhieuKho, isSelected: boolean) => {
    const coSua = !!onEdit && (!canEditItem || canEditItem(item));
    const coXoa = !!onDelete && (!canDeleteItem || canDeleteItem(item));
    const nguoiDuyet = item.ten_nguoi_duyet ?? (item.id_nguoi_duyet != null ? `#${item.id_nguoi_duyet}` : '');
    const doiTac =
      loai === 'nhap' && item.ten_nha_cung_cap
        ? { label: t('phieuKho.store.supplierCol'), value: item.ten_nha_cung_cap }
        : loai === 'xuat' && item.ten_khach_hang
          ? { label: t('phieuKho.store.customerCol'), value: item.ten_khach_hang }
          : null;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView?.(item)}
        onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
        className={cn(
          'bg-card rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98]',
          isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-foreground text-sm truncate min-w-0">{item.so_phieu}</h4>
          <div className="shrink-0">{renderStatusBadge(item)}</div>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {formatYmdToDisplay(item.ngay)} · {item.ten_kho ?? '—'}
          {loai === 'chuyen' && item.ten_kho_den ? ` → ${item.ten_kho_den}` : ''}
        </p>
        {doiTac && (
          <p className="mt-2 text-sm text-foreground truncate">
            <span className="text-muted-foreground">{doiTac.label}: </span>
            {doiTac.value}
          </p>
        )}
        {loai === 'nhap' && item.so_po_don_dat_hang && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {t('phieuKho.store.poCol')}: <span className="font-mono text-foreground">{item.so_po_don_dat_hang}</span>
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2 text-sm tabular-nums">
          <span className="min-w-0 truncate">
            <span className="text-xs text-muted-foreground">{t('phieuKho.list.totalItems')}: </span>
            <span className="font-semibold">{formatNumberVN(item.tong_so_dong ?? 0, { maxFractionDigits: 0 })}</span>
          </span>
          <span className="shrink-0">
            <span className="text-xs text-muted-foreground">{t('phieuKho.list.totalValue')}: </span>
            <span className="font-semibold">{formatNumberVN(item.tong_tien ?? 0)}</span>
          </span>
        </div>
        {(item.ten_nguoi_tao || nguoiDuyet) && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {[
              item.ten_nguoi_tao ? `${t('phieuKho.store.creatorCol')}: ${item.ten_nguoi_tao}` : '',
              nguoiDuyet ? `${t('phieuKho.store.approverCol')}: ${nguoiDuyet}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {item.mo_ta && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{item.mo_ta}</p>}
        {(coSua || coXoa) && (
          <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
            {coSua && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
                className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                aria-label={t('common.edit')}
              >
                <Edit size={16} />
              </button>
            )}
            {coXoa && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item.id);
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
    <GenericTable<PhieuKho>
      data={data}
      columns={columnsForTable}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      loadingText={t('phieuKho.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      totalRecordsOverride={serverTotalCount}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('phieuKho.empty')}
      emptyDescription={t('phieuKho.emptyHint')}
    />
  );
};

export default PhieuKhoList;
