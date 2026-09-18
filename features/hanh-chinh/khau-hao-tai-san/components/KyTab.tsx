import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { KyKhauHaoListServerQuery } from '../services/khau-hao-list-query';
import { useTranslation } from 'react-i18next';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import KhauHaoTaiSanToolbar from './KhauHaoTaiSanToolbar';
import KyKhauHaoTable from './KyKhauHaoTable';
import KyKhauHaoDetail from './KyKhauHaoDetail';
import KyKhauHaoForm from './KyKhauHaoForm';
import { useKyKhauHaoPage, useChiTietKhauHao, useTinhToanKhauHaoKy, useChotKy, useDeleteKyKhauHao } from '../hooks/use-khau-hao-tai-san';
import { useKhauHaoTaiSanViewScope } from '../hooks/use-khau-hao-tai-san-view-scope';
import { useAuthStore } from '../../../../store/useStore';
import { useKhauHaoTaiSanStore } from '../store/useKhauHaoTaiSanStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import type { KyKhauHao } from '../core/types';

const KyTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const { viewAll } = useKhauHaoTaiSanViewScope();
  const { searchTerm, filters, sort, pagination, resetState } = useKhauHaoTaiSanStore();
  /** Bộ lọc gửi thẳng xuống PostgREST — trước đây tải toàn bộ kỳ khấu hao. */
  const listServerQuery: KyKhauHaoListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      nam: filters.nam ?? '',
      thang: filters.thang ?? [],
      trangThai: filters.trang_thai_ky ?? [],
      idNguoiTao: viewAll ? null : (user?.id ? String(user.id) : null),
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewAll, user?.id]
  );

  const pageQuery = useKyKhauHaoPage(listServerQuery);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

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
      <KhauHaoTaiSanToolbar items={pageList} onAdd={handleAdd} showAdd={canCreate} />
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <KyKhauHaoTable
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
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
