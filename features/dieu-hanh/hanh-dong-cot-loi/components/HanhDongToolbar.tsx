import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, LayoutGrid } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipSingleSelect from '../../../../components/shared/FilterChipSingleSelect';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useHanhDongCotLoiStore } from '../store/useHanhDongCotLoiStore';
import { BSC_DIMENSIONS, BSC_LABEL_KEYS } from '../core/constants';
import type { BscDimension } from '../core/types';
import type { ChienLuoc } from '../../chien-luoc/core/types';
import type { HanhDongCotLoi } from '../core/types';
import type { NhomHanhDong } from '../core/types';

const currentYear = new Date().getFullYear();
const YEAR_RANGE = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

interface Props {
  /** Full list (unfiltered) used to build filter options — only values present in this list appear in filter chips */
  fullListForFilters: HanhDongCotLoi[];
  chienLuocDaDuyet: ChienLuoc[];
  nhomHanhDongList: NhomHanhDong[];
  chienLuocMap: Map<string, { nam: number }>;
  onAdd: () => void;
}

const HanhDongToolbar: React.FC<Props> = ({
  fullListForFilters,
  chienLuocDaDuyet,
  nhomHanhDongList,
  chienLuocMap,
  onAdd,
}) => {
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
  } = useHanhDongCotLoiStore();

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.id_chien_luoc ? 1 : 0) +
      (filters.nam != null ? 1 : 0) +
      (filters.bsc_dimension ? 1 : 0) +
      (filters.nhom_hanh_dong ? 1 : 0),
    [
      searchTerm,
      filters.id_chien_luoc,
      filters.nam,
      filters.bsc_dimension,
      filters.nhom_hanh_dong,
    ]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('id_chien_luoc', null);
    setFilter('nam', null);
    setFilter('bsc_dimension', null);
    setFilter('nhom_hanh_dong', null);
  };

  // Chỉ hiển thị filter options có trong bảng (fullListForFilters)
  const chienLuocOptions = useMemo(() => {
    const list = fullListForFilters;
    return chienLuocDaDuyet
      .filter((c) => list.some((h) => h.id_chien_luoc === c.id))
      .map((c) => ({
        value: c.id,
        label: `${c.ten} (${c.nam})`,
        count: list.filter((h) => h.id_chien_luoc === c.id).length,
      }));
  }, [chienLuocDaDuyet, fullListForFilters]);

  const namOptions = useMemo(() => {
    const list = fullListForFilters;
    const yearsPresent = new Set(list.map((h) => chienLuocMap.get(h.id_chien_luoc)?.nam).filter((y): y is number => y != null));
    return YEAR_RANGE.filter((y) => yearsPresent.has(y)).map((y) => ({
      value: String(y),
      label: String(y),
      count: list.filter((h) => chienLuocMap.get(h.id_chien_luoc)?.nam === y).length,
    }));
  }, [fullListForFilters, chienLuocMap]);

  const bscOptions = useMemo(() => {
    const list = fullListForFilters;
    return BSC_DIMENSIONS.filter((d) => list.some((h) => h.bsc_dimension === d)).map((d) => ({
      value: d,
      label: t(BSC_LABEL_KEYS[d]),
      count: list.filter((h) => h.bsc_dimension === d).length,
    }));
  }, [fullListForFilters, t]);

  const nhomOptions = useMemo(() => {
    const list = fullListForFilters;
    const maPresent = new Set(list.map((h) => h.nhom_hanh_dong));
    return nhomHanhDongList
      .filter((n) => maPresent.has(n.ma))
      .map((n) => ({
        value: n.ma,
        label: n.ten,
        count: list.filter((h) => h.nhom_hanh_dong === n.ma).length,
      }));
  }, [nhomHanhDongList, fullListForFilters]);

  const renderFilters = (
    <>
      <FilterChipSingleSelect
        options={chienLuocOptions}
        value={filters.id_chien_luoc}
        onChange={(v) => setFilter('id_chien_luoc', v)}
        placeholder={t('hanhDongCotLoi.filterChienLuoc')}
        icon={Target}
        className="w-full sm:w-[220px]"
      />
      <FilterChipSingleSelect
        options={namOptions}
        value={filters.nam != null ? String(filters.nam) : null}
        onChange={(v) => setFilter('nam', v ? Number(v) : null)}
        placeholder={t('hanhDongCotLoi.filterNam')}
        icon={LayoutGrid}
        className="w-full sm:w-[100px]"
      />
      <FilterChipSingleSelect
        options={bscOptions}
        value={filters.bsc_dimension}
        onChange={(v) => setFilter('bsc_dimension', v)}
        placeholder={t('hanhDongCotLoi.filterBsc')}
        icon={LayoutGrid}
        className="w-full sm:w-[160px]"
      />
      <FilterChipSingleSelect
        options={nhomOptions}
        value={filters.nhom_hanh_dong}
        onChange={(v) => setFilter('nhom_hanh_dong', v)}
        placeholder={t('hanhDongCotLoi.filterNhomHanhDong')}
        icon={LayoutGrid}
        className="w-full sm:w-[140px]"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_chien_luoc',
        label: t('hanhDongCotLoi.filterChienLuoc'),
        icon: Target,
        options: chienLuocOptions,
        value: filters.id_chien_luoc ? [filters.id_chien_luoc] : [],
        onChange: (val: string[]) => setFilter('id_chien_luoc', val[0] ?? null),
      },
      {
        key: 'nam',
        label: t('hanhDongCotLoi.filterNam'),
        icon: LayoutGrid,
        options: namOptions,
        value: filters.nam != null ? [String(filters.nam)] : [],
        onChange: (val: string[]) => setFilter('nam', val.length ? Number(val[0]) : null),
      },
      {
        key: 'bsc_dimension',
        label: t('hanhDongCotLoi.filterBsc'),
        icon: LayoutGrid,
        options: bscOptions,
        value: filters.bsc_dimension ? [filters.bsc_dimension] : [],
        onChange: (val: string[]) => setFilter('bsc_dimension', val[0] ?? null),
      },
      {
        key: 'nhom_hanh_dong',
        label: t('hanhDongCotLoi.filterNhomHanhDong'),
        icon: LayoutGrid,
        options: nhomOptions,
        value: filters.nhom_hanh_dong ? [filters.nhom_hanh_dong] : [],
        onChange: (val: string[]) => setFilter('nhom_hanh_dong', val[0] ?? null),
      },
    ],
    [
      filters.id_chien_luoc,
      filters.nam,
      filters.bsc_dimension,
      filters.nhom_hanh_dong,
      setFilter,
      t,
      chienLuocOptions,
      namOptions,
      bscOptions,
      nhomOptions,
    ]
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
      onAdd={onAdd}
      showBack={true}
      onBack={() => navigate('/dieu-hanh')}
      searchPlaceholder={t('hanhDongCotLoi.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default HanhDongToolbar;
