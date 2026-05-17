import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import {
  useHopDongList,
  useHopDongChiTietAllList,
  useInsertHopDongChiTiet,
  useUpdateHopDongChiTiet,
  useDeleteHopDongChiTiet,
} from '../hooks/use-hop-dong';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useThanhToanStore } from '../store/useThanhToanStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useAuthStore } from '../../../../store/useStore';
import type { HopDongChiTietEnriched, ThanhToanFilters } from '../core/types';
import { matchesThanhToanFilters } from '../core/list-filter-helpers';
import type { ThanhToanFormValues } from '../core/schema';
import type { HopDongChiTietLineValues } from '../core/schema';
import ThanhToanToolbar from './ThanhToanToolbar';
import ThanhToanList from './ThanhToanList';
import ThanhToanDetail from './ThanhToanDetail';
import ThanhToanForm from './ThanhToanForm';
import {
  getExportColumnsThanhToanList,
  mapThanhToanListRow,
  exportFileNameThanhToanList,
  LIST_EXPORT_SHEET_THANH_TOAN,
  THANH_TOAN_LIST_EXPORT_KEYS,
} from '../utils/export-hop-dong-list';

const ThanhToanTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);

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
  } = useThanhToanStore();

  const [viewingItem, setViewingItem] = useState<HopDongChiTietEnriched | null>(null);
  const [editingItem, setEditingItem] = useState<HopDongChiTietEnriched | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const { data: allList = [], isLoading } = useHopDongChiTietAllList();
  const { data: hopDongList = [] } = useHopDongList();
  const { data: chiNhanhList = [] } = useBranches();

  const insertCt = useInsertHopDongChiTiet();
  const updateCt = useUpdateHopDongChiTiet();
  const deleteCt = useDeleteHopDongChiTiet();

  const filterFn = useCallback((item: HopDongChiTietEnriched, term: string, f: ThanhToanFilters) => {
    const q = term.toLowerCase();
    const matchesSearch =
      !term ||
      (item.ma_hop_dong?.toLowerCase().includes(q) ?? false) ||
      (item.ten_dot?.toLowerCase().includes(q) ?? false) ||
      (item.ten_nha_cung_cap?.toLowerCase().includes(q) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(q) ?? false) ||
      (item.ten_hop_dong?.toLowerCase().includes(q) ?? false);
    return matchesSearch && matchesThanhToanFilters(item, f);
  }, []);

  const filteredList = useListWithFilter(allList, searchTerm, filters, filterFn);

  const chiNhanhMap = useMemo(() => {
    const m: Record<string, string> = {};
    chiNhanhList.forEach((b) => {
      m[b.id] = b.ten_chi_nhanh;
    });
    return m;
  }, [chiNhanhList]);

  const exportColumnsList = useMemo(() => getExportColumnsThanhToanList(t), [t]);
  const exportMapList = useCallback(
    (item: HopDongChiTietEnriched) => mapThanhToanListRow(item, chiNhanhMap),
    [chiNhanhMap]
  );
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData<HopDongChiTietEnriched>({
      data: filteredList,
      isOpen: showExport,
      mapFn: exportMapList,
      pagination,
      selectedIds,
      keyExtractor: (p) => p.id,
    });

  const listExportVisibleKeys = useMemo(() => {
    const allowed = new Set<string>(THANH_TOAN_LIST_EXPORT_KEYS as unknown as string[]);
    const picked = columns.filter((c) => c.visible && allowed.has(c.id)).map((c) => c.id);
    return picked.length > 0 ? picked : undefined;
  }, [columns]);

  const handleExport = useCallback(() => {
    if (filteredList.length === 0) {
      toast.warning(t('hopDong.noExportData'));
      return;
    }
    setShowExport(true);
  }, [filteredList.length, t]);

  useEffect(() => resetState(), [resetState]);
  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);
  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: HopDongChiTietEnriched) => {
    setEditingItem(item);
    setViewingItem(null);
    setFormOpen(true);
  };

  const lineFromForm = (values: ThanhToanFormValues): HopDongChiTietLineValues => ({
    ngay: values.ngay,
    ten_dot: values.ten_dot,
    so_tien: values.so_tien,
    so_cay_thuc_nhan: values.so_cay_thuc_nhan,
    ghi_chu: values.ghi_chu,
    id_chi_nhanh: values.id_chi_nhanh,
  });

  const onSaveForm = (values: ThanhToanFormValues) => {
    const row = lineFromForm(values);
    if (editingItem?.id) {
      updateCt.mutate(
        { idCt: editingItem.id, idHopDong: editingItem.id_hop_dong, row },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditingItem(null);
          },
        }
      );
    } else {
      insertCt.mutate(
        { idHopDong: values.id_hop_dong, row, idNguoiTao: user?.id ?? null },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditingItem(null);
          },
        }
      );
    }
  };

  const handleDelete = (item: HopDongChiTietEnriched) => {
    confirm({
      title: t('hopDong.chiTiet.deleteTitle'),
      message: t('hopDong.chiTiet.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteCt.mutate(
          { idCt: item.id, idHopDong: item.id_hop_dong },
          {
            onSuccess: () => {
              if (viewingItem?.id === item.id) setViewingItem(null);
            },
          }
        ),
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    const items = filteredList.filter((x) => ids.includes(x.id));
    confirm({
      title: t('hopDong.chiTiet.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        for (const item of items) {
          await deleteCt.mutateAsync({ idCt: item.id, idHopDong: item.id_hop_dong });
        }
        clearSelection();
        if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  const formPending = insertCt.isPending || updateCt.isPending;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ThanhToanToolbar
        data={allList}
        chiNhanhList={chiNhanhList}
        selectedCount={selectedIds.size}
        onAdd={handleAdd}
        onDeleteMany={handleDeleteMany}
        onExport={handleExport}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <ThanhToanList
          data={filteredList}
          columns={columns}
          chiNhanhList={chiNhanhList}
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
            fileName={exportFileNameThanhToanList()}
            visibleColumnKeys={listExportVisibleKeys}
            sheetName={LIST_EXPORT_SHEET_THANH_TOAN}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !formOpen && (
          <ThanhToanDetail
            data={viewingItem}
            chiNhanhList={chiNhanhList}
            onClose={() => setViewingItem(null)}
            onEdit={
              canUpdate
                ? (item) => {
                    setViewingItem(null);
                    handleEdit(item);
                  }
                : undefined
            }
            onDelete={canDelete ? handleDelete : undefined}
          />
        )}
      </AnimatePresence>

      <ThanhToanForm
        open={formOpen}
        hopDongList={hopDongList}
        chiNhanhList={chiNhanhList}
        initial={editingItem}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={onSaveForm}
        isLoading={formPending}
      />
    </div>
  );
};

export default ThanhToanTab;
