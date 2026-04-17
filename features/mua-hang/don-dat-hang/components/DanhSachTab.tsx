import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useDonDatHangListPaged, useDonDatHangById, useDeleteDonDatHang, useDeleteDonDatHangMany, useUpdateDonDatHang } from '../hooks/use-don-dat-hang';
import { useDonDatHangViewScope } from '../hooks/use-don-dat-hang-view-scope';
import { buildDonDatHangListServerQuery } from '../services/don-dat-hang-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useDebouncedValue } from '../../../../lib/hooks/use-debounced-value';
import { useDoiTacRefQuery, useEmployeesRefQuery, usePhieuDeXuatSoPhieuMinimalQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { useDonDatHangStore } from '../store/useDonDatHangStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { DonDatHang } from '../core/types';
import type { DonDatHangFormValues } from '../core/schema';
import DonDatHangToolbar from './DonDatHangToolbar';

function donDatHangToFormValues(
  p: DonDatHang,
  trangThai: DonDatHang['trang_thai'],
  overrideGhiChu?: string
): DonDatHangFormValues {
  return {
    so_po: p.so_po,
    ngay_dat: p.ngay_dat,
    ngay_giao_dk: p.ngay_giao_dk,
    id_nha_cung_cap: p.id_nha_cung_cap,
    id_kho_nhan: p.id_kho_nhan ?? undefined,
    id_phieu_de_xuat_vat_tu: p.id_phieu_de_xuat_vat_tu ?? undefined,
    id_nguoi_dat: p.id_nguoi_dat,
    id_nguoi_duyet: p.id_nguoi_duyet ?? undefined,
    dieu_khoan_thanh_toan: p.dieu_khoan_thanh_toan ?? '',
    ghi_chu: overrideGhiChu !== undefined ? overrideGhiChu : (p.ghi_chu ?? ''),
    trang_thai: trangThai,
    chi_tiet: (p.chi_tiet ?? []).map((ct) => ({
      id_hang_hoa: ct.id_hang_hoa,
      so_luong: ct.so_luong,
      don_gia: ct.don_gia,
      ghi_chu: ct.ghi_chu ?? '',
    })),
  };
}
import DonDatHangList from './DonDatHangList';
import DonDatHangForm from './DonDatHangForm';
import DonDatHangDetail from './DonDatHangDetail';

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

  const { data: supplierList = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: khoList = [] } = useKhoList();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: phieuDeXuatList = [] } = usePhieuDeXuatSoPhieuMinimalQuery();
  const viewScope = useDonDatHangViewScope();
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  const listServerQuery = useMemo(
    () =>
      buildDonDatHangListServerQuery({
        searchTerm: debouncedSearchTerm,
        filters,
        viewScope,
        khoList,
      }),
    [debouncedSearchTerm, filters, viewScope, khoList]
  );
  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);
  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = useDonDatHangListPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = pageQuery.isPending || pageQuery.isFetching;

  const { data: viewingPoFull } = useDonDatHangById(viewingItem?.id);
  const { data: editingPoFull } = useDonDatHangById(editingItem?.id);
  const deleteMutation = useDeleteDonDatHang();
  const deleteManyMutation = useDeleteDonDatHangMany();
  const updateMutation = useUpdateDonDatHang();

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
      const full = viewingPoFull ?? item;
      const mergedGhiChu = payload.ghiChu
        ? (full.ghi_chu ? full.ghi_chu + '\n' : '') + `[Ghi chú phê duyệt]: ${payload.ghiChu}`
        : undefined;
      const data = donDatHangToFormValues(full, payload.trangThai, mergedGhiChu);
      updateMutation.mutate(
        { id: full.id, data },
        { onSuccess: () => setViewingItem(null) }
      );
    },
    [updateMutation, viewingPoFull]
  );

  const handleChangeStatus = useCallback(
    (item: DonDatHang, payload: { trangThai: DonDatHang['trang_thai']; ghiChu?: string }) => {
      const full = viewingPoFull ?? item;
      const mergedGhiChu = payload.ghiChu
        ? (full.ghi_chu ? full.ghi_chu + '\n' : '') + `[Chuyển trạng thái]: ${payload.ghiChu}`
        : undefined;
      const data = donDatHangToFormValues(full, payload.trangThai, mergedGhiChu);
      updateMutation.mutate({ id: full.id, data });
    },
    [updateMutation, viewingPoFull]
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
          isLoading={isLoading}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
