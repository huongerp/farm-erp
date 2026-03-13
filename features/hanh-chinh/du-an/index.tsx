import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import DuAnToolbar from './components/du-an-toolbar';
import DuAnTable from './components/du-an-table';
import DuAnForm from './components/du-an-form';
import DuAnDetail from './components/du-an-detail';
import CongViecDetail from '../cong-viec/components/cong-viec-detail';
import CongViecForm from '../cong-viec/components/cong-viec-form';
import ImportDialog from '../../../components/shared/ImportDialog';
import { useDuAnList, useDeleteDuAnList, useImportDuAn } from './hooks/use-du-an';
import { useDuAnStore } from './store/useDuAnStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { getLanguage, exportToExcel, formatDate } from '../../../lib/utils';
import type { DuAn } from './core/types';
import type { CongViec } from '../cong-viec/core/types';

const DuAnPage: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useDuAnStore();

  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DuAn | null>(null);
  const [detailItem, setDetailItem] = useState<DuAn | null>(null);
  const [detailCongViec, setDetailCongViec] = useState<CongViec | null>(null);
  const [showCongViecForm, setShowCongViecForm] = useState(false);
  const [congViecFormDuAnId, setCongViecFormDuAnId] = useState<string | null>(null);
  /** Id dự án đang mở form Sửa từ detail — khi Hủy sẽ mở lại detail */
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useDuAnList();
  const deleteMutation = useDeleteDuAnList();
  const importMutation = useImportDuAn(() => setShowImport(false));
  const [showImport, setShowImport] = useState(false);

  const IMPORT_COLUMNS = useMemo(
    () => [
      { key: 'ma_du_an', label: t('duAn.form.maDuAn'), required: true },
      { key: 'ten_du_an', label: t('duAn.form.tenDuAn'), required: true },
      { key: 'id_phong_ban', label: t('duAn.form.phongBan') },
      { key: 'ngay_bat_dau', label: t('duAn.form.ngayBatDau'), required: true },
      { key: 'ngay_ket_thuc', label: t('duAn.form.ngayKetThuc'), required: true },
      { key: 'muc_tieu', label: t('duAn.form.mucTieu') },
      { key: 'mo_ta', label: t('duAn.form.moTa') },
      { key: 'trang_thai', label: t('duAn.form.status') },
    ],
    [t]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: DuAn, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma_du_an.toLowerCase().includes(searchLower) ||
        item.ten_du_an.toLowerCase().includes(searchLower) ||
        (item.ten_phong_ban && item.ten_phong_ban.toLowerCase().includes(searchLower)) ||
        (item.muc_tieu && item.muc_tieu.toLowerCase().includes(searchLower)) ||
        (item.mo_ta && item.mo_ta.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === 'Đang hoạt động' ? 'Active' : 'Inactive';
      const statusArr = f.status ?? [];
      const phongBanArr = f.id_phong_ban ?? [];
      const namArr = f.nam_bat_dau ?? [];
      const matchesStatus = statusArr.length === 0 || statusArr.includes(statusKey);
      const itemPhongIds = Array.isArray(item.id_phong_ban) ? item.id_phong_ban : (item.id_phong_ban ? [item.id_phong_ban] : []);
      const matchesPhongBan = phongBanArr.length === 0 || itemPhongIds.some((id) => phongBanArr.includes(id));
      const yearStart = item.ngay_bat_dau ? String(new Date(item.ngay_bat_dau).getFullYear()) : '';
      const matchesNam = namArr.length === 0 || (yearStart && namArr.includes(yearStart));
      return matchesSearch && matchesStatus && matchesPhongBan && matchesNam;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: DuAn, b: DuAn) => {
      const aVal = a[sort.column as keyof DuAn] ?? '';
      const bVal = b[sort.column as keyof DuAn] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: DuAn) => {
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

  const handleView = (item: DuAn) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('duAn.deleteTitle'),
      message: t('duAn.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            clearSelection();
            if (detailItem?.id === id) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('duAn.bulkDeleteTitle'),
      message: t('duAn.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, {
        onSuccess: () => {
          clearSelection();
          if (detailItem && ids.includes(detailItem.id)) {
            setDetailItem(null);
            setDetailCongViec(null);
          }
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
      const fresh = list.find((d) => d.id === editingId) ?? null;
      setDetailItem(fresh);
    }
  };

  const handleCloseDetail = () => {
    setDetailItem(null);
  };

  const exportData = useMemo(
    () =>
      sortedList.map((d) => ({
        [t('duAn.store.maCol')]: d.ma_du_an,
        [t('duAn.store.tenCol')]: d.ten_du_an,
        [t('duAn.store.phongBanCol')]: d.ten_phong_ban ?? '—',
        [t('duAn.store.ngayBatDauCol')]: formatDate(d.ngay_bat_dau),
        [t('duAn.store.ngayKetThucCol')]: formatDate(d.ngay_ket_thuc),
        [t('duAn.store.statusCol')]: d.trang_thai,
      })),
    [sortedList, t]
  );
  const handleExport = useCallback(() => {
    exportToExcel(exportData, 'du_an');
  }, [exportData]);

  const handleImportData = useCallback(
    async (data: Record<string, any>[]) => {
      const rows = data.map((row) => ({
        ma_du_an: String(row.ma_du_an ?? '').trim(),
        ten_du_an: String(row.ten_du_an ?? '').trim(),
        id_phong_ban: row.id_phong_ban != null ? String(row.id_phong_ban).trim() : undefined,
        ngay_bat_dau: String(row.ngay_bat_dau ?? '').trim(),
        ngay_ket_thuc: String(row.ngay_ket_thuc ?? '').trim(),
        muc_tieu: row.muc_tieu != null ? String(row.muc_tieu) : undefined,
        mo_ta: row.mo_ta != null ? String(row.mo_ta) : undefined,
        trang_thai: row.trang_thai == null ? 'Đang hoạt động' : (row.trang_thai === 0 || String(row.trang_thai).trim() === 'Ngừng hoạt động' ? 'Ngừng hoạt động' : 'Đang hoạt động'),
      }));
      await importMutation.mutateAsync(rows);
    },
    [importMutation]
  );

  return (
    <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <DuAnToolbar
          items={list}
          onAdd={() => setShowForm(true)}
          onDeleteMany={handleDeleteMany}
          onExport={handleExport}
          onImport={() => setShowImport(true)}
        />
        <div className="flex-1 min-h-0">
          <DuAnTable
            data={sortedList}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </div>

        <AnimatePresence>
          {showForm && (
            <DuAnForm initialData={editingItem} onClose={handleCloseForm} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {detailItem && (
            <DuAnDetail
              data={detailItem}
              onClose={handleCloseDetail}
              onEdit={(item) => handleEdit(item)}
              onDelete={(id) => {
                setDetailItem(null);
                handleDelete(id);
              }}
              onViewCongViec={(c) => setDetailCongViec(c)}
              onCongViecDeleted={(id) => {
                if (detailCongViec?.id === id) setDetailCongViec(null);
              }}
              onAddCongViec={(duAn) => {
                setCongViecFormDuAnId(duAn.id);
                setShowCongViecForm(true);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCongViecForm && (
            <CongViecForm
              defaultIdDuAn={congViecFormDuAnId}
              onClose={() => {
                setShowCongViecForm(false);
                setCongViecFormDuAnId(null);
              }}
              stackLevel={detailItem ? 1 : 0}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showImport && (
            <ImportDialog
              open={showImport}
              onClose={() => setShowImport(false)}
              columns={IMPORT_COLUMNS}
              onImport={handleImportData}
              templateFileName="du_an"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {detailCongViec && (
            <CongViecDetail
              data={detailCongViec}
              onClose={() => setDetailCongViec(null)}
              onEdit={(item) => {
                setDetailCongViec(null);
                navigate(`/hanh-chinh/cong-viec?detail=${item.id}`);
              }}
              stackLevel={1}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default DuAnPage;
