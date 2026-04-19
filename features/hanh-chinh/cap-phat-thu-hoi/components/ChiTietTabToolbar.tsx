import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useChiTietTabStore } from '../store/useChiTietTabStore';
import { LOAI_PHIEU_OPTIONS } from '../core/constants';
import type { PhieuChiTietRow } from '../core/types';

interface Props {
  data: PhieuChiTietRow[];
  onBack?: () => void;
}

const ChiTietTabToolbar: React.FC<Props> = ({ data, onBack }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useChiTietTabStore);
  const filters = useChiTietTabStore((s) => s.filters);
  const setFilter = useChiTietTabStore((s) => s.setFilter);
  const columns = useChiTietTabStore((s) => s.columns);
  const toggleColumn = useChiTietTabStore((s) => s.toggleColumn);
  const reorderColumns = useChiTietTabStore((s) => s.reorderColumns);
  const resetColumns = useChiTietTabStore((s) => s.resetColumns);

  const loaiPhieuLen = filters.loaiPhieu?.length ?? 0;
  const activeFilterCount = useMemo(
    () => (searchInput.trim() ? 1 : 0) + (loaiPhieuLen > 0 ? 1 : 0),
    [searchInput, loaiPhieuLen]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('loaiPhieu', []);
  };

  const loaiPhieuOptions = useMemo(
    () =>
      LOAI_PHIEU_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(opt.labelKey),
        count: data.filter((r) => r.loai_phieu === opt.value).length,
      })),
    [data, t]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'loaiPhieu',
        label: t('capPhatThuHoi.store.loaiCol'),
        icon: Tag,
        options: loaiPhieuOptions,
        value: filters.loaiPhieu ?? [],
        onChange: (val: string[]) => setFilter('loaiPhieu', val),
      },
    ],
    [t, loaiPhieuOptions, filters.loaiPhieu, setFilter]
  );

  const renderFilters = (
    <FilterChipMultiSelect
      options={loaiPhieuOptions}
      value={filters.loaiPhieu ?? []}
      onChange={(v) => setFilter('loaiPhieu', v)}
      placeholder={t('capPhatThuHoi.store.loaiCol')}
      icon={Tag}
      className="w-full sm:w-[160px]"
    />
  );

  return (
    <GenericToolbar
      selectedCount={0}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={() => {}}
      filters={renderFilters}
      filterGroups={filterGroups}
      showBack={!!onBack}
      onBack={onBack}
      searchPlaceholder={t('capPhatThuHoi.chiTiet.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ChiTietTabToolbar;
