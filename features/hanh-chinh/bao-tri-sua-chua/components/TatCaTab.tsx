import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { BaoTriSuaChuaListServerQuery } from '../services/bao-tri-sua-chua-list-query';
import { fetchAllPhieuBaoTriForListQuery } from '../services/bao-tri-sua-chua-service';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import BaoTriSuaChuaToolbar from './BaoTriSuaChuaToolbar';
import PhieuBaoTriTable from './PhieuBaoTriTable';
import PhieuBaoTriDetail from './PhieuBaoTriDetail';
import TaoPhieuBaoTriForm from './TaoPhieuBaoTriForm';
import { usePhieuBaoTriPage, useDeletePhieuBaoTri } from '../hooks/use-bao-tri-sua-chua';
import { useBaoTriSuaChuaViewScope } from '../hooks/use-bao-tri-sua-chua-view-scope';
import { useAuthStore } from '../../../../store/useStore';
import { useTaiSanTomTat } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useBaoTriSuaChuaStore } from '../store/useBaoTriSuaChuaStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuBaoTriSuaChua } from '../core/types';
import {
  CHI_PHI_TAI_SAN_LIST_EXPORT_KEYS,
  LIST_EXPORT_SHEET_NAME,
  mapPhieuChiPhiTaiSanListRow,
  getExportColumnsPhieuChiPhiTaiSanList,
  exportFileNamePhieuChiPhiTaiSanList,
} from '../utils/export-bao-tri-sua-chua-danh-sach';

interface Props {
  /** Từ URL ?tai_san_id=... (vd: link từ chi tiết tài sản): lọc theo tài sản và mở form Thêm phiếu với tài sản mặc định */
  defaultTaiSanId?: string;
}

const TatCaTab: React.FC<Props> = ({ defaultTaiSanId }) => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canAdmin } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    selectedIds,
    clearSelection,
    setFilter,
    columns,
    pagination,
  } = useBaoTriSuaChuaStore();
  const user = useAuthStore((s) => s.user);
  const { viewAll } = useBaoTriSuaChuaViewScope();
  const { data: taiSanList = [] } = useTaiSanTomTat();
  /**
   * Phạm vi xem + lọc chi nhánh đều dựa trên TÀI SẢN, nên tính sẵn danh sách id
   * tài sản hợp lệ rồi gửi kèm xuống PostgREST — trước đây tải hết phiếu rồi lọc.
   */
  const idTaiSanChoPhep = useMemo(() => {
    const theoChiNhanh =
      filters.id_chi_nhanh.length > 0
        ? taiSanList.filter((a) => a.id_chi_nhanh != null && filters.id_chi_nhanh.includes(a.id_chi_nhanh))
        : taiSanList;
    if (viewAll) {
      return filters.id_chi_nhanh.length > 0 ? theoChiNhanh.map((a) => a.id) : null;
    }
    const myId = String(user?.id ?? '');
    return theoChiNhanh.filter((a) => String(a.id_nhan_vien_dang_giu) === myId).map((a) => a.id);
  }, [taiSanList, filters.id_chi_nhanh, viewAll, user?.id]);

  const listServerQuery: BaoTriSuaChuaListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      hangMuc: filters.hang_muc ?? [],
      ngayFrom: filters.dateFrom ?? '',
      ngayTo: filters.dateTo ?? '',
      idTaiSan: filters.id_tai_san ?? [],
      trangThai: filters.trang_thai ?? [],
      idNguoiTao: filters.id_nguoi_tao ?? [],
      idTaiSanChoPhep,
      idNguoiTaoCuaToi: viewAll ? null : (user?.id ? String(user.id) : null),
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, idTaiSanChoPhep, viewAll, user?.id]
  );

  const pageQuery = usePhieuBaoTriPage(listServerQuery);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const deleteMutation = useDeletePhieuBaoTri();
  const [showExport, setShowExport] = useState(false);
  const [detailItem, setDetailItem] = useState<PhieuBaoTriSuaChua | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPhieu, setEditingPhieu] = useState<PhieuBaoTriSuaChua | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [defaultAssetId, setDefaultAssetId] = useState<string | undefined>(defaultTaiSanId);

  useEffect(() => resetState, [resetState]);

  useEffect(() => {
    if (!defaultTaiSanId) return;
    setDefaultAssetId(defaultTaiSanId);
    setFilter('id_tai_san', [defaultTaiSanId]);
    setShowForm(true);
  }, [defaultTaiSanId, setFilter]);

  /** Xuất file cần TẤT CẢ bản ghi khớp bộ lọc — chỉ tải khi mở hộp thoại Xuất. */
  const [exportRows, setExportRows] = useState<PhieuBaoTriSuaChua[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllPhieuBaoTriForListQuery(listServerQuery)
      .then((rows) => {
        if (!cancelled) setExportRows(rows);
      })
      .catch(() => {
        if (!cancelled) setExportRows([]);
      })
      .finally(() => {
        if (!cancelled) setExportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showExport, listServerQuery]);

  /** Map tài sản → chi nhánh (từ bản tóm tắt nhẹ), cho drawer chi tiết. */
  const branchMap = useMemo(
    () => new Map(taiSanList.map((a) => [a.id, a.id_chi_nhanh])),
    [taiSanList]
  );

  const exportColumnsList = useMemo(() => getExportColumnsPhieuChiPhiTaiSanList(t), [t]);
  const exportMapList = useCallback((item: PhieuBaoTriSuaChua) => mapPhieuChiPhiTaiSanListRow(item, t), [t]);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData<PhieuBaoTriSuaChua>({
      data: exportRows,
      isOpen: showExport && !exportLoading,
      mapFn: exportMapList,
      pagination,
      selectedIds,
      keyExtractor: (p) => p.id,
    });

  const listExportVisibleKeys = useMemo(() => {
    const allowed = new Set<string>(CHI_PHI_TAI_SAN_LIST_EXPORT_KEYS as unknown as string[]);
    const picked = columns.filter((c) => c.visible && allowed.has(c.id)).map((c) => c.id);
    return picked.length > 0 ? picked : undefined;
  }, [columns]);

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('baoTriSuaChua.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const handleAdd = useCallback(() => {
    setEditingPhieu(null);
    setDefaultAssetId(undefined);
    setShowForm(true);
  }, []);
  const handleView = useCallback((item: PhieuBaoTriSuaChua) => {
    setDetailItem(item);
    setEditingPhieu(null);
    setShowForm(false);
  }, []);
  const handleEdit = useCallback((item: PhieuBaoTriSuaChua) => {
    if (detailItem?.id === item.id) setOpenedFormFromDetailId(item.id);
    else setOpenedFormFromDetailId(null);
    setDetailItem(null);
    setEditingPhieu(item);
    setShowForm(true);
  }, [detailItem?.id]);
  const handleSuccessAfterEdit = useCallback((item: PhieuBaoTriSuaChua) => {
    setShowForm(false);
    setEditingPhieu(null);
    setDetailItem(item);
  }, []);
  const handleDelete = useCallback(
    (item: PhieuBaoTriSuaChua) => {
      confirm({
        title: t('baoTriSuaChua.deleteTitle'),
        message: t('baoTriSuaChua.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate([item.id], {
            onSuccess: () => { if (detailItem?.id === item.id) setDetailItem(null); },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem]
  );
  const handleDeleteMany = useCallback(
    (ids: string[]) => {
      confirm({
        title: t('baoTriSuaChua.bulkDeleteTitle'),
        message: t('baoTriSuaChua.bulkDeleteMessage', { count: ids.length }),
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
    },
    [confirm, t, deleteMutation, detailItem, clearSelection]
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <BaoTriSuaChuaToolbar
          items={pageList}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
          onExport={handleExport}
          showAdd={canCreate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0 overflow-auto">
          <PhieuBaoTriTable
            data={pageList}
            totalRecordsOverride={totalCount}
            isFetching={isFetching}
            isLoading={isLoading}
            onView={handleView}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        </div>
      </div>
      {detailItem && !showForm && (
        <PhieuBaoTriDetail
          data={detailItem}
          onClose={() => setDetailItem(null)}
          canAdmin={canAdmin}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? () => handleDelete(detailItem) : undefined}
          idChiNhanhTaiSan={branchMap.get(String(detailItem.id_tai_san)) ?? null}
        />
      )}
      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsList}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNamePhieuChiPhiTaiSanList()}
            visibleColumnKeys={listExportVisibleKeys}
            sheetName={LIST_EXPORT_SHEET_NAME}
          />
        )}
      </AnimatePresence>

      {showForm && (
        <TaoPhieuBaoTriForm
          key={editingPhieu?.id ?? 'create'}
          onClose={() => {
            const wasFromDetail = openedFormFromDetailId != null;
            const itemToRestore = editingPhieu;
            setShowForm(false);
            setEditingPhieu(null);
            setOpenedFormFromDetailId(null);
            if (wasFromDetail && itemToRestore) {
              const fresh = pageList.find((p) => p.id === itemToRestore.id) ?? itemToRestore;
              setDetailItem(fresh);
            }
          }}
          defaultTaiSanId={defaultAssetId}
          initialData={editingPhieu ?? undefined}
          onSuccessAfterEdit={handleSuccessAfterEdit}
        />
      )}
    </>
  );
};

export default TatCaTab;
