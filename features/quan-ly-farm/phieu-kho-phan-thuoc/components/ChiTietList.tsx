import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { ChiTietPhieuKhoPTFlat, LoaiPhieuKhoPT, TrangThaiPhieuKhoPT } from '../core/types';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import EmptyState from '../../../../components/shared/EmptyState';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';

interface Props {
  rows: ChiTietPhieuKhoPTFlat[];
  visibleColumns: ColumnConfig[];
  sort: { column: string | null; direction: 'asc' | 'desc' | null };
  setSort: (column: string, direction: 'asc' | 'desc' | null) => void;
  isLoading: boolean;
  isFetchingOverlay: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onRowClick: (row: ChiTietPhieuKhoPTFlat) => void;
}

function LoaiBadge({ loai }: { loai: LoaiPhieuKhoPT }) {
  const { t } = useTranslation();
  const label =
    loai === 'nhập' ? t('phieuKhoPhanThuoc.tabs.nhap') : loai === 'xuất' ? t('phieuKhoPhanThuoc.tabs.xuat') : t('phieuKhoPhanThuoc.tabs.chuyen');
  const cls =
    loai === 'nhập'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : loai === 'xuất'
        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: TrangThaiPhieuKhoPT }) {
  const { t } = useTranslation();
  const label =
    status === 'Chờ duyệt'
      ? t('phieuKhoPhanThuoc.status.pending')
      : status === 'Đã duyệt'
        ? t('phieuKhoPhanThuoc.status.approved')
        : t('phieuKhoPhanThuoc.status.rejected');
  const cls =
    status === 'Chờ duyệt'
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      : status === 'Đã duyệt'
        ? 'bg-primary/10 text-primary border-primary/20'
        : 'bg-rose-500/10 text-rose-600 border-rose-500/20';
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {label}
    </span>
  );
}

const ChiTietList: React.FC<Props> = ({
  rows,
  visibleColumns,
  sort,
  setSort,
  isLoading,
  isFetchingOverlay,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}) => {
  const { t } = useTranslation();

  const renderCell = (row: ChiTietPhieuKhoPTFlat, col: ColumnConfig) => {
    switch (col.id) {
      case 'so_phieu':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span
              className="font-mono text-xs font-medium text-primary cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onRowClick(row);
              }}
            >
              {row.so_phieu}
            </span>
          </td>
        );
      case 'ngay':
        return (
          <td key={col.id} className="px-4 py-3 text-muted-foreground text-sm" style={getColumnCellStyle(col)}>
            {formatDateShort(row.ngay)}
          </td>
        );
      case 'loai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <LoaiBadge loai={row.loai} />
          </td>
        );
      case 'ten_kho':
        return (
          <td key={col.id} className="px-4 py-3 text-sm" style={getColumnCellStyle(col)}>
            {row.ten_kho ?? '—'}
          </td>
        );
      case 'ten_kho_den':
        return (
          <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground" style={getColumnCellStyle(col)}>
            {row.ten_kho_den ?? '—'}
          </td>
        );
      case 'trang_thai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <StatusBadge status={row.trang_thai} />
          </td>
        );
      case 'ma_hang':
        return (
          <td key={col.id} className="px-4 py-3 font-mono text-xs" style={getColumnCellStyle(col)}>
            {row.ma_hang ?? '—'}
          </td>
        );
      case 'ten_hang':
        return (
          <td key={col.id} className="px-4 py-3 text-sm" style={getColumnCellStyle(col)}>
            {row.ten_hang ?? row.ten_hang_hoa ?? '—'}
          </td>
        );
      case 'so_luong':
        return (
          <td key={col.id} className="px-4 py-3 tabular-nums text-sm" style={getColumnCellStyle(col)}>
            {formatNumberVN(row.so_luong)}
          </td>
        );
      case 'don_gia':
        return (
          <td key={col.id} className="px-4 py-3 tabular-nums text-sm text-muted-foreground" style={getColumnCellStyle(col)}>
            {formatNumberVN(row.don_gia)}
          </td>
        );
      case 'thanh_tien':
        return (
          <td key={col.id} className="px-4 py-3 tabular-nums text-sm" style={getColumnCellStyle(col)}>
            {formatNumberVN(row.thanh_tien)}
          </td>
        );
      case 'don_vi_tinh':
        return (
          <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground" style={getColumnCellStyle(col)}>
            {row.don_vi_tinh ?? '—'}
          </td>
        );
      case 'so_lot':
        return (
          <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground" style={getColumnCellStyle(col)}>
            {row.so_lot ?? '—'}
          </td>
        );
      case 'ghi_chu':
        return (
          <td
            key={col.id}
            className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate"
            style={getColumnCellStyle(col)}
            title={row.ghi_chu ?? ''}
          >
            {row.ghi_chu ?? '—'}
          </td>
        );
      case 'ten_nguoi_duyet':
        return (
          <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground" style={getColumnCellStyle(col)}>
            {row.ten_nguoi_duyet ?? (row.id_nguoi_duyet != null ? `#${row.id_nguoi_duyet}` : '—')}
          </td>
        );
      default:
        return (
          <td key={col.id} className="px-4 py-3 text-sm" style={getColumnCellStyle(col)}>
            —
          </td>
        );
    }
  };

  const sortedRows = useMemo(() => {
    if (!sort.column || !sort.direction) return rows;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sort.column!];
      const bVal = (b as Record<string, unknown>)[sort.column!];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return dir;
      if (bVal == null) return -dir;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return cmp * dir;
    });
  }, [rows, sort.column, sort.direction]);

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label={t('common.loading')} />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<Package size={48} className="text-muted-foreground/50" />}
        title={t('phieuKhoPhanThuoc.chiTietTab.empty')}
        description={t('phieuKhoPhanThuoc.chiTietTab.emptyHint')}
      />
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      {isFetchingOverlay ? (
        <div
          className="absolute inset-0 z-[25] pointer-events-none flex items-start justify-center pt-3 bg-background/30 backdrop-blur-[1px]"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-6 w-6 rounded-full border-2 border-primary/35 border-t-primary animate-spin shadow-sm" aria-hidden />
        </div>
      ) : null}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/80 border-b border-border whitespace-nowrap cursor-pointer hover:bg-muted/80"
                  style={getColumnCellStyle(col)}
                  onClick={() => setSort(col.id, sort.column === col.id && sort.direction === 'asc' ? 'desc' : 'asc')}
                >
                  {col.label}
                  {sort.column === col.id && (sort.direction === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onRowClick(row)}
              >
                {visibleColumns.map((col) => renderCell(row, col))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePaginationFooter
        totalRecords={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        recordsLabel={t('phieuKhoPhanThuoc.footerRecords')}
      />
    </div>
  );
};

export default ChiTietList;
