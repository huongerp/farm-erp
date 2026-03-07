import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachTable from './DanhSachTable';
import KhoaDaoTaoDetail from './KhoaDaoTaoDetail';
import KhoaDaoTaoForm from './KhoaDaoTaoForm';
import { useKhoaDaoTaos, useDeleteKhoaDaoTaos } from '../hooks/use-khoa-dao-tao';
import { useKhoaDaoTaoStore } from '../store/useKhoaDaoTaoStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import type { KhoaDaoTao } from '../core/types';

interface Props {
  /** null = tab "Tất cả", otherwise filter by id Loại khóa học */
  idLoaiKhoaHoc: string | null;
}

const DanhSachTab: React.FC<Props> = ({ idLoaiKhoaHoc }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
  } = useKhoaDaoTaoStore();

  const [showForm, setShowForm] = useState(false);
  const [detailItem, setDetailItem] = useState<KhoaDaoTao | null>(null);
  const [editingItem, setEditingItem] = useState<KhoaDaoTao | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useKhoaDaoTaos();
  const deleteMutation = useDeleteKhoaDaoTaos();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    const openDetailId = (location.state as { openDetailId?: string } | null)?.openDetailId;
    if (openDetailId && list.length > 0) {
      const item = list.find((i) => i.id === openDetailId);
      if (item) setDetailItem(item);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [list, location.pathname, location.state, navigate]);

  const listByTab = useMemo(() => {
    if (idLoaiKhoaHoc == null) return list;
    return list.filter((i) => i.id_loai_khoa_hoc === idLoaiKhoaHoc);
  }, [list, idLoaiKhoaHoc]);

  const filterFn = useCallback(
    (item: KhoaDaoTao, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma.toLowerCase().includes(searchLower) ||
        item.ten.toLowerCase().includes(searchLower) ||
        (item.ten_loai_khoa_hoc && item.ten_loai_khoa_hoc.toLowerCase().includes(searchLower));
      const matchesTrangThai =
        f.trang_thai.length === 0 || f.trang_thai.includes(String(item.trang_thai));
      const matchesLoai =
        f.id_loai_khoa_hoc.length === 0 || f.id_loai_khoa_hoc.includes(item.id_loai_khoa_hoc);
      return matchesSearch && matchesTrangThai && matchesLoai;
    },
    []
  );

  const filteredList = useListWithFilter(listByTab, searchTerm, filters, filterFn);

  const getSortValue = (item: KhoaDaoTao, col: string) => {
    if (col === 'ma') return item.ma ?? '';
    if (col === 'ten') return item.ten ?? '';
    if (col === 'ten_loai_khoa_hoc') return item.ten_loai_khoa_hoc ?? '';
    if (col === 'thoi_luong') return String(item.thoi_luong);
    if (col === 'ngay_bat_dau') return item.ngay_bat_dau ?? '';
    if (col === 'ngay_ket_thuc') return item.ngay_ket_thuc ?? '';
    if (col === 'trang_thai') return String(item.trang_thai);
    if (col === 'giang_vien') return item.giang_vien ?? '';
    if (col === 'tg_tao') return item.tg_tao ?? '';
    if (col === 'tg_cap_nhat') return item.tg_cap_nhat ?? '';
    return '';
  };

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    const isNumericCol = sort.column === 'thoi_luong' || sort.column === 'trang_thai';
    sorted.sort((a: KhoaDaoTao, b: KhoaDaoTao) => {
      const aVal = getSortValue(a, sort.column!);
      const bVal = getSortValue(b, sort.column!);
      if (isNumericCol) {
        const aNum = aVal ? Number(aVal) : NaN;
        const bNum = bVal ? Number(bVal) : NaN;
        const cmp = (isNaN(aNum) ? -Infinity : aNum) - (isNaN(bNum) ? -Infinity : bNum);
        return sort.direction === 'desc' ? (cmp > 0 ? -1 : cmp < 0 ? 1 : 0) : (cmp > 0 ? 1 : cmp < 0 ? -1 : 0);
      }
      const cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleView = (item: KhoaDaoTao) => {
    setDetailItem(item);
  };

  const handleEdit = (item: KhoaDaoTao) => {
    setEditingItem(item);
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
      title: t('khoaDaoTao.deleteTitle'),
      message: t('khoaDaoTao.deleteMessage'),
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
      title: t('khoaDaoTao.bulkDeleteTitle'),
      message: t('khoaDaoTao.bulkDeleteMessage', { count: ids.length }),
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
        items={listByTab}
        onAdd={() => {
          setDetailItem(null);
          setOpenedFormFromDetailId(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
      />
      <div className="flex-1 min-h-0">
        <DanhSachTable
          data={sortedList}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <AnimatePresence>
        {detailItem && (
          <KhoaDaoTaoDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusUpdated={(item) => setDetailItem(item)}
            onDangKy={(item) => {
              setDetailItem(null);
              navigate('/nhan-su/dang-ky-dao-tao', { state: { prefillIdKhoaHoc: item.id } });
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(showForm || editingItem) && (
          <KhoaDaoTaoForm
            onClose={handleCloseForm}
            initialData={editingItem ?? undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
