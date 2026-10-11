/**
 * Chip thời gian chuẩn (DateRangePicker) của tab Danh sách — khuôn của Bảo trì
 * (`bao-tri-sua-chua/components/ky-loc-chip.ts`).
 *
 * Preset giữ ở state cục bộ: nếu suy ngược từ (dateFrom, dateTo) thì bấm "Tuỳ chọn" lúc
 * chưa có ngày sẽ bị hiểu thành "Tất cả" và ô chọn khoảng biến mất.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRangePreset, DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { getTodayISO } from '../../../../lib/utils';
import { KY_CUSTOM, KY_PRESET_DANH_SACH, KY_TAT_CA, khoangTheoPreset, presetTuKhoang } from '../core/ky-loc';

export function useKyChip(
  dateFrom: string,
  dateTo: string,
  setKhoang: (from: string, to: string) => void
): { presets: DateRangePreset[]; value: DateRangeValue; onChange: (v: DateRangeValue) => void } {
  const { t } = useTranslation();
  const [preset, setPreset] = useState(() => presetTuKhoang(dateFrom, dateTo, getTodayISO()));
  const presets = useMemo(
    () => KY_PRESET_DANH_SACH.map((id) => ({ id, label: t(`dangKyNhanHang.preset.${id}`) })),
    [t]
  );
  // Bộ lọc bị xoá từ ngoài (nút Xoá lọc) → chip về "Tất cả".
  const presetHienThi = !dateFrom && !dateTo && preset !== KY_CUSTOM ? KY_TAT_CA : preset;
  const value = useMemo(
    () => ({ preset: presetHienThi, customStart: dateFrom, customEnd: dateTo }),
    [presetHienThi, dateFrom, dateTo]
  );
  const onChange = (v: DateRangeValue) => {
    setPreset(v.preset);
    const r = khoangTheoPreset(v.preset, getTodayISO(), v.customStart, v.customEnd);
    setKhoang(r.from, r.to);
  };
  return { presets, value, onChange };
}
