import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Send } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatCurrency, formatDateTimeShort, cn } from '../../../../lib/utils';
import type { DeXuatChiPhi } from '../core/types';
import { useDeXuatChiPhiStore } from '../store/useDeXuatChiPhiStore';
import Tooltip from '../../../../components/ui/Tooltip';

function getTongTien(item: DeXuatChiPhi): number {
  if (!item.chi_tiet?.length) return 0;
  return item.chi_tiet.reduce((s, d) => s + (d.so_tien ?? 0), 0);
}

interface Props {
  data: DeXuatChiPhi[];
  isLoading: boolean;
  onEdit: (item: DeXuatChiPhi) => void;
  onDelete: (id: string) => void;
  onView: (item: DeXuatChiPhi) => void;
}

const DeXuatChiPhiList: React.FC<Props> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
}) => {
  const { t } = useTranslation();
  const {
    columns,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    sort,
    setSort,
  } = useDeXuatChiPhiStore();

  const renderStatusBadge = (item: DeXuatChiPhi) => {
    if (item.trang_thai === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {t('deXuatChiPhi.status.pending')}
        </span>
      );
    }
    if (item.trang_thai === 1) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          {t('deXuatChiPhi.status.approved')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        {t('deXuatChiPhi.status.rejected')}
      </span>
    );
  };

  const renderLoaiBadge = (item: DeXuatChiPhi) =>
    item.loai === 'thu' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        {t('deXuatChiPhi.loaiThu')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        {t('deXuatChiPhi.loaiChi')}
      </span>
    );

  const renderCell = (colId: string, item: DeXuatChiPhi) => {
    const tongTien = getTongTien(item);
    switch (colId) {
      case 'so_phieu':
        return (
          <span className="font-medium text-foreground text-sm font-mono">{item.so_phieu}</span>
        );
      case 'ngay':
        return (
          <span className="text-sm text-foreground">{item.ngay}</span>
        );
      case 'loai':
        return renderLoaiBadge(item);
      case 'ten_nguoi_de_xuat':
        return (
          <span className="text-sm text-foreground">{item.ten_nguoi_de_xuat || '—'}</span>
        );
      case 'ten_tai_khoan':
        return (
          <span className="text-sm text-muted-foreground">{item.ten_tai_khoan || '—'}</span>
        );
      case 'tong_tien':
        return (
          <span
            className={cn(
              'text-sm tabular-nums font-medium',
              item.loai === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatCurrency(tongTien)}
          </span>
        );
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground">
            {item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '—'}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('common.view')} placement="left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(item);
                }}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-all"
                aria-label={t('common.view')}
              >
                <Send size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.edit')} placement="left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                aria-label={t('common.edit')}
              >
                <Edit size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.delete')} placement="left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                aria-label={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: DeXuatChiPhi, isSelected: boolean) => {
    const tongTien = getTongTien(item);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView(item)}
        onKeyDown={(e) => e.key === 'Enter' && onView(item)}
        className={cn(
          'bg-card rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98]',
          isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Send size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-foreground text-sm truncate font-mono">{item.so_phieu}</h4>
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(item.id)}
                  className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                  aria-label={t('common.select')}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {renderLoaiBadge(item)}
              {renderStatusBadge(item)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
          <div>
            <p className="text-muted-foreground mb-0.5">{t('deXuatChiPhi.columns.nguoiDeXuat')}</p>
            <p className="font-medium text-sm truncate">{item.ten_nguoi_de_xuat || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">{t('deXuatChiPhi.columns.tongTien')}</p>
            <p className={cn('font-medium tabular-nums', item.loai === 'thu' ? 'text-emerald-600' : 'text-rose-600')}>
              {formatCurrency(tongTien)}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2.5 border-t border-border">
          <span className="text-xs text-muted-foreground">{item.ngay}</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
              aria-label={t('common.edit')}
            >
              <Edit size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
              aria-label={t('common.delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <GenericTable<DeXuatChiPhi>
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('deXuatChiPhi.loading')}
      selectedIds={selectedIds}
      onToggleSelection={toggleSelection}
      onToggleAll={toggleAllSelection}
      page={pagination.page}
      pageSize={pagination.pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      sort={sort}
      onSort={setSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('deXuatChiPhi.empty')}
    />
  );
};

export default DeXuatChiPhiList;
