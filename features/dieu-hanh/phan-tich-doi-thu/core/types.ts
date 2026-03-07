import type { LoaiDoiThu } from './constants';

/** Đối thủ */
export interface DoiThu {
  id: string;
  ten_doi_thu: string;
  logo?: string | null;
  phan_loai: LoaiDoiThu;
  diem_manh_nhat?: string | null;
  website?: string | null;
  fanpage?: string | null;
  ngay_cap_nhat: string;
  ghi_chu_nhan_dang?: string | null;
  ten_cong_ty?: string | null;
  mst?: string | null;
  dia_chi?: string | null;
  hotline?: string | null;
  youtube?: string | null;
  facebook?: string | null;
  /** Quy mô (VD: SME, doanh nghiệp vừa, tập đoàn) */
  quy_mo?: string | null;
  /** Năm thành lập */
  nam_thanh_lap?: number | null;
  /** Điểm mạnh (nhiều mục) */
  diem_manh?: string[] | null;
  /** Điểm yếu (nhiều mục) */
  diem_yeu?: string[] | null;
  /** Phân khúc thị trường */
  phan_khuc?: string | null;
  /** Sản phẩm / dịch vụ chính */
  san_pham?: string | null;
  /** Lĩnh vực kinh doanh */
  linh_vuc_kinh_doanh?: string | null;
  /** Thị trường mục tiêu */
  thi_truong_muc_tieu?: string | null;
  /** Số nhân viên (ước tính hoặc khoảng) */
  so_nhan_vien?: string | null;
  /** Vốn điều lệ */
  von_dieu_le?: string | null;
  /** Thị phần (%) */
  thi_phan?: string | null;
  /** Nguồn gốc (nước) */
  nguon_goc?: string | null;
  /** Năm hoạt động (từ 19xx) */
  nam_hoat_dong?: string | null;
  /** Định vị */
  dinh_vi?: string | null;
  /** Cách thức hoạt động / kênh bán */
  cach_thuc_hoat_dong?: string | null;
  /** Kênh phân phối */
  kenh_phan_phoi?: string | null;
  /** Chiến lược giá */
  chien_luoc_gia?: string | null;
  /** Marketing & truyền thông */
  marketing_truyen_thong?: string | null;
  /** Thế mạnh */
  the_manh?: string | null;
  /** TikTok */
  tiktok?: string | null;
  /** Link khác (nhiều) */
  link_khac?: string | null;
  /** Ghi chú khác */
  ghi_chu_khac?: string | null;
  tg_tao: string;
}

/** Tài liệu đính kèm đối thủ */
export interface DoiThuTaiLieu {
  id: string;
  doi_thu_id: string;
  ten_file: string;
  duong_dan_file?: string | null;
  loai: 'bao_gia' | 'anh_nang_luc' | 'anh_quang_cao' | 'link_bai_bao';
  tg_tao: string;
}

/** Một dòng so sánh battlecard */
export interface BattlecardDong {
  id: string;
  tinh_nang_dich_vu: string;
  giai_phap_minh: string;
  giai_phap_doi_thu: string;
}

/** Một kịch bản xử lý (sales script) */
export interface KichBanXuLyItem {
  id: string;
  noi_dung: string;
}

/** Battlecard: so sánh + điểm yếu + danh sách kịch bản */
export interface DoiThuBattlecard {
  doi_thu_id: string;
  so_sanh: BattlecardDong[];
  diem_yeu_chi_mang: string[];
  /** Danh sách kịch bản xử lý (nhiều kịch bản) */
  kich_ban_xu_ly: KichBanXuLyItem[];
}

/** Nhật ký biến động */
export interface DoiThuNhatKy {
  id: string;
  doi_thu_id: string;
  noi_dung: string;
  nguoi_tao: string;
  /** Ngày ghi nhận (YYYY-MM-DD) */
  ngay: string;
  tg_tao: string;
}
