import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Layers, MapPin, FileSpreadsheet, FileDown, ChevronDown } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useDanhSachTaiSanStore } from '../store/useDanhSachTaiSanStore';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import { useDanhSachTaiSanFilterCounts } from '../hooks/use-danh-sach-tai-san-filter-counts';
import type { TaiSan } from '../core/types';

interface Props {
  /** Danh sách tài sản người dùng được xem. Count filter chip đếm trên list này. */
  items?: TaiSan[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: 0 | 1) => void;
  /** Xuất danh sách hiện tại ra Excel */
  onExportExcel?: () => void;
  /** Xuất danh sách hiện tại ra PDF */
  onExportPDF?: () => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const DanhSachTaiSanToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany, onExportExcel, onExportPDF, canCreate = true, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
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
  } = useDanhSachTaiSanStore();
  const { data: groups = [] } = useAssetGroups();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: statuses = [] } = useAssetStatuses();
  const { statusCounts, nhomCounts, noiLuuCounts, trangThaiCounts } = useDanhSachTaiSanFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    filters.status.length +
    filters.id_nhom.length +
    filters.id_noi_luu.length +
    filters.id_trang_thai.length;
  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('id_nhom', []);
    setFilter('id_noi_luu', []);
    setFilter('id_trang_thai', []);
  };

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: statusCounts.Active ?? 0 },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: statusCounts.Inactive ?? 0 },
    ],
    [t, statusCounts]
  );
  const groupOptions = useMemo(
    () => groups.map((g) => ({ label: g.ten, value: g.id, subLabel: g.ma, count: nhomCounts[g.id] ?? 0 })),
    [groups, nhomCounts]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ma_noi_luu, count: noiLuuCounts[l.id] ?? 0 })),
    [locations, noiLuuCounts]
  );
  const assetStatusOptions = useMemo(
    () => statuses.map((s) => ({ label: s.ten, value: s.id, subLabel: s.ma, count: trangThaiCounts[s.id] ?? 0 })),
    [statuses, trangThaiCounts]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={groupOptions}
        value={filters.id_nhom}
        onChange={(val) => setFilter('id_nhom', val)}
        placeholder={t('danhSachTaiSan.store.nhomCol')}
        icon={Layers}
        className="w-full sm:w-[180px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={locationOptions}
        value={filters.id_noi_luu}
        onChange={(val) => setFilter('id_noi_luu', val)}
        placeholder={t('danhSachTaiSan.store.noiLuuCol')}
        icon={MapPin}
        className="w-full sm:w-[180px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={assetStatusOptions}
        value={filters.id_trang_thai}
        onChange={(val) => setFilter('id_trang_thai', val)}
        placeholder={t('danhSachTaiSan.store.trangThaiCol')}
        icon={Tag}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showExportMenu) return;
    const close = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showExportMenu]);

  const hasExport = Boolean(onExportExcel || onExportPDF);
  const renderActions = (
    <>
      {hasExport && (
        <div className="relative" ref={exportMenuRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-3 border-border"
            onClick={() => setShowExportMenu((v) => !v)}
          >
            <FileDown className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('danhSachTaiSan.stats.exportReport')}</span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 py-1 min-w-[140px] rounded-lg border border-border bg-card shadow-lg z-50">
              {onExportExcel && (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/60"
                  onClick={() => { onExportExcel(); setShowExportMenu(false); }}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {t('danhSachTaiSan.export.excel')}
                </button>
              )}
              {onExportPDF && (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/60"
                  onClick={() => { onExportPDF(); setShowExportMenu(false); }}
                >
                  <FileDown className="w-4 h-4" />
                  {t('danhSachTaiSan.export.pdf')}
                </button>
              )}
            </div>
          )}
        </div>
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

  const filterGroups = useMemo(
    () => [
      { key: 'status', label: t('common.status'), icon: Tag, options: statusOptions, value: filters.status, onChange: (val: string[]) => setFilter('status', val) },
      { key: 'id_nhom', label: t('danhSachTaiSan.store.nhomCol'), icon: Layers, options: groupOptions, value: filters.id_nhom, onChange: (val: string[]) => setFilter('id_nhom', val) },
      { key: 'id_noi_luu', label: t('danhSachTaiSan.store.noiLuuCol'), icon: MapPin, options: locationOptions, value: filters.id_noi_luu, onChange: (val: string[]) => setFilter('id_noi_luu', val) },
      { key: 'id_trang_thai', label: t('danhSachTaiSan.store.trangThaiCol'), icon: Tag, options: assetStatusOptions, value: filters.id_trang_thai, onChange: (val: string[]) => setFilter('id_trang_thai', val) },
    ],
    [filters, statusOptions, groupOptions, locationOptions, assetStatusOptions, setFilter, t]
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
      onAdd={canCreate ? onAdd : undefined}
      searchPlaceholder={t('danhSachTaiSan.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      onStatusChangeMany={canUpdate ? (status) => onStatusChangeMany(Array.from(selectedIds), status) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default DanhSachTaiSanToolbar;
