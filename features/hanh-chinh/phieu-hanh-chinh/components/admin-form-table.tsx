import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, FileText, Trash2 } from 'lucide-react';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import { AdminFormRequest } from '../core/types';
import { ADMIN_FORM_STATUS_BADGE, getAdminFormShiftLabel, getAdminFormStatusLabel } from '../core/constants';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import type { GenericState } from '../../../../store/createGenericStore';
import type { AdminFormListFilters } from '../store/useAdminFormListStore';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { hienThiSoNgay, moTaKhoangNhieuNgay, moTaThoiGianPhieu } from '../utils/hien-thi-khoang';

interface Props {
  data: AdminFormRequest[];
  isLoading: boolean;
  /** Đang tải trang mới nhưng đã có dữ liệu cũ — hiện lớp phủ mờ thay vì skeleton. */
  isFetching?: boolean;
  /** Tổng số bản ghi khớp bộ lọc (phân trang ở server). */
  totalRecordsOverride?: number;
  onView?: (item: AdminFormRequest) => void;
  onEdit?: (item: AdminFormRequest) => void;
  onDelete?: (id: string) => void;
  useStore: () => GenericState<AdminFormListFilters>;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const AdminFormTable: React.FC<Props> = ({ isFetching, totalRecordsOverride, data, isLoading, onView, onEdit, onDelete, useStore, canUpdate = true, canDelete = true }) => {
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

  const renderStatusBadge = (status: AdminFormRequest['trang_thai']) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(ADMIN_FORM_STATUS_BADGE[status] ?? 'info')}`}
    >
      {getAdminFormStatusLabel(status, t)}
    </span>
  );

  const renderCell = (colId: string, item: AdminFormRequest) => {
    switch (colId) {
      case 'ten_nguoi_tao':
        return <span className="font-medium text-foreground text-sm">{item.ten_nguoi_tao || '—'}</span>;
      case 'phong_ban':
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
      case 'so_ngay':
        return <span className="text-sm text-foreground tabular-nums">{hienThiSoNgay(item)}</span>;
      case 'thoi_gian': {
        const nhieuNgay = moTaKhoangNhieuNgay(item, t);
        if (nhieuNgay) {
          return <span className="text-sm text-foreground tabular-nums whitespace-nowrap">{nhieuNgay}</span>;
        }
        if (item.ca === 'morning') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
              {getAdminFormShiftLabel(item.ca, t)}
            </span>
          );
        }
        if (item.ca === 'afternoon') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100 dark:border-sky-900">
              {getAdminFormShiftLabel(item.ca, t)}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
            {getAdminFormShiftLabel(item.ca, t)}
          </span>
        );
      }
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
            {canUpdate && onEdit && (
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
            {canDelete && onDelete && (
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
      {/* Người duyệt lướt danh sách cần biết ngay: AI xin – LOẠI gì – KHI NÀO – VÌ SAO – đang ở trạng thái nào. */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_nguoi_tao || '—'}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {getAdminFormTypeLabel(item.loai_phieu, t)}
            {item.ten_phong_ban ? ` · ${item.ten_phong_ban}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {renderStatusBadge(item.trang_thai)}
          <div role="presentation" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(item.id)}
              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
              aria-label={t('common.select')}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 px-2.5 py-1.5 bg-muted/40 rounded-lg text-sm font-medium text-foreground tabular-nums">
        {moTaThoiGianPhieu(item, t)}
      </p>
      {item.ly_do && (
        <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
          <span className="text-muted-foreground">{t('adminForm.store.reasonCol')}: </span>
          {item.ly_do}
        </p>
      )}
      {((canUpdate && onEdit) || (canDelete && onDelete)) && (
        <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
          {canUpdate && onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
              aria-label={t('common.edit')}
            >
              <Edit size={16} />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="h-10 w-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
              aria-label={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      onResizeColumn={resizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
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
