import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import { formatSo } from '../core/so';
import { cacThuoc, tongNuocLit } from '../core/tong-hop';
import type { NhatKyPhunCui } from '../core/types';

interface Props {
  data: NhatKyPhunCui[];
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
  onView: (item: NhatKyPhunCui) => void;
  onEdit?: (item: NhatKyPhunCui) => void;
  onDelete?: (id: string) => void;
}

const NhatKyPhunCuiList: React.FC<Props> = ({
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
  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);

  const nutSuaXoa = (item: NhatKyPhunCui, lon: boolean) => (
    <>
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

  const renderCell = (colId: string, item: NhatKyPhunCui) => {
    const one = (text: React.ReactNode, className?: string, title?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)} title={title}>
        {text}
      </span>
    );
    switch (colId) {
      case 'ngay':
        return one(formatYmdToDisplay(item.ngay), 'tabular-nums font-medium');
      case 'ten_chi_nhanh':
        return one(item.ten_chi_nhanh || '—');
      case 'so_lan':
        return one(item.lan.length, 'tabular-nums text-center');
      case 'cac_thuoc': {
        const v = cacThuoc(item.lan).join(', ');
        return one(v || '—', undefined, v || undefined);
      }
      case 'tong_nuoc':
        return one(item.lan.length ? formatSo(tongNuocLit(item.lan)) : '—', 'tabular-nums text-right');
      case 'ten_nhan_vien_phu_trach':
        return one(item.ten_nhan_vien_phu_trach || '—');
      case 'ghi_chu':
        return one(item.ghi_chu || '—', 'text-muted-foreground', item.ghi_chu ?? undefined);
      case 'ten_nguoi_tao':
        return one(item.ten_nguoi_tao || '—', 'text-muted-foreground');
      case 'actions':
        return <div className="flex items-center justify-end gap-0.5">{nutSuaXoa(item, false)}</div>;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: NhatKyPhunCui, isSelected: boolean) => {
    const thuoc = cacThuoc(item.lan).join(', ');
    const nhan = (label: string, value: React.ReactNode) => (
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
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
        <div className="min-w-0">
          <h4 className="text-sm font-semibold truncate tabular-nums">{formatYmdToDisplay(item.ngay)}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.ten_chi_nhanh || '—'}</p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {nhan(
            t('nkpc.col.soLan'),
            <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
              <Droplets size={12} />
              {item.lan.length}
            </span>
          )}
          {nhan(t('nkpc.col.tongNuoc'), item.lan.length ? formatSo(tongNuocLit(item.lan)) : '—')}
          {thuoc && nhan(t('nkpc.col.cacThuoc'), thuoc)}
          {item.ten_nhan_vien_phu_trach && nhan(t('nkpc.col.nhanSu'), item.ten_nhan_vien_phu_trach)}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
            {nutSuaXoa(item, true)}
          </div>
        )}
      </div>
    );
  };

  return (
    <GenericTable<NhatKyPhunCui>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('nkpc.loading')}
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
      emptyTitle={t('nkpc.empty')}
      emptyDescription={t('nkpc.emptyHint')}
    />
  );
};

export default NhatKyPhunCuiList;
