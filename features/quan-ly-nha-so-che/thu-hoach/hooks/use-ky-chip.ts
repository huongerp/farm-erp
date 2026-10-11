/**
 * Chip Kỳ (DateRangePicker) của tab Thống kê — khuôn `bao-tri-sua-chua/components/ky-loc-chip.ts`,
 * thêm preset tuần vì thu hoạch lập theo tuần.
 *
 * Preset giữ ở state cục bộ: nếu suy ngược từ (tuNgay, denNgay) thì bấm "Tuỳ chọn" lúc
 * chưa có ngày sẽ bị hiểu thành "Tất cả" và ô chọn khoảng biến mất.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRangePreset, DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { getDateRangeFromPreset } from '../../../../lib/date-presets';
import { formatYmdToDisplay } from '../../../../lib/utils';

export const KY_CUSTOM = 'custom';
const KY_PRESET_IDS = ['all', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear', KY_CUSTOM] as const;

export function useKyChip(
  tuNgay: string,
  denNgay: string,
  setKhoang: (tu: string, den: string) => void
): { presets: DateRangePreset[]; value: DateRangeValue; onChange: (v: DateRangeValue) => void; displayLabel?: string } {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<string>(() => (tuNgay || denNgay ? KY_CUSTOM : 'all'));
  const presets = useMemo(
    () => KY_PRESET_IDS.map((id) => ({ id, label: t(`thuHoach.stats.preset.${id}`) })),
    [t]
  );
  // Bộ lọc bị xoá từ ngoài (nút Xoá lọc) → chip về "Tất cả".
  const presetHienThi = !tuNgay && !denNgay && preset !== KY_CUSTOM ? 'all' : preset;
  const value = useMemo(
    () => ({ preset: presetHienThi, customStart: tuNgay, customEnd: denNgay }),
    [presetHienThi, tuNgay, denNgay]
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
  const displayLabel =
    presetHienThi === KY_CUSTOM && (tuNgay || denNgay)
      ? `${tuNgay ? formatYmdToDisplay(tuNgay) : '…'} – ${denNgay ? formatYmdToDisplay(denNgay) : '…'}`
      : undefined;
  return { presets, value, onChange, displayLabel };
}
