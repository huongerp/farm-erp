/** 5 chuyền sản xuất (I.1 → III) — dòng IV trên UI = tổng các dòng này */
export const CHUYEN_PRODUCTION_CODES = [
  'XAN_NAI',
  'TIA_DANH_GIA',
  'CAN_TEM_DONG_THUNG',
  'KHO_HUT_CHAN_KHONG',
  'CONG_TANG_CUONG',
] as const;

/** Mã dòng lưu DB — khớp CHECK constraint SQL (5 chuyền + V) */
export const LOAI_CHUYEN_CODES = [...CHUYEN_PRODUCTION_CODES, 'CONG_DINH_BIEN_KHONG_SAN_XUAT'] as const;

export type LoaiChuyen = (typeof LOAI_CHUYEN_CODES)[number];

/** Cột TT cho 5 chuyền sản xuất; thu_tu 1→5 */
export const CHUYEN_TT_LABELS = ['I.1', 'I.2', 'I.3', 'II', 'III'] as const;

export function chuyenTtLabelByThuTu(thuTu: number): string {
  const i = Math.max(0, Math.min(4, thuTu - 1));
  return CHUYEN_TT_LABELS[i] ?? String(thuTu);
}

export interface FarmBaoCaoNhanCongCt {
  id: string;
  id_bao_cao: string;
  loai_chuyen: LoaiChuyen;
  sl_cong_ngay: number;
  sl_cong_nua: number;
  sl_tang_ca: number;
  so_gio_tc: number;
  ghi_chu: string | null;
  thu_tu: number;
}

export type ChiTietNumericFields = Pick<
  FarmBaoCaoNhanCongCt,
  'sl_cong_ngay' | 'sl_cong_nua' | 'sl_tang_ca' | 'so_gio_tc'
>;

const numChiTiet = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Tổng theo từng cột số (công ngày / nửa / tăng ca / giờ TC) */
export function sumChiTietNumericPart(rows: Partial<ChiTietNumericFields>[]): ChiTietNumericFields {
  return rows.reduce<ChiTietNumericFields>(
    (acc, r) => ({
      sl_cong_ngay: acc.sl_cong_ngay + numChiTiet(r.sl_cong_ngay),
      sl_cong_nua: acc.sl_cong_nua + numChiTiet(r.sl_cong_nua),
      sl_tang_ca: acc.sl_tang_ca + numChiTiet(r.sl_tang_ca),
      so_gio_tc: acc.so_gio_tc + numChiTiet(r.so_gio_tc),
    }),
    { sl_cong_ngay: 0, sl_cong_nua: 0, sl_tang_ca: 0, so_gio_tc: 0 }
  );
}

/** Chuẩn hoá chi tiết để hiển thị: 5 chuyền + dòng V (có thể thiếu trên dữ liệu cũ). */
export function normalizeChiTietForDisplay(ct: FarmBaoCaoNhanCongCt[]): {
  production: FarmBaoCaoNhanCongCt[];
  vRow: FarmBaoCaoNhanCongCt;
} {
  const byLoai = new Map(ct.map((c) => [c.loai_chuyen, c]));
  const production = CHUYEN_PRODUCTION_CODES.map((code, i) => {
    const row = byLoai.get(code);
    if (row) return row;
    return {
      id: '',
      id_bao_cao: '',
      loai_chuyen: code,
      sl_cong_ngay: 0,
      sl_cong_nua: 0,
      sl_tang_ca: 0,
      so_gio_tc: 0,
      ghi_chu: null,
      thu_tu: i + 1,
    };
  });
  const vExisting = byLoai.get('CONG_DINH_BIEN_KHONG_SAN_XUAT');
  const vRow: FarmBaoCaoNhanCongCt =
    vExisting ?? {
      id: '',
      id_bao_cao: '',
      loai_chuyen: 'CONG_DINH_BIEN_KHONG_SAN_XUAT',
      sl_cong_ngay: 0,
      sl_cong_nua: 0,
      sl_tang_ca: 0,
      so_gio_tc: 0,
      ghi_chu: null,
      thu_tu: 6,
    };
  return { production, vRow };
}

/** `mo` = đang mở, `khoa` = đã khóa (chỉ quản trị sửa/xóa). */
export type TrangThaiBaoCaoNhanCongPhieu = 'mo' | 'khoa';

export const TRANG_THAI_BAO_CAO_NHAN_CONG = {
  MO: 'mo' as const,
  KHOA: 'khoa' as const,
} as const;

export interface FarmBaoCaoNhanCong {
  id: string;
  /** ISO date yyyy-mm-dd */
  ngay: string;
  id_chi_nhanh: string | null;
  ten_chi_nhanh: string | null;
  ghi_chu: string | null;
  /** URL ảnh Cloudinary (theo thứ tự) */
  hinh_anh_urls: string[];
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  trang_thai: TrangThaiBaoCaoNhanCongPhieu;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet: FarmBaoCaoNhanCongCt[];
}

export function sumSlCongNgay(item: FarmBaoCaoNhanCong): number {
  return (item.chi_tiet ?? []).reduce((s, r) => s + Number(r.sl_cong_ngay ?? 0), 0);
}

export function sumSlCongNua(item: FarmBaoCaoNhanCong): number {
  return (item.chi_tiet ?? []).reduce((s, r) => s + Number(r.sl_cong_nua ?? 0), 0);
}

export function sumSlTangCa(item: FarmBaoCaoNhanCong): number {
  return (item.chi_tiet ?? []).reduce((s, r) => s + Number(r.sl_tang_ca ?? 0), 0);
}

export function sumSoGioTc(item: FarmBaoCaoNhanCong): number {
  return (item.chi_tiet ?? []).reduce((s, r) => s + Number(r.so_gio_tc ?? 0), 0);
}

/** Tổng giờ tăng ca theo dòng: SL tăng ca × giờ tăng ca (một dòng chuyền). */
export function tongGioTangCaTichMotDong(row: Partial<ChiTietNumericFields>): number {
  return numChiTiet(row.sl_tang_ca) * numChiTiet(row.so_gio_tc);
}

/** Cộng dồn theo từng dòng (không nhân tổng SL với tổng giờ). */
export function sumTongGioTangCaTichTuChiTiet(rows: Partial<ChiTietNumericFields>[]): number {
  return rows.reduce((s, r) => s + tongGioTangCaTichMotDong(r), 0);
}

export function sumTongGioTangCaTichPhieu(item: FarmBaoCaoNhanCong): number {
  return sumTongGioTangCaTichTuChiTiet(item.chi_tiet ?? []);
}

/** 1 công ngày + ½ công nửa (nửa công ÷ 2), theo từng dòng chuyền. */
export function tongCongQuyDoiNgayVaNua(row: Partial<ChiTietNumericFields>): number {
  return numChiTiet(row.sl_cong_ngay) + numChiTiet(row.sl_cong_nua) / 2;
}

/** Cộng dồn quy đổi nhiều dòng (cộng theo từng dòng, không gộp tổng rồi chia 2). */
export function sumTongCongQuyDoiTuChiTiet(rows: Partial<ChiTietNumericFields>[]): number {
  return rows.reduce((s, r) => s + tongCongQuyDoiNgayVaNua(r), 0);
}

export function sumTongCongQuyDoiPhieu(item: FarmBaoCaoNhanCong): number {
  return sumTongCongQuyDoiTuChiTiet(item.chi_tiet ?? []);
}
