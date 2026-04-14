import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import type { DonDatHang } from '../core/types';
import { TRANG_THAI_KEY } from '../core/constants';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: DonDatHang[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: DonDatHang) => void;
  onDelete?: (id: string) => void;
  onView?: (item: DonDatHang) => void;
  /** Khi có: phân trang theo tổng server, không cắt `data` theo trang cục bộ. */
  serverTotalCount?: number;
}

const STATUS_VARIANTS: Record<string, string> = {
  'Nháp': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  'Chờ duyệt': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Đã gửi': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Đã xác nhận': 'bg-primary/10 text-primary border-primary/20',
  'Đang giao': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  'Đã nhận đủ': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Đã đóng': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Hủy': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const DonDatHangList: React.FC<Props> = ({
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
  serverTotalCount,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderStatusBadge = (item: DonDatHang) => (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        STATUS_VARIANTS[item.trang_thai] ?? 'bg-muted text-muted-foreground border-border'
      )}
    >
      {t(`donDatHang.status.${TRANG_THAI_KEY[item.trang_thai as keyof typeof TRANG_THAI_KEY] ?? 'draft'}`)}
    </span>
  );

  const renderCell = (colId: string, item: DonDatHang) => {
    switch (colId) {
      case 'so_po':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.so_po}
          </span>
        );
      case 'ngay_dat':
        return <span className="text-sm text-muted-foreground">{item.ngay_dat}</span>;
      case 'ngay_giao_dk':
        return <span className="text-sm text-muted-foreground">{item.ngay_giao_dk}</span>;
      case 'ten_nha_cung_cap':
        return <span className="text-sm text-muted-foreground">{item.ten_nha_cung_cap ?? '—'}</span>;
      case 'ten_kho_nhan':
        return <span className="text-sm text-muted-foreground">{item.ten_kho_nhan ?? '—'}</span>;
      case 'ten_nguoi_dat':
        return <span className="text-sm text-muted-foreground">{item.ten_nguoi_dat ?? '—'}</span>;
      case 'trang_thai':
        return renderStatusBadge(item);
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

  const renderMobileCard = (item: DonDatHang, isSelected: boolean) => (
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
          {item.so_po}
        </span>
        {renderStatusBadge(item)}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{item.ngay_dat} · {item.ten_nha_cung_cap ?? '—'}</div>
      <div className="text-sm text-foreground mb-1">{item.ten_kho_nhan ?? '—'}</div>
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
    <GenericTable<DonDatHang>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('donDatHang.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      totalRecordsOverride={serverTotalCount}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('donDatHang.empty')}
      emptyDescription={t('donDatHang.emptyHint')}
    />
  );
};

export default DonDatHangList;
