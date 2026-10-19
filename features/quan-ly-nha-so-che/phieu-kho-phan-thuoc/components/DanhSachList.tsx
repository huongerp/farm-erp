import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { PhieuKhoPT } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import { LoaiPhieuKhoPTBadge, TrangThaiPhieuKhoPTBadge } from './shared/PhieuKhoPTBadges';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: PhieuKhoPT[];
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
  onEdit?: (item: PhieuKhoPT) => void;
  onDelete?: (id: string) => void;
  onView?: (item: PhieuKhoPT) => void;
  canEditItem?: (item: PhieuKhoPT) => boolean;
  canDeleteItem?: (item: PhieuKhoPT) => boolean;
  serverTotalCount?: number;
}

const DanhSachList: React.FC<Props> = ({
  data,
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

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);

  const renderStatusBadge = (item: PhieuKhoPT) => <TrangThaiPhieuKhoPTBadge trangThai={item.trang_thai} />;

  const renderCell = (colId: string, item: PhieuKhoPT) => {
    switch (colId) {
      case 'loai':
        return <LoaiPhieuKhoPTBadge loai={item.loai} />;
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
          <span className="text-sm text-muted-foreground tabular-nums">{formatNumberVN(item.tong_so_luong ?? 0)}</span>
        );
      case 'tong_tien':
        return (
          <span className="text-sm font-medium text-foreground tabular-nums">{formatNumberVN(item.tong_tien ?? 0)}</span>
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

  const renderMobileCard = (item: PhieuKhoPT, isSelected: boolean) => (
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
        <LoaiPhieuKhoPTBadge loai={item.loai} />
        {renderStatusBadge(item)}
      </div>
      <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border inline-block mb-2">
        {item.so_phieu}
      </span>
      <div className="text-xs text-muted-foreground mb-1">
        {item.ngay} · {item.ten_kho ?? '—'}
      </div>
      {item.loai === 'chuyển' && item.ten_kho_den && (
        <div className="text-xs text-muted-foreground mb-1">→ {item.ten_kho_den}</div>
      )}
      <div className="text-xs text-muted-foreground tabular-nums mb-2">
        {t('phieuKhoPhanThuoc.list.totalItems')}: {formatNumberVN(item.tong_so_dong ?? 0, { maxFractionDigits: 0 })}
      </div>
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
          {onDelete && (!canDeleteItem || canDeleteItem(item)) && (
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
    <GenericTable<PhieuKhoPT>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      isLoading={isLoading}
      isFetching={isFetching}
      loadingText={t('phieuKhoPhanThuoc.loading')}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      totalRecordsOverride={serverTotalCount}
      keyExtractor={(row) => row.id}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      onRowClick={onView}
      emptyTitle={t('phieuKhoPhanThuoc.empty')}
      emptyDescription={t('phieuKhoPhanThuoc.emptyHint')}
    />
  );
};

export default DanhSachList;
