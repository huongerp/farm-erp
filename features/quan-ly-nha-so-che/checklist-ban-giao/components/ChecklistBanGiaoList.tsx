import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import type { PhieuChecklistListItem } from '../core/list-types';
import { TrangThaiBadge } from './Badges';

interface Props {
  data: PhieuChecklistListItem[];
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
  onView: (item: PhieuChecklistListItem) => void;
  onEdit?: (item: PhieuChecklistListItem) => void;
  onDelete?: (id: string) => void;
  emptyDescription?: string;
}

const DemKetQua: React.FC<{ item: PhieuChecklistListItem }> = ({ item }) => {
  const { dat, khongDat } = item.kqThucHien;
  if (dat === 0 && khongDat === 0) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums text-sm">
      {dat > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {dat}✓
        </span>
      )}
      {khongDat > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {khongDat}✗
        </span>
      )}
    </span>
  );
};

const ChecklistBanGiaoList: React.FC<Props> = ({
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
  emptyDescription,
}) => {
  const { t } = useTranslation();
  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);

  const renderCell = (colId: string, item: PhieuChecklistListItem) => {
    const one = (text: React.ReactNode, className?: string, title?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)} title={title}>
        {text}
      </span>
    );
    switch (colId) {
      case 'so_phieu':
        return one(item.so_phieu, 'font-mono font-medium');
      case 'ngay':
        return one(formatYmdToDisplay(item.ngay), 'tabular-nums');
      case 'ca':
        return one(item.ca || '—', 'text-muted-foreground');
      case 'khu_vuc':
        return one(item.khu_vuc || '—', 'text-muted-foreground');
      case 'ten_mau':
        return one(item.ten_mau, undefined, item.ten_mau);
      case 'trang_thai':
        return <TrangThaiBadge value={item.trang_thai} />;
      case 'kq_thuc_hien':
        return <DemKetQua item={item} />;
      case 'ten_ben_thuc_hien':
        return one(item.ten_ben_thuc_hien || '—', 'text-muted-foreground');
      case 'ten_ben_kiem_tra':
        return one(item.ten_ben_kiem_tra || '—', 'text-muted-foreground');
      case 'so_lan_tra_lai':
        return one(item.so_lan_tra_lai > 0 ? item.so_lan_tra_lai : '—', 'tabular-nums text-muted-foreground');
      case 'ten_nguoi_tao':
        return one(item.ten_nguoi_tao || '—', 'text-muted-foreground');
      case 'ten_nguoi_nhan':
        return one(item.ten_nguoi_nhan || '—', 'text-muted-foreground');
      case 'ghi_chu':
        return one(item.ghi_chu || '—', 'text-muted-foreground', item.ghi_chu ?? undefined);
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

  const renderMobileCard = (item: PhieuChecklistListItem, isSelected: boolean) => (
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold truncate">{item.ten_mau}</h4>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{item.so_phieu}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
            {formatYmdToDisplay(item.ngay)}
            {item.khu_vuc ? ` · ${item.khu_vuc}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <TrangThaiBadge value={item.trang_thai} />
          <DemKetQua item={item} />
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable<PhieuChecklistListItem>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('checklistBanGiao.loading')}
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
      emptyTitle={t('checklistBanGiao.empty')}
      emptyDescription={emptyDescription ?? t('checklistBanGiao.emptyHint')}
    />
  );
};

export default ChecklistBanGiaoList;
