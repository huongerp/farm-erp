import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, FileText, Trash2 } from 'lucide-react';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import { AdminFormRequest } from '../core/types';
import { getAdminFormShiftLabel, getAdminFormStatusLabel } from '../core/constants';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import type { GenericState } from '../../../../store/createGenericStore';

interface Props {
  data: AdminFormRequest[];
  isLoading: boolean;
  onView?: (item: AdminFormRequest) => void;
  onEdit?: (item: AdminFormRequest) => void;
  onDelete?: (id: string) => void;
  useStore: () => GenericState<any>;
}

const AdminFormTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete, useStore }) => {
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
  } = useStore();

  const renderStatusBadge = (status: AdminFormRequest['trang_thai']) => {
    const label = getAdminFormStatusLabel(status, t);
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
          {label}
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100">
          {label}
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
          {label}
        </span>
      );
    }
    if (status === 'manager_approved') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {label}
      </span>
    );
  };

  const renderCell = (colId: string, item: AdminFormRequest) => {
    switch (colId) {
      case 'ten_nguoi_tao':
        return (
          <div className="flex flex-col gap-0.5 min-w-[160px]">
            <span className="font-medium text-foreground text-sm">{item.ten_nguoi_tao}</span>
            <span className="text-xs text-muted-foreground">{item.ten_phong_ban || '—'}</span>
          </div>
        );
      case 'ten_phong_ban':
        return <span className="text-sm text-foreground">{item.ten_phong_ban || '—'}</span>;
      case 'loai_phieu':
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <FileText size={14} />
            </div>
            <span className="font-medium text-foreground text-sm">
              {getAdminFormTypeLabel(item.loai_phieu, t)}
            </span>
          </div>
        );
      case 'ca':
        if (item.ca === 'morning') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
              {getAdminFormShiftLabel(item.ca, t)}
            </span>
          );
        }
        if (item.ca === 'afternoon') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
              {getAdminFormShiftLabel(item.ca, t)}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            {getAdminFormShiftLabel(item.ca, t)}
          </span>
        );
      case 'ngay':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {item.ngay ? formatDate(item.ngay) : item.ngay}
          </span>
        );
      case 'ly_do':
        return (
          <span className="text-sm text-foreground line-clamp-2 max-w-[280px]" title={item.ly_do || undefined}>
            {item.ly_do || '—'}
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
            {onEdit && (
              <Tooltip content={t('common.edit')} placement="left">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-95"
                  aria-label={t('common.edit')}
                >
                  <Edit size={16} />
                </button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all active:scale-95"
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

  const renderMobileCard = (item: AdminFormRequest, isSelected: boolean) => (
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
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {getAdminFormTypeLabel(item.loai_phieu, t)}
            </h4>
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
            <span className="text-xs text-muted-foreground">{item.ngay}</span>
            {renderStatusBadge(item.trang_thai)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
        <div>
          <p className="text-muted-foreground mb-0.5">{t('adminForm.store.shiftCol')}</p>
          <p className="font-medium text-foreground">{getAdminFormShiftLabel(item.ca, t)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">{t('adminForm.store.statusCol')}</p>
          <p className="font-medium text-foreground">{getAdminFormStatusLabel(item.trang_thai, t)}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">{formatDateTimeShort(item.tg_cap_nhat)}</span>
        <div className="flex gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
              aria-label={t('common.edit')}
            >
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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
      loadingText={t('adminForm.loading')}
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

export default AdminFormTable;
