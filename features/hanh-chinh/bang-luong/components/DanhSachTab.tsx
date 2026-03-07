import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useBangLuongRecords, useDeleteBangLuong } from '../hooks/use-bang-luong';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import BangLuongManagedToolbar from './BangLuongManagedToolbar';
import BangLuongManagedTable from './BangLuongManagedTable';
import BangLuongDetail from './BangLuongDetail';
import BangLuongForm from './BangLuongForm';
import { useBangLuongManagedStore } from '../store/useBangLuongManagedStore';
import type { BangLuongRecord } from '../core/types';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const myPhongBan = user?.id_phong_ban ?? '';
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useBangLuongManagedStore();
  const deleteMutation = useDeleteBangLuong();

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BangLuongRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<BangLuongRecord | null>(null);

  const { data: records = [], isLoading, isError } = useBangLuongRecords();

  const managedRecords = useMemo(() => {
    if (isAdmin) {
      return records.filter((r) => r.id_nhan_vien !== (user?.id ?? ''));
    }
    return records.filter(
      (r) =>
        r.id_phong_ban === myPhongBan && r.id_nhan_vien !== (user?.id ?? '')
    );
  }, [records, isAdmin, myPhongBan, user?.id]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: BangLuongRecord, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const periodStr = `${item.nam}-${String(item.thang).padStart(2, '0')}`;
      const matchesSearch =
        !term ||
        (item.ten_nhan_vien?.toLowerCase().includes(searchLower)) ||
        (item.ma_nhan_vien?.toLowerCase().includes(searchLower)) ||
        (item.ten_phong_ban?.toLowerCase().includes(searchLower)) ||
        periodStr.includes(term);
      const matchesPeriod = !f.yearMonth || periodStr.startsWith(f.yearMonth);
      const matchesPhong =
        f.phongBan.length === 0 ||
        (item.id_phong_ban != null && f.phongBan.includes(item.id_phong_ban));
      return matchesSearch && matchesPeriod && matchesPhong;
    },
    []
  );

  const filteredList = useListWithFilter(
    managedRecords,
    searchTerm,
    filters,
    filterFn
  );

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    const periodKey = (r: BangLuongRecord) =>
      `${r.nam}-${String(r.thang).padStart(2, '0')}`;
    sorted.sort((a, b) => {
      let aVal: string | number =
        sort.column === 'period'
          ? periodKey(a)
          : (a[sort.column as keyof BangLuongRecord] ?? '');
      let bVal: string | number =
        sort.column === 'period'
          ? periodKey(b)
          : (b[sort.column as keyof BangLuongRecord] ?? '');
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
        <BangLuongManagedToolbar
          items={managedRecords}
          onAdd={handleAdd}
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          onDeleteMany={handleDeleteMany}
        />
        <div className="flex-1 min-h-0">
          <BangLuongManagedTable
            data={sortedList}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
