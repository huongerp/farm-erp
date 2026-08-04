import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useBangLuongRecords, useDeleteBangLuong } from '../hooks/use-bang-luong';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
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
    resetState,
    clearSelection,
    selectedIds,
  } = useBangLuongMyStore();
  const deleteMutation = useDeleteBangLuong();

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BangLuongRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<BangLuongRecord | null>(null);

  const { data: records = [], isLoading, isError } = useBangLuongRecords();

  const myRecords = useMemo(
    () => records.filter((r) => r.id_nhan_vien === currentUserId),
    [records, currentUserId]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: BangLuongRecord, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const periodStr = `${item.nam}-${String(item.thang).padStart(2, '0')}`;
      const matchesSearch = Boolean(
        !term ||
        periodStr.includes(term) ||
        (item.ten_phong_ban?.toLowerCase().includes(searchLower))
      );
      const matchesPeriod = !f.yearMonth || periodStr.startsWith(f.yearMonth);
      return matchesSearch && matchesPeriod;
    },
    []
  );

  const filteredList = useListWithFilter(myRecords, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    const periodKey = (r: BangLuongRecord) =>
      `${r.nam}-${String(r.thang).padStart(2, '0')}`;
    const sortableValue = (record: BangLuongRecord, col: string): string | number => {
      if (col === 'period') return periodKey(record);
      const raw = record[col as keyof BangLuongRecord];
      return typeof raw === 'string' || typeof raw === 'number' ? raw : '';
    };
    sorted.sort((a, b) => {
      const aVal = sortableValue(a, sort.column ?? '');
      const bVal = sortableValue(b, sort.column ?? '');
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

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
            data={sortedList}
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
