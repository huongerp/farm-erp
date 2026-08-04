import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { usePhieuKiemKeList, usePhieuKiemKeById, useDeletePhieuKiemKe, useDeletePhieuKiemKeMany, useUpdatePhieuKiemKe } from '../hooks/use-phieu-kiem-ke';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { usePhieuKiemKeStore } from '../store/usePhieuKiemKeStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuKiemKe } from '../core/types';
import type { PhieuKiemKeFormValues } from '../core/schema';
import type { PhieuKiemKeApprovePayload } from './PhieuKiemKeDetail';
import PhieuKiemKeToolbar from './PhieuKiemKeToolbar';
import PhieuKiemKeList from './PhieuKiemKeList';
import PhieuKiemKeForm from './PhieuKiemKeForm';
import PhieuKiemKeDetail from './PhieuKiemKeDetail';
import type { PhieuKiemKeFilters } from '../store/usePhieuKiemKeStore';

function phieuToFormValues(p: PhieuKiemKe): PhieuKiemKeFormValues {
  return {
    so_phieu: p.so_phieu,
    ngay: p.ngay,
    id_kho: p.id_kho,
    id_nguoi_thuc_hien: p.id_nguoi_thuc_hien,
    id_nguoi_duyet: p.id_nguoi_duyet ?? null,
    ghi_chu: p.ghi_chu ?? '',
    trang_thai: p.trang_thai as PhieuKiemKeFormValues['trang_thai'],
    chi_tiet: (p.chi_tiet ?? []).map((ct) => ({
      id_hang_hoa: ct.id_hang_hoa,
      so_luong_so: ct.so_luong_so,
      so_luong_thuc_te: ct.so_luong_thuc_te ?? null,
      don_vi_tinh: ct.don_vi_tinh ?? '',
      ghi_chu: ct.ghi_chu ?? '',
    })),
  };
}

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
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
  } = usePhieuKiemKeStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKiemKe | null>(null);
  const [viewingItem, setViewingItem] = useState<PhieuKiemKe | null>(null);

  const { data: allList = [], isLoading } = usePhieuKiemKeList();
  const { data: khoList = [] } = useKhoList();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: viewingPhieuFull } = usePhieuKiemKeById(viewingItem?.id);
  const { data: editingPhieuFull } = usePhieuKiemKeById(editingItem?.id);
  const deleteMutation = useDeletePhieuKiemKe();
  const deleteManyMutation = useDeletePhieuKiemKeMany();
  const updateMutation = useUpdatePhieuKiemKe();

  const filterFn = useCallback((item: PhieuKiemKe, term: string, f: PhieuKiemKeFilters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.so_phieu.toLowerCase().includes(searchLower) ||
      (item.ten_kho?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_nguoi_thuc_hien?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_nguoi_duyet?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(searchLower) ?? false);
    const matchesStatus = (f.status?.length ?? 0) === 0 || (f.status ?? []).includes(item.trang_thai);
    const matchesKho = (f.khoIds?.length ?? 0) === 0 || (f.khoIds ?? []).includes(item.id_kho);
    const matchesPerformer = (f.nguoiThucHienIds?.length ?? 0) === 0 || (f.nguoiThucHienIds ?? []).includes(item.id_nguoi_thuc_hien);
    const matchesApprover =
      (f.nguoiDuyetIds?.length ?? 0) === 0 ||
      (item.id_nguoi_duyet != null && (f.nguoiDuyetIds ?? []).includes(item.id_nguoi_duyet));
    return matchesSearch && matchesStatus && matchesKho && matchesPerformer && matchesApprover;
  }, []);

  const filteredList = useListWithFilter(allList, searchTerm, filters, filterFn);

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
    const fresh = allList.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [allList, viewingItem?.id]);

  const handleEdit = (item: PhieuKiemKe) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleApprove = (item: PhieuKiemKe, payload: PhieuKiemKeApprovePayload) => {
    const full = viewingPhieuFull ?? item;
    const formValues = phieuToFormValues(full);
    updateMutation.mutate({
      id: full.id,
      data: {
        ...formValues,
        trang_thai: payload.trangThai,
        id_nguoi_duyet: user?.id ?? null,
        ghi_chu: payload.ghiChu?.trim() || formValues.ghi_chu || undefined,
      },
    });
    setViewingItem(null);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuKiemKe.deleteTitle'),
      message: t('phieuKiemKe.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
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
      title: t('phieuKiemKe.deleteTitle'),
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
      <PhieuKiemKeToolbar
        data={filteredList}
        khoList={khoList}
        employees={employees}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <PhieuKiemKeList
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={setViewingItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PhieuKiemKeForm
            khoList={khoList}
            employees={employees}
            initialData={editingPhieuFull ?? editingItem}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <PhieuKiemKeDetail
            data={viewingPhieuFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => {
              setViewingItem(null);
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onApprove={handleApprove}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
