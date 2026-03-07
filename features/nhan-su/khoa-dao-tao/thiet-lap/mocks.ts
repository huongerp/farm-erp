import type { ChuongKhoaHoc, BaiHoc, BaiTest, CauHoi } from './core/types';

/** Mock chương – kdt-1: 2 chương, kdt-2: 1 chương, kdt-3: 1 chương (đủ để kiểm tra mọi khóa) */
export const MOCK_CHUONG_KHOA_HOC: ChuongKhoaHoc[] = [
  { id: 'ch-1', id_khoa_hoc: 'kdt-1', ten: 'Chương 1: Giới thiệu', mo_ta: 'Nhập môn kỹ năng giao tiếp', thu_tu: 0, tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'ch-2', id_khoa_hoc: 'kdt-1', ten: 'Chương 2: Thực hành', mo_ta: 'Các tình huống thực tế', thu_tu: 1, tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'ch-3', id_khoa_hoc: 'kdt-2', ten: 'Chương 1: Giá trị cốt lõi', mo_ta: null, thu_tu: 0, tg_tao: '2025-01-10T09:00:00Z', tg_cap_nhat: '2025-01-10T09:00:00Z' },
  { id: 'ch-4', id_khoa_hoc: 'kdt-3', ten: 'Chương 1: Quy trình nội bộ', mo_ta: 'Giới thiệu quy định và quy trình công ty', thu_tu: 0, tg_tao: '2025-01-20T11:00:00Z', tg_cap_nhat: '2025-01-20T11:00:00Z' },
];

/** Mock bài học */
export const MOCK_BAI_HOC: BaiHoc[] = [
  { id: 'bh-1', id_chuong: 'ch-1', ten: 'Bài 1: Khái niệm giao tiếp', mo_ta: 'Xem video và tài liệu', thu_tu: 0, video_youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', tai_lieu_links: ['https://example.com/doc1.pdf'], tai_lieu_files: [{ ten_file: 'Slide bài 1', link: 'https://example.com/slide1.pdf' }], tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'bh-2', id_chuong: 'ch-1', ten: 'Bài 2: Nghe và phản hồi', mo_ta: null, thu_tu: 1, video_youtube_url: null, tai_lieu_links: [], tai_lieu_files: [], tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'bh-3', id_chuong: 'ch-2', ten: 'Bài 1: Role-play', mo_ta: 'Thực hành tình huống', thu_tu: 0, video_youtube_url: null, tai_lieu_links: [], tai_lieu_files: [], tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'bh-4', id_chuong: 'ch-3', ten: 'Bài 1: Giới thiệu văn hóa công ty', mo_ta: null, thu_tu: 0, video_youtube_url: null, tai_lieu_links: [], tai_lieu_files: [], tg_tao: '2025-01-10T09:00:00Z', tg_cap_nhat: '2025-01-10T09:00:00Z' },
  { id: 'bh-5', id_chuong: 'ch-4', ten: 'Bài 1: Quy định chung', mo_ta: 'Nội quy và quy định cơ bản', thu_tu: 0, video_youtube_url: null, tai_lieu_links: [], tai_lieu_files: [{ ten_file: 'Quy định nội bộ.pdf', link: 'https://example.com/quy-dinh.pdf' }], tg_tao: '2025-01-20T11:00:00Z', tg_cap_nhat: '2025-01-20T11:00:00Z' },
  { id: 'bh-6', id_chuong: 'ch-4', ten: 'Bài 2: Quy trình làm việc', mo_ta: null, thu_tu: 1, video_youtube_url: null, tai_lieu_links: [], tai_lieu_files: [], tg_tao: '2025-01-20T11:00:00Z', tg_cap_nhat: '2025-01-20T11:00:00Z' },
];

/** Mock bài test (1 per chương) */
export const MOCK_BAI_TEST: BaiTest[] = [
  { id: 'bt-1', id_chuong: 'ch-1', ten: 'Bài test Chương 1', mo_ta: 'Trả lời các câu hỏi sau', thu_tu: 0, tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'bt-2', id_chuong: 'ch-2', ten: 'Bài test Chương 2', mo_ta: null, thu_tu: 0, tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'bt-3', id_chuong: 'ch-3', ten: 'Bài test Văn hóa', mo_ta: 'Kiểm tra cuối chương', thu_tu: 0, tg_tao: '2025-01-10T09:00:00Z', tg_cap_nhat: '2025-01-10T09:00:00Z' },
  { id: 'bt-4', id_chuong: 'ch-4', ten: 'Bài test Quy định nội bộ', mo_ta: 'Trắc nghiệm cuối chương', thu_tu: 0, tg_tao: '2025-01-20T11:00:00Z', tg_cap_nhat: '2025-01-20T11:00:00Z' },
];

/** Mock câu hỏi */
export const MOCK_CAU_HOI: CauHoi[] = [
  { id: 'cq-1', id_bai_test: 'bt-1', noi_dung: 'Giao tiếp hiệu quả bao gồm những yếu tố nào?', loai: 'trac_nghiem', thu_tu: 0, dap_an_options: [{ label: 'Nghe và phản hồi', dung: true }, { label: 'Chỉ nói', dung: false }], tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'cq-2', id_bai_test: 'bt-1', noi_dung: 'Anh/chị hãy nêu một tình huống giao tiếp khó trong công việc.', loai: 'tu_luan', thu_tu: 1, goi_y_cham: 'Chấm theo mức độ cụ thể và cách xử lý', tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'cq-3', id_bai_test: 'bt-3', noi_dung: 'Giá trị cốt lõi của công ty là gì?', loai: 'trac_nghiem', thu_tu: 0, dap_an_options: [{ label: 'Trung thực, Sáng tạo', dung: true }, { label: 'Chỉ lợi nhuận', dung: false }], tg_tao: '2025-01-10T09:00:00Z', tg_cap_nhat: '2025-01-10T09:00:00Z' },
  { id: 'cq-4', id_bai_test: 'bt-4', noi_dung: 'Nhân viên cần tuân thủ nội quy khi nào?', loai: 'trac_nghiem', thu_tu: 0, dap_an_options: [{ label: 'Luôn luôn trong giờ làm việc', dung: true }, { label: 'Chỉ khi có giám sát', dung: false }], tg_tao: '2025-01-20T11:00:00Z', tg_cap_nhat: '2025-01-20T11:00:00Z' },
  { id: 'cq-5', id_bai_test: 'bt-4', noi_dung: 'Quy trình xin nghỉ phép đúng là?', loai: 'trac_nghiem', thu_tu: 1, dap_an_options: [{ label: 'Đăng ký trước và được duyệt', dung: true }, { label: 'Tự nghỉ rồi báo sau', dung: false }], tg_tao: '2025-01-20T11:00:00Z', tg_cap_nhat: '2025-01-20T11:00:00Z' },
];
