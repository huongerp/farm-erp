import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ClipboardList, MessageSquare, LayoutGrid, GanttChart } from 'lucide-react';
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
import { filterCongViecByScope } from '../core/scope';
import type { CongViecScope } from '../core/scope';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage, exportToExcel } from '../../../../lib/utils';
import { getTrangThaiLabel, getUuTienLabel } from '../core/constants';
import type { CongViec } from '../core/types';
import type { CongViecFilters } from '../store/useCongViecStore';

const TAB_IDS = ['my', 'list', 'kanban', 'gantt'] as const;
type TabId = (typeof TAB_IDS)[number];

interface Props {
  scope: CongViecScope;
}

const CongViecScopeTab: React.FC<Props> = ({ scope }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
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

  const [activeTabId, setActiveTabId] = useState<TabId>('my');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CongViec | null>(null);
  /** Stack drawer: [0] = detail mở từ bảng, [1] = detail con mở từ bảng con, ... */
  const [detailStack, setDetailStack] = useState<CongViec[]>([]);
  const [formParentId, setFormParentId] = useState<number | string | null>(null);
  /** Id công việc đang mở form Sửa từ detail — khi Hủy sẽ mở lại detail */
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<number | string | null>(null);

  const { data: list = [], isLoading } = useCongViecList();
  const deleteMutation = useDeleteCongViecList();
  const importMutation = useImportCongViec(() => setShowImport(false));
  const [showImport, setShowImport] = useState(false);

  const IMPORT_COLUMNS = useMemo(
    () => [
      { key: 'tieu_de', label: t('congViec.form.tieuDe'), required: true },
      { key: 'mo_ta', label: t('congViec.form.moTa') },
      { key: 'uu_tien', label: t('congViec.form.uuTien') },
      { key: 'trang_thai', label: t('congViec.form.trangThai') },
      { key: 'trach_nhiem', label: t('congViec.form.trachNhiem') },
      { key: 'nguoi_ho_tro', label: t('congViec.form.nguoiHoTro') },
    ],
    [t]
  );

  const scopeList = useMemo(
    () => filterCongViecByScope(list, scope, userId),
    [list, scope, userId]
  );

  const tabFilteredList = useMemo(() => {
    if (activeTabId === 'my') return filterCongViecByScope(list, 'my', userId);
    if (activeTabId === 'list') return scopeList;
    return scopeList;
  }, [scopeList, list, activeTabId, userId]);

  const filterFn = useCallback(
    (item: CongViec, term: string, f: CongViecFilters) => {
      const trangThai = f.trang_thai ?? [];
      const uuTien = f.uu_tien ?? [];
      const trachNhiem = f.trach_nhiem ?? [];
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.tieu_de.toLowerCase().includes(searchLower) ||
        (item.mo_ta && item.mo_ta.toLowerCase().includes(searchLower));
      const matchesTrangThai = trangThai.length === 0 || trangThai.includes(item.trang_thai);
      const matchesUuTien = uuTien.length === 0 || uuTien.includes(item.uu_tien);
      const matchesTrachNhiem =
        trachNhiem.length === 0 || (item.trach_nhiem != null && trachNhiem.includes(item.trach_nhiem));
      return matchesSearch && matchesTrangThai && matchesUuTien && matchesTrachNhiem;
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
    if (!detailIdFromQuery || !list.length) return;
    const numId = Number(detailIdFromQuery);
    const item = list.find((c) => c.id === numId || String(c.id) === detailIdFromQuery);
    if (item) setDetailStack([item]);
  }, [detailIdFromQuery, list]);

  useEffect(() => {
    if (!list.length) return;
    setDetailStack((prev) => {
      if (!prev.length) return prev;
      return prev.map((it) => list.find((c) => c.id === it.id) ?? it).filter(Boolean) as CongViec[];
    });
  }, [list]);

  const tabs = useMemo(
    () => [
      { id: 'my' as const, label: t('congViec.tabs.cuaToi'), icon: MessageSquare },
      { id: 'list' as const, label: t('congViec.tabs.danhSach'), icon: ClipboardList },
      { id: 'kanban' as const, label: t('congViec.tabs.kanban'), icon: LayoutGrid },
      { id: 'gantt' as const, label: t('congViec.tabs.gantt'), icon: GanttChart },
    ],
    [t]
  );

  const handleEdit = (item: CongViec) => {
    setFormParentId(null);
    setEditingItem(item);
    setShowForm(true);
    const fromDetail = detailStack.length > 0 && detailStack[detailStack.length - 1].id === item.id;
    if (fromDetail) setOpenedFormFromDetailId(item.id);
    else setOpenedFormFromDetailId(null);
    setDetailStack([]);
  };

  const handleView = (item: CongViec) => {
    setEditingItem(null);
    setFormParentId(null);
    setShowForm(false);
    setDetailStack([item]);
  };

  const handleAddChild = (parentId: number | string) => {
    setEditingItem(null);
    setFormParentId(parentId);
    setShowForm(true);
  };

  const handleDelete = (id: number | string) => {
    confirm({
      title: t('congViec.deleteTitle'),
      message: t('congViec.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            clearSelection();
            setDetailStack((prev) => prev.filter((x) => x.id !== id));
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
            setDetailStack((prev) => prev.filter((x) => !ids.includes(String(x.id))));
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
        setDetailStack([fresh]);
      }
    }
  };

  const exportData = useMemo(
    () =>
      sortedList.map((c) => ({
        [t('congViec.form.tieuDe')]: c.tieu_de,
        [t('congViec.form.moTa')]: c.mo_ta ?? '',
        [t('congViec.form.uuTien')]: c.uu_tien,
        [t('congViec.form.trangThai')]: c.trang_thai,
        [t('congViec.form.trachNhiem')]: c.trach_nhiem ?? '',
        [t('congViec.form.nguoiHoTro')]: (c.nguoi_ho_tro ?? []).join(', '),
      })),
    [sortedList, t]
  );
  const handleExport = useCallback(() => {
    exportToExcel(exportData, 'cong_viec');
  }, [exportData]);

  const handleImportData = useCallback(
    async (rows: Record<string, unknown>[]) => {
      const payload = rows.map((row) => ({
        tieu_de: String(row.tieu_de ?? '').trim(),
        mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : undefined,
        uu_tien: String(row.uu_tien ?? 'trung_binh').trim(),
        trang_thai: String(row.trang_thai ?? 'draft').trim(),
        trach_nhiem: row.trach_nhiem != null ? String(row.trach_nhiem).trim() : undefined,
        nguoi_ho_tro: row.nguoi_ho_tro != null ? String(row.nguoi_ho_tro).trim() : undefined,
      }));
      await importMutation.mutateAsync(payload);
    },
    [importMutation]
  );

  const isListView = activeTabId === 'my' || activeTabId === 'list';
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
              stackLevel={detailStack.length > 0 && formParentId ? 1 : 0}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {detailStack.map((item, i) => (
            <CongViecDetail
              key={item.id}
              data={item}
              stackLevel={i}
              onClose={() => setDetailStack((prev) => prev.slice(0, i))}
              onEdit={(edited) => {
                setDetailStack([]);
                handleEdit(edited);
              }}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
              onDeleteChild={handleDelete}
              onViewChild={(child) => setDetailStack((prev) => [...prev.slice(0, i + 1), child])}
            />
          ))}
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
