import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Truck, UserCircle } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DoiTacToolbar from './components/DoiTacToolbar';
import DoiTacList from './components/DoiTacList';
import DoiTacForm from './components/DoiTacForm';
import DoiTacDetail from './components/DoiTacDetail';
import { useDoiTacList, useNhomDoiTacList, useTagList, useDeleteDoiTac, useDeleteDoiTacMany } from './hooks/use-doi-tac';
import { useDoiTacStore } from './store/useDoiTacStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPhieuKhoByDoiTac } from '../phieu-kho/services/phieu-kho-service';
import { useDeletePhieuKho } from '../phieu-kho/hooks/use-phieu-kho';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import type { DoiTac } from './core/types';
import type { PhieuKho } from '../phieu-kho/core/types';

const VALID_TABS = ['nha_cung_cap', 'khach_hang'] as const;
type TabId = (typeof VALID_TABS)[number];

const DanhSachDoiTacPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (tabFromUrl === 'nha_cung_cap' || tabFromUrl === 'khach_hang') return tabFromUrl;
    return 'nha_cung_cap';
  });

  useEffect(() => {
    if (tabFromUrl === 'nha_cung_cap' || tabFromUrl === 'khach_hang') setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

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
  } = useDoiTacStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DoiTac | null>(null);
  const [viewingItem, setViewingItem] = useState<DoiTac | null>(null);
  const queryClient = useQueryClient();
  const deletePhieuMutation = useDeletePhieuKho();

  const { data: listAll = [], isLoading } = useDoiTacList();
  const filteredByTab = useMemo(
    () => listAll.filter((d) => d.loai_doi_tac === activeTab),
    [listAll, activeTab]
  );
  const { data: nhomList = [] } = useNhomDoiTacList();
  const { data: tagList = [] } = useTagList();
  const deleteMutation = useDeleteDoiTac();
  const deleteManyMutation = useDeleteDoiTacMany();

  const { data: phieuKhoList = [], isLoading: phieuKhoLoading } = useQuery({
    queryKey: ['phieuKhoByDoiTac', viewingItem?.id, viewingItem?.loai_doi_tac],
    queryFn: () => getPhieuKhoByDoiTac(viewingItem!.id, viewingItem!.loai_doi_tac),
    enabled: !!viewingItem?.id && !!viewingItem?.loai_doi_tac,
  });

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = listAll.find((n) => n.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [listAll, viewingItem?.id]);

  const handleTabChange = (id: string) => {
    if (id === 'nha_cung_cap' || id === 'khach_hang') {
      setActiveTab(id);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', id);
        return next;
      });
    }
  };

  const tabs = useMemo(
    () => [
      { id: 'nha_cung_cap', label: t('doiTac.tabs.nhaCungCap'), icon: Truck },
      { id: 'khach_hang', label: t('doiTac.tabs.khachHang'), icon: UserCircle },
    ],
    [t]
  );

  const filterFn = useCallback(
    (item: DoiTac, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_ncc.toLowerCase().includes(searchLower) ||
        item.ma_ncc.toLowerCase().includes(searchLower) ||
        (item.ten_nhom?.toLowerCase().includes(searchLower) ?? false);
      const statusKey = item.trang_thai === 'Đang hoạt động' ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesNhom = f.id_nhom.length === 0 || (item.id_nhom != null && f.id_nhom.includes(item.id_nhom));
      return matchesSearch && matchesStatus && matchesNhom;
    },
    []
  );

  const filteredList = useListWithFilter(filteredByTab, searchTerm, filters, filterFn);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleEdit = (item: DoiTac) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleView = (item: DoiTac) => {
    setViewingItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('doiTac.deleteTitle'),
      message: t('doiTac.deleteMessage'),
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
      title: t('doiTac.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteManyMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleAddPhieu = () => {
    if (!viewingItem) return;
    setViewingItem(null);
    const tab = viewingItem.loai_doi_tac === 'nha_cung_cap' ? 'nhap' : 'xuat';
    window.location.href = `/mua-hang/phieu-kho?tab=${tab}&id_doi_tac=${viewingItem.id}`;
  };

  const handleViewPhieu = (pk: PhieuKho) => {
    window.open(`/mua-hang/phieu-kho/preview/${pk.id}`, '_blank', 'noopener,noreferrer');
  };

  const handleEditPhieu = (pk: PhieuKho) => {
    setViewingItem(null);
    const tab = pk.loai === 'nhap' ? 'nhap' : pk.loai === 'xuat' ? 'xuat' : 'chuyen';
    window.location.href = `/mua-hang/phieu-kho?tab=${tab}&edit=${pk.id}`;
  };

  const handleDeletePhieu = (id: string) => {
    confirm({
      title: t('phieuKho.deleteTitle'),
      message: t('phieuKho.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deletePhieuMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem)
              queryClient.invalidateQueries({ queryKey: ['phieuKhoByDoiTac', viewingItem.id, viewingItem.loai_doi_tac] });
          },
        });
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <DoiTacToolbar
          data={filteredByTab}
          nhomList={nhomList}
          selectedCount={selectedIds.size}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
        />

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
          <DoiTacList
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
            onView={handleView}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DoiTacForm
            initialData={editingItem}
            loaiDoiTac={activeTab}
            nhomList={nhomList}
            tagList={tagList}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DoiTacDetail
            data={viewingItem}
            phieuKhoList={phieuKhoList}
            phieuKhoLoading={phieuKhoLoading}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => {
              setViewingItem(null);
              handleEdit(item);
            }}
            onDelete={(id) => {
              setViewingItem(null);
              handleDelete(id);
            }}
            onViewPhieu={handleViewPhieu}
            onEditPhieu={handleEditPhieu}
            onDeletePhieu={handleDeletePhieu}
            onAddPhieu={handleAddPhieu}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachDoiTacPage;
