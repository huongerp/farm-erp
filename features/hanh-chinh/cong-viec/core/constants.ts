import dayjs from 'dayjs';
import type { TFunction } from 'i18next';
import type { CongViecTrangThai, CongViecUuTien } from './types';

export type DueStatus = 'ok' | 'sap_han' | 'qua_han';

export interface CauHinhDue {
  so_ngay_canh_bao_sap_han: number;
  bat_canh_bao_qua_han: boolean;
}

/** Xác định trạng thái hạn: ok | sap_han | qua_han theo cấu hình. */
export function getDueStatus(
  ngayHetHan: string,
  cauHinh: CauHinhDue | null | undefined
): DueStatus {
  if (!ngayHetHan) return 'ok';
  const soNgay = cauHinh?.so_ngay_canh_bao_sap_han ?? 7;
  const batQuaHan = cauHinh?.bat_canh_bao_qua_han ?? true;
  const due = dayjs(ngayHetHan, 'YYYY-MM-DD').startOf('day').valueOf();
  const today = dayjs().startOf('day').valueOf();
  if (due < today) return batQuaHan ? 'qua_han' : 'ok';
  const endRange = dayjs().add(soNgay, 'day').endOf('day').valueOf();
  if (due <= endRange) return 'sap_han';
  return 'ok';
}

export const CONG_VIEC_TRANG_THAI: CongViecTrangThai[] = [
  'draft',
  'dang_thuc_hien',
  'cho_bao_cao',
  'hoan_thanh',
  'huy',
];

export const CONG_VIEC_UU_TIEN: CongViecUuTien[] = ['cao', 'trung_binh', 'thap'];

export const getTrangThaiLabel = (value: CongViecTrangThai, t: TFunction) => {
  switch (value) {
    case 'draft':
      return t('congViec.trangThai.draft');
    case 'dang_thuc_hien':
      return t('congViec.trangThai.dangThucHien');
    case 'cho_bao_cao':
      return t('congViec.trangThai.choBaoCao');
    case 'hoan_thanh':
      return t('congViec.trangThai.hoanThanh');
    case 'huy':
      return t('congViec.trangThai.huy');
    default:
      return value;
  }
};

export const getUuTienLabel = (value: CongViecUuTien, t: TFunction) => {
  switch (value) {
    case 'cao':
      return t('congViec.uuTien.cao');
    case 'trung_binh':
      return t('congViec.uuTien.trungBinh');
    case 'thap':
      return t('congViec.uuTien.thap');
    default:
      return value;
  }
};

export const getTrangThaiOptions = (t: TFunction) =>
  CONG_VIEC_TRANG_THAI.map((v) => ({ value: v, label: getTrangThaiLabel(v, t) }));

export const getUuTienOptions = (t: TFunction) =>
  CONG_VIEC_UU_TIEN.map((v) => ({ value: v, label: getUuTienLabel(v, t) }));
