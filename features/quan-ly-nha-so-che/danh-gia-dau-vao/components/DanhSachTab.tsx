import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../../lib/button-labels';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import LazyImportDialog from '../../../../components/shared/LazyImportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { TRANG_THAI } from '../../../../lib/constants';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { DgdvListServerQuery } from '../services/danh-gia-dau-vao-list-query';
import type { DgdvListRow } from '../services/danh-gia-dau-vao-db.service';
import {
  fetchAllDgdvForListQuery,
  useDeleteDgdvMany,
  useDgdvById,
  useDgdvPage,
  useDgdvTomTat,
  useUpdateDgdvTrangThai,
} from '../hooks/use-danh-gia-dau-vao';
import { useDgdvPermissions, useDgdvViewScope } from '../hooks/use-danh-gia-dau-vao-permissions';
import { useDanhGiaDauVaoStore } from '../store/useDanhGiaDauVaoStore';
import { useDgdvImport } from '../hooks/use-dgdv-import';
import { dungPhieuSaoChep } from '../core/bang-tinh';
import type { DgdvFormValues } from '../core/schema';
import { TRANG_THAI_DGDV, type TrangThaiDgdvPhieu } from '../core/types';
import { exportFileNameDgdvDanhSach, getExportColumnsDgdvList, mapDgdvListRow } from '../utils/export-danh-sach';
import DgdvToolbar from './DgdvToolbar';
import DgdvList from './DgdvList';
import DgdvForm from './DgdvForm';
import DgdvDetail from './DgdvDetail';
import CaiDatDialog from './cai-dat/CaiDatDialog';

/** Trạng thái form: tạo mới (có thể điền sẵn — sao chép tuần) hoặc sửa phiếu theo id. */
type FormState = { kieu: 'moi'; giaTri: Partial<DgdvFormValues> | null } | { kieu: 'sua'; id: string } | null;

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const perm = useDgdvPermissions();
  const importer = useDgdvImport();
  const { canCreate, canDelete, canEditRow, canDeleteRow, canToggleTrangThai, canCaiDat, canNhapLuoi } = perm;
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
    setSort,
  } = useDanhGiaDauVaoStore();

  const [form, setForm] = useState<FormState>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showCaiDat, setShowCaiDat] = useState(false);

  const viewScope = useDgdvViewScope();
  const listServerQuery: DgdvListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: filters.nam ?? [],
      tuan: filters.tuan ?? [],
      trangThai: filters.trang_thai ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, viewScope.viewAll, viewScope.allowedBranchIds, filters, sort]
  );

  const pageQuery = useDgdvPage(listServerQuery, !viewScope.isLoading);
  const pageList = useMemo(() => pageQuery.data?.data ?? [], [pageQuery.data?.data]);
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const { data: tomTat = [] } = useDgdvTomTat(viewScope.viewAll, viewScope.allowedBranchIds, !viewScope.isLoading);
  const { data: branches = [] } = useBranches();
  /** Chi nhánh chọn được trong form: đang dùng + trong phạm vi. */
  const branchesForm = useMemo(() => {
    const dangDung = branches.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG);
    if (viewScope.viewAll) return dangDung;
    const cho = new Set(viewScope.allowedBranchIds.map(String));
    return dangDung.filter((b) => cho.has(String(b.id)));
  }, [branches, viewScope.viewAll, viewScope.allowedBranchIds]);

  const { data: viewing } = useDgdvById(viewingId ?? undefined);
  const { data: editing } = useDgdvById(form?.kieu === 'sua' ? form.id : undefined);
  const deleteMutation = useDeleteDgdvMany();
  const trangThaiMutation = useUpdateDgdvTrangThai();

  // ---- Xuất danh sách: chỉ tải toàn bộ khi mở hộp thoại ----
  const exportColumns = useMemo(() => getExportColumnsDgdvList(t), [t]);
  const exportMapFn = useCallback((item: DgdvListRow) => mapDgdvListRow(item, t), [t]);
  const exportRequest = useMemo(() => (showExport ? { query: listServerQuery } : null), [showExport, listServerQuery]);
  const [exportResult, setExportResult] = useState<{ request: { query: DgdvListServerQuery }; rows: DgdvListRow[] } | null>(null);
  const exportLoading = exportRequest !== null && exportResult?.request !== exportRequest;
  const exportRows = useMemo(
    () => (exportRequest !== null && exportResult?.request === exportRequest ? exportResult.rows : []),
    [exportRequest, exportResult]
  );
  useEffect(() => {
    if (!exportRequest) return;
    let cancelled = false;
    fetchAllDgdvForListQuery(exportRequest.query)
      .then((rows) => !cancelled && setExportResult({ request: exportRequest, rows }))
      .catch(() => !cancelled && setExportResult({ request: exportRequest, rows: [] }));
    return () => {
      cancelled = true;
    };
  }, [exportRequest]);
  const { exportData, paginatedData, selectedData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  useEffect(() => () => resetState(), [resetState]);

  // Xoá bớt / đổi lọc làm tổng giảm: lùi về trang cuối còn dữ liệu.
  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const handleEdit = (item: Pick<DgdvListRow, 'id' | 'trang_thai' | 'id_nguoi_tao'>) => {
    if (!canEditRow(item)) {
      toast.message(t('danhGiaDauVao.toast.editNotAllowed'));
      return;
    }
    setViewingId(null);
    setForm({ kieu: 'sua', id: item.id });
  };

  const xoa = (ids: string[], onDone?: () => void) =>
    confirm({
      title: t('danhGiaDauVao.deleteTitle'),
      message: ids.length > 1 ? t('common.deleteManyConfirm', { count: ids.length }) : t('danhGiaDauVao.deleteMessage'),
      variant: 'danger',
      confirmText: ids.length > 1 ? CONFIRM_DELETE_ALL() : CONFIRM_DELETE(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync(ids);
        if (viewingId && ids.includes(viewingId)) setViewingId(null);
        onDone?.();
      },
    });

  const handleDelete = (id: string) => {
    const item = pageList.find((r) => r.id === id) ?? (viewing?.id === id ? viewing : undefined);
    if (!item || !canDeleteRow(item)) {
      toast.message(t('danhGiaDauVao.toast.deleteNotAllowed'));
      return;
    }
    xoa([id]);
  };

  const handleDeleteMany = () => {
    const ids = [...selectedIds].filter((id) => {
      const item = pageList.find((r) => r.id === id);
      return item && canDeleteRow(item);
    });
    if (ids.length === 0) {
      toast.message(t('danhGiaDauVao.toast.deleteManyNoneAllowed'));
      return;
    }
    if (ids.length < selectedIds.size) toast.message(t('danhGiaDauVao.toast.deleteManyPartial'));
    xoa(ids, clearSelection);
  };

  const handleTrangThaiMany = (trangThai: TrangThaiDgdvPhieu) => {
    const ids = [...selectedIds].filter((id) => pageList.find((r) => r.id === id)?.trang_thai !== trangThai);
    if (ids.length === 0) {
      toast.message(t('danhGiaDauVao.toast.trangThaiManyNoneAllowed'));
      return;
    }
    const isKhoa = trangThai === TRANG_THAI_DGDV.KHOA;
    confirm({
      title: isKhoa ? t('danhGiaDauVao.confirmLockTitle') : t('danhGiaDauVao.confirmUnlockTitle'),
      message: t(isKhoa ? 'danhGiaDauVao.bulkLockMessage' : 'danhGiaDauVao.bulkUnlockMessage', { count: ids.length }),
      variant: isKhoa ? 'warning' : 'default',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await trangThaiMutation.mutateAsync({ ids, trang_thai: trangThai });
        clearSelection();
      },
    });
  };

  /** Sao chép sang tuần kế tiếp: tuần mới đã có phiếu của chi nhánh → báo lỗi, không mở form. */
  const handleSaoChep = () => {
    if (!viewing) return;
    const v = dungPhieuSaoChep(viewing);
    if (tomTat.some((p) => p.nam === v.nam && p.tuan === v.tuan && p.id_chi_nhanh === v.id_chi_nhanh)) {
      toast.error(t('danhGiaDauVao.toast.trungTuan', { tuan: v.tuan, nam: v.nam }));
      return;
    }
    setViewingId(null);
    setForm({ kieu: 'moi', giaTri: v });
  };

  const bulkActions =
    selectedIds.size > 0 && canToggleTrangThai ? (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleTrangThaiMany(TRANG_THAI_DGDV.KHOA)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15"
        >
          <Lock size={14} className="shrink-0" />
          <span className="text-xs font-medium">{t('danhGiaDauVao.bulkLockAction')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleTrangThaiMany(TRANG_THAI_DGDV.MO)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted"
        >
          <Unlock size={14} className="shrink-0" />
          <span className="text-xs font-medium">{t('danhGiaDauVao.bulkUnlockAction')}</span>
        </button>
      </div>
    ) : null;

  const formSanSang = form?.kieu === 'moi' || (form?.kieu === 'sua' && !!editing);

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DgdvToolbar
        data={tomTat}
        branches={branches}
        selectedCount={selectedIds.size}
        onAdd={() => setForm({ kieu: 'moi', giaTri: branchesForm[0] ? { id_chi_nhanh: branchesForm[0].id } : null })}
        onDeleteMany={canDelete ? handleDeleteMany : undefined}
        bulkActions={bulkActions}
        onImport={perm.canCreate ? importer.openImport : undefined}
        onExport={() => (totalCount === 0 ? toast.warning(t('danhGiaDauVao.noExportData')) : setShowExport(true))}
        onCaiDat={canCaiDat ? () => setShowCaiDat(true) : undefined}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <DgdvList
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
          sort={sort}
          onSort={setSort}
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={(item) => setViewingId(item.id)}
          canEditRow={canEditRow}
          canDeleteRow={canDeleteRow}
        />
      </div>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedData}
            selectedData={selectedData}
            fileName={exportFileNameDgdvDanhSach()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formSanSang && (
          <DgdvForm
            branches={branchesForm}
            initial={form?.kieu === 'sua' ? editing : null}
            giaTriMacDinh={form?.kieu === 'moi' ? form.giaTri : null}
            onClose={() => setForm(null)}
            onSaved={(id) => setViewingId(id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingId && viewing && !form && (
          <DgdvDetail
            data={viewing}
            onClose={() => setViewingId(null)}
            onEdit={canEditRow(viewing) ? () => handleEdit(viewing) : undefined}
            onDelete={canDeleteRow(viewing) ? () => handleDelete(viewing.id) : undefined}
            onSaoChep={canCreate ? handleSaoChep : undefined}
            canToggleTrangThai={canToggleTrangThai}
            canNhapLuoi={canNhapLuoi(viewing)}
          />
        )}
      </AnimatePresence>

      <LazyImportDialog open={importer.showImport} onClose={importer.closeImport} {...importer.dialogProps} />

      <AnimatePresence>{showCaiDat && <CaiDatDialog onClose={() => setShowCaiDat(false)} />}</AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
