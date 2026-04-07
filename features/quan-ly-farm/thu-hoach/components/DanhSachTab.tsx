import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import {
  useThuHoachList,
  useThuHoachById,
  useDeleteThuHoach,
  useDeleteThuHoachMany,
} from '../hooks/use-thu-hoach';
import { useThuHoachViewScope } from '../hooks/use-thu-hoach-view-scope';
import { filterThuHoachListByViewScope } from '../utils/thu-hoach-view-scope-filter';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useThuHoachStore, type ThuHoachFilters } from '../store/useThuHoachStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { FarmThuHoach } from '../core/types';
import { getPreferredBranchFromUserLastRecords } from '../core/form-mappers';
import { useAuthStore } from '../../../../store/useStore';
import ThuHoachToolbar from './ThuHoachToolbar';
import ThuHoachList from './ThuHoachList';
import ThuHoachForm from './ThuHoachForm';
import ThuHoachDetail from './ThuHoachDetail';
import ExportDialog from '../../../../components/shared/ExportDialog';
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
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useThuHoachStore();

  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmThuHoach | null>(null);
  const [viewingItem, setViewingItem] = useState<FarmThuHoach | null>(null);

  const { data: allList = [], isLoading } = useThuHoachList();
  const viewScope = useThuHoachViewScope();
  const viewableList = useMemo(
    () => filterThuHoachListByViewScope(allList, viewScope),
    [allList, viewScope]
  );
  const { data: branches = [] } = useBranches();
  const user = useAuthStore((s) => s.user);
  const preferredBranch = useMemo(
    () => getPreferredBranchFromUserLastRecords(allList, user?.id),
    [allList, user?.id]
  );
  const { data: viewingFull } = useThuHoachById(viewingItem?.id);
  const { data: editingFull } = useThuHoachById(editingItem?.id);
  const deleteMutation = useDeleteThuHoach();
  const deleteManyMutation = useDeleteThuHoachMany();

  const filterFn = useCallback((item: FarmThuHoach, term: string, f: ThuHoachFilters) => {
    const q = term.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (item.ten_chi_nhanh?.toLowerCase().includes(q) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(q) ?? false) ||
      String(item.nam).includes(q) ||
      String(item.tuan).includes(q);
    const matchesNam = (f.nam?.length ?? 0) === 0 || (f.nam ?? []).includes(String(item.nam));
    const matchesTuan = (f.tuan?.length ?? 0) === 0 || (f.tuan ?? []).includes(String(item.tuan));
    const matchesBranch =
      (f.id_chi_nhanh?.length ?? 0) === 0 ||
      (item.id_chi_nhanh != null && (f.id_chi_nhanh ?? []).includes(item.id_chi_nhanh));
    return matchesSearch && matchesNam && matchesTuan && matchesBranch;
  }, []);

  const filteredList = useListWithFilter(viewableList, searchTerm, filters, filterFn);

  const exportColumnsThuHoach = useMemo(() => getExportColumnsThuHoachList(t), [t]);
  const exportMapThuHoach = useCallback((item: FarmThuHoach) => mapFarmThuHoachListRow(item), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: filteredList,
      isOpen: showExport,
      mapFn: exportMapThuHoach,
      pagination,
      selectedIds,
      keyExtractor: (p) => p.id,
    });

  const handleExport = useCallback(() => {
    if (filteredList.length === 0) {
      toast.warning(t('thuHoach.noExportData'));
      return;
    }
    setShowExport(true);
  }, [filteredList.length, t]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = viewableList.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
    if (!fresh) setViewingItem(null);
  }, [viewableList, viewingItem]);

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
        data={filteredList}
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
          data={filteredList}
          columns={columns}
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
            existingThuHoach={allList}
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
