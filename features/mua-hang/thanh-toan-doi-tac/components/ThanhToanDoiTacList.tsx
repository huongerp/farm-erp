import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { ThanhToanDoiTac } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: ThanhToanDoiTac[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: ThanhToanDoiTac) => void;
  onDelete?: (id: string) => void;
  onView?: (item: ThanhToanDoiTac) => void;
}

const ThanhToanDoiTacList: React.FC<Props> = ({
  data,
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
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderStatusBadge = (item: ThanhToanDoiTac) => (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', !item.mau_trang_thai && 'bg-muted/50 text-muted-foreground border-border')}
      style={
        item.mau_trang_thai
          ? { backgroundColor: `${item.mau_trang_thai}20`, borderColor: item.mau_trang_thai, color: item.mau_trang_thai }
          : undefined
      }
    >
      {item.ten_trang_thai ?? '—'}
    </span>
  );

  const renderCell = (colId: string, item: ThanhToanDoiTac) => {
    switch (colId) {
      case 'so_phieu':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.so_phieu}
          </span>
        );
      case 'hang_muc_thanh_toan':
        return <span className="text-sm text-foreground truncate block">{item.hang_muc_thanh_toan}</span>;
      case 'ngay_xu_ly':
        return <span className="text-sm text-muted-foreground">{item.ngay_xu_ly ?? '—'}</span>;
      case 'ngay':
        return <span className="text-sm text-muted-foreground">{item.ngay}</span>;
      case 'ten_don_vi':
        return <span className="text-sm text-muted-foreground">{item.ten_don_vi ?? '—'}</span>;
      case 'ten_nhom':
        return <span className="text-sm text-muted-foreground">{item.ten_nhom ?? '—'}</span>;
      case 'ten_doi_tac':
        return <span className="text-sm text-muted-foreground">{item.ten_doi_tac ?? '—'}</span>;
      case 'ten_trang_thai':
        return renderStatusBadge(item);
      case 'so_tien':
        return (
          <span className="text-sm tabular-nums font-medium">
            {formatNumberVN(item.so_tien)}
          </span>
        );
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1.5 text-primary hover:bg-primary/10 rounded-md" title={t('common.edit')} aria-label={t('common.edit')}>
                <Edit size={14} />
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md" title={t('common.delete')} aria-label={t('common.delete')}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: ThanhToanDoiTac, isSelected: boolean) => (
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
      <div className="font-medium text-foreground text-sm mb-1">{item.hang_muc_thanh_toan}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {[item.ten_nhom, item.ten_doi_tac].filter(Boolean).join(' · ') || '—'} · {item.ngay}
      </div>
      <div className="text-sm tabular-nums font-medium mb-2">
        {formatNumberVN(item.so_tien)}
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>
        <div className="flex gap-1">
          {onEdit && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg" aria-label={t('common.edit')}>
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg" aria-label={t('common.delete')}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable<ThanhToanDoiTac>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('thanhToanDoiTac.loading')}
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
      emptyTitle={t('thanhToanDoiTac.empty')}
      emptyDescription={t('thanhToanDoiTac.emptyHint')}
    />
  );
};

export default ThanhToanDoiTacList;
