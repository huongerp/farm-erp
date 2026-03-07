import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FileText, Pin } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import TaiLieuToolbar from './components/tai-lieu-toolbar';
import TaiLieuTable from './components/tai-lieu-table';
import TaiLieuForm from './components/tai-lieu-form';
import TaiLieuDetail from './components/tai-lieu-detail';
import { useTaiLieuList, useDeleteTaiLieuList, useTaiLieuGhimIds, useToggleTaiLieuGhim } from './hooks/use-tai-lieu';
import { useTaiLieuFilterCounts } from './hooks/use-tai-lieu-filter-counts';
import { useTaiLieuStore } from './store/useTaiLieuStore';
import { useLoaiTaiLieuList } from '../thiet-lap-tai-lieu/hooks/use-loai-tai-lieu';
import { useTrangThaiTaiLieuList } from '../thiet-lap-tai-lieu/hooks/use-trang-thai-tai-lieu';
import { PHONG_BAN_NAMES } from '../../../mocks/hanh-chinh';
import { HUONG_OPTIONS } from './core/constants';
import type { FilterGroup } from '../../../components/ui/MobileFilterSheet';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { getLanguage } from '../../../lib/utils';
import type { TaiLieu } from './core/types';

type TabId = 'tat_ca' | 'da_ghim';

const TaiLieuPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirmStore((s) => s.confirm);
  const tabParam = searchParams.get('tab');
  const initialTab: TabId = tabParam === 'da_ghim' ? 'da_ghim' : 'tat_ca';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
    setFilter,
    resetFilters,
  } = useTaiLieuStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TaiLieu | null>(null);
  const [detailItem, setDetailItem] = useState<TaiLieu | null>(null);
  const [formDefaultHuong, setFormDefaultHuong] = useState<'noi_bo' | 'den' | 'di'>('noi_bo');

  const { data: list = [], isLoading } = useTaiLieuList();
  const { data: ghimIds = [] } = useTaiLieuGhimIds();
  const { data: loaiList = [] } = useLoaiTaiLieuList();
  const { data: trangThaiList = [] } = useTrangThaiTaiLieuList();
  const toggleGhim = useToggleTaiLieuGhim();
  const deleteMutation = useDeleteTaiLieuList();

  const pinnedIds = useMemo(() => new Set(ghimIds), [ghimIds]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (tabParam === 'da_ghim') setActiveTab('da_ghim');
    else if (tabParam === 'tat_ca' || !tabParam) setActiveTab('tat_ca');
  }, [tabParam]);

  const setActiveTabAndUrl = useCallback(
    (id: TabId) => {
      setActiveTab(id);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (id === 'da_ghim') next.set('tab', 'da_ghim');
        else next.delete('tab');
        return next;
      });
    },
    [setSearchParams]
  );

  const filterFn = useCallback(
    (item: TaiLieu, term: string, f: typeof filters) => {
      if (activeTab === 'da_ghim' && !pinnedIds.has(item.id)) return false;
      if (f.huong && item.huong !== f.huong) return false;
      if (f.id_phong_ban && item.id_phong_ban !== f.id_phong_ban) return false;
      if (f.id_loai && (Array.isArray(f.id_loai) ? !f.id_loai.includes(item.id_loai) : item.id_loai !== f.id_loai))
        return false;
      if (f.id_trang_thai && item.id_trang_thai !== f.id_trang_thai) return false;
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        (item.ma_so && item.ma_so.toLowerCase().includes(searchLower)) ||
        (item.trich_yeu && item.trich_yeu.toLowerCase().includes(searchLower)) ||
        (item.so_den && item.so_den.toLowerCase().includes(searchLower)) ||
        (item.so_di && item.so_di.toLowerCase().includes(searchLower));
      return matchesSearch;
    },
    [activeTab, pinnedIds]
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const toolbarItems = useMemo(
    () => (activeTab === 'da_ghim' ? list.filter((x) => pinnedIds.has(x.id)) : list),
    [list, activeTab, pinnedIds]
  );
  const { huongCounts, phongBanCounts, loaiCounts, trangThaiCounts } = useTaiLieuFilterCounts(toolbarItems, filters);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: TaiLieu, b: TaiLieu) => {
      const aVal = a[sort.column as keyof TaiLieu] ?? '';
      const bVal = b[sort.column as keyof TaiLieu] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleClearAllFilters = useCallback(() => {
    resetFilters();
    setActiveTab('tat_ca');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('tab');
      return next;
    });
  }, [resetFilters, setSearchParams]);

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'huong',
        label: t('taiLieu.store.huongCol'),
        icon: FileText,
        options: HUONG_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value, count: huongCounts[o.value] ?? 0 })),
        value: filters.huong ? [filters.huong] : [],
        onChange: (v) => setFilter('huong', (v[0] as 'noi_bo' | 'den' | 'di') ?? ''),
      },
      {
        key: 'id_phong_ban',
        label: t('taiLieu.store.phongQuanLyCol'),
        icon: FileText,
        options: Object.entries(PHONG_BAN_NAMES).map(([value, label]) => ({ label, value, count: phongBanCounts[value] ?? 0 })),
        value: filters.id_phong_ban ? [filters.id_phong_ban] : [],
        onChange: (v) => setFilter('id_phong_ban', v[0] ?? ''),
      },
      {
        key: 'id_loai',
        label: t('taiLieu.store.loaiCol'),
        icon: FileText,
        options: loaiList.map((l) => ({ label: l.ten, value: l.id, count: loaiCounts[l.id] ?? 0 })),
        value: Array.isArray(filters.id_loai) ? filters.id_loai : filters.id_loai ? [filters.id_loai] : [],
        onChange: (v) => setFilter('id_loai', v),
      },
      {
        key: 'id_trang_thai',
        label: t('taiLieu.store.trangThaiCol'),
        icon: FileText,
        options: trangThaiList.map((tt) => ({ label: tt.ten, value: tt.id, count: trangThaiCounts[tt.id] ?? 0 })),
        value: filters.id_trang_thai ? [filters.id_trang_thai] : [],
        onChange: (v) => setFilter('id_trang_thai', v[0] ?? ''),
      },
    ],
    [
      filters.huong,
      filters.id_phong_ban,
      filters.id_loai,
      filters.id_trang_thai,
      loaiList,
      trangThaiList,
      huongCounts,
      phongBanCounts,
      loaiCounts,
      trangThaiCounts,
      setFilter,
      t,
    ]
  );

  const handleEdit = (item: TaiLieu) => {
    setEditingItem(item);
    setFormDefaultHuong(item.huong);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  const handleView = (item: TaiLieu) => {
    setDetailItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('taiLieu.deleteTitle'),
      message: t('taiLieu.deleteMessage'),
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
      title: t('taiLieu.bulkDeleteTitle'),
      message: t('taiLieu.bulkDeleteMessage', { count: ids.length }),
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

  const handleAdd = () => {
    setEditingItem(null);
    setFormDefaultHuong((filters.huong as 'noi_bo' | 'den' | 'di') || 'noi_bo');
    setShowForm(true);
  };

  const tabs = useMemo(
    () => [
      { id: 'tat_ca' as TabId, label: t('taiLieu.tabs.danhSach'), icon: FileText },
      { id: 'da_ghim' as TabId, label: t('taiLieu.tabs.ghim'), icon: Pin },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTabAndUrl(id as TabId)} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <TaiLieuToolbar
              items={toolbarItems}
              onAdd={handleAdd}
              onDeleteMany={handleDeleteMany}
              pinnedOnly={activeTab === 'da_ghim'}
              onPinnedOnlyChange={(v) => setActiveTabAndUrl(v ? 'da_ghim' : 'tat_ca')}
              pinnedCount={ghimIds.length}
              filterGroups={filterGroups}
              onClearAllFilters={handleClearAllFilters}
            />
            <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
              <TaiLieuTable
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
            <TaiLieuForm initialData={editingItem} defaultHuong={formDefaultHuong} onClose={handleCloseForm} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {detailItem && (
            <TaiLieuDetail
              data={detailItem}
              onClose={handleCloseDetail}
              onEdit={(item) => handleEdit(item)}
              onDelete={(id) => {
                setDetailItem(null);
                handleDelete(id);
              }}
              isPinned={pinnedIds.has(detailItem.id)}
              onTogglePin={() => toggleGhim.mutate(detailItem.id)}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default TaiLieuPage;
