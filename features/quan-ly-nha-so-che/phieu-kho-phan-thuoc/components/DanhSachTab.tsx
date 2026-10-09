import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';
import {
  usePhieuKhoPTListPaged,
  usePhieuKhoPTById,
  useDeletePhieuKhoPT,
  useDeletePhieuKhoPTMany,
  useUpdatePhieuKhoPTTrangThaiMany,
} from '../hooks/use-phieu-kho-pt';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { usePhieuKhoPTViewScope } from '../hooks/use-phieu-kho-pt-view-scope';
import { buildPhieuKhoPTPhamVi } from '../services/phieu-kho-pt-list-query';
import { buildPhieuKhoPTListServerQuery, fetchAllPhieuKhoPTForListQuery } from '../services/phieu-kho-pt-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { usePhieuKhoPTStore } from '../store/usePhieuKhoPTStore';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuKhoPT, TrangThaiPhieuKhoPT } from '../core/types';
import { canBulkApprovePhieuKhoPT } from '../core/constants';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachList from './DanhSachList';
import PhieuKhoPTForm from './PhieuKhoPTForm';
import PhieuKhoPTDetail from './PhieuKhoPTDetail';
import PhieuKhoPTBulkApproveDialog from './PhieuKhoPTBulkApproveDialog';
import DanhSachKhoForm from '../../../kho-van/danh-sach-kho/components/danh-sach-kho-form';
import HangHoaForm from '../../hang-hoa-phan-thuoc/components/HangHoaForm';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import LazyImportDialog from '../../../../components/shared/LazyImportDialog';
import { usePhieuKhoPTImport } from '../hooks/use-phieu-kho-pt-import';
import { useExportData } from '../../../../lib/useExportData';
import { mapPhieuKhoPTListRow, getExportColumnsPhieuKhoPTList, exportFileNamePhieuKhoPTDanhSach } from '../utils/export-phieu-kho-pt-danh-sach';
import type { FarmHangHoa } from '../../hang-hoa-phan-thuoc/core/types';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';
import { khoModuleId } from '../../kho-bien-the/bien-the';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
  const bt = useKhoBienThe();
  const { canCreate: canCreateHangHoa } = useModulePermission(khoModuleId(bt, 'hang-hoa-phan-thuoc'));
  /** Đồng bộ Google Sheet tự động — nguồn theo module_id (services/sheets/src/core/nguon-dong-bo.ts). */
  const dongBo = useMemo(() => ({ moduleId: khoModuleId(bt, 'phieu-kho-phan-thuoc') }), [bt]);
  const confirm = useConfirmStore((s) => s.confirm);
  const searchTerm = usePhieuKhoPTStore((s) => s.searchTerm);
  const filters = usePhieuKhoPTStore((s) => s.filters);
  const resetState = usePhieuKhoPTStore((s) => s.resetState);
  const selectedIds = usePhieuKhoPTStore((s) => s.selectedIds);
  const clearSelection = usePhieuKhoPTStore((s) => s.clearSelection);
  const toggleSelection = usePhieuKhoPTStore((s) => s.toggleSelection);
  const toggleAllSelection = usePhieuKhoPTStore((s) => s.toggleAllSelection);
  const pagination = usePhieuKhoPTStore((s) => s.pagination);
  const setPage = usePhieuKhoPTStore((s) => s.setPage);
  const setPageSize = usePhieuKhoPTStore((s) => s.setPageSize);
  const columns = usePhieuKhoPTStore((s) => s.columns);
  const resizeColumn = usePhieuKhoPTStore((s) => s.resizeColumn);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKhoPT | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [viewingItemRaw, setViewingItem] = useState<PhieuKhoPT | null>(null);
  const [showAddKho, setShowAddKho] = useState(false);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [bulkApprove, setBulkApprove] = useState<{ ids: string[]; skipped: number } | null>(null);
  const addKhoResolveRef = useRef<(k: Kho | null) => void>(null);
  const addHangHoaResolveRef = useRef<(h: FarmHangHoa | null) => void>(null);

  const { data: khoListAll = [], isPending: khoPending } = useKhoList();
  const viewScope = usePhieuKhoPTViewScope();
  const phamVi = useMemo(() => buildPhieuKhoPTPhamVi(viewScope, khoListAll), [viewScope, khoListAll]);
  /** Kho trong phạm vi — dùng cho chip lọc và ô Kho của form. */
  const khoList = useMemo(() => {
    if (phamVi.viewAll) return khoListAll;
    const allowed = new Set(phamVi.allowedKhoIds.map(String));
    return khoListAll.filter((k) => allowed.has(String(k.id)));
  }, [khoListAll, phamVi]);
  const importer = usePhieuKhoPTImport(khoList);
  const { data: empRef = [] } = useEmployeesRefQuery();
  // Cùng id với viewingItem (bản suy ra bên dưới), dùng bản gốc vì khai báo trước tableRows.
  const { data: viewingPhieuFull } = usePhieuKhoPTById(viewingItemRaw?.id);
  const { data: editingPhieuFull } = usePhieuKhoPTById(editingItem?.id);
  const deleteMutation = useDeletePhieuKhoPT();
  const deleteManyMutation = useDeletePhieuKhoPTMany();
  const approveManyMutation = useUpdatePhieuKhoPTTrangThaiMany();
  const user = useAuthStore((s) => s.user);
  const nguoiDuyetIdRaw = user?.id != null ? Number(user.id) : null;
  const nguoiDuyetId = nguoiDuyetIdRaw != null && !Number.isNaN(nguoiDuyetIdRaw) ? nguoiDuyetIdRaw : null;
  const nguoiDuyetTen = user?.ho_va_ten?.trim() || user?.full_name?.trim() || user?.email?.trim() || '';

  const dateRangeStr = useMemo(() => {
    const dp = typeof filters.datePreset === 'string' ? filters.datePreset : 'all';
    const cf = typeof filters.customDateFrom === 'string' ? filters.customDateFrom : '';
    const ce = typeof filters.customDateEnd === 'string' ? filters.customDateEnd : '';
    const range = getDateRangeFromPreset(
      dp as DateRangePresetId,
      cf ? new Date(cf) : undefined,
      ce ? new Date(ce) : undefined
    );
    const toYyyyMmDd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: toYyyyMmDd(range.start), end: toYyyyMmDd(range.end) };
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const listServerQuery = useMemo(
    () =>
      buildPhieuKhoPTListServerQuery({
        searchTerm,
        filters,
        ngayFrom: dateRangeStr.start,
        ngayTo: dateRangeStr.end,
        phamVi,
      }),
    [searchTerm, filters, dateRangeStr.start, dateRangeStr.end, phamVi]
  );

  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);

  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = usePhieuKhoPTListPaged(
    pageIndex,
    listServerQuery,
    // Chờ đủ phạm vi + danh mục kho, nếu không sẽ query với allowedKhoIds rỗng rồi nháy lại.
    !viewScope.isLoading && (phamVi.viewAll || !khoPending)
  );
  const tableRows = useMemo(() => pageQuery.data?.data ?? [], [pageQuery.data?.data]);
  // Phiếu đang mở vừa được cập nhật ở trang hiện tại → drawer chi tiết lấy bản mới nhất.
  const viewingItem = useMemo(() => {
    if (!viewingItemRaw) return null;
    return tableRows.find((p) => p.id === viewingItemRaw.id) ?? viewingItemRaw;
  }, [tableRows, viewingItemRaw]);
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isInitialLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  // Mỗi lần mở hộp thoại (hoặc đổi bộ lọc khi đang mở) tạo một "yêu cầu" mới; kết quả
  // chỉ dùng khi khớp đúng yêu cầu hiện tại → đang tải / dữ liệu suy ra lúc render.
  const exportRequest = useMemo(
    () => (showExport ? { query: listServerQuery } : null),
    [showExport, listServerQuery]
  );
  const [exportResult, setExportResult] = useState<{
    request: { query: typeof listServerQuery };
    rows: PhieuKhoPT[];
  } | null>(null);
  const exportLoading = exportRequest !== null && exportResult?.request !== exportRequest;
  const exportRows = useMemo(
    () => (exportRequest !== null && exportResult?.request === exportRequest ? exportResult.rows : []),
    [exportRequest, exportResult]
  );
  const exportColumns = useMemo(() => getExportColumnsPhieuKhoPTList(t), [t]);
  const exportMap = useCallback((item: PhieuKhoPT) => mapPhieuKhoPTListRow(item), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMap,
    pagination,
    selectedIds,
    keyExtractor: (p) => p.id,
  });

  useEffect(() => {
    if (!exportRequest) return;
    let cancelled = false;
    fetchAllPhieuKhoPTForListQuery(bt, exportRequest.query)
      .then((rows) => {
        if (!cancelled) setExportResult({ request: exportRequest, rows });
      })
      .catch(() => {
        if (!cancelled) setExportResult({ request: exportRequest, rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [exportRequest, bt]);

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('phieuKhoPhanThuoc.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

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

  const handleEdit = (item: PhieuKhoPT) => {
    setEditingItem(item);
    setIsCopyMode(false);
    setShowForm(true);
  };

  const handleCopy = (item: PhieuKhoPT) => {
    const copy: PhieuKhoPT = {
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
    setIsCopyMode(true);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuKhoPhanThuoc.deleteTitle'),
      message: t('phieuKhoPhanThuoc.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('phieuKhoPhanThuoc.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  /** Lọc lô về đúng phiếu còn chờ duyệt; phiếu đã có quyết định bị bỏ qua, không chặn cả lô. */
  const handleApproveMany = () => {
    const selected = Array.from(selectedIds);
    const allowedIds = selected.filter((id) => {
      const item = tableRows.find((p) => p.id === id);
      return item && canBulkApprovePhieuKhoPT(item.trang_thai, canApprove);
    });
    if (allowedIds.length === 0) {
      toast.message(t('phieuKhoPhanThuoc.toast.bulkApproveNoneAllowed'));
      return;
    }
    setBulkApprove({ ids: allowedIds, skipped: selected.length - allowedIds.length });
  };

  const submitApproveMany = (trangThai: TrangThaiPhieuKhoPT, ghiChu: string) => {
    if (!bulkApprove) return;
    const ids = bulkApprove.ids;
    approveManyMutation.mutate(
      {
        ids,
        trang_thai: trangThai,
        ghi_chu: ghiChu || undefined,
        id_nguoi_duyet: nguoiDuyetId,
        ten_nguoi_duyet_hien_thi: nguoiDuyetTen || undefined,
      },
      {
        onSuccess: () => {
          setBulkApprove(null);
          clearSelection();
          if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
        },
      }
    );
  };

  const bulkActions =
    selectedIds.size > 0 && canApprove ? (
      <button
        type="button"
        onClick={handleApproveMany}
        className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-all active:scale-95"
      >
        <CheckCircle size={14} className="stroke-[2.5px] shrink-0" />
        <span className="text-xs font-medium">{t('phieuKhoPhanThuoc.bulkApproveAction')}</span>
      </button>
    ) : null;

  const canEditItem = (item: PhieuKhoPT) => item.trang_thai === 'Chờ duyệt';

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DanhSachToolbar
        data={tableRows}
        chipCountsMode="unweighted"
        employeesForChips={empRef}
        khoList={khoList}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onExport={handleExport}
        onImport={canCreate ? importer.openImport : undefined}
        bulkActions={bulkActions}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <DanhSachList
          data={tableRows}
          serverTotalCount={totalCount}
          columns={columns}
          onResizeColumn={resizeColumn}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isInitialLoading}
          isFetching={isFetchingOverlay}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onView={setViewingItem}
          canEditItem={canEditItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PhieuKhoPTForm
            khoList={khoList}
            khoDenList={khoListAll}
            initialData={isCopyMode ? editingItem : (editingPhieuFull ?? editingItem)}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
              setIsCopyMode(false);
            }}
            onRequestAddKho={() =>
              new Promise<Kho | null>((resolve) => {
                addKhoResolveRef.current = resolve;
                setShowAddKho(true);
              })
            }
            onRequestAddHangHoa={
              canCreateHangHoa
                ? () =>
                    new Promise<FarmHangHoa | null>((resolve) => {
                      addHangHoaResolveRef.current = resolve;
                      setShowAddHangHoa(true);
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
          <HangHoaForm
            initialData={null}
            onSuccessCreate={(created) => {
              const r = addHangHoaResolveRef.current;
              addHangHoaResolveRef.current = null;
              r?.(created);
            }}
            onClose={() => {
              setShowAddHangHoa(false);
              const r = addHangHoaResolveRef.current;
              addHangHoaResolveRef.current = null;
              r?.(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <PhieuKhoPTDetail
            data={viewingPhieuFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={
              canUpdate
                ? (item) => {
                    setViewingItem(null);
                    handleEdit(item);
                  }
                : undefined
            }
            onDelete={canDelete ? (id) => { setViewingItem(null); handleDelete(id); } : undefined}
            onCopy={canCreate ? handleCopy : undefined}
            canApprove={canApprove}
          />
        )}
      </AnimatePresence>

      {bulkApprove && (
        <PhieuKhoPTBulkApproveDialog
          count={bulkApprove.ids.length}
          skipped={bulkApprove.skipped}
          isPending={approveManyMutation.isPending}
          onClose={() => setBulkApprove(null)}
          onConfirm={submitApproveMany}
        />
      )}

      <LazyImportDialog
        open={importer.showImport}
        onClose={importer.closeImport}
        columns={importer.importColumns}
        onImport={importer.handleImport}
        importErrors={importer.importErrors}
        sampleRows={importer.sampleRows}
        guideNotes={importer.guideNotes}
        referenceSheets={importer.referenceSheets}
        templateFileName={importer.templateFileName}
      />

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        columns={exportColumns}
        data={exportLoading ? [] : exportData}
        paginatedData={paginatedExportData}
        selectedData={selectedExportData}
        fileName={exportFileNamePhieuKhoPTDanhSach()}
        dongBo={dongBo}
      />
    </div>
  );
};

export default DanhSachTab;
