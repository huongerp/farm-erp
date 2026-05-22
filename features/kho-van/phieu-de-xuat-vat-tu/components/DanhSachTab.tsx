import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';
import { usePhieuDeXuatVatTuListPaged, usePhieuDeXuatVatTuById, useDeletePhieuDeXuatVatTu, useDeletePhieuDeXuatVatTuMany, useUpdatePhieuDeXuatVatTu } from '../hooks/use-phieu-de-xuat-vat-tu';
import { usePhieuDeXuatVatTuViewScope } from '../hooks/use-phieu-de-xuat-vat-tu-view-scope';
import { buildPhieuDeXuatVatTuListServerQuery, fetchAllPhieuDeXuatVatTuForListQuery } from '../services/phieu-de-xuat-vat-tu-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useCauHinhDeXuatVatTu } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/hooks/use-cau-hinh-de-xuat-vat-tu';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { usePhieuDeXuatVatTuStore } from '../store/usePhieuDeXuatVatTuStore';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuDeXuatVatTu } from '../core/types';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import { TRANG_THAI_CHO_DUYET } from '../core/constants';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import DanhSachHangHoaForm from '../../danh-sach-hang-hoa/components/DanhSachHangHoaForm';
import DonDatHangForm from '../../../mua-hang/don-dat-hang/components/DonDatHangForm';
import { phieuDeXuatToDonDatHangPrefill } from '../../../mua-hang/don-dat-hang/core/don-dat-hang-to-form-values';
import type { PhieuDeXuatSoPhieuOption } from '../services/phieu-de-xuat-vat-tu-supabase.service';

function phieuToFormValues(p: PhieuDeXuatVatTu, trangThai: PhieuDeXuatVatTu['trang_thai'], overrideGhiChu?: string): PhieuDeXuatVatTuFormValues {
  return {
    so_phieu: p.so_phieu,
    ngay: p.ngay,
    ngay_can: p.ngay_can,
    id_noi_de_xuat: p.id_noi_de_xuat,
    id_nguoi_de_xuat: p.id_nguoi_de_xuat,
    id_nguoi_duyet: p.id_nguoi_duyet ?? undefined,
    ghi_chu: overrideGhiChu !== undefined ? overrideGhiChu : (p.ghi_chu ?? ''),
    trang_thai: trangThai,
    chi_tiet: (p.chi_tiet ?? []).map((ct) => ({
      id_hang_hoa: ct.id_hang_hoa,
      so_luong: ct.so_luong,
      thong_so: ct.thong_so ?? '',
      ghi_chu: ct.ghi_chu ?? '',
    })),
  };
}
import PhieuDeXuatVatTuToolbar from './PhieuDeXuatVatTuToolbar';
import PhieuDeXuatVatTuList from './PhieuDeXuatVatTuList';
import PhieuDeXuatVatTuForm from './PhieuDeXuatVatTuForm';
import PhieuDeXuatVatTuDetail, { type PhieuDeXuatVatTuApprovePayload } from './PhieuDeXuatVatTuDetail';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import {
  PHIEU_DE_XUAT_VAT_TU_LIST_EXPORT_KEYS,
  LIST_EXPORT_SHEET_NAME,
  mapPhieuDeXuatVatTuListRow,
  getExportColumnsPhieuDeXuatVatTuList,
  exportFileNamePhieuDeXuatVatTuList,
} from '../utils/export-phieu-de-xuat-vat-tu-danh-sach';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
  const { canCreate: canCreateHangHoa } = useModulePermission('kho-van/danh-sach-hang-hoa');
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = usePhieuDeXuatVatTuStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuDeXuatVatTu | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [viewingItem, setViewingItem] = useState<PhieuDeXuatVatTu | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const addHangHoaResolveRef = useRef<(h: HangHoa | null) => void>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<PhieuDeXuatVatTu[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [createDonDatHangFrom, setCreateDonDatHangFrom] = useState<PhieuDeXuatVatTu | null>(null);

  const { data: khoList = [] } = useKhoList();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: config } = useCauHinhDeXuatVatTu();
  const viewScope = usePhieuDeXuatVatTuViewScope();
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
      buildPhieuDeXuatVatTuListServerQuery({
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
  const pageQuery = usePhieuDeXuatVatTuListPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isInitialLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const isOverdue = useCallback(
    (item: PhieuDeXuatVatTu) =>
      !!(config?.bat_canh_bao_qua_han && item.trang_thai === TRANG_THAI_CHO_DUYET && (Math.floor((Date.now() - new Date(item.tg_tao).getTime()) / 86400000) > (config.thoi_han_duyet_ngay ?? 0))),
    [config]
  );
  const { data: viewingPhieuFull } = usePhieuDeXuatVatTuById(viewingItem?.id);
  const { data: editingPhieuFull } = usePhieuDeXuatVatTuById(editingItem?.id);
  const deleteMutation = useDeletePhieuDeXuatVatTu();
  const deleteManyMutation = useDeletePhieuDeXuatVatTuMany();
  const updateMutation = useUpdatePhieuDeXuatVatTu();

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

  const exportColumnsList = useMemo(() => getExportColumnsPhieuDeXuatVatTuList(t), [t]);
  const exportMapList = useCallback((item: PhieuDeXuatVatTu) => mapPhieuDeXuatVatTuListRow(item), []);
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
    fetchAllPhieuDeXuatVatTuForListQuery(listServerQuery)
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
      toast.warning(t('phieuDeXuatVatTu.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const handleEdit = (item: PhieuDeXuatVatTu) => {
    setEditingItem(item);
    setIsCopyMode(false);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCopy = (item: PhieuDeXuatVatTu) => {
    const copy: PhieuDeXuatVatTu = {
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

  const handleApprove = useCallback(
    (item: PhieuDeXuatVatTu, payload: PhieuDeXuatVatTuApprovePayload) => {
      const full = viewingPhieuFull ?? item;
      const mergedGhiChu = payload.ghiChu
        ? (full.ghi_chu ? full.ghi_chu + '\n' : '') + `[Ghi chú phê duyệt]: ${payload.ghiChu}`
        : undefined;
      const data = phieuToFormValues(full, payload.trangThai, mergedGhiChu);
      if (user?.id) data.id_nguoi_duyet = user.id;
      updateMutation.mutate({ id: full.id, data });
    },
    [updateMutation, viewingPhieuFull, user?.id]
  );

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuDeXuatVatTu.deleteTitle'),
      message: t('phieuDeXuatVatTu.deleteMessage'),
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
      title: t('phieuDeXuatVatTu.deleteTitle'),
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

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <PhieuDeXuatVatTuToolbar
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
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <PhieuDeXuatVatTuList
          data={tableRows}
          columns={columns}
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
          <PhieuDeXuatVatTuForm
            khoList={khoList}
            employees={employees}
            initialData={isCopyMode ? editingItem : (editingPhieuFull ?? editingItem)}
            onClose={handleCloseForm}
            canEdit
            onRequestAddHangHoa={
              canCreateHangHoa
                ? () =>
                    new Promise<HangHoa | null>((resolve) => {
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
            key={`pdxvt-export-${listQueryKey}`}
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsList}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNamePhieuDeXuatVatTuList()}
            visibleColumnKeys={[...PHIEU_DE_XUAT_VAT_TU_LIST_EXPORT_KEYS]}
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
          <PhieuDeXuatVatTuDetail
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
            onCreateDonDatHang={canCreate ? (item) => setCreateDonDatHangFrom(viewingPhieuFull ?? item) : undefined}
            canEdit={!!canUpdate}
            canDelete={canDelete}
            showOverdueBadge={!!(config?.bat_canh_bao_qua_han && viewingItem?.trang_thai === TRANG_THAI_CHO_DUYET && (Math.floor((Date.now() - new Date((viewingPhieuFull ?? viewingItem).tg_tao).getTime()) / 86400000) > (config.thoi_han_duyet_ngay ?? 0)))}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createDonDatHangFrom && (() => {
          const phieu = createDonDatHangFrom;
          const phieuDeXuatOption: PhieuDeXuatSoPhieuOption = { id: phieu.id, so_phieu: phieu.so_phieu, ngay: phieu.ngay };
          const prefill = phieuDeXuatToDonDatHangPrefill(phieu);
          return (
            <DonDatHangForm
              khoList={khoList}
              employees={employees}
              phieuDeXuatList={[phieuDeXuatOption]}
              prefillValues={prefill}
              onClose={() => setCreateDonDatHangFrom(null)}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
