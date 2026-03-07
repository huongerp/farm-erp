import React from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatCurrency } from '../../../../lib/utils';
import type { BangLuongRecord } from '../core/types';
import { useBangLuongManagedStore } from '../store/useBangLuongManagedStore';

interface Props {
  data: BangLuongRecord[];
  isLoading: boolean;
  onView: (item: BangLuongRecord) => void;
  onEdit?: (item: BangLuongRecord) => void;
  onDelete?: (id: string) => void;
}

const formatPeriod = (nam: number, thang: number) =>
  `${nam}-${String(thang).padStart(2, '0')}`;

const BangLuongManagedTable: React.FC<Props> = ({ data, isLoading, onView, onEdit, onDelete }) => {
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
            {formatCurrency((item as Record<string, number>)[colId])}
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
        return onEdit && onDelete ? (
          <div className="flex items-center justify-center gap-1">
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
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Banknote size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {item.ten_nhan_vien || '—'}
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
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatPeriod(item.nam, item.thang)}
            </span>
            <span className="text-xs font-semibold text-primary">
              {formatCurrency(item.tong_luong)}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
        <div>
          <p className="text-muted-foreground mb-0.5">{t('bangLuong.store.departmentCol')}</p>
          <p className="font-medium text-foreground line-clamp-1">
            {item.ten_phong_ban || '—'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">{t('bangLuong.store.tongLuongCol')}</p>
          <p className="text-foreground font-medium">{formatCurrency(item.tong_luong)}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">
          {formatDateTimeShort(item.tg_cap_nhat)}
        </span>
        {onEdit && onDelete && (
          <div className="flex gap-1.5">
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg" aria-label={t('common.edit')}>
              <Edit size={14} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg" aria-label={t('common.delete')}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
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
