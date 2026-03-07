import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachTable from './DanhSachTable';
import KhoaDangKyMoiTable from './KhoaDangKyMoiTable';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import DangKyDetail from './DangKyDetail';
import DangKyForm from './DangKyForm';
import GiaoKhoaForm from './GiaoKhoaForm';
import { useDangKyList, useDeleteDangKy, useKhoaMoDangKy } from '../hooks/use-dang-ky-dao-tao';
import { useDangKyDaoTaoStore } from '../store/useDangKyDaoTaoStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import type { DangKyThamGia } from '../core/types';
import type { KhoaDaoTao } from '@/features/nhan-su/khoa-dao-tao/core/types';

const TAB_CUA_TOI = 'cua-toi';
const TAB_DANG_KY_MOI = 'dang-ky-moi';
const TAB_QUAN_LY_GIAO = 'quan-ly-giao';

interface Props {
  activeTab: string;
  /** Khi điều hướng từ Khóa đào tạo (nút Đăng ký), mở form đăng ký với khóa đã chọn */
  initialPrefillIdKhoaHoc?: string | null;
}

const DanhSachTab: React.FC<Props> = ({ activeTab, initialPrefillIdKhoaHoc }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const {
    searchTerm,
    filters,
    sort,
    resetState,
  } = useDangKyDaoTaoStore();

  const [detailItem, setDetailItem] = useState<DangKyThamGia | null>(null);
  const [showDangKyForm, setShowDangKyForm] = useState(false);
  const [showGiaoKhoaForm, setShowGiaoKhoaForm] = useState(false);
  const [prefillIdKhoaHoc, setPrefillIdKhoaHoc] = useState<string | null>(initialPrefillIdKhoaHoc ?? null);
  const [searchTermDangKyMoi, setSearchTermDangKyMoi] = useState('');

  const { data: listDangKy = [], isLoading: loadingDangKy } = useDangKyList(
    activeTab === TAB_CUA_TOI ? { id_nhan_vien: currentUserId } : activeTab === TAB_QUAN_LY_GIAO ? {} : undefined,
    { enabled: activeTab !== TAB_DANG_KY_MOI }
  );
  const idChucVuUser = user?.id_chuc_vu ?? undefined;
  const { data: listKhoaMo = [], isLoading: loadingKhoaMo } = useKhoaMoDangKy(idChucVuUser);
  const deleteMutation = useDeleteDangKy();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (initialPrefillIdKhoaHoc && activeTab === TAB_DANG_KY_MOI) {
      setPrefillIdKhoaHoc(initialPrefillIdKhoaHoc);
      setShowDangKyForm(true);
    }
  }, [initialPrefillIdKhoaHoc, activeTab]);

  const listByTab = useMemo(() => {
    if (activeTab === TAB_DANG_KY_MOI) return [];
    return listDangKy;
  }, [activeTab, listDangKy]);

  const filteredListKhoaMo = useMemo(() => {
    if (!searchTermDangKyMoi.trim()) return listKhoaMo;
    const term = searchTermDangKyMoi.toLowerCase().trim();
    return listKhoaMo.filter(
      (k) =>
        (k.ma && k.ma.toLowerCase().includes(term)) ||
        (k.ten && k.ten.toLowerCase().includes(term)) ||
        (k.ten_loai_khoa_hoc && k.ten_loai_khoa_hoc.toLowerCase().includes(term))
    );
  }, [listKhoaMo, searchTermDangKyMoi]);

  const filterFn = useCallback(
    (item: DangKyThamGia, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        (item.ten_khoa_hoc && item.ten_khoa_hoc.toLowerCase().includes(searchLower)) ||
        (item.ma_khoa_hoc && item.ma_khoa_hoc.toLowerCase().includes(searchLower)) ||
        (item.ten_nhan_vien && item.ten_nhan_vien.toLowerCase().includes(searchLower));
      const matchesTrangThai =
        f.trang_thai.length === 0 || f.trang_thai.includes(String(item.trang_thai));
      const matchesKhoa =
        f.id_khoa_hoc.length === 0 || f.id_khoa_hoc.includes(item.id_khoa_hoc);
      const matchesLoai =
        f.id_loai_khoa_hoc.length === 0 ||
        (item.id_loai_khoa_hoc && f.id_loai_khoa_hoc.includes(item.id_loai_khoa_hoc));
      return matchesSearch && matchesTrangThai && matchesKhoa && matchesLoai;
    },
    []
  );

  const filteredList = useListWithFilter(listByTab, searchTerm, filters, filterFn);

  const getSortValue = (item: DangKyThamGia, col: string) => {
    if (col === 'ma_khoa_hoc') return item.ma_khoa_hoc ?? '';
    if (col === 'ten_khoa_hoc') return item.ten_khoa_hoc ?? '';
    if (col === 'ten_nhan_vien') return item.ten_nhan_vien ?? '';
    if (col === 'trang_thai') return String(item.trang_thai);
    if (col === 'tg_dang_ky') return item.tg_dang_ky ?? '';
    return '';
  };

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: DangKyThamGia, b: DangKyThamGia) => {
      const aVal = getSortValue(a, sort.column!);
      const bVal = getSortValue(b, sort.column!);
      const cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleView = (item: DangKyThamGia) => setDetailItem(item);
  const handleVaoHoc = (item: DangKyThamGia) => {
    setDetailItem(null);
    navigate(`/nhan-su/dang-ky-dao-tao/hoc/${item.id}`);
  };
  const handleDelete = (id: string) => {
    confirm({
      title: t('dangKyDaoTao.deleteTitle'),
      message: t('dangKyDaoTao.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        }),
    });
  };
  const handleDangKyKhoa = (khoa: KhoaDaoTao) => {
    setPrefillIdKhoaHoc(khoa.id);
    setShowDangKyForm(true);
  };
  const handleCloseDangKyForm = () => {
    setShowDangKyForm(false);
    setPrefillIdKhoaHoc(null);
  };
  const handleCloseGiaoKhoaForm = () => setShowGiaoKhoaForm(false);

  if (activeTab === TAB_DANG_KY_MOI) {
    return (
      <>
        <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <GenericToolbar
            selectedCount={0}
            searchTerm={searchTermDangKyMoi}
            onSearchChange={setSearchTermDangKyMoi}
            onClearSelection={() => {}}
            showBack
            searchPlaceholder={t('dangKyDaoTao.searchPlaceholder')}
          />
          <div className="flex-1 min-h-0">
            <KhoaDangKyMoiTable
              data={filteredListKhoaMo}
              isLoading={loadingKhoaMo}
              onDangKy={handleDangKyKhoa}
            />
          </div>
        </div>
        <AnimatePresence>
          {showDangKyForm && (
            <DangKyForm
              onClose={handleCloseDangKyForm}
              idNhanVien={currentUserId}
              prefillIdKhoaHoc={prefillIdKhoaHoc}
              idChucVuUser={idChucVuUser}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <DanhSachToolbar
          items={sortedList}
          onGiaoKhoa={activeTab === TAB_QUAN_LY_GIAO ? () => setShowGiaoKhoaForm(true) : undefined}
          onDeleteMany={(ids) => {
            confirm({
              title: t('dangKyDaoTao.deleteManyTitle'),
              message: t('dangKyDaoTao.deleteManyMessage', { count: ids.length }),
              variant: 'danger',
              confirmText: CONFIRM_DELETE(),
              onConfirm: () => {
                ids.forEach((id) => deleteMutation.mutate(id));
                setDetailItem(null);
              },
            });
          }}
          showGiaoKhoa={activeTab === TAB_QUAN_LY_GIAO}
        />
        <div className="flex-1 min-h-0">
          <DanhSachTable
            data={sortedList}
            isLoading={loadingDangKy}
            onView={handleView}
            onVaoHoc={handleVaoHoc}
            onDelete={handleDelete}
            showNhanVienColumn={activeTab === TAB_QUAN_LY_GIAO}
          />
        </div>
      </div>

      <AnimatePresence>
        {detailItem && (
          <DangKyDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onVaoHoc={handleVaoHoc}
            onHuyDangKy={(id) => handleDelete(id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGiaoKhoaForm && currentUserId && (
          <GiaoKhoaForm onClose={handleCloseGiaoKhoaForm} idNguoiGiao={currentUserId} />
        )}
      </AnimatePresence>
    </>
  );
};

export default DanhSachTab;
