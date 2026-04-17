import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { FileText, Edit, Trash2, Package, Download } from 'lucide-react';
import { toast } from 'sonner';
import { usePhieuDeXuatVatTuChiTietPaged, usePhieuDeXuatVatTuById, useUpdatePhieuDeXuatVatTu } from '../hooks/use-phieu-de-xuat-vat-tu';
import { usePhieuDeXuatVatTuViewScope } from '../hooks/use-phieu-de-xuat-vat-tu-view-scope';
import {
  buildPhieuDeXuatChiTietListServerQuery,
  fetchAllPhieuDeXuatVatTuChiTietForListQuery,
  getPhieuDeXuatVatTuById,
} from '../services/phieu-de-xuat-vat-tu-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useDebouncedValue } from '../../../../lib/hooks/use-debounced-value';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useChiTietTabStore } from '../store/useChiTietTabStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTietRow } from '../core/types';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import { getTienDoMhBadgeClass } from '../core/constants';
import ChiTietTabToolbar from './ChiTietTabToolbar';
import ExportDialog from '../../../../components/shared/ExportDialog';
import GenericTable from '../../../../components/shared/GenericTable';
import { useExportData } from '../../../../lib/useExportData';
import { CHI_TIET_EXPORT_KEYS, getChiTietExportColumns, mapChiTietRowToExport } from '../utils/chi-tiet-export';
import Tooltip from '../../../../components/ui/Tooltip';
import Button from '../../../../components/ui/Button';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import ChiTietRowDetail from './ChiTietRowDetail';
import ChiTietRowEditModal, { type ChiTietRowEditPayload } from './ChiTietRowEditModal';
import ChuyenTienDoModal, { type ChuyenTienDoResult } from './ChuyenTienDoModal';
import { cn } from '../../../../lib/utils';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';

function phieuToFormValues(phieu: PhieuDeXuatVatTu): PhieuDeXuatVatTuFormValues {
  return {
    so_phieu: phieu.so_phieu,
    ngay: phieu.ngay,
    ngay_can: phieu.ngay_can,
    id_noi_de_xuat: phieu.id_noi_de_xuat,
    id_nguoi_de_xuat: phieu.id_nguoi_de_xuat,
    id_nguoi_duyet: phieu.id_nguoi_duyet ?? undefined,
    ghi_chu: phieu.ghi_chu ?? '',
    trang_thai: phieu.trang_thai,
    chi_tiet: (phieu.chi_tiet ?? []).map((ct) => ({
      id_hang_hoa: ct.id_hang_hoa,
      so_luong: ct.so_luong,
      thong_so: ct.thong_so ?? '',
      ghi_chu: ct.ghi_chu ?? '',
      id_tien_do_mh: ct.id_tien_do_mh ?? null,
      ten_tien_do_mh: ct.ten_tien_do_mh ?? null,
      trao_doi: ct.trao_doi ?? null,
    })),
  };
}

const ChiTietTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const { data: employees = [] } = useEmployeesRefQuery();

  const handleBack = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'list');
      return next;
    });
  }, [setSearchParams]);
  const { data: khoList = [] } = useKhoList();
  const viewScope = usePhieuDeXuatVatTuViewScope();

  const [viewingRow, setViewingRow] = useState<PhieuDeXuatVatTuChiTietRow | null>(null);
  const [editingRow, setEditingRow] = useState<PhieuDeXuatVatTuChiTietRow | null>(null);
  const [showChuyenTienDoModal, setShowChuyenTienDoModal] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<PhieuDeXuatVatTuChiTietRow[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  /** Khi mở "Chuyển tiến độ" từ drawer chi tiết 1 dòng */
  const [singleRowForChuyenTienDo, setSingleRowForChuyenTienDo] = useState<PhieuDeXuatVatTuChiTietRow | null>(null);

  const { data: phieuForEdit } = usePhieuDeXuatVatTuById(editingRow?.id_phieu_de_xuat_vat_tu);
  const updateMutation = useUpdatePhieuDeXuatVatTu();

  const {
    searchTerm,
    setSearchTerm,
    filters,
    columns,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    toggleColumn,
    reorderColumns,
    resetColumns,
    sort,
    setSort,
    resetState,
  } = useChiTietTabStore();

  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  const listServerQuery = useMemo(
    () =>
      buildPhieuDeXuatChiTietListServerQuery({
        searchTerm: debouncedSearchTerm,
        filters,
        viewScope,
        khoList,
      }),
    [debouncedSearchTerm, filters, viewScope, khoList]
  );
  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);
  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = usePhieuDeXuatVatTuChiTietPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = pageQuery.isPending || pageQuery.isFetching;

  useEffect(() => () => resetState(), [resetState]);

  useEffect(() => {
    setPage(1);
  }, [listQueryKey, setPage]);

  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllPhieuDeXuatVatTuChiTietForListQuery(listServerQuery)
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

  const hasSelection = selectedIds.size > 0;

  const handleSaveEdit = useCallback(
    (payload: ChiTietRowEditPayload) => {
      if (!editingRow || !phieuForEdit) return;
      const data: PhieuDeXuatVatTuFormValues = {
        ...phieuToFormValues(phieuForEdit),
        chi_tiet: (phieuForEdit.chi_tiet ?? []).map((ct) =>
          ct.id === editingRow.id
            ? { id_hang_hoa: ct.id_hang_hoa, so_luong: payload.so_luong, thong_so: payload.thong_so, ghi_chu: payload.ghi_chu, id_tien_do_mh: payload.id_tien_do_mh ?? null, ten_tien_do_mh: payload.ten_tien_do_mh ?? null, trao_doi: ct.trao_doi ?? null }
            : { id_hang_hoa: ct.id_hang_hoa, so_luong: ct.so_luong, thong_so: ct.thong_so ?? '', ghi_chu: ct.ghi_chu ?? '', id_tien_do_mh: ct.id_tien_do_mh ?? null, ten_tien_do_mh: ct.ten_tien_do_mh ?? null, trao_doi: ct.trao_doi ?? null }
        ),
      };
      updateMutation.mutate(
        { id: phieuForEdit.id, data },
        { onSuccess: () => setEditingRow(null) }
      );
    },
    [editingRow, phieuForEdit, updateMutation]
  );

  const handleChuyenTienDoConfirm = useCallback(
    async (result: ChuyenTienDoResult) => {
      const selectedRows = singleRowForChuyenTienDo
        ? [singleRowForChuyenTienDo]
        : tableRows.filter((r) => selectedIds.has(r.id));
      if (selectedRows.length === 0) return;
      const byPhieu = new Map<string, PhieuDeXuatVatTuChiTietRow[]>();
      selectedRows.forEach((r) => {
        const list = byPhieu.get(r.id_phieu_de_xuat_vat_tu) ?? [];
        list.push(r);
        byPhieu.set(r.id_phieu_de_xuat_vat_tu, list);
      });
      const traoDoiLine = `[${new Date().toISOString()}] Chuyển tiến độ sang: ${result.ten_tien_do_mh}. Ghi chú: ${result.ghi_chu || '—'}`;
      try {
        for (const [phieuId, list] of byPhieu) {
          const phieu = await getPhieuDeXuatVatTuById(phieuId);
          if (!phieu?.chi_tiet?.length) continue;
          const idSet = new Set(list.map((r) => r.id));
          const chi_tiet = (phieu.chi_tiet ?? []).map((ct) => {
            if (!idSet.has(ct.id)) {
              return {
                id_hang_hoa: ct.id_hang_hoa,
                so_luong: ct.so_luong,
                thong_so: ct.thong_so ?? '',
                ghi_chu: ct.ghi_chu ?? '',
                id_tien_do_mh: ct.id_tien_do_mh ?? null,
                ten_tien_do_mh: ct.ten_tien_do_mh ?? null,
                trao_doi: ct.trao_doi ?? null,
              };
            }
            const prev = (ct.trao_doi ?? '').trim();
            const newTraoDoi = prev ? `${prev}\n${traoDoiLine}` : traoDoiLine;
            return {
              id_hang_hoa: ct.id_hang_hoa,
              so_luong: ct.so_luong,
              thong_so: ct.thong_so ?? '',
              ghi_chu: ct.ghi_chu ?? '',
              id_tien_do_mh: result.id_tien_do_mh,
              ten_tien_do_mh: result.ten_tien_do_mh,
              trao_doi: newTraoDoi,
            };
          });
          const data: PhieuDeXuatVatTuFormValues = {
            ...phieuToFormValues(phieu),
            chi_tiet,
          };
          await updateMutation.mutateAsync({ id: phieuId, data });
        }
        toast.success(t('phieuDeXuatVatTu.chiTietTab.chuyenTienDoSuccess'));
        if (singleRowForChuyenTienDo) {
          setSingleRowForChuyenTienDo(null);
          setViewingRow((prev) => (prev?.id === singleRowForChuyenTienDo.id ? null : prev));
        } else {
          clearSelection();
        }
        setShowChuyenTienDoModal(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [selectedIds, tableRows, singleRowForChuyenTienDo, updateMutation, clearSelection, t]
  );

  const handleDelete = useCallback(
    (row: PhieuDeXuatVatTuChiTietRow) => {
      confirm({
        title: t('phieuDeXuatVatTu.deleteTitle'),
        message: t('phieuDeXuatVatTu.chiTietTab.deleteLineConfirm'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          const phieu = await getPhieuDeXuatVatTuById(row.id_phieu_de_xuat_vat_tu);
          if (!phieu || !phieu.chi_tiet?.length) return;
          if (phieu.chi_tiet.length <= 1) {
            toast.error(t('phieuDeXuatVatTu.chiTietTab.lastLineCannotDelete'));
            return;
          }
          const data: PhieuDeXuatVatTuFormValues = {
            ...phieuToFormValues(phieu),
            chi_tiet: phieu.chi_tiet.filter((ct) => ct.id !== row.id).map((ct) => ({
              id_hang_hoa: ct.id_hang_hoa,
              so_luong: ct.so_luong,
              thong_so: ct.thong_so ?? '',
              ghi_chu: ct.ghi_chu ?? '',
              id_tien_do_mh: ct.id_tien_do_mh ?? null,
              ten_tien_do_mh: ct.ten_tien_do_mh ?? null,
              trao_doi: ct.trao_doi ?? null,
            })),
          };
          updateMutation.mutate(
            { id: phieu.id, data },
            {
              onSuccess: () => {
                if (viewingRow?.id === row.id) setViewingRow(null);
              },
            }
          );
        },
      });
    },
    [confirm, t, updateMutation, viewingRow?.id]
  );

  const sortedRows = useMemo(() => {
    if (!sort.column || !sort.direction) return [...tableRows];
    const key = sort.column as keyof PhieuDeXuatVatTuChiTietRow;
    return [...tableRows].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      const aVal = va == null ? '' : String(va);
      const bVal = vb == null ? '' : String(vb);
      if (sort.direction === 'asc') return aVal.localeCompare(bVal, undefined, { numeric: true });
      return bVal.localeCompare(aVal, undefined, { numeric: true });
    });
  }, [tableRows, sort.column, sort.direction]);

  const phieuById = useMemo(() => new Map<string, PhieuDeXuatVatTu>(), []);

  const khoById = useMemo(() => {
    const m = new Map<string, Kho>();
    khoList.forEach((k) => m.set(k.id, k));
    return m;
  }, [khoList]);

  const exportColumns = useMemo(() => getChiTietExportColumns(t), [t]);

  const exportMapFn = useCallback(
    (row: PhieuDeXuatVatTuChiTietRow) =>
      mapChiTietRowToExport(row, phieuById.get(row.id_phieu_de_xuat_vat_tu), employees, khoById),
    [phieuById, employees, khoById]
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (r: PhieuDeXuatVatTuChiTietRow) => r.id,
  });

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const renderStatusBadge = useCallback((status: string | null) => {
    if (status == null) return <span className="text-muted-foreground">—</span>;
    return (
      <span
        className={cn(
          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
          status === 'Đã duyệt' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
          status === 'Chờ duyệt' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
          status === 'Không duyệt' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
          status !== 'Đã duyệt' && status !== 'Chờ duyệt' && status !== 'Không duyệt' && 'bg-muted text-muted-foreground border-border'
        )}
      >
        {status}
      </span>
    );
  }, []);

  const renderTienDoBadge = useCallback((tenTienDo: string | null | undefined) => {
    if (tenTienDo == null || tenTienDo === '') return <span className="text-muted-foreground text-sm">—</span>;
    return (
      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', getTienDoMhBadgeClass(tenTienDo))}>
        {tenTienDo}
      </span>
    );
  }, []);

  const renderCell = useCallback(
    (colId: string, item: PhieuDeXuatVatTuChiTietRow) => {
      switch (colId) {
        case 'so_phieu':
          return (
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.so_phieu ?? '—'}
            </span>
          );
        case 'ngay':
        case 'ngay_can':
          return <span className="text-sm text-muted-foreground">{item[colId as keyof PhieuDeXuatVatTuChiTietRow] ?? '—'}</span>;
        case 'ten_noi_de_xuat':
        case 'ten_nguoi_de_xuat':
        case 'ten_nguoi_duyet':
          return <span className="text-sm">{String(item[colId as keyof PhieuDeXuatVatTuChiTietRow] ?? '—')}</span>;
        case 'trang_thai_phieu':
          return renderStatusBadge(item.trang_thai_phieu);
        case 'ma_hang':
          return <span className="text-sm font-mono">{item.ma_hang ?? '—'}</span>;
        case 'ten_hang':
          return <span className="text-sm line-clamp-2">{item.ten_hang ?? '—'}</span>;
        case 'so_luong':
          return <span className="text-sm text-right tabular-nums">{Number(item.so_luong).toLocaleString()}</span>;
        case 'don_vi_tinh':
          return <span className="text-sm text-muted-foreground">{item.don_vi_tinh ?? '—'}</span>;
        case 'ten_tien_do_mh':
          return renderTienDoBadge(item.ten_tien_do_mh);
        case 'thong_so':
          return (
            <span className="text-xs text-muted-foreground line-clamp-2 max-w-[140px]">{item.thong_so ?? '—'}</span>
          );
        case 'ghi_chu':
          return (
            <span className="text-xs text-muted-foreground line-clamp-2 max-w-[160px]">{item.ghi_chu ?? '—'}</span>
          );
        case 'actions':
          return (
            <div className="flex items-center justify-center gap-1">
              <Tooltip content={t('common.view')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingRow(item);
                  }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                  aria-label={t('common.view')}
                >
                  <FileText size={16} />
                </button>
              </Tooltip>
              <Tooltip content={t('common.edit')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRow(item);
                  }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                  aria-label={t('common.edit')}
                >
                  <Edit size={16} />
                </button>
              </Tooltip>
              <Tooltip content={t('common.delete')} placement="left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
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
          return <span className="text-sm">{String(item[colId as keyof PhieuDeXuatVatTuChiTietRow] ?? '—')}</span>;
      }
    },
    [renderStatusBadge, t, handleDelete]
  );

  const handleRowClick = useCallback((item: PhieuDeXuatVatTuChiTietRow) => setViewingRow(item), []);

  const renderMobileCard = useCallback(
    (item: PhieuDeXuatVatTuChiTietRow, isSelected: boolean) => (
      <div
        className={cn('p-3 rounded-lg border cursor-pointer', isSelected ? 'border-primary bg-primary/5' : 'border-border')}
        onClick={() => setViewingRow(item)}
        onKeyDown={(e) => e.key === 'Enter' && setViewingRow(item)}
        role="button"
        tabIndex={0}
      >
        <div className="flex justify-between items-start gap-2">
          <span className="font-mono text-sm font-medium text-foreground">{item.so_phieu ?? '—'}</span>
          <div className="flex flex-wrap items-center gap-1 justify-end">
            {renderStatusBadge(item.trang_thai_phieu)}
            {item.ten_tien_do_mh ? renderTienDoBadge(item.ten_tien_do_mh) : null}
          </div>
        </div>
        <p className="text-sm text-foreground mt-0.5">{item.ma_hang ?? item.ten_hang ?? '—'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {Number(item.so_luong).toLocaleString()} {item.don_vi_tinh ?? ''} · {item.ten_noi_de_xuat ?? '—'}
        </p>
      </div>
    ),
    [renderStatusBadge, renderTienDoBadge]
  );

  if (pageQuery.isPending && !pageQuery.data) {
    return (
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <ChiTietTabToolbar
          data={[]}
          khoList={khoList}
          employees={employees}
          currentUserId={user?.id ?? null}
          selectedCount={0}
          onBack={handleBack}
        />
        <ListPageSkeleton />
      </div>
    );
  }

  const bulkActions = hasSelection ? (
    <>
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowExport(true)}
          disabled={totalCount === 0}
          className="h-8 w-8 p-0 flex items-center justify-center border-border text-muted-foreground hover:bg-muted/50 shrink-0 disabled:opacity-40"
        >
          <Download size={16} className="shrink-0" />
        </Button>
      </Tooltip>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setShowChuyenTienDoModal(true)}
        className="h-8 px-3 flex items-center gap-1.5 border border-border bg-card hover:bg-muted"
      >
        <Package size={14} className="shrink-0" />
        <span className="text-xs font-medium">{t('phieuDeXuatVatTu.chiTietTab.tienDoAction')}</span>
      </Button>
    </>
  ) : null;

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <ChiTietTabToolbar
          data={sortedRows}
          khoList={khoList}
          chipCountsMode="unweighted"
          employees={employees}
          currentUserId={user?.id ?? null}
          selectedCount={selectedIds.size}
          onBack={handleBack}
          bulkActions={bulkActions}
          onExport={() => setShowExport(true)}
          exportDisabled={totalCount === 0}
        />
        <GenericTable<PhieuDeXuatVatTuChiTietRow>
          data={sortedRows}
          columns={columns}
          isLoading={isLoading}
          totalRecordsOverride={totalCount}
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
          onRowClick={handleRowClick}
          keyExtractor={(item) => item.id}
          loadingText={t('phieuDeXuatVatTu.loading')}
          emptyTitle={t('phieuDeXuatVatTu.chiTietTab.emptyTitle')}
          emptyDescription={t('phieuDeXuatVatTu.chiTietTab.emptyDescription')}
        />
      </div>

      <ChiTietRowEditModal
        open={!!editingRow}
        initialData={editingRow}
        onClose={() => setEditingRow(null)}
        onSave={handleSaveEdit}
      />

      <ChuyenTienDoModal
        open={showChuyenTienDoModal}
        selectedCount={singleRowForChuyenTienDo ? 1 : selectedIds.size}
        onClose={() => {
          setShowChuyenTienDoModal(false);
          setSingleRowForChuyenTienDo(null);
        }}
        onConfirm={handleChuyenTienDoConfirm}
      />

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        columns={exportColumns}
        data={exportData}
        paginatedData={paginatedExportData}
        selectedData={selectedExportData}
        fileName="Phieu_De_Xuat_Vat_Tu_Chi_Tiet"
        visibleColumnKeys={CHI_TIET_EXPORT_KEYS}
      />

      <AnimatePresence>
        {viewingRow && (
          <ChiTietRowDetail
            data={viewingRow}
            onClose={() => setViewingRow(null)}
            onEdit={() => {
              setEditingRow(viewingRow);
              setViewingRow(null);
            }}
            onDelete={() => handleDelete(viewingRow)}
            onChuyenTienDo={() => {
              setSingleRowForChuyenTienDo(viewingRow);
              setShowChuyenTienDoModal(true);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChiTietTab;
