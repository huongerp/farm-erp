
import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { List, BarChart3 } from 'lucide-react';
import TabGroup, { Tab } from '../../../components/ui/TabGroup';
import Select from '../../../components/ui/Select';
import EmployeeForm from './components/nhan-vien-form';
import EmployeeDetail from './components/nhan-vien-detail';
import EmployeeToolbar from './components/nhan-vien-toolbar';
import EmployeeTable from './components/nhan-vien-table';
const EmployeeStats = lazy(() => import('./components/nhan-vien-stats'));
import BulkEditSheet from './components/nhan-vien-bulk-edit';
import ImportDialog from '../../../components/shared/LazyImportDialog';
import ExportDialog from '../../../components/shared/LazyExportDialog';

import {
  useEmployees,
  useEmployeesPage,
  useEmployeesLiteForCounts,
  useDeleteWithUndo,
  useUpdateStatusEmployee,
} from './hooks/use-nhan-vien';
import { fetchEmployeeRowsAllMatching, enrichEmployeesWithRefDataAsync } from './services/nhan-vien-service';
import type { EmployeeListQuery } from './services/nhan-vien-service';
import { usePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import { useModulePermissionFromContext } from '@/components/shared/ModulePermissionGuard';
import { useEmployeeStore } from './store/useEmployeeStore';
import { Employee } from './core/types';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../lib/button-labels';
import { formatDate, getLanguage } from '../../../lib/utils';
import { useExportData } from '../../../lib/useExportData';
import { TRANG_THAI_NV, type TrangThaiNV } from '../../../lib/constants';
import { stableListQueryKeyPart } from '../../../lib/list-query-key';
import { useShallow } from 'zustand/react/shallow';

type FormOrigin = 'list' | 'detail';

const EMPTY_EMPLOYEES: Employee[] = [];

const EmployeePage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();

  const IMPORT_COLUMNS = useMemo(() => [
    { key: 'ho_ten', label: t('employee.name'), required: true },
    { key: 'email', label: t('employee.email'), required: true },
    { key: 'so_dien_thoai', label: t('employee.phone') },
    { key: 'gioi_tinh', label: t('employee.gender') },
    { key: 'ngay_vao_lam', label: t('employee.hireDate') },
  ], [t]);

  const EXPORT_COLUMNS = useMemo(() => [
    { key: 'ma_nhan_vien', label: t('employee.code') },
    { key: 'ho_ten', label: t('employee.name') },
    { key: 'gioi_tinh', label: t('employee.gender') },
    { key: 'email', label: t('employee.email') },
    { key: 'so_dien_thoai', label: t('employee.phone') },
    { key: 'ten_chuc_vu', label: t('employee.position') },
    { key: 'ten_phong_ban', label: t('employee.department') },
    { key: 'ten_chi_nhanh', label: t('employee.detail.branch') },
    { key: 'trang_thai_text', label: t('employee.status') },
    { key: 'ngay_vao_lam_text', label: t('employee.hireDate') },
  ], [t]);

  const TABS: Tab[] = useMemo(() => [
    { id: 'list', label: t('employee.tabList'), icon: List },
    { id: 'stats', label: t('employee.tabStats'), icon: BarChart3 },
  ], [t]);

  const [activeTab, setActiveTab] = useState<string>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [viewingEmp, setViewingEmp] = useState<Employee | null>(null);
  const [formOrigin, setFormOrigin] = useState<FormOrigin>('list');
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const { searchTerm, filters, sort, resetState, clearSelection, selectedIds, pagination, columns, setFilter } =
    useEmployeeStore(
      useShallow((s) => ({
        searchTerm: s.searchTerm,
        filters: s.filters,
        sort: s.sort,
        resetState: s.resetState,
        clearSelection: s.clearSelection,
        selectedIds: s.selectedIds,
        pagination: s.pagination,
        columns: s.columns,
        setFilter: s.setFilter,
      }))
    );

  const listQueryKeyPart = useMemo(
    () =>
      stableListQueryKeyPart({
        q: searchTerm,
        trangThai: filters.trang_thai,
        phongBanIds: filters.id_phong_ban,
        chucVuIds: filters.position,
      }),
    [searchTerm, filters.trang_thai, filters.id_phong_ban, filters.position]
  );

  const listQuery: EmployeeListQuery = useMemo(
    () => ({
      page: Math.max(0, pagination.page - 1),
      pageSize: pagination.pageSize,
      q: searchTerm,
      trangThai: filters.trang_thai as TrangThaiNV[],
      phongBanIds: filters.id_phong_ban,
      chucVuIds: filters.position,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters.trang_thai, filters.id_phong_ban, filters.position]
  );

  const pageQuery = useEmployeesPage(listQuery);
  const employees = pageQuery.data?.data ?? EMPTY_EMPLOYEES;
  const totalListCount = pageQuery.data?.totalCount ?? 0;
  const isInitialLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const { data: employeesForCounts = [] } = useEmployeesLiteForCounts();
  const { data: allForStats = [], isLoading: statsLoading } = useEmployees({ enabled: activeTab === 'stats' });

  const { data: positions = [] } = usePositions(); // Tra cứu cấp bậc theo chức vụ ở bảng
  const { deleteWithUndo } = useDeleteWithUndo();
  const statusMutation = useUpdateStatusEmployee();
  const confirm = useConfirmStore(state => state.confirm);

  const exportQuery = useQuery({
    queryKey: ['employees', 'export', listQueryKeyPart] as const,
    queryFn: async () => {
      const rows = await fetchEmployeeRowsAllMatching({
        q: searchTerm,
        trangThai: filters.trang_thai as TrangThaiNV[],
        phongBanIds: filters.id_phong_ban,
        chucVuIds: filters.position,
      });
      await enrichEmployeesWithRefDataAsync(rows);
      return rows;
    },
    enabled: showExport,
    staleTime: 0,
  });

  const exportRows = exportQuery.data ?? [];

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Đồng bộ viewing với list sau refetch (action từ detail hoặc từ nơi khác)
  useEffect(() => {
    if (!viewingEmp) return;
    const fresh = employees.find((e) => e.id === viewingEmp.id);
    if (fresh && fresh !== viewingEmp) setViewingEmp(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ sync khi id hoặc danh sách trang đổi
  }, [employees, viewingEmp?.id]);

  // Client-side sort (trên trang hiện tại — lọc đã chạy server)
  const sortedEmployees = useMemo(() => {
    if (!sort.column || !sort.direction) return employees;
    const col = sort.column;
    const direction = sort.direction;
    const sorted = [...employees];
    sorted.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[col];
      const bVal = (b as unknown as Record<string, unknown>)[col];
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal ?? '').localeCompare(String(bVal ?? ''), getLanguage());
      return direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [employees, sort]);

  // Export data — hook tái sử dụng, lazy khi showExport
  const exportMapFn = useCallback((emp: Employee) => ({
    ma_nhan_vien: emp.ma_nhan_vien,
    ho_ten: emp.ho_ten,
    gioi_tinh: emp.gioi_tinh,
    email: emp.email,
    so_dien_thoai: emp.so_dien_thoai,
    ten_chuc_vu: emp.ten_chuc_vu,
    ten_phong_ban: emp.ten_phong_ban,
    ten_chi_nhanh: emp.ten_chi_nhanh,
    trang_thai_text: emp.trang_thai === TRANG_THAI_NV.DANG_LAM_VIEC ? t('employee.statusActive') : emp.trang_thai === TRANG_THAI_NV.THU_VIEC ? t('employee.statusProbation') : emp.trang_thai === TRANG_THAI_NV.NGHI_PHEP ? t('employee.statusLeave') : t('employee.statusResigned'),
    ngay_vao_lam_text: formatDate(emp.ngay_vao_lam),
  }), [t]);

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: exportRows,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (emp) => emp.id,
  });

  const visibleColumnKeys = useMemo(() => columns.filter(c => c.visible).map(c => c.id), [columns]);

  const handleEdit = (item: Employee) => {
    setFormOrigin(viewingEmp ? 'detail' : 'list');
    setEditingEmp(item);
    setShowForm(true);
  };

  const handleView = (item: Employee) => {
    setViewingEmp(item);
  };

  const handleDelete = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    confirm({
        title: t('employee.deleteConfirmTitle'),
        message: `${t('employee.deleteConfirmMessage')} "${emp.ho_ten}"? ${t('employee.deleteConfirmNote')}`,
        variant: "danger",
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
            await deleteWithUndo([emp], {
              onDone: () => {
                if (viewingEmp?.id === id) setViewingEmp(null);
                if (editingEmp?.id === id) setShowForm(false);
              }
            });
        }
    });
  };

  const handleStatusChange = (item: Employee) => {
      let selectedStatus: string = item.trang_thai;

      confirm({
        title: t('employee.statusChangeTitle'),
        message: (
          <div className="space-y-4 text-left py-2">
            <p className="text-sm">{t('employee.statusChangeMessage')} <strong>{item.ho_ten}</strong>:</p>
            <Select
              defaultValue={item.trang_thai}
              options={[
                { label: t('employee.statusActive'), value: TRANG_THAI_NV.DANG_LAM_VIEC },
                { label: t('employee.statusProbation'), value: TRANG_THAI_NV.THU_VIEC },
                { label: t('employee.statusLeave'), value: TRANG_THAI_NV.NGHI_PHEP },
                { label: t('employee.statusResigned'), value: TRANG_THAI_NV.NGHI_VIEC },
              ]}
              onChange={(e) => { selectedStatus = e.target.value; }}
            />
          </div>
        ),
        variant: "info",
        confirmText: CONFIRM_YES(),
        onConfirm: async () => {
          await statusMutation.mutateAsync({ ids: [item.id], status: selectedStatus });
        }
      });
  };

  const handleDeleteMany = (ids: string[]) => {
      const emps = employees.filter(e => ids.includes(e.id));
      confirm({
          title: t('employee.bulkDeleteTitle'),
          message: t('employee.bulkDeleteMessage', { count: ids.length }),
          variant: "danger",
          confirmText: CONFIRM_DELETE_ALL(),
          onConfirm: async () => {
              await deleteWithUndo(emps, { onDone: clearSelection });
          }
      });
  };

  const handleStatusChangeMany = (ids: string[], status: string) => {
      confirm({
          title: t('employee.bulkStatusTitle'),
          message: `${t('employee.bulkStatusMessage', { count: ids.length })} "${status === TRANG_THAI_NV.DANG_LAM_VIEC ? t('employee.statusActive') : t('employee.statusInactiveShort')}"?`,
          variant: "warning",
          confirmText: CONFIRM_YES(),
          onConfirm: async () => {
              await statusMutation.mutateAsync({ ids, status });
              clearSelection();
          }
      });
  };

  const handleImportData = async (data: Record<string, unknown>[]) => {
    // In real app, call API to bulk create employees
    toast.success(t('employee.importSuccess', { count: data.length }));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      {/* Tab Switcher – z-0 để luôn nằm dưới overlay (drawer, dialog) */}
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'list' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
          <EmployeeToolbar
            employees={employeesForCounts}
            onAdd={() => { setFormOrigin('list'); setShowForm(true); }}
            onExport={() => setShowExport(true)}
            onImport={() => setShowImport(true)}
            onDeleteMany={handleDeleteMany}
            onStatusChangeMany={handleStatusChangeMany}
            onBulkEdit={() => setShowBulkEdit(true)}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />

          <div className="flex-1 min-h-0">
            <EmployeeTable
              data={sortedEmployees}
              totalRecordsOverride={totalListCount}
              isLoading={isInitialLoading}
              isFetching={isFetchingOverlay}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              positions={positions}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Suspense
            fallback={
              <div className="flex flex-1 min-h-[240px] items-center justify-center text-sm text-muted-foreground" aria-busy="true">
                {t('employee.tabStats')}…
              </div>
            }
          >
            <EmployeeStats
              employees={allForStats}
              isLoading={statsLoading}
              onDrillDownDept={(deptId) => {
                setFilter('id_phong_ban', [deptId]);
                setActiveTab('list');
              }}
              onDrillDownStatus={(status) => {
                setFilter('trang_thai', [String(status)]);
                setActiveTab('list');
              }}
            />
          </Suspense>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
            <EmployeeForm 
                initialData={editingEmp} 
                onClose={() => {
                  setShowForm(false);
                  if (formOrigin === 'detail' && editingEmp) {
                    // Quay về Detail với data mới nhất từ cache
                    const freshData = employees.find(e => e.id === editingEmp.id);
                    setViewingEmp(freshData ?? null);
                  }
                  setEditingEmp(null);
                }} 
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingEmp && !showForm && (
            <EmployeeDetail 
                data={viewingEmp}
                onClose={() => setViewingEmp(null)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canUpdate={canUpdate}
                canDelete={canDelete}
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImport && (
          <ImportDialog
            open={showImport}
            onClose={() => setShowImport(false)}
            columns={IMPORT_COLUMNS}
            onImport={handleImportData}
            templateFileName={t('employee.importTemplateName')}
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
            fileName={t('employee.exportFileName')}
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkEdit && selectedIds.size > 0 && (
          <BulkEditSheet
            selectedEmployees={employees.filter(e => selectedIds.has(e.id))}
            onClose={() => setShowBulkEdit(false)}
            onSuccess={clearSelection}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeePage;
