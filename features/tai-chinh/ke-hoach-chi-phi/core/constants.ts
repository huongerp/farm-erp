/** Trạng thái kế hoạch chi phí. */
export const KE_HOACH_CHI_PHI_TRANG_THAI = {
  NHAP: 0,
  DA_DUYET: 1,
  KHOA: 2,
} as const;

export type KeHoachChiPhiTrangThai =
  (typeof KE_HOACH_CHI_PHI_TRANG_THAI)[keyof typeof KE_HOACH_CHI_PHI_TRANG_THAI];

/** ID các tab trong module. */
export const KE_HOACH_CHI_PHI_TABS = ['ke_hoach', 'thuc_chi', 'so_sanh', 'bao_cao'] as const;
export type KeHoachChiPhiTabId = (typeof KE_HOACH_CHI_PHI_TABS)[number];
