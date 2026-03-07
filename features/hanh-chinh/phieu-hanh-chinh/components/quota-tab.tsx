import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AdminFormQuotaToolbar from './quota-toolbar';
import AdminFormQuotaTable from './quota-table';
import { useAdminFormQuotaStore } from '../store/useAdminFormQuotaStore';
import { useAdminForms } from '../hooks/use-admin-form';
import { usePayrollAdminFormGroups } from '../../thiet-lap-cong-luong/hooks/use-payroll-form-group';
import { useAuthStore } from '../../../../store/useStore';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { AdminFormQuotaRow } from '../core/types';

const AdminFormQuotaTab: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    selectedIds,
    clearSelection,
    resetState,
  } = useAdminFormQuotaStore();

  const { data: forms = [], isLoading } = useAdminForms();
  const { data: groups = [] } = usePayrollAdminFormGroups();

  useEffect(() => {
    if (!filters.month) {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setFilter('month', month);
    }
  }, [filters.month, setFilter]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const currentUserId = user?.id ?? 'emp-000';
  const effectiveUserId = useMemo(() => {
    if (forms.some((f) => f.nguoi_tao_id === currentUserId)) return currentUserId;
    if (forms.some((f) => f.nguoi_tao_id === 'emp-000')) return 'emp-000';
    return currentUserId;
  }, [forms, currentUserId]);
  const rows = useMemo<AdminFormQuotaRow[]>(() => {
    const myForms = forms.filter((f) => f.nguoi_tao_id === effectiveUserId);
    const month = filters.month;
    const usedByType = new Map<string, number>();
    myForms.forEach((f) => {
      if (f.trang_thai !== 'approved') return;
      if (month && !f.ngay.startsWith(month)) return;
      usedByType.set(f.loai_phieu, (usedByType.get(f.loai_phieu) ?? 0) + 1);
    });
    return groups.map((g) => {
      const used = usedByType.get(g.loai_phieu) ?? 0;
      return {
        id: g.id,
        loai_phieu: g.loai_phieu,
        so_luong_thang: g.so_luong_thang,
        da_dung: used,
        con_lai: Math.max(g.so_luong_thang - used, 0),
      };
    });
  }, [forms, groups, filters.month, effectiveUserId]);

  const filteredRows = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !searchTerm || getAdminFormTypeLabel(row.loai_phieu, t).toLowerCase().includes(searchLower);
      const matchesType = filters.type.length === 0 || filters.type.includes(row.loai_phieu);
      return matchesSearch && matchesType;
    });
  }, [rows, searchTerm, filters.type, t]);

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <AdminFormQuotaToolbar
        items={rows}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilter={setFilter as any}
        columns={columns}
        toggleColumn={toggleColumn}
        reorderColumns={reorderColumns}
        resetColumns={resetColumns}
        selectedIds={selectedIds}
        clearSelection={clearSelection}
        searchPlaceholder={t('adminForm.quota.searchPlaceholder')}
      />
      <div className="flex-1 min-h-0">
        <AdminFormQuotaTable
          data={filteredRows}
          isLoading={isLoading}
          useStore={useAdminFormQuotaStore}
        />
      </div>
    </div>
  );
};

export default AdminFormQuotaTab;
