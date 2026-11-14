import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import type { PhieuChecklistListItem } from '../core/list-types';
import type { ChecklistBanGiaoListServerQuery } from '../services/checklist-ban-giao-list-query';
import { useChecklistBanGiaoPage, useNguoiDungCl, usePhieuById, usePhieuTomTat } from '../hooks/use-checklist-ban-giao';
import { useMauList } from '../../checklist-mau/hooks/use-checklist-mau';
import { useChecklistBanGiaoStore } from '../store/useChecklistBanGiaoStore';
import ChecklistBanGiaoToolbar from './ChecklistBanGiaoToolbar';
import ChecklistBanGiaoList from './ChecklistBanGiaoList';
import ChecklistBanGiaoDetail from './ChecklistBanGiaoDetail';
import TaoPhieuDialog from './TaoPhieuDialog';
import { useDeletePhieu } from '../hooks/use-checklist-ban-giao';

export type ChecklistBanGiaoTabId = 'danh-sach' | 'cho-toi-kiem-tra' | 'bi-tra-lai';

interface Props {
  tabId: ChecklistBanGiaoTabId;
}

const DanhSachTab: React.FC<Props> = ({ tabId }) => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const nguoi = useNguoiDungCl();

  const {
    searchTerm,
    filters,
    resetState,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
    columns,
    resizeColumn,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
  } = useChecklistBanGiaoStore();

  const [showTao, setShowTao] = useState(false);
  // Phiếu vừa tạo: dùng ngay để mở drawer chi tiết, không chờ list/byId tải lại.
  const [viewingSeed, setViewingSeed] = useState<PhieuChecklistListItem | null>(null);
  // Link thông báo đẩy dạng ?phieu=<id> (services/notify mo-ta-bang: thamSoPhieu) → mở drawer rồi bỏ tham số.
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewingId, setViewingId] = useState<string | null>(() => searchParams.get('phieu'));
  useEffect(() => {
    if (!searchParams.get('phieu')) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('phieu');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  const coChucVu = nguoi.chucVuId != null;

  const listServerQuery: ChecklistBanGiaoListServerQuery = useMemo(() => {
    const choToi = tabId === 'cho-toi-kiem-tra';
    const biTraLai = tabId === 'bi-tra-lai';
    return {
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      trangThai: biTraLai ? ['tra_lai'] : choToi ? (coChucVu ? ['cho_kiem_tra'] : ['__khong_co__']) : (filters.trang_thai ?? []),
      idMau: tabId === 'danh-sach' ? (filters.id_mau ?? []) : [],
      ngayFrom: tabId === 'danh-sach' ? filters.ngay_from : null,
      ngayTo: tabId === 'danh-sach' ? filters.ngay_to : null,
      chiChoToiKiemTra: choToi && coChucVu,
      chucVuId: nguoi.chucVuId,
      sortColumn: sort.column,
      sortDirection: sort.direction,
    };
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sort, tabId, coChucVu, nguoi.chucVuId]);

  const pageQuery = useChecklistBanGiaoPage(listServerQuery);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const { data: tomTatList = [] } = usePhieuTomTat();
  const { data: mauList = [] } = useMauList();
  const tenMau = useMemo(() => new Map(mauList.map((m) => [m.id, m.ten])), [mauList]);

  const { data: viewingFull } = usePhieuById(viewingId ?? undefined);
  const viewingItem =
    viewingFull ??
    (viewingSeed && viewingSeed.id === viewingId ? viewingSeed : null) ??
    pageList.find((p) => p.id === viewingId) ??
    null;

  const deleteMutation = useDeletePhieu();

  useEffect(() => () => resetState(), [resetState]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const handleDelete = (id: string) => {
    confirm({
      title: t('checklistBanGiao.deleteTitle'),
      message: t('checklistBanGiao.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id);
        if (viewingId === id) {
          setViewingId(null);
          setViewingSeed(null);
        }
      },
    });
  };

  const emptyDescription = tabId === 'cho-toi-kiem-tra'
    ? t(coChucVu ? 'checklistBanGiao.emptyChoToi' : 'checklistBanGiao.emptyKhongChucVu')
    : tabId === 'bi-tra-lai'
      ? t('checklistBanGiao.emptyBiTraLai')
      : t('checklistBanGiao.emptyHint');

  return (
    <div className="flex-1 min-h-0 flex flex-col md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm overflow-hidden">
      <ChecklistBanGiaoToolbar
        data={tomTatList}
        tenMau={tenMau}
        selectedCount={selectedIds.size}
        onAdd={() => setShowTao(true)}
        canCreate={canCreate}
      />
      <div className="flex-1 min-h-0 flex flex-col md:px-4 md:pb-4 pt-1">
        <ChecklistBanGiaoList
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
          columns={columns}
          onResizeColumn={resizeColumn}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={sort}
          onSort={setSort}
          onView={(item) => {
            setViewingSeed(null);
            setViewingId(item.id);
          }}
          onEdit={undefined}
          onDelete={undefined}
          emptyDescription={emptyDescription}
        />
      </div>

      <AnimatePresence>
        {showTao && (
          <TaoPhieuDialog
            onClose={() => setShowTao(false)}
            onCreated={(phieu) => {
              setShowTao(false);
              setViewingSeed(phieu);
              setViewingId(phieu.id);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showTao && (
          <ChecklistBanGiaoDetail
            key={viewingItem.id}
            data={viewingItem}
            onClose={() => {
              setViewingId(null);
              setViewingSeed(null);
            }}
            onDelete={canDelete ? handleDelete : undefined}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
