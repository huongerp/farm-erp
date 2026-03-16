import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import KhauHaoTaiSanToolbar from './KhauHaoTaiSanToolbar';
import KyKhauHaoTable from './KyKhauHaoTable';
import KyKhauHaoDetail from './KyKhauHaoDetail';
import KyKhauHaoForm from './KyKhauHaoForm';
import { useKyKhauHaoList, useChiTietKhauHao, useTinhToanKhauHaoKy, useChotKy, useDeleteKyKhauHao } from '../hooks/use-khau-hao-tai-san';
import { useKhauHaoTaiSanStore } from '../store/useKhauHaoTaiSanStore';
import { getLanguage } from '../../../../lib/utils';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import type { KyKhauHao } from '../core/types';

const KyTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchTerm, filters, sort, resetState } = useKhauHaoTaiSanStore();
  const { data: list = [], isLoading } = useKyKhauHaoList();
  const deleteMutation = useDeleteKyKhauHao();
  const [detailItem, setDetailItem] = useState<KyKhauHao | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<KyKhauHao | null>(null);

  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietKhauHao(detailItem?.id ?? null);
  const tinhToanMutation = useTinhToanKhauHaoKy(detailItem?.id ?? null);
  const chotKyMutation = useChotKy(detailItem?.id ?? null);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: KyKhauHao) => {
      const matchSearch =
        !searchTerm ||
        String(item.thang).includes(searchTerm) ||
        String(item.nam).includes(searchTerm);
      const matchNam = !filters.nam || String(item.nam) === filters.nam;
      const matchThang = filters.thang.length === 0 || filters.thang.includes(String(item.thang));
      const matchTrangThai =
        filters.trang_thai_ky.length === 0 || filters.trang_thai_ky.includes(item.trang_thai);
      return matchSearch && matchNam && matchThang && matchTrangThai;
    },
    [searchTerm, filters.nam, filters.thang, filters.trang_thai_ky]
  );

  const filteredList = useMemo(() => list.filter(filterFn), [list, filterFn]);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof KyKhauHao] ?? '';
      const bVal = b[sort.column as keyof KyKhauHao] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
    setDetailItem(null);
  }, []);

  const handleView = useCallback((item: KyKhauHao) => {
    setDetailItem(item);
    setShowForm(false);
    setEditingItem(null);
  }, []);

  const handleEdit = useCallback((item: KyKhauHao) => {
    if (item.trang_thai !== 'draft') return;
    setEditingItem(item);
    setShowForm(true);
    setDetailItem(null);
  }, []);

  const handleDelete = useCallback(
    (item: KyKhauHao) => {
      if (item.trang_thai === 'chot') return;
      confirm({
        title: t('khauHaoTaiSan.deleteTitle'),
        message: t('khauHaoTaiSan.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate(item.id, {
            onSuccess: () => {
              if (detailItem?.id === item.id) setDetailItem(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem]
  );

  const handleTinhToan = useCallback(
    (idKy: string) => {
      tinhToanMutation.mutate(undefined, {
        onSuccess: () => {
          if (detailItem?.id === idKy) {
            // detail already shows chiTiet from query, will refetch
          }
        },
      });
    },
    [tinhToanMutation, detailItem]
  );

  const handleChotKy = useCallback(
    (idKy: string) => {
      chotKyMutation.mutate(undefined, {
        onSuccess: () => {
          if (detailItem?.id === idKy) setDetailItem(null);
        },
      });
    },
    [chotKyMutation, detailItem]
  );

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      <KhauHaoTaiSanToolbar items={list} onAdd={handleAdd} showAdd={canCreate} />
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <KyKhauHaoTable
          data={sortedList}
          isLoading={isLoading}
          onView={handleView}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          showActions
        />
      </div>
      {showForm && (
        <KyKhauHaoForm
          initialData={editingItem ?? undefined}
          onClose={handleCloseForm}
        />
      )}
      {detailItem && (
        <KyKhauHaoDetail
          data={detailItem}
          chiTiet={chiTiet}
          chiTietLoading={chiTietLoading}
          onClose={() => setDetailItem(null)}
          onEdit={canUpdate ? handleEdit : undefined}
          onTinhToan={handleTinhToan}
          onChotKy={handleChotKy}
          tinhToanLoading={tinhToanMutation.isPending}
          chotKyLoading={chotKyMutation.isPending}
        />
      )}
    </div>
  );
};

export default KyTab;
