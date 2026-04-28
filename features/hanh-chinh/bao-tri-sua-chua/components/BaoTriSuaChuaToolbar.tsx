import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wrench, Calendar, Package, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useBaoTriSuaChuaStore } from '../store/useBaoTriSuaChuaStore';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useLoaiChiPhiList } from '../../thiet-lap-tai-san/hooks/use-loai-chi-phi';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { getHangMucLabel } from '../core/constants';
import { useBaoTriSuaChuaFilterCounts } from '../hooks/use-bao-tri-sua-chua-filter-counts';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';

interface Props {
  items?: PhieuBaoTriSuaChua[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  /** Xuất danh sách (ExportDialog) — giống Đơn đặt hàng / Phiếu kho. */
  onExport: () => void;
  showAdd?: boolean;
  canDelete?: boolean;
}

const BaoTriSuaChuaToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
  onExport,
  showAdd = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useBaoTriSuaChuaStore);
  const filters = useBaoTriSuaChuaStore((s) => s.filters);
  const setFilter = useBaoTriSuaChuaStore((s) => s.setFilter);
  const resetFilters = useBaoTriSuaChuaStore((s) => s.resetFilters);
  const columns = useBaoTriSuaChuaStore((s) => s.columns);
  const toggleColumn = useBaoTriSuaChuaStore((s) => s.toggleColumn);
  const reorderColumns = useBaoTriSuaChuaStore((s) => s.reorderColumns);
  const resetColumns = useBaoTriSuaChuaStore((s) => s.resetColumns);
  const selectedIds = useBaoTriSuaChuaStore((s) => s.selectedIds);
  const clearSelection = useBaoTriSuaChuaStore((s) => s.clearSelection);
  const { data: assets = [] } = useTaiSanList();
  const { data: loaiChiPhi = [] } = useLoaiChiPhiList();
  const { hangMucCounts, taiSanCounts } = useBaoTriSuaChuaFilterCounts(items, filters);

  const activeLoai = useMemo(
    () => loaiChiPhi.filter((l) => l.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG),
    [loaiChiPhi]
  );

  const selectedCount = selectedIds.size;
  const hangMucOptions = useMemo(() => {
    const idsSeen = new Set<string>();
    const fromLoai = activeLoai.map((l) => {
      idsSeen.add(l.id);
      return { label: `${l.ten} (${l.ma})`, value: l.id, count: hangMucCounts[l.id] ?? 0 };
    });
    const legacyExtras = Object.keys(hangMucCounts)
      .filter((id) => !idsSeen.has(id))
      .map((id) => ({
        label: getHangMucLabel(id, t),
        value: id,
        count: hangMucCounts[id] ?? 0,
      }));
    return [...fromLoai, ...legacyExtras];
  }, [activeLoai, hangMucCounts, t]);
  const taiSanOptions = useMemo(
    () =>
      assets.map((a) => ({
        label: a.ten_tai_san ?? a.ma_tai_san,
        value: a.id,
        subLabel: a.ma_tai_san,
        count: taiSanCounts[a.id] ?? 0,
      })),
    [assets, taiSanCounts]
  );
  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    filters.hang_muc.length +
    filters.id_tai_san.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);
  const handleClearAllFilters = () => {
    commitSearchTerm('');
    resetFilters();
  };

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={hangMucOptions}
        value={filters.hang_muc}
        onChange={(v) => setFilter('hang_muc', v)}
        placeholder={t('baoTriSuaChua.store.hangMucCol')}
        icon={Wrench}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('baoTriSuaChua.filter.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('baoTriSuaChua.filter.dateTo')}
        />
      </div>
      <FilterChipMultiSelect
        options={taiSanOptions}
        value={filters.id_tai_san}
        onChange={(v) => setFilter('id_tai_san', v)}
        placeholder={t('baoTriSuaChua.store.taiSanCol')}
        icon={Package}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      { key: 'hang_muc', label: t('baoTriSuaChua.store.hangMucCol'), icon: Wrench, options: hangMucOptions, value: filters.hang_muc, onChange: (val: string[]) => setFilter('hang_muc', val) },
      { key: 'id_tai_san', label: t('baoTriSuaChua.store.taiSanCol'), icon: Package, options: taiSanOptions, value: filters.id_tai_san, onChange: (val: string[]) => setFilter('id_tai_san', val) },
    ],
    [hangMucOptions, taiSanOptions, filters.hang_muc, filters.id_tai_san, setFilter, t]
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      {showAdd && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('baoTriSuaChua.form.addPhieu')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => [
      { label: t('common.export'), icon: Download, onClick: onExport, description: '' },
      { label: t('baoTriSuaChua.form.addPhieu'), icon: Plus, onClick: onAdd },
    ],
    [t, onAdd, onExport]
  );

  const exportIconButtonClass =
    'inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50';

  const bulkExport = useMemo(
    () => (
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className={exportIconButtonClass}
          aria-label={t('common.export')}
        >
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    ),
    [onExport, t]
  );

  const searchTrailingExport = (
    <Tooltip content={t('common.export')} placement="bottom">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExport}
        className="sm:hidden shrink-0 inline-flex min-h-[44px] min-w-[44px] h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
        aria-label={t('common.export')}
      >
        <Download className="w-4 h-4" />
      </Button>
    </Tooltip>
  );

  const renderActionsWithExport = (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.export')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className={exportIconButtonClass}
            aria-label={t('common.export')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
      {renderActions}
    </div>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActionsWithExport}
      bulkActions={bulkExport}
      searchTrailing={searchTrailingExport}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={onAdd}
      searchPlaceholder={t('baoTriSuaChua.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete && selectedCount > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
      mobileActions={mobileActions}
    />
  );
};

export default BaoTriSuaChuaToolbar;
