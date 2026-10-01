import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { DangKyNhanHang } from '../core/types';
import { coTheSuaPhieu, coTheXoaPhieu } from '../core/trang-thai';
import { chiNhanhGanNhatCuaToi, goiYGiaTri } from '../core/goi-y';
import type { DangKyNhanHangListServerQuery } from '../services/dang-ky-nhan-hang-list-query';
import { fetchAllDkNhForListQuery } from '../services/dang-ky-nhan-hang-service';
import {
  useDangKyNhanHangById,
  useDangKyNhanHangPage,
  useDangKyNhanHangTomTat,
  useDeleteDangKyNhanHang,
  useDeleteDangKyNhanHangMany,
} from '../hooks/use-dang-ky-nhan-hang';
import { useDangKyNhanHangCapCao, useDangKyNhanHangViewScope } from '../hooks/use-dang-ky-nhan-hang-view-scope';
import { useDangKyNhanHangStore } from '../store/useDangKyNhanHangStore';
import {
  exportFileNameDangKyNhanHang,
  getExportColumnsDangKyNhanHang,
  mapDangKyNhanHangRow,
} from '../utils/export-dang-ky-nhan-hang';
import DangKyNhanHangToolbar from './DangKyNhanHangToolbar';
import DangKyNhanHangList from './DangKyNhanHangList';
import DangKyNhanHangForm from './DangKyNhanHangForm';
import DangKyNhanHangDetail from './DangKyNhanHangDetail';
import CheckInOutDialog from './CheckInOutDialog';

/** Cột hiển thị → cột sắp xếp ở DB (cột ghép / tính toán không sort ở server). */
const SORT_COLUMN_MAP: Record<string, string> = {
  gio_dang_ky: 'gio_dang_ky_tu',
};

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const capCao = useDangKyNhanHangCapCao();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
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
  } = useDangKyNhanHangStore();

  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingItem, setEditingItem] = useState<DangKyNhanHang | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [quick, setQuick] = useState<{ item: DangKyNhanHang; mode: 'checkIn' | 'checkOut' } | null>(null);

  const viewScope = useDangKyNhanHangViewScope();

  const listServerQuery: DangKyNhanHangListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: filters.nam ?? [],
      thang: filters.thang ?? [],
      trangThai: filters.trang_thai ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      sortColumn: sort.column ? (SORT_COLUMN_MAP[sort.column] ?? sort.column) : null,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const pageQuery = useDangKyNhanHangPage(listServerQuery, !viewScope.isLoading);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const { data: tomTatList = [] } = useDangKyNhanHangTomTat(
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading
  );
  const { data: branches = [] } = useBranches();
  const { data: viewingFull } = useDangKyNhanHangById(viewingId ?? undefined);
  const viewingItem = viewingFull ?? pageList.find((p) => p.id === viewingId) ?? null;

  const deleteMutation = useDeleteDangKyNhanHang();
  const deleteManyMutation = useDeleteDangKyNhanHangMany();

  const preferredBranchId = useMemo(
    () => chiNhanhGanNhatCuaToi(tomTatList, user?.id != null ? String(user.id) : null),
    [tomTatList, user?.id]
  );
  const goiYKhachHang = useMemo(() => goiYGiaTri(tomTatList.map((r) => r.khach_hang)), [tomTatList]);
  const goiYLoaiHang = useMemo(() => goiYGiaTri(tomTatList.map((r) => r.loai_hang_hoa)), [tomTatList]);

  /** Xuất file cần TẤT CẢ bản ghi khớp bộ lọc — chỉ tải khi mở hộp thoại Xuất. */
  const [exportRows, setExportRows] = useState<DangKyNhanHang[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllDkNhForListQuery(listServerQuery)
      .then((rows) => !cancelled && setExportRows(rows))
      .catch(() => !cancelled && setExportRows([]))
      .finally(() => !cancelled && setExportLoading(false));
    return () => {
      cancelled = true;
    };
  }, [showExport, listServerQuery]);

  const exportColumns = useMemo(() => getExportColumnsDangKyNhanHang(t), [t]);
  const exportMap = useCallback((item: DangKyNhanHang) => mapDangKyNhanHangRow(item), []);
  const { exportData, paginatedData, selectedData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMap,
    pagination,
    selectedIds,
    keyExtractor: (p) => p.id,
  });

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('dangKyNhanHang.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  useEffect(() => () => resetState(), [resetState]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const openEdit = (item: DangKyNhanHang) => {
    setEditingItem(item);
    setViewingId(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('dangKyNhanHang.deleteTitle'),
      message: t('dangKyNhanHang.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id);
        if (viewingId === id) setViewingId(null);
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('dangKyNhanHang.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewingId && ids.includes(viewingId)) setViewingId(null);
      },
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DangKyNhanHangToolbar
        data={tomTatList}
        branches={branches}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onExport={handleExport}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <DangKyNhanHangList
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
          columns={columns}
          onResizeColumn={resizeColumn}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isLoading || viewScope.isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={sort}
          onSort={setSort}
          onView={(item) => setViewingId(item.id)}
          onEdit={canUpdate ? (item) => (coTheSuaPhieu(item.trang_thai, capCao) ? openEdit(item) : toast.info(t('dangKyNhanHang.khongSuaDuoc'))) : undefined}
          onDelete={
            canDelete
              ? (id) => {
                  const item = pageList.find((p) => p.id === id);
                  if (item && !coTheXoaPhieu(item.trang_thai, capCao)) toast.info(t('dangKyNhanHang.khongXoaDuoc'));
                  else handleDelete(id);
                }
              : undefined
          }
          onQuickAction={canUpdate ? (item, mode) => setQuick({ item, mode }) : undefined}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <DangKyNhanHangForm
            branches={branches}
            initialData={editingItem}
            preferredBranchId={editingItem ? null : preferredBranchId}
            goiYKhachHang={goiYKhachHang}
            goiYLoaiHang={goiYLoaiHang}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedData}
            selectedData={selectedData}
            fileName={exportFileNameDangKyNhanHang()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DangKyNhanHangDetail
            data={viewingItem}
            onClose={() => setViewingId(null)}
            onEdit={canUpdate ? openEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quick && <CheckInOutDialog mode={quick.mode} data={quick.item} onClose={() => setQuick(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
