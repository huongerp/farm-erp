import React, { useEffect, useMemo, useState } from 'react';
import type { DiemCongTruListServerQuery } from './services/diem-cong-tru-list-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import { useAuthStore } from '../../../store/useStore';
import DiemCongTruToolbar from './components/diem-cong-tru-toolbar';
import DiemCongTruTable from './components/diem-cong-tru-table';
import DiemCongTruForm from './components/diem-cong-tru-form';
import DiemCongTruDetail from './components/diem-cong-tru-detail';
import {
  useDiemCongTruPage,
  useDeleteDiemCongTruRecords,
} from './hooks/use-diem-cong-tru';
import { useDiemCongTruViewScope } from './hooks/use-diem-cong-tru-view-scope';
import { useDiemCongTruStore } from './store/useDiemCongTruStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { DiemCongTruRecord } from './core/types';


const DiemCongTruPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    pagination,
    resetState,
    clearSelection,
  } = useDiemCongTruStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DiemCongTruRecord | null>(null);
  const [detailItem, setDetailItem] = useState<DiemCongTruRecord | null>(null);
  /** Id bản ghi đang mở form Sửa từ detail — khi Hủy sẽ mở lại detail */
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const { viewAll } = useDiemCongTruViewScope();
  /** Bộ lọc gửi thẳng xuống PostgREST — trước đây tải toàn bộ bảng điểm. */
  const listServerQuery: DiemCongTruListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      loai: filters.type ?? [],
      yearMonth: filters.yearMonth ?? '',
      idNhanVien: viewAll ? null : (user?.id ? String(user.id) : null),
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewAll, user?.id]
  );

  const pageQuery = useDiemCongTruPage(listServerQuery);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;
  const deleteMutation = useDeleteDiemCongTruRecords();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (detailItem && !pageList.some((r) => r.id === detailItem.id)) setDetailItem(null);
  }, [pageList, detailItem]);


  const handleView = (item: DiemCongTruRecord) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: DiemCongTruRecord) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
      setDetailItem(null);
    } else {
      setDetailItem(null);
      setOpenedFormFromDetailId(null);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('diemCongTru.deleteTitle'),
      message: t('diemCongTru.deleteMessage'),
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
      title: t('diemCongTru.bulkDeleteTitle'),
      message: t('diemCongTru.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleCloseForm = () => {
    const wasFromDetail = openedFormFromDetailId != null;
    const editingId = editingItem?.id;
    setShowForm(false);
    setEditingItem(null);
    setOpenedFormFromDetailId(null);
    if (wasFromDetail && editingId) {
      const fresh = pageList.find((r) => r.id === editingId) ?? null;
      setDetailItem(fresh);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <DiemCongTruToolbar
          items={pageList}
          onAdd={canCreate ? () => {
            setDetailItem(null);
            setEditingItem(null);
            setShowForm(true);
          } : undefined}
          onDeleteMany={canDelete ? handleDeleteMany : undefined}
          canCreate={canCreate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0">
          <DiemCongTruTable
            data={pageList}
            totalRecordsOverride={totalCount}
            isFetching={isFetching}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </div>

        <AnimatePresence>
          {showForm && (
            <DiemCongTruForm initialData={editingItem} onClose={handleCloseForm} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {detailItem && !showForm && (
            <DiemCongTruDetail
              data={detailItem}
              onClose={() => setDetailItem(null)}
              onEdit={(item) => handleEdit(item)}
              onDelete={(id) => {
                setDetailItem(null);
                handleDelete(id);
              }}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiemCongTruPage;
