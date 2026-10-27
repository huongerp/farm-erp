import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import type { DgdvListRow } from '../services/danh-gia-dau-vao-db.service';
import { khoangNgayTuan } from '../utils/export-danh-sach';
import { phieuDaKhoa } from '../core/permissions';

interface Props {
  data: DgdvListRow[];
  columns: ColumnConfig[];
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  isFetching?: boolean;
  totalRecordsOverride?: number;
  sort?: SortState;
  onSort?: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: DgdvListRow) => void;
  onDelete?: (id: string) => void;
  onView?: (item: DgdvListRow) => void;
  canEditRow: (item: DgdvListRow) => boolean;
  canDeleteRow: (item: DgdvListRow) => boolean;
}

export const TrangThaiDgdvBadge: React.FC<{ trangThai: DgdvListRow['trang_thai'] }> = ({ trangThai }) => {
  const { t } = useTranslation();
  const khoa = phieuDaKhoa({ trang_thai: trangThai });
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        khoa
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100'
          : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
      )}
    >
      {t(`danhGiaDauVao.trangThai.${trangThai}`)}
    </span>
  );
};

const DgdvList: React.FC<Props> = ({
  data,
  columns,
  onResizeColumn,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  isFetching,
  totalRecordsOverride,
  sort,
  onSort,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
  canEditRow,
  canDeleteRow,
}) => {
  const { t } = useTranslation();
  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);

  const nutSua = (item: DgdvListRow, lon?: boolean) =>
    onEdit && canEditRow(item) ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(item);
        }}
        className={
          lon
            ? 'h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg'
            : 'p-1.5 text-primary hover:bg-primary/10 rounded-md'
        }
        title={t('common.edit')}
        aria-label={t('common.edit')}
      >
        <Edit size={lon ? 16 : 14} />
      </button>
    ) : null;
  const nutXoa = (item: DgdvListRow, lon?: boolean) =>
    onDelete && canDeleteRow(item) ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        className={
          lon
            ? 'h-10 w-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 rounded-lg'
            : 'p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md'
        }
        title={t('common.delete')}
        aria-label={t('common.delete')}
      >
        <Trash2 size={lon ? 16 : 14} />
      </button>
    ) : null;

  const renderCell = (colId: string, item: DgdvListRow) => {
    switch (colId) {
      case 'nam_tuan':
        return (
          <span className="text-sm font-medium tabular-nums">
            {t('danhGiaDauVao.list.namTuan', { tuan: item.tuan, nam: item.nam })}
          </span>
        );
      case 'khoang_ngay':
        return <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{khoangNgayTuan(item.nam, item.tuan)}</span>;
      case 'id_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{item.ten_chi_nhanh ?? '—'}</span>;
      case 'tong_thu_tuan':
        return <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(item.tong_thu_tuan)}</span>;
      case 'ksc_tuan':
        return (
          <span className={cn('text-sm tabular-nums', item.ksc_tuan > 0 && 'text-rose-600 font-medium')}>
            {formatNumberVN(item.ksc_tuan)}
          </span>
        );
      case 'trang_thai':
        return <TrangThaiDgdvBadge trangThai={item.trang_thai} />;
      case 'ten_nguoi_tao':
        return <span className="text-sm text-muted-foreground line-clamp-2">{item.ten_nguoi_tao?.trim() || '—'}</span>;
      case 'ghi_chu':
        return <span className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{item.ghi_chu?.trim() || '—'}</span>;
      case 'tg_tao':
        return <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{formatDateTimeShort(item.tg_tao)}</span>;
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{formatDateTimeShort(item.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {nutSua(item)}
            {nutXoa(item)}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: DgdvListRow, isSelected: boolean) => {
    const sua = nutSua(item, true);
    const xoa = nutXoa(item, true);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView?.(item)}
        onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
        className={cn(
          'bg-card rounded-xl border p-3.5 shadow-sm transition-all',
          isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {t('danhGiaDauVao.list.namTuan', { tuan: item.tuan, nam: item.nam })} · {item.ten_chi_nhanh ?? '—'}
            </h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">{khoangNgayTuan(item.nam, item.tuan)}</p>
          </div>
          <TrangThaiDgdvBadge trangThai={item.trang_thai} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm tabular-nums">
          <div className="rounded-lg bg-muted/40 px-2.5 py-2">
            <div className="text-xs text-muted-foreground">{t('danhGiaDauVao.store.colTongThu')}</div>
            <div className="font-semibold text-primary">{formatNumberVN(item.tong_thu_tuan)}</div>
          </div>
          <div className="rounded-lg bg-muted/40 px-2.5 py-2">
            <div className="text-xs text-muted-foreground">{t('danhGiaDauVao.store.colKsc')}</div>
            <div className="font-semibold">{formatNumberVN(item.ksc_tuan)}</div>
          </div>
        </div>
        {(sua || xoa) && (
          <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
            {sua}
            {xoa}
          </div>
        )}
      </div>
    );
  };

  return (
    <GenericTable<DgdvListRow>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      sort={sort}
      onSort={onSort}
      loadingText={t('danhGiaDauVao.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('danhGiaDauVao.empty')}
      emptyDescription={t('danhGiaDauVao.emptyHint')}
    />
  );
};

export default DgdvList;
