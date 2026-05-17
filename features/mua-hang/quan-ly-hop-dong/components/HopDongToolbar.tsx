import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Building2, Download, User } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useHopDongStore } from '../store/useHopDongStore';
import type { HopDong } from '../core/types';
import type { DoiTacRefLite } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import { TRANG_THAI_HOP_DONG } from '../core/constants';
import { getDateRangeFromPreset, getPresetFromDates } from '../core/datePresets';
import { matchesHopDongFilters } from '../core/list-filter-helpers';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

const CUSTOM_PRESET_ID = 'custom';

interface Props {
  data: HopDong[];
  doiTacList: DoiTacRefLite[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const HopDongToolbar: React.FC<Props> = ({
  data,
  doiTacList,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const searchTerm = useHopDongStore((s) => s.searchTerm);
  const commitSearchTerm = useHopDongStore((s) => s.commitSearchTerm);
  const filters = useHopDongStore((s) => s.filters);
  const setFilter = useHopDongStore((s) => s.setFilter);
  const clearSelection = useHopDongStore((s) => s.clearSelection);
  const columns = useHopDongStore((s) => s.columns);
  const toggleColumn = useHopDongStore((s) => s.toggleColumn);
  const reorderColumns = useHopDongStore((s) => s.reorderColumns);
  const resetColumns = useHopDongStore((s) => s.resetColumns);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const dateRangePresets = useMemo(
    () => [
      { id: 'all', label: t('hopDong.baoCao.preset.all') },
      { id: 'thisMonth', label: t('hopDong.baoCao.preset.thisMonth') },
      { id: 'lastMonth', label: t('hopDong.baoCao.preset.lastMonth') },
      { id: 'thisQuarter', label: t('hopDong.baoCao.preset.thisQuarter') },
      { id: 'thisYear', label: t('hopDong.baoCao.preset.thisYear') },
    ],
    [t]
  );

  const dateRangeValue: DateRangeValue = useMemo(
    () => ({
      preset: getPresetFromDates(filters.dateFrom, filters.dateTo),
      customStart: filters.dateFrom,
      customEnd: filters.dateTo,
    }),
    [filters.dateFrom, filters.dateTo]
  );

  const handleDateRangeChange = (value: DateRangeValue) => {
    if (value.preset === CUSTOM_PRESET_ID) {
      setFilter('dateFrom', value.customStart);
      setFilter('dateTo', value.customEnd);
    } else {
      const { dateFrom, dateTo } = getDateRangeFromPreset(value.preset);
      setFilter('dateFrom', dateFrom);
      setFilter('dateTo', dateTo);
    }
  };

  const nguoiTaoOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    data.forEach((x) => {
      if (!x.id_nguoi_tao || !matchesHopDongFilters(x, filters, 'nguoiTaoIds')) return;
      const cur = map.get(x.id_nguoi_tao) ?? {
        label: x.ten_nguoi_tao?.trim() || x.id_nguoi_tao,
        count: 0,
      };
      cur.count += 1;
      map.set(x.id_nguoi_tao, cur);
    });
    return Array.from(map.entries())
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data, filters]);

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_HOP_DONG.map((s) => ({
        value: s,
        label: s === 'Đang thực hiện' ? t('hopDong.trangThai.dangThucHien') : t('hopDong.trangThai.daThanhLy'),
        count: data.filter((x) => x.trang_thai === s && matchesHopDongFilters(x, filters, 'trangThai')).length,
      })),
    [data, filters, t]
  );

  const nccOptions = useMemo(
    () =>
      doiTacList
        .map((d) => ({
          value: d.id,
          label: `${d.ma_ncc} - ${d.ten_ncc}`,
          count: data.filter((x) => x.id_nha_cung_cap === d.id && matchesHopDongFilters(x, filters, 'nccIds'))
            .length,
        }))
        .filter((o) => o.count > 0 || (filters.nccIds ?? []).includes(o.value)),
    [doiTacList, data, filters]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (filters.trangThai?.length ?? 0) +
      (filters.nccIds?.length ?? 0) +
      (filters.nguoiTaoIds?.length ?? 0) +
      (filters.dateFrom || filters.dateTo ? 1 : 0),
    [searchInput, filters.trangThai, filters.nccIds, filters.nguoiTaoIds, filters.dateFrom, filters.dateTo]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('trangThai', []);
    setFilter('nccIds', []);
    setFilter('dateFrom', '');
    setFilter('dateTo', '');
    setFilter('nguoiTaoIds', []);
  };

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'trangThai',
        label: t('hopDong.toolbar.filterStatus'),
        icon: Tag,
        options: statusOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.trangThai ?? [],
        onChange: (val: string[]) => setFilter('trangThai', val),
      },
      {
        key: 'nccIds',
        label: t('hopDong.toolbar.filterNcc'),
        icon: Building2,
        options: nccOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.nccIds ?? [],
        onChange: (val: string[]) => setFilter('nccIds', val),
      },
      {
        key: 'nguoiTaoIds',
        label: t('hopDong.toolbar.filterNguoiTao'),
        icon: User,
        options: nguoiTaoOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.nguoiTaoIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiTaoIds', val),
      },
    ],
    [t, statusOptions, nccOptions, nguoiTaoOptions, filters, setFilter]
  );

  const renderFilters = (
    <>
      <DateRangePicker
        presets={dateRangePresets}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        placeholder={t('hopDong.toolbar.filterPeriod')}
        customPresetId={CUSTOM_PRESET_ID}
        className="w-full sm:w-auto shrink-0"
      />
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.trangThai ?? []}
        onChange={(v) => setFilter('trangThai', v)}
        placeholder={t('hopDong.toolbar.filterStatus')}
        icon={Tag}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nccOptions}
        value={filters.nccIds ?? []}
        onChange={(v) => setFilter('nccIds', v)}
        placeholder={t('hopDong.toolbar.filterNcc')}
        icon={Building2}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={nguoiTaoOptions}
        value={filters.nguoiTaoIds ?? []}
        onChange={(v) => setFilter('nguoiTaoIds', v)}
        placeholder={t('hopDong.toolbar.filterNguoiTao')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => [
      { label: t('common.export'), icon: Download, onClick: onExport, description: '' },
      ...(canCreate
        ? [{ label: t('hopDong.toolbar.add'), icon: Plus, onClick: onAdd, description: '' }]
        : []),
    ],
    [t, onExport, onAdd, canCreate]
  );

  const bulkExport = useMemo(
    () => (
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
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

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.export')} placement="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
            aria-label={t('common.export')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
      {canCreate ? (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('hopDong.toolbar.add')}</span>
        </Button>
      ) : null}
    </>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      bulkActions={bulkExport}
      mobileActions={mobileActions}
      searchTrailing={searchTrailingExport}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('hopDong.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default HopDongToolbar;
