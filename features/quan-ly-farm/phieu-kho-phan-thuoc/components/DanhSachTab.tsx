import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';
import {
  usePhieuKhoPTListPaged,
  usePhieuKhoPTById,
  useDeletePhieuKhoPT,
  useDeletePhieuKhoPTMany,
} from '../hooks/use-phieu-kho-pt';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { buildPhieuKhoPTListServerQuery, fetchAllPhieuKhoPTForListQuery } from '../services/phieu-kho-pt-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { usePhieuKhoPTStore } from '../store/usePhieuKhoPTStore';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuKhoPT } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachList from './DanhSachList';
import PhieuKhoPTForm from './PhieuKhoPTForm';
import PhieuKhoPTDetail from './PhieuKhoPTDetail';
import DanhSachKhoForm from '../../../kho-van/danh-sach-kho/components/danh-sach-kho-form';
import HangHoaForm from '../../hang-hoa-phan-thuoc/components/HangHoaForm';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { mapPhieuKhoPTListRow, getExportColumnsPhieuKhoPTList, exportFileNamePhieuKhoPTDanhSach } from '../utils/export-phieu-kho-pt-danh-sach';
import type { FarmHangHoa } from '../../hang-hoa-phan-thuoc/core/types';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canApprove } = useModulePermissionFromContext();
  const { canCreate: canCreateHangHoa } = useModulePermission('quan-ly-farm/hang-hoa-phan-thuoc');
  const confirm = useConfirmStore((s) => s.confirm);
  const searchTerm = usePhieuKhoPTStore((s) => s.searchTerm);
  const filters = usePhieuKhoPTStore((s) => s.filters);
  const resetState = usePhieuKhoPTStore((s) => s.resetState);
  const selectedIds = usePhieuKhoPTStore((s) => s.selectedIds);
  const clearSelection = usePhieuKhoPTStore((s) => s.clearSelection);
  const toggleSelection = usePhieuKhoPTStore((s) => s.toggleSelection);
  const toggleAllSelection = usePhieuKhoPTStore((s) => s.toggleAllSelection);
  const pagination = usePhieuKhoPTStore((s) => s.pagination);
  const setPage = usePhieuKhoPTStore((s) => s.setPage);
  const setPageSize = usePhieuKhoPTStore((s) => s.setPageSize);
  const columns = usePhieuKhoPTStore((s) => s.columns);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKhoPT | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [viewingItem, setViewingItem] = useState<PhieuKhoPT | null>(null);
  const [showAddKho, setShowAddKho] = useState(false);
  const [showAddHangHoa, setShowAddHangHoa] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<PhieuKhoPT[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const addKhoResolveRef = useRef<(k: Kho | null) => void>(null);
  const addHangHoaResolveRef = useRef<(h: FarmHangHoa | null) => void>(null);

  const { data: khoList = [] } = useKhoList();
  const { data: empRef = [] } = useEmployeesRefQuery();
  const { data: viewingPhieuFull } = usePhieuKhoPTById(viewingItem?.id);
  const { data: editingPhieuFull } = usePhieuKhoPTById(editingItem?.id);
  const deleteMutation = useDeletePhieuKhoPT();
  const deleteManyMutation = useDeletePhieuKhoPTMany();

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
      buildPhieuKhoPTListServerQuery({
        searchTerm,
        filters,
        ngayFrom: dateRangeStr.start,
        ngayTo: dateRangeStr.end,
      }),
    [searchTerm, filters, dateRangeStr.start, dateRangeStr.end]
  );

  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);

  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = usePhieuKhoPTListPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isInitialLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const exportColumns = useMemo(() => getExportColumnsPhieuKhoPTList(t), [t]);
  const exportMap = useCallback((item: PhieuKhoPT) => mapPhieuKhoPTListRow(item), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMap,
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
    fetchAllPhieuKhoPTForListQuery(listServerQuery)
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

  const handleEdit = (item: PhieuKhoPT) => {
    setEditingItem(item);
    setIsCopyMode(false);
    setShowForm(true);
  };

  const handleCopy = (item: PhieuKhoPT) => {
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
    setViewingItem(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuKhoPhanThuoc.deleteTitle'),
      message: t('phieuKhoPhanThuoc.deleteMessage'),
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
      title: t('phieuKhoPhanThuoc.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  const canEditItem = (item: PhieuKhoPT) => item.trang_thai === 'Chờ duyệt';

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DanhSachToolbar
        data={tableRows}
        chipCountsMode="unweighted"
        employeesForChips={empRef}
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
        <DanhSachList
          data={tableRows}
          serverTotalCount={totalCount}
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

      <AnimatePresence>
        {viewingItem && !showForm && (
          <PhieuKhoPTDetail
            data={viewingPhieuFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={
              canUpdate
                ? (item) => {
                    setViewingItem(null);
                    handleEdit(item);
                  }
                : undefined
            }
            onDelete={canDelete ? (id) => { setViewingItem(null); handleDelete(id); } : undefined}
            onCopy={canCreate ? handleCopy : undefined}
            canApprove={canApprove}
          />
        )}
      </AnimatePresence>

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        columns={exportColumns}
        data={exportLoading ? [] : exportData}
        paginatedData={paginatedExportData}
        selectedData={selectedExportData}
        fileName={exportFileNamePhieuKhoPTDanhSach()}
      />
    </div>
  );
};

export default DanhSachTab;
