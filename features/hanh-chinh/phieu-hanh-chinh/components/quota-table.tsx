import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, FileText } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { AdminFormQuotaRow } from '../core/types';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import type { GenericState } from '../../../../store/createGenericStore';

interface Props {
  data: AdminFormQuotaRow[];
  isLoading: boolean;
  useStore: () => GenericState<any>;
  /** Sửa định mức của loại phiếu — chỉ truyền khi người dùng có quyền (viewAll). */
  onEdit?: (item: AdminFormQuotaRow) => void;
}

/** Hiển thị số định mức (số nguyên hoặc 1 chữ số thập phân) */
function formatQuotaValue(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

const AdminFormQuotaTable: React.FC<Props> = ({ data, isLoading, useStore, onEdit }) => {
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
  } = useStore();

  const renderCell = (colId: string, item: AdminFormQuotaRow) => {
    switch (colId) {
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
      case 'so_luong_thang':
        return <span className="text-sm font-semibold text-foreground tabular-nums">{item.so_luong_thang}</span>;
      case 'da_dung':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {formatQuotaValue(item.da_dung)}
          </span>
        );
      case 'con_lai':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {formatQuotaValue(item.con_lai)}
          </span>
        );
      case 'actions':
        return onEdit ? (
          <div className="flex items-center justify-center">
            <Tooltip content={t('adminForm.quota.editQuota')} placement="left">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-95"
                aria-label={t('adminForm.quota.editQuota')}
              >
                <Edit size={16} />
              </button>
            </Tooltip>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: AdminFormQuotaRow, isSelected: boolean) => (
    <div
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
            <div className="shrink-0 flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-95"
                  aria-label={t('adminForm.quota.editQuota')}
                >
                  <Edit size={15} />
                </button>
              )}
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
            <span className="text-xs text-muted-foreground">
              {t('adminForm.store.quotaCol')}: {item.so_luong_thang}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-muted/30 rounded-lg text-body-sm">
        <div>
          <p className="text-muted-foreground mb-0.5">{t('adminForm.store.usedCol')}</p>
          <p className="font-medium text-foreground">{formatQuotaValue(item.da_dung)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">{t('adminForm.store.remainingCol')}</p>
          <p className="font-medium text-foreground">{formatQuotaValue(item.con_lai)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      onResizeColumn={resizeColumn}
      isLoading={isLoading}
      loadingText={t('adminForm.quota.loading')}
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
      showActionsColumn={!!onEdit}
      keyExtractor={(item) => item.id}
    />
  );
};

export default AdminFormQuotaTable;
