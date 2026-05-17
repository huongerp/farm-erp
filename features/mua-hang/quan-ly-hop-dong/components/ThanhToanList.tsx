import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { HopDongChiTietEnriched } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';

interface Props {
  data: HopDongChiTietEnriched[];
  columns: ColumnConfig[];
  chiNhanhList: Branch[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: HopDongChiTietEnriched) => void;
  onDelete?: (item: HopDongChiTietEnriched) => void;
  onView?: (item: HopDongChiTietEnriched) => void;
}

const ThanhToanList: React.FC<Props> = ({
  data,
  columns,
  chiNhanhList,
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

  const cnMap = useMemo(() => {
    const m: Record<string, string> = {};
    chiNhanhList.forEach((b) => {
      m[b.id] = b.ten_chi_nhanh;
    });
    return m;
  }, [chiNhanhList]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderCell = (colId: string, item: HopDongChiTietEnriched) => {
    switch (colId) {
      case 'ngay':
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {item.ngay ? formatDateShort(item.ngay) : '—'}
          </span>
        );
      case 'ma_hop_dong':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.ma_hop_dong ?? '—'}
          </span>
        );
      case 'ten_dot':
        return <span className="text-sm text-foreground truncate block">{item.ten_dot ?? '—'}</span>;
      case 'so_tien':
        return (
          <span className="text-sm tabular-nums font-medium">
            {formatNumberVN(item.so_tien != null ? Number(item.so_tien) : null)}
          </span>
        );
      case 'so_cay_thuc_nhan':
        return (
          <span className="text-sm tabular-nums">
            {formatNumberVN(item.so_cay_thuc_nhan != null ? Number(item.so_cay_thuc_nhan) : null)}
          </span>
        );
      case 'ten_chi_nhanh':
        return (
          <span className="text-sm text-muted-foreground">
            {item.id_chi_nhanh ? (cnMap[item.id_chi_nhanh] ?? item.id_chi_nhanh) : '—'}
          </span>
        );
      case 'ten_nha_cung_cap':
        return <span className="text-sm text-muted-foreground">{item.ten_nha_cung_cap ?? '—'}</span>;
      case 'ghi_chu':
        return (
          <span className="text-sm text-muted-foreground truncate block max-w-[160px]" title={item.ghi_chu ?? ''}>
            {item.ghi_chu ?? '—'}
          </span>
        );
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
                  onDelete(item);
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

  const renderMobileCard = (item: HopDongChiTietEnriched, isSelected: boolean) => (
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
          {item.ma_hop_dong ?? '—'}
        </span>
        <span className="text-xs text-muted-foreground">{item.ngay ? formatDateShort(item.ngay) : '—'}</span>
      </div>
      <div className="font-medium text-foreground text-sm mb-1">{item.ten_dot ?? '—'}</div>
      <div className="text-xs text-muted-foreground mb-2">{item.ten_nha_cung_cap ?? '—'}</div>
      <div className="text-xs text-muted-foreground tabular-nums space-y-0.5 mb-2">
        <div>
          {t('hopDong.form.ctSoTien')}: {formatNumberVN(item.so_tien != null ? Number(item.so_tien) : null)} ·{' '}
          {t('hopDong.form.ctSoCay')}:{' '}
          {formatNumberVN(item.so_cay_thuc_nhan != null ? Number(item.so_cay_thuc_nhan) : null)}
        </div>
        <div>
          {t('hopDong.form.ctChiNhanh')}:{' '}
          {item.id_chi_nhanh ? (cnMap[item.id_chi_nhanh] ?? item.id_chi_nhanh) : '—'}
        </div>
      </div>
      <div className="flex justify-end gap-1 pt-2 border-t border-border">
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
              onDelete(item);
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
    <GenericTable<HopDongChiTietEnriched>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('hopDong.loading')}
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
      emptyTitle={t('hopDong.thanhToan.empty')}
      emptyDescription={t('hopDong.thanhToan.emptyHint')}
    />
  );
};

export default ThanhToanList;
