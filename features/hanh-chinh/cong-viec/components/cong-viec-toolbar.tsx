import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FolderOpen, Tag, User, ListOrdered, List, LayoutGrid, GanttChart, Download, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useCongViecStore } from '../store/useCongViecStore';
import { getTrangThaiOptions, getUuTienOptions } from '../core/constants';
import { useDuAnList } from '../../du-an/hooks/use-du-an';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';
import { useCongViecFilterCounts } from '../hooks/use-cong-viec-filter-counts';
import type { CongViec } from '../core/types';

export type CongViecViewMode = 'list' | 'kanban' | 'gantt';

interface Props {
  /** Danh sách công việc người dùng được xem (sau scope). Count filter chip đếm trên list này. */
  items?: CongViec[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onExport?: () => void;
  onImport?: () => void;
  viewMode?: CongViecViewMode;
  onViewModeChange?: (mode: CongViecViewMode) => void;
  /** Ẩn nút chuyển List/Kanban/Gantt khi dùng tab riêng (vd. CongViecScopeTab) */
  hideViewMode?: boolean;
}

const CongViecToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onExport, onImport, viewMode = 'list', onViewModeChange, hideViewMode }) => {
  const { t } = useTranslation();
  const { data: duAnList = [] } = useDuAnList();
  const { data: employees = [] } = useEmployees();
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
  } = useCongViecStore();
  const { duAnCounts, trangThaiCounts, uuTienCounts, nguoiThucHienCounts } = useCongViecFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    (filters.id_du_an?.length ?? 0) +
    (filters.trang_thai?.length ?? 0) +
    (filters.uu_tien?.length ?? 0) +
    (filters.nguoi_thuc_hien?.length ?? 0);
  const handleClearAllFilters = () => {
    setFilter('id_du_an', []);
    setFilter('trang_thai', []);
    setFilter('uu_tien', []);
    setFilter('nguoi_thuc_hien', []);
  };

  const duAnOptions = useMemo(
    () => duAnList.map((d) => ({ label: d.ten_du_an, value: d.id, count: duAnCounts[d.id] ?? 0 })),
    [duAnList, duAnCounts]
  );
  const trangThaiOptions = useMemo(
    () => getTrangThaiOptions(t).map((o) => ({ ...o, count: trangThaiCounts[o.value] ?? 0 })),
    [t, trangThaiCounts]
  );
  const uuTienOptions = useMemo(
    () => getUuTienOptions(t).map((o) => ({ ...o, count: uuTienCounts[o.value] ?? 0 })),
    [t, uuTienCounts]
  );
  const nguoiThucHienOptions = useMemo(
    () => employees.slice(0, 200).map((e) => ({ label: e.full_name || e.ma_nhan_vien, value: e.id, count: nguoiThucHienCounts[e.id] ?? 0 })),
    [employees, nguoiThucHienCounts]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={duAnOptions}
        value={filters.id_du_an ?? []}
        onChange={(val) => setFilter('id_du_an', val)}
        placeholder={t('congViec.form.duAn')}
        icon={FolderOpen}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.trang_thai ?? []}
        onChange={(val) => setFilter('trang_thai', val)}
        placeholder={t('congViec.store.trangThaiCol')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={uuTienOptions}
        value={filters.uu_tien ?? []}
        onChange={(val) => setFilter('uu_tien', val)}
        placeholder={t('congViec.store.uuTienCol')}
        icon={ListOrdered}
        className="w-full sm:w-[120px]"
      />
      <FilterChipMultiSelect
        options={nguoiThucHienOptions}
        value={filters.nguoi_thuc_hien ?? []}
        onChange={(val) => setFilter('nguoi_thuc_hien', val)}
        placeholder={t('congViec.form.nguoiThucHien')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      {onImport && (
        <Tooltip content={t('congViec.toolbar.importData')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onImport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted"
            aria-label={t('congViec.toolbar.importData')}
          >
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {onExport && (
        <Tooltip content={t('congViec.toolbar.exportData')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted"
            aria-label={t('congViec.toolbar.exportData')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {onViewModeChange && !hideViewMode && (
        <div className="flex rounded-lg border border-border overflow-hidden">
          <Tooltip content={t('congViec.viewList')} placement="bottom">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              aria-label={t('congViec.viewList')}
            >
              <List size={16} />
            </button>
          </Tooltip>
          <Tooltip content={t('congViec.viewKanban')} placement="bottom">
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`p-2 ${viewMode === 'kanban' ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              aria-label={t('congViec.viewKanban')}
            >
              <LayoutGrid size={16} />
            </button>
          </Tooltip>
          <Tooltip content={t('congViec.viewGantt')} placement="bottom">
            <button
              type="button"
              onClick={() => onViewModeChange('gantt')}
              className={`p-2 ${viewMode === 'gantt' ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              aria-label={t('congViec.viewGantt')}
            >
              <GanttChart size={16} />
            </button>
          </Tooltip>
        </div>
      )}
      <Button
        onClick={onAdd}
        size="sm"
        className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
      >
        <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('common.addNew')}</span>
      </Button>
    </div>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={[]}
      onAdd={onAdd}
      searchPlaceholder={t('congViec.searchPlaceholder')}
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

export default CongViecToolbar;
