import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Edit, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import GenericTable from '../../../../components/shared/GenericTable';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useDanhMucDoiTacStore } from '../store/useDanhMucDoiTacStore';
import { useNhomDoiTacList, useCreateNhomDoiTac, useUpdateNhomDoiTac, useDeleteNhomDoiTac, useDeleteNhomDoiTacMany } from '../hooks/use-doi-tac';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { NhomDoiTac } from '../core/types';
import type { NhomDoiTacFormValues } from '../services/doi-tac-service';
import NhomFormDrawer from './NhomFormDrawer';
import NhomDetailDrawer from './NhomDetailDrawer';

const DanhMucTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useDanhMucDoiTacStore);
  const searchTerm = useDanhMucDoiTacStore((s) => s.searchTerm);
  const filters = useDanhMucDoiTacStore((s) => s.filters);
  const setFilter = useDanhMucDoiTacStore((s) => s.setFilter);
  const resetState = useDanhMucDoiTacStore((s) => s.resetState);
  const selectedIds = useDanhMucDoiTacStore((s) => s.selectedIds);
  const columns = useDanhMucDoiTacStore((s) => s.columns);
  const clearSelection = useDanhMucDoiTacStore((s) => s.clearSelection);
  const toggleSelection = useDanhMucDoiTacStore((s) => s.toggleSelection);
  const toggleAllSelection = useDanhMucDoiTacStore((s) => s.toggleAllSelection);
  const pagination = useDanhMucDoiTacStore((s) => s.pagination);
  const setPage = useDanhMucDoiTacStore((s) => s.setPage);
  const setPageSize = useDanhMucDoiTacStore((s) => s.setPageSize);

  const { data: nhomList = [], isLoading } = useNhomDoiTacList();
  const createNhom = useCreateNhomDoiTac();
  const updateNhom = useUpdateNhomDoiTac();
  const deleteNhom = useDeleteNhomDoiTac();
  const deleteManyMutation = useDeleteNhomDoiTacMany();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NhomDoiTac | null>(null);
  const [viewingItem, setViewingItem] = useState<NhomDoiTac | null>(null);

  const filterFn = useCallback(
    (item: NhomDoiTac, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma_nhom.toLowerCase().includes(searchLower) ||
        item.ten_nhom.toLowerCase().includes(searchLower);
      const statusKey = item.trang_thai === 'Đang hoạt động' ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(nhomList, searchTerm, filters, filterFn);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const statusOptions = useMemo(
    () => [
      {
        label: t('common.activeStatus'),
        value: 'Active',
        count: nhomList.filter((n) => n.trang_thai === 'Đang hoạt động').length,
      },
      {
        label: t('common.inactiveStatus'),
        value: 'Inactive',
        count: nhomList.filter((n) => n.trang_thai === 'Ngừng hoạt động').length,
      },
    ],
    [nhomList, t]
  );

  const activeFilterCount = (searchInput.trim() ? 1 : 0) + (filters.status.length > 0 ? 1 : 0);
  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('status', []);
  };

  const handleSaveNhom = (data: NhomDoiTacFormValues) => {
    if (editingItem) {
      updateNhom.mutate(
        { id: editingItem.id, data },
        { onSuccess: () => { setShowForm(false); setEditingItem(null); } }
      );
    } else {
      createNhom.mutate(data, { onSuccess: () => setShowForm(false) });
    }
  };

  const handleEdit = (item: NhomDoiTac) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleView = (item: NhomDoiTac) => {
    setViewingItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('doiTac.danhMuc.deleteNhom'),
      message: t('doiTac.danhMuc.deleteNhomConfirm'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteNhom.mutate(id),
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('doiTac.danhMuc.deleteNhom'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteManyMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleDeleteFromDetail = (id: string) => {
    confirm({
      title: t('doiTac.danhMuc.deleteNhom'),
      message: t('doiTac.danhMuc.deleteNhomConfirm'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteNhom.mutate(id, { onSuccess: () => setViewingItem(null) });
      },
    });
  };

  const nextThuTu = useMemo(() => {
    if (nhomList.length === 0) return 1;
    const max = Math.max(...nhomList.map((n) => n.thu_tu ?? 0));
    return max + 1;
  }, [nhomList]);

  const renderCell = useCallback(
    (colId: string, item: NhomDoiTac) => {
      switch (colId) {
        case 'thu_tu':
          return <span className="text-sm text-muted-foreground">{item.thu_tu ?? 0}</span>;
        case 'ma_nhom':
          return (
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.ma_nhom}
            </span>
          );
        case 'ten_nhom':
          return <span className="font-medium text-foreground">{item.ten_nhom}</span>;
        case 'loai':
          return (
            <span className="text-sm text-muted-foreground">
              {item.loai === 'nha_cung_cap' ? t('doiTac.tabs.nhaCungCap') : item.loai === 'khach_hang' ? t('doiTac.tabs.khachHang') : '—'}
            </span>
          );
        case 'trang_thai':
          return item.trang_thai === 'Đang hoạt động' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {t('common.activeStatus')}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
              {t('common.inactiveStatus')}
            </span>
          );
        case 'actions':
          return (
            <div className="flex items-center justify-center gap-0.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                title={t('common.edit')}
              >
                <Edit size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                title={t('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        default:
          return null;
      }
    },
    [t]
  );

  const renderMobileCard = useCallback(
    (item: NhomDoiTac, isSelected: boolean) => (
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleView(item)}
        onKeyDown={(e) => e.key === 'Enter' && handleView(item)}
        className={`rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98] ${
          isSelected ? 'border-primary ring-2 ring-primary/10 bg-card' : 'border-border bg-card'
        }`}
      >
        <div className="text-xs text-muted-foreground mb-2">
          {t('doiTac.danhMuc.form.loai')}: {item.loai === 'nha_cung_cap' ? t('doiTac.tabs.nhaCungCap') : item.loai === 'khach_hang' ? t('doiTac.tabs.khachHang') : '—'}
        </div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {item.ma_nhom}
          </span>
          {item.trang_thai === 'Đang hoạt động' ? (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {t('common.activeStatus')}
            </span>
          ) : (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {t('common.inactiveStatus')}
            </span>
          )}
        </div>
        <div className="font-medium text-foreground text-sm mb-2">{item.ten_nhom}</div>
        <div className="text-xs text-muted-foreground mb-2">{t('doiTac.danhMuc.form.thuTu')}: {item.thu_tu ?? 0}</div>
        <div className="flex justify-end gap-1.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg"
            aria-label={t('common.edit')}
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    ),
    [t, handleView]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
    ],
    [filters.status, setFilter, t, statusOptions]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0">
        <GenericToolbar
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder={t('doiTac.danhMuc.searchPlaceholder')}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
          filterGroups={filterGroups}
          filters={
            <FilterChipMultiSelect
              options={statusOptions}
              value={filters.status}
              onChange={(v) => setFilter('status', v)}
              placeholder={t('common.status')}
              icon={Tag}
              className="w-full sm:w-[140px]"
            />
          }
          actions={
            <Button
              size="sm"
              className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
              onClick={() => { setEditingItem(null); setViewingItem(null); setShowForm(true); }}
            >
              <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('doiTac.danhMuc.addNhom')}</span>
            </Button>
          }
          onDeleteMany={handleDeleteMany}
          columns={columns}
          onToggleColumn={(id) => useDanhMucDoiTacStore.getState().toggleColumn(id)}
          onReorderColumns={(from, to) => useDanhMucDoiTacStore.getState().reorderColumns(from, to)}
          onResetColumns={() => useDanhMucDoiTacStore.getState().resetColumns()}
          onAdd={() => { setEditingItem(null); setViewingItem(null); setShowForm(true); }}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <GenericTable<NhomDoiTac>
          data={filteredList}
          columns={columns}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAll={toggleAllSelection}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          renderCell={renderCell}
          renderMobileCard={renderMobileCard}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => handleView(item)}
          loadingText={t('doiTac.danhMuc.loadingNhom')}
          emptyTitle={t('doiTac.danhMuc.emptyNhom')}
          emptyDescription={t('doiTac.danhMuc.nhomDesc')}
        />
      </div>

      {showForm && (
        <NhomFormDrawer
          initialData={editingItem}
          defaultThuTu={editingItem == null ? nextThuTu : undefined}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSave={handleSaveNhom}
          isSaving={createNhom.isPending || updateNhom.isPending}
        />
      )}

      {viewingItem && !showForm && (
        <NhomDetailDrawer
          data={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={handleEdit}
          onDelete={handleDeleteFromDetail}
        />
      )}
    </div>
  );
};

export default DanhMucTab;
