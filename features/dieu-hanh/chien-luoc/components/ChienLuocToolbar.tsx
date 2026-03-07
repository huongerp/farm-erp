import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, CheckCircle, PlayCircle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipSingleSelect from '../../../../components/shared/FilterChipSingleSelect';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useChienLuocStore } from '../store/useChienLuocStore';
import type { ChienLuoc } from '../core/types';
import {
  TRANG_THAI_DUYET_LABEL_KEYS,
  TRANG_THAI_TRIEN_KHAI_LABEL_KEYS,
} from '../core/constants';
import type { TrangThaiDuyet, TrangThaiTrienKhai } from '../core/types';

const currentYear = new Date().getFullYear();
const YEAR_RANGE = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

interface Props {
  data: ChienLuoc[];
  onAdd: () => void;
  showBack?: boolean;
}

const ChienLuocToolbar: React.FC<Props> = ({ data, onAdd, showBack = true }) => {
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
  } = useChienLuocStore();

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.nam != null ? 1 : 0) +
      (filters.trang_thai_duyet.length > 0 ? 1 : 0) +
      (filters.trang_thai_trien_khai.length > 0 ? 1 : 0),
    [
      searchTerm,
      filters.nam,
      filters.trang_thai_duyet.length,
      filters.trang_thai_trien_khai.length,
    ]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('nam', null);
    setFilter('trang_thai_duyet', []);
    setFilter('trang_thai_trien_khai', []);
  };

  const yearOptions = useMemo(
    () =>
      YEAR_RANGE.map((y) => ({
        value: String(y),
        label: String(y),
        count: data.filter((c) => c.nam === y).length,
      })),
    [data]
  );

  const trangThaiDuyetOptions = useMemo(
    () =>
      (['cho_duyet', 'da_duyet', 'khong_duyet'] as TrangThaiDuyet[]).map((v) => ({
        value: v,
        label: t(TRANG_THAI_DUYET_LABEL_KEYS[v]),
        count: data.filter((c) => c.trang_thai_duyet === v).length,
      })),
    [data, t]
  );

  const trangThaiTrienKhaiOptions = useMemo(
    () =>
      (
        [
          'chua_bat_dau',
          'dang_trien_khai',
          'tam_ngung',
          'hoan_thanh',
          'huy',
        ] as TrangThaiTrienKhai[]
      ).map((v) => ({
        value: v,
        label: t(TRANG_THAI_TRIEN_KHAI_LABEL_KEYS[v]),
        count: data.filter((c) => c.trang_thai_trien_khai === v).length,
      })),
    [data, t]
  );

  const renderFilters = (
    <>
      <FilterChipSingleSelect
        options={yearOptions}
        value={filters.nam != null ? String(filters.nam) : null}
        onChange={(v) => setFilter('nam', v ? Number(v) : null)}
        placeholder={t('chienLuoc.filterNam')}
        icon={Calendar}
        className="w-full sm:w-[120px]"
      />
      <FilterChipMultiSelect
        options={trangThaiDuyetOptions}
        value={filters.trang_thai_duyet}
        onChange={(v) => setFilter('trang_thai_duyet', v)}
        placeholder={t('chienLuoc.filterTrangThaiDuyet')}
        icon={CheckCircle}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={trangThaiTrienKhaiOptions}
        value={filters.trang_thai_trien_khai}
        onChange={(v) => setFilter('trang_thai_trien_khai', v)}
        placeholder={t('chienLuoc.filterTrangThaiTrienKhai')}
        icon={PlayCircle}
        className="w-full sm:w-[180px]"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'nam',
        label: t('chienLuoc.filterNam'),
        icon: Calendar,
        options: yearOptions,
        value: filters.nam != null ? [String(filters.nam)] : [],
        onChange: (val: string[]) =>
          setFilter('nam', val.length ? Number(val[0]) : null),
      },
      {
        key: 'trang_thai_duyet',
        label: t('chienLuoc.filterTrangThaiDuyet'),
        icon: CheckCircle,
        options: trangThaiDuyetOptions,
        value: filters.trang_thai_duyet,
        onChange: (val: string[]) => setFilter('trang_thai_duyet', val),
      },
      {
        key: 'trang_thai_trien_khai',
        label: t('chienLuoc.filterTrangThaiTrienKhai'),
        icon: PlayCircle,
        options: trangThaiTrienKhaiOptions,
        value: filters.trang_thai_trien_khai,
        onChange: (val: string[]) => setFilter('trang_thai_trien_khai', val),
      },
    ],
    [
      filters.nam,
      filters.trang_thai_duyet,
      filters.trang_thai_trien_khai,
      setFilter,
      t,
      yearOptions,
      trangThaiDuyetOptions,
      trangThaiTrienKhaiOptions,
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
      showBack={showBack}
      onBack={() => navigate('/dieu-hanh')}
      searchPlaceholder={t('chienLuoc.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ChienLuocToolbar;
