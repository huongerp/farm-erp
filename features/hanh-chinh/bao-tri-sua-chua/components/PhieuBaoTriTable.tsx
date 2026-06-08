import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatDate, formatCurrency } from '../../../../lib/utils';
import type { PhieuBaoTriSuaChua } from '../core/types';
import { getTrangThaiLabel } from '../core/constants';
import { useBaoTriSuaChuaStore } from '../store/useBaoTriSuaChuaStore';

interface Props {
  data: PhieuBaoTriSuaChua[];
  isLoading: boolean;
  onView?: (item: PhieuBaoTriSuaChua) => void;
  onEdit?: (item: PhieuBaoTriSuaChua) => void;
  onDelete?: (item: PhieuBaoTriSuaChua) => void;
  showActions?: boolean;
}

const PhieuBaoTriTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete, showActions = true }) => {
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
  } = useBaoTriSuaChuaStore();

  const renderTrangThaiBadge = (trangThai: PhieuBaoTriSuaChua['trang_thai']) => {
    const style =
      trangThai === 'da_duyet'
        ? 'bg-primary/10 text-primary border-primary/20'
        : trangThai === 'khong_duyet'
          ? 'bg-destructive/10 text-destructive border-destructive/20'
          : 'bg-muted text-muted-foreground border-border';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
        {getTrangThaiLabel(trangThai, t)}
      </span>
    );
  };

  const renderCell = (colId: string, item: PhieuBaoTriSuaChua) => {
    switch (colId) {
      case 'ma_phieu':
        return (
          <span className="font-mono text-sm font-medium text-foreground tabular-nums">{item.ma_phieu}</span>
        );
      case 'ngay':
        return (
          <span className="text-sm tabular-nums">{formatDate(item.ngay)}</span>
        );
      case 'ten_hang_muc':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {item.ten_hang_muc || item.id_hang_muc}
          </span>
        );
      case 'ma_tai_san':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.ma_tai_san ?? '—'}
          </span>
        );
      case 'ten_tai_san':
        return (
          <span className="text-sm text-foreground line-clamp-2">{item.ten_tai_san ?? '—'}</span>
        );
      case 'so_tien':
        return (
          <span className="text-sm tabular-nums font-medium">{formatCurrency(item.so_tien)}</span>
        );
      case 'trang_thai':
        return renderTrangThaiBadge(item.trang_thai);
      case 'nguoi_duyet':
        return <span className="text-sm text-foreground">{item.nguoi_duyet || '—'}</span>;
      case 'ten_nguoi_tao':
        return <span className="text-sm text-foreground">{item.ten_nguoi_tao || '—'}</span>;
      case 'ghi_chu':
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
            {item.ghi_chu || '—'}
          </span>
        );
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_tao)}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
            {item.mo_ta || '—'}
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
        return <span className="text-sm">{String(item[colId as keyof PhieuBaoTriSuaChua] ?? '—')}</span>;
    }
  };

  const handleRowClick = onView ?? onEdit;
  const renderMobileCard = (item: PhieuBaoTriSuaChua, isSelected: boolean) => (
    <div
      className={isSelected ? 'border-primary bg-primary/5' : ''}
      onClick={() => handleRowClick?.(item)}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="font-mono text-sm font-medium">{item.ma_phieu}</span>
        <span className="text-xs text-muted-foreground">{formatDate(item.ngay)}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{item.ten_hang_muc || item.id_hang_muc}</p>
      <p className="text-sm text-foreground mt-0.5">{item.ten_tai_san ?? '—'}</p>
      {item.ma_tai_san && (
        <p className="text-xs font-mono text-muted-foreground">{item.ma_tai_san}</p>
      )}
      <p className="text-xs text-muted-foreground">{formatCurrency(item.so_tien)} • {getTrangThaiLabel(item.trang_thai, t)}</p>
    </div>
  );

  return (
    <GenericTable<PhieuBaoTriSuaChua>
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
      loadingText={t('baoTriSuaChua.loading')}
      emptyTitle={t('baoTriSuaChua.empty')}
      emptyDescription={t('baoTriSuaChua.emptyHint')}
    />
  );
};

export default PhieuBaoTriTable;
