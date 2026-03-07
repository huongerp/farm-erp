import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Wallet } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatCurrency, formatDateTimeShort, cn } from '../../../../lib/utils';
import type { TaiKhoan } from '../../core/types';
import { useTaiKhoanStore } from '../store/useTaiKhoanStore';
import Tooltip from '../../../../components/ui/Tooltip';
import { getCurrencyAmountClass } from '../utils/currencyColors';

interface Props {
  data: TaiKhoan[];
  isLoading: boolean;
  onEdit: (item: TaiKhoan) => void;
  onDelete: (id: string) => void;
  onView: (item: TaiKhoan) => void;
}

const TaiKhoanList: React.FC<Props> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
}) => {
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
  } = useTaiKhoanStore();

  const renderStatusBadge = (item: TaiKhoan) =>
    item.trang_thai === 1 ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {t('common.activeStatus')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {t('common.inactiveStatus')}
      </span>
    );

  const renderLoaiBadge = (item: TaiKhoan) =>
    item.loai_tai_khoan === 'ngan_hang' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        {t('taiKhoan.loaiNganHang')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        {t('taiKhoan.loaiTienMat')}
      </span>
    );

  const renderCell = (colId: string, item: TaiKhoan) => {
    switch (colId) {
      case 'ten_tai_khoan':
        return (
          <div className="flex flex-col gap-0.5 min-w-[160px]">
            <span className="font-medium text-foreground text-sm">{item.ten_tai_khoan}</span>
            {item.so_tai_khoan && (
              <span className="text-xs text-muted-foreground font-mono">{item.so_tai_khoan}</span>
            )}
          </div>
        );
      case 'loai_tai_khoan':
        return renderLoaiBadge(item);
      case 'ngan_hang':
        return (
          <span className="text-sm text-foreground">
            {item.ngan_hang || '—'}
          </span>
        );
      case 'so_tai_khoan':
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {item.so_tai_khoan || '—'}
          </span>
        );
      case 'chu_tai_khoan':
        return (
          <span className="text-sm text-muted-foreground">
            {item.chu_tai_khoan || '—'}
          </span>
        );
      case 'so_du_dau':
      case 'so_du_cuoi': {
        const val = item[colId as keyof TaiKhoan] as number;
        const cl = typeof val === 'number' ? getCurrencyAmountClass(val, 'balance') : 'text-muted-foreground';
        return (
          <span className={cn('text-sm tabular-nums font-medium', cl)}>
            {typeof val === 'number' ? formatCurrency(val) : '—'}
          </span>
        );
      }
      case 'tong_thu': {
        const val = item.tong_thu;
        return (
          <span className={cn('text-sm tabular-nums font-medium', getCurrencyAmountClass(val ?? 0, 'income'))}>
            {typeof val === 'number' ? formatCurrency(val) : '—'}
          </span>
        );
      }
      case 'tong_chi': {
        const val = item.tong_chi;
        return (
          <span className={cn('text-sm tabular-nums font-medium', getCurrencyAmountClass(0, 'expense'))}>
            {typeof val === 'number' ? formatCurrency(val) : '—'}
          </span>
        );
      }
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground">
            {item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '—'}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
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
          </div>
        );
      default:
        return null;
    }
  };

  const summary = React.useMemo(() => {
    const sumTonDau = data.reduce((s, i) => s + (i.so_du_dau ?? 0), 0);
    const sumThu = data.reduce((s, i) => s + (i.tong_thu ?? 0), 0);
    const sumChi = data.reduce((s, i) => s + (i.tong_chi ?? 0), 0);
    const sumDuCuoi = data.reduce((s, i) => s + (i.so_du_cuoi ?? 0), 0);
    const active = data.filter((i) => i.trang_thai === 1).length;
    const inactive = data.filter((i) => i.trang_thai === 0).length;
    const tienMat = data.filter((i) => i.loai_tai_khoan === 'tien_mat').length;
    const nganHang = data.filter((i) => i.loai_tai_khoan === 'ngan_hang').length;
    return { sumTonDau, sumThu, sumChi, sumDuCuoi, active, inactive, tienMat, nganHang, count: data.length };
  }, [data]);

  const renderSummaryRow = React.useCallback(
    (colId: string, _list: TaiKhoan[]) => {
      switch (colId) {
        case 'ten_tai_khoan':
          return summary.count > 0 ? (
            <span className="text-muted-foreground text-2xs">{t('taiKhoan.listSummary.totalRow')}</span>
          ) : '—';
        case 'loai_tai_khoan':
          return summary.count > 0 ? (
            <span className="text-muted-foreground text-2xs">
              {summary.tienMat} TM · {summary.nganHang} NH
            </span>
          ) : '—';
        case 'ngan_hang':
        case 'so_tai_khoan':
        case 'chu_tai_khoan':
        case 'tg_cap_nhat':
          return '—';
        case 'so_du_dau':
          return summary.count > 0 ? (
            <span className={cn('tabular-nums font-medium text-right block', getCurrencyAmountClass(summary.sumTonDau, 'balance'))}>
              {formatCurrency(summary.sumTonDau)}
            </span>
          ) : '—';
        case 'tong_thu':
          return summary.count > 0 ? (
            <span className={cn('tabular-nums font-medium text-right block', getCurrencyAmountClass(summary.sumThu, 'income'))}>
              {formatCurrency(summary.sumThu)}
            </span>
          ) : '—';
        case 'tong_chi':
          return summary.count > 0 ? (
            <span className={cn('tabular-nums font-medium text-right block', getCurrencyAmountClass(summary.sumChi, 'expense'))}>
              {formatCurrency(summary.sumChi)}
            </span>
          ) : '—';
        case 'so_du_cuoi':
          return summary.count > 0 ? (
            <span className={cn('tabular-nums font-medium text-right block', getCurrencyAmountClass(summary.sumDuCuoi, 'balance'))}>
              {formatCurrency(summary.sumDuCuoi)}
            </span>
          ) : '—';
        case 'trang_thai':
          return summary.count > 0 ? (
            <span className="text-muted-foreground text-2xs">
              {summary.active} {t('common.activeStatus')} · {summary.inactive} {t('common.inactiveStatus')}
            </span>
          ) : '—';
        case 'actions':
          return '';
        default:
          return '—';
      }
    },
    [summary, t]
  );

  const renderMobileCard = (item: TaiKhoan, isSelected: boolean) => (
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
          <Wallet size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_tai_khoan}</h4>
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
            {renderLoaiBadge(item)}
            {renderStatusBadge(item)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
        <div>
          <p className="text-muted-foreground mb-0.5">{t('taiKhoan.columns.tonDau')}</p>
          <p className={cn('font-medium tabular-nums', getCurrencyAmountClass(item.so_du_dau ?? 0, 'balance'))}>
            {formatCurrency(item.so_du_dau ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">{t('taiKhoan.columns.duCuoi')}</p>
          <p className={cn('font-medium tabular-nums', getCurrencyAmountClass(item.so_du_cuoi ?? 0, 'balance'))}>
            {formatCurrency(item.so_du_cuoi ?? 0)}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {item.ngan_hang || item.so_tai_khoan || '—'}
        </span>
        <div className="flex gap-1.5">
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
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable<TaiKhoan>
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('taiKhoan.loading')}
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
      renderSummaryRow={renderSummaryRow}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('taiKhoan.empty')}
    />
  );
};

export default TaiKhoanList;
