import type { TrangThaiUngVien, KenhTuyenDung, MauPhanHoi } from '@/features/nhan-su/thiet-lap-tuyen-dung/core/types';
import type { LoaiKhoaHoc } from '@/features/nhan-su/thiet-lap-dao-tao/core/types';
import type { DeXuatTuyenDung } from '@/features/nhan-su/de-xuat-tuyen-dung/core/types';
import type { UngVien } from '@/features/nhan-su/ung-vien/core/types';
import type { LichPhongVan } from '@/features/nhan-su/lich-phong-van/core/types';
import type { ThuGuiUngVien } from '@/features/nhan-su/thu-gui-ung-vien/core/types';
import type { HopDong, PhieuThanhLy } from '@/features/nhan-su/hop-dong/core/types';
import type { KhoaDaoTao } from '@/features/nhan-su/khoa-dao-tao/core/types';

/** Trạng thái ứng viên (Thiết lập tuyển dụng) */
export const MOCK_TRANG_THAI_UNG_VIEN: TrangThaiUngVien[] = [
  { id: 'ttuv-1', ma: 'MOI', ten: 'Mới', thu_tu: 1, ghi_chu: 'Ứng viên mới nộp hồ sơ', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttuv-2', ma: 'DANG_XEM', ten: 'Đang xem xét', thu_tu: 2, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttuv-3', ma: 'MOI_PV', ten: 'Mời phỏng vấn', thu_tu: 3, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttuv-4', ma: 'DA_PV', ten: 'Đã phỏng vấn', thu_tu: 4, ghi_chu: 'Chờ quyết định', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttuv-5', ma: 'TU_CHOI', ten: 'Từ chối', thu_tu: 5, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttuv-6', ma: 'NHAN_VIEC', ten: 'Nhận việc', thu_tu: 6, loai_ket_qua: 'onboard', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttuv-7', ma: 'NGHI_VIEC', ten: 'Nghỉ việc', thu_tu: 7, loai_ket_qua: 'nghi', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Kênh tuyển dụng (Thiết lập tuyển dụng) */
export const MOCK_KENH_TUYEN_DUNG: KenhTuyenDung[] = [
  { id: 'ktd-1', ma: 'WEBSITE', ten: 'Website công ty', thu_tu: 1, ghi_chu: 'Tin đăng trên site', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ktd-2', ma: 'LINKEDIN', ten: 'LinkedIn', thu_tu: 2, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ktd-3', ma: 'REFERRAL', ten: 'Giới thiệu nội bộ', thu_tu: 3, ghi_chu: 'Nhân viên giới thiệu', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ktd-4', ma: 'JOB_FAIR', ten: 'Hội chợ việc làm', thu_tu: 4, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ktd-5', ma: 'VIEC_LAM_24H', ten: 'Vieclam24h / Job board', thu_tu: 5, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Loại khóa học (Thiết lập đào tạo) */
export const MOCK_LOAI_KHOA_HOC: LoaiKhoaHoc[] = [
  { id: 'lkh-1', ma: 'KY_NANG', ten: 'Kỹ năng', thu_tu: 1, ghi_chu: 'Đào tạo kỹ năng chuyên môn, kỹ năng mềm', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'lkh-2', ma: 'VAN_HOA', ten: 'Văn hóa', thu_tu: 2, ghi_chu: 'Văn hóa doanh nghiệp, giá trị cốt lõi', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'lkh-3', ma: 'QUY_TRINH_QUY_DINH', ten: 'Quy trình / Quy định', thu_tu: 3, ghi_chu: 'Quy trình nội bộ, quy định công ty', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Khóa đào tạo – id_loai_khoa_hoc trùng lkh-1, lkh-2, lkh-3; trang_thai: 0–5 (Dự kiến, Mở đăng ký, Đã đóng, Đang diễn ra, Hoàn thành, Hủy). Trạng thái 1 = Mở đăng ký (hiển thị trong tab Đăng ký mới). */
export const MOCK_KHOA_DAO_TAO: Omit<KhoaDaoTao, 'ten_loai_khoa_hoc'>[] = [
  { id: 'kdt-1', ma: 'KDT-001', ten: 'Kỹ năng giao tiếp', id_loai_khoa_hoc: 'lkh-1', mo_ta: 'Đào tạo kỹ năng giao tiếp hiệu quả', thoi_luong: 8, ngay_bat_dau: '2025-03-01', ngay_ket_thuc: '2025-03-02', dia_diem: 'Hội trường A', link_online: null, trang_thai: 1, so_luong_toi_da: 30, giang_vien: 'Nguyễn Văn A', ghi_chu: null, tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'kdt-2', ma: 'KDT-002', ten: 'Văn hóa doanh nghiệp', id_loai_khoa_hoc: 'lkh-2', mo_ta: 'Giới thiệu giá trị cốt lõi', thoi_luong: 4, ngay_bat_dau: '2025-02-20', ngay_ket_thuc: '2025-02-20', dia_diem: null, link_online: 'https://meet.example.com/van-hoa', trang_thai: 1, so_luong_toi_da: 50, giang_vien: 'Trần Thị B', ghi_chu: null, tg_tao: '2025-01-10T09:00:00Z', tg_cap_nhat: '2025-02-18T10:00:00Z' },
  { id: 'kdt-3', ma: 'KDT-003', ten: 'Quy định nội bộ', id_loai_khoa_hoc: 'lkh-3', mo_ta: 'Quy trình và quy định công ty', thoi_luong: 6, ngay_bat_dau: '2025-04-01', ngay_ket_thuc: '2025-04-02', dia_diem: 'Phòng đào tạo', link_online: null, trang_thai: 1, so_luong_toi_da: 25, giang_vien: null, ghi_chu: 'Mở đăng ký', tg_tao: '2025-01-20T11:00:00Z', tg_cap_nhat: '2025-01-20T11:00:00Z' },
  { id: 'kdt-4', ma: 'KDT-004', ten: 'Excel nâng cao', id_loai_khoa_hoc: 'lkh-1', mo_ta: 'Công thức, Pivot, VBA cơ bản', thoi_luong: 16, ngay_bat_dau: '2025-01-15', ngay_ket_thuc: '2025-01-18', dia_diem: 'Phòng IT', link_online: null, trang_thai: 4, so_luong_toi_da: 20, giang_vien: 'Lê Văn C', ghi_chu: null, tg_tao: '2024-12-01T08:00:00Z', tg_cap_nhat: '2025-01-19T08:00:00Z' },
  { id: 'kdt-5', ma: 'KDT-005', ten: 'Định hướng giá trị', id_loai_khoa_hoc: 'lkh-2', mo_ta: null, thoi_luong: 2, ngay_bat_dau: '2025-05-10', ngay_ket_thuc: '2025-05-10', dia_diem: null, link_online: null, trang_thai: 2, so_luong_toi_da: 40, giang_vien: 'Phạm Thị D', ghi_chu: null, tg_tao: '2025-02-01T08:00:00Z', tg_cap_nhat: '2025-02-01T08:00:00Z' },
];

/** Mẫu "Thư từ chối" đầy đủ, chuyên nghiệp */
const MAU_THU_TU_CHOI_HTML = `<p style="text-align: right"><strong><<[ten_cong_ty]>></strong></p>
<p style="text-align: right">Ngày <<[ngay_hien_tai]>></p>
<p>Kính gửi anh/chị <strong><<[ten_ung_vien]>></strong>,</p>
<p>Trước hết, <strong><<[ten_cong_ty]>></strong> chân thành cảm ơn anh/chị đã dành thời gian quan tâm và gửi hồ sơ ứng tuyển vị trí <strong><<[vi_tri_ung_tuyen]>></strong> tại công ty chúng tôi.</p>
<p>Sau quá trình xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng trong giai đoạn này chúng tôi đã lựa chọn được ứng viên phù hợp hơn với yêu cầu của vị trí. Quyết định này không phản ánh năng lực hay giá trị của anh/chị, mà chỉ phụ thuộc vào nhu cầu cụ thể của công ty tại thời điểm hiện tại.</p>
<p>Chúng tôi ghi nhận sự quan tâm của anh/chị và mong rằng trong tương lai sẽ có cơ hội hợp tác. Chúc anh/chị sớm tìm được công việc phù hợp và thành công trên con đường sự nghiệp.</p>
<p>Mọi thắc mắc xin vui lòng liên hệ: <strong><<[email_lien_he]>></strong> hoặc <strong><<[so_dien_thoai_lien_he]>></strong>.</p>
<p>Trân trọng,<br><strong>Phòng Nhân sự<br><<[ten_cong_ty]>></strong></p>`;

/** Mẫu "Thư mời phỏng vấn" đầy đủ, chuyên nghiệp */
const MAU_THU_MOI_PHONG_VAN_HTML = `<p style="text-align: right"><strong><<[ten_cong_ty]>></strong></p>
<p style="text-align: right">Ngày <<[ngay_hien_tai]>></p>
<p>Kính gửi anh/chị <strong><<[ten_ung_vien]>></strong>,</p>
<p>Cảm ơn anh/chị đã quan tâm và nộp hồ sơ ứng tuyển vị trí <strong><<[vi_tri_ung_tuyen]>></strong> tại <strong><<[ten_cong_ty]>></strong>. Sau khi xem xét hồ sơ, chúng tôi trân trọng mời anh/chị tham gia buổi phỏng vấn với thông tin cụ thể như sau:</p>
<h3>Thông tin buổi phỏng vấn</h3>
<table>
  <thead>
    <tr><th>Nội dung</th><th>Chi tiết</th></tr>
  </thead>
  <tbody>
    <tr><td>Thời gian</td><td><<[ngay_phong_van]>> — <<[gio_phong_van]>></td></tr>
    <tr><td>Địa điểm</td><td><<[dia_diem_phong_van]>></td></tr>
    <tr><td>Hình thức</td><td>Phỏng vấn trực tiếp (vui lòng có mặt trước 10–15 phút)</td></tr>
    <tr><td>Liên hệ</td><td><<[so_dien_thoai_lien_he]>> / <<[email_lien_he]>></td></tr>
  </tbody>
</table>
<h3>Hồ sơ / tài liệu cần mang theo</h3>
<ul>
  <li>CMND/CCCD (bản chính hoặc bản sao công chứng).</li>
  <li>Bằng cấp, chứng chỉ liên quan đến vị trí ứng tuyển.</li>
  <li>Sơ yếu lý lịch (bản in) nếu có cập nhật so với hồ sơ đã gửi.</li>
</ul>
<p>Nếu anh/chị có trở ngại về lịch hẹn trên, vui lòng phản hồi sớm qua <strong><<[email_lien_he]>></strong> để chúng tôi sắp xếp lại. Chúng tôi mong được gặp anh/chị.</p>
<p>Trân trọng,<br><strong>Phòng Nhân sự<br><<[ten_cong_ty]>></strong></p>`;

/** Mẫu "Thư mời nhận việc" đầy đủ: có bảng, danh sách, biến <<[key]>> */
const MAU_THU_MOI_NHAN_VIEC_HTML = `<p style="text-align: right"><strong><<[ten_cong_ty]>></strong></p>
<p style="text-align: right">Ngày <<[ngay_hien_tai]>></p>
<p>Kính gửi anh/chị <strong><<[ten_ung_vien]>></strong>,</p>
<p>Công ty <strong><<[ten_cong_ty]>></strong> trân trọng thông báo anh/chị đã trúng tuyển vị trí <strong><<[vi_tri_ung_tuyen]>></strong>. Chúng tôi gửi kèm các thông tin cần thiết để anh/chị chuẩn bị và hoàn tất thủ tục nhận việc.</p>
<h3>1. Thời gian &amp; địa điểm làm việc</h3>
<table>
  <thead>
    <tr><th>Nội dung</th><th>Chi tiết</th></tr>
  </thead>
  <tbody>
    <tr><td>Ngày nhận việc</td><td><<[ngay_nhan_viec]>></td></tr>
    <tr><td>Địa điểm</td><td>Trụ sở công ty (địa chỉ chi tiết sẽ gửi qua email)</td></tr>
    <tr><td>Liên hệ</td><td><<[so_dien_thoai_lien_he]>> — <<[email_lien_he]>></td></tr>
  </tbody>
</table>
<h3>2. Chế độ lương &amp; phúc lợi</h3>
<table>
  <thead>
    <tr><th>Nội dung</th><th>Chi tiết</th></tr>
  </thead>
  <tbody>
    <tr><td>Bậc lương</td><td><<[bac_luong]>></td></tr>
    <tr><td>Mức lương</td><td><<[muc_luong]>></td></tr>
    <tr><td>Cơ chế khác</td><td><<[co_che_khac]>></td></tr>
    <tr><td>Ghi chú khác</td><td><<[ghi_chu_khac]>></td></tr>
  </tbody>
</table>
<h3>3. Hồ sơ cần mang theo khi nhận việc</h3>
<ul>
  <li>CMND/CCCD, sổ hộ khẩu (bản sao công chứng).</li>
  <li>Ảnh 3x4, giấy khám sức khỏe (trong vòng 6 tháng).</li>
  <li>Bằng cấp, chứng chỉ liên quan đến vị trí ứng tuyển.</li>
</ul>
<p>Mọi thắc mắc anh/chị vui lòng liên hệ <strong><<[email_lien_he]>></strong>. Chúc anh/chị nhiều sức khỏe và thành công trong công việc sắp tới.</p>
<p>Trân trọng,<br><strong>Phòng Nhân sự<br><<[ten_cong_ty]>></strong></p>`;

/** Đề xuất tuyển dụng (gắn chức vụ, nhiều trạng thái) */
export const MOCK_DE_XUAT_TUYEN_DUNG: Omit<DeXuatTuyenDung, 'ten_chuc_vu' | 'ten_phong_ban'>[] = [
  { id: 'dx-1', id_chuc_vu: 'pos-14', ma_de_xuat: 'DX-2025-001', tieu_de: 'Tuyển Lập trình viên Senior', mo_ta: 'Tham gia phát triển sản phẩm core, review code, hướng dẫn junior.', yeu_cau: '3+ năm kinh nghiệm, thành thạo React/Node, có kinh nghiệm làm việc nhóm.', link_tuyen: 'https://careers.example.com/senior-dev', so_luong: 2, so_luong_da_tuyen: 0, han_nop: '2025-03-15', trang_thai: 1, ghi_chu: null, tg_tao: '2025-01-10T08:00:00Z', tg_cap_nhat: '2025-01-12T14:00:00Z' },
  { id: 'dx-2', id_chuc_vu: 'pos-22', ma_de_xuat: 'DX-2025-002', tieu_de: 'Tuyển Chuyên viên Tuyển dụng', mo_ta: 'Phụ trách tuyển dụng cho các vị trí kỹ thuật và hành chính.', yeu_cau: 'Có kinh nghiệm tuyển dụng, kỹ năng phỏng vấn, sử dụng ATS.', link_tuyen: 'https://careers.example.com/recruiter', so_luong: 1, so_luong_da_tuyen: 1, han_nop: '2025-02-28', trang_thai: 2, ghi_chu: null, tg_tao: '2025-01-05T09:00:00Z', tg_cap_nhat: '2025-01-18T10:00:00Z' },
  { id: 'dx-3', id_chuc_vu: 'pos-12', ma_de_xuat: 'DX-2025-003', tieu_de: null, mo_ta: 'Lead team phát triển phần mềm, quản lý backlog, đảm bảo chất lượng.', yeu_cau: '5+ năm dev, 2+ năm lead, có kinh nghiệm Agile/Scrum.', link_tuyen: 'https://careers.example.com/tech-lead', so_luong: 1, so_luong_da_tuyen: 0, han_nop: null, trang_thai: 0, ghi_chu: null, tg_tao: '2025-01-20T11:00:00Z', tg_cap_nhat: '2025-01-20T11:00:00Z' },
  { id: 'dx-4', id_chuc_vu: 'pos-80', ma_de_xuat: 'DX-2025-004', tieu_de: 'Tuyển Lập trình viên Frontend', mo_ta: 'Phát triển giao diện người dùng, tối ưu trải nghiệm.', yeu_cau: '2+ năm React/TypeScript, hiểu biết về UX.', link_tuyen: 'https://careers.example.com/frontend', so_luong: 3, so_luong_da_tuyen: 2, han_nop: '2025-03-01', trang_thai: 3, ghi_chu: null, tg_tao: '2024-12-01T08:00:00Z', tg_cap_nhat: '2025-01-05T16:00:00Z' },
  { id: 'dx-5', id_chuc_vu: 'pos-43', ma_de_xuat: 'DX-2025-005', tieu_de: 'Tuyển Nhân viên Kinh doanh B2B', mo_ta: 'Chăm sóc khách hàng doanh nghiệp, mở rộng thị trường.', yeu_cau: 'Kỹ năng giao tiếp, đàm phán, có kinh nghiệm B2B là lợi thế.', link_tuyen: 'https://careers.example.com/sales-b2b', so_luong: 2, so_luong_da_tuyen: 0, han_nop: '2025-02-15', trang_thai: 1, ghi_chu: null, tg_tao: '2025-01-15T09:30:00Z', tg_cap_nhat: '2025-01-15T09:30:00Z' },
];

/** Mẫu phản hồi / Thư mặc định (Thiết lập tuyển dụng) */
export const MOCK_MAU_PHAN_HOI: MauPhanHoi[] = [
  { id: 'mph-1', ma: 'TU_CHOI', ten_loai: 'Từ chối', tieu_de: 'Thông báo kết quả ứng tuyển – <<[ten_cong_ty]>>', noi_dung_mau: MAU_THU_TU_CHOI_HTML, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-15T10:30:00Z' },
  { id: 'mph-2', ma: 'MOI_PV', ten_loai: 'Mời phỏng vấn', tieu_de: 'Thư mời tham gia phỏng vấn – <<[ten_cong_ty]>>', noi_dung_mau: MAU_THU_MOI_PHONG_VAN_HTML, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-15T10:30:00Z' },
  { id: 'mph-3', ma: 'MOI_NHAN_VIEC', ten_loai: 'Thư mời nhận việc', tieu_de: 'Thư mời nhận việc – <<[ten_cong_ty]>>', noi_dung_mau: MAU_THU_MOI_NHAN_VIEC_HTML, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-15T10:30:00Z' },
];

/** Ứng viên (Hồ sơ ứng viên) – id_de_xuat_tuyen_dung, id_trang_thai_ung_vien, id_kenh_tuyen_dung trùng mock trên */
export const MOCK_UNG_VIEN: Omit<UngVien, 'ma_de_xuat' | 'ten_chuc_vu' | 'ten_trang_thai' | 'ten_kenh_tuyen_dung'>[] = [
  {
    id: 'uv-1',
    ho_ten: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    so_dien_thoai: '0901234567',
    dia_chi: 'Q.1, TP.HCM',
    ngay_sinh: '1995-05-15',
    ghi_chu_noi_bo: 'Ưu tiên gọi lại sau Tết.',
    id_de_xuat_tuyen_dung: 'dx-1',
    id_trang_thai_ung_vien: 'ttuv-3',
    id_kenh_tuyen_dung: 'ktd-1',
    ngay_phong_van_gan_nhat: '2025-02-10T09:00:00Z',
    ket_qua_phan_hoi_gan_nhat: 'Đạt, chờ vòng 2',
    tai_lieu: [
      { id: 'tl-1', ten_file: 'CV_Nguyen_Van_A.pdf', loai: 'CV', link: '#' },
      { id: 'tl-2', ten_file: 'Bang_dai_hoc.pdf', loai: 'Bằng cấp', link: '#' },
    ],
    tg_tao: '2025-01-15T10:00:00Z',
    tg_cap_nhat: '2025-02-10T14:00:00Z',
  },
  {
    id: 'uv-2',
    ho_ten: 'Trần Thị B',
    email: 'tranthib@email.com',
    so_dien_thoai: '0912345678',
    dia_chi: null,
    ngay_sinh: null,
    ghi_chu_noi_bo: null,
    id_de_xuat_tuyen_dung: 'dx-2',
    id_trang_thai_ung_vien: 'ttuv-6',
    id_kenh_tuyen_dung: 'ktd-3',
    ngay_phong_van_gan_nhat: '2025-01-25T14:00:00Z',
    ket_qua_phan_hoi_gan_nhat: 'Trúng tuyển, đã gửi thư mời nhận việc',
    tai_lieu: [{ id: 'tl-3', ten_file: 'CV_Tran_Thi_B.pdf', loai: 'CV', link: '#' }],
    tg_tao: '2025-01-08T08:30:00Z',
    tg_cap_nhat: '2025-01-28T09:00:00Z',
  },
  {
    id: 'uv-3',
    ho_ten: 'Lê Văn C',
    email: 'levanc@email.com',
    so_dien_thoai: '0987654321',
    dia_chi: 'Q.7, TP.HCM',
    ngay_sinh: '1992-08-20',
    ghi_chu_noi_bo: null,
    id_de_xuat_tuyen_dung: 'dx-1',
    id_trang_thai_ung_vien: 'ttuv-1',
    id_kenh_tuyen_dung: 'ktd-5',
    ngay_phong_van_gan_nhat: null,
    ket_qua_phan_hoi_gan_nhat: null,
    tai_lieu: [],
    tg_tao: '2025-02-01T11:00:00Z',
    tg_cap_nhat: '2025-02-01T11:00:00Z',
  },
  {
    id: 'uv-4',
    ho_ten: 'Phạm Thị D',
    email: 'phamthid@email.com',
    so_dien_thoai: '0777123456',
    dia_chi: null,
    ngay_sinh: null,
    ghi_chu_noi_bo: 'Đã từ chối lương thấp hơn kỳ vọng.',
    id_de_xuat_tuyen_dung: 'dx-4',
    id_trang_thai_ung_vien: 'ttuv-5',
    id_kenh_tuyen_dung: 'ktd-2',
    ngay_phong_van_gan_nhat: '2025-01-18T10:00:00Z',
    ket_qua_phan_hoi_gan_nhat: 'Từ chối',
    tai_lieu: [{ id: 'tl-4', ten_file: 'CV_Pham_Thi_D.pdf', loai: 'CV', link: '#' }],
    tg_tao: '2024-12-20T09:00:00Z',
    tg_cap_nhat: '2025-01-20T16:00:00Z',
  },
];

/** Ngày theo offset so với hôm nay (YYYY-MM-DD) – dùng cho mock dễ test */
function todayPlus(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lịch phỏng vấn – id_ung_vien trỏ tới MOCK_UNG_VIEN; trang_thai: 0 Chờ, 1 Đã diễn ra, 2 Hoãn, 3 Hủy. Ngày theo hôm nay để dễ test. */
export const MOCK_LICH_PHONG_VAN: Omit<LichPhongVan, 'ten_ung_vien' | 'ma_de_xuat'>[] = [
  {
    id: 'lpv-1',
    id_ung_vien: 'uv-1',
    so_vong: 1,
    ngay: todayPlus(-2),
    gio: '09:00',
    hinh_thuc: 'offline',
    dia_diem: 'Phòng họp A, Tầng 2',
    trang_thai: 1,
    trang_thai_danh_gia: 1,
    danh_gia_diem_so: '8/10',
    danh_gia_nhan_xet: 'Ứng viên có kinh nghiệm tốt, giao tiếp rõ ràng.',
    ket_qua: 'Đạt',
    ghi_chu: null,
    tg_tao: '2025-02-01T10:00:00Z',
    tg_cap_nhat: '2025-02-10T15:00:00Z',
  },
  {
    id: 'lpv-2',
    id_ung_vien: 'uv-1',
    so_vong: 2,
    ngay: todayPlus(5),
    gio: '14:00',
    hinh_thuc: 'online',
    dia_diem: 'Google Meet (link gửi email)',
    trang_thai: 0,
    trang_thai_danh_gia: 0,
    danh_gia_diem_so: null,
    danh_gia_nhan_xet: null,
    ket_qua: null,
    ghi_chu: null,
    tg_tao: '2025-02-10T16:00:00Z',
    tg_cap_nhat: '2025-02-10T16:00:00Z',
  },
  {
    id: 'lpv-3',
    id_ung_vien: 'uv-2',
    so_vong: 1,
    ngay: todayPlus(3),
    gio: '14:00',
    hinh_thuc: 'offline',
    dia_diem: 'Phòng HR, Tầng 1',
    trang_thai: 1,
    trang_thai_danh_gia: 1,
    danh_gia_diem_so: '9/10',
    danh_gia_nhan_xet: 'Rất phù hợp vị trí.',
    ket_qua: 'Đạt',
    ghi_chu: null,
    tg_tao: '2025-01-20T08:00:00Z',
    tg_cap_nhat: '2025-01-25T17:00:00Z',
  },
  {
    id: 'lpv-4',
    id_ung_vien: 'uv-3',
    so_vong: 1,
    ngay: todayPlus(10),
    gio: '10:00',
    hinh_thuc: 'online',
    dia_diem: 'Zoom',
    trang_thai: 2,
    trang_thai_danh_gia: 0,
    danh_gia_diem_so: null,
    danh_gia_nhan_xet: null,
    ket_qua: null,
    ghi_chu: 'Ứng viên xin dời lịch.',
    tg_tao: '2025-02-05T09:00:00Z',
    tg_cap_nhat: '2025-02-12T11:00:00Z',
  },
  {
    id: 'lpv-5',
    id_ung_vien: 'uv-4',
    so_vong: 1,
    ngay: todayPlus(-5),
    gio: '10:00',
    hinh_thuc: 'offline',
    dia_diem: 'Phòng họp B',
    trang_thai: 1,
    trang_thai_danh_gia: 2,
    danh_gia_diem_so: '5/10',
    danh_gia_nhan_xet: 'Không đáp ứng yêu cầu kỹ thuật.',
    ket_qua: 'Không đạt',
    ghi_chu: null,
    tg_tao: '2025-01-10T08:00:00Z',
    tg_cap_nhat: '2025-01-18T12:00:00Z',
  },
];

/** Thư gửi ứng viên (bảng con – module riêng, liên kết ứng viên) */
export const MOCK_THU_GUI_UNG_VIEN: Omit<ThuGuiUngVien, 'ten_ung_vien'>[] = [
  { id: 'tguv-1', id_ung_vien: 'uv-1', loai_thu: 'tu-choi', ghi_chu: null, tg_tao: '2025-02-01T10:00:00Z', tg_cap_nhat: '2025-02-01T10:00:00Z' },
  { id: 'tguv-2', id_ung_vien: 'uv-2', loai_thu: 'moi-nhan-viec', ngay_vao_lam: '2025-02-15', bac_luong: 'L_04 - Nhân viên', muc_luong: '15.000.000 VND/tháng', co_che_khac: 'BHXH, BHYT, BHTN theo quy định; thưởng tháng/quý theo KPI.', ghi_chu_khac: 'Thử việc 2 tháng.', ghi_chu: null, tg_tao: '2025-01-28T09:00:00Z', tg_cap_nhat: '2025-01-28T09:00:00Z' },
  { id: 'tguv-3', id_ung_vien: 'uv-3', loai_thu: 'tu-choi', ghi_chu: 'Ứng viên không đáp ứng yêu cầu kỹ thuật', tg_tao: '2025-02-05T14:20:00Z', tg_cap_nhat: '2025-02-05T14:20:00Z' },
  { id: 'tguv-4', id_ung_vien: 'uv-4', loai_thu: 'moi-nhan-viec', ngay_vao_lam: '2025-03-01', bac_luong: 'L_03 - Trưởng phòng', muc_luong: '25.000.000 VND/tháng', co_che_khac: 'Phụ cấp trách nhiệm; thưởng theo hiệu quả công việc.', ghi_chu_khac: null, ghi_chu: 'Gửi kèm thông tin onboard', tg_tao: '2025-02-10T11:00:00Z', tg_cap_nhat: '2025-02-10T11:00:00Z' },
  { id: 'tguv-5', id_ung_vien: 'uv-1', loai_thu: 'moi-nhan-viec', ngay_vao_lam: '2025-02-20', ghi_chu: null, tg_tao: '2025-02-12T08:30:00Z', tg_cap_nhat: '2025-02-12T08:30:00Z' },
  { id: 'tguv-6', id_ung_vien: 'uv-2', loai_thu: 'tu-choi', ghi_chu: null, tg_tao: '2025-01-15T16:00:00Z', tg_cap_nhat: '2025-01-15T16:00:00Z' },
  { id: 'tguv-7', id_ung_vien: 'uv-3', loai_thu: 'moi-nhan-viec', ngay_vao_lam: '2025-03-10', ghi_chu: null, tg_tao: '2025-02-18T09:15:00Z', tg_cap_nhat: '2025-02-18T09:15:00Z' },
  { id: 'tguv-8', id_ung_vien: 'uv-4', loai_thu: 'tu-choi', ghi_chu: 'Đã chọn ứng viên khác phù hợp hơn', tg_tao: '2025-02-03T10:45:00Z', tg_cap_nhat: '2025-02-03T10:45:00Z' },
  { id: 'tguv-9', id_ung_vien: 'uv-1', loai_thu: 'tu-choi', ghi_chu: null, tg_tao: '2025-01-20T13:00:00Z', tg_cap_nhat: '2025-01-20T13:00:00Z' },
  { id: 'tguv-10', id_ung_vien: 'uv-2', loai_thu: 'moi-nhan-viec', ngay_vao_lam: '2025-02-25', ghi_chu: 'Xác nhận qua email', tg_tao: '2025-01-30T14:30:00Z', tg_cap_nhat: '2025-01-30T14:30:00Z' },
  { id: 'tguv-11', id_ung_vien: 'uv-3', loai_thu: 'tu-choi', ghi_chu: null, tg_tao: '2025-02-08T11:20:00Z', tg_cap_nhat: '2025-02-08T11:20:00Z' },
  { id: 'tguv-12', id_ung_vien: 'uv-4', loai_thu: 'moi-nhan-viec', ngay_vao_lam: '2025-03-05', ghi_chu: null, tg_tao: '2025-02-14T15:00:00Z', tg_cap_nhat: '2025-02-14T15:00:00Z' },
  { id: 'tguv-13', id_ung_vien: 'uv-1', loai_thu: 'moi-nhan-viec', ngay_vao_lam: '2025-02-28', ghi_chu: 'Vị trí Senior Dev', tg_tao: '2025-02-16T08:00:00Z', tg_cap_nhat: '2025-02-16T08:00:00Z' },
  { id: 'tguv-14', id_ung_vien: 'uv-2', loai_thu: 'tu-choi', ghi_chu: null, tg_tao: '2025-01-25T09:30:00Z', tg_cap_nhat: '2025-01-25T09:30:00Z' },
  { id: 'tguv-15', id_ung_vien: 'uv-3', loai_thu: 'moi-nhan-viec', ngay_vao_lam: '2025-03-15', ghi_chu: null, tg_tao: '2025-02-20T10:00:00Z', tg_cap_nhat: '2025-02-20T10:00:00Z' },
];

/** Hợp đồng lao động (module Hợp đồng) */
export const MOCK_HOP_DONG: Omit<HopDong, 'ten_ung_vien'>[] = [
  {
    id: 'hd-1',
    id_ung_vien: 'uv-1',
    loai_hop_dong: 'thu-viec',
    so_hop_dong: 'HDTV-2025-001',
    ngay_bat_dau: '2025-02-01',
    ngay_ket_thuc: '2025-04-01',
    id_hop_dong_goc: null,
    bac_luong: 'L_04 - Nhân viên',
    muc_luong: '12.000.000 VND/tháng',
    ngay_vao_lam: '2025-02-01',
    co_che_khac: 'BHXH, BHYT theo quy định',
    ghi_chu: null,
    ghi_chu_khac: 'Thử việc 2 tháng',
    trang_thai: 'hieu_luc',
    tg_tao: '2025-01-28T09:00:00Z',
    tg_cap_nhat: '2025-01-28T09:00:00Z',
  },
  {
    id: 'hd-2',
    id_ung_vien: 'uv-2',
    loai_hop_dong: 'chinh-thuc',
    so_hop_dong: 'HDCT-2025-001',
    ngay_bat_dau: '2025-02-15',
    ngay_ket_thuc: null,
    id_hop_dong_goc: null,
    bac_luong: 'L_04 - Nhân viên',
    muc_luong: '15.000.000 VND/tháng',
    ngay_vao_lam: '2025-02-15',
    co_che_khac: 'BHXH, BHYT, BHTN; thưởng theo KPI',
    ghi_chu: null,
    ghi_chu_khac: null,
    trang_thai: 'hieu_luc',
    tg_tao: '2025-02-10T10:00:00Z',
    tg_cap_nhat: '2025-02-10T10:00:00Z',
  },
  {
    id: 'hd-3',
    id_ung_vien: 'uv-1',
    loai_hop_dong: 'chinh-thuc',
    so_hop_dong: 'HDCT-2025-002',
    ngay_bat_dau: '2025-04-02',
    ngay_ket_thuc: null,
    id_hop_dong_goc: 'hd-1',
    bac_luong: 'L_04 - Nhân viên',
    muc_luong: '15.000.000 VND/tháng',
    ngay_vao_lam: '2025-04-02',
    co_che_khac: 'BHXH, BHYT, BHTN',
    ghi_chu: null,
    ghi_chu_khac: null,
    trang_thai: 'hieu_luc',
    tg_tao: '2025-03-25T11:00:00Z',
    tg_cap_nhat: '2025-03-25T11:00:00Z',
  },
  {
    id: 'hd-4',
    id_ung_vien: 'uv-3',
    loai_hop_dong: 'thu-viec',
    so_hop_dong: 'HDTV-2025-002',
    ngay_bat_dau: '2025-03-01',
    ngay_ket_thuc: '2025-05-01',
    id_hop_dong_goc: null,
    bac_luong: 'L_03 - Trưởng phòng',
    muc_luong: '22.000.000 VND/tháng',
    ngay_vao_lam: '2025-03-01',
    co_che_khac: 'Phụ cấp trách nhiệm',
    ghi_chu: null,
    ghi_chu_khac: 'Thử việc 2 tháng',
    trang_thai: 'hieu_luc',
    tg_tao: '2025-02-20T14:00:00Z',
    tg_cap_nhat: '2025-02-20T14:00:00Z',
  },
  {
    id: 'hd-5',
    id_ung_vien: 'uv-4',
    loai_hop_dong: 'chinh-thuc',
    so_hop_dong: 'HDCT-2025-003',
    ngay_bat_dau: '2025-01-15',
    ngay_ket_thuc: null,
    id_hop_dong_goc: null,
    bac_luong: 'L_04 - Nhân viên',
    muc_luong: '14.000.000 VND/tháng',
    ngay_vao_lam: '2025-01-15',
    co_che_khac: null,
    ghi_chu: null,
    ghi_chu_khac: null,
    trang_thai: 'thanh_ly',
    tg_tao: '2025-01-10T08:00:00Z',
    tg_cap_nhat: '2025-06-01T09:00:00Z',
  },
  {
    id: 'hd-6',
    id_ung_vien: 'uv-2',
    loai_hop_dong: 'thu-viec',
    so_hop_dong: 'HDTV-2025-003',
    ngay_bat_dau: '2025-03-10',
    ngay_ket_thuc: '2025-05-10',
    id_hop_dong_goc: null,
    bac_luong: 'L_05 - Chuyên viên',
    muc_luong: '18.500.000 VND/tháng',
    ngay_vao_lam: '2025-03-10',
    co_che_khac: 'Thưởng dự án',
    ghi_chu: null,
    ghi_chu_khac: 'Thử việc 2 tháng',
    trang_thai: 'hieu_luc',
    tg_tao: '2025-03-05T08:00:00Z',
    tg_cap_nhat: '2025-03-05T08:00:00Z',
  },
];

/** Phiếu thanh lý hợp đồng */
export const MOCK_PHIEU_THANH_LY: PhieuThanhLy[] = [
  {
    id: 'ptl-1',
    id_hop_dong: 'hd-5',
    so_phieu: 'PTL-2025-001',
    ngay_thanh_ly: '2025-06-01',
    ly_do: 'Nghỉ việc theo nguyện vọng',
    ghi_chu: 'Đã bàn giao đầy đủ',
    tg_tao: '2025-06-01T09:00:00Z',
    tg_cap_nhat: '2025-06-01T09:00:00Z',
  },
];
