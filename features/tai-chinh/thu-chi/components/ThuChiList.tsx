import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatCurrency, formatDate, cn } from '../../../../lib/utils';
import type { ThuChi } from '../../core/types';
import { useThuChiStore } from '../store/useThuChiStore';
import Tooltip from '../../../../components/ui/Tooltip';

interface Props {
  data: ThuChi[];
  isLoading: boolean;
  onEdit: (item: ThuChi) => void;
  onDelete: (id: string) => void;
  onView: (item: ThuChi) => void;
}

const ThuChiList: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onView }) => {
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
  } = useThuChiStore();

  const renderLoaiBadge = (item: ThuChi) => {
    if (item.loai === 'thu') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ArrowDownCircle size={12} /> {t('thuChi.loaiThu')}
        </span>
      );
    }
    if (item.loai === 'chi') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <ArrowUpCircle size={12} /> {t('thuChi.loaiChi')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
        <ArrowRightLeft size={12} /> {t('thuChi.loaiChuyenQuy')}
      </span>
    );
  };

  const renderStatusBadge = (item: ThuChi) => {
    if (item.trang_thai === 'hoan_thanh') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          {t('thuChi.status.hoanThanh')}
        </span>
      );
    }
    if (item.trang_thai === 'cho_duyet') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {t('thuChi.status.choDuyet')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        {t('thuChi.status.huy')}
      </span>
    );
  };

  const renderCell = (colId: string, item: ThuChi) => {
    switch (colId) {
      case 'ma_giao_dich':
        return <span className="font-medium text-foreground text-sm font-mono">{item.ma_giao_dich}</span>;
      case 'ngay_giao_dich':
        return <span className="text-sm text-foreground">{formatDate(item.ngay_giao_dich)}</span>;
      case 'loai':
        return renderLoaiBadge(item);
      case 'ten_tai_khoan':
        return <span className="text-sm text-foreground">{item.ten_tai_khoan || '—'}</span>;
      case 'ten_danh_muc':
        return <span className="text-sm text-muted-foreground">{item.ten_danh_muc || (item.loai === 'chuyen_quy' ? '—' : '—')}</span>;
      case 'so_tien':
        return (
          <span
            className={cn(
              'text-sm tabular-nums font-medium',
              item.loai === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : item.loai === 'chi' ? 'text-rose-600 dark:text-rose-400' : 'text-violet-600 dark:text-violet-400'
            )}
          >
            {formatCurrency(item.so_tien)}
          </span>
        );
      case 'noi_dung':
        return <span className="text-sm text-foreground line-clamp-2 max-w-[240px]">{item.noi_dung || '—'}</span>;
      case 'ten_nhan_vien':
        return <span className="text-sm text-muted-foreground">{item.ten_nhan_vien || '—'}</span>;
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('common.edit')} placement="left">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                aria-label={t('common.edit')}
              >
                <Edit size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.delete')} placement="left">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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

  const renderMobileCard = (item: ThuChi, isSelected: boolean) => (
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
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-semibold text-foreground text-sm font-mono">{item.ma_giao_dich}</span>
        {renderLoaiBadge(item)}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{formatDate(item.ngay_giao_dich)} · {item.ten_tai_khoan}</div>
      <div className={cn('font-medium tabular-nums text-sm mb-2', item.loai === 'thu' ? 'text-emerald-600' : item.loai === 'chi' ? 'text-rose-600' : 'text-violet-600')}>
        {formatCurrency(item.so_tien)}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.noi_dung || '—'}</p>
      <div className="flex justify-between items-center pt-2 border-t border-border">
        {renderStatusBadge(item)}
        <div className="flex gap-1.5">
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg" aria-label={t('common.edit')}>
            <Edit size={14} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg" aria-label={t('common.delete')}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable<ThuChi>
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('common.loading')}
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
      emptyTitle={t('thuChi.empty')}
    />
  );
};

export default ThuChiList;
