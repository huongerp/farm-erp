export const NKPC_MODULE_ID = 'quan-ly-nha-so-che/nhat-ky-phun-cui';

/** Đơn vị nồng độ: ml hoặc g thuốc trên mỗi lít nước. */
export const DON_VI_NONG_DO = ['ml/lít', 'g/lít'] as const;
export type DonViNongDo = (typeof DON_VI_NONG_DO)[number];

export const DON_VI_NONG_DO_MAC_DINH: DonViNongDo = 'ml/lít';

/** Đơn vị của lượng thuốc suy ra từ đơn vị nồng độ: 'ml/lít' → 'ml', 'g/lít' → 'g'. */
export function donViLuongThuoc(donVi: string | null | undefined): string {
  return donVi === 'g/lít' ? 'g' : 'ml';
}

/** Chuỗi lạ từ DB coi như đơn vị mặc định để dòng cũ vẫn mở được. */
export function chuanHoaDonVi(donVi: string | null | undefined): DonViNongDo {
  return donVi === 'g/lít' ? 'g/lít' : DON_VI_NONG_DO_MAC_DINH;
}
