/** Tab ID trang Thu chi. */
export const THU_CHI_TABS = ['list', 'stats'] as const;
export type ThuChiTabId = (typeof THU_CHI_TABS)[number];

/** Trạng thái giao dịch thu chi. */
export const THU_CHI_TRANG_THAI = {
  CHO_DUYET: 'cho_duyet',
  HOAN_THANH: 'hoan_thanh',
  HUY: 'huy',
} as const;

/** Loại giao dịch. */
export const THU_CHI_LOAI = ['thu', 'chi', 'chuyen_quy'] as const;
export type ThuChiLoaiType = (typeof THU_CHI_LOAI)[number];
