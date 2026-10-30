/**
 * Chip Kỳ (DateRangePicker) của các tab tổng hợp Đánh giá đầu vào — khuôn `thu-hoach/hooks/use-ky-chip.ts`,
 * bộ kỳ ở `utils/khoang-ngay` (mặc định «Tất cả»). Preset giữ ở state cục bộ: suy ngược từ khoảng thì bấm
 * «Tuỳ chọn» lúc chưa có ngày sẽ bị hiểu thành «Tất cả» và ô chọn khoảng biến mất.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRangePreset, DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { KY_DGDV, KY_TAT_CA, KY_TUY_CHON, khoangTheoKy } from '../utils/khoang-ngay';

export interface KyDgdvChip {
  presets: DateRangePreset[];
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  /** nhãn chip khi Tuỳ chọn (dd/mm/yyyy – dd/mm/yyyy) */
  displayLabel?: string;
  /** khoảng đang lọc, rỗng = không giới hạn */
  khoang: { tu: string; den: string };
  /** nhãn ngắn của kỳ đang chọn (cho bảng lọc mobile) */
  nhan: string;
}

export function useKyDgdv(onDoi?: () => void, kyDau: string = KY_TAT_CA): KyDgdvChip {
  const { t } = useTranslation();
  const homNay = getTodayISO();
  const [ky, setKy] = useState(kyDau);
  const [tuyChon, setTuyChon] = useState({ tu: '', den: '' });
  const presets = useMemo(() => KY_DGDV.map((id) => ({ id, label: t(`danhGiaDauVao.toolbar.preset.${id}`) })), [t]);
  const khoang = useMemo(() => khoangTheoKy(ky, homNay, tuyChon.tu, tuyChon.den), [ky, homNay, tuyChon]);
  const value = useMemo(() => ({ preset: ky, customStart: tuyChon.tu, customEnd: tuyChon.den }), [ky, tuyChon]);

  const onChange = (v: DateRangeValue) => {
    setKy(v.preset);
    if (v.preset === KY_TUY_CHON) {
      // Đảo nếu chọn ngược; thiếu một đầu thì để trống đầu đó (không giới hạn phía đó).
      const [a, b] = v.customStart && v.customEnd && v.customEnd < v.customStart ? [v.customEnd, v.customStart] : [v.customStart, v.customEnd];
      setTuyChon({ tu: a, den: b });
    }
    onDoi?.();
  };

  const displayLabel =
    ky === KY_TUY_CHON && (tuyChon.tu || tuyChon.den)
      ? `${tuyChon.tu ? formatYmdToDisplay(tuyChon.tu) : '…'} – ${tuyChon.den ? formatYmdToDisplay(tuyChon.den) : '…'}`
      : undefined;
  const nhan = displayLabel ?? presets.find((p) => p.id === ky)?.label ?? '';
  return { presets, value, onChange, displayLabel, khoang, nhan };
}
