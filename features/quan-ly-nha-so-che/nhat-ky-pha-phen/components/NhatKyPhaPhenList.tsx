import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Edit, Printer, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import type { NhatKyPhaPhen } from '../core/types';
import { formatChenhLech, formatKg, kgCuaLan } from '../utils/hien-thi';

interface Props {
  data: NhatKyPhaPhen[];
  columns: ColumnConfig[];
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  isFetching?: boolean;
  totalRecordsOverride?: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sort?: SortState;
  onSort?: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  onView: (item: NhatKyPhaPhen) => void;
  onEdit?: (item: NhatKyPhaPhen) => void;
  onDelete?: (id: string) => void;
}

/** Đỏ khi pha vượt định mức, xanh khi thiếu. */
const mauChenhLech = (n: number) =>
  n > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : n < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground';

const NhatKyPhaPhenList: React.FC<Props> = ({
  data,
  columns,
  onResizeColumn,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  isFetching,
  totalRecordsOverride,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sort,
  onSort,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);

  const nutSuaXoa = (item: NhatKyPhaPhen, lon: boolean) => (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/quan-ly-nha-so-che/nhat-ky-pha-phen/preview/${item.id}`);
        }}
        className={cn(
          'text-muted-foreground',
          lon
            ? 'h-10 w-10 flex items-center justify-center bg-muted/50 hover:bg-muted rounded-lg transition-all active:scale-90'
            : 'hover:bg-muted p-1.5 rounded-md'
        )}
        title={t('nkpp.in.inPhieu')}
        aria-label={t('nkpp.in.inPhieu')}
      >
        <Printer size={lon ? 16 : 14} />
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className={cn(
            'text-primary',
            lon
              ? 'h-10 w-10 flex items-center justify-center bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90'
              : 'hover:bg-primary/10 p-1.5 rounded-md'
          )}
          title={t('common.edit')}
          aria-label={t('common.edit')}
        >
          <Edit size={lon ? 16 : 14} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className={cn(
            'text-rose-500',
            lon
              ? 'h-10 w-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90'
              : 'hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-md'
          )}
          title={t('common.delete')}
          aria-label={t('common.delete')}
        >
          <Trash2 size={lon ? 16 : 14} />
        </button>
      )}
    </>
  );

  const renderCell = (colId: string, item: NhatKyPhaPhen) => {
    const one = (text: React.ReactNode, className?: string, title?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)} title={title}>
        {text}
      </span>
    );
    if (colId.startsWith('lan_')) {
      const lan = Number(colId.slice(4));
      return one(formatKg(kgCuaLan(item, lan)), 'tabular-nums text-right');
    }
    switch (colId) {
      case 'ngay':
        return one(formatYmdToDisplay(item.ngay), 'tabular-nums font-medium');
      case 'ten_chi_nhanh':
        return one(item.ten_chi_nhanh || '—');
      case 'so_buong_du_thu':
        return one(item.so_buong_du_thu ?? '—', 'tabular-nums text-right');
      case 'tong_thuc_te':
        return one(formatKg(item.tong_thuc_te), 'tabular-nums text-right font-semibold');
      case 'tong_dinh_muc':
        return one(formatKg(item.tong_dinh_muc), 'tabular-nums text-right text-muted-foreground');
      case 'chenh_lech':
        return one(formatChenhLech(item.chenh_lech), cn('tabular-nums text-right', mauChenhLech(item.chenh_lech)));
      case 'so_be_so_che':
        return one(item.so_be_so_che ?? '—', 'tabular-nums text-right');
      case 'ten_nhan_vien_phu_trach':
        return one(item.ten_nhan_vien_phu_trach || '—');
      case 'ghi_chu':
        return one(item.ghi_chu || '—', 'text-muted-foreground', item.ghi_chu ?? undefined);
      case 'actions':
        return <div className="flex items-center justify-end gap-0.5">{nutSuaXoa(item, false)}</div>;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: NhatKyPhaPhen, isSelected: boolean) => {
    const nhan = (label: string, value: React.ReactNode, className?: string) => (
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn('text-sm font-medium truncate tabular-nums', className)}>{value}</div>
      </div>
    );
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView(item)}
        onKeyDown={(e) => e.key === 'Enter' && onView(item)}
        className={cn(
          'bg-card rounded-xl border p-3.5 shadow-sm transition-all',
          isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
        )}
      >
        <h4 className="text-sm font-semibold truncate">
          {formatYmdToDisplay(item.ngay)}
          {item.ten_chi_nhanh ? ` · ${item.ten_chi_nhanh}` : ''}
        </h4>
        <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5">
          {nhan(t('nkpp.col.tongPhen'), formatKg(item.tong_thuc_te))}
          {nhan(t('nkpp.col.dinhMuc'), formatKg(item.tong_dinh_muc))}
          {nhan(t('nkpp.col.chenhLech'), formatChenhLech(item.chenh_lech), mauChenhLech(item.chenh_lech))}
        </div>
        {item.ten_nhan_vien_phu_trach && (
          <p className="text-xs text-muted-foreground mt-1.5 truncate">{item.ten_nhan_vien_phu_trach}</p>
        )}
        <div className="flex items-center justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
          {nutSuaXoa(item, true)}
        </div>
      </div>
    );
  };

  return (
    <GenericTable<NhatKyPhaPhen>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('nkpp.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sort={sort}
      onSort={onSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('nkpp.empty')}
      emptyDescription={t('nkpp.emptyHint')}
    />
  );
};

export default NhatKyPhaPhenList;
