import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ClipboardList, MessageSquare, LayoutGrid, GanttChart, Tag, UserCheck } from 'lucide-react';
import BulkActionButton from '../../../../components/shared/BulkActionButton';
import CongViecBulkDialog, { type CongViecBulkMode } from './cong-viec-bulk-dialog';
import TabGroup from '../../../../components/ui/TabGroup';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import CongViecToolbar from './cong-viec-toolbar';
import CongViecHierarchyTable from './cong-viec-hierarchy-table';
import CongViecKanban from './cong-viec-kanban';
import CongViecGantt from './cong-viec-gantt';
import CongViecForm from './cong-viec-form';
import CongViecDetail from './cong-viec-detail';
import ImportDialog from '../../../../components/shared/LazyImportDialog';
import EmptyState from '../../../../components/shared/EmptyState';
import Button from '../../../../components/ui/Button';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import { flattenCongViecWithLevel } from '../services/cong-viec-service';
import { useCongViecList, useDeleteCongViecList, useUpdateCongViecMany } from '../hooks/use-cong-viec';
import { useCongViecImport } from '../hooks/use-cong-viec-import';
import { useCongViecStore, DEFAULT_COLUMNS } from '../store/useCongViecStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { filterCongViecByScope } from '../core/scope';
import type { CongViecScope } from '../core/scope';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage, exportToExcel } from '../../../../lib/utils';
import type { CongViec, CongViecTrangThai } from '../core/types';
import type { CongViecFilters } from '../store/useCongViecStore';
import { createListSearchMatcher } from '../../../../lib/list-search-matcher';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher({ columns: DEFAULT_COLUMNS });

type TabId = 'my' | 'list' | 'kanban' | 'gantt';

interface Props {
  scope: CongViecScope;
}

const CongViecScopeTab: React.FC<Props> = ({ scope }) => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
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
    columns,
    resizeColumn,
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
  const updateManyMutation = useUpdateCongViecMany();
  const [bulkMode, setBulkMode] = useState<CongViecBulkMode | null>(null);
  const importer = useCongViecImport();

  const scopeList = useMemo(
    () => filterCongViecByScope(list, scope, userId),
    [list, scope, userId]
  );

  /**
   * Công việc là bảng CÂY (cha – con qua `id_cha`): cắt trang ở PostgREST sẽ làm
   * mất nhánh cha hoặc con nằm ngoài trang, cây dựng ra sẽ sai. Vì vậy module này
   * cố ý giữ lọc + phân trang ở client — xem CLAUDE.md § Danh sách.
   */
  const tabFilteredList = useMemo(() => {
    if (activeTabId === 'my') return filterCongViecByScope(list, 'my', userId);
    return scopeList;
  }, [scopeList, list, activeTabId, userId]);

  const filterFn = useCallback(
    (item: CongViec, term: string, f: CongViecFilters) => {
      const trangThai = f.trang_thai ?? [];
      const uuTien = f.uu_tien ?? [];
      const trachNhiem = f.trach_nhiem ?? [];
      const matchesSearch = khopTimKiem(item, term);
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
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
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
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
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

  // Đồng bộ chồng drawer chi tiết với danh sách — chỉnh state ngay lúc render (mẫu "adjust state
  // while rendering") thay vì effect. Chỉ xét khi list có dữ liệu: `list = []` mặc định là mảng
  // mới mỗi lần render, so sánh khi rỗng sẽ gây vòng lặp render.
  //  - ?detail=<id> trên URL → mở drawer công việc đó.
  //  - list đổi (refetch) → thay các mục trong chồng drawer bằng bản mới nhất.
  const [prevDetailSync, setPrevDetailSync] = useState<{ detailId: string | null; list: CongViec[] } | null>(null);
  if (list.length > 0 && (prevDetailSync?.detailId !== detailIdFromQuery || prevDetailSync?.list !== list)) {
    const listChanged = prevDetailSync?.list !== list;
    setPrevDetailSync({ detailId: detailIdFromQuery, list });
    const numId = Number(detailIdFromQuery);
    const itemFromQuery = detailIdFromQuery
      ? list.find((c) => c.id === numId || String(c.id) === detailIdFromQuery)
      : undefined;
    if (itemFromQuery) {
      setDetailStack([itemFromQuery]);
    } else if (listChanged) {
      setDetailStack((prev) => {
        if (!prev.length) return prev;
        return prev.map((it) => list.find((c) => c.id === it.id) ?? it).filter(Boolean) as CongViec[];
      });
    }
  }

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

  const handleDeleteMany = (rawIds: (string | number)[]) => {
    const ids = rawIds.map(String);
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

  /**
   * Đổi trạng thái / giao lại hàng loạt. Danh sách đã tải đủ ở client nên bỏ qua trước
   * những việc đã đúng giá trị đích (khỏi bắn thông báo thừa).
   */
  const handleBulkConfirm = (value: CongViecTrangThai | number) => {
    if (!bulkMode) return;
    const byId = new Map(list.map((c) => [String(c.id), c]));
    const ids = Array.from(selectedIds).filter((id) => {
      const item = byId.get(String(id));
      if (!item) return false;
      return bulkMode === 'trang_thai' ? item.trang_thai !== value : Number(item.trach_nhiem) !== value;
    });
    const boQua = selectedIds.size - ids.length;
    if (ids.length === 0) {
      toast.message(t('congViec.bulk.toast.khongCoGiDoi'));
      setBulkMode(null);
      return;
    }
    const patch =
      bulkMode === 'trang_thai' ? { trang_thai: value as CongViecTrangThai } : { trach_nhiem: value as number };
    updateManyMutation.mutate(
      { ids, patch },
      {
        onSuccess: () => {
          if (boQua > 0) toast.message(t('congViec.bulk.toast.boQua', { count: boQua }));
          setBulkMode(null);
          clearSelection();
          setDetailStack((prev) => prev.filter((x) => !ids.includes(String(x.id))));
        },
      }
    );
  };

  const bulkActions = canUpdate ? (
    <>
      <BulkActionButton icon={Tag} label={t('congViec.bulk.trangThaiAction')} onClick={() => setBulkMode('trang_thai')} />
      <BulkActionButton
        icon={UserCheck}
        label={t('congViec.bulk.giaoLaiAction')}
        onClick={() => setBulkMode('trach_nhiem')}
      />
    </>
  ) : undefined;

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
          onAdd={canCreate ? () => {
            setFormParentId(null);
            setEditingItem(null);
            setShowForm(true);
          } : undefined}
          onDeleteMany={canDelete ? handleDeleteMany : undefined}
          onExport={handleExport}
          onImport={canCreate ? importer.openImport : undefined}
          hideViewMode
          canCreate={canCreate}
          canDelete={canDelete}
          bulkActions={bulkActions}
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
                action={canCreate ? (
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
                ) : undefined}
              />
            </div>
          ) : isKanban ? (
            <CongViecKanban data={dataForKanbanGantt} onView={handleView} canUpdate={canUpdate} />
          ) : isGantt ? (
            <CongViecGantt data={dataForKanbanGantt} onView={handleView} />
          ) : (
            <>
              <CongViecHierarchyTable
                data={paginatedFlattened}
                columns={columns}
                onResizeColumn={resizeColumn}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onToggleAllSelection={toggleAllSelection}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                canUpdate={canUpdate}
                canDelete={canDelete}
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
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ))}
        </AnimatePresence>

        {importer.showImport && (
          <ImportDialog
            open={importer.showImport}
            onClose={importer.closeImport}
            columns={importer.importColumns}
            sampleRows={importer.sampleRows}
            referenceSheets={importer.referenceSheets}
            importErrors={importer.importErrors}
            onImport={importer.handleImport}
            templateFileName={importer.templateFileName}
          />
        )}

        {bulkMode && (
          <CongViecBulkDialog
            mode={bulkMode}
            count={selectedIds.size}
            isPending={updateManyMutation.isPending}
            onClose={() => setBulkMode(null)}
            onConfirm={handleBulkConfirm}
          />
        )}
      </div>
    </div>
  );
};

export default CongViecScopeTab;
