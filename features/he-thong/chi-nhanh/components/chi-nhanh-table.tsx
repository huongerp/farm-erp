import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, MapPin } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import { Branch } from '../core/types';
import { useBranchStore } from '../store/useBranchStore';
import Tooltip from '../../../../components/ui/Tooltip';
import { cn } from '../../../../lib/utils';
import { TRANG_THAI } from '../../../../lib/constants';

interface Props {
  data: Branch[];
  isLoading: boolean;
  onEdit: (item: Branch) => void;
  onDelete: (id: string) => void;
  onView: (item: Branch) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const BranchTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onView, canUpdate = true, canDelete = true }) => {
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
  } = useBranchStore();

  const renderStatusBadge = (item: Branch) => (
    item.trang_thai === TRANG_THAI.DANG_DUNG ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {t('branch.active')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {t('branch.inactive')}
      </span>
    )
  );

  const renderCell = (colId: string, item: Branch) => {
    switch (colId) {
      case 'ten_chi_nhanh':
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px]">
            <span className="font-medium text-foreground text-sm">{item.ten_chi_nhanh}</span>
            <span className="text-xs text-muted-foreground font-mono">{item.ma_chi_nhanh}</span>
          </div>
        );
      case 'ma_chi_nhanh':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.ma_chi_nhanh}
          </span>
        );
      case 'dia_chi':
        return (
          <div className="flex items-center gap-2 min-w-[220px]">
            <MapPin size={14} className="text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground line-clamp-2">{item.dia_chi}</span>
          </div>
        );
      case 'tinh_thanh':
        return (
          <span className="text-sm text-foreground">{item.tinh_thanh}</span>
        );
      case 'quan_huyen':
        return (
          <span className="text-sm text-muted-foreground">{item.quan_huyen}</span>
        );
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            {canUpdate && (
              <Tooltip content={t('common.edit')} placement="left">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
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
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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

  const renderMobileCard = (item: Branch, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView(item)}
      className={cn(
        'bg-card rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98]',
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <MapPin size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_chi_nhanh}</h4>
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
            <span className="text-xs font-mono text-muted-foreground">{item.ma_chi_nhanh}</span>
            {renderStatusBadge(item)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
        <div>
          <p className="text-muted-foreground mb-0.5">{t('branch.form.province')}</p>
          <p className="font-medium text-foreground">{item.tinh_thanh}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">{t('branch.form.district')}</p>
          <p className="font-medium text-foreground">{item.quan_huyen}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground mb-0.5">{t('branch.form.address')}</p>
          <p className="font-medium text-foreground line-clamp-2">{item.dia_chi}</p>
        </div>
      </div>
      {(canUpdate || canDelete) && (
        <div className="flex justify-end items-center pt-2.5 border-t border-border">
          <div className="flex gap-1.5">
            {canUpdate && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                aria-label={t('common.edit')}
              >
                <Edit size={14} />
              </button>
            )}
            {canDelete && (
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
      )}
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('branch.loading')}
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
      onRowClick={onView}
    />
  );
};

export default BranchTable;
