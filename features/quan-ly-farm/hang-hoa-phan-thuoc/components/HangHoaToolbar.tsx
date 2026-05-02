import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Folder, FolderTree, Ruler } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useFarmHangHoaStore } from '../store/useFarmHangHoaStore';
import { useFarmDanhMucList } from '../hooks/use-farm-danh-muc';
import type { FarmHangHoa } from '../core/types';

interface Props {
  data: FarmHangHoa[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const HangHoaToolbar: React.FC<Props> = ({
  data,
  selectedCount,
  onAdd,
  onDeleteMany,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { data: danhMucList = [] } = useFarmDanhMucList();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useFarmHangHoaStore);
  const filters = useFarmHangHoaStore((s) => s.filters);
  const setFilter = useFarmHangHoaStore((s) => s.setFilter);
  const clearSelection = useFarmHangHoaStore((s) => s.clearSelection);
  const columns = useFarmHangHoaStore((s) => s.columns);
  const toggleColumn = useFarmHangHoaStore((s) => s.toggleColumn);
  const reorderColumns = useFarmHangHoaStore((s) => s.reorderColumns);
  const resetColumns = useFarmHangHoaStore((s) => s.resetColumns);

  const danhMucChaList = useMemo(
    () => danhMucList.filter((d) => !d.id_cha || d.id_cha.trim() === ''),
    [danhMucList]
  );
  const danhMucConList = useMemo(
    () => danhMucList.filter((d) => d.id_cha && d.id_cha.trim() !== ''),
    [danhMucList]
  );
  const chaById = useMemo(() => {
    const m: Record<string, { ten_danh_muc: string }> = {};
    danhMucChaList.forEach((d) => {
      m[d.id] = d;
    });
    return m;
  }, [danhMucChaList]);

  const danhMucChaOptions = useMemo(
    () =>
      danhMucChaList.map((p) => ({
        label: p.ten_danh_muc,
        value: p.id,
        count: data.filter((h) => h.danh_muc_cha_id === p.id).length,
      })),
    [danhMucChaList, data]
  );

  const danhMucConOptions = useMemo(
    () =>
      danhMucConList.map((c) => {
        const tenCha = c.id_cha ? chaById[c.id_cha]?.ten_danh_muc : '';
        const label = tenCha ? `${tenCha} / ${c.ten_danh_muc}` : c.ten_danh_muc;
        return {
          label,
          value: c.id,
          count: data.filter((h) => h.danh_muc_id === c.id).length,
        };
      }),
    [danhMucConList, chaById, data]
  );

  const dvtOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((h) => {
      const d = h.dvt?.trim();
      if (d) counts[d] = (counts[d] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value]) => ({ label: value, value, count: counts[value] }));
  }, [data]);

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (filters.id_danh_muc_cha.length > 0 ? 1 : 0) +
      (filters.id_danh_muc.length > 0 ? 1 : 0) +
      (filters.dvt.length > 0 ? 1 : 0),
    [searchInput, filters.id_danh_muc_cha.length, filters.id_danh_muc.length, filters.dvt.length]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('id_danh_muc_cha', []);
    setFilter('id_danh_muc', []);
    setFilter('dvt', []);
  };

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={danhMucChaOptions}
        value={filters.id_danh_muc_cha}
        onChange={(v) => setFilter('id_danh_muc_cha', v)}
        placeholder={t('farmHangHoaPhanThuoc.hangHoa.filters.danhMucCha')}
        icon={Folder}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={danhMucConOptions}
        value={filters.id_danh_muc}
        onChange={(v) => setFilter('id_danh_muc', v)}
        placeholder={t('farmHangHoaPhanThuoc.hangHoa.filters.danhMucCon')}
        icon={FolderTree}
        className="w-full sm:w-[200px]"
      />
      <FilterChipMultiSelect
        options={dvtOptions}
        value={filters.dvt}
        onChange={(v) => setFilter('dvt', v)}
        placeholder={t('farmHangHoaPhanThuoc.hangHoa.filters.dvt')}
        icon={Ruler}
        className="w-full sm:w-[140px]"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_danh_muc_cha',
        label: t('farmHangHoaPhanThuoc.hangHoa.filters.danhMucCha'),
        icon: Folder,
        options: danhMucChaOptions,
        value: filters.id_danh_muc_cha,
        onChange: (val: string[]) => setFilter('id_danh_muc_cha', val),
      },
      {
        key: 'id_danh_muc',
        label: t('farmHangHoaPhanThuoc.hangHoa.filters.danhMucCon'),
        icon: FolderTree,
        options: danhMucConOptions,
        value: filters.id_danh_muc,
        onChange: (val: string[]) => setFilter('id_danh_muc', val),
      },
      {
        key: 'dvt',
        label: t('farmHangHoaPhanThuoc.hangHoa.filters.dvt'),
        icon: Ruler,
        options: dvtOptions,
        value: filters.dvt,
        onChange: (val: string[]) => setFilter('dvt', val),
      },
    ],
    [
      filters.id_danh_muc_cha,
      filters.id_danh_muc,
      filters.dvt,
      setFilter,
      t,
      danhMucChaOptions,
      danhMucConOptions,
      dvtOptions,
    ]
  );

  const renderActions = canCreate ? (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  ) : null;

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('farmHangHoaPhanThuoc.hangHoa.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default HangHoaToolbar;
