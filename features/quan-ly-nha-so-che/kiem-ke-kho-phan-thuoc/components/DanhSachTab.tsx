import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import Select from '../../../../components/ui/Select';
import { CONFIRM_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import KiemKeKhoPTToolbar from './KiemKeKhoPTToolbar';
import DotKiemKePTList from './DotKiemKePTList';
import DotKiemKePTDetail from './DotKiemKePTDetail';
import DotKiemKePTForm from './DotKiemKePTForm';
import TaoDanhSachKiemKePTDialog from './TaoDanhSachKiemKePTDialog';
import {
  useDotKiemKePTPage,
  useDotKiemKePTTomTat,
  useDotKiemKePTById,
  useChiTietKiemKePT,
  useDeleteDotKiemKePT,
  useTaoDanhSachKiemKePT,
  useHoanThanhDotPT,
  useChangeTrangThaiDotPT,
} from '../hooks/use-kiem-ke-pt';
import { useKiemKeKhoPTViewScope } from '../hooks/use-kiem-ke-pt-view-scope';
import { useKiemKeKhoPTStore } from '../store/useKiemKeKhoPTStore';
import {
  buildDotKiemKePTListServerQuery,
  khoChoPhepTheoPhamVi,
  fetchAllDotKiemKePTForListQuery,
} from '../services/kiem-ke-pt-service';
import { TRANG_THAI_DOT_OPTIONS_PT } from '../core/constants';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import {
  exportColumnsDotKiemKePT,
  exportMapDotKiemKePT,
  exportFileNameDotKiemKePT,
} from '../utils/export-kiem-ke-pt-danh-sach';
import type { DotKiemKePT, TrangThaiDotKiemKePT } from '../core/types';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    pagination,
    sort,
    setSort,
    setPage,
    setPageSize,
    resetState,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
  } = useKiemKeKhoPTStore();
  const { data: khoList = [] } = useKhoList();
  const viewScope = useKiemKeKhoPTViewScope();

  const listQuery = useMemo(
    () =>
      buildDotKiemKePTListServerQuery({
        searchTerm,
        filters,
        pagination,
        sort: { column: sort.column, direction: sort.direction },
        viewScope,
        khoList,
      }),
    [searchTerm, filters, pagination, sort, viewScope, khoList]
  );

  /** Phạm vi xem cho bản tóm tắt — cùng nguồn suy luận với truy vấn danh sách. */
  const phamVi = useMemo(
    () => ({
      viewAll: viewScope.viewAll,
      allowedKhoIds: khoChoPhepTheoPhamVi(viewScope, khoList),
      currentEmployeeId: viewScope.currentEmployeeId,
    }),
    [viewScope, khoList]
  );

  const pageQuery = useDotKiemKePTPage(listQuery);
  const { data: tomTat = [] } = useDotKiemKePTTomTat(phamVi);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const deleteMutation = useDeleteDotKiemKePT();
  const taoDanhSachMutation = useTaoDanhSachKiemKePT();
  const hoanThanhMutation = useHoanThanhDotPT();
  const changeTrangThaiMutation = useChangeTrangThaiDotPT();

  const [detailItem, setDetailItem] = useState<DotKiemKePT | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDot, setEditingDot] = useState<DotKiemKePT | null>(null);
  const [showTaoDanhSachDialog, setShowTaoDanhSachDialog] = useState(false);
  const [dotIdForTaoDanhSach, setDotIdForTaoDanhSach] = useState<string | null>(null);

  useEffect(() => () => resetState(), [resetState]);

  const handleAdd = useCallback(() => {
    setEditingDot(null);
    setShowForm(true);
  }, []);
  const handleView = useCallback((item: DotKiemKePT) => {
    setDetailItem(item);
    setEditingDot(null);
    setShowForm(false);
  }, []);
  const handleEdit = useCallback((item: DotKiemKePT) => {
    setDetailItem(null);
    setEditingDot(item);
    setShowForm(true);
  }, []);
  const handleSuccessAfterEdit = useCallback((item: DotKiemKePT) => {
    setShowForm(false);
    setEditingDot(null);
    setDetailItem(item);
  }, []);

  const handleDelete = useCallback(
    (item: DotKiemKePT) => {
      confirm({
        title: t('kiemKeKhoPT.deleteTitle'),
        message: t('kiemKeKhoPT.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate([item.id], {
            onSuccess: () => {
              if (detailItem?.id === item.id) setDetailItem(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem]
  );

  const handleDeleteMany = useCallback(
    (ids: string[]) => {
      confirm({
        title: t('kiemKeKhoPT.bulkDeleteTitle'),
        message: t('kiemKeKhoPT.bulkDeleteMessage', { count: ids.length }),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate(ids, {
            onSuccess: () => {
              if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
              clearSelection();
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem, clearSelection]
  );

  const handleStatusChange = useCallback(
    (dot: DotKiemKePT) => {
      let selectedTrangThai: TrangThaiDotKiemKePT = dot.trang_thai;
      confirm({
        title: t('kiemKeKhoPT.changeStatusTitle'),
        message: (
          <div className="space-y-4 text-left py-2">
            <p className="text-body-sm">{t('kiemKeKhoPT.changeStatusMessage')}</p>
            <Select
              defaultValue={dot.trang_thai}
              options={TRANG_THAI_DOT_OPTIONS_PT.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
              onChange={(e) => {
                selectedTrangThai = e.target.value as TrangThaiDotKiemKePT;
              }}
            />
          </div>
        ),
        variant: 'info',
        confirmText: CONFIRM_YES(),
        onConfirm: () => changeTrangThaiMutation.mutate({ id: dot.id, trang_thai: selectedTrangThai }),
      });
    },
    [confirm, t, changeTrangThaiMutation]
  );

  /**
   * Xuất file cần TẤT CẢ đợt khớp bộ lọc, không chỉ trang đang xem — nên chỉ tải
   * khi người dùng thực sự mở hộp thoại Xuất.
   */
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<DotKiemKePT[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllDotKiemKePTForListQuery(listQuery)
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
  }, [showExport, listQuery]);

  const exportColumns = useMemo(() => exportColumnsDotKiemKePT(t), [t]);
  const exportMapFn = useMemo(() => exportMapDotKiemKePT(t), [t]);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  const { data: detailDot } = useDotKiemKePTById(detailItem?.id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietKiemKePT(detailItem?.id ?? null);
  const detailData = detailDot ?? detailItem;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <KiemKeKhoPTToolbar
        tomTat={tomTat}
        onAdd={handleAdd}
        onDeleteMany={handleDeleteMany}
        onExport={() => setShowExport(true)}
        canCreate={canCreate}
        canDelete={canDelete}
      />

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <DotKiemKePTList
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={sort}
          onSort={setSort}
          onView={handleView}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          showActions
        />
      </div>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNameDotKiemKePT()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailData && (
          <DotKiemKePTDetail
            data={detailData}
            chiTiet={chiTiet}
            chiTietLoading={chiTietLoading}
            onClose={() => setDetailItem(null)}
            onEdit={canUpdate ? handleEdit : undefined}
            onTaoDanhSach={
              canUpdate
                ? () => {
                    setDotIdForTaoDanhSach(detailData.id);
                    setShowTaoDanhSachDialog(true);
                  }
                : undefined
            }
            onHoanThanh={canUpdate ? () => hoanThanhMutation.mutate(detailData.id) : undefined}
            onStatusChange={canUpdate ? handleStatusChange : undefined}
            taoDanhSachLoading={taoDanhSachMutation.isPending}
            hoanThanhLoading={hoanThanhMutation.isPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <DotKiemKePTForm
            initialData={editingDot}
            onClose={() => {
              setShowForm(false);
              setEditingDot(null);
            }}
            onSuccessAfterEdit={handleSuccessAfterEdit}
          />
        )}
      </AnimatePresence>

      <TaoDanhSachKiemKePTDialog
        open={showTaoDanhSachDialog}
        onClose={() => {
          setShowTaoDanhSachDialog(false);
          setDotIdForTaoDanhSach(null);
        }}
        onConfirm={(id_dot, filtersTao) => {
          taoDanhSachMutation.mutate(
            { id_dot, filters: filtersTao },
            {
              onSettled: () => {
                setShowTaoDanhSachDialog(false);
                setDotIdForTaoDanhSach(null);
              },
            }
          );
        }}
        isLoading={taoDanhSachMutation.isPending}
        dotId={dotIdForTaoDanhSach ?? detailData?.id ?? null}
        idKhoOfDot={detailData?.id_kho}
      />
    </div>
  );
};

export default DanhSachTab;
