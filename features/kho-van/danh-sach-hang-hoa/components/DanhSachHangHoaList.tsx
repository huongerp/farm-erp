import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import type { HangHoa } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

/** Tổng định mức (sum ton_toi_thieu) và số kho có định mức, theo hang_hoa_id. */
export type DinhMucSummaryMap = Record<string, { tong: number; soKho: number }>;

interface Props {
  data: HangHoa[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: HangHoa) => void;
  onDelete?: (id: string) => void;
  onView?: (item: HangHoa) => void;
  /** Map hang_hoa_id -> { tong, soKho } để hiển thị cột Tổng định mức (tab Danh sách). */
  dinhMucSummaryMap?: DinhMucSummaryMap;
}

const DanhSachHangHoaList: React.FC<Props> = ({
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
  dinhMucSummaryMap,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderStatusBadge = (item: HangHoa) => (
    <span
      className={
        item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG
          ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap'
          : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap'
      }
    >
      {item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('hangHoa.active') : t('hangHoa.inactive')}
    </span>
  );

  const renderCell = (colId: string, item: HangHoa) => {
    switch (colId) {
      case 'thu_tu':
        return <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{item.thu_tu}</span>;
      case 'ma_hang_hoa':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border whitespace-nowrap">
            {item.ma_hang_hoa}
          </span>
        );
      case 'ten_hang_hoa':
        return (
          <span className="block truncate whitespace-nowrap font-medium text-foreground" title={item.ten_hang_hoa}>
            {item.ten_hang_hoa}
          </span>
        );
      case 'ten_danh_muc':
        return (
          <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.ten_danh_muc ?? ''}>
            {item.ten_danh_muc ?? '—'}
          </span>
        );
      case 'dvt':
        return <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.dvt ?? ''}>{item.dvt ?? '—'}</span>;
      case 'pham_cap':
        return (
          <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.pham_cap ?? undefined}>
            {item.pham_cap ?? '—'}
          </span>
        );
      case 'don_gia':
        return (
          <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
            {formatNumberVN(item.don_gia)}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.mo_ta ?? undefined}>
            {item.mo_ta ?? '—'}
          </span>
        );
      case 'hinh_anh':
        return item.hinh_anh ? (
          <img
            src={item.hinh_anh}
            alt=""
            className="w-10 h-10 rounded-lg object-cover border border-border"
          />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      case 'tong_dinh_muc': {
        const summary = dinhMucSummaryMap?.[item.id];
        return summary && summary.soKho > 0 ? (
          <span className="text-sm tabular-nums whitespace-nowrap" title={`${summary.soKho} kho`}>
            {formatNumberVN(summary.tong)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
      case 'so_kho_dinh_muc': {
        const summary = dinhMucSummaryMap?.[item.id];
        const soKho = summary?.soKho ?? 0;
        return soKho > 0 ? (
          <span className="text-sm tabular-nums whitespace-nowrap">{soKho}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDateTimeShort(item.tg_tao)}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
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
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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

  const renderMobileCard = (item: HangHoa, isSelected: boolean) => (
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
        {renderStatusBadge(item)}
      </div>
      <div className="font-medium text-foreground text-sm mb-1">{item.ten_hang_hoa}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {[item.ten_danh_muc ?? '—', item.dvt ?? '—'].join(' · ')}
      </div>
      {item.don_gia != null && (
        <div className="text-sm tabular-nums text-muted-foreground mb-2">
          {formatNumberVN(item.don_gia)}
        </div>
      )}
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
    <GenericTable<HangHoa>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('hangHoa.loading')}
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
      emptyTitle={t('hangHoa.empty')}
      emptyDescription={t('hangHoa.emptyHint')}
    />
  );
};

export default DanhSachHangHoaList;
