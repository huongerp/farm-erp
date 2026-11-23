import type { ChiTietSubByLoai, ChiTietSubFormByLoai } from './ct-sub';
import { sumGioCongFromSubModels } from './ct-sub';

/** 5 chuyền sản xuất (I.1 → III) — dòng IV trên UI = tổng các dòng này */
export const CHUYEN_PRODUCTION_CODES = [
  'XAN_NAI',
  'TIA_DANH_GIA',
  'CAN_TEM_DONG_THUNG',
  'KHO_HUT_CHAN_KHONG',
  'CONG_TANG_CUONG',
] as const;

/** Ngoài lô chỉ theo dõi người và buổi đi làm, không thuộc nhân công nhà sơ chế. */
export const NGOAI_LE_CODE = 'NGOAI_LE' as const;

/** Mã dòng lưu DB — khớp CHECK constraint SQL (5 chuyền + V + Ngoại lệ). */
export const LOAI_CHUYEN_CODES = [...CHUYEN_PRODUCTION_CODES, 'CONG_DINH_BIEN_KHONG_SAN_XUAT', NGOAI_LE_CODE] as const;

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
  /** Dòng con theo CN ngày / CN nửa / tăng ca — từ fp_farm_bao_cao_nhan_cong_ct_sub */
  sub_by_loai?: ChiTietSubByLoai;
  /** Tên từng người của chuyền — fp_farm_bao_cao_nhan_cong_nv (chỉ tải ở chi tiết phiếu) */
  nhan_vien?: FarmBaoCaoNhanCongNv[];
  /**
   * Số thùng theo nhóm: khoá "1".."9" → số ≥ 0; thiếu khoá = chưa nhập. Service luôn điền ({} nếu trống);
   * optional để fixture/test cũ của module khác không phải sửa.
   */
  so_thung_nhom?: Record<string, number>;
  /** Hệ số nhóm sửa trên phiếu (thưởng vượt thùng, migration 087): khoá "1".."9"; thiếu khoá = mặc định Cài đặt. */
  he_so_nhom?: Record<string, number>;
}

/** Chấm công của một người trong phiếu: Sáng, Chiều, Cả ngày (= sáng + chiều), Nghỉ cả ngày (0 công); NUA_NGAY là mã cũ (không biết buổi nào) */
export const CHAM_CONG_CODES = ['CA_NGAY', 'NUA_NGAY', 'SANG', 'CHIEU', 'NGHI'] as const;
export type ChamCong = (typeof CHAM_CONG_CODES)[number];

export interface FarmBaoCaoNhanCongNv {
  id: string;
  id_bcnc_ct: string;
  id_nhan_vien: string | null;
  ho_ten: string;
  vi_tri: string | null;
  /** Nhóm trong chuyền ngày hôm đó (1–9); null = chưa chia nhóm. */
  so_nhom: number | null;
  cham_cong: ChamCong;
  so_gio_cong: number;
  so_gio_tc: number;
  ghi_chu: string | null;
  thu_tu: number;
}

/**
 * Một người trong danh sách chọn tên của Báo cáo nhân công — ghép Danh sách nhân viên
 * (tên, trạng thái) với thiết lập sơ chế theo chi nhánh `fp_var_nhan_vien_so_che`
 * (vị trí / nhóm / chuyền / thứ tự). Xem `core/ghep-danh-muc-nv.ts`.
 */
export interface VarNhanVienSoChe {
  /** id dòng thiết lập; null = người chưa có dòng thiết lập (chưa có gì để sửa). */
  id: string | null;
  /** id trong `fp_var_nhan_vien` — người trong Danh sách nhân viên. */
  id_nv?: string | null;
  id_chi_nhanh: string;
  ho_ten: string;
  vi_tri: string | null;
  /** Nhóm mặc định (1–9) — chép vào phiếu khi chọn tên; null = chưa chia nhóm. */
  so_nhom: number | null;
  loai_chuyen: LoaiChuyen | null;
  dang_dung: boolean;
  thu_tu: number;
}

/** Danh mục vị trí công việc dùng chung — fp_var_vi_tri_so_che */
export interface VarViTriSoChe {
  id: string;
  ten: string;
  dang_dung: boolean;
  /** Nhóm trưởng / QL: không nhận thưởng vượt thùng, giờ không tính vào định mức nhóm. */
  khong_thuong_vuot?: boolean;
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
      sub_by_loai: { CN_NGAY: [], CN_NUA: [], TANG_CA: [] },
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
      sub_by_loai: { CN_NGAY: [], CN_NUA: [], TANG_CA: [] },
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
  /** Đường dẫn ảnh `/media/f/...` (kho VPS, theo thứ tự) — list không tải; chỉ chi tiết / form */
  hinh_anh_urls: string[];
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  trang_thai: TrangThaiBaoCaoNhanCongPhieu;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet: FarmBaoCaoNhanCongCt[];
  /** Mục tiêu năng suất nhóm (thùng / giờ-người), mặc định 3. Service luôn điền; optional như `so_thung_nhom`. */
  muc_tieu_ns_nhom?: number;
}

export function sumSlCongNgay(item: FarmBaoCaoNhanCong): number {
  return (item.chi_tiet ?? []).filter((r) => r.loai_chuyen !== NGOAI_LE_CODE).reduce((s, r) => s + Number(r.sl_cong_ngay ?? 0), 0);
}

export function sumSlCongNua(item: FarmBaoCaoNhanCong): number {
  return (item.chi_tiet ?? []).filter((r) => r.loai_chuyen !== NGOAI_LE_CODE).reduce((s, r) => s + Number(r.sl_cong_nua ?? 0), 0);
}

export function sumSlTangCa(item: FarmBaoCaoNhanCong): number {
  return (item.chi_tiet ?? []).filter((r) => r.loai_chuyen !== NGOAI_LE_CODE).reduce((s, r) => s + Number(r.sl_tang_ca ?? 0), 0);
}

export function sumSoGioTc(item: FarmBaoCaoNhanCong): number {
  return (item.chi_tiet ?? []).filter((r) => r.loai_chuyen !== NGOAI_LE_CODE).reduce((s, r) => s + Number(r.so_gio_tc ?? 0), 0);
}

type TongGioTichRow = Partial<ChiTietNumericFields> & {
  sub_by_loai?: ChiTietSubByLoai;
  sub?: Partial<ChiTietSubFormByLoai> | ChiTietSubFormByLoai;
};

/** Tổng giờ tăng ca theo dòng: Σ(sl×giờ) từ sub TANG_CA; không có sub thì sl_tang_ca × so_gio_tc */
export function tongGioTangCaTichMotDong(row: TongGioTichRow): number {
  const formTc = row.sub?.TANG_CA;
  if (formTc && formTc.length > 0) {
    return formTc.reduce((s, r) => s + numChiTiet(r.sl_cong) * numChiTiet(r.so_gio), 0);
  }
  const subs = row.sub_by_loai?.TANG_CA;
  if (subs && subs.length > 0) {
    return sumGioCongFromSubModels(subs);
  }
  return numChiTiet(row.sl_tang_ca) * numChiTiet(row.so_gio_tc);
}

/** Cộng dồn theo từng dòng (không nhân tổng SL với tổng giờ). */
export function sumTongGioTangCaTichTuChiTiet(rows: TongGioTichRow[]): number {
  return rows.reduce((s, r) => s + tongGioTangCaTichMotDong(r), 0);
}

export function sumTongGioTangCaTichPhieu(item: FarmBaoCaoNhanCong): number {
  return sumTongGioTangCaTichTuChiTiet((item.chi_tiet ?? []).filter((r) => r.loai_chuyen !== NGOAI_LE_CODE));
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
  return sumTongCongQuyDoiTuChiTiet((item.chi_tiet ?? []).filter((r) => r.loai_chuyen !== NGOAI_LE_CODE));
}

