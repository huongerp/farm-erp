import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { usePhieuKhoList, usePhieuKhoById, useDeletePhieuKho, useDeletePhieuKhoMany } from '../hooks/use-phieu-kho';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { usePhieuKhoStore } from '../store/usePhieuKhoStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import { LOAI_TAB_TO_DB } from '../core/types';
import type { PhieuKhoFilters } from '../store/usePhieuKhoStore';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import type { DoiTac } from '../../danh-sach-doi-tac/core/types';
import PhieuKhoToolbar from './PhieuKhoToolbar';
import PhieuKhoList from './PhieuKhoList';
import PhieuKhoForm from './PhieuKhoForm';
import PhieuKhoDetail from './PhieuKhoDetail';
import DanhSachKhoForm from '../../danh-sach-kho/components/danh-sach-kho-form';
import DanhSachHangHoaForm from '../../danh-sach-hang-hoa/components/DanhSachHangHoaForm';
import DoiTacForm from '../../danh-sach-doi-tac/components/DoiTacForm';
import { useNhomDoiTacList, useTagList, useDoiTacList } from '../../danh-sach-doi-tac/hooks/use-doi-tac';

interface Props {
  loai: LoaiPhieuKhoTab;
}

const PhieuKhoTabContent: React.FC<Props> = ({ loai: loaiTab }) => {
  const loaiDb = LOAI_TAB_TO_DB[loaiTab];
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
  } = usePhieuKhoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKho | null>(null);
  const [viewingItem, setViewingItem] = useState<PhieuKho | null>(null);
  const [showAddKho, setShowAddKho] = useState(false);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const [showAddDoiTac, setShowAddDoiTac] = useState<'nha_cung_cap' | 'khach_hang' | null>(null);
  const addKhoResolveRef = useRef<(k: Kho | null) => void>(null);
  const addHangHoaResolveRef = useRef<(h: HangHoa | null) => void>(null);
  const addDoiTacResolveRef = useRef<(d: DoiTac | null) => void>(null);

  const { data: allList = [], isLoading } = usePhieuKhoList();
  const { data: khoList = [] } = useKhoList();
  const { data: nhomList = [] } = useNhomDoiTacList();
  const { data: tagList = [] } = useTagList();
  const { data: doiTacListAll = [] } = useDoiTacList();
  const nextThuTuDoiTac = useMemo(() => {
    const list = showAddDoiTac ? doiTacListAll.filter((d) => d.loai_doi_tac === showAddDoiTac) : [];
    return list.length === 0 ? 1 : Math.max(...list.map((d) => d.thu_tu ?? 0)) + 1;
  }, [doiTacListAll, showAddDoiTac]);
  const { data: viewingPhieuFull } = usePhieuKhoById(viewingItem?.id);
  const { data: editingPhieuFull } = usePhieuKhoById(editingItem?.id);
  const deleteMutation = useDeletePhieuKho();
  const deleteManyMutation = useDeletePhieuKhoMany();

  const listByLoai = useMemo(
    () => allList.filter((p) => p.loai === loaiDb),
    [allList, loaiDb]
  );

  const filterFn = useCallback((item: PhieuKho, term: string, f: PhieuKhoFilters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.so_phieu.toLowerCase().includes(searchLower) ||
      (item.ten_kho?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_kho_den?.toLowerCase().includes(searchLower) ?? false) ||
      (item.mo_ta?.toLowerCase().includes(searchLower) ?? false);
    const statusKey = item.trang_thai === 'Chờ duyệt' ? 'Pending' : item.trang_thai === 'Đã duyệt' ? 'Approved' : 'Rejected';
    const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
    const matchesKho = (f.khoIds?.length ?? 0) === 0 || (f.khoIds ?? []).includes(item.kho_id);
    const matchesKhoDen =
      (f.khoDenIds?.length ?? 0) === 0 || (item.kho_den_id != null && (f.khoDenIds ?? []).includes(item.kho_den_id));
    return matchesSearch && matchesStatus && matchesKho && matchesKhoDen;
  }, []);

  const filteredList = useListWithFilter(listByLoai, searchTerm, filters, filterFn);

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
    const fresh = listByLoai.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [listByLoai, viewingItem?.id]);

  const handleEdit = (item: PhieuKho) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuKho.deleteTitle'),
      message: t('phieuKho.deleteMessage'),
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
      title: t('phieuKho.deleteTitle'),
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
      <PhieuKhoToolbar
        data={filteredList}
        loai={loaiTab}
        khoList={khoList}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <PhieuKhoList
          data={filteredList}
          loai={loaiTab}
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
          <PhieuKhoForm
            loai={loaiTab}
            khoList={khoList}
            initialData={editingPhieuFull ?? editingItem}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            onRequestAddKho={
              () =>
                new Promise<Kho | null>((resolve) => {
                  addKhoResolveRef.current = resolve;
                  setShowAddKho(true);
                })
            }
            onRequestAddHangHoa={
              () =>
                new Promise<HangHoa | null>((resolve) => {
                  addHangHoaResolveRef.current = resolve;
                  setShowAddHangHoa(true);
                })
            }
            onRequestAddNcc={
              loaiTab === 'nhap'
                ? () =>
                    new Promise<DoiTac | null>((resolve) => {
                      addDoiTacResolveRef.current = resolve;
                      setShowAddDoiTac('nha_cung_cap');
                    })
                : undefined
            }
            onRequestAddKh={
              loaiTab === 'xuat'
                ? () =>
                    new Promise<DoiTac | null>((resolve) => {
                      addDoiTacResolveRef.current = resolve;
                      setShowAddDoiTac('khach_hang');
                    })
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddKho && (
          <DanhSachKhoForm
            initialData={null}
            onClose={() => {
              setShowAddKho(false);
              addKhoResolveRef.current?.(null);
              addKhoResolveRef.current = null;
            }}
            onSuccessCreate={(kho) => {
              addKhoResolveRef.current?.(kho);
              setShowAddKho(false);
              addKhoResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddHangHoa && (
          <DanhSachHangHoaForm
            initialData={null}
            onClose={() => {
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current?.(null);
              addHangHoaResolveRef.current = null;
            }}
            onSuccessCreate={(item) => {
              addHangHoaResolveRef.current?.(item);
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddDoiTac && (
          <DoiTacForm
            initialData={null}
            loaiDoiTac={showAddDoiTac}
            nhomList={nhomList}
            tagList={tagList}
            defaultThuTu={nextThuTuDoiTac}
            onClose={() => {
              setShowAddDoiTac(null);
              addDoiTacResolveRef.current?.(null);
              addDoiTacResolveRef.current = null;
            }}
            onSuccessCreate={(item) => {
              addDoiTacResolveRef.current?.(item);
              setShowAddDoiTac(null);
              addDoiTacResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <PhieuKhoDetail
            data={viewingPhieuFull ?? viewingItem}
            loai={loaiTab}
            onClose={() => setViewingItem(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhieuKhoTabContent;
