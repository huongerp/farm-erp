import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatDate, formatNumberVN, cn } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { useKiemKeCapCaoPT } from '../hooks/use-kiem-ke-cap-cao';
import type { DotKiemKePT } from '../core/types';
import { getTrangThaiDotLabelPT, TRANG_THAI_DOT_SEMANTIC_PT } from '../core/constants';
import { useKiemKeKhoPTStore } from '../store/useKiemKeKhoPTStore';
import type { SortState } from '../../../../store/createGenericStore';

interface Props {
  data: DotKiemKePT[];
  isLoading: boolean;
  /** Đang tải trang mới nhưng đã có dữ liệu cũ — hiện lớp phủ mờ thay vì skeleton. */
  isFetching?: boolean;
  /** Tổng số bản ghi khớp bộ lọc (phân trang ở server). */
  totalRecordsOverride?: number;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sort?: SortState;
  onSort?: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  onView?: (item: DotKiemKePT) => void;
  onEdit?: (item: DotKiemKePT) => void;
  onDelete?: (item: DotKiemKePT) => void;
  showActions?: boolean;
}

const DotKiemKePTList: React.FC<Props> = ({
  data,
  isLoading,
  isFetching,
  totalRecordsOverride,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sort,
  onSort,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { t } = useTranslation();
  // Đợt đã chốt sổ: chỉ cấp cao còn thấy nút Sửa / Xoá.
  const capCao = useKiemKeCapCaoPT();
  const columns = useKiemKeKhoPTStore((s) => s.columns);
  const resizeColumn = useKiemKeKhoPTStore((s) => s.resizeColumn);
  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderTrangThaiBadge = (status: DotKiemKePT['trang_thai']) => (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        getStatusBadgeClass(TRANG_THAI_DOT_SEMANTIC_PT[status])
      )}
    >
      {getTrangThaiDotLabelPT(status, t)}
    </span>
  );

  const renderCell = (colId: string, item: DotKiemKePT) => {
    switch (colId) {
      case 'ma_dot':
        return <span className="font-medium text-sm">{item.ma_dot}</span>;
      case 'ten_dot':
        return <span className="text-sm text-foreground line-clamp-2">{item.ten_dot || '—'}</span>;
      case 'ngay_bat_dau':
      case 'ngay_ket_thuc':
        return (
          <span className="text-sm tabular-nums">{formatDate(item[colId as keyof DotKiemKePT] as string)}</span>
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
            {item.so_hang_hoa != null ? formatNumberVN(item.so_hang_hoa) : '—'}
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
      case 'ten_nguoi_tao':
        return (
          <span className="text-sm text-foreground">
            {item.ten_nguoi_tao || item.ma_nguoi_tao || '—'}
          </span>
        );
      case 'ten_nguoi_phu_trach':
        return (
          <span className="text-sm text-foreground">
            {item.ten_nguoi_phu_trach || item.ma_nguoi_phu_trach || '—'}
          </span>
        );
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_tao)}
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
          <div className="flex items-center justify-center gap-0.5">
            {onEdit && (capCao || item.trang_thai !== 'hoan_thanh') && (
              <Tooltip content={t('common.edit')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                  aria-label={t('common.edit')}
                >
                  <Edit size={14} />
                </button>
              </Tooltip>
            )}
            {onDelete && (capCao || item.trang_thai !== 'hoan_thanh') && (
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return <span className="text-sm">{String(item[colId as keyof DotKiemKePT] ?? '—')}</span>;
    }
  };

  const handleRowClick = onView ?? onEdit;
  const renderMobileCard = (item: DotKiemKePT, isSelected: boolean) => (
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
        {formatDate(item.ngay_bat_dau)} → {formatDate(item.ngay_ket_thuc)} · {item.ten_nguoi_tao || '—'} ·{' '}
        {item.ten_nguoi_phu_trach || '—'}
      </p>
      <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
        <span>{t('kiemKeKhoPT.store.soKhoCol')}: {item.so_kho ?? item.id_kho?.length ?? 0}</span>
        <span>{t('kiemKeKhoPT.store.soHangHoaCol')}: {item.so_hang_hoa ?? '—'}</span>
        {(item.so_lech ?? 0) > 0 && (
          <span className="text-amber-600 dark:text-amber-400">{t('kiemKeKhoPT.store.soLechCol')}: {item.so_lech}</span>
        )}
      </div>
    </div>
  );

  return (
    <GenericTable<DotKiemKePT>
      data={data}
      columns={visibleColumns}
      onResizeColumn={resizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sort={sort}
      onSort={onSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      onRowClick={handleRowClick}
      keyExtractor={(item) => item.id}
      loadingText={t('kiemKeKhoPT.loading')}
      emptyTitle={t('kiemKeKhoPT.empty')}
      emptyDescription={t('kiemKeKhoPT.emptyHint')}
    />
  );
};

export default DotKiemKePTList;
