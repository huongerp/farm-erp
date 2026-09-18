import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import HangMucThuChiToolbar from './HangMucThuChiToolbar';
import HangMucThuChiTable from './HangMucThuChiTable';
import HangMucThuChiForm from './HangMucThuChiForm';
import HangMucThuChiDetail from './HangMucThuChiDetail';
import {
  useHangMucThuChiList,
  useDeleteHangMucThuChiList,
  useUpdateHangMucThuChiStatus,
} from '../hooks/use-hang-muc-thu-chi';
import { useHangMucThuChiStore, DEFAULT_COLUMNS } from '../store/useHangMucThuChiStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import type { HangMucThuChi } from '../core/types';
import { createListSearchMatcher } from '../../../../lib/list-search-matcher';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher({ columns: DEFAULT_COLUMNS });

const HangMucThuChiTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchTerm, filters, sort, resetState, clearSelection } = useHangMucThuChiStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HangMucThuChi | null>(null);
  const [detailItem, setDetailItem] = useState<HangMucThuChi | null>(null);

  const { data: list = [], isLoading } = useHangMucThuChiList();
  const deleteMutation = useDeleteHangMucThuChiList();
  const statusMutation = useUpdateHangMucThuChiStatus();

  useEffect(() => () => resetState(), [resetState]);

  const filterFn = useCallback((item: HangMucThuChi, term: string, f: typeof filters) => {
    const matchesSearch = khopTimKiem(item, term);
    const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
    const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
    const matchesLoai = f.loai.length === 0 || f.loai.includes(item.loai);
    return matchesSearch && matchesStatus && matchesLoai;
  }, []);

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    const sorted = [...filteredList];
    const byThuTu = (a: HangMucThuChi, b: HangMucThuChi) =>
      a.thu_tu - b.thu_tu || Number(a.id) - Number(b.id);
    if (!sort.column || !sort.direction) {
      sorted.sort(byThuTu);
      return sorted;
    }
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof HangMucThuChi] ?? '';
      const bVal = b[sort.column as keyof HangMucThuChi] ?? '';
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: HangMucThuChi) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thietLapQuy.hangMuc.deleteTitle'),
      message: t('thietLapQuy.hangMuc.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        }),
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('thietLapQuy.hangMuc.bulkDeleteTitle'),
      message: t('thietLapQuy.hangMuc.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => deleteMutation.mutate(ids, { onSuccess: () => clearSelection() }),
    });
  };

  const handleStatusChangeMany = (ids: string[], status: TrangThaiHoatDong) => {
    const statusLabel =
      status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('common.activeStatus') : t('common.inactiveStatus');
    confirm({
      title: t('thietLapQuy.hangMuc.statusChangeTitle'),
      message: t('thietLapQuy.hangMuc.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => statusMutation.mutate({ ids, status }, { onSuccess: () => clearSelection() }),
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <HangMucThuChiToolbar
        items={list}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
        <HangMucThuChiTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onRowClick={setDetailItem}
        />
      </div>
      <AnimatePresence>
        {showForm && <HangMucThuChiForm initialData={editingItem} onClose={handleCloseForm} />}
      </AnimatePresence>
      <AnimatePresence>
        {detailItem && (
          <HangMucThuChiDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HangMucThuChiTab;
