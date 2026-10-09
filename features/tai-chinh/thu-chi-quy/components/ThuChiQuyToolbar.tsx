import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wallet, Tags, Link2, Building2, User, Lock, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import ImportExportButtons, { buildImportExportMobileActions } from './ImportExportButtons';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { DATE_RANGE_PRESETS, type DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import { useThuChiQuyStore } from '../store/useThuChiQuyStore';
import { LOAI_THU_CHI, NGUON_CHUNG_TU, loaiThuChiToI18nKey, nguonChungTuToI18nKey } from '../core/constants';
import { TRANG_THAI_THU_CHI_QUY_VALUES, trangThaiQuyToI18nKey } from '../core/trang-thai';
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
  /** Nút thao tác hàng loạt (khoá / mở khoá…) hiện khi có dòng được chọn. */
  bulkActions?: React.ReactNode;
}

/** Desktop: nhóm lọc ít dùng luôn nằm trong nút Filter (MobileFilterSheet vẫn đủ nhóm). */
const LUON_VAO_FILTER = ['nguonChungTu', 'nguoiTaoIds'];

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
  bulkActions,
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

  const dateRangeValue: DateRangeValue = { preset: datePreset, customStart: customDateFrom, customEnd: customDateEnd };
  const handleDateRangeChange = (v: DateRangeValue) => {
    setFilter('datePreset', v.preset);
    setFilter('customDateFrom', v.customStart);
    setFilter('customDateEnd', v.customEnd);
  };
  const dateRangeActive = datePreset !== 'all';

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

  const trangThaiOptions = useMemo(
    () => TRANG_THAI_THU_CHI_QUY_VALUES.map((v) => ({ label: t(trangThaiQuyToI18nKey(v)), value: v })),
    [t]
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
    filters.trangThai.length +
    (datePreset !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    onChangeChiNhanh([]);
    setFilter('loai', []);
    setFilter('hangMucIds', []);
    setFilter('nguonChungTu', []);
    setFilter('nguoiTaoIds', []);
    setFilter('trangThai', []);
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
      {
        key: 'trangThai',
        label: t('thuChiQuy.filters.trangThai'),
        icon: Lock,
        options: trangThaiOptions,
        value: filters.trangThai,
        onChange: (val: string[]) => setFilter('trangThai', val),
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
      trangThaiOptions,
      filters.trangThai,
      filters.loai,
      filters.hangMucIds,
      filters.nguonChungTu,
      filters.nguoiTaoIds,
      setFilter,
    ]
  );

  const [chiNhanhGroup, loaiGroup, hangMucGroup, nguonGroup, nguoiTaoGroup, trangThaiGroup] = filterGroups;
  const filterItems: FilterChipItem[] = [
    {
      kind: 'group',
      group: { ...chiNhanhGroup, label: t('thuChiQuy.filters.allBranches') },
      className: 'w-full sm:w-[190px]',
    },
    { kind: 'group', group: loaiGroup, className: 'w-full sm:w-[130px]' },
    { kind: 'group', group: hangMucGroup, className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: trangThaiGroup, className: 'w-full sm:w-[150px]' },
    {
      kind: 'custom',
      key: 'dateRange',
      node: (
        <DateRangePicker
          presets={dateRangePresets}
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          displayLabel={dateRangeLabel}
          placeholder={t('thuChiQuy.filters.dateRange')}
          className="w-full sm:w-auto"
        />
      ),
    },
    { kind: 'group', group: nguonGroup },
    { kind: 'group', group: nguoiTaoGroup },
  ];

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
      filters={<ResponsiveFilterChips items={filterItems} luonVaoFilter={LUON_VAO_FILTER} />}
      filterGroups={filterGroups}
      mobileFilterExtra={
        <MobileFilterField label={t('thuChiQuy.filters.dateRange')} icon={Calendar} active={dateRangeActive}>
          <DateRangePicker inline presets={dateRangePresets} value={dateRangeValue} onChange={handleDateRangeChange} />
        </MobileFilterField>
      }
      mobileFilterExtraCount={dateRangeActive ? 1 : 0}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={clearAllFilters}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      bulkActions={bulkActions}
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
