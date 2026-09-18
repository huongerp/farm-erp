import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ThuHoachListServerQuery } from '../services/thu-hoach-list-query';
import { fetchAllThuHoachForListQuery } from '../services/thu-hoach-service';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import {
  useThuHoachPage,
  useThuHoachTomTat,
  useThuHoachById,
  useDeleteThuHoach,
  useDeleteThuHoachMany,
} from '../hooks/use-thu-hoach';
import { useThuHoachViewScope } from '../hooks/use-thu-hoach-view-scope';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useThuHoachStore } from '../store/useThuHoachStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { FarmThuHoach } from '../core/types';
import { getPreferredBranchFromUserLastRecords } from '../core/form-mappers';
import { useAuthStore } from '../../../../store/useStore';
import ThuHoachToolbar from './ThuHoachToolbar';
import ThuHoachList from './ThuHoachList';
import ThuHoachForm from './ThuHoachForm';
import ThuHoachDetail from './ThuHoachDetail';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';

import {
  mapFarmThuHoachListRow,
  getExportColumnsThuHoachList,
  exportFileNameThuHoachDanhSach,
} from '../utils/export-thu-hoach-danh-sach';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
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
  } = useThuHoachStore();

  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmThuHoach | null>(null);
  const [viewingItem, setViewingItem] = useState<FarmThuHoach | null>(null);

  const viewScope = useThuHoachViewScope();

  /** Bộ lọc gửi thẳng xuống PostgREST — trước đây tab này tải toàn bộ bảng. */
  const listServerQuery: ThuHoachListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: filters.nam ?? [],
      tuan: filters.tuan ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const pageQuery = useThuHoachPage(listServerQuery, !viewScope.isLoading);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  /** Tóm tắt toàn bộ: chip lọc năm/tuần/chi nhánh + gợi ý chi nhánh. */
  const { data: tomTatList = [] } = useThuHoachTomTat(
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading
  );

  const { data: branches = [] } = useBranches();
  const { data: viewingFull } = useThuHoachById(viewingItem?.id);
  const { data: editingFull } = useThuHoachById(editingItem?.id);
  const deleteMutation = useDeleteThuHoach();
  const deleteManyMutation = useDeleteThuHoachMany();

  const user = useAuthStore((s) => s.user);

  /** Chi nhánh người dùng hay nhập — gợi ý khi thêm phiếu mới. */
  const preferredBranch = useMemo(
    () => getPreferredBranchFromUserLastRecords(tomTatList, user?.id),
    [tomTatList, user?.id]
  );

  /** Xuất file cần TẤT CẢ bản ghi khớp bộ lọc — chỉ tải khi mở hộp thoại Xuất. */
  const [exportRows, setExportRows] = useState<FarmThuHoach[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllThuHoachForListQuery(listServerQuery)
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
  }, [showExport, listServerQuery]);

  const exportColumnsThuHoach = useMemo(() => getExportColumnsThuHoachList(t), [t]);
  const exportMapThuHoach = useCallback((item: FarmThuHoach) => mapFarmThuHoachListRow(item), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: exportRows,
      isOpen: showExport && !exportLoading,
      mapFn: exportMapThuHoach,
      pagination,
      selectedIds,
      keyExtractor: (p) => p.id,
    });

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('thuHoach.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = pageList.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [pageList, viewingItem]);

  const handleEdit = (item: FarmThuHoach) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thuHoach.deleteTitle'),
      message: t('thuHoach.deleteMessage'),
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
      title: t('thuHoach.deleteTitle'),
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
      <ThuHoachToolbar
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
        <ThuHoachList
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
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onView={setViewingItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <ThuHoachForm
            branches={branches}
            initialData={editingFull ?? editingItem}
            preferredBranch={editingItem ? undefined : preferredBranch}
            existingThuHoach={tomTatList}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsThuHoach}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNameThuHoachDanhSach()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <ThuHoachDetail
            data={viewingFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={
              canUpdate
                ? (item) => {
                    setViewingItem(null);
                    setEditingItem(item);
                    setShowForm(true);
                  }
                : undefined
            }
            onDelete={canDelete ? handleDelete : undefined}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
