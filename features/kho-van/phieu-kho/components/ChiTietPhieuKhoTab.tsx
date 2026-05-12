import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';
import { useChiTietPhieuKhoPaged, usePhieuKhoById, useDeletePhieuKho } from '../hooks/use-phieu-kho';
import { usePhieuKhoViewScope } from '../hooks/use-phieu-kho-view-scope';
import { buildChiTietPhieuKhoListServerQuery, fetchAllChiTietPhieuKhoForListQuery } from '../services/phieu-kho-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useEmployeesRefQuery, useDoiTacRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useNhomDoiTacList, useTagList, useDoiTacList } from '../../danh-sach-doi-tac/hooks/use-doi-tac';
import { useChiTietPhieuKhoStore } from '../store/useChiTietPhieuKhoStore';
import type { ChiTietPhieuKhoFlat, PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import type { DoiTac } from '../../danh-sach-doi-tac/core/types';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import ChiTietPhieuKhoToolbar from './ChiTietPhieuKhoToolbar';
import PhieuKhoDetail from './PhieuKhoDetail';
import PhieuKhoForm from './PhieuKhoForm';
import DanhSachKhoForm from '../../danh-sach-kho/components/danh-sach-kho-form';
import DanhSachHangHoaForm from '../../danh-sach-hang-hoa/components/DanhSachHangHoaForm';
import DoiTacForm from '../../danh-sach-doi-tac/components/DoiTacForm';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { LoaiPhieuKho, TrangThaiPhieuKho } from '../core/types';
import { LOAI_DB_TO_TAB } from '../core/types';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import {
  mapChiTietPhieuKhoFlatRow,
  getExportColumnsChiTietPhieuKho,
} from '../utils/export-phieu-kho-danh-sach';

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
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
  const { canCreate: canCreateHangHoa } = useModulePermission('kho-van/danh-sach-hang-hoa');
  const { data: khoList = [] } = useKhoList();
  const { data: empRef = [] } = useEmployeesRefQuery();
  const { data: doiTacNccRef = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: doiTacKhRef = [] } = useDoiTacRefQuery('khach_hang');
  const { data: nhomList = [] } = useNhomDoiTacList();
  const { data: tagList = [] } = useTagList();
  const { data: doiTacListAll = [] } = useDoiTacList();
  const viewScope = usePhieuKhoViewScope();

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
  } = useChiTietPhieuKhoStore(
    useShallow((s) => ({
      searchTerm: s.searchTerm,
      filters: s.filters,
      resetState: s.resetState,
      pagination: s.pagination,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      sort: s.sort,
      setSort: s.setSort,
      columns: s.columns,
    }))
  );

  const confirm = useConfirmStore((s) => s.confirm);
  const emptySelectedIds = useMemo(() => new Set<string>(), []);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<ChiTietPhieuKhoFlat[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [viewingPhieuId, setViewingPhieuId] = useState<string | null>(null);
  const [viewingLoai, setViewingLoai] = useState<'nhap' | 'xuat' | 'chuyen'>('nhap');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKho | null>(null);
  const [editingLoai, setEditingLoai] = useState<LoaiPhieuKhoTab>('nhap');
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [showAddKho, setShowAddKho] = useState(false);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const [showAddDoiTac, setShowAddDoiTac] = useState<'nha_cung_cap' | 'khach_hang' | null>(null);
  const addKhoResolveRef = useRef<(k: Kho | null) => void>(null);
  const addHangHoaResolveRef = useRef<(h: HangHoa | null) => void>(null);
  const addDoiTacResolveRef = useRef<(d: DoiTac | null) => void>(null);

  const { data: viewingPhieu } = usePhieuKhoById(viewingPhieuId ?? undefined);
  const { data: editingPhieuFull } = usePhieuKhoById(editingItem?.id);
  const deleteMutation = useDeletePhieuKho();

  const nextThuTuDoiTac = useMemo(() => {
    const list = showAddDoiTac ? doiTacListAll.filter((d) => d.loai_doi_tac === showAddDoiTac) : [];
    return list.length === 0 ? 1 : Math.max(...list.map((d) => d.thu_tu ?? 0)) + 1;
  }, [doiTacListAll, showAddDoiTac]);

  const dateRangeStr = useMemo(() => {
    if ((filters.datePreset ?? 'all') === 'all') {
      return { start: '', end: '' };
    }
    const range = getDateRangeFromPreset(
      (filters.datePreset ?? 'all') as DateRangePresetId,
      filters.customDateFrom ? new Date(filters.customDateFrom) : undefined,
      filters.customDateEnd ? new Date(filters.customDateEnd) : undefined
    );
    const toYyyyMmDd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: toYyyyMmDd(range.start), end: toYyyyMmDd(range.end) };
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const listServerQuery = useMemo(
    () =>
      buildChiTietPhieuKhoListServerQuery({
        searchTerm,
        filters,
        ngayFrom: dateRangeStr.start,
        ngayTo: dateRangeStr.end,
        viewScope,
        khoList,
      }),
    [searchTerm, filters, dateRangeStr.start, dateRangeStr.end, viewScope, khoList]
  );

  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);

  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = useChiTietPhieuKhoPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  /** Chỉ skeleton lần đầu; overlay khi refetch (keepPreviousData). */
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const sortedPageRows = useMemo(() => {
    if (!sort.column || !sort.direction) return tableRows;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...tableRows].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sort.column!];
      const bVal = (b as Record<string, unknown>)[sort.column!];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return dir;
      if (bVal == null) return -dir;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return cmp * dir;
    });
  }, [tableRows, sort.column, sort.direction]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    setPage(1);
  }, [listQueryKey, setPage]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const paginatedData = sortedPageRows;

  const doiTacForChips = useMemo(() => {
    const out: { id: string; ten_ncc: string }[] = [];
    const seen = new Set<string>();
    for (const d of doiTacNccRef) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      out.push({ id: d.id, ten_ncc: d.ten_ncc });
    }
    for (const d of doiTacKhRef) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      out.push({ id: d.id, ten_ncc: d.ten_ncc });
    }
    return out;
  }, [doiTacNccRef, doiTacKhRef]);

  const exportColumnsChiTiet = useMemo(() => getExportColumnsChiTietPhieuKho(t), [t]);
  const exportMapChiTiet = useCallback((row: ChiTietPhieuKhoFlat) => mapChiTietPhieuKhoFlatRow(row), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: exportRows,
      isOpen: showExport && !exportLoading,
      mapFn: exportMapChiTiet,
      pagination,
      selectedIds: emptySelectedIds,
      keyExtractor: (row) => row.id,
    });

  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllChiTietPhieuKhoForListQuery(listServerQuery)
      .then((rows) => {
        if (!cancelled) setExportRows(rows);
      })
      .catch(() => {
        if (!cancelled) setExportRows([]);
      })
      .finally(() => {
        if (!cancelled) setExportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showExport, listQueryKey, listServerQuery]);

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('phieuKho.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const handleRowClick = useCallback((row: ChiTietPhieuKhoFlat) => {
    setViewingPhieuId(row.id_phieu_kho);
    setViewingLoai(LOAI_DB_TO_TAB[row.loai]);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setViewingPhieuId(null);
  }, []);

  const handleEdit = useCallback((item: PhieuKho) => {
    setEditingItem(item);
    setEditingLoai(LOAI_DB_TO_TAB[item.loai]);
    setIsCopyMode(false);
    setShowForm(true);
  }, []);

  const handleCopy = useCallback((item: PhieuKho) => {
    const copy: PhieuKho = {
      ...item,
      id: '',
      so_phieu: '',
      trang_thai: 'Chờ duyệt',
      trao_doi: undefined,
      id_nguoi_duyet: undefined,
      ten_nguoi_duyet: undefined,
      nguoi_tao_id: undefined,
      ten_nguoi_tao: undefined,
      ngay: new Date().toISOString().slice(0, 10),
    };
    setEditingItem(copy);
    setEditingLoai(LOAI_DB_TO_TAB[item.loai]);
    setIsCopyMode(true);
    setViewingPhieuId(null);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
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
      case 'so_lot':
        return (
          <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground" style={getColumnCellStyle(col)}>
            {row.so_lot ?? '—'}
          </td>
        );
      case 'ghi_chu':
        return (
          <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate" style={getColumnCellStyle(col)} title={row.ghi_chu ?? ''}>
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
        return <td key={col.id} className="px-4 py-3 text-sm" style={getColumnCellStyle(col)}>—</td>;
    }
  };

  if (isLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ChiTietPhieuKhoToolbar
        data={tableRows}
        chipCountsMode="unweighted"
        employeesForChips={empRef}
        doiTacForChips={doiTacForChips}
        khoList={khoList}
        onExport={handleExport}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {isFetchingOverlay ? (
          <div
            className="absolute inset-0 z-[25] pointer-events-none flex items-start justify-center pt-3 bg-background/30 backdrop-blur-[1px]"
            aria-busy="true"
            aria-live="polite"
          >
            <div
              className="h-6 w-6 rounded-full border-2 border-primary/35 border-t-primary animate-spin shadow-sm"
              aria-hidden
            />
          </div>
        ) : null}
        {totalCount === 0 ? (
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
              totalRecords={totalCount}
              page={pagination.page}
              pageSize={pagination.pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              recordsLabel={t('phieuKho.footerRecords')}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <PhieuKhoForm
            loai={editingLoai}
            khoList={khoList}
            initialData={isCopyMode ? editingItem : (editingPhieuFull ?? editingItem)}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
              setIsCopyMode(false);
            }}
            onRequestAddKho={
              () =>
                new Promise<Kho | null>((resolve) => {
                  addKhoResolveRef.current = resolve;
                  setShowAddKho(true);
                })
            }
            onRequestAddHangHoa={
              canCreateHangHoa
                ? () =>
                    new Promise<HangHoa | null>((resolve) => {
                      addHangHoaResolveRef.current = resolve;
                      setShowAddHangHoa(true);
                    })
                : undefined
            }
            onRequestAddNcc={
              editingLoai === 'nhap'
                ? () =>
                    new Promise<DoiTac | null>((resolve) => {
                      addDoiTacResolveRef.current = resolve;
                      setShowAddDoiTac('nha_cung_cap');
                    })
                : undefined
            }
            onRequestAddKh={
              editingLoai === 'xuat'
                ? () =>
                    new Promise<DoiTac | null>((resolve) => {
                      addDoiTacResolveRef.current = resolve;
                      setShowAddDoiTac('khach_hang');
                    })
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddKho && (
          <DanhSachKhoForm
            initialData={null}
            onClose={() => {
              setShowAddKho(false);
              addKhoResolveRef.current?.(null);
              addKhoResolveRef.current = null;
            }}
            onSuccessCreate={(kho) => {
              addKhoResolveRef.current?.(kho);
              setShowAddKho(false);
              addKhoResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddHangHoa && (
          <DanhSachHangHoaForm
            initialData={null}
            onClose={() => {
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current?.(null);
              addHangHoaResolveRef.current = null;
            }}
            onSuccessCreate={(item) => {
              addHangHoaResolveRef.current?.(item);
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddDoiTac && (
          <DoiTacForm
            initialData={null}
            loaiDoiTac={showAddDoiTac}
            nhomList={nhomList}
            tagList={tagList}
            defaultThuTu={nextThuTuDoiTac}
            onClose={() => {
              setShowAddDoiTac(null);
              addDoiTacResolveRef.current?.(null);
              addDoiTacResolveRef.current = null;
            }}
            onSuccessCreate={(item) => {
              addDoiTacResolveRef.current?.(item);
              setShowAddDoiTac(null);
              addDoiTacResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>

      {viewingPhieu && !showForm && (
        <PhieuKhoDetail
          data={viewingPhieu}
          loai={viewingLoai}
          onClose={handleCloseDetail}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onCopy={canCreate ? handleCopy : undefined}
          canApprove={canApprove}
        />
      )}

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsChiTiet}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName="Phieu_kho_chi_tiet"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChiTietPhieuKhoTab;
