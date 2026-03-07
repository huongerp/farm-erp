import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TabGroup from '../../../components/ui/TabGroup';
import PhanTichDoiThuToolbar from './components/PhanTichDoiThuToolbar';
import PhanTichDoiThuList from './components/PhanTichDoiThuList';
import PhanTichDoiThuForm from './components/PhanTichDoiThuForm';
import PhanTichDoiThuDetailDrawer from './components/PhanTichDoiThuDetailDrawer';
import TabSoSanh from './components/TabSoSanh';
import TabTaiLieuTongHop from './components/TabTaiLieuTongHop';
import TabNhatKyTongHop from './components/TabNhatKyTongHop';
import { useDoiThuList, useDeleteDoiThu } from './hooks/use-phan-tich-doi-thu';
import { usePhanTichDoiThuStore } from './store/usePhanTichDoiThuStore';
import { useListWithFilter } from '../../../lib/hooks';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../lib/button-labels';
import type { DoiThu } from './core/types';

const PAGE_TABS = [
  { id: 'danh-sach', labelKey: 'phanTichDoiThu.pageTab.danhSach' },
  { id: 'so-sanh', labelKey: 'phanTichDoiThu.pageTab.soSanh' },
  { id: 'tai-lieu', labelKey: 'phanTichDoiThu.pageTab.taiLieu' },
  { id: 'nhat-ky', labelKey: 'phanTichDoiThu.pageTab.nhatKy' },
] as const;
type PageTabId = (typeof PAGE_TABS)[number]['id'];

const PhanTichDoiThuPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const [activeTab, setActiveTab] = useState<PageTabId>('danh-sach');
  const {
    searchTerm,
    filters,
    resetState,
    columns,
    pagination,
    setPage,
    setPageSize,
  } = usePhanTichDoiThuStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DoiThu | null>(null);
  const [viewingItem, setViewingItem] = useState<DoiThu | null>(null);

  const { data: list = [], isLoading } = useDoiThuList();
  const deleteMutation = useDeleteDoiThu();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = list.find((d) => d.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [list, viewingItem?.id]);

  const filterFn = useCallback(
    (item: DoiThu, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term || item.ten_doi_thu.toLowerCase().includes(searchLower);
      const matchesLoai =
        f.phan_loai.length === 0 || f.phan_loai.includes(item.phan_loai);
      return matchesSearch && matchesLoai;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleEdit = (item: DoiThu) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleView = (item: DoiThu) => {
    setViewingItem(item);
  };

  const handleCloseDetail = () => {
    setViewingItem(null);
  };

  const handleEditFromDetail = (item: DoiThu) => {
    setViewingItem(null);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteFromDetail = (id: string) => {
    confirm({
      title: t('phanTichDoiThu.deleteTitle'),
      message: t('phanTichDoiThu.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteMutation.mutate(id);
        setViewingItem(null);
      },
    });
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('phanTichDoiThu.deleteTitle'),
      message: t('phanTichDoiThu.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const tabItems = PAGE_TABS.map((tab) => ({
    id: tab.id,
    label: t(tab.labelKey),
  }));

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        {/* Row 1: Chỉ TabGroup */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
          <TabGroup
            tabs={tabItems}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as PageTabId)}
          />
        </div>

        {/* Row 2: Toolbar chỉ cho tab Danh sách; các tab khác có toolbar trong nội dung */}
        {activeTab === 'danh-sach' && (
          <PhanTichDoiThuToolbar data={list} onAdd={handleAdd} showBack={true} />
        )}

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1 overflow-auto">
          {activeTab === 'danh-sach' && (
            <PhanTichDoiThuList
              data={filteredList}
              columns={columns}
              isLoading={isLoading}
              page={pagination.page}
              pageSize={pagination.pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          {activeTab === 'so-sanh' && <TabSoSanh />}
          {activeTab === 'tai-lieu' && (
            <TabTaiLieuTongHop onViewDoiThu={handleView} />
          )}
          {activeTab === 'nhat-ky' && (
            <TabNhatKyTongHop onViewDoiThu={handleView} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <PhanTichDoiThuForm
            initialData={editingItem}
            onClose={handleCloseForm}
          />
        )}
        {viewingItem && (
          <PhanTichDoiThuDetailDrawer
            data={viewingItem}
            onClose={handleCloseDetail}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhanTichDoiThuPage;
