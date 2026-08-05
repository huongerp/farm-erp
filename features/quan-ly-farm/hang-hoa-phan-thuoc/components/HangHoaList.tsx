import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { FarmHangHoa } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: FarmHangHoa[];
  columns: ColumnConfig[];
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
      case 'don_gia':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatNumberVN(item.don_gia)}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]" title={item.mo_ta ?? undefined}>
            {item.mo_ta ?? '—'}
          </span>
        );
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

  const renderMobileCard = (item: FarmHangHoa, isSelected: boolean) => (
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
          {item.ma_hang_hoa}
        </span>
      </div>
      <div className="font-medium text-foreground text-sm mb-1">{item.ten_hang_hoa}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {item.ten_danh_muc ?? '—'} · {item.dvt ?? '—'}
      </div>
      {item.don_gia != null && (
        <div className="text-sm tabular-nums text-muted-foreground mb-2">{formatNumberVN(item.don_gia)}</div>
      )}
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>
        <div className="flex gap-1">
          {onEdit && (
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
    <GenericTable<FarmHangHoa>
      data={data}
      columns={visibleColumns}
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
