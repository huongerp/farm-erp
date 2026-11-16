import React, { useMemo } from 'react';
import type { TaiSanTomTat } from '../services/danh-muc-tai-san-service';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Layers, MapPin, Download, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useDanhSachTaiSanStore } from '../store/useDanhSachTaiSanStore';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import { useDanhSachTaiSanFilterCounts } from '../hooks/use-danh-sach-tai-san-filter-counts';

interface Props {
  /** Danh sách tài sản người dùng được xem. Count filter chip đếm trên list này. */
  /**
   * Danh sách TÓM TẮT toàn bộ tài sản (không phải trang đang xem) — chip lọc phải
   * đếm trên toàn bộ dữ liệu, xem `getTaiSanTomTat`.
   */
  items?: TaiSanTomTat[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  /** Mở hộp thoại Xuất chuẩn (ExportDialog: Excel/CSV/PDF/Google Sheet). */
  onExport?: () => void;
  /** Mở hộp thoại Import Excel chuẩn (ImportDialog). */
  onImport?: () => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const DanhSachTaiSanToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onExport, onImport, canCreate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useDanhSachTaiSanStore);
  const filters = useDanhSachTaiSanStore((s) => s.filters);
  const setFilter = useDanhSachTaiSanStore((s) => s.setFilter);
  const columns = useDanhSachTaiSanStore((s) => s.columns);
  const toggleColumn = useDanhSachTaiSanStore((s) => s.toggleColumn);
  const reorderColumns = useDanhSachTaiSanStore((s) => s.reorderColumns);
  const resetColumns = useDanhSachTaiSanStore((s) => s.resetColumns);
  const resetColumnWidths = useDanhSachTaiSanStore((s) => s.resetColumnWidths);
  const selectedIds = useDanhSachTaiSanStore((s) => s.selectedIds);
  const clearSelection = useDanhSachTaiSanStore((s) => s.clearSelection);
  const { data: groups = [] } = useAssetGroups();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: statuses = [] } = useAssetStatuses();
  const { nhomCounts, noiLuuCounts, trangThaiCounts } = useDanhSachTaiSanFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    filters.id_nhom.length +
    filters.id_noi_luu.length +
    filters.id_trang_thai.length;
  const handleClearAllFilters = () => {
    setFilter('id_nhom', []);
    setFilter('id_noi_luu', []);
    setFilter('id_trang_thai', []);
  };

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

  const iconBtnClass =
    'inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50';

  const mobileActions = useMemo(
    () => [
      ...(onImport ? [{ key: 'import', label: t('common.import'), icon: Upload, onClick: onImport, description: '' }] : []),
      ...(onExport ? [{ key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' }] : []),
    ],
    [onImport, onExport, t]
  );

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        {onImport && (
          <Tooltip content={t('common.import')} placement="bottom">
            <Button variant="outline" size="sm" onClick={onImport} className={iconBtnClass} aria-label={t('common.import')}>
              <Upload className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
        {onExport && (
          <Tooltip content={t('common.export')} placement="bottom">
            <Button variant="outline" size="sm" onClick={onExport} className={iconBtnClass} aria-label={t('common.export')}>
              <Download className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
      </div>
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
      { key: 'id_nhom', label: t('danhSachTaiSan.store.nhomCol'), icon: Layers, options: groupOptions, value: filters.id_nhom, onChange: (val: string[]) => setFilter('id_nhom', val) },
      { key: 'id_noi_luu', label: t('danhSachTaiSan.store.noiLuuCol'), icon: MapPin, options: locationOptions, value: filters.id_noi_luu, onChange: (val: string[]) => setFilter('id_noi_luu', val) },
      { key: 'id_trang_thai', label: t('danhSachTaiSan.store.trangThaiCol'), icon: Tag, options: assetStatusOptions, value: filters.id_trang_thai, onChange: (val: string[]) => setFilter('id_trang_thai', val) },
    ],
    [filters, groupOptions, locationOptions, assetStatusOptions, setFilter, t]
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      mobileActions={mobileActions.length > 0 ? mobileActions : undefined}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
    />
  );
};

export default DanhSachTaiSanToolbar;
