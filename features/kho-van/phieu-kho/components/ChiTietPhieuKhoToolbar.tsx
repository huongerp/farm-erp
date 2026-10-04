import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Warehouse, ArrowRightLeft, Tag, User, CheckCircle, Truck, Download, Barcode, Package, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { MobileFilterField, type FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useChiTietPhieuKhoStore, type DatePresetId } from '../store/useChiTietPhieuKhoStore';
import type { ChiTietPhieuKhoFlat } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_DOI_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';
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
  hangHoaForChips?: { id: string; ma_hang: string; ten_hang: string }[];
}

const PhieuStatus = {
  pending: 'Pending',
  waiting: 'Waiting',
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
  hangHoaForChips = [],
}) => {
  const unweighted = chipCountsMode === 'unweighted';
  const { t } = useTranslation();
  const searchTerm = useChiTietPhieuKhoStore((s) => s.searchTerm);
  const commitSearchTerm = useChiTietPhieuKhoStore((s) => s.commitSearchTerm);
  const filters = useChiTietPhieuKhoStore((s) => s.filters);
  const setFilter = useChiTietPhieuKhoStore((s) => s.setFilter);
  const columns = useChiTietPhieuKhoStore((s) => s.columns);
  const toggleColumn = useChiTietPhieuKhoStore((s) => s.toggleColumn);
  const reorderColumns = useChiTietPhieuKhoStore((s) => s.reorderColumns);
  const resetColumns = useChiTietPhieuKhoStore((s) => s.resetColumns);
  const resetColumnWidths = useChiTietPhieuKhoStore((s) => s.resetColumnWidths);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

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
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === TRANG_THAI_CHO_DUYET).length,
      },
      {
        label: t('phieuKho.status.waiting'),
        value: PhieuStatus.waiting,
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === TRANG_THAI_DOI_DUYET).length,
      },
      {
        label: t('phieuKho.status.approved'),
        value: PhieuStatus.approved,
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === TRANG_THAI_DA_DUYET).length,
      },
      {
        label: t('phieuKho.status.rejected'),
        value: PhieuStatus.rejected,
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === TRANG_THAI_KHONG_DUYET).length,
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

  /** Chip Mã hàng / Tên hàng: value = id_hang_hoa. Không dùng chế độ đếm theo dòng của trang hiện tại. */
  const { maHangOptions, tenHangOptions } = useMemo(() => {
    const source =
      unweighted && hangHoaForChips.length
        ? hangHoaForChips.map((h) => ({ id: h.id, ma: h.ma_hang?.trim() ?? '', ten: h.ten_hang?.trim() ?? '' }))
        : [
            ...new Map(
              data.map((d) => [d.id_hang_hoa, { id: d.id_hang_hoa, ma: d.ma_hang?.trim() ?? '', ten: d.ten_hang?.trim() ?? '' }])
            ).values(),
          ];
    const countById = new Map<string, number>();
    if (!unweighted) for (const d of data) countById.set(d.id_hang_hoa, (countById.get(d.id_hang_hoa) ?? 0) + 1);
    const count = (id: string) => (unweighted ? 1 : countById.get(id) ?? 0);
    const tenTrung = new Map<string, number>();
    for (const h of source) tenTrung.set(h.ten, (tenTrung.get(h.ten) ?? 0) + 1);
    const ma = source
      .map((h) => ({ value: h.id, label: h.ma || h.ten || `#${h.id}`, count: count(h.id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi', { numeric: true }));
    const ten = source
      .map((h) => ({
        value: h.id,
        // Trùng tên thì kèm mã để phân biệt.
        label: (tenTrung.get(h.ten) ?? 0) > 1 && h.ma ? `${h.ten || h.ma} (${h.ma})` : h.ten || h.ma || `#${h.id}`,
        count: count(h.id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    return { maHangOptions: ma, tenHangOptions: ten };
  }, [data, unweighted, hangHoaForChips]);

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
      (filters.nguoiDuyetIds?.length ?? 0 ? 1 : 0) +
      (filters.doiTacIds?.length ?? 0 ? 1 : 0) +
      (filters.maHangIds?.length ?? 0 ? 1 : 0) +
      (filters.tenHangIds?.length ?? 0 ? 1 : 0),
    [
      searchInput,
      filters.loai?.length,
      dateFilterActive,
      filters.khoIds?.length,
      filters.khoDenIds?.length,
      filters.trangThaiKeys?.length,
      filters.nguoiTaoIds?.length,
      filters.nguoiDuyetIds?.length,
      filters.doiTacIds?.length,
      filters.maHangIds?.length,
      filters.tenHangIds?.length,
    ]
  );

  /** Thứ tự = thứ tự hiện trên desktop; ResponsiveFilterChips tự gom phần dư vào nút Filter. */
  const filterGroupsComputed = useMemo<FilterGroup[]>(
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
        key: 'khoIds',
        label: t('phieuKho.store.khoCol'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.khoIds ?? [],
        onChange: (val: string[]) => setFilter('khoIds', val),
      },
      {
        key: 'maHang',
        label: t('phieuKho.form.itemCode'),
        icon: Barcode,
        options: maHangOptions,
        value: filters.maHangIds ?? [],
        onChange: (val: string[]) => setFilter('maHangIds', val),
      },
      {
        key: 'tenHang',
        label: t('phieuKho.form.itemName'),
        icon: Package,
        options: tenHangOptions,
        value: filters.tenHangIds ?? [],
        onChange: (val: string[]) => setFilter('tenHangIds', val),
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
      maHangOptions,
      tenHangOptions,
      filters.loai,
      filters.trangThaiKeys,
      filters.khoIds,
      filters.khoDenIds,
      filters.nguoiTaoIds,
      filters.nguoiDuyetIds,
      filters.doiTacIds,
      filters.maHangIds,
      filters.tenHangIds,
      setFilter,
    ]
  );

  const dateRangePickerPresets = useMemo(
    () => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })),
    []
  );
  const dateValue: DateRangeValue = {
    preset: filters.datePreset ?? 'all',
    customStart: filters.customDateFrom ?? '',
    customEnd: filters.customDateEnd ?? '',
  };
  const onDateChange = (v: DateRangeValue) => {
    setFilter('datePreset', v.preset as DatePresetId);
    setFilter('customDateFrom', v.customStart);
    setFilter('customDateEnd', v.customEnd);
  };

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

  const chipClassByKey: Record<string, string> = {
    loai: 'w-full sm:w-[140px]',
    khoIds: 'w-full sm:w-[160px]',
    maHang: 'w-full sm:w-[150px]',
    tenHang: 'w-full sm:w-[190px]',
  };

  const filterItems: FilterChipItem[] = filterGroupsComputed.map((g) => ({
    kind: 'group',
    group: g,
    className: chipClassByKey[g.key] ?? 'w-full sm:w-[150px]',
  }));
  // Chọn thời gian đứng ngay sau chip đầu tiên (loại phiếu) như trước.
  filterItems.splice(1, 0, {
    kind: 'custom',
    key: 'dateRange',
    node: (
      <DateRangePicker
        presets={dateRangePickerPresets}
        value={dateValue}
        onChange={onDateChange}
        displayLabel={dateRangeLabel}
        placeholder={t('phieuKho.chiTietTab.dateRangePlaceholder')}
        className="w-full sm:w-auto"
      />
    ),
  });

  // Bảng lọc mobile chỉ có các nhóm chọn — bù khoảng ngày của desktop.
  const mobileFilterExtra = (
    <MobileFilterField label={t('phieuKho.chiTietTab.dateRangePlaceholder')} icon={Calendar} active={!!dateFilterActive}>
      <DateRangePicker inline presets={dateRangePickerPresets} value={dateValue} onChange={onDateChange} />
    </MobileFilterField>
  );

  return (
    <GenericToolbar
      selectedCount={0}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={() => {}}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroupsComputed}
      mobileFilterExtra={mobileFilterExtra}
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
        setFilter('doiTacIds', []);
        setFilter('maHangIds', []);
        setFilter('tenHangIds', []);
      }}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
    />
  );
};

export default ChiTietPhieuKhoToolbar;
