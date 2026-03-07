import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachTable from './DanhSachTable';
import ThuGuiUngVienDetail from './ThuGuiUngVienDetail';
import ThuGuiUngVienForm from './ThuGuiUngVienForm';
import { useThuGuiUngViens, useDeleteThuGuiUngViens } from '../hooks/use-thu-gui-ung-vien';
import { useThuGuiUngVienStore } from '../store/useThuGuiUngVienStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage, exportToExcel, formatDateTimeShort } from '../../../../lib/utils';
import { getLoaiThuLabel } from '../core/constants';
import type { ThuGuiUngVien } from '../core/types';

const PREVIEW_BASE = '/thu-gui-ung-vien/preview';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
  } = useThuGuiUngVienStore();

  const [showForm, setShowForm] = useState(false);
  const [detailItem, setDetailItem] = useState<ThuGuiUngVien | null>(null);
  const [editingItem, setEditingItem] = useState<ThuGuiUngVien | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useThuGuiUngViens();
  const deleteMutation = useDeleteThuGuiUngViens();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: ThuGuiUngVien, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term || (item.ten_ung_vien && item.ten_ung_vien.toLowerCase().includes(searchLower));
      const matchesUngVien =
        f.id_ung_vien.length === 0 || f.id_ung_vien.includes(item.id_ung_vien);
      const matchesLoaiThu =
        f.loai_thu.length === 0 || f.loai_thu.includes(item.loai_thu);
      return matchesSearch && matchesUngVien && matchesLoaiThu;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const getSortValue = (item: ThuGuiUngVien, col: string) => {
    if (col === 'ten_ung_vien') return item.ten_ung_vien ?? '';
    if (col === 'loai_thu') return item.loai_thu;
    if (col === 'tg_tao') return item.tg_tao ?? '';
    return '';
  };

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: ThuGuiUngVien, b: ThuGuiUngVien) => {
      const aVal = getSortValue(a, sort.column!);
      const bVal = getSortValue(b, sort.column!);
      const cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const exportData = useMemo(
    () =>
      sortedList.map((item) => ({
        [t('thuGuiUngVien.table.ungVien')]: item.ten_ung_vien ?? '—',
        [t('thuGuiUngVien.table.loaiPhieu')]: getLoaiThuLabel(item.loai_thu, t),
        [t('thuGuiUngVien.table.ngayTao')]: formatDateTimeShort(item.tg_tao),
      })),
    [sortedList, t]
  );

  const handleExport = useCallback(() => {
    if (exportData.length === 0) return;
    exportToExcel(exportData, 'thu_gui_ung_vien');
  }, [exportData]);

  const handleView = (item: ThuGuiUngVien) => {
    setDetailItem(item);
  };

  const handleEdit = (item: ThuGuiUngVien) => {
    setEditingItem(item);
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
      setDetailItem(null);
    } else {
      setDetailItem(null);
      setOpenedFormFromDetailId(null);
    }
  };

  const handlePrint = (item: ThuGuiUngVien) => {
    const url = `${PREVIEW_BASE}/${encodeURIComponent(item.id_ung_vien)}/${item.loai_thu}?letterId=${encodeURIComponent(item.id)}`;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.focus();
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thuGuiUngVien.deleteTitle'),
      message: t('thuGuiUngVien.deleteMessage'),
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
      title: t('thuGuiUngVien.bulkDeleteTitle'),
      message: t('thuGuiUngVien.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
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
      const fresh = list.find((r) => r.id === editingId) ?? null;
      setDetailItem(fresh);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DanhSachToolbar
        items={list}
        onAdd={() => {
          setDetailItem(null);
          setOpenedFormFromDetailId(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onExport={handleExport}
      />
      <div className="flex-1 min-h-0">
        <DanhSachTable
          data={sortedList}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onPrint={handlePrint}
          onDelete={handleDelete}
        />
      </div>

      <AnimatePresence>
        {detailItem && (
          <ThuGuiUngVienDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(showForm || editingItem) && (
          <ThuGuiUngVienForm
            onClose={handleCloseForm}
            initialData={editingItem ?? undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
