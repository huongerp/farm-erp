import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Package, User, Upload, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { useKyNgayChip } from '../../../quan-ly-nha-so-che/shared/use-ky-ngay-chip';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useCapPhatThuHoiStore } from '../store/useCapPhatThuHoiStore';
import { useEmployeesRefQuery } from '@/lib/hooks/use-ref-queries';
import { LOAI_PHIEU_OPTIONS } from '../core/constants';
import { useCapPhatThuHoiFilterCounts } from '../hooks/use-cap-phat-thu-hoi-filter-counts';
import type { PhieuCapPhatThuHoi } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';
import NutInHangLoat from '../../../../components/shared/phieu-in/NutInHangLoat';

interface Props {
  items?: PhieuCapPhatThuHoi[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onImport?: () => void;
  onExport?: () => void;
  showAdd?: boolean;
  canDelete?: boolean;
}

const CapPhatThuHoiToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
  onImport,
  onExport,
  showAdd = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useCapPhatThuHoiStore);
  const filters = useCapPhatThuHoiStore((s) => s.filters);
  const setFilter = useCapPhatThuHoiStore((s) => s.setFilter);
  const datKhoang = (tu: string, den: string) => {
    setFilter('dateFrom', tu);
    setFilter('dateTo', den);
  };
  const kyNgay = useKyNgayChip(filters.dateFrom ?? '', filters.dateTo ?? '', datKhoang);
  const resetFilters = useCapPhatThuHoiStore((s) => s.resetFilters);
  const columns = useCapPhatThuHoiStore((s) => s.columns);
  const toggleColumn = useCapPhatThuHoiStore((s) => s.toggleColumn);
  const reorderColumns = useCapPhatThuHoiStore((s) => s.reorderColumns);
  const resetColumns = useCapPhatThuHoiStore((s) => s.resetColumns);
  const resetColumnWidths = useCapPhatThuHoiStore((s) => s.resetColumnWidths);
  const selectedIds = useCapPhatThuHoiStore((s) => s.selectedIds);
  const clearSelection = useCapPhatThuHoiStore((s) => s.clearSelection);
  const { data: employees = [] } = useEmployeesRefQuery();
  const { loaiCounts, nguoiThucHienCounts } = useCapPhatThuHoiFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const loaiOptions = useMemo(
    () =>
      LOAI_PHIEU_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value,
        count: loaiCounts[o.value] ?? 0,
      })),
    [t, loaiCounts]
  );
  const nguoiThucHienOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiThucHienCounts[e.id] ?? 0,
      })),
    [employees, nguoiThucHienCounts]
  );
  const activeFilterCount =
    filters.loai_phieu.length +
    filters.id_nguoi_thuc_hien.length +
    (kyNgay.coKy ? 1 : 0);
  const handleClearAllFilters = () => resetFilters();

  const filterGroups = useMemo(
    () => [
      { key: 'loai_phieu', label: t('capPhatThuHoi.store.loaiCol'), icon: Package, options: loaiOptions, value: filters.loai_phieu, onChange: (val: string[]) => setFilter('loai_phieu', val) },
      { key: 'id_nguoi_thuc_hien', label: t('capPhatThuHoi.store.nguoiThucHienCol'), icon: User, options: nguoiThucHienOptions, value: filters.id_nguoi_thuc_hien, onChange: (val: string[]) => setFilter('id_nguoi_thuc_hien', val) },
    ],
    [loaiOptions, nguoiThucHienOptions, filters.loai_phieu, filters.id_nguoi_thuc_hien, setFilter, t]
  );

  const filterItems: FilterChipItem[] = [
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[160px]' },
    kyNgay.chipItem,
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[180px]' },
  ];

  const renderActions = (
    <div className="flex items-center gap-2">
      {showAdd && onImport && (
        <Tooltip content={t('capPhatThuHoi.toolbar.importData')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onImport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted"
            aria-label={t('capPhatThuHoi.toolbar.importData')}
          >
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {onExport && (
        <Tooltip content={t('capPhatThuHoi.toolbar.exportData')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted"
            aria-label={t('capPhatThuHoi.toolbar.exportData')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {showAdd && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(() => {
    const actions: ActionItem[] = [];
    if (showAdd && onImport) {
      actions.push({ label: t('common.import'), icon: Upload, onClick: onImport });
    }
    if (onExport) {
      actions.push({ label: t('common.export'), icon: Download, onClick: onExport });
    }
    if (showAdd) {
      actions.push({ label: t('common.addNew'), icon: Plus, onClick: onAdd });
    }
    return actions;
  }, [t, onAdd, onImport, onExport, showAdd]);

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      bulkActions={<NutInHangLoat mau="cap-phat-thu-hoi" ids={Array.from(selectedIds)} />}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileFilterExtra={kyNgay.mobileFilterExtra}
      mobileFilterExtraCount={kyNgay.coKy ? 1 : 0}
      onAdd={onAdd}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete && selectedCount > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
      mobileActions={mobileActions}
    />
  );
};

export default CapPhatThuHoiToolbar;
