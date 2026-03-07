import type { TFunction } from 'i18next';
import type { DiemCongTruLoai } from './types';

export const DIEM_CONG_TRU_LOAI_OPTIONS: DiemCongTruLoai[] = ['cong', 'tru'];

export const getDiemCongTruLoaiLabel = (loai: DiemCongTruLoai, t: TFunction) => {
  return loai === 'cong' ? t('diemCongTru.types.cong') : t('diemCongTru.types.tru');
};

export const getDiemCongTruLoaiOptions = (t: TFunction) =>
  DIEM_CONG_TRU_LOAI_OPTIONS.map((value) => ({ value, label: getDiemCongTruLoaiLabel(value, t) }));
