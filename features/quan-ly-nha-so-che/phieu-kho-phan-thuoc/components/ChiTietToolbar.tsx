import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Warehouse, ArrowRightLeft, Tag, User, CheckCircle, Download, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useChiTietPhieuKhoPTStore, type DatePresetIdChiTietPT } from '../store/useChiTietPhieuKhoPTStore';
import type { ChiTietPhieuKhoPTFlat } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import { DATE_RANGE_PRESETS } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';

interface Props {
  data: ChiTietPhieuKhoPTFlat[];
  khoList: Kho[];
  onExport: () => void;
  chipCountsMode?: 'fromRows' | 'unweighted';
  employeesForChips?: { id: string; ho_ten: string }[];
}

/** Desktop: nhóm lọc ít dùng luôn nằm trong nút Filter (MobileFilterSheet vẫn đủ nhóm). */
const LUON_VAO_FILTER = ['nguoiTao', 'nguoiDuyet'];

const PhieuStatus = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
} as const;

const ChiTietToolbar: React.FC<Props> = ({
  data,
  khoList,
  onExport,
  chipCountsMode = 'fromRows',
  employeesForChips = [],
}) => {
  const unweighted = chipCountsMode === 'unweighted';
  const { t } = useTranslation();
  const searchTerm = useChiTietPhieuKhoPTStore((s) => s.searchTerm);
  const commitSearchTerm = useChiTietPhieuKhoPTStore((s) => s.commitSearchTerm);
  const filters = useChiTietPhieuKhoPTStore((s) => s.filters);
  const setFilter = useChiTietPhieuKhoPTStore((s) => s.setFilter);
  const columns = useChiTietPhieuKhoPTStore((s) => s.columns);
  const toggleColumn = useChiTietPhieuKhoPTStore((s) => s.toggleColumn);
  const reorderColumns = useChiTietPhieuKhoPTStore((s) => s.reorderColumns);
  const resetColumns = useChiTietPhieuKhoPTStore((s) => s.resetColumns);
  const resetColumnWidths = useChiTietPhieuKhoPTStore((s) => s.resetColumnWidths);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const loaiOptions = useMemo(
    () => [
      { value: 'nhập', label: t('phieuKhoPhanThuoc.tabs.nhap'), count: unweighted ? 1 : data.filter((d) => d.loai === 'nhập').length },
      { value: 'xuất', label: t('phieuKhoPhanThuoc.tabs.xuat'), count: unweighted ? 1 : data.filter((d) => d.loai === 'xuất').length },
      { value: 'chuyển', label: t('phieuKhoPhanThuoc.tabs.chuyen'), count: unweighted ? 1 : data.filter((d) => d.loai === 'chuyển').length },
    ],
    [data, t, unweighted]
  );

  const trangThaiOptions = useMemo(
    () => [
      {
        label: t('phieuKhoPhanThuoc.status.pending'),
        value: PhieuStatus.pending,
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === 'Chờ duyệt').length,
      },
      {
        label: t('phieuKhoPhanThuoc.status.approved'),
        value: PhieuStatus.approved,
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === 'Đã duyệt').length,
      },
      {
        label: t('phieuKhoPhanThuoc.status.rejected'),
        value: PhieuStatus.rejected,
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === 'Không duyệt').length,
      },
    ],
    [data, t, unweighted]
  );

  const khoOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: unweighted ? 1 : data.filter((d) => d.kho_id === k.id).length,
      })),
    [khoList, data, unweighted]
  );

  const khoDenOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: unweighted ? 1 : data.filter((d) => d.kho_den_id === k.id).length,
      })),
    [khoList, data, unweighted]
  );

  const nguoiTaoOptions = useMemo(() => {
    if (unweighted && employeesForChips.length) {
      return [...employeesForChips]
        .map((e) => ({ value: e.id, label: e.ho_ten.trim() || `#${e.id}`, count: 1 }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    }
    const map = new Map<string, { label: string; count: number }>();
    for (const d of data) {
      if (d.nguoi_tao_id == null) continue;
      const k = String(d.nguoi_tao_id);
      const label = d.ten_nguoi_tao?.trim() || `#${k}`;
      const prev = map.get(k);
      if (prev) prev.count += 1;
      else map.set(k, { label, count: 1 });
    }
    return [...map.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data, unweighted, employeesForChips]);

  const nguoiDuyetOptions = useMemo(() => {
    if (unweighted && employeesForChips.length) {
      return [...employeesForChips]
        .map((e) => ({ value: e.id, label: e.ho_ten.trim() || `#${e.id}`, count: 1 }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    }
    const map = new Map<string, { label: string; count: number }>();
    for (const d of data) {
      if (d.id_nguoi_duyet == null) continue;
      const k = String(d.id_nguoi_duyet);
      const label = d.ten_nguoi_duyet?.trim() || `#${k}`;
      const prev = map.get(k);
      if (prev) prev.count += 1;
      else map.set(k, { label, count: 1 });
    }
    return [...map.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data, unweighted, employeesForChips]);

  const dateRangeLabel = useMemo(() => {
    const range = getDateRangeFromPreset(
      (filters.datePreset ?? 'all') as DateRangePresetId,
      filters.customDateFrom ? new Date(filters.customDateFrom) : undefined,
      filters.customDateEnd ? new Date(filters.customDateEnd) : undefined
    );
    return range.label;
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const dateFilterActive = useMemo(
    () =>
      (filters.datePreset && filters.datePreset !== 'all') ||
      !!(filters.customDateFrom ?? '').trim() ||
      !!(filters.customDateEnd ?? '').trim(),
    [filters.datePreset, filters.customDateFrom, filters.customDateEnd]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (filters.loai?.length ?? 0 ? 1 : 0) +
      (dateFilterActive ? 1 : 0) +
      (filters.khoIds?.length ?? 0 ? 1 : 0) +
      (filters.khoDenIds?.length ?? 0 ? 1 : 0) +
      (filters.trangThaiKeys?.length ?? 0 ? 1 : 0) +
      (filters.nguoiTaoIds?.length ?? 0 ? 1 : 0) +
      (filters.nguoiDuyetIds?.length ?? 0 ? 1 : 0),
    [
      searchInput,
      filters.loai?.length,
      dateFilterActive,
      filters.khoIds?.length,
      filters.khoDenIds?.length,
      filters.trangThaiKeys?.length,
      filters.nguoiTaoIds?.length,
      filters.nguoiDuyetIds?.length,
    ]
  );

  const filterGroupsComputed = useMemo(
    () => [
      {
        key: 'loai',
        label: t('phieuKhoPhanThuoc.chiTietTab.loaiPhieuCol'),
        icon: FileText,
        options: loaiOptions,
        value: filters.loai ?? [],
        onChange: (val: string[]) => setFilter('loai', val),
      },
      {
        key: 'trangThai',
        label: t('common.status'),
        icon: Tag,
        options: trangThaiOptions,
        value: filters.trangThaiKeys ?? [],
        onChange: (val: string[]) => setFilter('trangThaiKeys', val),
      },
      {
        key: 'khoIds',
        label: t('phieuKhoPhanThuoc.store.khoCol'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.khoIds ?? [],
        onChange: (val: string[]) => setFilter('khoIds', val),
      },
      {
        key: 'khoDenIds',
        label: t('phieuKhoPhanThuoc.form.warehouseTo'),
        icon: ArrowRightLeft,
        options: khoDenOptions,
        value: filters.khoDenIds ?? [],
        onChange: (val: string[]) => setFilter('khoDenIds', val),
      },
      {
        key: 'nguoiTao',
        label: t('phieuKhoPhanThuoc.filters.creator'),
        icon: User,
        options: nguoiTaoOptions,
        value: filters.nguoiTaoIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiTaoIds', val),
      },
      {
        key: 'nguoiDuyet',
        label: t('phieuKhoPhanThuoc.filters.approver'),
        icon: CheckCircle,
        options: nguoiDuyetOptions,
        value: filters.nguoiDuyetIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDuyetIds', val),
      },
    ],
    [
      t,
      loaiOptions,
      trangThaiOptions,
      khoOptions,
      khoDenOptions,
      nguoiTaoOptions,
      nguoiDuyetOptions,
      filters.loai,
      filters.trangThaiKeys,
      filters.khoIds,
      filters.khoDenIds,
      filters.nguoiTaoIds,
      filters.nguoiDuyetIds,
      setFilter,
    ]
  );

  const dateRangePickerPresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);

  const mobileActions = useMemo(
    () => [
      {
        key: 'export',
        label: t('common.export'),
        icon: Download,
        onClick: onExport,
        description: '',
      },
    ],
    [onExport, t]
  );

  const renderActions = (
    <div className="hidden sm:flex items-center gap-2">
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
        >
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );

  const dateRangeValue: DateRangeValue = {
    preset: (filters.datePreset ?? 'all') as DateRangePresetId,
    customStart: filters.customDateFrom ?? '',
    customEnd: filters.customDateEnd ?? '',
  };
  const handleDateRangeChange = (v: DateRangeValue) => {
    setFilter('datePreset', v.preset as DatePresetIdChiTietPT);
    setFilter('customDateFrom', v.customStart);
    setFilter('customDateEnd', v.customEnd);
  };

  const [loaiGroup, trangThaiGroup, khoGroup, khoDenGroup, nguoiTaoGroup, nguoiDuyetGroup] = filterGroupsComputed;
  const filterItems: FilterChipItem[] = [
    { kind: 'group', group: loaiGroup, className: 'w-full sm:w-[140px]' },
    { kind: 'group', group: trangThaiGroup, className: 'w-full sm:w-[130px]' },
    {
      kind: 'custom',
      key: 'dateRange',
      node: (
        <DateRangePicker
          presets={dateRangePickerPresets}
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          displayLabel={dateRangeLabel}
          placeholder={t('phieuKhoPhanThuoc.chiTietTab.dateRangePlaceholder')}
          className="w-full sm:w-auto"
        />
      ),
    },
    { kind: 'group', group: khoGroup, className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: khoDenGroup, className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: nguoiTaoGroup },
    { kind: 'group', group: nguoiDuyetGroup },
  ];

  return (
    <GenericToolbar
      selectedCount={0}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={() => {}}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} luonVaoFilter={LUON_VAO_FILTER} />}
      filterGroups={filterGroupsComputed}
      mobileFilterExtra={
        <MobileFilterField
          label={t('phieuKhoPhanThuoc.chiTietTab.dateRangePlaceholder')}
          icon={Calendar}
          active={!!dateFilterActive}
        >
          <DateRangePicker inline presets={dateRangePickerPresets} value={dateRangeValue} onChange={handleDateRangeChange} />
        </MobileFilterField>
      }
      mobileFilterExtraCount={dateFilterActive ? 1 : 0}
      mobileActions={mobileActions}
      showBack
      activeFilterCount={activeFilterCount}
      onClearAllFilters={() => {
        commitSearchTerm('');
        setFilter('loai', []);
        setFilter('trangThaiKeys', []);
        setFilter('datePreset', 'all');
        setFilter('customDateFrom', '');
        setFilter('customDateEnd', '');
        setFilter('khoIds', []);
        setFilter('khoDenIds', []);
        setFilter('nguoiTaoIds', []);
        setFilter('nguoiDuyetIds', []);
      }}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
    />
  );
};

export default ChiTietToolbar;
