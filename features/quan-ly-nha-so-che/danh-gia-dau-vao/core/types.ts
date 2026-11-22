/** module_id của «Đánh giá đầu vào» — khớp RLS `fn_co_quyen_module` trong migration 052. */
export const DGDV_MODULE_ID = 'quan-ly-nha-so-che/danh-gia-dau-vao';

/** `mo` = đang mở, `khoa` = đã khóa (chỉ quản trị sửa/xóa). */
export type TrangThaiDgdvPhieu = 'mo' | 'khoa';

export const TRANG_THAI_DGDV = {
  MO: 'mo' as const,
  KHOA: 'khoa' as const,
} as const;

/** `danh_gia` = chọn nhanh cho ô «Đánh giá»; `loi` = chọn nhanh cho ô «Lý do lỗi» (KSC). */
export type LoaiLyDoDgdv = 'danh_gia' | 'loi';

export const LOAI_LY_DO_DGDV = {
  DANH_GIA: 'danh_gia' as const,
  LOI: 'loi' as const,
} as const;

// ---- Danh mục -------------------------------------------------------------------

/** fp_var_mau_day — `ma_mau` HEX viết hoa #RRGGBB, không trùng. */
export interface VarMauDay {
  id: string;
  ten: string;
  ma_mau: string;
  thu_tu: number;
  dang_dung: boolean;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** fp_var_lo_thu_hoach — lô thuộc 1 chi nhánh, tổ trưởng (gõ tay) chép vào phiếu khi thêm lô. */
export interface VarLoThuHoach {
  id: string;
  ten_lo: string;
  id_chi_nhanh: string;
  ten_chi_nhanh?: string | null;
  /** Tổ trưởng mặc định — gõ tay (migration 054), không gắn tài khoản nhân viên. */
  to_truong: string | null;
  ghi_chu: string | null;
  dang_dung: boolean;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** fp_var_dgdv_nhom_loi (migration 094) — nhóm nguyên nhân lỗi (Thu hoạch / Chăm sóc vườn / Chăm sóc buồng…). */
export interface VarDgdvNhomLoi {
  id: string;
  ten: string;
  /** HEX viết hoa #RRGGBB */
  ma_mau: string;
  thu_tu: number;
  dang_dung: boolean;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** fp_var_dgdv_ly_do — `la_loi` chỉ dùng cho loai = danh_gia (nhóm Lý do huỷ luôn false). */
export interface VarDgdvLyDo {
  id: string;
  ten: string;
  loai: LoaiLyDoDgdv;
  /** nhóm nguyên nhân (migration 094); null = chưa gán */
  id_nhom_loi: string | null;
  thu_tu: number;
  /** Lý do đánh giá này là lỗi (vd «Chuột phá» = lỗi, «Căng trái» = không). */
  la_loi: boolean;
  tg_tao: string;
  tg_cap_nhat: string;
}

// ---- Phiếu chuyến ---------------------------------------------------------------

/**
 * fp_farm_dgdv — 1 phiếu = 1 CHUYẾN (ngay, chi nhánh, chuyen 1, 2, 3…), migration 057.
 * `nam` / `tuan` là tuần farm của `ngay` — DB tự tính (trigger), app không gửi.
 */
export interface FarmDgdv {
  id: string;
  /** 'YYYY-MM-DD' */
  ngay: string;
  /** Số chuyến trong ngày của chi nhánh, ≥ 1. */
  chuyen: number;
  nam: number;
  tuan: number;
  id_chi_nhanh: string;
  ten_chi_nhanh?: string | null;
  ghi_chu: string | null;
  /** Giờ cân mẫu buồng của chuyến — 'HH:mm', null = không ghi (migration 091). */
  gio_can_mau: string | null;
  /** Số buồng cân mẫu của chuyến (0 = chưa cân). */
  so_buong_can_mau: number;
  /** Tổng trọng lượng cân mẫu của chuyến (kg). */
  tong_can_nang_mau: number;
  trang_thai: TrangThaiDgdvPhieu;
  id_nguoi_tao: string | null;
  ten_nguoi_tao?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/**
 * fp_farm_dgdv_cot — cột dây của phiếu. Nguồn là tuần thu hoạch farm (`th_nam`, `th_tuan`);
 * 4 cột ngày chỉ để đọc — DB tự điền (thu hoạch = T2–CN tuần đó, chích bắp = tuần −9).
 */
export interface FarmDgdvCot {
  id: string;
  id_phieu: string;
  stt: number;
  th_nam: number;
  th_tuan: number;
  chich_bap_tu: string | null;
  chich_bap_den: string | null;
  thu_hoach_tu: string | null;
  thu_hoach_den: string | null;
  id_mau_1: string;
  /** null = dây 1 màu */
  id_mau_2: string | null;
  xe_doi: boolean;
  ghi_chu: string | null;
}

/** fp_farm_dgdv_lo — lô trong phiếu (mỗi lô 1 lần / phiếu). */
export interface FarmDgdvLo {
  id: string;
  id_phieu: string;
  id_lo: string;
  /** Tổ trưởng gõ tay; dòng tổ trưởng của lưới gom theo tên này. */
  to_truong: string | null;
  ghi_chu: string | null;
  stt: number;
}

/** fp_farm_dgdv_lo_ngay — số buồng đứt dây theo lô × ngày. */
export interface FarmDgdvLoNgay {
  id: string;
  id_phieu_lo: string;
  ngay: string;
  dut_day: number;
}

/** fp_farm_dgdv_dong — ô lưới dây × lô × ngày × dòng. */
export interface FarmDgdvDong {
  id: string;
  id_phieu_lo: string;
  id_cot: string;
  ngay: string;
  stt_dong: number;
  so_luong: number;
  /** trống = đạt */
  danh_gia: string | null;
  /** số buồng lỗi = không sơ chế (KSC) */
  so_luong_huy: number;
  ly_do_huy: string | null;
}

// ---- Phiếu đầy đủ đã ghép (cho UI) ----------------------------------------------

/** Lô của phiếu kèm tên (join danh mục) + đứt dây + ô lưới (cùng ngày của phiếu). */
export interface DgdvLoDayDu extends FarmDgdvLo {
  ten_lo: string | null;
  lo_ngay: FarmDgdvLoNgay[];
  dong: FarmDgdvDong[];
}

/** Phiếu + cột dây + lô (+ ô). */
export interface DgdvPhieuDayDu extends FarmDgdv {
  cot: FarmDgdvCot[];
  lo: DgdvLoDayDu[];
}

/** Tuần farm: `nam` là năm của Chủ nhật cuối tuần (xem core/tuan.ts). */
export interface TuanFarm {
  nam: number;
  tuan: number;
}
