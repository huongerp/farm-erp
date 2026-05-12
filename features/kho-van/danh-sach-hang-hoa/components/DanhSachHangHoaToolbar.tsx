import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Upload, Tag, Folder, FolderTree, Ruler } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useHangHoaStore } from '../store/useHangHoaStore';
import { useDanhMucHangHoaList } from '../../danh-muc-hang-hoa/hooks/use-danh-muc-hang-hoa';
import type { HangHoa } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

interface Props {
  data: HangHoa[];
  selectedCount: number;
  onAdd: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onDeleteMany: () => void;
  onStatusChangeMany?: (status: 0 | 1) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const DanhSachHangHoaToolbar: React.FC<Props> = ({
  data,
  selectedCount,
  onAdd,
  onExport,
  onImport,
  onDeleteMany,
  onStatusChangeMany,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { data: danhMucList = [] } = useDanhMucHangHoaList();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useHangHoaStore);
  const filters = useHangHoaStore((s) => s.filters);
  const setFilter = useHangHoaStore((s) => s.setFilter);
  const clearSelection = useHangHoaStore((s) => s.clearSelection);
  const columns = useHangHoaStore((s) => s.columns);
  const toggleColumn = useHangHoaStore((s) => s.toggleColumn);
  const reorderColumns = useHangHoaStore((s) => s.reorderColumns);
  const resetColumns = useHangHoaStore((s) => s.resetColumns);

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
    danhMucChaList.forEach((d) => { m[d.id] = d; });
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

  const phanLoaiOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((h) => {
      const p = h.phan_loai?.trim();
      if (p) counts[p] = (counts[p] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value]) => ({ label: value, value, count: counts[value] }));
  }, [data]);

  const statusOptions = useMemo(
    () => [
      {
        label: t('common.activeStatus'),
        value: 'Active',
        count: data.filter((d) => d.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).length,
      },
      {
        label: t('common.inactiveStatus'),
        value: 'Inactive',
        count: data.filter((d) => d.trang_thai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG).length,
      },
    ],
    [data, t]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (filters.status.length > 0 ? 1 : 0) +
      (filters.id_danh_muc_cha.length > 0 ? 1 : 0) +
      (filters.id_danh_muc.length > 0 ? 1 : 0) +
      (filters.phan_loai.length > 0 ? 1 : 0) +
      (filters.dvt.length > 0 ? 1 : 0),
    [
      searchInput,
      filters.status.length,
      filters.id_danh_muc_cha.length,
      filters.id_danh_muc.length,
      filters.phan_loai.length,
      filters.dvt.length,
    ]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('status', []);
    setFilter('id_danh_muc_cha', []);
    setFilter('id_danh_muc', []);
    setFilter('phan_loai', []);
    setFilter('dvt', []);
  };

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={danhMucChaOptions}
        value={filters.id_danh_muc_cha}
        onChange={(v) => setFilter('id_danh_muc_cha', v)}
        placeholder={t('hangHoa.filters.danhMucCha')}
        icon={Folder}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={danhMucConOptions}
        value={filters.id_danh_muc}
        onChange={(v) => setFilter('id_danh_muc', v)}
        placeholder={t('hangHoa.filters.danhMucCon')}
        icon={FolderTree}
        className="w-full sm:w-[200px]"
      />
      <FilterChipMultiSelect
        options={phanLoaiOptions}
        value={filters.phan_loai}
        onChange={(v) => setFilter('phan_loai', v)}
        placeholder={t('hangHoa.filters.phanLoai')}
        icon={Tag}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={dvtOptions}
        value={filters.dvt}
        onChange={(v) => setFilter('dvt', v)}
        placeholder={t('hangHoa.filters.dvt')}
        icon={Ruler}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(v) => setFilter('status', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_danh_muc_cha',
        label: t('hangHoa.filters.danhMucCha'),
        icon: Folder,
        options: danhMucChaOptions,
        value: filters.id_danh_muc_cha,
        onChange: (val: string[]) => setFilter('id_danh_muc_cha', val),
      },
      {
        key: 'id_danh_muc',
        label: t('hangHoa.filters.danhMucCon'),
        icon: FolderTree,
        options: danhMucConOptions,
        value: filters.id_danh_muc,
        onChange: (val: string[]) => setFilter('id_danh_muc', val),
      },
      {
        key: 'phan_loai',
        label: t('hangHoa.filters.phanLoai'),
        icon: Tag,
        options: phanLoaiOptions,
        value: filters.phan_loai,
        onChange: (val: string[]) => setFilter('phan_loai', val),
      },
      {
        key: 'dvt',
        label: t('hangHoa.filters.dvt'),
        icon: Ruler,
        options: dvtOptions,
        value: filters.dvt,
        onChange: (val: string[]) => setFilter('dvt', val),
      },
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
    ],
    [
      filters.id_danh_muc_cha,
      filters.id_danh_muc,
      filters.phan_loai,
      filters.dvt,
      filters.status,
      setFilter,
      t,
      danhMucChaOptions,
      danhMucConOptions,
      phanLoaiOptions,
      dvtOptions,
      statusOptions,
    ]
  );

  const mobileActions = useMemo(
    () => [
      ...(onImport
        ? [
            {
              key: 'import',
              label: t('hangHoa.toolbar.importData'),
              icon: Upload,
              onClick: onImport,
              description: t('hangHoa.toolbar.importDesc'),
            },
          ]
        : []),
      ...(onExport
        ? [
            {
              key: 'export',
              label: t('hangHoa.toolbar.exportData'),
              icon: Download,
              onClick: onExport,
              description: t('hangHoa.toolbar.exportDesc'),
            },
          ]
        : []),
    ],
    [onImport, onExport, t]
  );

  const renderActions = (
    <>
      {onImport && (
        <Tooltip content={t('hangHoa.toolbar.importData')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {onExport && (
        <Tooltip content={t('hangHoa.toolbar.exportData')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted"
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {canCreate && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      )}
    </>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      onStatusChangeMany={canUpdate ? onStatusChangeMany : undefined}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('hangHoa.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default DanhSachHangHoaToolbar;
