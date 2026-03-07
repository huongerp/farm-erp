import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, CreditCard } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import type { TrangThaiThanhToanDoiTac } from '../core/types';
import { useTrangThaiThanhToanDoiTacStore } from '../store/useTrangThaiThanhToanDoiTacStore';
import { TRANG_THAI_MAU_DEFAULT } from '../core/constants';

interface Props {
  data: TrangThaiThanhToanDoiTac[];
  isLoading: boolean;
  onEdit: (item: TrangThaiThanhToanDoiTac) => void;
  onDelete: (id: string) => void;
  onRowClick?: (item: TrangThaiThanhToanDoiTac) => void;
}

const TrangThaiThanhToanDoiTacTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onRowClick }) => {
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
  } = useTrangThaiThanhToanDoiTacStore();

  const renderStatusBadge = (status: number) =>
    status === 1 ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {t('common.activeStatus')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {t('common.inactiveStatus')}
      </span>
    );

  const renderCell = (colId: string, item: TrangThaiThanhToanDoiTac) => {
    switch (colId) {
      case 'ma':
        return (
          <span className="font-mono text-sm font-medium text-foreground">{item.ma}</span>
        );
      case 'ten':
        return <span className="text-sm text-foreground">{item.ten}</span>;
      case 'thu_tu':
        return (
          <span className="text-sm font-semibold text-foreground tabular-nums">{item.thu_tu}</span>
        );
      case 'mau':
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-6 h-6 rounded border border-border shrink-0"
              style={{ backgroundColor: item.mau || TRANG_THAI_MAU_DEFAULT }}
              aria-hidden
            />
            <span className="text-xs text-muted-foreground font-mono">
              {item.mau || TRANG_THAI_MAU_DEFAULT}
            </span>
          </div>
        );
      case 'ghi_chu':
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[240px]">
            {item.ghi_chu || '—'}
          </span>
        );
      case 'trang_thai':
        return renderStatusBadge(item.trang_thai);
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
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
            <Tooltip content={t('common.delete')} placement="left">
              <button
                type="button"
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

  const renderMobileCard = (item: TrangThaiThanhToanDoiTac, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick?.(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick?.(item); } }}
      className="bg-card rounded-xl border border-border p-3.5 shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <CreditCard size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm">{item.ten}</h4>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(item.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
              aria-label={t('common.select')}
            />
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{item.ma}</span>
            <span className="text-xs tabular-nums text-foreground">#{item.thu_tu}</span>
            {renderStatusBadge(item.trang_thai)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-5 h-5 rounded border border-border shrink-0" style={{ backgroundColor: item.mau || TRANG_THAI_MAU_DEFAULT }} aria-hidden />
        <span className="text-xs text-muted-foreground font-mono">{item.mau || TRANG_THAI_MAU_DEFAULT}</span>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs line-clamp-1">{item.ghi_chu || '—'}</span>
        <div className="flex gap-1.5 shrink-0">
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg" aria-label={t('common.edit')}>
            <Edit size={14} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-lg" aria-label={t('common.delete')}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable
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
      onRowClick={onRowClick}
    />
  );
};

export default TrangThaiThanhToanDoiTacTable;
