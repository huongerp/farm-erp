import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import type { DotKiemKe } from '../core/types';
import { getTrangThaiDotLabel } from '../core/constants';
import { useKiemKeTaiSanStore } from '../store/useKiemKeTaiSanStore';

interface Props {
  data: DotKiemKe[];
  isLoading: boolean;
  onView?: (item: DotKiemKe) => void;
  onEdit?: (item: DotKiemKe) => void;
  onDelete?: (item: DotKiemKe) => void;
  showActions?: boolean;
}

const DotKiemKeTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete, showActions = true }) => {
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
  } = useKiemKeTaiSanStore();

  const renderTrangThaiBadge = (status: DotKiemKe['trang_thai']) => {
    const variant =
      status === 'Hoàn thành'
        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
        : status === 'Đang kiểm kê'
          ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
          : 'bg-muted text-muted-foreground border-border';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variant}`}>
        {getTrangThaiDotLabel(status)}
      </span>
    );
  };

  const renderCell = (colId: string, item: DotKiemKe) => {
    switch (colId) {
      case 'ma_dot':
        return <span className="font-medium text-sm">{item.ma_dot}</span>;
      case 'ten_dot':
        return <span className="text-sm text-foreground line-clamp-2">{item.ten_dot || '—'}</span>;
      case 'ngay_bat_dau':
      case 'ngay_ket_thuc':
        return (
          <span className="text-sm tabular-nums">{formatDate(item[colId as keyof DotKiemKe] as string)}</span>
        );
      case 'trang_thai':
        return renderTrangThaiBadge(item.trang_thai);
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
            {onEdit && (item.trang_thai === 'Nháp' || item.trang_thai === 'Đang kiểm kê') && (
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
            {onDelete && (item.trang_thai === 'Nháp' || item.trang_thai === 'Đang kiểm kê') && (
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
        return <span className="text-sm">{String(item[colId as keyof DotKiemKe] ?? '—')}</span>;
    }
  };

  const handleRowClick = onView ?? onEdit;
  const renderMobileCard = (item: DotKiemKe, isSelected: boolean) => (
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
    </div>
  );

  return (
    <GenericTable<DotKiemKe>
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
      loadingText={t('kiemKeTaiSan.loading')}
      emptyTitle={t('kiemKeTaiSan.empty')}
      emptyDescription={t('kiemKeTaiSan.emptyHint')}
    />
  );
};

export default DotKiemKeTable;
