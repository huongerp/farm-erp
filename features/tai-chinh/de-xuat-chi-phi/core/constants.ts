/** Trạng thái đề xuất chi phí. */
export const DE_XUAT_CHI_PHI_TRANG_THAI = {
  CHO_DUYET: 0,
  DA_DUYET: 1,
  TU_CHOI: 2,
} as const;

export const DE_XUAT_CHI_PHI_LOAI = ['thu', 'chi'] as const;
export type DeXuatChiPhiLoai = (typeof DE_XUAT_CHI_PHI_LOAI)[number];
