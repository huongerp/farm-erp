import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useFarmHangHoaRefQuery } from '../../hang-hoa-phan-thuoc/hooks/use-farm-hang-hoa';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { GiamSatChatLuong } from '../core/types';
import { coTheSuaPhieu, coTheXoaPhieu } from '../core/trang-thai';
import type { GiamSatChatLuongListServerQuery } from '../services/giam-sat-chat-luong-list-query';
import {
  useDeleteGiamSatChatLuong,
  useDeleteGiamSatChatLuongMany,
  useGiamSatChatLuongById,
  useGiamSatChatLuongPage,
  useGiamSatChatLuongTomTat,
} from '../hooks/use-giam-sat-chat-luong';
import { useGiamSatChatLuongCapCao, useGiamSatChatLuongViewScope } from '../hooks/use-giam-sat-chat-luong-view-scope';
import { useGiamSatChatLuongStore } from '../store/useGiamSatChatLuongStore';
import GiamSatChatLuongToolbar from './GiamSatChatLuongToolbar';
import GiamSatChatLuongList from './GiamSatChatLuongList';
import GiamSatChatLuongForm from './GiamSatChatLuongForm';
import GiamSatChatLuongDetail from './GiamSatChatLuongDetail';
import QuetTemFlow from './QuetTemFlow';
import CaiDatDialog from './cai-dat/CaiDatDialog';

/** Cột hiển thị → cột sắp xếp ở DB (cột ghép / tính toán không sort ở server). */
const SORT_COLUMN_MAP: Record<string, string> = {};

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const capCao = useGiamSatChatLuongCapCao();
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
  } = useGiamSatChatLuongStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GiamSatChatLuong | null>(null);
  const [viewing, setViewing] = useState<{ id: string; moInTem?: boolean } | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const viewScope = useGiamSatChatLuongViewScope();

  const listServerQuery: GiamSatChatLuongListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: filters.nam ?? [],
      thang: filters.thang ?? [],
      trangThai: filters.trang_thai ?? [],
      ketLuan: filters.ket_luan ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      idHangHoa: filters.id_hang_hoa ?? [],
      sortColumn: sort.column ? (SORT_COLUMN_MAP[sort.column] ?? sort.column) : null,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const pageQuery = useGiamSatChatLuongPage(listServerQuery, !viewScope.isLoading);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const { data: tomTatList = [] } = useGiamSatChatLuongTomTat(
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading
  );
  const { data: branches = [] } = useBranches();
  const { data: hangHoaList = [] } = useFarmHangHoaRefQuery();
  const tenHangHoa = useMemo(() => new Map(hangHoaList.map((h) => [h.id, h.ten_hang])), [hangHoaList]);
  const { data: viewingFull } = useGiamSatChatLuongById(viewing?.id);
  const viewingItem = viewingFull ?? pageList.find((p) => p.id === viewing?.id) ?? null;

  const deleteMutation = useDeleteGiamSatChatLuong();
  const deleteManyMutation = useDeleteGiamSatChatLuongMany();

  /** Farm của phiếu gần nhất tôi tạo — mặc định cho phiếu mới. */
  const preferredBranchId = useMemo(() => {
    const toi = user?.id != null ? String(user.id) : null;
    return tomTatList.find((r) => r.id_nguoi_tao === toi)?.id_chi_nhanh ?? null;
  }, [tomTatList, user?.id]);

  useEffect(() => () => resetState(), [resetState]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const openEdit = (item: GiamSatChatLuong) => {
    setEditingItem(item);
    setViewing(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('giamSatChatLuong.deleteTitle'),
      message: t('giamSatChatLuong.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id);
        if (viewing?.id === id) setViewing(null);
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    const khongXoa = pageList.filter((p) => ids.includes(p.id) && !coTheXoaPhieu(p.trang_thai, p.so_thung_da_kiem, capCao));
    if (khongXoa.length > 0) {
      toast.info(t('giamSatChatLuong.khongXoaDuoc'));
      return;
    }
    confirm({
      title: t('giamSatChatLuong.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewing && ids.includes(viewing.id)) setViewing(null);
      },
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <GiamSatChatLuongToolbar
        data={tomTatList}
        branches={branches}
        tenHangHoa={tenHangHoa}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onScan={() => setShowScan(true)}
        onSettings={() => setShowSettings(true)}
        canCreate={canCreate}
        canDelete={canDelete}
        canScan={canUpdate}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <GiamSatChatLuongList
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
          onView={(item) => setViewing({ id: item.id })}
          onEdit={
            canUpdate
              ? (item) => (coTheSuaPhieu(item.trang_thai, capCao) ? openEdit(item) : toast.info(t('giamSatChatLuong.khongSuaDuoc')))
              : undefined
          }
          onDelete={
            canDelete
              ? (id) => {
                  const item = pageList.find((p) => p.id === id);
                  if (item && !coTheXoaPhieu(item.trang_thai, item.so_thung_da_kiem, capCao)) toast.info(t('giamSatChatLuong.khongXoaDuoc'));
                  else handleDelete(id);
                }
              : undefined
          }
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <GiamSatChatLuongForm
            branches={branches}
            initialData={editingItem}
            preferredBranchId={editingItem ? null : preferredBranchId}
            allowedBranchIds={viewScope.viewAll ? null : viewScope.allowedBranchIds}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            onCreated={(item) => setViewing({ id: item.id, moInTem: true })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <GiamSatChatLuongDetail
            key={viewingItem.id}
            data={viewingItem}
            viewAll={viewScope.viewAll}
            allowedBranchIds={viewScope.allowedBranchIds}
            moInTem={viewing?.moInTem}
            onClose={() => setViewing(null)}
            onEdit={canUpdate ? openEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onOpenSettings={() => setShowSettings(true)}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScan && (
          <QuetTemFlow
            viewAll={viewScope.viewAll}
            allowedBranchIds={viewScope.allowedBranchIds}
            capCao={capCao}
            onClose={() => setShowScan(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && <CaiDatDialog canEditTieuChi={capCao} onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
