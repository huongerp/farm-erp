/**
 * Chip «Ngày» chuẩn (DateRangePicker) cho nhật ký ghi theo ngày — khuôn
 * `bao-tri-sua-chua/components/ky-loc-chip.ts`, preset ở `./ky-ngay.ts`, nhãn ở `common.kyNgay.*`.
 * Trả sẵn item cho `ResponsiveFilterChips` và khối `mobileFilterExtra` cho bảng lọc điện thoại.
 *
 * Preset giữ ở state cục bộ: nếu suy ngược từ (tu, den) thì bấm «Tuỳ chọn» lúc chưa có ngày
 * sẽ bị hiểu thành «Tất cả» và ô chọn khoảng biến mất.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarRange } from 'lucide-react';
import DateRangePicker, { type DateRangeValue } from '../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../components/ui/MobileFilterSheet';
import type { FilterChipItem } from '../../../components/shared/ResponsiveFilterChips';
import { getTodayISO } from '../../../lib/utils';
import { KY_NGAY_PRESET, KY_NGAY_TAT_CA, KY_NGAY_TUY_CHON, khoangTheoKyNgay, kyNgayCuaKhoang } from './ky-ngay';

export function useKyNgayChip(
  tu: string,
  den: string,
  setKhoang: (tu: string, den: string) => void
): { coKy: boolean; chipItem: FilterChipItem; mobileFilterExtra: React.ReactNode } {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<string>(() => kyNgayCuaKhoang(tu, den, getTodayISO()));
  const presets = useMemo(() => KY_NGAY_PRESET.map((id) => ({ id, label: t(`common.kyNgay.${id}`) })), [t]);
  const coKy = !!(tu || den);
  // Bộ lọc bị xoá từ ngoài (nút Xoá lọc) → chip về «Tất cả».
  const presetHienThi = !coKy && preset !== KY_NGAY_TUY_CHON ? KY_NGAY_TAT_CA : preset;
  const value = useMemo(() => ({ preset: presetHienThi, customStart: tu, customEnd: den }), [presetHienThi, tu, den]);
  const onChange = (v: DateRangeValue) => {
    setPreset(v.preset);
    const r = khoangTheoKyNgay(v.preset, getTodayISO(), v.customStart, v.customEnd);
    setKhoang(r.tu, r.den);
  };

  const nhan = t('common.kyNgay.label');
  const picker = (inline: boolean) => (
    <DateRangePicker
      inline={inline}
      presets={presets}
      value={value}
      onChange={onChange}
      placeholder={inline ? undefined : nhan}
      customPresetId={KY_NGAY_TUY_CHON}
      className={inline ? undefined : 'w-full sm:w-auto shrink-0'}
    />
  );

  return {
    coKy,
    chipItem: { kind: 'custom', key: 'ky-ngay', node: picker(false) },
    // Điện thoại không có hàng chip → chọn khoảng ngày hiện thẳng trong bảng lọc.
    mobileFilterExtra: (
      <MobileFilterField label={nhan} icon={CalendarRange} active={coKy}>
        {picker(true)}
      </MobileFilterField>
    ),
  };
}
