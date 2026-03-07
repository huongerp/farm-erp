
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { List, BarChart3 } from 'lucide-react';
import TabGroup, { Tab } from '../../../components/ui/TabGroup';
import Select from '../../../components/ui/Select';
import EmployeeForm from './components/nhan-vien-form';
import EmployeeDetail from './components/nhan-vien-detail';
import EmployeeToolbar from './components/nhan-vien-toolbar';
import EmployeeTable from './components/nhan-vien-table';
import EmployeeStats from './components/nhan-vien-stats';
import BulkEditSheet from './components/nhan-vien-bulk-edit';
import ImportDialog from '../../../components/shared/ImportDialog';
import ExportDialog from '../../../components/shared/ExportDialog';

import { useEmployees, useDeleteWithUndo, useUpdateStatusEmployee } from './hooks/use-nhan-vien';
import { useEmployeeStore } from './store/useEmployeeStore';
import { Employee } from './core/types';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../lib/button-labels';
import { formatDate, getLanguage } from '../../../lib/utils';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { TRANG_THAI_NV } from '../../../lib/constants';

type FormOrigin = 'list' | 'detail';

const EmployeePage: React.FC = () => {
  const { t } = useTranslation();

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

  const { searchTerm, filters, sort, resetState, clearSelection, selectedIds, pagination, columns, setFilter } = useEmployeeStore();

  const { data: employees = [], isLoading } = useEmployees();
  const { deleteWithUndo } = useDeleteWithUndo();
  const statusMutation = useUpdateStatusEmployee();
  const confirm = useConfirmStore(state => state.confirm);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Đồng bộ viewing với list sau refetch (action từ detail hoặc từ nơi khác)
  useEffect(() => {
    if (!viewingEmp) return;
    const fresh = employees.find((e) => e.id === viewingEmp.id);
    if (fresh && fresh !== viewingEmp) setViewingEmp(fresh);
  }, [employees, viewingEmp?.id]);

  const filterFn = useCallback((emp: Employee, term: string, f: typeof filters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch = !term ||
      emp.ho_ten.toLowerCase().includes(searchLower) ||
      emp.ma_nhan_vien.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower) ||
      emp.so_dien_thoai.includes(searchLower) ||
      (emp.ten_chuc_vu && emp.ten_chuc_vu.toLowerCase().includes(searchLower)) ||
      (emp.ten_phong_ban && emp.ten_phong_ban.toLowerCase().includes(searchLower)) ||
      (emp.ten_chi_nhanh && emp.ten_chi_nhanh.toLowerCase().includes(searchLower));
    const matchesStatus = f.trang_thai.length === 0 || f.trang_thai.includes(String(emp.trang_thai));
    const matchesDept = f.id_phong_ban.length === 0 || (emp.id_phong_ban && f.id_phong_ban.includes(emp.id_phong_ban));
    const matchesPosition = f.position.length === 0 || (emp.id_chuc_vu && f.position.includes(emp.id_chuc_vu));
    return matchesSearch && matchesStatus && matchesDept && matchesPosition;
  }, []);

  const filteredEmployees = useListWithFilter(employees, searchTerm, filters, filterFn);

  // Client-side sort
  const sortedEmployees = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredEmployees;
    const sorted = [...filteredEmployees];
    sorted.sort((a: any, b: any) => {
      const aVal = a[sort.column!] ?? '';
      const bVal = b[sort.column!] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      }
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredEmployees, sort]);

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
    data: filteredEmployees,
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

  const handleImportData = async (data: Record<string, any>[]) => {
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
            employees={employees}
            onAdd={() => { setFormOrigin('list'); setShowForm(true); }}
            onExport={() => setShowExport(true)}
            onImport={() => setShowImport(true)}
            onDeleteMany={handleDeleteMany}
            onStatusChangeMany={handleStatusChangeMany}
            onBulkEdit={() => setShowBulkEdit(true)}
          />

          <div className="flex-1 min-h-0">
            <EmployeeTable
              data={sortedEmployees}
              isLoading={isLoading}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <EmployeeStats
            employees={employees}
            isLoading={isLoading}
            onDrillDownDept={(deptId) => {
              setFilter('id_phong_ban', [deptId]);
              setActiveTab('list');
            }}
            onDrillDownStatus={(status) => {
              setFilter('trang_thai', [String(status)]);
              setActiveTab('list');
            }}
          />
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
