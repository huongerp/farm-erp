/** File tài liệu đính kèm bài học */
export interface TaiLieuFile {
  id?: string;
  ten_file: string;
  link?: string;
}

/** Chương trong khóa học */
export interface ChuongKhoaHoc {
  id: string;
  id_khoa_hoc: string;
  ten: string;
  mo_ta?: string | null;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Bài học thuộc chương */
export interface BaiHoc {
  id: string;
  id_chuong: string;
  ten: string;
  mo_ta?: string | null;
  thu_tu: number;
  video_youtube_url?: string | null;
  tai_lieu_links?: string[];
  tai_lieu_files?: TaiLieuFile[];
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Bài test cuối chương */
export interface BaiTest {
  id: string;
  id_chuong: string;
  ten: string;
  mo_ta?: string | null;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Đáp án trắc nghiệm */
export interface DapAnOption {
  label: string;
  dung?: boolean;
}

/** Câu hỏi trong bài test */
export interface CauHoi {
  id: string;
  id_bai_test: string;
  noi_dung: string;
  loai: 'trac_nghiem' | 'tu_luan';
  thu_tu: number;
  dap_an_options?: DapAnOption[];
  /** Gợi ý chấm (tự luận) */
  goi_y_cham?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}
