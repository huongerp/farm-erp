import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useThanhToanDoiTacList, useThanhToanDoiTacById, useDeleteThanhToanDoiTac, useDeleteThanhToanDoiTacMany, useUpdateThanhToanDoiTac } from '../hooks/use-thanh-toan-doi-tac';
import { useThanhToanDoiTacViewScope } from '../hooks/use-thanh-toan-doi-tac-view-scope';
import { filterThanhToanDoiTacListByViewScope } from '../utils/thanh-toan-doi-tac-view-scope-filter';
import { useDoiTacRefQuery, useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useTrangThaiThanhToanDoiTacList } from '../../thiet-lap-de-xuat-vat-tu/hooks/use-trang-thai-thanh-toan-doi-tac';
import { useThanhToanDoiTacStore } from '../store/useThanhToanDoiTacStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { ThanhToanDoiTac } from '../core/types';
import type { ThanhToanDoiTacFilters } from '../store/useThanhToanDoiTacStore';
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import { getTodayISO } from '../../../../lib/utils';
import ThanhToanDoiTacToolbar from './ThanhToanDoiTacToolbar';
import ThanhToanDoiTacList from './ThanhToanDoiTacList';
import ThanhToanDoiTacForm from './ThanhToanDoiTacForm';
import ThanhToanDoiTacDetail from './ThanhToanDoiTacDetail';

function thanhToanToFormValues(item: ThanhToanDoiTac, override?: Partial<ThanhToanDoiTacFormValues>): ThanhToanDoiTacFormValues {
  return {
    so_phieu: item.so_phieu,
    hang_muc_thanh_toan: item.hang_muc_thanh_toan,
    ngay: item.ngay,
    id_don_vi: item.id_don_vi ?? null,
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
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useThanhToanDoiTacStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ThanhToanDoiTac | null>(null);
  const [viewingItem, setViewingItem] = useState<ThanhToanDoiTac | null>(null);

  const { data: allList = [], isLoading } = useThanhToanDoiTacList();
  const { data: doiTacList = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: chiNhanhList = [] } = useBranches();
  const donViList = chiNhanhList; // Đơn vị = chi nhánh (alias để tương thích)
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: statusList = [] } = useTrangThaiThanhToanDoiTacList();
  const viewScope = useThanhToanDoiTacViewScope();

  const viewableList = useMemo(
    () => filterThanhToanDoiTacListByViewScope(allList, viewScope),
    [allList, viewScope]
  );

  const { data: viewingFull } = useThanhToanDoiTacById(viewingItem?.id);
  const { data: editingFull } = useThanhToanDoiTacById(editingItem?.id);
  const deleteMutation = useDeleteThanhToanDoiTac();
  const deleteManyMutation = useDeleteThanhToanDoiTacMany();
  const updateMutation = useUpdateThanhToanDoiTac();

  const filterFn = useCallback((item: ThanhToanDoiTac, term: string, f: ThanhToanDoiTacFilters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.so_phieu.toLowerCase().includes(searchLower) ||
      (item.hang_muc_thanh_toan?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_doi_tac?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_nhom?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_don_vi?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(searchLower) ?? false);
    const matchesStatus = (f.statusIds?.length ?? 0) === 0 || (f.statusIds ?? []).includes(item.id_trang_thai_thanh_toan);
    const matchesDoiTac = (f.doiTacIds?.length ?? 0) === 0 || (f.doiTacIds ?? []).includes(item.id_doi_tac);
    const matchesDonVi = (f.donViIds?.length ?? 0) === 0 || (item.id_don_vi != null && (f.donViIds ?? []).includes(item.id_don_vi)); // id_don_vi = chi nhánh
    return matchesSearch && matchesStatus && matchesDoiTac && matchesDonVi;
  }, []);

  const filteredList = useListWithFilter(viewableList, searchTerm, filters, filterFn);

  useEffect(() => resetState(), [resetState]);
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
  }, [viewableList, viewingItem?.id]);

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

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ThanhToanDoiTacToolbar
        data={filteredList}
        doiTacList={doiTacList}
        chiNhanhList={chiNhanhList}
        statusList={statusList}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <ThanhToanDoiTacList
          data={filteredList}
          columns={columns}
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
    </div>
  );
};

export default DanhSachTab;
