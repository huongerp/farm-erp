import type { TFunction } from 'i18next';

export const UU_TIEN_OPTIONS = ['cao', 'trung_binh', 'thap'] as const;
export type UuTienValue = (typeof UU_TIEN_OPTIONS)[number];

export const getUuTienLabel = (value: UuTienValue, t: TFunction) => {
  switch (value) {
    case 'cao':
      return t('thietLapCongViec.uuTien.cao');
    case 'trung_binh':
      return t('thietLapCongViec.uuTien.trungBinh');
    case 'thap':
      return t('thietLapCongViec.uuTien.thap');
    default:
      return value;
  }
};

export const getUuTienOptions = (t: TFunction) =>
  UU_TIEN_OPTIONS.map((v) => ({ value: v, label: getUuTienLabel(v, t) }));

export const SO_NGAY_CANH_BAO_MIN = 1;
export const SO_NGAY_CANH_BAO_MAX = 30;
