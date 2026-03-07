import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { BTN_ADD } from '../../../../lib/button-labels';
import { usePhanTichDoiThuStore } from '../store/usePhanTichDoiThuStore';
import type { DoiThu } from '../core/types';
import { LOAI_DOI_THU_LABELS } from '../core/constants';
import type { LoaiDoiThu } from '../core/constants';

interface Props {
  data: DoiThu[];
  onAdd: () => void;
  /** Ẩn nút Back (dùng khi page có hàng Back + Tabs riêng) */
  showBack?: boolean;
}

const LOAI_OPTIONS: { value: LoaiDoiThu; labelKey: string }[] = [
  { value: 'dau_nganh', labelKey: 'phanTichDoiThu.loai.dauNganh' },
  { value: 'truc_tiep', labelKey: 'phanTichDoiThu.loai.trucTiep' },
  { value: 'tiem_nang', labelKey: 'phanTichDoiThu.loai.tiemNang' },
];

const PhanTichDoiThuToolbar: React.FC<Props> = ({ data, onAdd, showBack = true }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm, filters, setFilter, columns, toggleColumn, reorderColumns, resetColumns } =
    usePhanTichDoiThuStore();

  const activeFilterCount = useMemo(
    () => (searchTerm ? 1 : 0) + (filters.phan_loai.length > 0 ? 1 : 0),
    [searchTerm, filters.phan_loai.length]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('phan_loai', []);
  };

  const loaiOptions = useMemo(
    () =>
      LOAI_OPTIONS.map((opt) => ({
        label: t(opt.labelKey),
        value: opt.value,
        count: data.filter((d) => d.phan_loai === opt.value).length,
      })),
    [data, t]
  );

  const renderFilters = (
    <FilterChipMultiSelect
      options={loaiOptions}
      value={filters.phan_loai}
      onChange={(v) => setFilter('phan_loai', v)}
      placeholder={t('phanTichDoiThu.filterLoai')}
      className="w-full sm:w-[160px]"
    />
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'phan_loai',
        label: t('phanTichDoiThu.filterLoai'),
        icon: TrendingUp,
        options: loaiOptions,
        value: filters.phan_loai,
        onChange: (val: string[]) => setFilter('phan_loai', val),
      },
    ],
    [filters.phan_loai, setFilter, t, loaiOptions]
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
      searchPlaceholder={t('phanTichDoiThu.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default PhanTichDoiThuToolbar;
