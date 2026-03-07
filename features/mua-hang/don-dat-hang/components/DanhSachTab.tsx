import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useDonDatHangList, useDonDatHangById, useDeleteDonDatHang, useDeleteDonDatHangMany, useUpdateDonDatHang } from '../hooks/use-don-dat-hang';
import { useDoiTacList } from '../../../kho-van/danh-sach-doi-tac/hooks/use-doi-tac';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';
import { usePhieuDeXuatVatTuList } from '../../../kho-van/phieu-de-xuat-vat-tu/hooks/use-phieu-de-xuat-vat-tu';
import { useDonDatHangStore } from '../store/useDonDatHangStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { DonDatHang } from '../core/types';
import type { DonDatHangFormValues } from '../core/schema';
import type { DonDatHangFilters } from '../store/useDonDatHangStore';
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
    trang_thai,
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

  const { data: allList = [], isLoading } = useDonDatHangList();
  const { data: supplierList = [] } = useDoiTacList('nha_cung_cap');
  const { data: khoList = [] } = useKhoList();
  const { data: employees = [] } = useEmployees();
  const { data: phieuDeXuatList = [] } = usePhieuDeXuatVatTuList();
  const { data: viewingPoFull } = useDonDatHangById(viewingItem?.id);
  const { data: editingPoFull } = useDonDatHangById(editingItem?.id);
  const deleteMutation = useDeleteDonDatHang();
  const deleteManyMutation = useDeleteDonDatHangMany();
  const updateMutation = useUpdateDonDatHang();

  const filterFn = useCallback((item: DonDatHang, term: string, f: DonDatHangFilters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.so_po.toLowerCase().includes(searchLower) ||
      (item.ten_nha_cung_cap?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_nguoi_dat?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(searchLower) ?? false);
    const matchesStatus = (f.status?.length ?? 0) === 0 || (f.status ?? []).includes(String(item.trang_thai));
    const matchesNcc = (f.nhaCungCapIds?.length ?? 0) === 0 || (f.nhaCungCapIds ?? []).includes(item.id_nha_cung_cap);
    const matchesKho = (f.khoNhanIds?.length ?? 0) === 0 || (item.id_kho_nhan != null && (f.khoNhanIds ?? []).includes(item.id_kho_nhan));
    const matchesBuyer = (f.nguoiDatIds?.length ?? 0) === 0 || (f.nguoiDatIds ?? []).includes(item.id_nguoi_dat);
    return matchesSearch && matchesStatus && matchesNcc && matchesKho && matchesBuyer;
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
    (item: DonDatHang, payload: { trangThai: 3 | 7; ghiChu?: string }) => {
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
        data={filteredList}
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
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <DonDatHangList
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
            onEdit={(item) => {
              setOpenedFormFromDetailId(item.id);
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
