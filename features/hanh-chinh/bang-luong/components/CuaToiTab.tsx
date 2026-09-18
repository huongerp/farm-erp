import React, { useEffect, useMemo, useState } from 'react';
import type { BangLuongListServerQuery } from '../services/bang-luong-list-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useBangLuongPage, useDeleteBangLuong } from '../hooks/use-bang-luong';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import BangLuongMyToolbar from './BangLuongMyToolbar';
import BangLuongMyTable from './BangLuongMyTable';
import BangLuongDetail from './BangLuongDetail';
import BangLuongForm from './BangLuongForm';
import { useBangLuongMyStore } from '../store/useBangLuongMyStore';
import type { BangLuongRecord } from '../core/types';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

const CuaToiTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const currentUserId = user?.id ?? '';
  const {
    searchTerm,
    filters,
    sort,
    pagination,
    resetState,
    clearSelection,
    selectedIds,
  } = useBangLuongMyStore();
  const deleteMutation = useDeleteBangLuong();

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BangLuongRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<BangLuongRecord | null>(null);

  /** Bộ lọc gửi thẳng xuống PostgREST — chỉ tải bảng lương của chính mình, đúng một trang. */
  const listServerQuery: BangLuongListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      yearMonth: filters.yearMonth ?? '',
      phongBan: [],
      nhanVienId: currentUserId || null,
      loaiTruNhanVienId: null,
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, currentUserId]
  );

  const pageQuery = useBangLuongPage(listServerQuery, Boolean(currentUserId));
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;
  const isError = pageQuery.isError;

  useEffect(() => {
    return () => resetState();
  }, [resetState]);


  const handleView = (record: BangLuongRecord) => setViewingRecord(record);

  const handleAdd = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record: BangLuongRecord) => {
    setEditingRecord(record);
    setViewingRecord(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('bangLuong.deleteTitle'),
      message: t('bangLuong.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => { if (viewingRecord?.id === id) setViewingRecord(null); },
        });
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('bangLuong.bulkDeleteTitle'),
      message: t('bangLuong.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingRecord && ids.includes(viewingRecord.id)) setViewingRecord(null);
          },
        });
      },
    });
  };

  if (isError) {
    return (
      <p className="text-sm text-destructive p-4">
        {t('common.error') || 'Có lỗi khi tải dữ liệu.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <BangLuongMyToolbar
          onAdd={canCreate ? handleAdd : undefined}
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          onDeleteMany={canDelete ? handleDeleteMany : undefined}
          canCreate={canCreate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0">
          <BangLuongMyTable
            data={pageList}
            totalRecordsOverride={totalCount}
            isFetching={isFetching}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </div>
      </div>

      <AnimatePresence>
        {viewingRecord && !showForm && (
          <BangLuongDetail
            data={viewingRecord}
            onClose={() => setViewingRecord(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <BangLuongForm
            initialRecord={editingRecord}
            defaultEmployeeId={currentUserId}
            onClose={() => { setShowForm(false); setEditingRecord(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CuaToiTab;
