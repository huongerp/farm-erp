import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { FarmHangHoa } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import TrangThaiHangHoaBadge from './TrangThaiHangHoaBadge';

interface Props {
  data: FarmHangHoa[];
  columns: ColumnConfig[];
  /** Cho phép kéo đổi bề rộng cột — truyền `resizeColumn` của store. */
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: FarmHangHoa) => void;
  onDelete?: (id: string) => void;
  onView?: (item: FarmHangHoa) => void;
}

const HangHoaList: React.FC<Props> = ({
  data,
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

  const renderCell = (colId: string, item: FarmHangHoa) => {
    switch (colId) {
      case 'ma_hang_hoa':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.ma_hang_hoa}
          </span>
        );
      case 'ten_hang_hoa':
        return <span className="font-medium text-foreground">{item.ten_hang_hoa}</span>;
      case 'ten_danh_muc':
        return <span className="text-sm text-muted-foreground">{item.ten_danh_muc ?? '—'}</span>;
      case 'dvt':
        return <span className="text-sm text-muted-foreground">{item.dvt ?? '—'}</span>;
      case 'pham_cap':
        return (
          <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.pham_cap ?? undefined}>
            {item.pham_cap ?? '—'}
          </span>
        );
      case 'don_gia':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatNumberVN(item.don_gia)}
          </span>
        );
      case 'dinh_muc':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {item.dinh_muc != null ? formatNumberVN(item.dinh_muc) : '—'}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]" title={item.mo_ta ?? undefined}>
            {item.mo_ta ?? '—'}
          </span>
        );
      case 'trang_thai':
        return <TrangThaiHangHoaBadge trangThai={item.trang_thai} />;
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

  const renderMobileCard = (item: FarmHangHoa, isSelected: boolean) => {
    const nhan = (label: string, value: React.ReactNode) => (
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold truncate tabular-nums">{value}</div>
      </div>
    );
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
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_hang_hoa}</h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              <span className="font-mono">{item.ma_hang_hoa}</span>
              {item.ten_danh_muc ? ` · ${item.ten_danh_muc}` : ''}
            </p>
          </div>
          <div className="shrink-0">
            <TrangThaiHangHoaBadge trangThai={item.trang_thai} />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {item.don_gia != null && nhan(t('farmHangHoaPhanThuoc.hangHoa.store.priceCol'), formatNumberVN(item.don_gia))}
          {item.dvt && nhan(t('farmHangHoaPhanThuoc.hangHoa.store.unitCol'), item.dvt)}
          {item.pham_cap && nhan(t('farmHangHoaPhanThuoc.hangHoa.store.phamCapCol'), item.pham_cap)}
          {item.dinh_muc != null && nhan(t('farmHangHoaPhanThuoc.hangHoa.store.dinhMucCol'), formatNumberVN(item.dinh_muc))}
        </div>
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
    <GenericTable<FarmHangHoa>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      loadingText={t('farmHangHoaPhanThuoc.hangHoa.loading')}
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
      emptyTitle={t('farmHangHoaPhanThuoc.hangHoa.empty')}
      emptyDescription={t('farmHangHoaPhanThuoc.hangHoa.emptyHint')}
    />
  );
};

export default HangHoaList;
