import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../lib/button-labels';
import { createListSearchMatcher } from '../../../lib/list-search-matcher';
import { getLanguage } from '../../../lib/utils';
import type { MauChecklistListItem } from './core/list-types';
import { useDeleteMau, useMauList } from './hooks/use-checklist-mau';
import { useChecklistMauStore, DEFAULT_COLUMNS } from './store/useChecklistMauStore';
import ChecklistMauToolbar from './components/ChecklistMauToolbar';
import ChecklistMauList from './components/ChecklistMauList';
import ChecklistMauDrawer from './components/ChecklistMauDrawer';

/** Mảng rỗng cố định khi chưa có dữ liệu — tránh tham chiếu mới mỗi render. */
const KHONG_CO_DONG: MauChecklistListItem[] = [];

const ChecklistMauPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);

  const [showDrawer, setShowDrawer] = useState(false);
  const [editing, setEditing] = useState<MauChecklistListItem | null>(null);

  const {
    searchTerm,
    sort,
    setSort,
    resetState,
    selectedIds,
    pagination,
    setPage,
    setPageSize,
    columns,
    resizeColumn,
    toggleSelection,
    toggleAllSelection,
  } = useChecklistMauStore();

  const listQuery = useMauList();
  const list = listQuery.data ?? KHONG_CO_DONG;
  const isLoading = listQuery.isPending;
  const deleteMutation = useDeleteMau();

  useEffect(() => () => resetState(), [resetState]);

  // Ô tìm kiếm quét mọi cột; ánh xạ nhãn loại / trạng thái để gõ "bàn giao", "ngừng dùng" vẫn ra.
  const khopTimKiem = useMemo(
    () =>
      createListSearchMatcher<MauChecklistListItem>({
        columns: DEFAULT_COLUMNS,
        getCellText: (colId, item) => {
          switch (colId) {
            case 'loai':
              return t(`checklistMau.loai.${item.loai}`);
            case 'dang_dung':
              return item.dang_dung ? t('checklistMau.dangDung') : t('checklistMau.ngungDung');
            default:
              return '';
          }
        },
      }),
    [t]
  );

  const filtered = useMemo(
    () => list.filter((item) => khopTimKiem(item, searchTerm)),
    [list, searchTerm, khopTimKiem]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort.column && sort.direction) {
      const col = sort.column as keyof MauChecklistListItem;
      arr.sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''), getLanguage());
        return sort.direction === 'desc' ? -cmp : cmp;
      });
    }
    return arr;
  }, [filtered, sort]);

  const total = sorted.length;
  const maxPage = Math.max(1, Math.ceil(total / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const pageData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return sorted.slice(start, start + pagination.pageSize);
  }, [sorted, pagination.page, pagination.pageSize]);

  const openAdd = () => {
    setEditing(null);
    setShowDrawer(true);
  };

  const openEdit = (item: MauChecklistListItem) => {
    setEditing(item);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditing(null);
  };

  const inMauTrang = (item: MauChecklistListItem) => {
    window.open(`/quan-ly-nha-so-che/checklist-mau/preview/${item.id}`, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = (item: MauChecklistListItem) => {
    confirm({
      title: t('checklistMau.deleteTitle'),
      message: t('checklistMau.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync(item.id);
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <ChecklistMauToolbar selectedCount={selectedIds.size} onAdd={openAdd} canCreate={canCreate} />
        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
          <ChecklistMauList
            data={pageData}
            columns={columns}
            isLoading={isLoading}
            isFetching={false}
            isError={listQuery.isError}
            onRetry={() => listQuery.refetch()}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAllSelection={toggleAllSelection}
            page={pagination.page}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            totalRecordsOverride={total}
            sort={sort}
            onSort={setSort}
            onResizeColumn={resizeColumn}
            onRowClick={canUpdate ? openEdit : undefined}
            onEdit={canUpdate ? openEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onPrint={inMauTrang}
          />
        </div>
      </div>

      <AnimatePresence>
        {showDrawer && <ChecklistMauDrawer initialData={editing} onClose={closeDrawer} />}
      </AnimatePresence>
    </div>
  );
};

export default ChecklistMauPage;
