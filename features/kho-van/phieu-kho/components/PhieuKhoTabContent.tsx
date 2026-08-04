import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';
import { usePhieuKhoListPaged, usePhieuKhoById, useDeletePhieuKho, useDeletePhieuKhoMany } from '../hooks/use-phieu-kho';
import { usePhieuKhoViewScope } from '../hooks/use-phieu-kho-view-scope';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { buildPhieuKhoListServerQuery, fetchAllPhieuKhoForListQuery } from '../services/phieu-kho-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useEmployeesRefQuery, useDoiTacRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { usePhieuKhoStore } from '../store/usePhieuKhoStore';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import { canMutatePhieuKhoByTrangThai } from '../core/constants';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import type { DoiTac } from '../../danh-sach-doi-tac/core/types';
import PhieuKhoToolbar from './PhieuKhoToolbar';
import PhieuKhoList from './PhieuKhoList';
import PhieuKhoForm from './PhieuKhoForm';
import PhieuKhoDetail from './PhieuKhoDetail';
import DanhSachKhoForm from '../../danh-sach-kho/components/danh-sach-kho-form';
import DanhSachHangHoaForm from '../../danh-sach-hang-hoa/components/DanhSachHangHoaForm';
import DoiTacForm from '../../danh-sach-doi-tac/components/DoiTacForm';
import { useNhomDoiTacList, useTagList, useDoiTacList } from '../../danh-sach-doi-tac/hooks/use-doi-tac';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import {
  mapPhieuKhoListRow,
  getExportColumnsPhieuKhoList,
  exportFileNamePhieuKhoTab,
} from '../utils/export-phieu-kho-danh-sach';

interface Props {
  loai: LoaiPhieuKhoTab;
}

const PhieuKhoTabContent: React.FC<Props> = ({ loai: loaiTab }) => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
  const { canCreate: canCreateHangHoa } = useModulePermission('kho-van/danh-sach-hang-hoa');
  const { canUpdate: canUpdateDoiTac } = useModulePermission('kho-van/danh-sach-doi-tac');
  const confirm = useConfirmStore((s) => s.confirm);
  const searchTerm = usePhieuKhoStore((s) => s.searchTerm);
  const filters = usePhieuKhoStore((s) => s.filters);
  const resetState = usePhieuKhoStore((s) => s.resetState);
  const selectedIds = usePhieuKhoStore((s) => s.selectedIds);
  const columns = usePhieuKhoStore((s) => s.columns);
  const clearSelection = usePhieuKhoStore((s) => s.clearSelection);
  const toggleSelection = usePhieuKhoStore((s) => s.toggleSelection);
  const toggleAllSelection = usePhieuKhoStore((s) => s.toggleAllSelection);
  const pagination = usePhieuKhoStore((s) => s.pagination);
  const setPage = usePhieuKhoStore((s) => s.setPage);
  const setPageSize = usePhieuKhoStore((s) => s.setPageSize);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKho | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [viewingItem, setViewingItem] = useState<PhieuKho | null>(null);
  const [showAddKho, setShowAddKho] = useState(false);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const [showAddDoiTac, setShowAddDoiTac] = useState<'nha_cung_cap' | 'khach_hang' | null>(null);
  const [editingDoiTacNested, setEditingDoiTacNested] = useState<DoiTac | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<PhieuKho[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const addKhoResolveRef = useRef<(k: Kho | null) => void>(null);
  const addHangHoaResolveRef = useRef<(h: HangHoa | null) => void>(null);
  const addDoiTacResolveRef = useRef<(d: DoiTac | null) => void>(null);

  const { data: khoList = [] } = useKhoList();
  const { data: empRef = [] } = useEmployeesRefQuery();
  const { data: doiTacNccRef = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: doiTacKhRef = [] } = useDoiTacRefQuery('khach_hang');
  const { data: nhomList = [] } = useNhomDoiTacList();
  const { data: tagList = [] } = useTagList();
  const { data: doiTacListAll = [] } = useDoiTacList();
  const viewScope = usePhieuKhoViewScope();
  const nextThuTuDoiTac = useMemo(() => {
    const list = showAddDoiTac ? doiTacListAll.filter((d) => d.loai_doi_tac === showAddDoiTac) : [];
    return list.length === 0 ? 1 : Math.max(...list.map((d) => d.thu_tu ?? 0)) + 1;
  }, [doiTacListAll, showAddDoiTac]);
  const { data: viewingPhieuFull } = usePhieuKhoById(viewingItem?.id);
  const { data: editingPhieuFull } = usePhieuKhoById(editingItem?.id);
  const deleteMutation = useDeletePhieuKho();
  const deleteManyMutation = useDeletePhieuKhoMany();

  const dateRangeStr = useMemo(() => {
    const dp = typeof filters.datePreset === 'string' ? filters.datePreset : 'all';
    const cf = typeof filters.customDateFrom === 'string' ? filters.customDateFrom : '';
    const ce = typeof filters.customDateEnd === 'string' ? filters.customDateEnd : '';
    const range = getDateRangeFromPreset(
      dp as DateRangePresetId,
      cf ? new Date(cf) : undefined,
      ce ? new Date(ce) : undefined
    );
    const toYyyyMmDd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: toYyyyMmDd(range.start), end: toYyyyMmDd(range.end) };
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const listServerQuery = useMemo(
    () =>
      buildPhieuKhoListServerQuery({
        loaiTab,
        searchTerm,
        filters,
        ngayFrom: dateRangeStr.start,
        ngayTo: dateRangeStr.end,
        viewScope,
        khoList,
      }),
    [loaiTab, searchTerm, filters, dateRangeStr.start, dateRangeStr.end, viewScope, khoList]
  );

  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);

  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = usePhieuKhoListPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isInitialLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const doiTacForChips = useMemo(() => {
    if (loaiTab === 'nhap') return doiTacNccRef.map((d) => ({ id: d.id, ten_ncc: d.ten_ncc }));
    if (loaiTab === 'xuat') return doiTacKhRef.map((d) => ({ id: d.id, ten_ncc: d.ten_ncc }));
    return [];
  }, [loaiTab, doiTacNccRef, doiTacKhRef]);

  const exportColumnsPhieuKho = useMemo(() => getExportColumnsPhieuKhoList(t), [t]);
  const exportMapPhieuKho = useCallback((item: PhieuKho) => mapPhieuKhoListRow(item), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData<PhieuKho>({
      data: exportRows,
      isOpen: showExport && !exportLoading,
      mapFn: exportMapPhieuKho,
      pagination,
      selectedIds,
      keyExtractor: (p) => p.id,
    });

  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllPhieuKhoForListQuery(listServerQuery)
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
  }, [showExport, listQueryKey, listServerQuery]);

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('phieuKho.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const openEditDoiTac = useCallback(
    (id: string) => {
      const d = doiTacListAll.find((x) => x.id === id);
      if (!d) {
        toast.error(t('phieuKho.form.partnerEditNotFound'));
        return;
      }
      setEditingDoiTacNested(d);
    },
    [doiTacListAll, t]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    setPage(1);
  }, [listQueryKey, setPage]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = tableRows.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [tableRows, viewingItem]);

  const handleEdit = (item: PhieuKho) => {
    if (!canMutatePhieuKhoByTrangThai(item.trang_thai, canUpdate, canApprove)) {
      toast.message(t('phieuKho.cannotMutateApproved'));
      return;
    }
    setEditingItem(item);
    setIsCopyMode(false);
    setShowForm(true);
  };

  const handleCopy = (item: PhieuKho) => {
    const copy: PhieuKho = {
      ...item,
      id: '',
      so_phieu: '',
      trang_thai: 'Chờ duyệt',
      trao_doi: undefined,
      id_nguoi_duyet: undefined,
      ten_nguoi_duyet: undefined,
      nguoi_tao_id: undefined,
      ten_nguoi_tao: undefined,
      ngay: new Date().toISOString().slice(0, 10),
    };
    setEditingItem(copy);
    setIsCopyMode(true);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const item = tableRows.find((p) => p.id === id) ?? (viewingItem?.id === id ? viewingItem : null);
    if (item && !canMutatePhieuKhoByTrangThai(item.trang_thai, canDelete, canApprove)) {
      toast.message(t('phieuKho.cannotMutateApproved'));
      return;
    }
    confirm({
      title: t('phieuKho.deleteTitle'),
      message: t('phieuKho.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const selected = Array.from(selectedIds);
    const allowedIds = selected.filter((id) => {
      const item = tableRows.find((p) => p.id === id);
      return item && canMutatePhieuKhoByTrangThai(item.trang_thai, canDelete, canApprove);
    });
    if (allowedIds.length === 0) {
      toast.message(t('phieuKho.toast.deleteManyNoneAllowed'));
      return;
    }
    const skipped = selected.length - allowedIds.length;
    confirm({
      title: t('phieuKho.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: allowedIds.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        if (skipped > 0) toast.message(t('phieuKho.toast.deleteManyPartial'));
        await deleteManyMutation.mutateAsync(allowedIds);
        clearSelection();
        if (viewingItem && allowedIds.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  const canEditItem = useCallback(
    (item: PhieuKho) => canMutatePhieuKhoByTrangThai(item.trang_thai, canUpdate, canApprove),
    [canUpdate, canApprove]
  );
  const canDeleteItem = useCallback(
    (item: PhieuKho) => canMutatePhieuKhoByTrangThai(item.trang_thai, canDelete, canApprove),
    [canDelete, canApprove]
  );

  const detailPhieu = viewingPhieuFull ?? viewingItem;
  const detailCanEdit = detailPhieu
    ? canMutatePhieuKhoByTrangThai(detailPhieu.trang_thai, canUpdate, canApprove)
    : false;
  const detailCanDelete = detailPhieu
    ? canMutatePhieuKhoByTrangThai(detailPhieu.trang_thai, canDelete, canApprove)
    : false;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <PhieuKhoToolbar
        data={tableRows}
        chipCountsMode="unweighted"
        employeesForChips={empRef}
        doiTacForChips={doiTacForChips}
        loai={loaiTab}
        khoList={khoList}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onExport={handleExport}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <PhieuKhoList
          data={tableRows}
          serverTotalCount={totalCount}
          loai={loaiTab}
          columns={columns}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isInitialLoading}
          isFetching={isFetchingOverlay}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onView={setViewingItem}
          canEditItem={canEditItem}
          canDeleteItem={canDeleteItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PhieuKhoForm
            loai={loaiTab}
            khoList={khoList}
            initialData={isCopyMode ? editingItem : (editingPhieuFull ?? editingItem)}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
              setIsCopyMode(false);
            }}
            onRequestAddKho={
              () =>
                new Promise<Kho | null>((resolve) => {
                  addKhoResolveRef.current = resolve;
                  setShowAddKho(true);
                })
            }
            onRequestAddHangHoa={
              canCreateHangHoa
                ? () =>
                    new Promise<HangHoa | null>((resolve) => {
                      addHangHoaResolveRef.current = resolve;
                      setShowAddHangHoa(true);
                    })
                : undefined
            }
            onRequestAddNcc={
              loaiTab === 'nhap'
                ? () =>
                    new Promise<DoiTac | null>((resolve) => {
                      addDoiTacResolveRef.current = resolve;
                      setShowAddDoiTac('nha_cung_cap');
                    })
                : undefined
            }
            onRequestAddKh={
              loaiTab === 'xuat'
                ? () =>
                    new Promise<DoiTac | null>((resolve) => {
                      addDoiTacResolveRef.current = resolve;
                      setShowAddDoiTac('khach_hang');
                    })
                : undefined
            }
            onRequestEditNcc={loaiTab === 'nhap' && canUpdateDoiTac ? openEditDoiTac : undefined}
            onRequestEditKh={loaiTab === 'xuat' && canUpdateDoiTac ? openEditDoiTac : undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddKho && (
          <DanhSachKhoForm
            initialData={null}
            onClose={() => {
              setShowAddKho(false);
              addKhoResolveRef.current?.(null);
              addKhoResolveRef.current = null;
            }}
            onSuccessCreate={(kho) => {
              addKhoResolveRef.current?.(kho);
              setShowAddKho(false);
              addKhoResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddHangHoa && (
          <DanhSachHangHoaForm
            initialData={null}
            onClose={() => {
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current?.(null);
              addHangHoaResolveRef.current = null;
            }}
            onSuccessCreate={(item) => {
              addHangHoaResolveRef.current?.(item);
              setShowAddHangHoa(false);
              addHangHoaResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddDoiTac && (
          <DoiTacForm
            stackLevel={1}
            initialData={null}
            loaiDoiTac={showAddDoiTac}
            nhomList={nhomList}
            tagList={tagList}
            defaultThuTu={nextThuTuDoiTac}
            onClose={() => {
              setShowAddDoiTac(null);
              addDoiTacResolveRef.current?.(null);
              addDoiTacResolveRef.current = null;
            }}
            onSuccessCreate={(item) => {
              addDoiTacResolveRef.current?.(item);
              setShowAddDoiTac(null);
              addDoiTacResolveRef.current = null;
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingDoiTacNested && (
          <DoiTacForm
            stackLevel={1}
            initialData={editingDoiTacNested}
            loaiDoiTac={editingDoiTacNested.loai_doi_tac}
            nhomList={nhomList}
            tagList={tagList}
            onClose={() => setEditingDoiTacNested(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <PhieuKhoDetail
            data={viewingPhieuFull ?? viewingItem}
            loai={loaiTab}
            onClose={() => setViewingItem(null)}
            onEdit={detailCanEdit ? handleEdit : undefined}
            onDelete={detailCanDelete ? handleDelete : undefined}
            onCopy={canCreate ? handleCopy : undefined}
            canApprove={canApprove}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsPhieuKho}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNamePhieuKhoTab(loaiTab)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhieuKhoTabContent;
