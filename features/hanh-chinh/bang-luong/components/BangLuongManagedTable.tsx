import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatCurrency } from '../../../../lib/utils';
import { formatKyThangNam } from '../utils/ky-hien-thi';
import type { BangLuongRecord } from '../core/types';
import { useBangLuongManagedStore } from '../store/useBangLuongManagedStore';

interface Props {
  data: BangLuongRecord[];
  isLoading: boolean;
  /** Đang tải trang mới nhưng đã có dữ liệu cũ — hiện lớp phủ mờ thay vì skeleton. */
  isFetching?: boolean;
  /** Tổng số bản ghi khớp bộ lọc (phân trang ở server). */
  totalRecordsOverride?: number;
  onView: (item: BangLuongRecord) => void;
  onEdit?: (item: BangLuongRecord) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const formatPeriod = (nam: number, thang: number) =>
  `${nam}-${String(thang).padStart(2, '0')}`;

const BangLuongManagedTable: React.FC<Props> = ({ isFetching, totalRecordsOverride, data, isLoading, onView, onEdit, onDelete, canUpdate = true, canDelete = true }) => {
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
  } = useBangLuongManagedStore();

  const renderCell = (colId: string, item: BangLuongRecord) => {
    switch (colId) {
      case 'ten_nhan_vien':
        return (
          <div className="flex flex-col gap-0.5 min-w-[140px]">
            <span className="font-medium text-foreground text-sm">
              {item.ten_nhan_vien || '—'}
            </span>
            {item.ma_nhan_vien && (
              <span className="text-xs text-muted-foreground">{item.ma_nhan_vien}</span>
            )}
          </div>
        );
      case 'period':
        return (
          <span className="text-sm font-medium text-foreground tabular-nums">
            {formatPeriod(item.nam, item.thang)}
          </span>
        );
      case 'ten_phong_ban':
        return (
          <span className="text-sm text-foreground">
            {item.ten_phong_ban || item.id_phong_ban || '—'}
          </span>
        );
      case 'ngay_cong':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {item.ngay_cong}/{item.ngay_cong_chuan}
          </span>
        );
      case 'luong_co_ban_tinh':
      case 'luong_kpi_tinh':
      case 'luong_trach_nhiem_tinh':
      case 'phu_cap_tinh':
        return (
          <span className="text-sm text-foreground tabular-nums">
            {formatCurrency((item as unknown as Record<string, number>)[colId])}
          </span>
        );
      case 'cong_tru_net':
        return (
          <span className={`text-sm tabular-nums ${item.cong_tru_net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {item.cong_tru_net >= 0 ? '+' : ''}{formatCurrency(item.cong_tru_net)}
          </span>
        );
      case 'tong_luong':
        return (
          <span className="text-sm font-bold text-primary tabular-nums">
            {formatCurrency(item.tong_luong)}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        return (canUpdate && onEdit) || (canDelete && onDelete) ? (
          <div className="flex items-center justify-center gap-1">
            {canUpdate && onEdit && (
              <Tooltip content={t('common.edit')} placement="left">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                  aria-label={t('common.edit')}
                >
                  <Edit size={16} />
                </button>
              </Tooltip>
            )}
            {canDelete && onDelete && (
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            )}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: BangLuongRecord, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView(item)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_nhan_vien || '—'}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {[item.ma_nhan_vien, formatKyThangNam(item.nam, item.thang), item.ten_phong_ban].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div role="presentation" onClick={(e) => e.stopPropagation()} className="shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(item.id)}
            className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
            aria-label={t('common.select')}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2.5">
        <span className="text-xs text-muted-foreground">{t('bangLuong.store.tongLuongCol')}</span>
        <span className="text-sm font-semibold text-primary tabular-nums">{formatCurrency(item.tong_luong)}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1 text-xs text-muted-foreground">
        <span>
          {t('bangLuong.store.ngayCongCol')}:{' '}
          <span className="text-foreground tabular-nums">
            {item.ngay_cong}/{item.ngay_cong_chuan}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          {t('bangLuong.detail.diemKpi')}: <span className="text-foreground tabular-nums">{item.diem_kpi}</span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium border ${
              item.kpi_dat
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
            }`}
          >
            {item.kpi_dat ? t('bangLuong.detail.kpiDat') : t('bangLuong.detail.kpiKhongDat')}
          </span>
        </span>
      </div>
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
      loadingText={t('bangLuong.managed.loading')}
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
      onRowClick={(item) => onView(item)}
    />
  );
};

export default BangLuongManagedTable;
