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

/** fp_var_lo_thu_hoach — lô thuộc 1 chi nhánh, tổ trưởng mặc định chép vào phiếu khi thêm lô. */
export interface VarLoThuHoach {
  id: string;
  ten_lo: string;
  id_chi_nhanh: string;
  ten_chi_nhanh?: string | null;
  id_to_truong: string | null;
  ten_to_truong?: string | null;
  ghi_chu: string | null;
  dang_dung: boolean;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** fp_var_dgdv_ly_do */
export interface VarDgdvLyDo {
  id: string;
  ten: string;
  loai: LoaiLyDoDgdv;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}

// ---- Phiếu tuần -----------------------------------------------------------------

/** fp_farm_dgdv — 1 phiếu / tuần ISO (nam, tuan) / chi nhánh. `nam` là năm ISO của tuần. */
export interface FarmDgdv {
  id: string;
  nam: number;
  tuan: number;
  id_chi_nhanh: string;
  ten_chi_nhanh?: string | null;
  ghi_chu: string | null;
  trang_thai: TrangThaiDgdvPhieu;
  id_nguoi_tao: string | null;
  ten_nguoi_tao?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** fp_farm_dgdv_cot — cột dây của phiếu; ngày dạng 'YYYY-MM-DD'. */
export interface FarmDgdvCot {
  id: string;
  id_phieu: string;
  stt: number;
  chich_bap_tu: string | null;
  chich_bap_den: string | null;
  thu_hoach_tu: string | null;
  thu_hoach_den: string | null;
  id_mau_1: string;
  /** null = dây 1 màu */
  id_mau_2: string | null;
  xe_doi: boolean;
}

/** fp_farm_dgdv_lo — lô trong phiếu (mỗi lô 1 lần / phiếu). */
export interface FarmDgdvLo {
  id: string;
  id_phieu: string;
  id_lo: string;
  id_to_truong: string | null;
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
  so_luong_loi: number;
  ly_do_loi: string | null;
}

// ---- Phiếu đầy đủ đã ghép (cho UI) ----------------------------------------------

/** Lô của phiếu kèm tên (join danh mục) + đứt dây + ô lưới của mọi ngày trong tuần. */
export interface DgdvLoDayDu extends FarmDgdvLo {
  ten_lo: string | null;
  ten_to_truong: string | null;
  lo_ngay: FarmDgdvLoNgay[];
  dong: FarmDgdvDong[];
}

/** Phiếu + cột dây + lô (+ ô). */
export interface DgdvPhieuDayDu extends FarmDgdv {
  cot: FarmDgdvCot[];
  lo: DgdvLoDayDu[];
}

/** Tuần ISO: `nam` là năm ISO (có thể khác năm dương lịch ở đầu/cuối năm). */
export interface TuanIso {
  nam: number;
  tuan: number;
}
