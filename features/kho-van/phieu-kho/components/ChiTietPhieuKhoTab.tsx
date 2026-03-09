import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, FileText } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import { useChiTietPhieuKhoAll, usePhieuKhoById } from '../hooks/use-phieu-kho';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useChiTietPhieuKhoStore } from '../store/useChiTietPhieuKhoStore';
import type { ChiTietPhieuKhoFlat } from '../core/types';
import type { ChiTietPhieuKhoFilters } from '../store/useChiTietPhieuKhoStore';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import ChiTietPhieuKhoToolbar from './ChiTietPhieuKhoToolbar';
import PhieuKhoDetail from './PhieuKhoDetail';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { LoaiPhieuKho, TrangThaiPhieuKho } from '../core/types';
import { LOAI_DB_TO_TAB } from '../core/types';
import { useDeletePhieuKho } from '../hooks/use-phieu-kho';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';

function LoaiBadge({ loai }: { loai: LoaiPhieuKho }) {
  const { t } = useTranslation();
  const label = loai === 'nhập' ? t('phieuKho.tabs.nhap') : loai === 'xuất' ? t('phieuKho.tabs.xuat') : t('phieuKho.tabs.chuyen');
  const cls =
    loai === 'nhập'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : loai === 'xuất'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: TrangThaiPhieuKho }) {
  const { t } = useTranslation();
  const label = status === 'Chờ duyệt' ? t('phieuKho.status.pending') : status === 'Đã duyệt' ? t('phieuKho.status.approved') : t('phieuKho.status.rejected');
  const cls =
    status === 'Chờ duyệt' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : status === 'Đã duyệt' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20';
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {label}
    </span>
  );
}

const ChiTietPhieuKhoTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: allRows = [], isLoading } = useChiTietPhieuKhoAll();
  const { data: khoList = [] } = useKhoList();
  const {
    searchTerm,
    filters,
    resetState,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
    columns,
  } = useChiTietPhieuKhoStore();

  const confirm = useConfirmStore((s) => s.confirm);
  const [viewingPhieuId, setViewingPhieuId] = useState<string | null>(null);
  const [viewingLoai, setViewingLoai] = useState<'nhap' | 'xuat' | 'chuyen'>('nhap');
  const { data: viewingPhieu } = usePhieuKhoById(viewingPhieuId ?? undefined);
  const deleteMutation = useDeletePhieuKho();

  const dateRangeStr = useMemo(() => {
    const range = getDateRangeFromPreset(
      (filters.datePreset ?? 'this_month') as DateRangePresetId,
      filters.customDateFrom ? new Date(filters.customDateFrom) : undefined,
      filters.customDateEnd ? new Date(filters.customDateEnd) : undefined
    );
    const toYyyyMmDd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: toYyyyMmDd(range.start), end: toYyyyMmDd(range.end) };
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const filterFn = useCallback(
    (row: ChiTietPhieuKhoFlat, term: string, f: ChiTietPhieuKhoFilters, range: { start: string; end: string }) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        row.so_phieu.toLowerCase().includes(searchLower) ||
        (row.ma_hang?.toLowerCase().includes(searchLower) ?? false) ||
        (row.ten_hang?.toLowerCase().includes(searchLower) ?? false);
      const matchesLoai = (f.loai?.length ?? 0) === 0 || (f.loai ?? []).includes(row.loai);
      const rowDate = (row.ngay as string) || '';
      const matchesDate = rowDate >= range.start && rowDate <= range.end;
      const matchesKho = (f.khoIds?.length ?? 0) === 0 || (f.khoIds ?? []).includes(row.kho_id);
      return matchesSearch && matchesLoai && matchesDate && matchesKho;
    },
    []
  );

  const filteredList = useMemo(() => {
    return allRows.filter((row) => filterFn(row, searchTerm, filters, dateRangeStr));
  }, [allRows, searchTerm, filters, dateRangeStr, filterFn]);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filteredList].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sort.column!];
      const bVal = (b as Record<string, unknown>)[sort.column!];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return dir;
      if (bVal == null) return -dir;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return cmp * dir;
    });
  }, [filteredList, sort.column, sort.direction]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(sortedList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return sortedList.slice(start, start + pagination.pageSize);
  }, [sortedList, pagination.page, pagination.pageSize]);

  const handleRowClick = useCallback((row: ChiTietPhieuKhoFlat) => {
    setViewingPhieuId(row.id_phieu_kho);
    setViewingLoai(LOAI_DB_TO_TAB[row.loai]);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setViewingPhieuId(null);
  }, []);

  const handleDeleteFromDetail = useCallback(
    (id: string) => {
      confirm({
        title: t('phieuKho.deleteTitle'),
        message: t('phieuKho.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          deleteMutation.mutate(id, {
            onSuccess: () => {
              setViewingPhieuId(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation]
  );

  const renderCell = (row: ChiTietPhieuKhoFlat, col: ColumnConfig) => {
    switch (col.id) {
      case 'so_phieu':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-mono text-xs font-medium text-primary cursor-pointer hover:underline" onClick={() => handleRowClick(row)}>
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
      case 'ten_nha_cung_cap':
        return (
          <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground" style={getColumnCellStyle(col)}>
            {row.ten_nha_cung_cap ?? '—'}
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
            {row.ten_hang ?? '—'}
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
      case 'ghi_chu':
        return (
          <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate" style={getColumnCellStyle(col)} title={row.ghi_chu ?? ''}>
            {row.ghi_chu ?? '—'}
          </td>
        );
      default:
        return <td key={col.id} className="px-4 py-3 text-sm" style={getColumnCellStyle(col)}>—</td>;
    }
  };

  if (isLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ChiTietPhieuKhoToolbar data={allRows} khoList={khoList} />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {filteredList.length === 0 ? (
          <EmptyState
            icon={<Package size={48} className="text-muted-foreground/50" />}
            title={t('phieuKho.chiTietTab.empty')}
            description={t('phieuKho.chiTietTab.emptyHint')}
          />
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.id}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted/80"
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
                  {paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(row)}
                    >
                      {visibleColumns.map((col) => renderCell(row, col))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePaginationFooter
              totalRecords={sortedList.length}
              page={pagination.page}
              pageSize={pagination.pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              recordsLabel={t('phieuKho.footerRecords')}
            />
          </>
        )}
      </div>

      {viewingPhieu && (
        <PhieuKhoDetail
          data={viewingPhieu}
          loai={viewingLoai}
          onClose={handleCloseDetail}
          onEdit={() => handleCloseDetail()}
          onDelete={handleDeleteFromDetail}
        />
      )}
    </div>
  );
};

export default ChiTietPhieuKhoTab;
