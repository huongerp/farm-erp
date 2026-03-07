import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, Tag } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useKeHoachChiPhiStore } from '../store/useKeHoachChiPhiStore';
import type { KeHoachChiPhiTabId } from '../core/constants';
import { BTN_ADD } from '../../../../lib/button-labels';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

interface KeHoachChiPhiToolbarProps {
  activeTab: KeHoachChiPhiTabId;
  onAddPlan?: () => void;
  selectedCount?: number;
  onClearSelection?: () => void;
  onDeleteMany?: () => void;
}

const KeHoachChiPhiToolbar: React.FC<KeHoachChiPhiToolbarProps> = ({
  activeTab,
  onAddPlan,
  selectedCount = 0,
  onClearSelection = () => {},
  onDeleteMany,
}) => {
  const { t } = useTranslation();
  const {
    filters,
    setFilter,
    searchTerm,
    setSearchTerm,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useKeHoachChiPhiStore();

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.nam !== CURRENT_YEAR ? 1 : 0) +
      (filters.trang_thai.length > 0 ? 1 : 0),
    [searchTerm, filters.nam, filters.trang_thai.length]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('nam', CURRENT_YEAR);
    setFilter('trang_thai', []);
  };

  const yearOptions = useMemo(
    () => YEAR_OPTIONS.map((y) => ({ label: String(y), value: String(y) })),
    []
  );

  const statusOptions = useMemo(
    () => [
      { label: t('keHoachChiPhi.status.nhap'), value: '0' },
      { label: t('keHoachChiPhi.status.daDuyet'), value: '1' },
      { label: t('keHoachChiPhi.status.khoa'), value: '2' },
    ],
    [t]
  );

  const renderFilters = (
    <>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Calendar size={16} className="text-muted-foreground shrink-0" />
        <select
          value={filters.nam}
          onChange={(e) => setFilter('nam', Number(e.target.value))}
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm text-foreground min-w-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          aria-label={t('keHoachChiPhi.filterYear')}
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.trang_thai}
        onChange={(v) => setFilter('trang_thai', v)}
        placeholder={t('keHoachChiPhi.filterStatus')}
        icon={Tag}
        className="w-full sm:w-[140px]"
        hideZeroCount={false}
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'nam',
        label: t('keHoachChiPhi.filterYear'),
        icon: Calendar,
        options: yearOptions,
        value: [String(filters.nam)],
        onChange: (val: string[]) =>
          setFilter('nam', val.length ? Number(val[0]) : CURRENT_YEAR),
      },
      {
        key: 'trang_thai',
        label: t('keHoachChiPhi.filterStatus'),
        icon: Tag,
        options: statusOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
    ],
    [filters.nam, filters.trang_thai, setFilter, t, statusOptions, yearOptions]
  );

  const renderActions =
    activeTab === 'ke_hoach' && onAddPlan ? (
      <Tooltip content={BTN_ADD()} placement="bottom">
        <Button
          onClick={onAddPlan}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="text-xs">{BTN_ADD()}</span>
        </Button>
      </Tooltip>
    ) : undefined;

  return (
    <GenericToolbar
      selectedCount={activeTab === 'ke_hoach' ? selectedCount : 0}
      searchTerm={activeTab === 'ke_hoach' ? searchTerm : ''}
      onSearchChange={activeTab === 'ke_hoach' ? setSearchTerm : () => {}}
      onClearSelection={onClearSelection}
      onDeleteMany={activeTab === 'ke_hoach' ? onDeleteMany : undefined}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      showBack
      onAdd={activeTab === 'ke_hoach' ? onAddPlan : undefined}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      searchPlaceholder={t('common.searchPlaceholder')}
      columns={activeTab === 'ke_hoach' ? columns : undefined}
      onToggleColumn={activeTab === 'ke_hoach' ? toggleColumn : undefined}
      onReorderColumns={activeTab === 'ke_hoach' ? reorderColumns : undefined}
      onResetColumns={activeTab === 'ke_hoach' ? resetColumns : undefined}
    />
  );
};

export default KeHoachChiPhiToolbar;
