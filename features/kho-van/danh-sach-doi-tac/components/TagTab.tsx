import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import GenericTable from '../../../../components/shared/GenericTable';
import { useTagDoiTacStore } from '../store/useTagDoiTacStore';
import { useTagList, useCreateTag, useUpdateTag, useDeleteTag, useDeleteTagMany } from '../hooks/use-doi-tac';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { Tag as TagType } from '../core/types';
import TagFormDrawer from './TagFormDrawer';
import TagDetailDrawer from './TagDetailDrawer';

const TagTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    setSearchTerm,
    resetState,
    selectedIds,
    columns,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useTagDoiTacStore();

  const { data: tagList = [], isLoading } = useTagList();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const deleteManyMutation = useDeleteTagMany();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TagType | null>(null);
  const [viewingItem, setViewingItem] = useState<TagType | null>(null);

  const filterFn = useCallback((item: TagType, term: string, _f: Record<string, never>) => {
    if (!term) return true;
    const searchLower = term.toLowerCase();
    return item.ten_tag.toLowerCase().includes(searchLower);
  }, []);

  const filteredList = useListWithFilter(tagList, searchTerm, {}, filterFn);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleSaveTag = (ten_tag: string) => {
    const onDone = () => { setShowForm(false); setEditingItem(null); };
    if (editingItem) {
      updateTag.mutate({ id: editingItem.id, ten_tag }, { onSuccess: onDone });
    } else {
      createTag.mutate(ten_tag, { onSuccess: onDone });
    }
  };

  const handleEdit = (item: TagType) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleView = (item: TagType) => {
    setViewingItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('doiTac.danhMuc.deleteTag'),
      message: t('doiTac.danhMuc.deleteTagConfirm'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteTag.mutate(id),
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('doiTac.danhMuc.deleteTag'),
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
      title: t('doiTac.danhMuc.deleteTag'),
      message: t('doiTac.danhMuc.deleteTagConfirm'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteTag.mutate(id, { onSuccess: () => setViewingItem(null) });
      },
    });
  };

  const renderCell = useCallback(
    (colId: string, item: TagType) => {
      switch (colId) {
        case 'ten_tag':
          return <span className="font-medium text-foreground">{item.ten_tag}</span>;
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
    (item: TagType, isSelected: boolean) => (
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleView(item)}
        onKeyDown={(e) => e.key === 'Enter' && handleView(item)}
        className={`rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98] ${
          isSelected ? 'border-primary ring-2 ring-primary/10 bg-card' : 'border-border bg-card'
        }`}
      >
        <div className="font-medium text-foreground text-sm">{item.ten_tag}</div>
        <div className="flex justify-end gap-1.5 pt-2 mt-2 border-t border-border">
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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0">
        <GenericToolbar
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('doiTac.danhMuc.tagSearchPlaceholder')}
          actions={
            <Button
              size="sm"
              className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
              onClick={() => { setEditingItem(null); setViewingItem(null); setShowForm(true); }}
            >
              <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('doiTac.danhMuc.addTag')}</span>
            </Button>
          }
          onDeleteMany={handleDeleteMany}
          columns={columns}
          onToggleColumn={(id) => useTagDoiTacStore.getState().toggleColumn(id)}
          onReorderColumns={(from, to) => useTagDoiTacStore.getState().reorderColumns(from, to)}
          onResetColumns={() => useTagDoiTacStore.getState().resetColumns()}
          onAdd={() => { setEditingItem(null); setViewingItem(null); setShowForm(true); }}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <GenericTable<TagType>
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
          loadingText={t('doiTac.danhMuc.loadingTag')}
          emptyTitle={t('doiTac.danhMuc.emptyTag')}
          emptyDescription={t('doiTac.danhMuc.tagDesc')}
        />
      </div>

      {showForm && (
        <TagFormDrawer
          initialData={editingItem}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSubmit={handleSaveTag}
          isSaving={createTag.isPending || updateTag.isPending}
        />
      )}

      {viewingItem && !showForm && (
        <TagDetailDrawer
          data={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={handleEdit}
          onDelete={handleDeleteFromDetail}
        />
      )}
    </div>
  );
};

export default TagTab;
