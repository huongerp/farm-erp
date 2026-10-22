import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, FileText, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { DonDatHang } from '../core/types';
import { TRANG_THAI_KEY, STATUS_VARIANTS } from '../core/constants';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: DonDatHang[];
  columns: ColumnConfig[];
  /** Cho phép kéo đổi bề rộng cột — truyền `resizeColumn` của store. */
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  isFetching?: boolean;
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

const DonDatHangList: React.FC<Props> = ({
  data,
  columns,
  onResizeColumn,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  isFetching,
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
        'inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium border',
        STATUS_VARIANTS[item.trang_thai] ?? 'bg-muted text-muted-foreground border-border'
      )}
    >
      {t(`donDatHang.status.${TRANG_THAI_KEY[item.trang_thai as keyof typeof TRANG_THAI_KEY] ?? 'pending'}`)}
    </span>
  );

  const renderCell = (colId: string, item: DonDatHang) => {
    switch (colId) {
      case 'so_po':
        return (
          <span className="inline-block max-w-full truncate whitespace-nowrap font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.so_po}
          </span>
        );
      case 'so_phieu_de_xuat':
        return item.so_phieu_de_xuat?.trim() ? (
          <span className="inline-block max-w-full truncate whitespace-nowrap font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border" title={item.so_phieu_de_xuat}>
            {item.so_phieu_de_xuat}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      case 'ngay_dat':
        return <span className="block truncate whitespace-nowrap text-sm text-muted-foreground">{item.ngay_dat}</span>;
      case 'ngay_giao_dk':
        return <span className="block truncate whitespace-nowrap text-sm text-muted-foreground">{item.ngay_giao_dk}</span>;
      case 'ten_nha_cung_cap':
        return <span className="block truncate whitespace-nowrap text-sm text-muted-foreground">{item.ten_nha_cung_cap ?? '—'}</span>;
      case 'ten_kho_nhan':
        return <span className="block truncate whitespace-nowrap text-sm text-muted-foreground">{item.ten_kho_nhan ?? '—'}</span>;
      case 'so_dong_hang':
        return <span className="block truncate whitespace-nowrap text-right tabular-nums text-sm text-muted-foreground">{item.so_dong_hang != null ? formatNumberVN(item.so_dong_hang) : '—'}</span>;
      case 'tong_tien':
        return <span className="block truncate whitespace-nowrap text-right tabular-nums text-sm font-medium text-foreground">{item.tong_tien != null ? formatNumberVN(item.tong_tien) : '—'}</span>;
      case 'ten_nguoi_dat':
        return <span className="block truncate whitespace-nowrap text-sm text-muted-foreground">{item.ten_nguoi_dat ?? '—'}</span>;
      case 'ten_nguoi_duyet':
        return <span className="block truncate whitespace-nowrap text-sm text-muted-foreground">{item.ten_nguoi_duyet ?? '—'}</span>;
      case 'ghi_chu':
        return <span className="block truncate whitespace-nowrap text-xs text-muted-foreground" title={item.ghi_chu ?? ''}>{item.ghi_chu?.trim() || '—'}</span>;
      case 'tg_tao':
        return <span className="block truncate whitespace-nowrap text-xs text-muted-foreground">{formatDateShort(item.tg_tao)}</span>;
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'tg_cap_nhat':
        return <span className="block truncate whitespace-nowrap text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>;
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
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="truncate text-sm text-foreground">{item.ten_kho_nhan ?? '—'}</span>
        {item.tong_tien != null && (
          <span className="shrink-0 tabular-nums text-sm font-medium text-foreground">{formatNumberVN(item.tong_tien)}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground mb-2">
        <FileText size={12} className="shrink-0" />
        <span className="shrink-0">{t('donDatHang.form.linkRequest')}:</span>
        <span className="truncate font-mono font-medium text-foreground">{item.so_phieu_de_xuat?.trim() || '—'}</span>
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
    <GenericTable<DonDatHang>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
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
