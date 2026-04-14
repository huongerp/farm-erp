import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Warehouse, ArrowRightLeft, Tag, User, CheckCircle, Truck, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { useChiTietPhieuKhoStore, type DatePresetId } from '../store/useChiTietPhieuKhoStore';
import type { ChiTietPhieuKhoFlat } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import { DATE_RANGE_PRESETS } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';

interface Props {
  data: ChiTietPhieuKhoFlat[];
  khoList: Kho[];
  onExport: () => void;
  chipCountsMode?: 'fromRows' | 'unweighted';
  employeesForChips?: { id: string; ho_ten: string }[];
  doiTacForChips?: { id: string; ten_ncc: string }[];
}

const PhieuStatus = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
} as const;

const ChiTietPhieuKhoToolbar: React.FC<Props> = ({
  data,
  khoList,
  onExport,
  chipCountsMode = 'fromRows',
  employeesForChips = [],
  doiTacForChips = [],
}) => {
  const unweighted = chipCountsMode === 'unweighted';
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useChiTietPhieuKhoStore();

  const loaiOptions = useMemo(
    () => [
      { value: 'nhập', label: t('phieuKho.tabs.nhap'), count: unweighted ? 1 : data.filter((d) => d.loai === 'nhập').length },
      { value: 'xuất', label: t('phieuKho.tabs.xuat'), count: unweighted ? 1 : data.filter((d) => d.loai === 'xuất').length },
      { value: 'chuyển', label: t('phieuKho.tabs.chuyen'), count: unweighted ? 1 : data.filter((d) => d.loai === 'chuyển').length },
    ],
    [data, t, unweighted]
  );

  const trangThaiOptions = useMemo(
    () => [
      {
        label: t('phieuKho.status.pending'),
        value: PhieuStatus.pending,
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === 'Chờ duyệt').length,
      },
      {
        label: t('phieuKho.status.approved'),
        value: PhieuStatus.approved,
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === 'Đã duyệt').length,
      },
      {
        label: t('phieuKho.status.rejected'),
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

  const doiTacOptions = useMemo(() => {
    if (unweighted && doiTacForChips.length) {
      return [...doiTacForChips]
        .map((d) => ({ value: d.id, label: d.ten_ncc.trim() || d.id, count: 1 }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    }
    const map = new Map<string, { label: string; count: number }>();
    for (const d of data) {
      if (d.loai === 'nhập' && d.id_nha_cung_cap) {
        const k = d.id_nha_cung_cap;
        const label = d.ten_nha_cung_cap?.trim() || k;
        const prev = map.get(k);
        if (prev) prev.count += 1;
        else map.set(k, { label, count: 1 });
      }
      if (d.loai === 'xuất' && d.id_khach_hang) {
        const k = d.id_khach_hang;
        const label = d.ten_khach_hang?.trim() || k;
        const prev = map.get(k);
        if (prev) prev.count += 1;
        else map.set(k, { label, count: 1 });
      }
    }
    return [...map.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data, unweighted, doiTacForChips]);

  const dateRangeLabel = useMemo(() => {
    const range = getDateRangeFromPreset(
      (filters.datePreset ?? 'this_month') as DateRangePresetId,
      filters.customDateFrom ? new Date(filters.customDateFrom) : undefined,
      filters.customDateEnd ? new Date(filters.customDateEnd) : undefined
    );
    return range.label;
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const dateFilterActive = useMemo(
    () =>
      (filters.datePreset && filters.datePreset !== 'this_month') ||
      !!(filters.customDateFrom ?? '').trim() ||
      !!(filters.customDateEnd ?? '').trim(),
    [filters.datePreset, filters.customDateFrom, filters.customDateEnd]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.loai?.length ?? 0 ? 1 : 0) +
      (dateFilterActive ? 1 : 0) +
      (filters.khoIds?.length ?? 0 ? 1 : 0) +
      (filters.khoDenIds?.length ?? 0 ? 1 : 0) +
      (filters.trangThaiKeys?.length ?? 0 ? 1 : 0) +
      (filters.nguoiTaoIds?.length ?? 0 ? 1 : 0) +
      (filters.nguoiDuyetIds?.length ?? 0 ? 1 : 0) +
      (filters.doiTacIds?.length ?? 0 ? 1 : 0),
    [
      searchTerm,
      filters.loai?.length,
      dateFilterActive,
      filters.khoIds?.length,
      filters.khoDenIds?.length,
      filters.trangThaiKeys?.length,
      filters.nguoiTaoIds?.length,
      filters.nguoiDuyetIds?.length,
      filters.doiTacIds?.length,
    ]
  );

  const filterGroupsComputed = useMemo(
    () => [
      {
        key: 'loai',
        label: t('phieuKho.chiTietTab.loaiPhieuCol'),
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
        label: t('phieuKho.store.khoCol'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.khoIds ?? [],
        onChange: (val: string[]) => setFilter('khoIds', val),
      },
      {
        key: 'khoDenIds',
        label: t('phieuKho.form.warehouseTo'),
        icon: ArrowRightLeft,
        options: khoDenOptions,
        value: filters.khoDenIds ?? [],
        onChange: (val: string[]) => setFilter('khoDenIds', val),
      },
      {
        key: 'nguoiTao',
        label: t('phieuKho.filters.creator'),
        icon: User,
        options: nguoiTaoOptions,
        value: filters.nguoiTaoIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiTaoIds', val),
      },
      {
        key: 'nguoiDuyet',
        label: t('phieuKho.filters.approver'),
        icon: CheckCircle,
        options: nguoiDuyetOptions,
        value: filters.nguoiDuyetIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDuyetIds', val),
      },
      {
        key: 'doiTac',
        label: t('phieuKho.filters.partner'),
        icon: Truck,
        options: doiTacOptions,
        value: filters.doiTacIds ?? [],
        onChange: (val: string[]) => setFilter('doiTacIds', val),
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
      doiTacOptions,
      filters.loai,
      filters.trangThaiKeys,
      filters.khoIds,
      filters.khoDenIds,
      filters.nguoiTaoIds,
      filters.nguoiDuyetIds,
      filters.doiTacIds,
      setFilter,
    ]
  );

  const dateRangePickerPresets = useMemo(
    () => DATE_RANGE_PRESETS.filter((p) => p.id !== 'all').map((p) => ({ id: p.id, label: p.label })),
    []
  );

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

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filters.loai ?? []}
        onChange={(v) => setFilter('loai', v)}
        placeholder={t('phieuKho.chiTietTab.loaiPhieuCol')}
        icon={FileText}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.trangThaiKeys ?? []}
        onChange={(v) => setFilter('trangThaiKeys', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[130px]"
      />
      <DateRangePicker
        presets={dateRangePickerPresets}
        value={{
          preset: filters.datePreset ?? 'this_month',
          customStart: filters.customDateFrom ?? '',
          customEnd: filters.customDateEnd ?? '',
        }}
        onChange={(v) => {
          setFilter('datePreset', v.preset as DatePresetId);
          setFilter('customDateFrom', v.customStart);
          setFilter('customDateEnd', v.customEnd);
        }}
        displayLabel={dateRangeLabel}
        placeholder={t('phieuKho.chiTietTab.dateRangePlaceholder')}
        className="w-full sm:w-auto"
      />
      <FilterChipMultiSelect
        options={khoOptions}
        value={filters.khoIds ?? []}
        onChange={(v) => setFilter('khoIds', v)}
        placeholder={t('phieuKho.store.khoCol')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={khoDenOptions}
        value={filters.khoDenIds ?? []}
        onChange={(v) => setFilter('khoDenIds', v)}
        placeholder={t('phieuKho.form.warehouseTo')}
        icon={ArrowRightLeft}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiTaoOptions}
        value={filters.nguoiTaoIds ?? []}
        onChange={(v) => setFilter('nguoiTaoIds', v)}
        placeholder={t('phieuKho.filters.creator')}
        icon={User}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={nguoiDuyetOptions}
        value={filters.nguoiDuyetIds ?? []}
        onChange={(v) => setFilter('nguoiDuyetIds', v)}
        placeholder={t('phieuKho.filters.approver')}
        icon={CheckCircle}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={doiTacOptions}
        value={filters.doiTacIds ?? []}
        onChange={(v) => setFilter('doiTacIds', v)}
        placeholder={t('phieuKho.filters.partner')}
        icon={Truck}
        className="w-full sm:w-[170px]"
      />
    </>
  );

  return (
    <GenericToolbar
      selectedCount={0}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={() => {}}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroupsComputed}
      mobileActions={mobileActions}
      showBack
      searchPlaceholder={t('phieuKho.chiTietTab.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={() => {
        setSearchTerm('');
        setFilter('loai', []);
        setFilter('trangThaiKeys', []);
        setFilter('datePreset', 'this_month');
        setFilter('customDateFrom', '');
        setFilter('customDateEnd', '');
        setFilter('khoIds', []);
        setFilter('khoDenIds', []);
        setFilter('nguoiTaoIds', []);
        setFilter('nguoiDuyetIds', []);
        setFilter('doiTacIds', []);
      }}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ChiTietPhieuKhoToolbar;
