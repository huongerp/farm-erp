import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, MapPin, FileText, Download, User } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useThanhToanStore } from '../store/useThanhToanStore';
import type { HopDongChiTietEnriched } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { getDateRangeFromPreset, getPresetFromDates } from '../core/datePresets';
import { matchesThanhToanFilters } from '../core/list-filter-helpers';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

const CUSTOM_PRESET_ID = 'custom';

interface Props {
  data: HopDongChiTietEnriched[];
  chiNhanhList: Branch[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const ThanhToanToolbar: React.FC<Props> = ({
  data,
  chiNhanhList,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const searchTerm = useThanhToanStore((s) => s.searchTerm);
  const commitSearchTerm = useThanhToanStore((s) => s.commitSearchTerm);
  const filters = useThanhToanStore((s) => s.filters);
  const setFilter = useThanhToanStore((s) => s.setFilter);
  const clearSelection = useThanhToanStore((s) => s.clearSelection);
  const columns = useThanhToanStore((s) => s.columns);
  const toggleColumn = useThanhToanStore((s) => s.toggleColumn);
  const reorderColumns = useThanhToanStore((s) => s.reorderColumns);
  const resetColumns = useThanhToanStore((s) => s.resetColumns);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const cnMap = useMemo(() => {
    const m: Record<string, string> = {};
    chiNhanhList.forEach((b) => {
      m[b.id] = b.ten_chi_nhanh;
    });
    return m;
  }, [chiNhanhList]);

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
      if (!x.id_nguoi_tao || !matchesThanhToanFilters(x, filters, 'nguoiTaoIds')) return;
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

  const chiNhanhOptions = useMemo(() => {
    const ids = new Set<string>();
    data.forEach((x) => {
      if (x.id_chi_nhanh && matchesThanhToanFilters(x, filters, 'chiNhanhIds')) ids.add(x.id_chi_nhanh);
    });
    return Array.from(ids).map((id) => ({
      value: id,
      label: cnMap[id] ?? id,
      count: data.filter((x) => x.id_chi_nhanh === id && matchesThanhToanFilters(x, filters, 'chiNhanhIds')).length,
    }));
  }, [data, cnMap, filters]);

  const nccOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    data.forEach((x) => {
      const id = x.id_nha_cung_cap;
      if (!id || !matchesThanhToanFilters(x, filters, 'nccIds')) return;
      const cur = map.get(id) ?? { label: x.ten_nha_cung_cap ?? id, count: 0 };
      cur.count += 1;
      map.set(id, cur);
    });
    return Array.from(map.entries()).map(([value, { label, count }]) => ({ value, label, count }));
  }, [data, filters]);

  const hopDongOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    data.forEach((x) => {
      if (!matchesThanhToanFilters(x, filters, 'hopDongIds')) return;
      const id = x.id_hop_dong;
      const cur = map.get(id) ?? { label: x.ma_hop_dong ?? id, count: 0 };
      cur.count += 1;
      map.set(id, cur);
    });
    return Array.from(map.entries()).map(([value, { label, count }]) => ({ value, label, count }));
  }, [data, filters]);

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (filters.chiNhanhIds?.length ?? 0) +
      (filters.nccIds?.length ?? 0) +
      (filters.hopDongIds?.length ?? 0) +
      (filters.nguoiTaoIds?.length ?? 0) +
      (filters.dateFrom || filters.dateTo ? 1 : 0),
    [
      searchInput,
      filters.chiNhanhIds,
      filters.nccIds,
      filters.hopDongIds,
      filters.nguoiTaoIds,
      filters.dateFrom,
      filters.dateTo,
    ]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('chiNhanhIds', []);
    setFilter('nccIds', []);
    setFilter('hopDongIds', []);
    setFilter('dateFrom', '');
    setFilter('dateTo', '');
    setFilter('nguoiTaoIds', []);
  };

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'chiNhanhIds',
        label: t('hopDong.thanhToan.toolbar.filterChiNhanh'),
        icon: MapPin,
        options: chiNhanhOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.chiNhanhIds ?? [],
        onChange: (val: string[]) => setFilter('chiNhanhIds', val),
      },
      {
        key: 'nccIds',
        label: t('hopDong.thanhToan.toolbar.filterNcc'),
        icon: Building2,
        options: nccOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.nccIds ?? [],
        onChange: (val: string[]) => setFilter('nccIds', val),
      },
      {
        key: 'hopDongIds',
        label: t('hopDong.thanhToan.toolbar.filterHopDong'),
        icon: FileText,
        options: hopDongOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.hopDongIds ?? [],
        onChange: (val: string[]) => setFilter('hopDongIds', val),
      },
      {
        key: 'nguoiTaoIds',
        label: t('hopDong.thanhToan.toolbar.filterNguoiTao'),
        icon: User,
        options: nguoiTaoOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.nguoiTaoIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiTaoIds', val),
      },
    ],
    [t, chiNhanhOptions, nccOptions, hopDongOptions, nguoiTaoOptions, filters, setFilter]
  );

  const renderFilters = (
    <>
      <DateRangePicker
        presets={dateRangePresets}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        placeholder={t('hopDong.thanhToan.toolbar.filterPeriod')}
        customPresetId={CUSTOM_PRESET_ID}
        className="w-full sm:w-auto shrink-0"
      />
      <FilterChipMultiSelect
        options={chiNhanhOptions}
        value={filters.chiNhanhIds ?? []}
        onChange={(v) => setFilter('chiNhanhIds', v)}
        placeholder={t('hopDong.thanhToan.toolbar.filterChiNhanh')}
        icon={MapPin}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={nccOptions}
        value={filters.nccIds ?? []}
        onChange={(v) => setFilter('nccIds', v)}
        placeholder={t('hopDong.thanhToan.toolbar.filterNcc')}
        icon={Building2}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={hopDongOptions}
        value={filters.hopDongIds ?? []}
        onChange={(v) => setFilter('hopDongIds', v)}
        placeholder={t('hopDong.thanhToan.toolbar.filterHopDong')}
        icon={FileText}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={nguoiTaoOptions}
        value={filters.nguoiTaoIds ?? []}
        onChange={(v) => setFilter('nguoiTaoIds', v)}
        placeholder={t('hopDong.thanhToan.toolbar.filterNguoiTao')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => [
      { label: t('common.export'), icon: Download, onClick: onExport, description: '' },
      ...(canCreate
        ? [{ label: t('hopDong.thanhToan.toolbar.add'), icon: Plus, onClick: onAdd, description: '' }]
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
          <span className="hidden sm:inline">{t('hopDong.thanhToan.toolbar.add')}</span>
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
      searchPlaceholder={t('hopDong.thanhToan.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ThanhToanToolbar;
