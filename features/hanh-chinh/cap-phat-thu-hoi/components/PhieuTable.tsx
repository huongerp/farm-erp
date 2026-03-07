import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import type { PhieuCapPhatThuHoi } from '../core/types';
import { getLoaiPhieuLabel } from '../core/constants';
import { useCapPhatThuHoiStore } from '../store/useCapPhatThuHoiStore';

interface Props {
  data: PhieuCapPhatThuHoi[];
  isLoading: boolean;
  onView?: (item: PhieuCapPhatThuHoi) => void;
  onEdit?: (item: PhieuCapPhatThuHoi) => void;
  onDelete?: (item: PhieuCapPhatThuHoi) => void;
  showActions?: boolean;
}

const PhieuTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete, showActions = true }) => {
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
  } = useCapPhatThuHoiStore();

  const renderLoaiBadge = (loai: PhieuCapPhatThuHoi['loai_phieu']) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      {getLoaiPhieuLabel(loai, t)}
    </span>
  );

  const renderCell = (colId: string, item: PhieuCapPhatThuHoi) => {
    switch (colId) {
      case 'loai_phieu':
        return renderLoaiBadge(item.loai_phieu);
      case 'ten_tai_san':
        return (
          <div className="flex flex-col gap-0.5 min-w-[140px]">
            <span className="font-medium text-foreground text-sm">{item.ten_tai_san || item.ma_tai_san || '—'}</span>
            {item.ma_tai_san && item.ten_tai_san && (
              <span className="text-xs text-muted-foreground">{item.ma_tai_san}</span>
            )}
          </div>
        );
      case 'ten_noi_luu_truoc':
      case 'ten_noi_luu_sau':
        return <span className="text-sm text-foreground">{item[colId as keyof PhieuCapPhatThuHoi] || '—'}</span>;
      case 'ten_nguoi_giu_truoc':
      case 'ten_nguoi_giu_sau':
      case 'ten_nguoi_thuc_hien':
        return (
          <span className="text-sm text-foreground">
            {item[colId as keyof PhieuCapPhatThuHoi] || '—'}
          </span>
        );
      case 'ngay_thuc_hien':
        return (
          <span className="text-sm tabular-nums">{formatDate(item.ngay_thuc_hien)}</span>
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
  const renderMobileCard = (item: PhieuCapPhatThuHoi, isSelected: boolean) => (
    <div
      className={isSelected ? 'border-primary bg-primary/5' : ''}
      onClick={() => handleRowClick?.(item)}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="font-medium text-sm">{getLoaiPhieuLabel(item.loai_phieu, t)}</span>
        <span className="text-xs text-muted-foreground">{formatDate(item.ngay_thuc_hien)}</span>
      </div>
      <p className="text-sm text-foreground mt-0.5">{item.ten_tai_san || item.ma_tai_san || '—'}</p>
      <p className="text-xs text-muted-foreground">
        {item.ten_noi_luu_truoc} → {item.ten_noi_luu_sau}
      </p>
    </div>
  );

  return (
    <GenericTable<PhieuCapPhatThuHoi>
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
      loadingText={t('capPhatThuHoi.loading')}
      emptyTitle={t('capPhatThuHoi.empty')}
      emptyDescription={t('capPhatThuHoi.emptyHint')}
    />
  );
};

export default PhieuTable;
