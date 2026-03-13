
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Upload, Building2, Briefcase, Tag, Pencil } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { useEmployeeStore } from '../store/useEmployeeStore';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { STATUS_OPTIONS } from '../core/constants';
import { useFilterCounts } from '../hooks/use-filter-counts';
import type { Employee } from '../core/types';
import { TRANG_THAI_NV } from '../../../../lib/constants';

interface Props {
  /** Danh sách nhân viên người dùng được phép xem (sau phân quyền). Count trong filter chip đếm trên chính list này. */
  employees: Employee[];
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: string) => void;
  onBulkEdit?: () => void;
  /** Phân quyền: có quyền thêm (admin hoặc create) */
  canCreate?: boolean;
  /** Phân quyền: có quyền sửa (admin hoặc update) */
  canUpdate?: boolean;
  /** Phân quyền: có quyền xoá (admin hoặc delete) */
  canDelete?: boolean;
}

const EmployeeToolbar: React.FC<Props> = ({ 
    employees, onAdd, onExport, onImport, onDeleteMany, onStatusChangeMany, onBulkEdit,
    canCreate = true, canUpdate = true, canDelete = true,
}) => {
  const { t } = useTranslation();
  const { 
    searchTerm, setSearchTerm, 
    filters, setFilter, 
    columns, toggleColumn, reorderColumns, resetColumns,
    selectedIds, clearSelection
  } = useEmployeeStore();

  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();

  const { deptCounts, posCounts, statusCounts } = useFilterCounts(employees, searchTerm, filters);

  const departmentOptions = useMemo(
    () => departments.map(d => ({ label: d.ten_phong_ban, value: d.id, count: deptCounts[d.id] || 0 })),
    [departments, deptCounts]
  );
  const positionOptions = useMemo(
    () => positions.map(p => ({ label: p.ten_chuc_vu, value: p.id, count: posCounts[p.id] || 0 })),
    [positions, posCounts]
  );
  const statusOptions = useMemo(
    () => STATUS_OPTIONS.map(s => ({ label: s.label, value: String(s.value), count: statusCounts[String(s.value)] || 0 })),
    [statusCounts]
  );

  const activeFilterCount = useMemo(() => {
    return (searchTerm ? 1 : 0)
      + (filters.id_phong_ban.length > 0 ? 1 : 0)
      + (filters.position.length > 0 ? 1 : 0)
      + (filters.trang_thai.length > 0 ? 1 : 0);
  }, [searchTerm, filters]);

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('id_phong_ban', []);
    setFilter('position', []);
    setFilter('trang_thai', []);
  };

  // Desktop: filter chips multi-select (dùng chung FilterChipMultiSelect)
  const renderFilters = (
    <>
        <FilterChipMultiSelect
            options={departmentOptions}
            value={filters.id_phong_ban}
            onChange={(val) => setFilter('id_phong_ban', val)}
            icon={Building2}
            placeholder={t('employee.toolbar.department')}
            className="w-full sm:w-[150px]"
        />
        <FilterChipMultiSelect
            options={positionOptions}
            value={filters.position}
            onChange={(val) => setFilter('position', val)}
            icon={Briefcase}
            placeholder={t('employee.toolbar.position')}
            className="w-full sm:w-[140px]"
        />
        <FilterChipMultiSelect
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilter('trang_thai', val)}
            icon={Tag}
            placeholder={t('employee.toolbar.status')}
            className="w-full sm:w-[140px]"
        />
    </>
  );

  // Mobile: filter groups cho bottom sheet
  const filterGroups = useMemo(() => [
    {
      key: 'id_phong_ban',
      label: t('employee.toolbar.department'),
      icon: Building2,
      options: departmentOptions,
      value: filters.id_phong_ban,
      onChange: (val: string[]) => setFilter('id_phong_ban', val),
    },
    {
      key: 'position',
      label: t('employee.toolbar.position'),
      icon: Briefcase,
      options: positionOptions,
      value: filters.position,
      onChange: (val: string[]) => setFilter('position', val),
    },
    {
      key: 'trang_thai',
      label: t('employee.toolbar.status'),
      icon: Tag,
      options: statusOptions,
      value: filters.trang_thai,
      onChange: (val: string[]) => setFilter('trang_thai', val),
    },
  ], [departmentOptions, positionOptions, statusOptions, filters, setFilter, t]);

  // Mobile: action items cho bottom sheet "Thao tác"
  const mobileActions = useMemo(() => [
    ...(onBulkEdit && canUpdate && selectedIds.size > 0 ? [{
      key: 'bulk-edit',
      label: t('employee.toolbar.bulkEdit'),
      icon: Pencil,
      onClick: onBulkEdit,
      description: t('employee.toolbar.bulkEditDesc', { count: selectedIds.size }),
    }] : []),
    {
      key: 'import',
      label: t('employee.toolbar.importData'),
      icon: Upload,
      onClick: onImport,
      description: t('employee.toolbar.importDesc'),
    },
    {
      key: 'export',
      label: t('employee.toolbar.exportData'),
      icon: Download,
      onClick: onExport,
      description: t('employee.toolbar.exportDesc'),
    },
  ], [onImport, onExport, onBulkEdit, canUpdate, selectedIds.size, t]);

  // Desktop: action buttons (import, export, bulk edit, thêm) — ẩn theo phân quyền
  const renderActions = (
    <>
        {onBulkEdit && canUpdate && selectedIds.size > 0 && (
          <Tooltip content={t('employee.toolbar.bulkEdit')} placement="bottom">
            <Button variant="outline" size="sm" onClick={onBulkEdit} className="inline-flex h-8 px-2.5 items-center gap-1.5 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10">
                <Pencil className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{t('employee.toolbar.editCount', { count: selectedIds.size })}</span>
            </Button>
          </Tooltip>
        )}
        <Tooltip content={t('employee.toolbar.importData')} placement="bottom">
            <Button variant="outline" size="sm" onClick={onImport} className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted">
                <Upload className="w-4 h-4" />
            </Button>
        </Tooltip>
        <Tooltip content={t('employee.toolbar.exportData')} placement="bottom">
            <Button variant="outline" size="sm" onClick={onExport} className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted">
                <Download className="w-4 h-4" />
            </Button>
        </Tooltip>
        {canCreate && (
          <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3">
              <Plus className="w-4 h-4 mr-1.5" /> 
              <span className="text-xs">{BTN_ADD()}</span>
          </Button>
        )}
    </>
  );

  return (
    <GenericToolbar
        selectedCount={selectedIds.size}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSelection={clearSelection}
        actions={renderActions}
        filters={renderFilters}
        filterGroups={filterGroups}
        mobileActions={mobileActions}
        onAdd={canCreate ? onAdd : undefined}
        onDeleteMany={canDelete && selectedIds.size > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
        onStatusChangeMany={canUpdate && selectedIds.size > 0 ? (numStatus) => onStatusChangeMany(Array.from(selectedIds), numStatus === 1 ? TRANG_THAI_NV.DANG_LAM_VIEC : TRANG_THAI_NV.NGHI_VIEC) : undefined}
        columns={columns}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetColumns={resetColumns}
        showBack
        searchPlaceholder={t('common.searchPlaceholder')}
        activeFilterCount={activeFilterCount}
        onClearAllFilters={handleClearAllFilters}
    />
  );
};

export default EmployeeToolbar;
