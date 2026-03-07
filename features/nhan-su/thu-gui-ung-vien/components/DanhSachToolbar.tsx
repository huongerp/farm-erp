import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, FileText, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import Tooltip from '../../../../components/ui/Tooltip';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useThuGuiUngVienStore } from '../store/useThuGuiUngVienStore';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import { getLoaiThuLabel } from '../core/constants';
import type { ThuGuiUngVien } from '../core/types';
import type { LoaiThuSlug } from '../core/constants';

const LOAI_THU_VALUES: LoaiThuSlug[] = ['tu-choi', 'moi-nhan-viec'];

interface Props {
  items?: ThuGuiUngVien[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onExport?: () => void;
}

const DanhSachToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onExport }) => {
  const { t } = useTranslation();
  const { data: ungVienList = [] } = useUngViens();
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
  } = useThuGuiUngVienStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.id_ung_vien.length + filters.loai_thu.length;

  const handleClearAllFilters = () => {
    setFilter('id_ung_vien', []);
    setFilter('loai_thu', []);
  };

  const ungVienOptions = useMemo(
    () =>
      ungVienList.map((u) => ({
        label: u.ho_ten,
        value: u.id,
        count: items.filter((i) => i.id_ung_vien === u.id).length,
      })),
    [ungVienList, items]
  );

  const loaiThuOptions = useMemo(
    () =>
      LOAI_THU_VALUES.map((value) => ({
        label: getLoaiThuLabel(value, t),
        value,
        count: items.filter((i) => i.loai_thu === value).length,
      })),
    [t, items]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={ungVienOptions}
        value={filters.id_ung_vien}
        onChange={(val) => setFilter('id_ung_vien', val)}
        placeholder={t('thuGuiUngVien.filterUngVien')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={loaiThuOptions}
        value={filters.loai_thu}
        onChange={(val) => setFilter('loai_thu', val)}
        placeholder={t('thuGuiUngVien.filterLoaiPhieu')}
        icon={FileText}
        className="w-full sm:w-[140px]"
      />
    </>
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      {onExport && (
        <Tooltip content={t('thuGuiUngVien.exportList')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-9 px-3 sm:px-4 border-border"
          >
            <Download className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('thuGuiUngVien.exportList')}</span>
          </Button>
        </Tooltip>
      )}
      <Button
        onClick={onAdd}
        size="sm"
        className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
      >
        <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('thuGuiUngVien.add')}</span>
      </Button>
    </div>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_ung_vien',
        label: t('thuGuiUngVien.filterUngVien'),
        icon: User,
        options: ungVienOptions,
        value: filters.id_ung_vien,
        onChange: (val: string[]) => setFilter('id_ung_vien', val),
      },
      {
        key: 'loai_thu',
        label: t('thuGuiUngVien.filterLoaiPhieu'),
        icon: FileText,
        options: loaiThuOptions,
        value: filters.loai_thu,
        onChange: (val: string[]) => setFilter('loai_thu', val),
      },
    ],
    [t, ungVienOptions, loaiThuOptions, filters, setFilter]
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
      searchPlaceholder={t('thuGuiUngVien.searchPlaceholder')}
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

export default DanhSachToolbar;
