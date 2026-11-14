/** Quản lý nhà sơ chế > Nhật ký pha phèn. */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BookOpen, FileSpreadsheet, Waves } from 'lucide-react';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import ExportDialog from '../../../components/shared/LazyExportDialog';
import TabGroup from '../../../components/ui/TabGroup';
import { useExportData } from '../../../lib/useExportData';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { useBranches } from '../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { NhatKyPhaPhen } from './core/types';
import type { NhatKyPhaPhenListServerQuery } from './services/nhat-ky-pha-phen-list-query';
import { fetchAllNkppForListQuery } from './services/nhat-ky-pha-phen-service';
import {
  useDeleteNhatKyPhaPhen,
  useDeleteNhatKyPhaPhenMany,
  useNhatKyPhaPhenById,
  useNhatKyPhaPhenPage,
  useNhatKyPhaPhenTomTat,
} from './hooks/use-nhat-ky-pha-phen';
import { useNhatKyPhaPhenViewScope } from './hooks/use-nhat-ky-pha-phen-view-scope';
import { useNhatKyPhaPhenStore } from './store/useNhatKyPhaPhenStore';
import {
  exportFileNameNhatKyPhaPhen,
  getExportColumnsNhatKyPhaPhen,
  mapNhatKyPhaPhenRow,
} from './utils/export-nhat-ky-pha-phen';
import NhatKyPhaPhenToolbar from './components/NhatKyPhaPhenToolbar';
import NhatKyPhaPhenList from './components/NhatKyPhaPhenList';
import NhatKyPhaPhenForm from './components/NhatKyPhaPhenForm';
import NhatKyPhaPhenDetail from './components/NhatKyPhaPhenDetail';
import CaiDatHoTab from './components/CaiDatHoTab';
import ChiTietTab from './components/ChiTietTab';

const VALID_TABS = ['nhat-ky', 'chi-tiet', 'cai-dat-ho'] as const;
type TabId = (typeof VALID_TABS)[number];

const NhatKyPhaPhenPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canAdmin } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    resizeColumn,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
  } = useNhatKyPhaPhenStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>('nhat-ky');
  const tabFromUrl = searchParams.get('tab');
  // Tham số ?tab= đổi (kể cả lần render đầu) → đồng bộ tab; chỉnh state ngay khi render thay vì effect.
  const [prevTabFromUrl, setPrevTabFromUrl] = useState<string | null | undefined>(undefined);
  if (prevTabFromUrl !== tabFromUrl) {
    setPrevTabFromUrl(tabFromUrl);
    if (VALID_TABS.includes(tabFromUrl as TabId)) setTab(tabFromUrl as TabId);
  }
  const handleTabChange = (id: string) => {
    if (!VALID_TABS.includes(id as TabId)) return;
    setTab(id as TabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', id);
      return next;
    });
  };

  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingItem, setEditingItem] = useState<NhatKyPhaPhen | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const viewScope = useNhatKyPhaPhenViewScope();

  const listServerQuery: NhatKyPhaPhenListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: filters.nam ?? [],
      thang: filters.thang ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const pageQuery = useNhatKyPhaPhenPage(listServerQuery, !viewScope.isLoading && tab === 'nhat-ky');
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const { data: tomTatList = [] } = useNhatKyPhaPhenTomTat(viewScope.viewAll, viewScope.allowedBranchIds, !viewScope.isLoading);
  const { data: branches = [] } = useBranches();
  const { data: viewingFull } = useNhatKyPhaPhenById(viewingId ?? undefined);
  const viewingItem = viewingFull ?? pageList.find((p) => p.id === viewingId) ?? null;

  const deleteMutation = useDeleteNhatKyPhaPhen();
  const deleteManyMutation = useDeleteNhatKyPhaPhenMany();

  /** Xuất file cần TẤT CẢ bản ghi khớp bộ lọc — chỉ tải khi mở hộp thoại Xuất. */
  const exportRequest = useMemo(() => (showExport ? { query: listServerQuery } : null), [showExport, listServerQuery]);
  const [exportResult, setExportResult] = useState<{
    request: { query: NhatKyPhaPhenListServerQuery };
    rows: NhatKyPhaPhen[];
  } | null>(null);
  const exportLoading = exportRequest !== null && exportResult?.request !== exportRequest;
  const exportRows = useMemo(() => {
    if (exportRequest === null || exportResult?.request !== exportRequest) return [];
    // Bố cục mẫu theo tháng: ngày tăng dần (cùng ngày thì theo NSC).
    return [...exportResult.rows].sort(
      (a, b) => a.ngay.localeCompare(b.ngay) || (a.ten_chi_nhanh ?? '').localeCompare(b.ten_chi_nhanh ?? '', 'vi')
    );
  }, [exportRequest, exportResult]);
  useEffect(() => {
    if (!exportRequest) return;
    let cancelled = false;
    fetchAllNkppForListQuery(exportRequest.query)
      .then((rows) => !cancelled && setExportResult({ request: exportRequest, rows }))
      .catch(() => !cancelled && setExportResult({ request: exportRequest, rows: [] }));
    return () => {
      cancelled = true;
    };
  }, [exportRequest]);

  const exportColumns = useMemo(() => getExportColumnsNhatKyPhaPhen(t), [t]);
  const sttTheoId = useMemo(() => new Map(exportRows.map((r, i) => [r.id, i + 1])), [exportRows]);
  const exportMap = useCallback(
    (item: NhatKyPhaPhen) => mapNhatKyPhaPhenRow(item, sttTheoId.get(item.id) ?? 0),
    [sttTheoId]
  );
  const { exportData, paginatedData, selectedData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMap,
    pagination,
    selectedIds,
    keyExtractor: (p) => p.id,
  });

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('nkpp.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  useEffect(() => () => resetState(), [resetState]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const openEdit = (item: NhatKyPhaPhen) => {
    setEditingItem(item);
    setViewingId(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('nkpp.deleteTitle'),
      message: t('nkpp.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id);
        if (viewingId === id) setViewingId(null);
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('nkpp.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewingId && ids.includes(viewingId)) setViewingId(null);
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative">
      {/* Tab Nhật ký / Chi tiết là danh sách card trên mobile → khung chỉ hiện từ md (tránh viền kép) */}
      <div
        className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
          tab !== 'cai-dat-ho'
            ? 'md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm'
            : 'rounded-xl border border-border bg-card shadow-sm'
        }`}
      >
        <div className="px-1.5 md:px-4 pt-3">
          <TabGroup
            tabs={[
              { id: 'nhat-ky', label: t('nkpp.tab.nhatKy'), icon: BookOpen },
              { id: 'chi-tiet', label: t('nkpp.tab.chiTiet'), icon: FileSpreadsheet },
              { id: 'cai-dat-ho', label: t('nkpp.tab.caiDatHo'), icon: Waves },
            ]}
            activeTab={tab}
            onChange={handleTabChange}
          />
        </div>

        {tab === 'chi-tiet' ? (
          <ChiTietTab
            viewAll={viewScope.viewAll}
            allowedBranchIds={viewScope.allowedBranchIds}
            scopeLoading={viewScope.isLoading}
            branches={branches}
            tomTat={tomTatList}
            onViewNhatKy={setViewingId}
          />
        ) : tab === 'nhat-ky' ? (
          <>
            <NhatKyPhaPhenToolbar
              data={tomTatList}
              branches={branches}
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
            <div className="flex-1 min-h-0 flex flex-col md:px-4 md:pb-4 pt-1">
              <NhatKyPhaPhenList
                data={pageList}
                totalRecordsOverride={totalCount}
                isFetching={isFetching}
                columns={columns}
                onResizeColumn={resizeColumn}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onToggleAllSelection={toggleAllSelection}
                isLoading={isLoading || viewScope.isLoading}
                page={pagination.page}
                pageSize={pagination.pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                sort={sort}
                onSort={setSort}
                onView={(item) => setViewingId(item.id)}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-3">
            <CaiDatHoTab
              branches={branches}
              viewAll={viewScope.viewAll}
              allowedBranchIds={viewScope.allowedBranchIds}
              scopeLoading={viewScope.isLoading}
              canManage={canAdmin || canUpdate}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <NhatKyPhaPhenForm
            branches={branches}
            viewAll={viewScope.viewAll}
            allowedBranchIds={viewScope.allowedBranchIds}
            initialData={editingItem}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedData}
            selectedData={selectedData}
            fileName={exportFileNameNhatKyPhaPhen()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <NhatKyPhaPhenDetail
            data={viewingItem}
            onClose={() => setViewingId(null)}
            onEdit={canUpdate ? openEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NhatKyPhaPhenPage;
