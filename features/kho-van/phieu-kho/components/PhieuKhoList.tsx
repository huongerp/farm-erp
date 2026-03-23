import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: PhieuKho[];
  loai: LoaiPhieuKhoTab;
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: PhieuKho) => void;
  onDelete?: (id: string) => void;
  onView?: (item: PhieuKho) => void;
  /** Nếu có: chỉ hiển thị nút Sửa khi canEditItem(item) === true. */
  canEditItem?: (item: PhieuKho) => boolean;
}

const PhieuKhoList: React.FC<Props> = ({
  data,
  loai,
  columns,
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
  canEditItem,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(() => {
    const base = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);
    let out = base;
    if (loai !== 'chuyen') out = out.filter((c) => c.id !== 'ten_kho_den');
    if (loai !== 'nhap') out = out.filter((c) => c.id !== 'ten_nha_cung_cap');
    if (loai !== 'xuat') out = out.filter((c) => c.id !== 'ten_khach_hang');
    return out;
  }, [columns, loai]);

  const getColumnLabel = (col: ColumnConfig) => {
    if (col.id === 'ten_kho') return loai === 'nhap' ? t('phieuKho.form.warehouseTo') : t('phieuKho.form.warehouseFrom');
    if (col.id === 'ten_kho_den') return t('phieuKho.form.warehouseTo');
    return col.label;
  };

  const columnsForTable = useMemo(
    () => visibleColumns.map((col) => ({ ...col, label: getColumnLabel(col) })),
    [visibleColumns, loai, t]
  );

  const renderStatusBadge = (item: PhieuKho) => {
    if (item.trang_thai === 'Chờ duyệt') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {t('phieuKho.status.pending')}
        </span>
      );
    }
    if (item.trang_thai === 'Đã duyệt') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          {t('phieuKho.status.approved')}
        </span>
      );
    }
    if (item.trang_thai === 'Không duyệt') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          {t('phieuKho.status.rejected')}
        </span>
      );
    }
    return null;
  };

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
      case 'tong_so_dong':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {item.tong_so_dong != null ? formatNumberVN(item.tong_so_dong, { maxFractionDigits: 0 }) : '—'}
          </span>
        );
      case 'tong_tien':
        return (
          <span className="text-sm font-medium text-foreground tabular-nums">
            {item.tong_tien != null ? formatNumberVN(item.tong_tien) : '—'}
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

  const renderMobileCard = (item: PhieuKho, isSelected: boolean) => (
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
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
          {item.so_phieu}
        </span>
        {renderStatusBadge(item)}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{item.ngay} · {item.ten_kho ?? '—'}</div>
      {loai === 'chuyen' && item.ten_kho_den && (
        <div className="text-xs text-muted-foreground mb-1">→ {item.ten_kho_den}</div>
      )}
      {loai === 'nhap' && item.ten_nha_cung_cap && (
        <div className="text-xs text-muted-foreground mb-1">{item.ten_nha_cung_cap}</div>
      )}
      {loai === 'xuat' && item.ten_khach_hang && (
        <div className="text-xs text-muted-foreground mb-1">{item.ten_khach_hang}</div>
      )}
      {(item.ten_nguoi_tao || item.tg_tao) && (
        <div className="text-xs text-muted-foreground mb-1">
          {[item.ten_nguoi_tao, formatDateShort(item.tg_tao)].filter(Boolean).join(' · ') || '—'}
        </div>
      )}
      <div className="font-medium tabular-nums text-sm text-foreground mb-2">
        {item.tong_tien != null ? formatNumberVN(item.tong_tien) : '—'}
      </div>
      {item.mo_ta && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.mo_ta}</p>
      )}
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>
        <div className="flex gap-1">
          {onEdit && (!canEditItem || canEditItem(item)) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg"
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
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
              aria-label={t('common.delete')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable<PhieuKho>
      data={data}
      columns={columnsForTable}
      isLoading={isLoading}
      loadingText={t('phieuKho.loading')}
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
      emptyTitle={t('phieuKho.empty')}
      emptyDescription={t('phieuKho.emptyHint')}
    />
  );
};

export default PhieuKhoList;
