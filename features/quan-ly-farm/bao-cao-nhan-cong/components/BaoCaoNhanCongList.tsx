import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { FarmBaoCaoNhanCong } from '../core/types';
import { sumSlCongNgay } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: FarmBaoCaoNhanCong[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: FarmBaoCaoNhanCong) => void;
  onDelete?: (id: string) => void;
  onView?: (item: FarmBaoCaoNhanCong) => void;
}

const BaoCaoNhanCongList: React.FC<Props> = ({
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

  const renderCell = (colId: string, item: FarmBaoCaoNhanCong) => {
    switch (colId) {
      case 'ngay':
        return <span className="text-sm font-medium tabular-nums">{formatDateShort(item.ngay)}</span>;
      case 'ten_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{item.ten_chi_nhanh ?? '—'}</span>;
      case 'tong_cong_ngay':
        return <span className="text-sm tabular-nums">{formatNumberVN(sumSlCongNgay(item))}</span>;
      case 'ghi_chu':
        return (
          <div
            className="text-sm text-muted-foreground max-h-28 max-w-[320px] overflow-y-auto whitespace-pre-wrap leading-snug"
            title={item.ghi_chu ?? undefined}
          >
            {item.ghi_chu?.trim() ? item.ghi_chu : '—'}
          </div>
        );
      case 'ten_nguoi_tao':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]" title={item.ten_nguoi_tao ?? ''}>
            {item.ten_nguoi_tao?.trim() ? item.ten_nguoi_tao : '—'}
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

  const renderMobileCard = (item: FarmBaoCaoNhanCong, isSelected: boolean) => (
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
      <div className="text-sm font-semibold tabular-nums mb-1">{formatDateShort(item.ngay)}</div>
      <div className="text-sm text-foreground mb-1">{item.ten_chi_nhanh ?? '—'}</div>
      <div className="text-xs text-muted-foreground mb-1">
        {t('baoCaoNhanCong.store.colTongCongNgay')}: {formatNumberVN(sumSlCongNgay(item))}
      </div>
      {(item.ten_nguoi_tao?.trim() ?? '') !== '' && (
        <div className="text-xs text-muted-foreground mb-1">
          {t('baoCaoNhanCong.store.colNguoiTao')}: {item.ten_nguoi_tao}
        </div>
      )}
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
    <GenericTable<FarmBaoCaoNhanCong>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('baoCaoNhanCong.loading')}
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
      emptyTitle={t('baoCaoNhanCong.empty')}
      emptyDescription={t('baoCaoNhanCong.emptyHint')}
    />
  );
};

export default BaoCaoNhanCongList;
