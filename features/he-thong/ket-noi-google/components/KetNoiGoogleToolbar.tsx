import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useKetNoiGoogleStore } from '../store/useKetNoiGoogleStore';
import { tinhTrangKetNoi, type TinhTrangKetNoi } from '../core/trang-thai';
import type { KetNoiGoogle } from '../core/types';

const DS_TINH_TRANG: TinhTrangKetNoi[] = ['hoat_dong', 'co_loi', 'hong', 'nghi_viec'];

/** Toolbar: tìm kiếm + lọc tình trạng. Không có Thêm mới — kết nối do chính nhân viên tạo trong dialog Xuất. */
const KetNoiGoogleToolbar: React.FC<{ items: KetNoiGoogle[] }> = ({ items }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useKetNoiGoogleStore);
  const filters = useKetNoiGoogleStore((s) => s.filters);
  const setFilter = useKetNoiGoogleStore((s) => s.setFilter);
  const columns = useKetNoiGoogleStore((s) => s.columns);
  const toggleColumn = useKetNoiGoogleStore((s) => s.toggleColumn);
  const reorderColumns = useKetNoiGoogleStore((s) => s.reorderColumns);
  const resetColumns = useKetNoiGoogleStore((s) => s.resetColumns);
  const resetColumnWidths = useKetNoiGoogleStore((s) => s.resetColumnWidths);

  const options = useMemo(
    () =>
      DS_TINH_TRANG.map((v) => ({
        value: v,
        label: t(`ketNoiGoogle.status.${v}`),
        count: items.filter((i) => tinhTrangKetNoi(i) === v).length,
      })),
    [items, t],
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'tinhTrang',
        label: t('ketNoiGoogle.col.status'),
        icon: Tag,
        options,
        value: filters.tinhTrang,
        onChange: (val: string[]) => setFilter('tinhTrang', val),
      },
    ],
    [filters.tinhTrang, options, setFilter, t],
  );

  return (
    <GenericToolbar
      selectedCount={0}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={() => {}}
      filters={
        <FilterChipMultiSelect
          options={options}
          value={filters.tinhTrang}
          onChange={(val) => setFilter('tinhTrang', val)}
          placeholder={t('ketNoiGoogle.col.status')}
          icon={Tag}
          className="w-full sm:w-[160px]"
        />
      }
      filterGroups={filterGroups}
      activeFilterCount={filters.tinhTrang.length}
      onClearAllFilters={() => setFilter('tinhTrang', [])}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
    />
  );
};

export default KetNoiGoogleToolbar;
