import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import PhongBanToolbar from './components/phong-ban-toolbar';
import DepartmentList from './components/phong-ban-list';
import DepartmentForm from './components/phong-ban-form';
import DepartmentDetail from './components/phong-ban-detail';
import ExportDialog from '../../../components/shared/LazyExportDialog';
import ImportDialog from '../../../components/shared/LazyImportDialog';
import { useDepartments, useDeleteDepartment, useUpdateStatusDepartment } from './hooks/use-phong-ban';
import { usePhongBanImport } from './hooks/use-phong-ban-import';
import { useDepartmentStore, DEFAULT_COLUMNS } from './store/useDepartmentStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { Department } from './core/types';
import { TRANG_THAI, type TrangThai } from '../../../lib/constants';
import { createListSearchMatcher } from '../../../lib/list-search-matcher';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher({ columns: DEFAULT_COLUMNS });
/** Mảng rỗng cố định khi chưa có dữ liệu — tránh tham chiếu mới mỗi render. */
const KHONG_CO_DONG: Department[] = [];

const DepartmentPage = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchTerm, filters, resetState, selectedIds, columns, resizeColumn, clearSelection, toggleSelection, toggleAllSelection } = useDepartmentStore();

  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [viewingDept, setViewingDept] = useState<Department | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: departments = KHONG_CO_DONG, isLoading } = useDepartments();
  const deleteMutation = useDeleteDepartment();
  const statusMutation = useUpdateStatusDepartment();
  const importer = usePhongBanImport();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Đồng bộ viewing với list sau refetch (action từ detail hoặc từ nơi khác). Điều chỉnh
  // ngay lúc render khi list hoặc id đang xem đổi — cùng điều kiện với deps của effect cũ.
  const [dongBoViewing, setDongBoViewing] = useState({ list: departments, id: viewingDept?.id });
  if (dongBoViewing.list !== departments || dongBoViewing.id !== viewingDept?.id) {
    setDongBoViewing({ list: departments, id: viewingDept?.id });
    const fresh = viewingDept ? departments.find((d) => d.id === viewingDept.id) : undefined;
    if (fresh && fresh !== viewingDept) setViewingDept(fresh);
  }

  const filterFn = useCallback(
    (item: Department, term: string, f: typeof filters) => {
      const matchesSearch = khopTimKiem(item, term);
      const statusKey = item.trang_thai === TRANG_THAI.DANG_DUNG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesPhong = f.id_phong_goc.length === 0 || f.id_phong_goc.includes(item.id);
      return matchesSearch && matchesStatus && matchesPhong;
    },
    []
  );

  const filteredDepartments = useListWithFilter(
    departments,
    searchTerm,
    filters,
    filterFn
  );

  const maxPage = Math.max(1, Math.ceil(filteredDepartments.length / pageSize));
  // Số dòng lọc đổi → về trang 1; chỉ đổi cỡ trang → kẹp trang vào [1, maxPage].
  // Điều chỉnh ngay lúc render thay cho hai effect setState cũ (cùng điều kiện kích hoạt).
  const [phanTrangTruoc, setPhanTrangTruoc] = useState({ soDong: filteredDepartments.length, pageSize, maxPage });
  if (
    phanTrangTruoc.soDong !== filteredDepartments.length ||
    phanTrangTruoc.pageSize !== pageSize ||
    phanTrangTruoc.maxPage !== maxPage
  ) {
    setPhanTrangTruoc({ soDong: filteredDepartments.length, pageSize, maxPage });
    if (phanTrangTruoc.soDong !== filteredDepartments.length) setPage(1);
    else setPage((p) => Math.min(p, maxPage));
  }

  const exportPagination = useMemo(
    () => ({ page: 1, pageSize: Math.max(filteredDepartments.length, 1) }),
    [filteredDepartments.length]
  );

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'ten_phong_ban', label: t('department.exportName') },
      { key: 'chuc_nang', label: t('department.store.chucNangCol') },
      { key: 'tt', label: t('department.exportOrder') },
      { key: 'trang_thai_text', label: t('department.exportStatus') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: Department) => ({
      ten_phong_ban: item.ten_phong_ban,
      chuc_nang: item.chuc_nang ?? '',
      tt: item.tt,
      trang_thai_text:
        item.trang_thai === TRANG_THAI.DANG_DUNG ? t('department.active') : t('department.inactive'),
    }),
    [t]
  );

  const {
    exportData,
    paginatedData: paginatedExportData,
    selectedData: selectedExportData,
  } = useExportData({
    data: filteredDepartments,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination: exportPagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  const visibleColumnKeys = useMemo(
    () => EXPORT_COLUMNS.map((c) => c.key),
    [EXPORT_COLUMNS]
  );

  const handleEdit = (item: Department) => {
    setEditingDept(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('department.deleteTitle'),
      message: t('department.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingDept?.id === id) setViewingDept(null);
          },
        });
      },
    });
  };

  const handleStatusChange = (item: Department) => {
    const newStatus = item.trang_thai === TRANG_THAI.DANG_DUNG ? TRANG_THAI.NGUNG : TRANG_THAI.DANG_DUNG;
    const statusLabel = newStatus === TRANG_THAI.DANG_DUNG ? t('department.active') : t('department.inactive');
    confirm({
      title: t('department.statusChangeTitle'),
      message: t('department.statusChangeMessage', { name: item.ten_phong_ban, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { id: item.id, status: newStatus },
          {
            onSuccess: (updated) => {
              if (viewingDept?.id === item.id) setViewingDept(updated);
            },
          }
        );
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('department.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        for (const id of ids) {
          await deleteMutation.mutateAsync(id).catch(() => {});
        }
        clearSelection();
        if (viewingDept && ids.includes(viewingDept.id)) setViewingDept(null);
      },
    });
  };

  const handleStatusChangeMany = (status: TrangThai) => {
    const ids = Array.from(selectedIds);
    const statusLabel = status === TRANG_THAI.DANG_DUNG ? t('department.active') : t('department.inactive');
    confirm({
      title: t('department.statusChangeTitle'),
      message: t('common.statusChangeManyConfirm', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        for (const id of ids) {
          await statusMutation.mutateAsync({ id, status });
        }
        clearSelection();
      },
    });
  };

  const handleCloseForm = () => {
    const wasEditing = editingDept;
    setShowForm(false);
    if (wasEditing && viewingDept?.id === wasEditing.id) {
      const fresh = departments.find((d) => d.id === wasEditing.id);
      setViewingDept(fresh ?? null);
    }
    setEditingDept(null);
  };

  const handleExport = () => {
    if (filteredDepartments.length === 0) {
      toast.warning(t('department.noExportData'));
      return;
    }
    setShowExport(true);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <PhongBanToolbar
          departments={departments}
          selectedCount={selectedIds.size}
          onAdd={() => setShowForm(true)}
          onExport={handleExport}
          onImport={canCreate ? importer.openImport : undefined}
          onDeleteMany={handleDeleteMany}
          onStatusChangeMany={handleStatusChangeMany}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />

        <div className="flex-1 min-h-0 flex flex-col">
          <DepartmentList
            data={filteredDepartments}
            columns={columns}
            onResizeColumn={resizeColumn}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAllSelection={toggleAllSelection}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={setViewingDept}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DepartmentForm
            initialData={editingDept}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingDept && !showForm && (
          <DepartmentDetail
            data={viewingDept}
            allDepartments={departments}
            onClose={() => setViewingDept(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={EXPORT_COLUMNS}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName="Danh_Sach_Phong_Ban"
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
};

export default DepartmentPage;
