import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import type { HopDong } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: HopDong[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: HopDong) => void;
  onDelete?: (id: string) => void;
  onView?: (item: HopDong) => void;
}

const HopDongList: React.FC<Props> = ({
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

  const renderStatus = (item: HopDong) => (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        item.trang_thai === 'Đã thanh lý'
          ? 'bg-muted/50 text-muted-foreground border-border'
          : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
      )}
    >
      {item.trang_thai === 'Đã thanh lý' ? t('hopDong.trangThai.daThanhLy') : t('hopDong.trangThai.dangThucHien')}
    </span>
  );

  const renderCell = (colId: string, item: HopDong) => {
    switch (colId) {
      case 'ma_hop_dong':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.ma_hop_dong}
          </span>
        );
      case 'ten_hop_dong':
        return <span className="text-sm text-foreground truncate block">{item.ten_hop_dong ?? '—'}</span>;
      case 'ngay':
        return <span className="text-sm text-muted-foreground">{item.ngay ?? '—'}</span>;
      case 'ten_nha_cung_cap':
        return <span className="text-sm text-muted-foreground">{item.ten_nha_cung_cap ?? '—'}</span>;
      case 'thanh_tien':
        return (
          <span className="text-sm tabular-nums font-medium">
            {item.thanh_tien != null ? item.thanh_tien.toLocaleString('vi-VN') : '—'}
          </span>
        );
      case 'so_luong_cay':
        return (
          <span className="text-sm tabular-nums">
            {item.so_luong_cay != null ? Number(item.so_luong_cay).toLocaleString('vi-VN') : '—'}
          </span>
        );
      case 'tong_da_thanh_toan':
        return (
          <span className="text-sm tabular-nums font-medium">
            {item.tong_da_thanh_toan != null ? item.tong_da_thanh_toan.toLocaleString('vi-VN') : '—'}
          </span>
        );
      case 'so_dot_thanh_toan':
        return (
          <span className="text-sm tabular-nums text-center inline-block w-full">
            {item.so_dot_thanh_toan != null ? String(item.so_dot_thanh_toan) : '—'}
          </span>
        );
      case 'tong_cay_da_giao':
        return (
          <span className="text-sm tabular-nums">
            {item.tong_cay_da_giao != null ? Number(item.tong_cay_da_giao).toLocaleString('vi-VN') : '—'}
          </span>
        );
      case 'tien_con_lai':
        return (
          <span
            className={cn(
              'text-sm tabular-nums font-medium',
              item.tien_con_lai != null && item.tien_con_lai < 0 && 'text-rose-600'
            )}
          >
            {item.tien_con_lai != null ? item.tien_con_lai.toLocaleString('vi-VN') : '—'}
          </span>
        );
      case 'cay_con_lai':
        return (
          <span
            className={cn(
              'text-sm tabular-nums',
              item.cay_con_lai != null && Number(item.cay_con_lai) < 0 && 'text-rose-600'
            )}
          >
            {item.cay_con_lai != null ? Number(item.cay_con_lai).toLocaleString('vi-VN') : '—'}
          </span>
        );
      case 'trang_thai':
        return renderStatus(item);
      case 'ten_nguoi_tao':
        return <span className="text-sm text-muted-foreground">{item.ten_nguoi_tao ?? '—'}</span>;
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

  const renderMobileCard = (item: HopDong, isSelected: boolean) => (
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
          {item.ma_hop_dong}
        </span>
        {renderStatus(item)}
      </div>
      <div className="font-medium text-foreground text-sm mb-1">{item.ten_hop_dong ?? '—'}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {item.ten_nha_cung_cap ?? '—'} · {item.ngay ?? '—'}
      </div>
      <div className="text-xs text-muted-foreground space-y-0.5 mb-2 tabular-nums">
        <div>
          {t('hopDong.store.thanhTienCol')}:{' '}
          {item.thanh_tien != null ? item.thanh_tien.toLocaleString('vi-VN') : '—'} · {t('hopDong.store.tongDaThanhToanCol')}:{' '}
          {item.tong_da_thanh_toan != null ? item.tong_da_thanh_toan.toLocaleString('vi-VN') : '—'}
        </div>
        <div>
          {t('hopDong.store.tienConLaiCol')}:{' '}
          {item.tien_con_lai != null ? item.tien_con_lai.toLocaleString('vi-VN') : '—'} · {t('hopDong.store.cayConLaiCol')}:{' '}
          {item.cay_con_lai != null ? Number(item.cay_con_lai).toLocaleString('vi-VN') : '—'}
        </div>
      </div>
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
    <GenericTable<HopDong>
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
      emptyTitle={t('hopDong.empty')}
      emptyDescription={t('hopDong.emptyHint')}
    />
  );
};

export default HopDongList;
