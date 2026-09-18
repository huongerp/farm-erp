import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { HopDongListServerQuery } from '../services/hop-dong-list-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import {
  useHopDongPage,
  useHopDongList,
  useHopDongById,
  useDeleteHopDong,
  useDeleteHopDongMany,
} from '../hooks/use-hop-dong';
import { useDoiTacRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useHopDongStore } from '../store/useHopDongStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { HopDong } from '../core/types';
import HopDongToolbar from './HopDongToolbar';
import HopDongList from './HopDongList';
import HopDongForm from './HopDongForm';
import HopDongDetail from './HopDongDetail';

import {
  getExportColumnsHopDongList,
  mapHopDongListRow,
  exportFileNameHopDongList,
  LIST_EXPORT_SHEET_HOP_DONG,
  HOP_DONG_LIST_EXPORT_KEYS,
} from '../utils/export-hop-dong-list';

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
  } = useHopDongStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HopDong | null>(null);
  const [viewingItem, setViewingItem] = useState<HopDong | null>(null);
  const [showExport, setShowExport] = useState(false);

  /** Bộ lọc gửi thẳng xuống PostgREST — trước đây tải toàn bộ hợp đồng + chi tiết. */
  const listServerQuery: HopDongListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      trangThai: filters.trangThai ?? [],
      nccIds: filters.nccIds ?? [],
      dateFrom: filters.dateFrom ?? '',
      dateTo: filters.dateTo ?? '',
      nguoiTaoIds: filters.nguoiTaoIds ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort]
  );

  const pageQuery = useHopDongPage(listServerQuery);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  /** Toàn bộ hợp đồng cho chip lọc (đếm theo trạng thái / NCC / người tạo). */
  const { data: allList = [] } = useHopDongList();
  const { data: doiTacList = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: chiNhanhList = [] } = useBranches();

  const { data: viewingFull } = useHopDongById(viewingItem?.id);
  const { data: editingFull } = useHopDongById(editingItem?.id);
  const deleteMutation = useDeleteHopDong();
  const deleteManyMutation = useDeleteHopDongMany();

  const exportColumnsList = useMemo(() => getExportColumnsHopDongList(t), [t]);
  const exportMapList = useCallback((item: HopDong) => mapHopDongListRow(item, t), [t]);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData<HopDong>({
      data: pageList,
      isOpen: showExport,
      mapFn: exportMapList,
      pagination,
      selectedIds,
      keyExtractor: (p) => p.id,
    });

  const listExportVisibleKeys = useMemo(() => {
    const allowed = new Set<string>(HOP_DONG_LIST_EXPORT_KEYS as unknown as string[]);
    const picked = columns.filter((c) => c.visible && allowed.has(c.id)).map((c) => c.id);
    return picked.length > 0 ? picked : undefined;
  }, [columns]);

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('hopDong.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  useEffect(() => resetState(), [resetState]);
  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleEdit = (item: HopDong) => {
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
      title: t('hopDong.deleteTitle'),
      message: t('hopDong.deleteMessage'),
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
      title: t('hopDong.deleteTitle'),
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

  const viewingData = viewingFull ?? viewingItem;
  const editingData = editingFull ?? editingItem;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <HopDongToolbar
        data={allList}
        doiTacList={doiTacList}
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
        <HopDongList
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
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsList}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNameHopDongList()}
            visibleColumnKeys={listExportVisibleKeys}
            sheetName={LIST_EXPORT_SHEET_HOP_DONG}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <HopDongForm doiTacList={doiTacList} initialData={editingData} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingData && !showForm && (
          <HopDongDetail
            data={viewingData}
            chiNhanhList={chiNhanhList}
            canUpdateChiTiet={canUpdate}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
