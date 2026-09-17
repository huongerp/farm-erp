import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import {
  useDonDatHangListPaged,
  useDonDatHangById,
  useDeleteDonDatHang,
  useDeleteDonDatHangMany,
  useUpdateDonDatHangTrangThai,
  useUpdateDonDatHangTrangThaiMany,
} from '../hooks/use-don-dat-hang';
import { useDonDatHangViewScope } from '../hooks/use-don-dat-hang-view-scope';
import { buildDonDatHangListServerQuery, fetchAllDonDatHangForListQuery } from '../services/don-dat-hang-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useDoiTacRefQuery, useEmployeesRefQuery, usePhieuDeXuatSoPhieuMinimalQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { useDonDatHangStore } from '../store/useDonDatHangStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../../lib/button-labels';
import type { DonDatHang } from '../core/types';
import { TRANG_THAI_DA_XAC_NHAN, TRANG_THAI_HUY } from '../core/types';
import { canBulkApproveDonDatHang } from '../core/constants';
import DonDatHangToolbar from './DonDatHangToolbar';
import DonDatHangList from './DonDatHangList';
import DonDatHangForm from './DonDatHangForm';
import DonDatHangDetail from './DonDatHangDetail';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import PhieuKhoForm from '../../../kho-van/phieu-kho/components/PhieuKhoForm';
import type { PhieuKhoFormValues } from '../../../kho-van/phieu-kho/core/schema';
import type { DonDatHangSoPoOption } from '../services/don-dat-hang-supabase.service';
import { useExportData } from '../../../../lib/useExportData';
import {
  DON_DAT_HANG_LIST_EXPORT_KEYS,
  LIST_EXPORT_SHEET_NAME,
  mapDonDatHangListRow,
  getExportColumnsDonDatHangList,
  exportFileNameDonDatHangList,
} from '../utils/export-don-dat-hang-danh-sach';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove, canAdmin } = useModulePermissionFromContext();
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
  } = useDonDatHangStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DonDatHang | null>(null);
  const [viewingItem, setViewingItem] = useState<DonDatHang | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<DonDatHang[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [createPhieuNhapFrom, setCreatePhieuNhapFrom] = useState<DonDatHang | null>(null);

  const { data: supplierList = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: khoList = [] } = useKhoList();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: phieuDeXuatList = [] } = usePhieuDeXuatSoPhieuMinimalQuery();
  const viewScope = useDonDatHangViewScope();
  const listServerQuery = useMemo(
    () =>
      buildDonDatHangListServerQuery({
        searchTerm,
        filters,
        viewScope,
        khoList,
      }),
    [searchTerm, filters, viewScope, khoList]
  );
  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);
  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = useDonDatHangListPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isInitialLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const { data: viewingPoFull } = useDonDatHangById(viewingItem?.id);
  const { data: editingPoFull } = useDonDatHangById(editingItem?.id);
  const deleteMutation = useDeleteDonDatHang();
  const deleteManyMutation = useDeleteDonDatHangMany();
  const updateTrangThaiMutation = useUpdateDonDatHangTrangThai();
  const trangThaiManyMutation = useUpdateDonDatHangTrangThaiMany();

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

  const exportColumnsList = useMemo(() => getExportColumnsDonDatHangList(t), [t]);
  const exportMapList = useCallback((item: DonDatHang) => mapDonDatHangListRow(item), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData<DonDatHang>({
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
    fetchAllDonDatHangForListQuery(listServerQuery)
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
      toast.warning(t('donDatHang.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const handleEdit = (item: DonDatHang) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    if (editingItem?.id === openedFormFromDetailId) setOpenedFormFromDetailId(null);
    setEditingItem(null);
  };

  const handleApprove = useCallback(
    (item: DonDatHang, payload: { trangThai: 'Đã xác nhận' | 'Hủy'; ghiChu?: string }) => {
      updateTrangThaiMutation.mutate(
        { id: item.id, trangThai: payload.trangThai, ghiChu: payload.ghiChu, notePrefix: '[Ghi chú phê duyệt]: ' },
        { onSuccess: () => setViewingItem(null) }
      );
    },
    [updateTrangThaiMutation]
  );

  const handleChangeStatus = useCallback(
    (item: DonDatHang, payload: { trangThai: DonDatHang['trang_thai']; ghiChu?: string }) => {
      updateTrangThaiMutation.mutate({
        id: item.id,
        trangThai: payload.trangThai,
        ghiChu: payload.ghiChu,
        notePrefix: '[Chuyển trạng thái]: ',
      });
    },
    [updateTrangThaiMutation]
  );

  const handleDelete = (id: string) => {
    confirm({
      title: t('donDatHang.deleteTitle'),
      message: t('donDatHang.deleteMessage'),
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
      title: t('donDatHang.deleteTitle'),
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

  /** Duyệt / hủy hàng loạt — chỉ chạy đơn đang Chờ duyệt, đơn khác bị bỏ qua và báo số đã bỏ. */
  const handleApproveMany = (trangThai: typeof TRANG_THAI_DA_XAC_NHAN | typeof TRANG_THAI_HUY) => {
    const ids = Array.from(selectedIds);
    const allowedIds = ids.filter((id) => {
      const item = tableRows.find((p) => p.id === id);
      return item && canBulkApproveDonDatHang(item.trang_thai, canApprove);
    });
    if (allowedIds.length === 0) {
      toast.message(t('donDatHang.toast.bulkApproveNoneAllowed'));
      return;
    }
    const skipped = ids.length - allowedIds.length;
    const isHuy = trangThai === TRANG_THAI_HUY;
    confirm({
      title: isHuy ? t('donDatHang.bulkRejectTitle') : t('donDatHang.bulkApproveTitle'),
      message: isHuy
        ? t('donDatHang.bulkRejectMessage', { count: allowedIds.length })
        : t('donDatHang.bulkApproveMessage', { count: allowedIds.length }),
      variant: isHuy ? 'danger' : 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        if (skipped > 0) toast.message(t('donDatHang.toast.bulkApprovePartialSkipped'));
        await trangThaiManyMutation.mutateAsync({
          ids: allowedIds,
          trangThai,
          notePrefix: '[Ghi chú phê duyệt]: ',
        });
        clearSelection();
        if (viewingItem && allowedIds.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  const bulkActions =
    selectedIds.size > 0 && canApprove ? (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleApproveMany(TRANG_THAI_DA_XAC_NHAN)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-all active:scale-95"
        >
          <CheckCircle size={14} className="stroke-[2.5px] shrink-0" />
          <span className="text-xs font-medium">{t('donDatHang.bulkApproveAction')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleApproveMany(TRANG_THAI_HUY)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15 transition-all active:scale-95"
        >
          <XCircle size={14} className="stroke-[2.5px] shrink-0" />
          <span className="text-xs font-medium">{t('donDatHang.bulkRejectAction')}</span>
        </button>
      </div>
    ) : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DonDatHangToolbar
        data={tableRows}
        chipCountsMode="unweighted"
        supplierList={supplierList}
        khoList={khoList}
        employees={employees}
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
        <DonDatHangList
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
          serverTotalCount={totalCount}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onView={setViewingItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <DonDatHangForm
            supplierList={supplierList}
            khoList={khoList}
            employees={employees}
            phieuDeXuatList={phieuDeXuatList}
            initialData={editingPoFull ?? editingItem}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            key={`ddh-export-${listQueryKey}`}
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsList}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNameDonDatHangList()}
            visibleColumnKeys={[...DON_DAT_HANG_LIST_EXPORT_KEYS]}
            sheetName={LIST_EXPORT_SHEET_NAME}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DonDatHangDetail
            data={viewingPoFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={canUpdate ? (item) => {
              setOpenedFormFromDetailId(item.id);
              setViewingItem(null);
              setEditingItem(item);
              setShowForm(true);
            } : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onApprove={canApprove ? handleApprove : undefined}
            onChangeStatus={canAdmin ? handleChangeStatus : undefined}
            // Chờ viewingPoFull load xong mới cho tạo phiếu nhập — nếu không, item có thể là dòng
            // summary (chưa có chi_tiet) và phiếu nhập tạo ra sẽ trống, không có dòng hàng nào.
            onCreatePhieuNhapKho={canCreate && viewingPoFull ? () => setCreatePhieuNhapFrom(viewingPoFull) : undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createPhieuNhapFrom && (() => {
          const don = createPhieuNhapFrom;
          const donOpt: DonDatHangSoPoOption = {
            id: don.id,
            so_po: don.so_po,
            ngay: (don.ngay_dat ?? '').slice(0, 10),
          };
          const prefill: Partial<PhieuKhoFormValues> = {
            id_don_dat_hang: don.id,
            ngay: (don.ngay_dat ?? '').slice(0, 10),
            kho_id: don.id_kho_nhan ?? '',
            id_nha_cung_cap: don.id_nha_cung_cap ?? null,
            mo_ta: don.so_po ? `Nhập theo đơn ${don.so_po}` : undefined,
            chi_tiet: (don.chi_tiet ?? [])
              .filter((c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0)
              .map((c) => ({
                id_hang_hoa: c.id_hang_hoa,
                so_luong: c.so_luong,
                don_gia: c.don_gia,
                so_lot: '',
                ghi_chu: c.ghi_chu ?? '',
              })),
          };
          return (
            <PhieuKhoForm
              key={`phieu-nhap-from-ddh-${don.id}`}
              loai="nhap"
              khoList={khoList}
              prefillValues={prefill}
              donDatHangExtraOptions={[donOpt]}
              onClose={() => setCreatePhieuNhapFrom(null)}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
