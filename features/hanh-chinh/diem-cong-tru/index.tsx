import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import DiemCongTruToolbar from './components/diem-cong-tru-toolbar';
import DiemCongTruTable from './components/diem-cong-tru-table';
import DiemCongTruForm from './components/diem-cong-tru-form';
import DiemCongTruDetail from './components/diem-cong-tru-detail';
import {
  useDiemCongTruRecords,
  useDeleteDiemCongTruRecords,
} from './hooks/use-diem-cong-tru';
import { useDiemCongTruStore } from './store/useDiemCongTruStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { getLanguage } from '../../../lib/utils';
import { DiemCongTruRecord } from './core/types';

const DiemCongTruPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useDiemCongTruStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DiemCongTruRecord | null>(null);
  const [detailItem, setDetailItem] = useState<DiemCongTruRecord | null>(null);
  /** Id bản ghi đang mở form Sửa từ detail — khi Hủy sẽ mở lại detail */
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const { data: records = [], isLoading } = useDiemCongTruRecords();
  const deleteMutation = useDeleteDiemCongTruRecords();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: DiemCongTruRecord, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const periodStr = `${item.nam}-${String(item.thang).padStart(2, '0')}`;
      const matchesSearch =
        !term ||
        (item.ten_nhan_vien && item.ten_nhan_vien.toLowerCase().includes(searchLower)) ||
        (item.ma_nhan_vien && item.ma_nhan_vien.toLowerCase().includes(searchLower)) ||
        (item.ten_hang_muc && item.ten_hang_muc.toLowerCase().includes(searchLower)) ||
        (item.ma_hang_muc && item.ma_hang_muc.toLowerCase().includes(searchLower)) ||
        (item.mo_ta && item.mo_ta.toLowerCase().includes(searchLower)) ||
        periodStr.includes(term);
      const matchesType = f.type.length === 0 || f.type.includes(item.loai);
      const matchesMonth = !f.yearMonth || periodStr.startsWith(f.yearMonth);
      return matchesSearch && matchesType && matchesMonth;
    },
    []
  );

  const filteredList = useListWithFilter(records, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    const periodKey = (r: DiemCongTruRecord) => `${r.nam}-${String(r.thang).padStart(2, '0')}`;
    sorted.sort((a, b) => {
      let aVal: string | number = a[sort.column as keyof DiemCongTruRecord] ?? '';
      let bVal: string | number = b[sort.column as keyof DiemCongTruRecord] ?? '';
      if (sort.column === 'period') {
        aVal = periodKey(a);
        bVal = periodKey(b);
      }
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

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
      const fresh = records.find((r) => r.id === editingId) ?? null;
      setDetailItem(fresh);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <DiemCongTruToolbar
          items={records}
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
            data={sortedList}
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
