import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ThanhToanDoiTacListServerQuery } from '../services/thanh-toan-doi-tac-list-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useThanhToanDoiTacPage, useThanhToanDoiTacTomTat, useThanhToanDoiTacById, useDeleteThanhToanDoiTac, useDeleteThanhToanDoiTacMany, useUpdateThanhToanDoiTac, useChuyenTrangThaiThanhToanMany } from '../hooks/use-thanh-toan-doi-tac';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import BulkActionButton from '../../../../components/shared/BulkActionButton';
import { getTodayISO } from '../../../../lib/utils';
import { MA_TRANG_THAI_DA_HUY, MA_TRANG_THAI_DA_THANH_TOAN } from '../core/constants';
import { useThanhToanDoiTacViewScope } from '../hooks/use-thanh-toan-doi-tac-view-scope';
import { useDoiTacRefQuery, useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useTrangThaiThanhToanDoiTacList } from '../../thiet-lap-de-xuat-vat-tu/hooks/use-trang-thai-thanh-toan-doi-tac';
import { useThanhToanDoiTacStore } from '../store/useThanhToanDoiTacStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../../lib/button-labels';
import type { ThanhToanDoiTac } from '../core/types';
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import ThanhToanDoiTacToolbar from './ThanhToanDoiTacToolbar';
import ThanhToanDoiTacList from './ThanhToanDoiTacList';
import ThanhToanDoiTacForm from './ThanhToanDoiTacForm';
import ThanhToanDoiTacDetail from './ThanhToanDoiTacDetail';
import NutInHangLoat from '../../../../components/shared/phieu-in/NutInHangLoat';
import LazyExportDialog from '../../../../components/shared/LazyExportDialog';
import LazyImportDialog from '../../../../components/shared/LazyImportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { useNhomDoiTacList } from '../../../kho-van/danh-sach-doi-tac/hooks/use-doi-tac';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import { fetchAllThanhToanDoiTacForListQuery } from '../services/thanh-toan-doi-tac-service';
import { useThanhToanDoiTacImport } from '../hooks/use-thanh-toan-doi-tac-import';
import {
  TTDT_LIST_EXPORT_FILE_NAME,
  TTDT_LIST_EXPORT_SHEET_NAME,
  getExportColumnsThanhToanDoiTacList,
  mapThanhToanDoiTacListRow,
} from '../utils/export-thanh-toan-doi-tac';
import { useAuthStore } from '../../../../store/useStore';

function toYyyyMmDd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


function thanhToanToFormValues(item: ThanhToanDoiTac, override?: Partial<ThanhToanDoiTacFormValues>): ThanhToanDoiTacFormValues {
  return {
    so_phieu: item.so_phieu,
    hang_muc_thanh_toan: item.hang_muc_thanh_toan,
    noi_dung_chi_tiet: item.noi_dung_chi_tiet ?? null,
    ngay: item.ngay,
    id_don_vi: item.id_don_vi ?? '',
    id_doi_tac: item.id_doi_tac,
    id_trang_thai_thanh_toan: override?.id_trang_thai_thanh_toan ?? item.id_trang_thai_thanh_toan,
    so_tien: item.so_tien,
    ngay_xu_ly: override?.ngay_xu_ly !== undefined ? override.ngay_xu_ly : (item.ngay_xu_ly ?? null),
    ghi_chu: override?.ghi_chu !== undefined ? override.ghi_chu : (item.ghi_chu ?? null),
    id_nguoi_tao: item.id_nguoi_tao,
  };
}

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
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
    sort,
  } = useThanhToanDoiTacStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ThanhToanDoiTac | null>(null);
  const [viewingItem, setViewingItem] = useState<ThanhToanDoiTac | null>(null);

  const { data: doiTacList = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: chiNhanhList = [] } = useBranches();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: statusList = [] } = useTrangThaiThanhToanDoiTacList();
  const { data: nhomList = [] } = useNhomDoiTacList();
  const viewScope = useThanhToanDoiTacViewScope();
  const user = useAuthStore((s) => s.user);

  const nguoiTaoList = useMemo(() => employees.map((e) => ({ id: String(e.id), ho_ten: e.ho_ten })), [employees]);

  /** Khoảng ngày lập từ preset của toolbar ('all' = không giới hạn). */
  const dateRange = useMemo(() => {
    const preset = filters.datePreset || 'all';
    if (preset === 'all') return { start: '', end: '' };
    const range = getDateRangeFromPreset(
      preset as DateRangePresetId,
      filters.customDateFrom ? new Date(filters.customDateFrom) : undefined,
      filters.customDateEnd ? new Date(filters.customDateEnd) : undefined
    );
    return { start: toYyyyMmDd(range.start), end: toYyyyMmDd(range.end) };
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  /** Phạm vi xem dùng chung cho trang + tóm tắt chip (không đếm phiếu ngoài phạm vi). */
  const scopeQuery = useMemo(
    () => ({
      viewAll: viewScope.viewAll,
      viewByBranch: viewScope.viewByBranch,
      allowedBranchIds: viewScope.allowedBranchIds,
      currentEmployeeId: viewScope.currentEmployeeId,
    }),
    [viewScope.viewAll, viewScope.viewByBranch, viewScope.allowedBranchIds, viewScope.currentEmployeeId]
  );

  /** Bộ lọc + phạm vi xem gửi thẳng xuống PostgREST — trước đây tải toàn bộ bảng. */
  const listServerQuery: ThanhToanDoiTacListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      statusIds: filters.statusIds ?? [],
      doiTacIds: filters.doiTacIds ?? [],
      donViIds: filters.donViIds ?? [],
      nhomIds: filters.nhomIds ?? [],
      nguoiTaoIds: filters.nguoiTaoIds ?? [],
      tuNgay: dateRange.start,
      denNgay: dateRange.end,
      ...scopeQuery,
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, dateRange, sort, scopeQuery]
  );

  /** Tóm tắt phiếu trong phạm vi xem cho chip lọc (đếm theo trạng thái / nhóm / đối tác / đơn vị / người tạo). */
  const { data: tomTatList = [] } = useThanhToanDoiTacTomTat(scopeQuery, !viewScope.isLoading);

  const pageQuery = useThanhToanDoiTacPage(listServerQuery, !viewScope.isLoading);
  const pageList = useMemo(() => pageQuery.data?.data ?? [], [pageQuery.data]);
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const { data: viewingFull } = useThanhToanDoiTacById(viewingItem?.id);
  const { data: editingFull } = useThanhToanDoiTacById(editingItem?.id);
  const deleteMutation = useDeleteThanhToanDoiTac();
  const deleteManyMutation = useDeleteThanhToanDoiTacMany();
  const updateMutation = useUpdateThanhToanDoiTac();

  useEffect(() => resetState(), [resetState]);
  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);
  // Bản ghi đang mở vừa cập nhật ở trang hiện tại → đồng bộ lại drawer. Điều chỉnh ngay lúc
  // render khi pageList hoặc id đang xem đổi — cùng điều kiện với deps của effect cũ.
  const [dongBoViewing, setDongBoViewing] = useState({ pageList, id: viewingItem?.id });
  if (dongBoViewing.pageList !== pageList || dongBoViewing.id !== viewingItem?.id) {
    setDongBoViewing({ pageList, id: viewingItem?.id });
    const fresh = viewingItem ? pageList.find((p) => p.id === viewingItem.id) : undefined;
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }

  const handleEdit = (item: ThanhToanDoiTac) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleChangeStatus = useCallback(
    (item: ThanhToanDoiTac, payload: { idTrangThai: string; ngayXuLy?: string; ghiChu?: string }) => {
      const full = viewingFull ?? item;
      const mergedGhiChu = payload.ghiChu
        ? (full.ghi_chu ? full.ghi_chu + '\n' : '') + `[Ghi chú chuyển trạng thái]: ${payload.ghiChu}`
        : undefined;
      const data = thanhToanToFormValues(full, {
        id_trang_thai_thanh_toan: payload.idTrangThai,
        ngay_xu_ly: payload.ngayXuLy?.trim() || null,
        ghi_chu: mergedGhiChu ?? full.ghi_chu ?? null,
      });
      updateMutation.mutate(
        { id: full.id, data },
        { onSuccess: () => setViewingItem(null) }
      );
    },
    [updateMutation, viewingFull]
  );

  const handleDelete = (id: string) => {
    confirm({
      title: t('thanhToanDoiTac.deleteTitle'),
      message: t('thanhToanDoiTac.deleteMessage'),
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
      title: t('thanhToanDoiTac.deleteTitle'),
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

  /**
   * Đánh dấu Đã thanh toán / Đã huỷ hàng loạt — quyền phê duyệt như nút đổi trạng thái
   * đơn lẻ. Lựa chọn có thể nằm ở nhiều trang nên không lọc trước ở client: DB chỉ đổi
   * phiếu chưa ở trạng thái kết thúc, số còn lại báo "bỏ qua".
   */
  const chuyenManyMutation = useChuyenTrangThaiThanhToanMany();
  const statusDaThanhToan = statusList.find((s) => s.ma === MA_TRANG_THAI_DA_THANH_TOAN);
  const statusDaHuy = statusList.find((s) => s.ma === MA_TRANG_THAI_DA_HUY);
  const idsKetThuc = [statusDaThanhToan?.id, statusDaHuy?.id].filter((x): x is string => !!x);

  const handleChuyenTrangThaiMany = (status: { id: string; ten: string }, laHuy: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    confirm({
      title: t(laHuy ? 'thanhToanDoiTac.bulk.huyTitle' : 'thanhToanDoiTac.bulk.daThanhToanTitle'),
      message: t('thanhToanDoiTac.bulk.message', { count: ids.length, status: status.ten }),
      variant: laHuy ? 'danger' : 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await chuyenManyMutation.mutateAsync({
          ids,
          status: { id: status.id, ten: status.ten },
          idsKetThuc,
          ngayXuLy: getTodayISO().slice(0, 10),
        });
        clearSelection();
        if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  /* ───────── Xuất: tải TẤT CẢ bản ghi khớp bộ lọc + phạm vi xem, không chỉ trang đang xem ───────── */
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<ThanhToanDoiTac[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const exportColumns = useMemo(() => getExportColumnsThanhToanDoiTacList(t), [t]);
  const { exportData, paginatedData, selectedData } = useExportData<ThanhToanDoiTac>({
    data: exportRows,
    isOpen: showExport,
    mapFn: mapThanhToanDoiTacListRow,
    pagination,
    selectedIds,
    keyExtractor: (p) => p.id,
  });

  const handleOpenExport = useCallback(async () => {
    if (totalCount === 0) {
      toast.warning(t('thanhToanDoiTac.export.noData'));
      return;
    }
    setExportLoading(true);
    try {
      setExportRows(await fetchAllThanhToanDoiTacForListQuery(listServerQuery));
      setShowExport(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExportLoading(false);
    }
  }, [listServerQuery, totalCount, t]);

  /* ───────── Nhập Excel: chỉ vào đơn vị trong phạm vi xem ───────── */
  const allowedBranches = useMemo(() => {
    if (viewScope.viewAll) return chiNhanhList;
    const allowed = new Set(viewScope.allowedBranchIds.map(String));
    if (user?.id_chi_nhanh) allowed.add(String(user.id_chi_nhanh));
    return chiNhanhList.filter((b) => allowed.has(String(b.id)));
  }, [chiNhanhList, viewScope.viewAll, viewScope.allowedBranchIds, user?.id_chi_nhanh]);

  const importer = useThanhToanDoiTacImport({
    allowedBranches,
    statusList,
    nhomList,
    defaultDonViId: user?.id_chi_nhanh ? String(user.id_chi_nhanh) : null,
  });

  const bulkActions = (
    <>
      <NutInHangLoat mau="thanh-toan-doi-tac" ids={Array.from(selectedIds)} />
      {canApprove && statusDaThanhToan && (
        <BulkActionButton
          icon={CheckCircle2}
          tone="success"
          label={statusDaThanhToan.ten}
          onClick={() => handleChuyenTrangThaiMany(statusDaThanhToan, false)}
          disabled={chuyenManyMutation.isPending}
        />
      )}
      {canApprove && statusDaHuy && (
        <BulkActionButton
          icon={XCircle}
          tone="danger"
          label={statusDaHuy.ten}
          onClick={() => handleChuyenTrangThaiMany(statusDaHuy, true)}
          disabled={chuyenManyMutation.isPending}
        />
      )}
    </>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm overflow-hidden">
      <ThanhToanDoiTacToolbar
        data={tomTatList}
        doiTacList={doiTacList}
        nhomList={nhomList}
        chiNhanhList={chiNhanhList}
        statusList={statusList}
        nguoiTaoList={nguoiTaoList}
        selectedCount={selectedIds.size}
        onExport={handleOpenExport}
        exportLoading={exportLoading}
        onImport={canCreate ? importer.openImport : undefined}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        bulkActions={bulkActions}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col md:px-4 md:pb-4 pt-1">
        <ThanhToanDoiTacList
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
          columns={columns}
          onResizeColumn={resizeColumn}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onView={setViewingItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <ThanhToanDoiTacForm
            doiTacList={doiTacList}
            chiNhanhList={chiNhanhList}
            employees={employees}
            statusList={statusList}
            initialData={editingFull ?? editingItem}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <ThanhToanDoiTacDetail
            data={viewingFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={canUpdate ? (item) => {
              setViewingItem(null);
              setEditingItem(item);
              setShowForm(true);
            } : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onChangeStatus={canApprove ? handleChangeStatus : undefined}
            statusList={statusList}
          />
        )}
      </AnimatePresence>

      <LazyExportDialog
        open={showExport}
        onClose={() => {
          setShowExport(false);
          setExportRows([]);
        }}
        columns={exportColumns}
        data={exportData}
        paginatedData={paginatedData}
        selectedData={selectedData}
        fileName={TTDT_LIST_EXPORT_FILE_NAME}
        sheetName={TTDT_LIST_EXPORT_SHEET_NAME}
      />

      {canCreate && (
        <LazyImportDialog
          open={importer.showImport}
          onClose={importer.closeImport}
          columns={importer.importColumns}
          sampleRows={importer.sampleRows}
          guideNotes={importer.guideNotes}
          referenceSheets={importer.referenceSheets}
          importErrors={importer.importErrors}
          templateFileName={importer.templateFileName}
          onImport={importer.handleImport}
        />
      )}
    </div>
  );
};

export default DanhSachTab;
