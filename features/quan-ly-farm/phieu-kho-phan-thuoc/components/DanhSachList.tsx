import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { PhieuKhoPT, LoaiPhieuKhoPT } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: PhieuKhoPT[];
  columns: ColumnConfig[];
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
  serverTotalCount?: number;
}

function LoaiBadge({ loai }: { loai: LoaiPhieuKhoPT }) {
  const { t } = useTranslation();
  const label =
    loai === 'nhập' ? t('phieuKhoPhanThuoc.tabs.nhap') : loai === 'xuất' ? t('phieuKhoPhanThuoc.tabs.xuat') : t('phieuKhoPhanThuoc.tabs.chuyen');
  const cls =
    loai === 'nhập'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : loai === 'xuất'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>{label}</span>
  );
}

const DanhSachList: React.FC<Props> = ({
  data,
  columns,
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
  serverTotalCount,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);

  const renderStatusBadge = (item: PhieuKhoPT) => {
    if (item.trang_thai === 'Chờ duyệt') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {t('phieuKhoPhanThuoc.status.pending')}
        </span>
      );
    }
    if (item.trang_thai === 'Đã duyệt') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          {t('phieuKhoPhanThuoc.status.approved')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        {t('phieuKhoPhanThuoc.status.rejected')}
      </span>
    );
  };

  const renderCell = (colId: string, item: PhieuKhoPT) => {
    switch (colId) {
      case 'loai':
        return <LoaiBadge loai={item.loai} />;
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
        <LoaiBadge loai={item.loai} />
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
    <GenericTable<PhieuKhoPT>
      data={data}
      columns={visibleColumns}
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
