import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, LayoutGrid } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipSingleSelect from '../../../../components/shared/FilterChipSingleSelect';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useTieuChiKpiStore } from '../store/useTieuChiKpiStore';
import { LOAI_DO_LUONG_VALUES, LOAI_DO_LUONG_LABEL_KEYS, TAN_SUAT_VALUES, TAN_SUAT_LABEL_KEYS } from '../core/constants';
import { getCachTinhDiemDefault } from '../core/constants';
import type { TieuChiKpi } from '../core/types';
import type { HanhDongCotLoi } from '../../hanh-dong-cot-loi/core/types';

interface Props {
  fullListForFilters: TieuChiKpi[];
  hanhDongList: HanhDongCotLoi[];
  onAdd: () => void;
}

const TieuChiToolbar: React.FC<Props> = ({
  fullListForFilters,
  hanhDongList,
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
  } = useTieuChiKpiStore();

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.id_hanh_dong ? 1 : 0) +
      (filters.loai ? 1 : 0) +
      (filters.cach_tinh_diem ? 1 : 0) +
      (filters.tan_suat ? 1 : 0),
    [searchTerm, filters.id_hanh_dong, filters.loai, filters.cach_tinh_diem, filters.tan_suat]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('id_hanh_dong', null);
    setFilter('loai', null);
    setFilter('cach_tinh_diem', null);
    setFilter('tan_suat', null);
  };

  const cachTinhDiemDefault = useMemo(() => getCachTinhDiemDefault(), []);

  const hanhDongOptions = useMemo(() => {
    const list = fullListForFilters;
    return hanhDongList
      .filter((h) => list.some((t) => t.id_hanh_dong === h.id))
      .map((h) => ({
        value: h.id,
        label: h.ten,
        count: list.filter((t) => t.id_hanh_dong === h.id).length,
      }));
  }, [hanhDongList, fullListForFilters]);

  const loaiOptions = useMemo(() => {
    const list = fullListForFilters;
    return LOAI_DO_LUONG_VALUES.filter((l) => list.some((t) => t.loai === l)).map((l) => ({
      value: l,
      label: t(LOAI_DO_LUONG_LABEL_KEYS[l]),
      count: list.filter((t) => t.loai === l).length,
    }));
  }, [fullListForFilters, t]);

  const cachTinhDiemOptions = useMemo(() => {
    const list = fullListForFilters;
    return cachTinhDiemDefault
      .filter((c) => list.some((t) => t.cach_tinh_diem === c.ma))
      .map((c) => ({
        value: c.ma,
        label: c.ten,
        count: list.filter((t) => t.cach_tinh_diem === c.ma).length,
      }));
  }, [fullListForFilters, cachTinhDiemDefault]);

  const tanSuatOptions = useMemo(() => {
    const list = fullListForFilters;
    return TAN_SUAT_VALUES.filter((s) => list.some((t) => t.tan_suat === s)).map((s) => ({
      value: s,
      label: t(TAN_SUAT_LABEL_KEYS[s]),
      count: list.filter((t) => t.tan_suat === s).length,
    }));
  }, [fullListForFilters, t]);

  const renderFilters = (
    <>
      <FilterChipSingleSelect
        options={hanhDongOptions}
        value={filters.id_hanh_dong}
        onChange={(v) => setFilter('id_hanh_dong', v)}
        placeholder={t('tieuChiKpi.filterHanhDong')}
        icon={Target}
        className="w-full sm:w-[220px]"
      />
      <FilterChipSingleSelect
        options={loaiOptions}
        value={filters.loai}
        onChange={(v) => setFilter('loai', v)}
        placeholder={t('tieuChiKpi.filterLoai')}
        icon={LayoutGrid}
        className="w-full sm:w-[120px]"
      />
      <FilterChipSingleSelect
        options={cachTinhDiemOptions}
        value={filters.cach_tinh_diem}
        onChange={(v) => setFilter('cach_tinh_diem', v)}
        placeholder={t('tieuChiKpi.filterCachTinhDiem')}
        icon={LayoutGrid}
        className="w-full sm:w-[160px]"
      />
      <FilterChipSingleSelect
        options={tanSuatOptions}
        value={filters.tan_suat}
        onChange={(v) => setFilter('tan_suat', v)}
        placeholder={t('tieuChiKpi.filterTanSuat')}
        icon={LayoutGrid}
        className="w-full sm:w-[120px]"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_hanh_dong',
        label: t('tieuChiKpi.filterHanhDong'),
        icon: Target,
        options: hanhDongOptions,
        value: filters.id_hanh_dong ? [filters.id_hanh_dong] : [],
        onChange: (val: string[]) => setFilter('id_hanh_dong', val[0] ?? null),
      },
      {
        key: 'loai',
        label: t('tieuChiKpi.filterLoai'),
        icon: LayoutGrid,
        options: loaiOptions,
        value: filters.loai ? [filters.loai] : [],
        onChange: (val: string[]) => setFilter('loai', val[0] ?? null),
      },
      {
        key: 'cach_tinh_diem',
        label: t('tieuChiKpi.filterCachTinhDiem'),
        icon: LayoutGrid,
        options: cachTinhDiemOptions,
        value: filters.cach_tinh_diem ? [filters.cach_tinh_diem] : [],
        onChange: (val: string[]) => setFilter('cach_tinh_diem', val[0] ?? null),
      },
      {
        key: 'tan_suat',
        label: t('tieuChiKpi.filterTanSuat'),
        icon: LayoutGrid,
        options: tanSuatOptions,
        value: filters.tan_suat ? [filters.tan_suat] : [],
        onChange: (val: string[]) => setFilter('tan_suat', val[0] ?? null),
      },
    ],
    [
      filters.id_hanh_dong,
      filters.loai,
      filters.cach_tinh_diem,
      filters.tan_suat,
      setFilter,
      t,
      hanhDongOptions,
      loaiOptions,
      cachTinhDiemOptions,
      tanSuatOptions,
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
      searchPlaceholder={t('tieuChiKpi.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default TieuChiToolbar;
