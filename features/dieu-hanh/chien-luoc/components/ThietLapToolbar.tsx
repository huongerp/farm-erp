import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipSingleSelect from '../../../../components/shared/FilterChipSingleSelect';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useThietLapChienLuocStore } from '../store/useThietLapChienLuocStore';
import { NHOM_LOAI_CHIEN_LUOC_LABEL_KEYS } from '../core/constants';
import type { NhomLoaiChienLuoc } from '../core/types';
import type { LoaiChienLuoc } from '../core/types';

const NHOM_VALUES: NhomLoaiChienLuoc[] = ['tows', 'ansoff', 'corporate', 'integration'];

interface Props {
  data: LoaiChienLuoc[];
  onAdd: () => void;
}

const ThietLapToolbar: React.FC<Props> = ({ data, onAdd }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useThietLapChienLuocStore();

  const nhomOptions = useMemo(
    () =>
      NHOM_VALUES.map((v) => ({
        value: v,
        label: t(NHOM_LOAI_CHIEN_LUOC_LABEL_KEYS[v]),
        count: data.filter((x) => x.nhom === v).length,
      })),
    [data, t]
  );

  const activeFilterCount = useMemo(
    () => (searchTerm ? 1 : 0) + (filters.nhom != null ? 1 : 0),
    [searchTerm, filters.nhom]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('nhom', null);
  };

  const renderFilters = (
    <FilterChipSingleSelect
      options={nhomOptions}
      value={filters.nhom}
      onChange={(v) => setFilter('nhom', v || null)}
      placeholder={t('chienLuoc.thietLap.filterNhom')}
      icon={Layers}
      className="w-full sm:w-[200px]"
    />
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'nhom',
        label: t('chienLuoc.thietLap.filterNhom'),
        icon: Layers,
        options: nhomOptions,
        value: filters.nhom ? [filters.nhom] : [],
        onChange: (val: string[]) => setFilter('nhom', val.length ? val[0] : null),
      },
    ],
    [filters.nhom, setFilter, t, nhomOptions]
  );

  const renderActions = (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{BTN_ADD()}</span>
    </Button>
  );

  return (
    <GenericToolbar
      selectedCount={0}
      onClearSelection={() => {}}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      showBack={true}
      onBack={() => navigate('/dieu-hanh')}
      searchPlaceholder={t('chienLuoc.thietLap.searchPlaceholder')}
      onAdd={onAdd}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ThietLapToolbar;
