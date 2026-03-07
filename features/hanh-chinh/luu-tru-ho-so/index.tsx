import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { FolderOpen, Pin } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import HoSoToolbar from './components/ho-so-toolbar';
import HoSoTable from './components/ho-so-table';
import HoSoForm from './components/ho-so-form';
import HoSoDetail from './components/ho-so-detail';
import TaiLieuDetail from '../tai-lieu/components/tai-lieu-detail';
import { useHoSoList, useDeleteHoSoList, useHoSoGhimIds, useToggleHoSoGhim } from './hooks/use-ho-so';
import { useTaiLieuList, useTaiLieuById, useTaiLieuGhimIds, useToggleTaiLieuGhim } from '../tai-lieu/hooks/use-tai-lieu';
import { useHoSoStore } from './store/useHoSoStore';
import { PHONG_BAN_NAMES } from '../../../mocks/hanh-chinh';
import type { FilterGroup } from '../../../components/ui/MobileFilterSheet';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { getLanguage } from '../../../lib/utils';
import type { HoSo } from './core/types';

type TabId = 'tat_ca' | 'da_ghim';

const LuuTruHoSoPage: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const [activeTab, setActiveTab] = useState<TabId>('tat_ca');
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
    setFilter,
    resetFilters,
  } = useHoSoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HoSo | null>(null);
  const [detailItem, setDetailItem] = useState<HoSo | null>(null);
  const [detailTaiLieuId, setDetailTaiLieuId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useHoSoList();
  const { data: taiLieuList = [] } = useTaiLieuList();
  const { data: taiLieuDetailData } = useTaiLieuById(detailTaiLieuId);
  const { data: ghimIds = [] } = useHoSoGhimIds();
  const { data: taiLieuGhimIds = [] } = useTaiLieuGhimIds();
  const toggleGhim = useToggleHoSoGhim();
  const toggleTaiLieuGhim = useToggleTaiLieuGhim();
  const pinnedIds = useMemo(() => new Set(ghimIds), [ghimIds]);
  const taiLieuPinnedIds = useMemo(() => new Set(taiLieuGhimIds), [taiLieuGhimIds]);
  const deleteMutation = useDeleteHoSoList();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterChips = useMemo(() => {
    const chips: { key: string; label: string; valueLabel: string }[] = [];
    if (filters.id_tai_lieu) {
      const name = taiLieuList.find((tl) => tl.id === filters.id_tai_lieu)?.trich_yeu;
      if (name) chips.push({ key: 'id_tai_lieu', label: t('hoSo.store.taiLieuCol'), valueLabel: name });
    }
    if (filters.id_phong_ban) {
      const name = PHONG_BAN_NAMES[filters.id_phong_ban];
      if (name) chips.push({ key: 'id_phong_ban', label: t('hoSo.store.phongQuanLyCol'), valueLabel: name });
    }
    if ((filters.status ?? []).length > 0) {
      const labels = (filters.status ?? []).map((s) => (s === 'Active' ? t('common.activeStatus') : t('common.inactiveStatus')));
      chips.push({ key: 'status', label: t('hoSo.store.statusCol'), valueLabel: labels.join(', ') });
    }
    return chips;
  }, [filters.id_tai_lieu, filters.id_phong_ban, filters.status, taiLieuList, t]);

  const activeFilterCount = filterChips.length;

  const handleClearAllFilters = useCallback(() => resetFilters(), [resetFilters]);
  const handleRemoveFilter = useCallback(
    (key: string) => {
      if (key === 'status') setFilter('status', []);
      else setFilter(key as 'id_phong_ban' | 'id_tai_lieu', '');
    },
    [setFilter]
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'id_tai_lieu',
        label: t('hoSo.store.taiLieuCol'),
        icon: FolderOpen,
        options: taiLieuList.map((tl) => ({ label: tl.trich_yeu || tl.id, value: tl.id })),
        value: filters.id_tai_lieu ? [filters.id_tai_lieu] : [],
        onChange: (v) => setFilter('id_tai_lieu', v[0] ?? ''),
      },
      {
        key: 'id_phong_ban',
        label: t('hoSo.store.phongQuanLyCol'),
        icon: FolderOpen,
        options: Object.entries(PHONG_BAN_NAMES).map(([value, label]) => ({ label, value })),
        value: filters.id_phong_ban ? [filters.id_phong_ban] : [],
        onChange: (v) => setFilter('id_phong_ban', v[0] ?? ''),
      },
      {
        key: 'status',
        label: t('hoSo.store.statusCol'),
        icon: FolderOpen,
        options: [
          { label: t('common.activeStatus'), value: 'Active' },
          { label: t('common.inactiveStatus'), value: 'Inactive' },
        ],
        value: filters.status ?? [],
        onChange: (v) => setFilter('status', v),
      },
    ],
    [taiLieuList, filters.id_tai_lieu, filters.id_phong_ban, filters.status, setFilter, t]
  );

  const filterFn = useCallback(
    (item: HoSo, term: string, f: typeof filters) => {
      if (activeTab === 'da_ghim' && !pinnedIds.has(item.id)) return false;
      if (f.id_tai_lieu && item.id_tai_lieu !== f.id_tai_lieu) return false;
      if (f.id_phong_ban && item.id_phong_ban !== f.id_phong_ban) return false;
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma_ho_so.toLowerCase().includes(searchLower) ||
        item.ten_ho_so.toLowerCase().includes(searchLower) ||
        (item.mo_ta && item.mo_ta.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const statusArr = f.status ?? [];
      const matchesStatus = statusArr.length === 0 || statusArr.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    [activeTab, pinnedIds]
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: HoSo, b: HoSo) => {
      const aVal = a[sort.column as keyof HoSo] ?? '';
      const bVal = b[sort.column as keyof HoSo] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: HoSo) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  const handleView = (item: HoSo) => {
    setDetailItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('hoSo.deleteTitle'),
      message: t('hoSo.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('hoSo.bulkDeleteTitle'),
      message: t('hoSo.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () =>
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
          },
        }),
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleCloseDetail = () => {
    setDetailItem(null);
  };

  const tabs = useMemo(
    () => [
      { id: 'tat_ca' as TabId, label: t('hoSo.tabs.tatCa'), icon: FolderOpen },
      { id: 'da_ghim' as TabId, label: t('hoSo.tabs.daGhim'), icon: Pin },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <HoSoToolbar
            onAdd={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            onDeleteMany={handleDeleteMany}
            filterChips={filterChips}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={handleClearAllFilters}
            activeFilterCount={activeFilterCount}
            filterGroups={filterGroups}
          />
            <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
              <HoSoTable
                data={sortedList}
                isLoading={isLoading}
                pinnedIds={pinnedIds}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onTogglePin={(id) => toggleGhim.mutate(id)}
              />
            </div>
          </div>
        </div>
        <AnimatePresence>
          {showForm && (
            <HoSoForm initialData={editingItem} onClose={handleCloseForm} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {detailItem && (
            <HoSoDetail
              data={detailItem}
              onClose={handleCloseDetail}
              onEdit={(item) => handleEdit(item)}
              onDelete={(id) => {
                setDetailItem(null);
                handleDelete(id);
              }}
              isPinned={pinnedIds.has(detailItem.id)}
              onTogglePin={() => toggleGhim.mutate(detailItem.id)}
              onOpenTaiLieuDetail={(idTaiLieu) => setDetailTaiLieuId(idTaiLieu)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {detailTaiLieuId && taiLieuDetailData && (
            <TaiLieuDetail
              data={taiLieuDetailData}
              onClose={() => setDetailTaiLieuId(null)}
              onEdit={() => setDetailTaiLieuId(null)}
              isPinned={taiLieuPinnedIds.has(taiLieuDetailData.id)}
              onTogglePin={() => toggleTaiLieuGhim.mutate(taiLieuDetailData.id)}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default LuuTruHoSoPage;
