import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { FarmThuHoach } from '../core/types';
import { sumKeHoachWeek, sumThucTeWeek } from '../core/utils';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: FarmThuHoach[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: FarmThuHoach) => void;
  onDelete?: (id: string) => void;
  onView?: (item: FarmThuHoach) => void;
}

const ThuHoachList: React.FC<Props> = ({
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

  const renderCell = (colId: string, item: FarmThuHoach) => {
    switch (colId) {
      case 'nam':
        return <span className="text-sm font-medium">{item.nam}</span>;
      case 'tuan':
        return <span className="text-sm text-muted-foreground">{item.tuan}</span>;
      case 'ten_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{item.ten_chi_nhanh ?? '—'}</span>;
      case 'tong_ke_hoach':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumKeHoachWeek(item))}</span>;
      case 'tong_thuc_te':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumThucTeWeek(item))}</span>;
      case 'ghi_chu':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[240px]" title={item.ghi_chu ?? ''}>
            {item.ghi_chu ?? '—'}
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

  const renderMobileCard = (item: FarmThuHoach, isSelected: boolean) => (
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
        <span className="text-sm font-semibold">
          {t('thuHoach.store.colNam')} {item.nam} · {t('thuHoach.store.colTuan')} {item.tuan}
        </span>
      </div>
      <div className="text-sm text-foreground mb-1">{item.ten_chi_nhanh ?? '—'}</div>
      <div className="text-xs text-muted-foreground flex gap-3">
        <span>
          KH: {formatNumberVN(sumKeHoachWeek(item))}
        </span>
        <span>
          TT: {formatNumberVN(sumThucTeWeek(item))}
        </span>
      </div>
      <div className="flex justify-end gap-1 pt-2 border-t border-border mt-2">
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
  );

  return (
    <GenericTable<FarmThuHoach>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('thuHoach.loading')}
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
      emptyTitle={t('thuHoach.empty')}
      emptyDescription={t('thuHoach.emptyHint')}
    />
  );
};

export default ThuHoachList;
