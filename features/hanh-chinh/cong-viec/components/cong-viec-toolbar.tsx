import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, User, ListOrdered, List, LayoutGrid, GanttChart, Download, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useCongViecStore } from '../store/useCongViecStore';
import { getTrangThaiOptions, getUuTienOptions } from '../core/constants';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useCongViecFilterCounts } from '../hooks/use-cong-viec-filter-counts';
import { TRANG_THAI_NV } from '../../../../lib/constants';
import type { CongViec } from '../core/types';

export type CongViecViewMode = 'list' | 'kanban' | 'gantt';

interface Props {
  /** Danh sách công việc người dùng được xem (sau scope). Count filter chip đếm trên list này. */
  items?: CongViec[];
  onAdd?: () => void;
  onDeleteMany?: (ids: (number | string)[]) => void;
  onExport?: () => void;
  onImport?: () => void;
  viewMode?: CongViecViewMode;
  onViewModeChange?: (mode: CongViecViewMode) => void;
  /** Ẩn nút chuyển List/Kanban/Gantt khi dùng tab riêng (vd. CongViecScopeTab) */
  hideViewMode?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

const CongViecToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onExport, onImport, viewMode = 'list', onViewModeChange, hideViewMode, canCreate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployeesRefQuery();
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
  const { trangThaiCounts, uuTienCounts, trachNhiemCounts } = useCongViecFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    (filters.trang_thai?.length ?? 0) +
    (filters.uu_tien?.length ?? 0) +
    (filters.trach_nhiem?.length ?? 0);
  const handleClearAllFilters = () => {
    setFilter('trang_thai', []);
    setFilter('uu_tien', []);
    setFilter('trach_nhiem', []);
  };

  const trangThaiOptions = useMemo(
    () => getTrangThaiOptions(t).map((o) => ({ ...o, count: trangThaiCounts[o.value] ?? 0 })),
    [t, trangThaiCounts]
  );
  const uuTienOptions = useMemo(
    () => getUuTienOptions(t).map((o) => ({ ...o, count: uuTienCounts[o.value] ?? 0 })),
    [t, uuTienCounts]
  );
  const trachNhiemOptions = useMemo(() => {
    const toKey = (id: string | number) => String(typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10) || 0);
    return employees
      .filter((e) => e.trang_thai === TRANG_THAI_NV.DANG_LAM_VIEC)
      .slice(0, 200)
      .map((e) => {
        const key = toKey(e.id);
        const label = e.ho_ten ? `${e.ho_ten}${e.ma_nhan_vien ? ` (${e.ma_nhan_vien})` : ''}` : e.ma_nhan_vien || key;
        return { label, value: key, count: trachNhiemCounts[key] ?? 0 };
      });
  }, [employees, trachNhiemCounts]);

  const renderFilters = (
    <>
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
        options={trachNhiemOptions}
        value={(filters.trach_nhiem ?? []).map(String)}
        onChange={(val) => setFilter('trach_nhiem', val.map(Number).filter((n) => !Number.isNaN(n)))}
        placeholder={t('congViec.form.trachNhiem')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      {canCreate && onImport && (
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
      {canCreate && onAdd && (
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

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={[]}
      onAdd={canCreate ? onAdd : undefined}
      searchPlaceholder={t('congViec.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete && onDeleteMany ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default CongViecToolbar;
