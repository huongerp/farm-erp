import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';
import {
  useChiTietPhieuKhoPTPaged,
  usePhieuKhoPTById,
  useDeletePhieuKhoPT,
} from '../hooks/use-phieu-kho-pt';
import { buildChiTietPhieuKhoPTListServerQuery, fetchAllChiTietPhieuKhoPTForListQuery } from '../services/phieu-kho-pt-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { useChiTietPhieuKhoPTStore } from '../store/useChiTietPhieuKhoPTStore';
import type { ChiTietPhieuKhoPTFlat, PhieuKhoPT } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { FarmHangHoa } from '../../hang-hoa-phan-thuoc/core/types';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import ChiTietToolbar from './ChiTietToolbar';
import ChiTietList from './ChiTietList';
import PhieuKhoPTDetail from './PhieuKhoPTDetail';
import PhieuKhoPTForm from './PhieuKhoPTForm';
import DanhSachKhoForm from '../../../kho-van/danh-sach-kho/components/danh-sach-kho-form';
import HangHoaForm from '../../hang-hoa-phan-thuoc/components/HangHoaForm';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import {
  mapChiTietPhieuKhoPTFlatRow,
  getExportColumnsChiTietPhieuKhoPT,
  exportFileNamePhieuKhoPTChiTiet,
} from '../utils/export-phieu-kho-pt-danh-sach';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';

const ChiTietTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
  const { canCreate: canCreateHangHoa } = useModulePermission('quan-ly-farm/hang-hoa-phan-thuoc');
  const { data: khoList = [] } = useKhoList();
  const { data: empRef = [] } = useEmployeesRefQuery();
  const confirm = useConfirmStore((s) => s.confirm);

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
  } = useChiTietPhieuKhoPTStore(
    useShallow((s) => ({
      searchTerm: s.searchTerm,
      filters: s.filters,
      resetState: s.resetState,
      pagination: s.pagination,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      sort: s.sort,
      setSort: s.setSort,
      columns: s.columns,
    }))
  );

  const emptySelectedIds = useMemo(() => new Set<string>(), []);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<ChiTietPhieuKhoPTFlat[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [viewingPhieuId, setViewingPhieuId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKhoPT | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [showAddKho, setShowAddKho] = useState(false);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const addKhoResolveRef = useRef<(k: Kho | null) => void>(null);
  const addHangHoaResolveRef = useRef<(h: FarmHangHoa | null) => void>(null);

  const { data: viewingPhieu } = usePhieuKhoPTById(viewingPhieuId ?? undefined);
  const { data: editingPhieuFull } = usePhieuKhoPTById(editingItem?.id);
  const deleteMutation = useDeletePhieuKhoPT();

  const dateRangeStr = useMemo(() => {
    const range = getDateRangeFromPreset(
      (filters.datePreset ?? 'all') as DateRangePresetId,
      filters.customDateFrom ? new Date(filters.customDateFrom) : undefined,
      filters.customDateEnd ? new Date(filters.customDateEnd) : undefined
    );
    const toYyyyMmDd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: toYyyyMmDd(range.start), end: toYyyyMmDd(range.end) };
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const listServerQuery = useMemo(
    () =>
      buildChiTietPhieuKhoPTListServerQuery({
        searchTerm,
        filters,
        ngayFrom: dateRangeStr.start,
        ngayTo: dateRangeStr.end,
      }),
    [searchTerm, filters, dateRangeStr.start, dateRangeStr.end]
  );

  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);

  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = useChiTietPhieuKhoPTPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);

  const exportColumnsChiTiet = useMemo(() => getExportColumnsChiTietPhieuKhoPT(t), [t]);
  const exportMapChiTiet = useCallback((row: ChiTietPhieuKhoPTFlat) => mapChiTietPhieuKhoPTFlatRow(row), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMapChiTiet,
    pagination,
    selectedIds: emptySelectedIds,
    keyExtractor: (row) => row.id,
  });

  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllChiTietPhieuKhoPTForListQuery(listServerQuery)
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
      toast.warning(t('phieuKhoPhanThuoc.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const handleRowClick = useCallback((row: ChiTietPhieuKhoPTFlat) => {
    setViewingPhieuId(row.id_phieu_kho);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setViewingPhieuId(null);
  }, []);

  const handleEdit = useCallback((item: PhieuKhoPT) => {
    setEditingItem(item);
    setIsCopyMode(false);
    setShowForm(true);
  }, []);

  const handleCopy = useCallback((item: PhieuKhoPT) => {
    const copy: PhieuKhoPT = {
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
    setViewingPhieuId(null);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      confirm({
        title: t('phieuKhoPhanThuoc.deleteTitle'),
        message: t('phieuKhoPhanThuoc.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          deleteMutation.mutate(id, {
            onSuccess: () => {
              setViewingPhieuId(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation]
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

  return (
    <div className="flex flex-col flex-1 min-h-0 mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ChiTietToolbar
        data={tableRows}
        chipCountsMode="unweighted"
        employeesForChips={empRef}
        khoList={khoList}
        onExport={handleExport}
      />

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <ChiTietList
          rows={tableRows}
          visibleColumns={visibleColumns}
          sort={sort}
          setSort={setSort}
          isLoading={isLoading}
          isFetchingOverlay={isFetchingOverlay}
          totalCount={totalCount}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRowClick={handleRowClick}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PhieuKhoPTForm
            khoList={khoList}
            initialData={isCopyMode ? editingItem : (editingPhieuFull ?? editingItem)}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
              setIsCopyMode(false);
            }}
            onRequestAddKho={() =>
              new Promise<Kho | null>((resolve) => {
                addKhoResolveRef.current = resolve;
                setShowAddKho(true);
              })
            }
            onRequestAddHangHoa={
              canCreateHangHoa
                ? () =>
                    new Promise<FarmHangHoa | null>((resolve) => {
                      addHangHoaResolveRef.current = resolve;
                      setShowAddHangHoa(true);
                    })
                : undefined
            }
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
          <HangHoaForm
            initialData={null}
            onSuccessCreate={(created) => {
              const r = addHangHoaResolveRef.current;
              addHangHoaResolveRef.current = null;
              r?.(created);
            }}
            onClose={() => {
              setShowAddHangHoa(false);
              const r = addHangHoaResolveRef.current;
              addHangHoaResolveRef.current = null;
              r?.(null);
            }}
          />
        )}
      </AnimatePresence>

      {viewingPhieuId && viewingPhieu && !showForm && (
        <PhieuKhoPTDetail
          data={viewingPhieu}
          onClose={handleCloseDetail}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onCopy={canCreate ? handleCopy : undefined}
          canApprove={canApprove}
        />
      )}

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsChiTiet}
            data={exportLoading ? [] : exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNamePhieuKhoPTChiTiet()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChiTietTab;
