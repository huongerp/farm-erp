import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';
import {
  useDeXuatMuaHangListPaged,
  useDeXuatMuaHangById,
  useDeleteDeXuatMuaHang,
  useDeleteDeXuatMuaHangMany,
  useUpdateDeXuatMuaHangTrangThai,
  useUpdateDeXuatMuaHangTrangThaiMany,
} from '../hooks/use-de-xuat-mua-hang';
import { useDeXuatMuaHangViewScope } from '../hooks/use-de-xuat-mua-hang-view-scope';
import { buildDeXuatMuaHangListServerQuery, fetchAllDeXuatMuaHangForListQuery } from '../services/de-xuat-mua-hang-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { useDeXuatMuaHangStore } from '../store/useDeXuatMuaHangStore';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { DeXuatMuaHang } from '../core/types';
import { TRANG_THAI_CHO_DUYET, THOI_HAN_DUYET_NGAY, canBulkApproveDeXuatMuaHang } from '../core/constants';
import type { TrangThaiDeXuatMuaHang } from '../core/constants';
import type { FarmHangHoa } from '../../hang-hoa-phan-thuoc/core/types';
import DanhSachHangHoaForm from '../../hang-hoa-phan-thuoc/components/HangHoaForm';
import PhieuKhoPTForm from '../../phieu-kho-phan-thuoc/components/PhieuKhoPTForm';
import { deXuatMuaHangToPhieuKhoPTPrefill } from '../../phieu-kho-phan-thuoc/core/phieu-kho-pt-to-form-values';
import DeXuatMuaHangBulkApproveDialog from './DeXuatMuaHangBulkApproveDialog';
import DeXuatMuaHangToolbar from './DeXuatMuaHangToolbar';
import DeXuatMuaHangList from './DeXuatMuaHangList';
import DeXuatMuaHangForm from './DeXuatMuaHangForm';
import DeXuatMuaHangDetail, { type DeXuatMuaHangApprovePayload } from './DeXuatMuaHangDetail';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import {
  DE_XUAT_MUA_HANG_LIST_EXPORT_KEYS,
  LIST_EXPORT_SHEET_NAME,
  mapDeXuatMuaHangListRow,
  getExportColumnsDeXuatMuaHangList,
  exportFileNameDeXuatMuaHangList,
} from '../utils/export-de-xuat-mua-hang-danh-sach';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
  const { canCreate: canCreateHangHoa } = useModulePermission('quan-ly-nha-so-che/hang-hoa-phan-thuoc');
  const { canCreate: canCreatePhieuKho } = useModulePermission('quan-ly-nha-so-che/phieu-kho-phan-thuoc');
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    resizeColumn,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useDeXuatMuaHangStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DeXuatMuaHang | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [viewingItem, setViewingItem] = useState<DeXuatMuaHang | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const addHangHoaResolveRef = useRef<(h: FarmHangHoa | null) => void>(null);
  const [showExport, setShowExport] = useState(false);
  const [bulkApprove, setBulkApprove] = useState<{ ids: string[]; skipped: number } | null>(null);
  const [exportRows, setExportRows] = useState<DeXuatMuaHang[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [createPhieuKhoFrom, setCreatePhieuKhoFrom] = useState<DeXuatMuaHang | null>(null);

  const { data: khoList = [] } = useKhoList();
  const { data: employees = [] } = useEmployeesRefQuery();
  const viewScope = useDeXuatMuaHangViewScope();
  const dateRangeStr = useMemo(() => {
    if ((filters.datePreset ?? 'all') === 'all') return { start: '', end: '' };
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
      buildDeXuatMuaHangListServerQuery({
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
  const pageQuery = useDeXuatMuaHangListPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isInitialLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const isOverdue = useCallback(
    (item: DeXuatMuaHang) =>
      item.trang_thai === TRANG_THAI_CHO_DUYET &&
      Math.floor((Date.now() - new Date(item.tg_tao).getTime()) / 86400000) > THOI_HAN_DUYET_NGAY,
    []
  );
  const { data: viewingPhieuFull } = useDeXuatMuaHangById(viewingItem?.id);
  /** Ổn định tham chiếu để form phiếu kho không bị reset lại mỗi lần render. */
  const phieuKhoPrefill = useMemo(
    () => (createPhieuKhoFrom ? deXuatMuaHangToPhieuKhoPTPrefill(createPhieuKhoFrom) : null),
    [createPhieuKhoFrom]
  );
  const { data: editingPhieuFull } = useDeXuatMuaHangById(editingItem?.id);
  const deleteMutation = useDeleteDeXuatMuaHang();
  const deleteManyMutation = useDeleteDeXuatMuaHangMany();
  const trangThaiMutation = useUpdateDeXuatMuaHangTrangThai();
  const trangThaiManyMutation = useUpdateDeXuatMuaHangTrangThaiMany();

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

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = tableRows.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [tableRows, viewingItem]);

  const exportColumnsList = useMemo(() => getExportColumnsDeXuatMuaHangList(t), [t]);
  const exportMapList = useCallback((item: DeXuatMuaHang) => mapDeXuatMuaHangListRow(item), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMapList,
    pagination,
    selectedIds,
    keyExtractor: (p) => p.id,
  });

  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllDeXuatMuaHangForListQuery(listServerQuery)
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
      toast.warning(t('deXuatMuaHang.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const handleEdit = (item: DeXuatMuaHang) => {
    setEditingItem(item);
    setIsCopyMode(false);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCopy = (item: DeXuatMuaHang) => {
    const copy: DeXuatMuaHang = {
      ...item,
      id: '',
      so_phieu: '',
      trang_thai: TRANG_THAI_CHO_DUYET,
      id_nguoi_duyet: null,
      ten_nguoi_duyet: undefined,
      ngay: new Date().toISOString().slice(0, 10),
      ngay_can: '',
    };
    setEditingItem(copy);
    setIsCopyMode(true);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    if (editingItem?.id === openedFormFromDetailId) {
      setOpenedFormFromDetailId(null);
    }
    setEditingItem(null);
    setIsCopyMode(false);
  };

  /**
   * Duyệt một phiếu. Chỉ đụng cột trạng thái + ghi chú — trước đây đi qua updateMutation, tức ghi
   * lại cả phiếu và xoá/chèn lại toàn bộ dòng chi tiết chỉ để đổi một cột.
   */
  const handleApprove = useCallback(
    (item: DeXuatMuaHang, payload: DeXuatMuaHangApprovePayload) => {
      const full = viewingPhieuFull ?? item;
      trangThaiMutation.mutate({
        id: full.id,
        trang_thai: payload.trangThai,
        ghi_chu: payload.ghiChu,
        notePrefix: '[Ghi chú phê duyệt]: ',
        id_nguoi_duyet: user?.id ?? null,
      });
    },
    [trangThaiMutation, viewingPhieuFull, user?.id]
  );

  const handleDelete = (id: string) => {
    confirm({
      title: t('deXuatMuaHang.deleteTitle'),
      message: t('deXuatMuaHang.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
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
      title: t('deXuatMuaHang.deleteTitle'),
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

  /** Lọc lô về đúng phiếu còn trong luồng duyệt; phiếu đã có quyết định bị bỏ qua. */
  const handleApproveMany = () => {
    const selected = Array.from(selectedIds);
    const allowedIds = selected.filter((id) => {
      const item = tableRows.find((p) => p.id === id);
      return item && canBulkApproveDeXuatMuaHang(item.trang_thai, canApprove);
    });
    if (allowedIds.length === 0) {
      toast.message(t('deXuatMuaHang.toast.bulkApproveNoneAllowed'));
      return;
    }
    setBulkApprove({ ids: allowedIds, skipped: selected.length - allowedIds.length });
  };

  const submitApproveMany = (trangThai: TrangThaiDeXuatMuaHang, ghiChu: string) => {
    if (!bulkApprove) return;
    const ids = bulkApprove.ids;
    trangThaiManyMutation.mutate(
      {
        ids,
        trang_thai: trangThai,
        ghi_chu: ghiChu || undefined,
        notePrefix: '[Ghi chú phê duyệt]: ',
        id_nguoi_duyet: user?.id ?? null,
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
        <span className="text-xs font-medium">{t('deXuatMuaHang.bulkApproveAction')}</span>
      </button>
    ) : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {bulkApprove && (
        <DeXuatMuaHangBulkApproveDialog
          count={bulkApprove.ids.length}
          skipped={bulkApprove.skipped}
          isPending={trangThaiManyMutation.isPending}
          onClose={() => setBulkApprove(null)}
          onConfirm={submitApproveMany}
        />
      )}
      <DeXuatMuaHangToolbar
        data={tableRows}
        chipCountsMode="unweighted"
        khoList={khoList}
        employees={employees}
        currentUserId={user?.id ?? null}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setOpenedFormFromDetailId(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onExport={handleExport}
        bulkActions={bulkActions}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <DeXuatMuaHangList
          data={tableRows}
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
          isOverdue={isOverdue}
          serverTotalCount={totalCount}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <DeXuatMuaHangForm
            khoList={khoList}
            employees={employees}
            initialData={isCopyMode ? editingItem : (editingPhieuFull ?? editingItem)}
            onClose={handleCloseForm}
            canEdit
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
        {showExport && (
          <ExportDialog
            key={`dxmh-export-${listQueryKey}`}
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsList}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNameDeXuatMuaHangList()}
            visibleColumnKeys={[...DE_XUAT_MUA_HANG_LIST_EXPORT_KEYS]}
            sheetName={LIST_EXPORT_SHEET_NAME}
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
            onSuccessCreate={(hangHoa) => {
              addHangHoaResolveRef.current?.(hangHoa);
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DeXuatMuaHangDetail
            data={viewingPhieuFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onCopy={canCreate ? handleCopy : undefined}
            onEdit={canUpdate ? (item) => {
              setOpenedFormFromDetailId(item.id);
              setViewingItem(null);
              setEditingItem(item);
              setShowForm(true);
            } : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onApprove={canApprove ? handleApprove : undefined}
            onCreatePhieuKho={
              canCreatePhieuKho ? (item) => setCreatePhieuKhoFrom(viewingPhieuFull ?? item) : undefined
            }
            canEdit={!!canUpdate}
            canDelete={canDelete}
            showOverdueBadge={isOverdue(viewingPhieuFull ?? viewingItem)}
            idChiNhanhNoiDeXuat={
              khoList.find(
                (k) => String(k.id) === String((viewingPhieuFull ?? viewingItem).id_noi_de_xuat)
              )?.id_chi_nhanh ?? null
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createPhieuKhoFrom && (
          <PhieuKhoPTForm
            khoList={khoList}
            prefillValues={phieuKhoPrefill ?? undefined}
            onClose={() => setCreatePhieuKhoFrom(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
