import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatDate, cn } from '../../../../lib/utils';
import type { DotKiemKeKho } from '../core/types';
import { getTrangThaiDotLabel } from '../core/constants';
import { useKiemKeKhoStore } from '../store/useKiemKeKhoStore';

interface Props {
  data: DotKiemKeKho[];
  isLoading: boolean;
  onView?: (item: DotKiemKeKho) => void;
  onEdit?: (item: DotKiemKeKho) => void;
  onDelete?: (item: DotKiemKeKho) => void;
  showActions?: boolean;
}

const DotKiemKeKhoTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete, showActions = true }) => {
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
  } = useKiemKeKhoStore();

  const renderTrangThaiBadge = (status: DotKiemKeKho['trang_thai']) => {
    const variant =
      status === 'hoan_thanh'
        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
        : status === 'dang_kiem_ke'
          ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
          : 'bg-muted text-muted-foreground border-border';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variant}`}>
        {getTrangThaiDotLabel(status, t)}
      </span>
    );
  };

  const renderCell = (colId: string, item: DotKiemKeKho) => {
    switch (colId) {
      case 'ma_dot':
        return <span className="font-medium text-sm">{item.ma_dot}</span>;
      case 'ten_dot':
        return <span className="text-sm text-foreground line-clamp-2">{item.ten_dot || '—'}</span>;
      case 'ngay_bat_dau':
      case 'ngay_ket_thuc':
        return (
          <span className="text-sm tabular-nums">{formatDate(item[colId as keyof DotKiemKeKho] as string)}</span>
        );
      case 'trang_thai':
        return renderTrangThaiBadge(item.trang_thai);
      case 'so_kho':
        return (
          <span className="text-sm tabular-nums font-medium">
            {item.so_kho != null ? item.so_kho : (item.id_kho?.length ?? 0)}
          </span>
        );
      case 'so_hang_hoa':
        return (
          <span className="text-sm tabular-nums">
            {item.so_hang_hoa != null ? item.so_hang_hoa : '—'}
          </span>
        );
      case 'so_lech':
        return (
          <span className={cn(
            'text-sm tabular-nums font-medium',
            (item.so_lech ?? 0) > 0 && 'text-amber-600 dark:text-amber-400'
          )}>
            {item.so_lech != null ? item.so_lech : '—'}
          </span>
        );
      case 'ten_nguoi_phu_trach':
        return (
          <span className="text-sm text-foreground">
            {item.ten_nguoi_phu_trach || item.ma_nguoi_phu_trach || '—'}
          </span>
        );
      case 'ghi_chu':
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
            {item.ghi_chu || '—'}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        if (!showActions) return null;
        return (
          <div className="flex items-center justify-center gap-1">
            {onEdit && item.trang_thai !== 'hoan_thanh' && (
              <Tooltip content={t('common.edit')} placement="left">
                <button
                  type="button"
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
            )}
            {onDelete && item.trang_thai !== 'hoan_thanh' && (
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return <span className="text-sm">{String(item[colId as keyof DotKiemKeKho] ?? '—')}</span>;
    }
  };

  const handleRowClick = onView ?? onEdit;
  const renderMobileCard = (item: DotKiemKeKho, isSelected: boolean) => (
    <div
      className={isSelected ? 'border-primary bg-primary/5' : ''}
      onClick={() => handleRowClick?.(item)}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="font-medium text-sm">{item.ma_dot}</span>
        {renderTrangThaiBadge(item.trang_thai)}
      </div>
      <p className="text-sm text-foreground mt-0.5">{item.ten_dot || '—'}</p>
      <p className="text-xs text-muted-foreground">
        {formatDate(item.ngay_bat_dau)} → {formatDate(item.ngay_ket_thuc)} · {item.ten_nguoi_phu_trach || '—'}
      </p>
      <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
        <span>{t('kiemKeKho.store.soKhoCol')}: {item.so_kho ?? item.id_kho?.length ?? 0}</span>
        <span>{t('kiemKeKho.store.soHangHoaCol')}: {item.so_hang_hoa ?? '—'}</span>
        {(item.so_lech ?? 0) > 0 && (
          <span className="text-amber-600 dark:text-amber-400">{t('kiemKeKho.store.soLechCol')}: {item.so_lech}</span>
        )}
      </div>
    </div>
  );

  return (
    <GenericTable<DotKiemKeKho>
      data={data}
      columns={columns}
      isLoading={isLoading}
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
      onRowClick={handleRowClick}
      keyExtractor={(item) => item.id}
      loadingText={t('kiemKeKho.loading')}
      emptyTitle={t('kiemKeKho.empty')}
      emptyDescription={t('kiemKeKho.emptyHint')}
    />
  );
};

export default DotKiemKeKhoTable;
