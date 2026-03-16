import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Truck, UserCircle, FolderOpen, Tag } from 'lucide-react';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import TabGroup from '../../../components/ui/TabGroup';
import DoiTacToolbar from './components/DoiTacToolbar';
import DoiTacList from './components/DoiTacList';
import DoiTacForm from './components/DoiTacForm';
import DoiTacDetail from './components/DoiTacDetail';
import DanhMucTab from './components/DanhMucTab';
import TagTab from './components/TagTab';
import NhomFormDrawer from './components/NhomFormDrawer';
import { useDoiTacList, useNhomDoiTacList, useTagList, useDeleteDoiTac, useDeleteDoiTacMany, useCreateNhomDoiTac } from './hooks/use-doi-tac';
import type { NhomDoiTac } from './core/types';
import type { NhomDoiTacFormValues } from './services/doi-tac-service';
import { useDoiTacStore } from './store/useDoiTacStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPhieuKhoByDoiTac } from '../phieu-kho/services/phieu-kho-service';
import { useDeletePhieuKho } from '../phieu-kho/hooks/use-phieu-kho';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import type { DoiTac } from './core/types';
import type { PhieuKho } from '../phieu-kho/core/types';

const VALID_TABS = ['nha_cung_cap', 'khach_hang', 'danh_muc', 'tag'] as const;
type TabId = (typeof VALID_TABS)[number];

const DanhSachDoiTacPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (tabFromUrl === 'nha_cung_cap' || tabFromUrl === 'khach_hang' || tabFromUrl === 'danh_muc' || tabFromUrl === 'tag') return tabFromUrl;
    return 'nha_cung_cap';
  });

  useEffect(() => {
    if (tabFromUrl === 'nha_cung_cap' || tabFromUrl === 'khach_hang' || tabFromUrl === 'danh_muc' || tabFromUrl === 'tag') setActiveTab(tabFromUrl);
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
  const [showAddNhomFromDoiTac, setShowAddNhomFromDoiTac] = useState(false);
  const addNhomResolveRef = useRef<(nhom: NhomDoiTac) => void | null>(null);
  const queryClient = useQueryClient();
  const createNhomFromDoiTac = useCreateNhomDoiTac();
  const deletePhieuMutation = useDeletePhieuKho();

  const { data: listAll = [], isLoading } = useDoiTacList();
  const filteredByTab = useMemo(
    () => listAll.filter((d) => d.loai_doi_tac === activeTab),
    [listAll, activeTab]
  );
  const { data: nhomList = [] } = useNhomDoiTacList();
  const { data: tagList = [] } = useTagList();
  const nextThuTuForAddNhom = useMemo(() => {
    const nhomCungLoai = nhomList.filter((n) => n.loai === activeTab);
    return nhomCungLoai.length === 0 ? 1 : Math.max(...nhomCungLoai.map((n) => n.thu_tu ?? 0)) + 1;
  }, [nhomList, activeTab]);
  /** Thứ tự tự tăng khi tạo mới đối tác (theo danh sách cùng tab). */
  const nextThuTuForDoiTac = useMemo(() => {
    if (activeTab !== 'nha_cung_cap' && activeTab !== 'khach_hang') return 1;
    return filteredByTab.length === 0 ? 1 : Math.max(...filteredByTab.map((d) => d.thu_tu ?? 0)) + 1;
  }, [activeTab, filteredByTab]);
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
    if (id === 'nha_cung_cap' || id === 'khach_hang' || id === 'danh_muc' || id === 'tag') {
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
      { id: 'danh_muc', label: t('doiTac.tabs.danhMuc'), icon: FolderOpen },
      { id: 'tag', label: t('doiTac.tabs.tag'), icon: Tag },
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

  const isDanhMucTab = activeTab === 'danh_muc';
  const isTagTab = activeTab === 'tag';

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      {isDanhMucTab ? (
        <div className="flex-1 min-h-0 overflow-hidden mt-1.5">
          <DanhMucTab />
        </div>
      ) : isTagTab ? (
        <div className="flex-1 min-h-0 overflow-hidden mt-1.5">
          <TagTab />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
          <DoiTacToolbar
            data={filteredByTab}
            nhomList={nhomList}
            selectedCount={selectedIds.size}
            onAdd={handleAdd}
            onDeleteMany={handleDeleteMany}
            canCreate={canCreate}
            canDelete={canDelete}
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
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onView={handleView}
          />
        </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <DoiTacForm
            initialData={editingItem}
            loaiDoiTac={activeTab}
            nhomList={nhomList}
            tagList={tagList}
            defaultThuTu={nextThuTuForDoiTac}
            onClose={handleCloseForm}
            onRequestAddNhom={
              activeTab === 'nha_cung_cap' || activeTab === 'khach_hang'
                ? () =>
                    new Promise<NhomDoiTac | null>((resolve) => {
                      addNhomResolveRef.current = resolve;
                      setShowAddNhomFromDoiTac(true);
                    })
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddNhomFromDoiTac && (activeTab === 'nha_cung_cap' || activeTab === 'khach_hang') && (
          <NhomFormDrawer
            initialData={null}
            defaultThuTu={nextThuTuForAddNhom}
            defaultLoai={activeTab}
            onClose={() => {
              setShowAddNhomFromDoiTac(false);
              addNhomResolveRef.current?.(null);
              addNhomResolveRef.current = null;
            }}
            onSave={(data: NhomDoiTacFormValues) => {
              createNhomFromDoiTac.mutate(data, {
                onSuccess: (nhom) => {
                  addNhomResolveRef.current?.(nhom);
                  setShowAddNhomFromDoiTac(false);
                  addNhomResolveRef.current = null;
                },
              });
            }}
            isSaving={createNhomFromDoiTac.isPending}
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
            onEdit={canUpdate ? (item) => {
              setViewingItem(null);
              handleEdit(item);
            } : undefined}
            onDelete={canDelete ? (id) => {
              setViewingItem(null);
              handleDelete(id);
            } : undefined}
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
