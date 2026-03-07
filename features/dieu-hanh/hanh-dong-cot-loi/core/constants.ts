import type { BscDimension } from './types';
import type { NhomHanhDong } from './types';

export const BSC_DIMENSIONS: BscDimension[] = [
  'tai_chinh',
  'khach_hang',
  'quy_trinh',
  'hoc_hoi_phat_trien',
];

/** i18n key cho từng BSC */
export const BSC_LABEL_KEYS: Record<BscDimension, string> = {
  tai_chinh: 'hanhDongCotLoi.bsc.taiChinh',
  khach_hang: 'hanhDongCotLoi.bsc.khachHang',
  quy_trinh: 'hanhDongCotLoi.bsc.quyTrinh',
  hoc_hoi_phat_trien: 'hanhDongCotLoi.bsc.hocHoiPhatTrien',
};

/** Seed 9 nhóm hành động (chuẩn hóa từ yêu cầu) */
export function getNhomHanhDongDefault(): NhomHanhDong[] {
  const items: NhomHanhDong[] = [
    { id: 'nhd-tang', ma: 'TANG', ten: 'Tăng', mo_ta: null, thu_tu: 0 },
    { id: 'nhd-giam', ma: 'GIAM', ten: 'Giảm', mo_ta: null, thu_tu: 1 },
    { id: 'nhd-toi-uu-hoa', ma: 'TOI_UU_HOA', ten: 'Tối ưu hóa', mo_ta: null, thu_tu: 2 },
    { id: 'nhd-toi-da-hoa', ma: 'TOI_DA_HOA', ten: 'Tối đa hóa', mo_ta: null, thu_tu: 3 },
    { id: 'nhd-duy-tri', ma: 'DUY_TRI', ten: 'Duy trì', mo_ta: null, thu_tu: 4 },
    { id: 'nhd-dam-bao', ma: 'DAM_BAO', ten: 'Đảm bảo', mo_ta: null, thu_tu: 5 },
    { id: 'nhd-phat-trien', ma: 'PHAT_TRIEN', ten: 'Phát triển', mo_ta: null, thu_tu: 6 },
    { id: 'nhd-cai-tien', ma: 'CAI_TIEN', ten: 'Cải tiến', mo_ta: null, thu_tu: 7 },
    { id: 'nhd-cai-thien', ma: 'CAI_THIEN', ten: 'Cải thiện', mo_ta: null, thu_tu: 8 },
  ];
  return items;
}

/** Ngưỡng tổng tỷ trọng (99.99 – 100.01) */
export const TY_TRONG_SUM_MIN = 99.99;
export const TY_TRONG_SUM_MAX = 100.01;
