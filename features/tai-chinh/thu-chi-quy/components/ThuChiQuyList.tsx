import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Wallet } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDate, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import { getLoaiBadgeClass, loaiThuChiToI18nKey, nguonChungTuToI18nKey } from '../core/constants';
import { getTrangThaiQuyBadgeClass, trangThaiQuyToI18nKey } from '../core/trang-thai';
import type { ThuChiQuy, ThuChiQuyRow } from '../core/types';
import { useThuChiQuyStore } from '../store/useThuChiQuyStore';

interface Props {
  data: ThuChiQuyRow[];
  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  totalCount: number;
  /** Tồn quỹ hiện tại (toàn sổ) — hiện ở hàng tổng phía trên header bảng */
  tonQuyHienTai?: number;
  tenChiNhanhDangXem?: string;
  onEdit?: (item: ThuChiQuy) => void;
  onDelete?: (item: ThuChiQuy) => void;
  /** Gác theo TỪNG dòng: phiếu đã khoá thì ẩn nút với người thường. */
  canEditRow?: (item: ThuChiQuyRow) => boolean;
  canDeleteRow?: (item: ThuChiQuyRow) => boolean;
  onRowClick?: (item: ThuChiQuyRow) => void;
}

const ThuChiQuyList: React.FC<Props> = ({
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
  totalCount,
  tonQuyHienTai = 0,
  tenChiNhanhDangXem = '',
  onEdit,
  onDelete,
  canEditRow,
  canDeleteRow,
  onRowClick,
}) => {
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
  } = useThuChiQuyStore();

  const money = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });

  const renderLoaiBadge = (item: ThuChiQuyRow) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getLoaiBadgeClass(item.loai)}`}
    >
      {t(loaiThuChiToI18nKey(item.loai))}
    </span>
  );

  /**
   * Hàng tổng nằm trên header bảng: đếm phiếu + cộng Thu/Chi của TRANG đang xem,
   * riêng cột Tồn quỹ hiện số dư thật của farm (toàn sổ, không phụ thuộc trang).
   */
  const renderSummaryRow = (colId: string, list: ThuChiQuyRow[]) => {
    switch (colId) {
      case 'ngay':
        return (
          <span className="text-muted-foreground">
            {t('thuChiQuy.summary.pageTotal', { count: list.length })}
          </span>
        );
      case 'thu':
        return (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {money(list.reduce((sum, r) => sum + r.thu, 0))}
          </span>
        );
      case 'chi':
        return (
          <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            {money(list.reduce((sum, r) => sum + r.chi, 0))}
          </span>
        );
      case 'ton_quy':
        return (
          <Tooltip
            content={t('thuChiQuy.summary.tonQuy', {
              ten: tenChiNhanhDangXem || t('thuChiQuy.filters.allBranches'),
            })}
            placement="bottom"
          >
            <span className="font-bold text-primary tabular-nums">{money(tonQuyHienTai)}</span>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const renderCell = (colId: string, item: ThuChiQuyRow) => {
    switch (colId) {
      case 'ngay':
        return <span className="text-sm text-foreground tabular-nums">{formatDate(item.ngay)}</span>;
      case 'so_phieu':
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-foreground">{item.so_phieu}</span>
          </div>
        );
      case 'dien_giai':
        return <span className="text-sm text-foreground line-clamp-2">{item.dien_giai}</span>;
      case 'hang_muc':
        return (
          <span className="text-sm text-foreground">
            {item.ref_ten_hang_muc || item.ten_hang_muc || '—'}
          </span>
        );
      case 'thu':
        return (
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {item.thu > 0 ? money(item.thu) : ''}
          </span>
        );
      case 'chi':
        return (
          <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            {item.chi > 0 ? money(item.chi) : ''}
          </span>
        );
      case 'ton_quy':
        return (
          <span
            className={`text-sm font-bold tabular-nums ${item.ton_quy < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}
          >
            {money(item.ton_quy)}
          </span>
        );
      case 'trang_thai':
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTrangThaiQuyBadgeClass(item.trang_thai)}`}
          >
            {t(trangThaiQuyToI18nKey(item.trang_thai))}
          </span>
        );
      case 'so_chung_tu':
        return <span className="text-xs text-muted-foreground">{item.so_chung_tu || '—'}</span>;
      case 'nguon':
        return (
          <span className="text-xs text-muted-foreground">
            {item.loai_chung_tu ? t(nguonChungTuToI18nKey(item.loai_chung_tu)) : '—'}
          </span>
        );
      case 'ghi_chu':
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[260px]">
            {item.ghi_chu || '—'}
          </span>
        );
      case 'chi_nhanh':
        return (
          <span className="text-xs text-muted-foreground">
            {item.ref_ten_chi_nhanh || item.ten_chi_nhanh || '—'}
          </span>
        );
      case 'nguoi_tao':
        return (
          <span className="text-xs text-muted-foreground">
            {item.ref_ten_nguoi_tao || item.ten_nguoi_tao || '—'}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions': {
        const showEdit = !!onEdit && (canEditRow ? canEditRow(item) : true);
        const showDelete = !!onDelete && (canDeleteRow ? canDeleteRow(item) : true);
        return (
          <div className="flex items-center justify-center gap-1">
            {showEdit && onEdit && (
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
            {showDelete && onDelete && (
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
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
      }
      default:
        return null;
    }
  };

  const renderMobileCard = (item: ThuChiQuyRow, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick?.(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRowClick?.(item);
        }
      }}
      className="bg-card rounded-xl border border-border p-3.5 shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Wallet size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm line-clamp-1">{item.dien_giai}</h4>
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
            <span className="text-xs font-mono text-muted-foreground">{item.so_phieu}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{formatDate(item.ngay)}</span>
            {renderLoaiBadge(item)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">{t('thuChiQuy.store.hangMucCol')}: </span>
          <span className="text-foreground">{item.ref_ten_hang_muc || item.ten_hang_muc || '—'}</span>
        </div>
        <div className="text-right">
          <span
            className={`font-semibold tabular-nums ${item.loai === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
          >
            {item.loai === 'thu' ? '+' : '−'}
            {money(item.so_tien)}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-border text-xs">
        <span className="text-muted-foreground">
          {t('thuChiQuy.store.tonQuyCol')} · {item.ref_ten_chi_nhanh || item.ten_chi_nhanh || '—'}
        </span>
        <span className="font-bold text-foreground tabular-nums">{money(item.ton_quy)}</span>
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      onResizeColumn={resizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={onRetry}
      loadingText={t('common.loading')}
      selectedIds={selectedIds}
      onToggleSelection={toggleSelection}
      onToggleAll={toggleAllSelection}
      page={pagination.page}
      pageSize={pagination.pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      totalRecordsOverride={totalCount}
      sort={sort}
      onSort={setSort}
      renderCell={renderCell}
      renderSummaryRow={renderSummaryRow}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onRowClick}
    />
  );
};

export default ThuChiQuyList;
