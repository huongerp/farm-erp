/**
 * Kiểu dùng chung cho lớp lõi của worker thông báo.
 *
 * Lớp này CỐ TÌNH không biết gì về Postgres hay web-push: nó nhận một dòng
 * outbox và trả về "cần gửi gì cho ai", nhờ vậy test được bằng vitest mà không
 * cần database.
 */

export type MucThongBao = 'cao' | 'thuong';

/**
 * Vai người nhận. Lớp định tuyến dịch vai sang danh sách id nhân viên cụ thể,
 * nên luật nghiệp vụ chỉ cần nói "gửi cho người tạo" mà không quan tâm bảng này
 * gọi cột người tạo là `nguoi_tao_id` hay `id_nguoi_de_xuat`.
 */
export type VaiNguoiNhan =
  | 'nguoi_tao'
  | 'nhom_duyet'
  | 'nguoi_duyet'
  | 'trach_nhiem'
  | 'ho_tro'
  | 'ho_tro_moi'
  | 'nguoi_giao'
  | 'nguoi_yeu_cau_mo';

/** Một dòng trong fp_var_su_kien_thong_bao. */
export interface DongOutbox {
  id: number;
  module_id: string;
  bang: string;
  ban_ghi_id: number;
  thao_tac: 'INSERT' | 'UPDATE';
  trang_thai_cu: string | null;
  trang_thai_moi: string | null;
  actor_id: number | null;
  payload: Record<string, unknown>;
  payload_cu: Record<string, unknown> | null;
}

/**
 * Một sự kiện nghiệp vụ đã nhận diện được từ dòng outbox. Một dòng outbox có thể
 * sinh nhiều sự kiện (ví dụ vừa đổi trạng thái vừa thêm người hỗ trợ).
 */
export interface SuKienDaPhanTich {
  loai: string;
  muc: MucThongBao;
  vai: VaiNguoiNhan[];
  /** Dữ liệu phụ cho lớp render và cho cột du_lieu, ví dụ id người hỗ trợ mới. */
  duLieu: Record<string, unknown>;
}

/** Thông báo đã sẵn sàng ghi xuống fp_var_thong_bao. */
export interface ThongBaoCanGui {
  nguoiNhanId: number;
  moduleId: string;
  loaiSuKien: string;
  muc: MucThongBao;
  tieuDe: string;
  noiDung: string | null;
  link: string | null;
  bang: string;
  banGhiId: number;
  suKienId: number;
  duLieu: Record<string, unknown>;
  /** true khi người nhận là cấp bậc 1 và không nằm trong vai đích thực sự của sự kiện. */
  imLang: boolean;
}
