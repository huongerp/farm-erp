import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { usePhieuDeXuatVatTuList, usePhieuDeXuatVatTuById, useDeletePhieuDeXuatVatTu, useDeletePhieuDeXuatVatTuMany, useUpdatePhieuDeXuatVatTu } from '../hooks/use-phieu-de-xuat-vat-tu';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';
import { useCauHinhDeXuatVatTu } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/hooks/use-cau-hinh-de-xuat-vat-tu';
import { usePhieuDeXuatVatTuStore } from '../store/usePhieuDeXuatVatTuStore';
import { useAuthStore } from '../../../../store/useStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuDeXuatVatTu } from '../core/types';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, trangThaiToFilterKey } from '../core/constants';
import type { PhieuDeXuatVatTuFilters } from '../store/usePhieuDeXuatVatTuStore';

function phieuToFormValues(p: PhieuDeXuatVatTu, trangThai: PhieuDeXuatVatTu['trang_thai'], overrideGhiChu?: string): PhieuDeXuatVatTuFormValues {
  return {
    so_phieu: p.so_phieu,
    ngay: p.ngay,
    ngay_can: p.ngay_can,
    id_noi_de_xuat: p.id_noi_de_xuat,
    id_nguoi_de_xuat: p.id_nguoi_de_xuat,
    id_nguoi_duyet: p.id_nguoi_duyet ?? undefined,
    ghi_chu: overrideGhiChu !== undefined ? overrideGhiChu : (p.ghi_chu ?? ''),
    trang_thai: trangThai,
    chi_tiet: (p.chi_tiet ?? []).map((ct) => ({
      id_hang_hoa: ct.id_hang_hoa,
      so_luong: ct.so_luong,
      thong_so: ct.thong_so ?? '',
      ghi_chu: ct.ghi_chu ?? '',
    })),
  };
}
import PhieuDeXuatVatTuToolbar from './PhieuDeXuatVatTuToolbar';
import PhieuDeXuatVatTuList from './PhieuDeXuatVatTuList';
import PhieuDeXuatVatTuForm from './PhieuDeXuatVatTuForm';
import PhieuDeXuatVatTuDetail, { type PhieuDeXuatVatTuApprovePayload } from './PhieuDeXuatVatTuDetail';

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
  } = usePhieuDeXuatVatTuStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuDeXuatVatTu | null>(null);
  const [viewingItem, setViewingItem] = useState<PhieuDeXuatVatTu | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const { data: allList = [], isLoading } = usePhieuDeXuatVatTuList();
  const { data: khoList = [] } = useKhoList();
  const { data: employees = [] } = useEmployees();
  const { data: config } = useCauHinhDeXuatVatTu();

  const canEditItem = useCallback(
    (item: PhieuDeXuatVatTu) => !config || config.cho_phep_sua_sau_duyet || item.trang_thai !== TRANG_THAI_DA_DUYET,
    [config]
  );
  const isOverdue = useCallback(
    (item: PhieuDeXuatVatTu) =>
      !!(config?.bat_canh_bao_qua_han && item.trang_thai === TRANG_THAI_CHO_DUYET && (Math.floor((Date.now() - new Date(item.tg_tao).getTime()) / 86400000) > (config.thoi_han_duyet_ngay ?? 0))),
    [config]
  );
  const { data: viewingPhieuFull } = usePhieuDeXuatVatTuById(viewingItem?.id);
  const { data: editingPhieuFull } = usePhieuDeXuatVatTuById(editingItem?.id);
  const deleteMutation = useDeletePhieuDeXuatVatTu();
  const deleteManyMutation = useDeletePhieuDeXuatVatTuMany();
  const updateMutation = useUpdatePhieuDeXuatVatTu();

  const filterFn = useCallback((item: PhieuDeXuatVatTu, term: string, f: PhieuDeXuatVatTuFilters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.so_phieu.toLowerCase().includes(searchLower) ||
      (item.ten_noi_de_xuat?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_nguoi_de_xuat?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_nguoi_duyet?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(searchLower) ?? false);
    const statusKey = trangThaiToFilterKey(item.trang_thai);
    const matchesStatus = (f.status?.length ?? 0) === 0 || (f.status ?? []).includes(statusKey);
    const matchesNoiDeXuat = (f.noiDeXuatIds?.length ?? 0) === 0 || (f.noiDeXuatIds ?? []).includes(item.id_noi_de_xuat);
    const matchesNguoiDeXuat = (f.nguoiDeXuatIds?.length ?? 0) === 0 || (f.nguoiDeXuatIds ?? []).includes(item.id_nguoi_de_xuat);
    const matchesNguoiDuyet =
      (f.nguoiDuyetIds?.length ?? 0) === 0 ||
      (item.id_nguoi_duyet != null && (f.nguoiDuyetIds ?? []).includes(item.id_nguoi_duyet));
    return matchesSearch && matchesStatus && matchesNoiDeXuat && matchesNguoiDeXuat && matchesNguoiDuyet;
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

  const handleEdit = (item: PhieuDeXuatVatTu) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    if (editingItem?.id === openedFormFromDetailId) {
      setOpenedFormFromDetailId(null);
    }
    setEditingItem(null);
  };

  const handleApprove = useCallback(
    (item: PhieuDeXuatVatTu, payload: PhieuDeXuatVatTuApprovePayload) => {
      const full = viewingPhieuFull ?? item;
      const mergedGhiChu = payload.ghiChu
        ? (full.ghi_chu ? full.ghi_chu + '\n' : '') + `[Ghi chú phê duyệt]: ${payload.ghiChu}`
        : undefined;
      const data = phieuToFormValues(full, payload.trangThai, mergedGhiChu);
      if (user?.id) data.id_nguoi_duyet = user.id;
      updateMutation.mutate({ id: full.id, data });
    },
    [updateMutation, viewingPhieuFull, user?.id]
  );

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuDeXuatVatTu.deleteTitle'),
      message: t('phieuDeXuatVatTu.deleteMessage'),
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
      title: t('phieuDeXuatVatTu.deleteTitle'),
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
      <PhieuDeXuatVatTuToolbar
        data={filteredList}
        khoList={khoList}
        employees={employees}
        currentUserId={user?.id ?? null}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setOpenedFormFromDetailId(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <PhieuDeXuatVatTuList
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
          isOverdue={isOverdue}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PhieuDeXuatVatTuForm
            khoList={khoList}
            employees={employees}
            initialData={editingPhieuFull ?? editingItem}
            onClose={handleCloseForm}
            canEdit
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <PhieuDeXuatVatTuDetail
            data={viewingPhieuFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => {
              setOpenedFormFromDetailId(item.id);
              setViewingItem(null);
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onApprove={handleApprove}
            canEdit
            canDelete
            showOverdueBadge={!!(config?.bat_canh_bao_qua_han && viewingItem?.trang_thai === TRANG_THAI_CHO_DUYET && (Math.floor((Date.now() - new Date((viewingPhieuFull ?? viewingItem).tg_tao).getTime()) / 86400000) > (config.thoi_han_duyet_ngay ?? 0)))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
