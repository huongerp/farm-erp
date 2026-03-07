import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Building2, Download, Calendar, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useDuAnStore } from '../store/useDuAnStore';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { useDuAnFilterCounts } from '../hooks/use-du-an-filter-counts';
import { BTN_ADD } from '../../../../lib/button-labels';
import type { DuAn } from '../core/types';

interface Props {
  /** Danh sách dự án người dùng được xem. Count filter chip đếm trên list này. */
  items?: DuAn[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onExport?: () => void;
  onImport?: () => void;
}

const DuAnToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onExport, onImport }) => {
  const { t } = useTranslation();
  const { data: departments = [] } = useDepartments();
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
  } = useDuAnStore();
  const { statusCounts, phongBanCounts, namCounts } = useDuAnFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    (filters.status?.length ?? 0) +
    (filters.id_phong_ban?.length ?? 0) +
    (filters.nam_bat_dau?.length ?? 0);
  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('id_phong_ban', []);
    setFilter('nam_bat_dau', []);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const y = String(currentYear - 2 + i);
        return { label: y, value: y, count: namCounts[y] ?? 0 };
      }),
    [currentYear, namCounts]
  );

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: statusCounts.Active ?? 0 },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: statusCounts.Inactive ?? 0 },
    ],
    [t, statusCounts]
  );
  const phongBanOptions = useMemo(
    () => departments.map((d) => ({ label: d.ten_phong_ban, value: d.id, count: phongBanCounts[d.id] ?? 0 })),
    [departments, phongBanCounts]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status ?? [],
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'id_phong_ban',
        label: t('duAn.form.phongBan'),
        icon: Building2,
        options: phongBanOptions,
        value: filters.id_phong_ban ?? [],
        onChange: (val: string[]) => setFilter('id_phong_ban', val),
      },
      {
        key: 'nam_bat_dau',
        label: t('duAn.toolbar.yearStart'),
        icon: Calendar,
        options: yearOptions,
        value: filters.nam_bat_dau ?? [],
        onChange: (val: string[]) => setFilter('nam_bat_dau', val),
      },
    ],
    [filters.status, filters.id_phong_ban, filters.nam_bat_dau, setFilter, statusOptions, phongBanOptions, yearOptions, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status ?? []}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={phongBanOptions}
        value={filters.id_phong_ban ?? []}
        onChange={(val) => setFilter('id_phong_ban', val)}
        placeholder={t('duAn.form.phongBan')}
        icon={Building2}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={yearOptions}
        value={filters.nam_bat_dau ?? []}
        onChange={(val) => setFilter('nam_bat_dau', val)}
        placeholder={t('duAn.toolbar.yearStart')}
        icon={Calendar}
        className="w-full sm:w-[120px]"
      />
    </>
  );

  const renderActions = (
    <>
      {onImport && (
        <Tooltip content={t('duAn.toolbar.importData')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onImport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {onExport && (
        <Tooltip content={t('duAn.toolbar.exportData')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted"
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3">
        <Plus className="w-4 h-4 mr-1.5" />
        <span className="text-xs">{BTN_ADD()}</span>
      </Button>
    </>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={onAdd}
      searchPlaceholder={t('duAn.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default DuAnToolbar;
