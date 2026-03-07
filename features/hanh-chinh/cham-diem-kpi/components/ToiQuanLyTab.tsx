import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useChamDiemKpiRecords, useDeleteChamDiemKpi } from '../hooks/use-cham-diem-kpi';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import ChamDiemKpiManagedToolbar from './ChamDiemKpiManagedToolbar';
import ChamDiemKpiManagedTable from './ChamDiemKpiManagedTable';
import ChamDiemKpiDetail from './ChamDiemKpiDetail';
import ChamDiemKpiForm from './ChamDiemKpiForm';
import { useChamDiemKpiManagedStore } from '../store/useChamDiemKpiManagedStore';
import type { ChamDiemKpiRecord } from '../core/types';

const ToiQuanLyTab: React.FC = () => {
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
  } = useChamDiemKpiManagedStore();
  const deleteMutation = useDeleteChamDiemKpi();

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChamDiemKpiRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ChamDiemKpiRecord | null>(null);

  const { data: records = [], isLoading, isError } = useChamDiemKpiRecords();

  const managedRecords = useMemo(() => {
    if (isAdmin) {
      return records.filter((r) => r.id_nhan_vien !== (user?.id ?? ''));
    }
    return records.filter(
      (r) =>
        r.id_phong_ban === myPhongBan &&
        r.id_nhan_vien !== (user?.id ?? '')
    );
  }, [records, isAdmin, myPhongBan, user?.id]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: ChamDiemKpiRecord, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const periodStr = `${item.nam}-${String(item.thang).padStart(2, '0')}`;
      const matchesSearch =
        !term ||
        (item.ten_nhan_vien?.toLowerCase().includes(searchLower)) ||
        (item.ma_nhan_vien?.toLowerCase().includes(searchLower)) ||
        (item.ten_phong_ban?.toLowerCase().includes(searchLower)) ||
        (item.ten_chuc_vu?.toLowerCase().includes(searchLower)) ||
        periodStr.includes(term);
      const matchesPeriod = !f.yearMonth || periodStr.startsWith(f.yearMonth);
      const matchesDanhGia =
        f.danhGia.length === 0 || f.danhGia.includes(item.danh_gia);
      const matchesPhong =
        f.phongBan.length === 0 ||
        (item.ten_phong_ban != null && f.phongBan.includes(item.ten_phong_ban));
      const matchesNhom =
        f.nhom.length === 0 ||
        (item.ten_phong_ban != null && f.nhom.includes(item.ten_phong_ban));
      return (
        matchesSearch &&
        matchesPeriod &&
        matchesDanhGia &&
        matchesPhong &&
        matchesNhom
      );
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
    const periodKey = (r: ChamDiemKpiRecord) =>
      `${r.nam}-${String(r.thang).padStart(2, '0')}`;
    sorted.sort((a, b) => {
      let aVal: string | number =
        sort.column === 'period'
          ? periodKey(a)
          : (a[sort.column as keyof ChamDiemKpiRecord] ?? '');
      let bVal: string | number =
        sort.column === 'period'
          ? periodKey(b)
          : (b[sort.column as keyof ChamDiemKpiRecord] ?? '');
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleAdd = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record: ChamDiemKpiRecord) => {
    setEditingRecord(record);
    setViewingRecord(null);
    setShowForm(true);
  };

  const handleView = (record: ChamDiemKpiRecord) => {
    setViewingRecord(record);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('chamDiemKpi.deleteTitle'),
      message: t('chamDiemKpi.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (viewingRecord?.id === id) setViewingRecord(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('chamDiemKpi.bulkDeleteTitle'),
      message: t('chamDiemKpi.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingRecord && ids.includes(viewingRecord.id))
              setViewingRecord(null);
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
        <ChamDiemKpiManagedToolbar
          items={managedRecords}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
        />
        <div className="flex-1 min-h-0">
          <ChamDiemKpiManagedTable
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
          <ChamDiemKpiDetail
            data={viewingRecord}
            onClose={() => setViewingRecord(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <ChamDiemKpiForm
            initialRecord={editingRecord}
            defaultEmployeeId={editingRecord?.id_nhan_vien ?? undefined}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToiQuanLyTab;
