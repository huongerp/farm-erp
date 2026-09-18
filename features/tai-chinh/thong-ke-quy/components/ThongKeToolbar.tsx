import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Wallet } from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import FilterChipSingleSelect from '../../../../components/shared/FilterChipSingleSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { DATE_RANGE_PRESETS, type DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';

export interface ThongKeToolbarValue {
  chiNhanhId: string;
  datePreset: string;
  customDateFrom: string;
  customDateEnd: string;
  loai: '' | 'thu' | 'chi';
}

export const DEFAULT_THONG_KE_FILTER: ThongKeToolbarValue = {
  chiNhanhId: '',
  datePreset: 'this_month',
  customDateFrom: '',
  customDateEnd: '',
  loai: '',
};

/** Khoảng ngày (yyyy-mm-dd) suy từ preset — dùng chung cho cả hai tab. */
export function resolveDateRange(value: ThongKeToolbarValue): { tuNgay: string; denNgay: string } {
  if ((value.datePreset || 'all') === 'all') return { tuNgay: '', denNgay: '' };
  const range = getDateRangeFromPreset(
    value.datePreset as DateRangePresetId,
    value.customDateFrom ? new Date(value.customDateFrom) : undefined,
    value.customDateEnd ? new Date(value.customDateEnd) : undefined
  );
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { tuNgay: fmt(range.start), denNgay: fmt(range.end) };
}

interface Props {
  branches: { id: string; ten_chi_nhanh: string }[];
  allowAllBranches: boolean;
  value: ThongKeToolbarValue;
  onChange: (next: ThongKeToolbarValue) => void;
  /** Ẩn ô loại phiếu (tab tra cứu cần cả thu lẫn chi mới ra tồn quỹ đúng) */
  hideLoai?: boolean;
  /** Nút hành động bên phải toolbar (vd. Xuất) */
  actions?: React.ReactNode;
}

const ThongKeToolbar: React.FC<Props> = ({
  branches,
  allowAllBranches,
  value,
  onChange,
  hideLoai = false,
  actions,
}) => {
  const { t } = useTranslation();

  const branchOptions = useMemo(
    () => branches.map((b) => ({ label: b.ten_chi_nhanh, value: String(b.id) })),
    [branches]
  );

  const loaiOptions = useMemo(
    () => [
      { label: t('thuChiQuy.loai.thu'), value: 'thu' },
      { label: t('thuChiQuy.loai.chi'), value: 'chi' },
    ],
    [t]
  );

  const datePreset = value.datePreset || 'all';
  const dateRangeLabel = useMemo(() => {
    if (datePreset === 'all') return '';
    const range = getDateRangeFromPreset(
      datePreset as DateRangePresetId,
      value.customDateFrom ? new Date(value.customDateFrom) : undefined,
      value.customDateEnd ? new Date(value.customDateEnd) : undefined
    );
    return range.label;
  }, [datePreset, value.customDateFrom, value.customDateEnd]);

  const datePresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);

  const activeFilterCount =
    (value.chiNhanhId ? 1 : 0) + (datePreset !== 'all' ? 1 : 0) + (!hideLoai && value.loai ? 1 : 0);

  const clearFilters = () =>
    onChange({ ...DEFAULT_THONG_KE_FILTER, chiNhanhId: allowAllBranches ? '' : value.chiNhanhId });

  const filterGroups = useMemo(
    () => [
      {
        key: 'chiNhanh',
        label: t('thongKeQuy.filters.chiNhanh'),
        icon: Building2,
        options: branchOptions,
        value: value.chiNhanhId ? [value.chiNhanhId] : [],
        onChange: (val: string[]) => onChange({ ...value, chiNhanhId: val[0] ?? '' }),
      },
      ...(hideLoai
        ? []
        : [
            {
              key: 'loai',
              label: t('thongKeQuy.filters.loai'),
              icon: Wallet,
              options: loaiOptions,
              value: value.loai ? [value.loai] : [],
              onChange: (val: string[]) =>
                onChange({ ...value, loai: (val[0] ?? '') as '' | 'thu' | 'chi' }),
            },
          ]),
    ],
    [t, branchOptions, loaiOptions, value, onChange, hideLoai]
  );

  const filters = (
    <>
      <FilterChipSingleSelect
        options={branchOptions}
        value={value.chiNhanhId || null}
        onChange={(v) => onChange({ ...value, chiNhanhId: v ?? (allowAllBranches ? '' : value.chiNhanhId) })}
        placeholder={t('thongKeQuy.filters.allBranches')}
        icon={Building2}
        className="w-full sm:w-[190px]"
      />
      <DateRangePicker
        presets={datePresets}
        value={{
          preset: datePreset,
          customStart: value.customDateFrom,
          customEnd: value.customDateEnd,
        }}
        onChange={(v) =>
          onChange({
            ...value,
            datePreset: v.preset,
            customDateFrom: v.customStart,
            customDateEnd: v.customEnd,
          })
        }
        displayLabel={dateRangeLabel}
        placeholder={t('thongKeQuy.filters.dateRange')}
        className="w-full sm:w-auto"
      />
      {!hideLoai && (
        <FilterChipSingleSelect
          options={loaiOptions}
          value={value.loai || null}
          onChange={(v) => onChange({ ...value, loai: (v ?? '') as '' | 'thu' | 'chi' })}
          placeholder={t('thongKeQuy.filters.loaiAll')}
          icon={Wallet}
          className="w-full sm:w-[150px]"
        />
      )}
    </>
  );

  return (
    <DashboardToolbar
      // Toolbar nằm trong khung tab (đã có thanh tab phía trên) nên bỏ sticky,
      // nếu không nó dính lên đầu màn hình và chồng lên tab.
      className="static z-auto"
      filters={filters}
      actions={actions}
      filterGroups={filterGroups}
      activeFilterCount={activeFilterCount}
      onClearFilters={clearFilters}
    />
  );
};

export default ThongKeToolbar;
