import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { List, Search } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import TaiKhoanToolbar from './components/TaiKhoanToolbar';
import TaiKhoanList from './components/TaiKhoanList';
import TaiKhoanForm from './components/TaiKhoanForm';
import TaiKhoanDetail from './components/TaiKhoanDetail';
import TraCuuTheoKyTab from './components/TraCuuTheoKyTab';
import VietQRDisplay from './components/VietQRDisplay';
import ExportDialog from '../../../components/shared/ExportDialog';
import { useTaiKhoan, useDeleteTaiKhoan, useDeleteTaiKhoanMany } from './hooks/use-tai-khoan';
import { useTaiKhoanStore } from './store/useTaiKhoanStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { getLanguage } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/utils';
import type { TaiKhoan } from '../../core/types';

const TaiKhoanPage: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    selectedIds,
    columns,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useTaiKhoanStore();

  const [activeTab, setActiveTab] = useState<'danh-sach' | 'tra-cuu'>('danh-sach');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TaiKhoan | null>(null);
  const [viewingItem, setViewingItem] = useState<TaiKhoan | null>(null);
  const [showExport, setShowExport] = useState(false);

  const { data: list = [], isLoading } = useTaiKhoan();
  const deleteMutation = useDeleteTaiKhoan();
  const deleteManyMutation = useDeleteTaiKhoanMany();

  const filterFn = useCallback(
    (item: TaiKhoan, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_tai_khoan.toLowerCase().includes(searchLower) ||
        (item.so_tai_khoan && item.so_tai_khoan.toLowerCase().includes(searchLower)) ||
        (item.ngan_hang && item.ngan_hang.toLowerCase().includes(searchLower)) ||
        (item.chu_tai_khoan && item.chu_tai_khoan.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesLoai = f.loai.length === 0 || f.loai.includes(item.loai_tai_khoan);
      return matchesSearch && matchesStatus && matchesLoai;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: TaiKhoan, b: TaiKhoan) => {
      const aVal = a[sort.column as keyof TaiKhoan] ?? '';
      const bVal = b[sort.column as keyof TaiKhoan] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.pageSize, maxPage, pagination.page, setPage]);

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'ten_tai_khoan', label: t('taiKhoan.columns.tenTaiKhoan') },
      { key: 'loai_tai_khoan_text', label: t('taiKhoan.columns.loai') },
      { key: 'ngan_hang', label: t('taiKhoan.columns.nganHang') },
      { key: 'so_tai_khoan', label: t('taiKhoan.columns.soTaiKhoan') },
      { key: 'chu_tai_khoan', label: t('taiKhoan.columns.chuTaiKhoan') },
      { key: 'so_du_dau', label: t('taiKhoan.columns.tonDau') },
      { key: 'tong_thu', label: t('taiKhoan.columns.tongThu') },
      { key: 'tong_chi', label: t('taiKhoan.columns.tongChi') },
      { key: 'so_du_cuoi', label: t('taiKhoan.columns.duCuoi') },
      { key: 'trang_thai_text', label: t('taiKhoan.columns.trangThai') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: TaiKhoan) => ({
      ten_tai_khoan: item.ten_tai_khoan,
      loai_tai_khoan_text:
        item.loai_tai_khoan === 'ngan_hang'
          ? t('taiKhoan.loaiNganHang')
          : t('taiKhoan.loaiTienMat'),
      ngan_hang: item.ngan_hang ?? '',
      so_tai_khoan: item.so_tai_khoan ?? '',
      chu_tai_khoan: item.chu_tai_khoan ?? '',
      so_du_dau: formatCurrency(item.so_du_dau),
      tong_thu: formatCurrency(item.tong_thu),
      tong_chi: formatCurrency(item.tong_chi),
      so_du_cuoi: formatCurrency(item.so_du_cuoi),
      trang_thai_text:
        item.trang_thai === 1 ? t('common.activeStatus') : t('common.inactiveStatus'),
    }),
    [t]
  );

  const {
    exportData,
    paginatedData: paginatedExportData,
    selectedData: selectedExportData,
  } = useExportData({
    data: sortedList,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  const tabs = useMemo(
    () => [
      { id: 'danh-sach', label: t('taiKhoan.tabDanhSach'), icon: List },
      { id: 'tra-cuu', label: t('taiKhoan.tabTraCuuTheoKy'), icon: Search },
    ],
    [t]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = list.find((d) => d.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [list, viewingItem?.id]);

  const handleEdit = (item: TaiKhoan) => {
    setEditingItem(item);
    setShowForm(true);
    if (viewingItem?.id === item.id) setViewingItem(null);
  };

  const handleView = (item: TaiKhoan) => {
    setViewingItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('taiKhoan.deleteTitle'),
      message: t('taiKhoan.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('taiKhoan.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteManyMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id as 'danh-sach' | 'tra-cuu');
            clearSelection();
          }}
        />
      </div>

      {activeTab === 'danh-sach' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
          <TaiKhoanToolbar
            data={sortedList}
            selectedCount={selectedIds.size}
            onAdd={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            onDeleteMany={handleDeleteMany}
            onExport={() => setShowExport(true)}
          />
          <div className="flex-1 min-h-0 flex flex-col">
            <TaiKhoanList
              data={sortedList}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <TraCuuTheoKyTab onBack={() => setActiveTab('danh-sach')} />
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <TaiKhoanForm
            initialData={editingItem}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <TaiKhoanDetail
            data={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => {
              setViewingItem(null);
              handleEdit(item);
            }}
            onDelete={(id) => {
              setViewingItem(null);
              handleDelete(id);
            }}
            vietQRNode={
              viewingItem.loai_tai_khoan === 'ngan_hang' &&
              viewingItem.ma_ngan_hang &&
              viewingItem.so_tai_khoan &&
              viewingItem.chu_tai_khoan ? (
                <VietQRDisplay
                  ma_ngan_hang={viewingItem.ma_ngan_hang}
                  so_tai_khoan={viewingItem.so_tai_khoan}
                  chu_tai_khoan={viewingItem.chu_tai_khoan}
                />
              ) : undefined
            }
          />
        )}
      </AnimatePresence>

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        columns={EXPORT_COLUMNS}
        data={exportData}
        selectedData={selectedExportData}
        paginatedData={paginatedExportData}
        fileName={t('taiKhoan.exportFileName')}
        visibleColumnKeys={EXPORT_COLUMNS.map((c) => c.key)}
      />
    </div>
  );
};

export default TaiKhoanPage;
