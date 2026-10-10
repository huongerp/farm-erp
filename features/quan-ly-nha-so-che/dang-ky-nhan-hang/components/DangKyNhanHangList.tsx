import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, LogIn, LogOut, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import {
  cn,
  formatDateTimeShort,
  formatNumberVN,
  formatTimeDateShort,
  formatYmdToDisplay,
  getTimezone,
} from '../../../../lib/utils';
import type { DangKyNhanHang } from '../core/types';
import { coTheCheckIn, coTheCheckOut } from '../core/trang-thai';
import {
  NGUONG_TRE_PHUT,
  formatThoiLuong,
  soPhutDangOTrongFarm,
  soPhutRaQuaGio,
  soPhutTrongFarm,
  soPhutVaoTre,
} from '../core/thoi-gian';
import TrangThaiBadge from './TrangThaiBadge';

interface Props {
  data: DangKyNhanHang[];
  columns: ColumnConfig[];
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  isFetching?: boolean;
  totalRecordsOverride?: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sort?: SortState;
  onSort?: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  onView: (item: DangKyNhanHang) => void;
  onEdit?: (item: DangKyNhanHang) => void;
  onDelete?: (id: string) => void;
  /** Nút check in / check out nhanh ngay trên dòng / card mobile. */
  onQuickAction?: (item: DangKyNhanHang, mode: 'checkIn' | 'checkOut') => void;
}

const thoiLuong = (d: DangKyNhanHang) =>
  d.trang_thai === 'da_vao' ? soPhutDangOTrongFarm(d.tg_vao_thuc_te) : soPhutTrongFarm(d.tg_vao_thuc_te, d.tg_ra_thuc_te);

const DangKyNhanHangList: React.FC<Props> = ({
  data,
  columns,
  onResizeColumn,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  isFetching,
  totalRecordsOverride,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sort,
  onSort,
  onView,
  onEdit,
  onDelete,
  onQuickAction,
}) => {
  const { t } = useTranslation();
  const tz = getTimezone();
  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const quickBtn = (item: DangKyNhanHang, size: 'sm' | 'md') => {
    if (!onQuickAction) return null;
    const mode = coTheCheckIn(item.trang_thai) ? 'checkIn' : coTheCheckOut(item.trang_thai) ? 'checkOut' : null;
    if (!mode) return null;
    const isIn = mode === 'checkIn';
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onQuickAction(item, mode);
        }}
        className={cn(
          'inline-flex items-center gap-1 rounded-md font-medium border',
          size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm min-h-[40px]',
          isIn
            ? 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20'
            : 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
        )}
      >
        {isIn ? <LogIn size={14} /> : <LogOut size={14} />}
        {t(isIn ? 'dangKyNhanHang.toolbar.checkIn' : 'dangKyNhanHang.toolbar.checkOut')}
      </button>
    );
  };

  /** Check in / check out nhanh trong cột Thao tác (icon nhỏ, không làm hàng cao lên). */
  const quickIcon = (item: DangKyNhanHang) => {
    if (!onQuickAction) return null;
    const mode = coTheCheckIn(item.trang_thai) ? 'checkIn' : coTheCheckOut(item.trang_thai) ? 'checkOut' : null;
    if (!mode) return null;
    const isIn = mode === 'checkIn';
    const label = t(isIn ? 'dangKyNhanHang.toolbar.checkIn' : 'dangKyNhanHang.toolbar.checkOut');
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onQuickAction(item, mode);
        }}
        className={cn(
          'p-1.5 rounded-md',
          isIn ? 'text-primary hover:bg-primary/10' : 'text-emerald-600 hover:bg-emerald-500/10'
        )}
        title={label}
        aria-label={label}
      >
        {isIn ? <LogIn size={14} /> : <LogOut size={14} />}
      </button>
    );
  };

  const renderCell = (colId: string, item: DangKyNhanHang) => {
    // Mỗi ô đúng 1 dòng chữ (nowrap / truncate) — hàng thấp, dễ dò nhiều phiếu.
    const one = (text: React.ReactNode, className?: string, title?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)} title={title}>
        {text}
      </span>
    );
    switch (colId) {
      case 'ngay_dang_ky':
        return one(formatYmdToDisplay(item.ngay_dang_ky), 'tabular-nums');
      case 'trang_thai':
        return <TrangThaiBadge value={item.trang_thai} />;
      case 'so_xe':
        return one(item.so_xe || '—', 'font-mono font-medium');
      case 'so_cont':
        return one(item.so_cont || '—', 'font-mono text-muted-foreground');
      case 'khach_hang':
        return one(item.khach_hang || '—', undefined, item.khach_hang ?? undefined);
      case 'loai_hang_hoa':
        return one(item.loai_hang_hoa || '—', undefined, item.loai_hang_hoa ?? undefined);
      case 'so_luong_dang_ky':
        return one(item.so_luong_dang_ky != null ? formatNumberVN(item.so_luong_dang_ky) : '—', 'tabular-nums');
      case 'ten_tai_xe':
        return one(item.ten_tai_xe || '—', undefined, item.ten_tai_xe ?? undefined);
      case 'sdt_tai_xe':
        return one(item.sdt_tai_xe || '—', 'tabular-nums text-muted-foreground');
      case 'gio_dang_ky':
        return one(
          item.gio_dang_ky_tu || item.gio_dang_ky_den
            ? `${item.gio_dang_ky_tu ?? '…'} – ${item.gio_dang_ky_den ?? '…'}`
            : '—',
          'tabular-nums text-muted-foreground'
        );
      case 'tg_vao_thuc_te': {
        const tre = soPhutVaoTre(item.ngay_dang_ky, item.gio_dang_ky_tu, item.tg_vao_thuc_te, tz);
        return one(
          item.tg_vao_thuc_te ? formatTimeDateShort(item.tg_vao_thuc_te) : '—',
          cn('tabular-nums', (tre ?? 0) > NGUONG_TRE_PHUT && 'text-rose-600 dark:text-rose-400 font-medium'),
          item.tg_vao_thuc_te ? formatDateTimeShort(item.tg_vao_thuc_te) : undefined
        );
      }
      case 'tg_ra_thuc_te': {
        const qua = soPhutRaQuaGio(item.ngay_dang_ky, item.gio_dang_ky_tu, item.gio_dang_ky_den, item.tg_ra_thuc_te, tz);
        return one(
          item.tg_ra_thuc_te ? formatTimeDateShort(item.tg_ra_thuc_te) : '—',
          cn('tabular-nums', (qua ?? 0) > NGUONG_TRE_PHUT && 'text-rose-600 dark:text-rose-400 font-medium'),
          item.tg_ra_thuc_te ? formatDateTimeShort(item.tg_ra_thuc_te) : undefined
        );
      }
      case 'thoi_luong': {
        const p = thoiLuong(item);
        return one(
          p != null ? formatThoiLuong(p) : '—',
          cn('tabular-nums', item.trang_thai === 'da_vao' && 'text-amber-600 dark:text-amber-400')
        );
      }
      case 'tong_so_luong':
        return one(item.tong_so_luong ? formatNumberVN(item.tong_so_luong) : '—', 'tabular-nums font-medium');
      case 'ten_chi_nhanh':
        return one(item.ten_chi_nhanh || '—', 'text-muted-foreground');
      case 'ghi_chu':
        return one(item.ghi_chu || '—', 'text-muted-foreground', item.ghi_chu ?? undefined);
      case 'ten_nguoi_tao':
        return one(item.ten_nguoi_tao || '—', 'text-muted-foreground');
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {quickIcon(item)}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                title={t('common.edit')}
                aria-label={t('common.edit')}
              >
                <Edit size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                title={t('common.delete')}
                aria-label={t('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: DangKyNhanHang, isSelected: boolean) => {
    const p = thoiLuong(item);
    return (
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
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <div className="text-sm font-semibold font-mono truncate">{item.so_xe || item.so_cont || '—'}</div>
            {item.so_xe && item.so_cont && (
              <div className="text-xs text-muted-foreground font-mono truncate">{item.so_cont}</div>
            )}
          </div>
          <TrangThaiBadge value={item.trang_thai} />
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
          <span>{formatYmdToDisplay(item.ngay_dang_ky)}</span>
          {(item.gio_dang_ky_tu || item.gio_dang_ky_den) && (
            <span>
              {item.gio_dang_ky_tu ?? '…'} – {item.gio_dang_ky_den ?? '…'}
            </span>
          )}
          {item.khach_hang && <span>{item.khach_hang}</span>}
          {item.loai_hang_hoa && <span>{item.loai_hang_hoa}</span>}
          {item.ten_tai_xe && <span>{item.ten_tai_xe}</span>}
        </div>
        {(item.tg_vao_thuc_te || item.tong_so_luong > 0) && (
          <div className="text-xs mt-1.5 flex flex-wrap gap-x-3 gap-y-1 tabular-nums">
            {item.tg_vao_thuc_te && (
              <span>
                {t('dangKyNhanHang.col.gioVao')}: {formatDateTimeShort(item.tg_vao_thuc_te)}
              </span>
            )}
            {item.tg_ra_thuc_te && (
              <span>
                {t('dangKyNhanHang.col.gioRa')}: {formatDateTimeShort(item.tg_ra_thuc_te)}
              </span>
            )}
            {p != null && <span className="font-medium">{formatThoiLuong(p)}</span>}
            {item.tong_so_luong > 0 && (
              <span>
                {formatNumberVN(item.tong_so_luong)} {t('dangKyNhanHang.hangHoa.thung')}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-border mt-2">
          <div>{quickBtn(item, 'md')}</div>
          <div className="flex gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                aria-label={t('common.edit')}
              >
                <Edit size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                aria-label={t('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <GenericTable<DangKyNhanHang>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('dangKyNhanHang.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sort={sort}
      onSort={onSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      actionsColumnWidth={onQuickAction ? 100 : undefined}
      emptyTitle={t('dangKyNhanHang.empty')}
      emptyDescription={t('dangKyNhanHang.emptyHint')}
    />
  );
};

export default DangKyNhanHangList;
