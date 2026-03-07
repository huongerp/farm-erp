import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatCurrency } from '../../../../lib/utils';
import type { KyKhauHao } from '../core/types';
import { getTrangThaiKyLabel } from '../core/constants';
import { useKhauHaoTaiSanStore } from '../store/useKhauHaoTaiSanStore';

interface Props {
  data: KyKhauHao[];
  isLoading: boolean;
  onView?: (item: KyKhauHao) => void;
  onEdit?: (item: KyKhauHao) => void;
  onDelete?: (item: KyKhauHao) => void;
  showActions?: boolean;
}

const KyKhauHaoTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete, showActions = true }) => {
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
  } = useKhauHaoTaiSanStore();

  const renderTrangThaiBadge = (status: KyKhauHao['trang_thai']) => {
    const variant =
      status === 'chot'
        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
        : 'bg-muted text-muted-foreground border-border';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variant}`}>
        {getTrangThaiKyLabel(status, t)}
      </span>
    );
  };

  const renderCell = (colId: string, item: KyKhauHao) => {
    switch (colId) {
      case 'ma_ky':
        return (
          <span className="font-medium text-sm">
            {item.thang}/{item.nam}
          </span>
        );
      case 'thang':
        return <span className="text-sm tabular-nums">{item.thang}</span>;
      case 'nam':
        return <span className="text-sm tabular-nums">{item.nam}</span>;
      case 'trang_thai':
        return renderTrangThaiBadge(item.trang_thai);
      case 'tong_nguyen_gia':
        return (
          <span className="text-sm tabular-nums">
            {item.tong_nguyen_gia != null ? formatCurrency(item.tong_nguyen_gia) : '—'}
          </span>
        );
      case 'tong_khau_hao_ky':
        return (
          <span className="text-sm tabular-nums">
            {item.tong_khau_hao_ky != null ? formatCurrency(item.tong_khau_hao_ky) : '—'}
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
            {onEdit && item.trang_thai === 'draft' && (
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
            {onDelete && item.trang_thai === 'draft' && (
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: KyKhauHao, isSelected: boolean) => (
    <div
      className={isSelected ? 'border-primary bg-primary/5' : ''}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">
          {item.thang}/{item.nam}
        </span>
        {renderTrangThaiBadge(item.trang_thai)}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {item.tong_nguyen_gia != null && `${t('khauHaoTaiSan.store.tongNguyenGiaCol')}: ${formatCurrency(item.tong_nguyen_gia)}`}
      </div>
    </div>
  );

  return (
    <GenericTable<KyKhauHao>
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
      onRowClick={onView}
      keyExtractor={(item) => item.id}
      loadingText={t('common.loading')}
      emptyTitle={t('khauHaoTaiSan.tabs.ky')}
      emptyDescription={t('common.empty')}
    />
  );
};

export default KyKhauHaoTable;
