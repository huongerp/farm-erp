import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ClipboardList, Clock, MessageSquare, LayoutGrid, GanttChart } from 'lucide-react';
import TabGroup from '../../../../components/ui/TabGroup';
import CongViecToolbar from './cong-viec-toolbar';
import CongViecHierarchyTable from './cong-viec-hierarchy-table';
import CongViecKanban from './cong-viec-kanban';
import CongViecGantt from './cong-viec-gantt';
import CongViecForm from './cong-viec-form';
import CongViecDetail from './cong-viec-detail';
import ImportDialog from '../../../../components/shared/ImportDialog';
import EmptyState from '../../../../components/shared/EmptyState';
import Button from '../../../../components/ui/Button';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import { flattenCongViecWithLevel } from '../services/cong-viec-service';
import { useCongViecList, useDeleteCongViecList, useImportCongViec } from '../hooks/use-cong-viec';
import { useCongViecStore } from '../store/useCongViecStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { useCauHinhCongViec } from '../../thiet-lap-cong-viec/hooks/use-cau-hinh-cong-viec';
import { getDueStatus } from '../core/constants';
import { filterCongViecByScope } from '../core/scope';
import type { CongViecScope } from '../core/scope';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage, exportToExcel, formatDate } from '../../../../lib/utils';
import { getTrangThaiLabel, getUuTienLabel } from '../core/constants';
import type { CongViec } from '../core/types';
import type { CongViecFilters } from '../store/useCongViecStore';

const TAB_IDS = ['all', 'due', 'waitReport', 'kanban', 'gantt'] as const;
type TabId = (typeof TAB_IDS)[number];

interface Props {
  scope: CongViecScope;
}

const CongViecScopeTab: React.FC<Props> = ({ scope }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const duAnFromQuery = searchParams.get('du_an');
  const detailIdFromQuery = searchParams.get('detail');

  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
    setFilter,
    columns,
    pagination,
    setPage,
    setPageSize,
    toggleSelection,
    toggleAllSelection,
  } = useCongViecStore();

  const [activeTabId, setActiveTabId] = useState<TabId>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CongViec | null>(null);
  const [detailItem, setDetailItem] = useState<CongViec | null>(null);
  const [formParentId, setFormParentId] = useState<string | null>(null);
  /** Id công việc đang mở form Sửa từ detail — khi Hủy sẽ mở lại detail */
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useCongViecList();
  const deleteMutation = useDeleteCongViecList();
  const importMutation = useImportCongViec(() => setShowImport(false));
  const [showImport, setShowImport] = useState(false);
  const { data: cauHinh } = useCauHinhCongViec();

  const IMPORT_COLUMNS = useMemo(
    () => [
      { key: 'ma_cong_viec', label: t('congViec.form.maCongViec'), required: true },
      { key: 'tieu_de', label: t('congViec.form.tieuDe'), required: true },
      { key: 'id_du_an', label: t('congViec.form.duAn') },
      { key: 'ten_du_an', label: t('congViec.store.duAnCol') },
      { key: 'ngay_het_han', label: t('congViec.form.ngayHetHan'), required: true },
      { key: 'uu_tien', label: t('congViec.form.uuTien'), required: true },
      { key: 'trang_thai', label: t('congViec.form.trangThai'), required: true },
      { key: 'phan_tram_hoan_thanh', label: t('congViec.form.tienDo') },
      { key: 'mo_ta', label: t('congViec.form.moTa') },
      { key: 'danh_sach_nguoi_thuc_hien', label: t('congViec.form.nguoiThucHien') },
    ],
    [t]
  );

  const scopeList = useMemo(
    () => filterCongViecByScope(list, scope, userId),
    [list, scope, userId]
  );

  const tabFilteredList = useMemo(() => {
    if (activeTabId === 'all') return scopeList;
    if (activeTabId === 'due') {
      return scopeList.filter((c) => {
        const s = getDueStatus(c.ngay_het_han, cauHinh ?? undefined);
        return s === 'sap_han' || s === 'qua_han';
      });
    }
    if (activeTabId === 'waitReport') {
      return scopeList.filter((c) => c.trang_thai === 'cho_bao_cao');
    }
    return scopeList;
  }, [scopeList, activeTabId, cauHinh]);

  const filterFn = useCallback(
    (item: CongViec, term: string, f: CongViecFilters) => {
      const idDuAn = f.id_du_an ?? [];
      const trangThai = f.trang_thai ?? [];
      const uuTien = f.uu_tien ?? [];
      const nguoiThucHien = f.nguoi_thuc_hien ?? [];
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma_cong_viec.toLowerCase().includes(searchLower) ||
        item.tieu_de.toLowerCase().includes(searchLower) ||
        (item.ten_du_an && item.ten_du_an.toLowerCase().includes(searchLower)) ||
        (item.mo_ta && item.mo_ta.toLowerCase().includes(searchLower));
      const matchesDuAn = idDuAn.length === 0 || idDuAn.includes(item.id_du_an ?? '');
      const matchesTrangThai = trangThai.length === 0 || trangThai.includes(item.trang_thai);
      const matchesUuTien = uuTien.length === 0 || uuTien.includes(item.uu_tien);
      const matchesNguoi =
        nguoiThucHien.length === 0 ||
        (item.danh_sach_nguoi_thuc_hien &&
          item.danh_sach_nguoi_thuc_hien.some((id) => nguoiThucHien.includes(id)));
      return matchesSearch && matchesDuAn && matchesTrangThai && matchesUuTien && matchesNguoi;
    },
    []
  );

  const filteredList = useListWithFilter(tabFilteredList, searchTerm, filters, filterFn);

  const listForKanbanGantt = useListWithFilter(scopeList, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: CongViec, b: CongViec) => {
      const aVal = a[sort.column as keyof CongViec] ?? '';
      const bVal = b[sort.column as keyof CongViec] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const sortedListForKanbanGantt = useMemo(() => {
    if (!sort.column || !sort.direction) return listForKanbanGantt;
    const sorted = [...listForKanbanGantt];
    sorted.sort((a: CongViec, b: CongViec) => {
      const aVal = a[sort.column as keyof CongViec] ?? '';
      const bVal = b[sort.column as keyof CongViec] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [listForKanbanGantt, sort]);

  const flattenedList = useMemo(
    () => flattenCongViecWithLevel(sortedList, null, 1),
    [sortedList]
  );

  const paginatedFlattened = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return flattenedList.slice(start, start + pagination.pageSize);
  }, [flattenedList, pagination.page, pagination.pageSize]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (duAnFromQuery) {
      setFilter('id_du_an', [duAnFromQuery]);
    }
  }, [duAnFromQuery, setFilter]);

  useEffect(() => {
    if (!detailIdFromQuery || !list.length) return;
    const item = list.find((c) => c.id === detailIdFromQuery);
    if (item) setDetailItem(item);
  }, [detailIdFromQuery, list]);

  useEffect(() => {
    if (!detailItem || !list.length) return;
    const next = list.find((c) => c.id === detailItem.id);
    if (next && next !== detailItem) setDetailItem(next);
  }, [list, detailItem?.id]);

  const tabs = useMemo(
    () => [
      { id: 'all' as const, label: t('congViec.tabs.all'), icon: ClipboardList },
      { id: 'due' as const, label: t('congViec.tabs.due'), icon: Clock },
      { id: 'waitReport' as const, label: t('congViec.tabs.waitReport'), icon: MessageSquare },
      { id: 'kanban' as const, label: t('congViec.tabs.viewKanban'), icon: LayoutGrid },
      { id: 'gantt' as const, label: t('congViec.tabs.viewGantt'), icon: GanttChart },
    ],
    [t]
  );

  const handleEdit = (item: CongViec) => {
    setFormParentId(null);
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
      setDetailItem(null);
    } else {
      setDetailItem(null);
      setOpenedFormFromDetailId(null);
    }
  };

  const handleView = (item: CongViec) => {
    setEditingItem(null);
    setFormParentId(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleAddChild = (parentId: string) => {
    setEditingItem(null);
    setFormParentId(parentId);
    setShowForm(true);
    // Giữ detail mở để sau khi tạo xong vẫn thấy công việc con trong tab
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('congViec.deleteTitle'),
      message: t('congViec.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            clearSelection();
            if (detailItem?.id === id) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('congViec.bulkDeleteTitle'),
      message: t('congViec.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleCloseForm = () => {
    const wasFromDetail = openedFormFromDetailId != null;
    const editingId = editingItem?.id;
    setShowForm(false);
    setEditingItem(null);
    setFormParentId(null);
    setOpenedFormFromDetailId(null);
    if (wasFromDetail && editingId) {
      const fresh = list.find((c) => c.id === editingId) ?? null;
      if (fresh && filterCongViecByScope([fresh], scope, userId).length > 0) {
        setDetailItem(fresh);
      }
    }
  };

  const handleCloseDetail = () => {
    setDetailItem(null);
  };

  const exportData = useMemo(
    () =>
      sortedList.map((c) => ({
        [t('congViec.form.maCongViec')]: c.ma_cong_viec,
        [t('congViec.form.tieuDe')]: c.tieu_de,
        [t('congViec.form.duAn')]: c.id_du_an ?? '',
        [t('congViec.store.duAnCol')]: c.ten_du_an ?? '',
        [t('congViec.form.ngayHetHan')]: formatDate(c.ngay_het_han),
        [t('congViec.form.uuTien')]: c.uu_tien,
        [t('congViec.form.trangThai')]: c.trang_thai,
        [t('congViec.form.tienDo')]: c.phan_tram_hoan_thanh,
        [t('congViec.form.moTa')]: c.mo_ta ?? '',
        [t('congViec.form.nguoiThucHien')]: (c.danh_sach_nguoi_thuc_hien ?? []).join(', '),
      })),
    [sortedList, t]
  );
  const handleExport = useCallback(() => {
    exportToExcel(exportData, 'cong_viec');
  }, [exportData]);

  const handleImportData = useCallback(
    async (rows: Record<string, any>[]) => {
      const payload = rows.map((row) => ({
        ma_cong_viec: String(row.ma_cong_viec ?? '').trim(),
        tieu_de: String(row.tieu_de ?? '').trim(),
        id_du_an: row.id_du_an != null ? String(row.id_du_an).trim() : undefined,
        ten_du_an: row.ten_du_an != null ? String(row.ten_du_an).trim() : undefined,
        ngay_het_han: String(row.ngay_het_han ?? '').trim(),
        uu_tien: String(row.uu_tien ?? 'trung_binh').trim(),
        trang_thai: String(row.trang_thai ?? 'draft').trim(),
        phan_tram_hoan_thanh: row.phan_tram_hoan_thanh != null ? Number(row.phan_tram_hoan_thanh) : undefined,
        mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : undefined,
        danh_sach_nguoi_thuc_hien: row.danh_sach_nguoi_thuc_hien != null ? String(row.danh_sach_nguoi_thuc_hien).trim() : undefined,
      }));
      await importMutation.mutateAsync(payload);
    },
    [importMutation]
  );

  const isListView = activeTabId === 'all' || activeTabId === 'due' || activeTabId === 'waitReport';
  const isKanban = activeTabId === 'kanban';
  const isGantt = activeTabId === 'gantt';
  const dataForKanbanGantt = sortedListForKanbanGantt;
  const isEmpty = isListView ? flattenedList.length === 0 : dataForKanbanGantt.length === 0;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <div className="shrink-0 mb-2">
        <TabGroup tabs={tabs} activeTab={activeTabId} onChange={(id) => setActiveTabId(id as TabId)} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CongViecToolbar
          items={scopeList}
          onAdd={() => {
            setFormParentId(null);
            setEditingItem(null);
            setShowForm(true);
          }}
          onDeleteMany={handleDeleteMany}
          onExport={handleExport}
          onImport={() => setShowImport(true)}
          hideViewMode
        />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinnerWithText text={t('congViec.loading')} />
            </div>
          ) : isEmpty ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <EmptyState
                title={t('congViec.empty')}
                description={t('congViec.emptyHint')}
                icon={<ClipboardList className="w-10 h-10 text-muted-foreground" />}
                action={
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setFormParentId(null);
                      setEditingItem(null);
                      setShowForm(true);
                    }}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {t('common.addNew')}
                  </Button>
                }
              />
            </div>
          ) : isKanban ? (
            <CongViecKanban data={dataForKanbanGantt} onView={handleView} />
          ) : isGantt ? (
            <CongViecGantt data={dataForKanbanGantt} onView={handleView} />
          ) : (
            <>
              <CongViecHierarchyTable
                data={paginatedFlattened}
                columns={columns}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onToggleAllSelection={toggleAllSelection}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
              <div className="shrink-0 border-t border-border bg-muted/30">
                <TablePaginationFooter
                  totalRecords={flattenedList.length}
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  selectedCount={selectedIds.size}
                  recordsLabel={t('congViec.footerRecords')}
                />
              </div>
            </>
          )}
        </div>

        <AnimatePresence>
          {showForm && (
            <CongViecForm
              initialData={editingItem ?? undefined}
              parentId={formParentId}
              onClose={handleCloseForm}
              stackLevel={detailItem && formParentId ? 1 : 0}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {detailItem && (
            <CongViecDetail
              data={detailItem}
              onClose={handleCloseDetail}
              onEdit={(item) => {
                setDetailItem(null);
                handleEdit(item);
              }}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
              onDeleteChild={handleDelete}
            />
          )}
        </AnimatePresence>

        {showImport && (
          <ImportDialog
            open={showImport}
            onClose={() => setShowImport(false)}
            columns={IMPORT_COLUMNS}
            onImport={handleImportData}
            templateFileName="cong_viec"
          />
        )}
      </div>
    </div>
  );
};

export default CongViecScopeTab;
