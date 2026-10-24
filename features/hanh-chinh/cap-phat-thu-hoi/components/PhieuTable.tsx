import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import type { PhieuCapPhatThuHoi } from '../core/types';
import { getLoaiPhieuLabel } from '../core/constants';
import { useCapPhatThuHoiStore } from '../store/useCapPhatThuHoiStore';

interface Props {
  data: PhieuCapPhatThuHoi[];
  isLoading: boolean;
  /** Đang tải trang mới nhưng đã có dữ liệu cũ — hiện lớp phủ mờ thay vì skeleton. */
  isFetching?: boolean;
  /** Tổng số bản ghi khớp bộ lọc (phân trang ở server). */
  totalRecordsOverride?: number;
  onView?: (item: PhieuCapPhatThuHoi) => void;
  onEdit?: (item: PhieuCapPhatThuHoi) => void;
  onDelete?: (item: PhieuCapPhatThuHoi) => void;
  showActions?: boolean;
}

const PhieuTable: React.FC<Props> = ({ data, isFetching, totalRecordsOverride, isLoading, onView, onEdit, onDelete, showActions = true }) => {
  const { t } = useTranslation();
  const {
    columns,
    resizeColumn,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    sort,
    setSort,
  } = useCapPhatThuHoiStore();

  const renderLoaiBadge = (loai: PhieuCapPhatThuHoi['loai_phieu']) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      {getLoaiPhieuLabel(loai, t)}
    </span>
  );

  const renderCell = (colId: string, item: PhieuCapPhatThuHoi) => {
    switch (colId) {
      case 'ma_phieu':
        return <span className="font-medium text-foreground text-sm">{item.ma_phieu}</span>;
      case 'loai_phieu':
        return renderLoaiBadge(item.loai_phieu);
      case 'ten_nguoi_giu_truoc':
      case 'ten_nguoi_giu_sau':
      case 'ten_nguoi_thuc_hien':
        return (
          <span className="text-sm text-foreground">
            {String(item[colId as keyof PhieuCapPhatThuHoi] ?? '—')}
          </span>
        );
      case 'ngay_thuc_hien':
        return (
          <span className="text-sm tabular-nums">{formatYmdToDisplay(item.ngay_thuc_hien)}</span>
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
            {onEdit && (
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
            {onDelete && (
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
        return <span className="text-sm">{String(item[colId as keyof PhieuCapPhatThuHoi] ?? '—')}</span>;
    }
  };

  const handleRowClick = onView ?? onEdit;
  const atWarehouse = t('capPhatThuHoi.form.atWarehouse');
  const renderMobileCard = (item: PhieuCapPhatThuHoi, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all cursor-pointer ${
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      }`}
      onClick={() => handleRowClick?.(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick?.(item); } }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground text-sm line-clamp-2">
            {item.ten_nguoi_giu_truoc || atWarehouse} → {item.ten_nguoi_giu_sau || atWarehouse}
          </h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            <span className="font-mono">{item.ma_phieu}</span>
            {` · ${formatYmdToDisplay(item.ngay_thuc_hien)}`}
          </p>
        </div>
        <div className="shrink-0">{renderLoaiBadge(item.loai_phieu)}</div>
      </div>
      {/* Phiếu cấp / thu CÁI GÌ — thông tin chính của phiếu, trước đây thẻ không có. */}
      {item.tai_san_tom_tat && item.tai_san_tom_tat.length > 0 && (
        <p className="mt-2 text-sm text-foreground line-clamp-2">
          <span className="font-semibold">{t('capPhatThuHoi.card.taiSan', { count: item.tai_san_tom_tat.length })}: </span>
          {item.tai_san_tom_tat.slice(0, 3).join(', ')}
          {item.tai_san_tom_tat.length > 3 && (
            <span className="text-muted-foreground"> {t('capPhatThuHoi.card.conLai', { count: item.tai_san_tom_tat.length - 3 })}</span>
          )}
        </p>
      )}
      {item.ten_nguoi_thuc_hien && (
        <p className="mt-2 text-xs text-muted-foreground truncate">
          {t('capPhatThuHoi.store.nguoiThucHienCol')}: <span className="text-foreground">{item.ten_nguoi_thuc_hien}</span>
        </p>
      )}
      {item.ghi_chu && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{item.ghi_chu}</p>}
    </div>
  );

  return (
    <GenericTable<PhieuCapPhatThuHoi>
      data={data}
      columns={columns}
      onResizeColumn={resizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
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
      loadingText={t('capPhatThuHoi.loading')}
      emptyTitle={t('capPhatThuHoi.empty')}
      emptyDescription={t('capPhatThuHoi.emptyHint')}
    />
  );
};

export default PhieuTable;
