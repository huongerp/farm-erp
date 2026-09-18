import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wallet, Tags, Link2, Building2, User } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import ImportExportButtons, { buildImportExportMobileActions } from './ImportExportButtons';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { DATE_RANGE_PRESETS, type DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import { useThuChiQuyStore } from '../store/useThuChiQuyStore';
import { LOAI_THU_CHI, NGUON_CHUNG_TU, loaiThuChiToI18nKey, nguonChungTuToI18nKey } from '../core/constants';
import type { HangMucThuChi } from '../../thiet-lap-quy/core/types';

interface BranchOption {
  id: string;
  ten_chi_nhanh: string;
}

interface NguoiTaoOption {
  id: string;
  ho_ten: string;
}

interface Props {
  branches: BranchOption[];
  /** Rỗng = tất cả farm trong phạm vi xem; chọn nhiều farm được */
  chiNhanhDangXem: string[];
  onChangeChiNhanh: (ids: string[]) => void;
  hangMucList: HangMucThuChi[];
  nguoiTaoList?: NguoiTaoOption[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onExport?: () => void;
  onImport?: () => void;
  exportLoading?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

const ThuChiQuyToolbar: React.FC<Props> = ({
  branches,
  chiNhanhDangXem,
  onChangeChiNhanh,
  hangMucList,
  nguoiTaoList = [],
  onAdd,
  onDeleteMany,
  onExport,
  onImport,
  exportLoading = false,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useThuChiQuyStore);
  const filters = useThuChiQuyStore((s) => s.filters);
  const setFilter = useThuChiQuyStore((s) => s.setFilter);
  const columns = useThuChiQuyStore((s) => s.columns);
  const toggleColumn = useThuChiQuyStore((s) => s.toggleColumn);
  const reorderColumns = useThuChiQuyStore((s) => s.reorderColumns);
  const resetColumns = useThuChiQuyStore((s) => s.resetColumns);
  const resetColumnWidths = useThuChiQuyStore((s) => s.resetColumnWidths);
  const selectedIds = useThuChiQuyStore((s) => s.selectedIds);
  const clearSelection = useThuChiQuyStore((s) => s.clearSelection);

  const datePreset = filters.datePreset || 'all';
  const customDateFrom = filters.customDateFrom || '';
  const customDateEnd = filters.customDateEnd || '';

  const dateRangeLabel = useMemo(() => {
    if (datePreset === 'all') return '';
    const range = getDateRangeFromPreset(
      datePreset as DateRangePresetId,
      customDateFrom ? new Date(customDateFrom) : undefined,
      customDateEnd ? new Date(customDateEnd) : undefined
    );
    return range.label;
  }, [datePreset, customDateFrom, customDateEnd]);

  const dateRangePresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);

  const loaiOptions = useMemo(
    () => LOAI_THU_CHI.map((l) => ({ label: t(loaiThuChiToI18nKey(l)), value: l })),
    [t]
  );

  const hangMucOptions = useMemo(
    () => hangMucList.map((hm) => ({ label: hm.ten, value: hm.id })),
    [hangMucList]
  );

  const nguonOptions = useMemo(
    () => NGUON_CHUNG_TU.map((n) => ({ label: t(nguonChungTuToI18nKey(n)), value: n })),
    [t]
  );

  const nguoiTaoOptions = useMemo(
    () => nguoiTaoList.map((nv) => ({ label: nv.ho_ten, value: String(nv.id) })),
    [nguoiTaoList]
  );

  const branchOptions = useMemo(
    () => branches.map((b) => ({ label: b.ten_chi_nhanh, value: String(b.id) })),
    [branches]
  );

  const activeFilterCount =
    chiNhanhDangXem.length +
    filters.loai.length +
    filters.hangMucIds.length +
    filters.nguonChungTu.length +
    filters.nguoiTaoIds.length +
    (datePreset !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    onChangeChiNhanh([]);
    setFilter('loai', []);
    setFilter('hangMucIds', []);
    setFilter('nguonChungTu', []);
    setFilter('nguoiTaoIds', []);
    setFilter('datePreset', 'all');
    setFilter('customDateFrom', '');
    setFilter('customDateEnd', '');
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'chiNhanh',
        label: t('thuChiQuy.store.chiNhanhCol'),
        icon: Building2,
        options: branchOptions,
        value: chiNhanhDangXem,
        onChange: onChangeChiNhanh,
      },
      {
        key: 'loai',
        label: t('thuChiQuy.store.loaiCol'),
        icon: Wallet,
        options: loaiOptions,
        value: filters.loai,
        onChange: (val: string[]) => setFilter('loai', val),
      },
      {
        key: 'hangMucIds',
        label: t('thuChiQuy.store.hangMucCol'),
        icon: Tags,
        options: hangMucOptions,
        value: filters.hangMucIds,
        onChange: (val: string[]) => setFilter('hangMucIds', val),
      },
      {
        key: 'nguonChungTu',
        label: t('thuChiQuy.store.nguonCol'),
        icon: Link2,
        options: nguonOptions,
        value: filters.nguonChungTu,
        onChange: (val: string[]) => setFilter('nguonChungTu', val),
      },
      {
        key: 'nguoiTaoIds',
        label: t('thuChiQuy.store.nguoiTaoCol'),
        icon: User,
        options: nguoiTaoOptions,
        value: filters.nguoiTaoIds,
        onChange: (val: string[]) => setFilter('nguoiTaoIds', val),
      },
    ],
    [
      t,
      branchOptions,
      chiNhanhDangXem,
      onChangeChiNhanh,
      loaiOptions,
      hangMucOptions,
      nguonOptions,
      nguoiTaoOptions,
      filters.loai,
      filters.hangMucIds,
      filters.nguonChungTu,
      filters.nguoiTaoIds,
      setFilter,
    ]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={branchOptions}
        value={chiNhanhDangXem}
        onChange={onChangeChiNhanh}
        placeholder={t('thuChiQuy.filters.allBranches')}
        icon={Building2}
        className="w-full sm:w-[190px]"
      />
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filters.loai}
        onChange={(v) => setFilter('loai', v)}
        placeholder={t('thuChiQuy.store.loaiCol')}
        icon={Wallet}
        className="w-full sm:w-[130px]"
      />
      <FilterChipMultiSelect
        options={hangMucOptions}
        value={filters.hangMucIds}
        onChange={(v) => setFilter('hangMucIds', v)}
        placeholder={t('thuChiQuy.store.hangMucCol')}
        icon={Tags}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguonOptions}
        value={filters.nguonChungTu}
        onChange={(v) => setFilter('nguonChungTu', v)}
        placeholder={t('thuChiQuy.store.nguonCol')}
        icon={Link2}
        className="w-full sm:w-[170px]"
      />
      <FilterChipMultiSelect
        options={nguoiTaoOptions}
        value={filters.nguoiTaoIds}
        onChange={(v) => setFilter('nguoiTaoIds', v)}
        placeholder={t('thuChiQuy.store.nguoiTaoCol')}
        icon={User}
        className="w-full sm:w-[170px]"
      />
      <DateRangePicker
        presets={dateRangePresets}
        value={{ preset: datePreset, customStart: customDateFrom, customEnd: customDateEnd }}
        onChange={(v) => {
          setFilter('datePreset', v.preset);
          setFilter('customDateFrom', v.customStart);
          setFilter('customDateEnd', v.customEnd);
        }}
        displayLabel={dateRangeLabel}
        placeholder={t('thuChiQuy.filters.dateRange')}
        className="w-full sm:w-auto"
      />
    </>
  );

  const renderActions = (
    <>
      <ImportExportButtons
        onImport={canCreate ? onImport : undefined}
        onExport={onExport}
        exportLoading={exportLoading}
      />
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

  const mobileActions = useMemo(
    () => buildImportExportMobileActions(t, canCreate ? onImport : undefined, onExport),
    [t, onImport, onExport, canCreate]
  );

  return (
    <GenericToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={clearAllFilters}
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

export default ThuChiQuyToolbar;
