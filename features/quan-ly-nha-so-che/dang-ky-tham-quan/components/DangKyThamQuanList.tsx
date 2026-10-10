import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, LogIn, LogOut, Trash2, Users } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import { cn, formatDateTimeShort, formatTimeDateShort } from '../../../../lib/utils';
import { coTheCheckIn, coTheCheckOut } from '../../dang-ky-nhan-hang/core/trang-thai';
import type { DangKyThamQuan } from '../core/types';
import { donViCuaPhieu, khoangThoiGian, mucDichCuaPhieu, quocTichCuaPhieu } from '../utils/hien-thi';
import TrangThaiBadge from './TrangThaiBadge';

interface Props {
  data: DangKyThamQuan[];
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
  onView: (item: DangKyThamQuan) => void;
  onEdit?: (item: DangKyThamQuan) => void;
  onDelete?: (id: string) => void;
  onQuickAction?: (item: DangKyThamQuan, mode: 'checkIn' | 'checkOut') => void;
}

const DangKyThamQuanList: React.FC<Props> = ({
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
  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const quickMode = (item: DangKyThamQuan) =>
    coTheCheckIn(item.trang_thai) ? 'checkIn' : coTheCheckOut(item.trang_thai) ? 'checkOut' : null;

  const quickBtn = (item: DangKyThamQuan, size: 'icon' | 'md') => {
    const mode = onQuickAction ? quickMode(item) : null;
    if (!mode || !onQuickAction) return null;
    const isIn = mode === 'checkIn';
    const label = t(isIn ? 'dangKyThamQuan.toolbar.checkIn' : 'dangKyThamQuan.toolbar.checkOut');
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onQuickAction(item, mode);
        }}
        className={cn(
          size === 'icon'
            ? cn('p-1.5 rounded-md', isIn ? 'text-primary hover:bg-primary/10' : 'text-emerald-600 hover:bg-emerald-500/10')
            : cn(
                'inline-flex items-center gap-1 rounded-md font-medium border px-3 py-2 text-sm min-h-[40px]',
                isIn
                  ? 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20'
                  : 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
              )
        )}
        title={label}
        aria-label={label}
      >
        {isIn ? <LogIn size={14} /> : <LogOut size={14} />}
        {size === 'md' && label}
      </button>
    );
  };

  const nutSuaXoa = (item: DangKyThamQuan, lon: boolean) => (
    <>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className={cn('text-primary hover:bg-primary/10', lon ? 'p-2 rounded-lg' : 'p-1.5 rounded-md')}
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
          className={cn('text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30', lon ? 'p-2 rounded-lg' : 'p-1.5 rounded-md')}
          title={t('common.delete')}
          aria-label={t('common.delete')}
        >
          <Trash2 size={14} />
        </button>
      )}
    </>
  );

  const renderCell = (colId: string, item: DangKyThamQuan) => {
    const one = (text: React.ReactNode, className?: string, title?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)} title={title}>
        {text}
      </span>
    );
    switch (colId) {
      case 'tg_bat_dau':
        return one(khoangThoiGian(item), 'tabular-nums');
      case 'trang_thai':
        return <TrangThaiBadge value={item.trang_thai} />;
      case 'nguoi_dai_dien':
        return one(item.nguoi_dai_dien || item.khach[0]?.ho_ten || '—', 'font-medium');
      case 'so_khach':
        return one(item.khach.length, 'tabular-nums text-center');
      case 'don_vi': {
        const v = donViCuaPhieu(item);
        return one(v || '—', undefined, v || undefined);
      }
      case 'quoc_tich':
        return one(quocTichCuaPhieu(item) || '—', 'text-muted-foreground');
      case 'muc_dich': {
        const v = mucDichCuaPhieu(item);
        return one(v || '—', undefined, v || undefined);
      }
      case 'phuong_tien':
        return one(item.phuong_tien ? t(`dangKyThamQuan.phuongTien.${item.phuong_tien}`) : '—', 'text-muted-foreground');
      case 'ten_nguoi_tiep_don':
        return one(item.ten_nguoi_tiep_don || '—');
      case 'tg_vao_thuc_te':
        return one(
          item.tg_vao_thuc_te ? formatTimeDateShort(item.tg_vao_thuc_te) : '—',
          'tabular-nums',
          item.tg_vao_thuc_te ? formatDateTimeShort(item.tg_vao_thuc_te) : undefined
        );
      case 'tg_ra_thuc_te':
        return one(
          item.tg_ra_thuc_te ? formatTimeDateShort(item.tg_ra_thuc_te) : '—',
          'tabular-nums',
          item.tg_ra_thuc_te ? formatDateTimeShort(item.tg_ra_thuc_te) : undefined
        );
      case 'ten_chi_nhanh':
        return one(item.ten_chi_nhanh || '—', 'text-muted-foreground');
      case 'ghi_chu':
        return one(item.ghi_chu || '—', 'text-muted-foreground', item.ghi_chu ?? undefined);
      case 'ten_nguoi_tao':
        return one(item.ten_nguoi_tao || '—', 'text-muted-foreground');
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {quickBtn(item, 'icon')}
            {nutSuaXoa(item, false)}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: DangKyThamQuan, isSelected: boolean) => {
    const donVi = donViCuaPhieu(item);
    const mucDich = mucDichCuaPhieu(item);
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
            <div className="text-sm font-semibold truncate">{item.nguoi_dai_dien || item.khach[0]?.ho_ten || '—'}</div>
            {donVi && <div className="text-xs text-muted-foreground truncate">{donVi}</div>}
          </div>
          <TrangThaiBadge value={item.trang_thai} />
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
          <span className="tabular-nums">{khoangThoiGian(item)}</span>
          <span className="inline-flex items-center gap-1">
            <Users size={12} />
            {item.khach.length} {t('dangKyThamQuan.khach.nguoi')}
          </span>
          {mucDich && <span>{mucDich}</span>}
        </div>
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-border mt-2">
          <div>{quickBtn(item, 'md')}</div>
          <div className="flex gap-1">{nutSuaXoa(item, true)}</div>
        </div>
      </div>
    );
  };

  return (
    <GenericTable<DangKyThamQuan>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('dangKyThamQuan.loading')}
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
      emptyTitle={t('dangKyThamQuan.empty')}
      emptyDescription={t('dangKyThamQuan.emptyHint')}
    />
  );
};

export default DangKyThamQuanList;
