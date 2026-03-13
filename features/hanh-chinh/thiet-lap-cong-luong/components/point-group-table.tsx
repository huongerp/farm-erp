import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Scale } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import { PayrollPointGroup } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { usePayrollPointGroupStore } from '../store/usePayrollPointGroupStore';
import { getPointGroupTypeLabel } from '../core/constants';

interface Props {
  data: PayrollPointGroup[];
  isLoading: boolean;
  onEdit: (item: PayrollPointGroup) => void;
  onDelete: (id: string) => void;
  onView?: (item: PayrollPointGroup) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const PayrollPointGroupTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onView, canUpdate = true, canDelete = true }) => {
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
  } = usePayrollPointGroupStore();

  const renderStatusBadge = (status: string) =>
    status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {status}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {status}
      </span>
    );

  const renderLoaiBadge = (loai: 'cong' | 'tru') =>
    loai === 'cong' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
        {getPointGroupTypeLabel(loai, t)}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
        {getPointGroupTypeLabel(loai, t)}
      </span>
    );

  const renderCell = (colId: string, item: PayrollPointGroup) => {
    switch (colId) {
      case 'ma':
        return (
          <span className="font-mono text-sm font-medium text-foreground">
            {item.ma}
          </span>
        );
      case 'ten':
        return (
          <span className="text-sm text-foreground">
            {item.ten}
          </span>
        );
      case 'loai':
        return renderLoaiBadge(item.loai);
      case 'thu_tu':
        return (
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {item.thu_tu}
          </span>
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
            {canUpdate && (
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
            )}
            {canDelete && (
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
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: PayrollPointGroup, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Scale size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten}</h4>
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
            <span className="text-xs font-mono text-muted-foreground">{item.ma}</span>
            {renderLoaiBadge(item.loai)}
            {renderStatusBadge(item.trang_thai)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
        <div>
          <p className="text-muted-foreground mb-0.5">{t('payrollIp.pointGroups.store.noteCol')}</p>
          <p className="font-medium text-foreground line-clamp-2">{item.ghi_chu || '—'}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">{formatDateTimeShort(item.tg_cap_nhat)}</span>
        <div className="flex gap-1.5">
          {canUpdate && (
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
          )}
          {canDelete && (
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
          )}
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('payrollIp.pointGroups.loading')}
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
      onRowClick={(item) => onView?.(item)}
    />
  );
};

export default PayrollPointGroupTable;
