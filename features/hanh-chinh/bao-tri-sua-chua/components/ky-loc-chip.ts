/**
 * Chip thời gian chuẩn (DateRangePicker) dùng chung cho tab Tất cả và Thống kê.
 * Preset theo lib/date-presets.ts; "Tuỳ chọn" cho chọn khoảng từ ngày – đến ngày.
 *
 * Preset giữ ở state cục bộ: nếu suy ngược từ (dateFrom, dateTo) thì bấm "Tuỳ chọn" lúc
 * chưa có ngày sẽ bị hiểu thành "Tất cả" và ô chọn khoảng biến mất.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRangePreset, DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { getDateRangeFromPreset, getPresetFromDates } from '../../../../lib/date-presets';

export const KY_CUSTOM = 'custom';
const KY_PRESET_IDS = ['all', 'thisMonth', 'lastMonth', 'thisQuarter', 'thisYear', KY_CUSTOM] as const;

export function useKyChip(
  dateFrom: string,
  dateTo: string,
  setKhoang: (from: string, to: string) => void
): { presets: DateRangePreset[]; value: DateRangeValue; onChange: (v: DateRangeValue) => void } {
  const { t } = useTranslation();
  const [preset, setPreset] = useState(() => getPresetFromDates(dateFrom, dateTo));
  const presets = useMemo(
    () => KY_PRESET_IDS.map((id) => ({ id, label: t(`baoTriSuaChua.filter.preset.${id}`) })),
    [t]
  );
  // Bộ lọc bị xoá từ ngoài (nút Xoá lọc) → chip về "Tất cả".
  const presetHienThi = !dateFrom && !dateTo && preset !== KY_CUSTOM ? 'all' : preset;
  const value = useMemo(
    () => ({ preset: presetHienThi, customStart: dateFrom, customEnd: dateTo }),
    [presetHienThi, dateFrom, dateTo]
  );
  const onChange = (v: DateRangeValue) => {
    setPreset(v.preset);
    if (v.preset === KY_CUSTOM) {
      setKhoang(v.customStart, v.customEnd);
      return;
    }
    const r = getDateRangeFromPreset(v.preset);
    setKhoang(r.dateFrom, r.dateTo);
  };
  return { presets, value, onChange };
}
