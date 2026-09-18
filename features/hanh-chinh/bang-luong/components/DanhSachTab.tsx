import React, { useEffect, useMemo, useState } from 'react';
import type { BangLuongListServerQuery } from '../services/bang-luong-list-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useBangLuongPage, useDeleteBangLuong } from '../hooks/use-bang-luong';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import BangLuongManagedToolbar from './BangLuongManagedToolbar';
import BangLuongManagedTable from './BangLuongManagedTable';
import BangLuongDetail from './BangLuongDetail';
import BangLuongForm from './BangLuongForm';
import { useBangLuongManagedStore } from '../store/useBangLuongManagedStore';
import type { BangLuongRecord } from '../core/types';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const isAdmin = user?.role === 'admin';
  const myPhongBan = user?.id_phong_ban ?? '';
  const {
    searchTerm,
    filters,
    sort,
    pagination,
    resetState,
    clearSelection,
    selectedIds,
  } = useBangLuongManagedStore();
  const deleteMutation = useDeleteBangLuong();

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BangLuongRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<BangLuongRecord | null>(null);

  /**
   * Bộ lọc gửi thẳng xuống PostgREST — trước đây tab này tải TOÀN BỘ bảng lương
   * (tăng theo số nhân viên × số tháng) rồi mới lọc ở trình duyệt.
   */
  const listServerQuery: BangLuongListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      yearMonth: filters.yearMonth ?? '',
      // Không phải admin thì chỉ xem lương phòng ban của mình.
      phongBan: filters.phongBan?.length ? filters.phongBan : isAdmin ? [] : myPhongBan ? [myPhongBan] : [],
      nhanVienId: null,
      // Tab Quản lý không hiển thị bảng lương của chính người đang đăng nhập.
      loaiTruNhanVienId: user?.id ? String(user.id) : null,
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, isAdmin, myPhongBan, user?.id]
  );

  const pageQuery = useBangLuongPage(listServerQuery);
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
        <BangLuongManagedToolbar
          items={pageList}
          onAdd={canCreate ? handleAdd : undefined}
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          onDeleteMany={canDelete ? handleDeleteMany : undefined}
          canCreate={canCreate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0">
          <BangLuongManagedTable
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
            onClose={() => { setShowForm(false); setEditingRecord(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
