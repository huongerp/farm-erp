/**
 * Mock Data - Tài chính (Tài khoản, Danh mục, Thu chi)
 * Liên kết với nhân viên, nhà cung cấp, khách hàng
 */

import { TaiKhoan, DanhMucTaiChinh, ThuChi } from '../features/tai-chinh/core/types';
import type { DeXuatChiPhi } from '../features/tai-chinh/de-xuat-chi-phi/core/types';
import type { KeHoachChiPhi } from '../features/tai-chinh/ke-hoach-chi-phi/core/types';
import { generateMockDeXuatChiPhi } from './generate-mock-de-xuat-chi-phi';

// ==================== TÀI KHOẢN ====================
export const MOCK_TAI_KHOAN: TaiKhoan[] = [
  {
    id: 'tk-1',
    ten_tai_khoan: 'Quỹ tiền mặt',
    so_tai_khoan: 'CASH-001',
    ngan_hang: '',
    loai_tai_khoan: 'tien_mat',
    so_du_dau: 50000000,
    tong_thu: 125000000,
    tong_chi: 98000000,
    so_du_cuoi: 77000000,
    so_du_hien_tai: 77000000,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2025-01-25T00:00:00Z'
  },
  {
    id: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    so_tai_khoan: '0071001234567',
    ngan_hang: 'Vietcombank',
    ma_ngan_hang: '970436',
    chu_tai_khoan: 'CONG TY TNHH 5F',
    loai_tai_khoan: 'ngan_hang',
    so_du_dau: 500000000,
    tong_thu: 2850000000,
    tong_chi: 2100000000,
    so_du_cuoi: 1250000000,
    so_du_hien_tai: 1250000000,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2025-01-25T00:00:00Z'
  },
  {
    id: 'tk-3',
    ten_tai_khoan: 'Techcombank - Công ty',
    so_tai_khoan: '19039876543210',
    ngan_hang: 'Techcombank',
    ma_ngan_hang: '970407',
    chu_tai_khoan: 'CONG TY TNHH 5F',
    loai_tai_khoan: 'ngan_hang',
    so_du_dau: 200000000,
    tong_thu: 980000000,
    tong_chi: 750000000,
    so_du_cuoi: 430000000,
    so_du_hien_tai: 430000000,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2025-01-25T00:00:00Z'
  },
  {
    id: 'tk-4',
    ten_tai_khoan: 'Tài khoản tiết kiệm VCB',
    so_tai_khoan: '0071009999888',
    ngan_hang: 'Vietcombank',
    ma_ngan_hang: '970436',
    chu_tai_khoan: 'CONG TY TNHH 5F',
    loai_tai_khoan: 'ngan_hang',
    so_du_dau: 1000000000,
    tong_thu: 50000000,
    tong_chi: 0,
    so_du_cuoi: 1050000000,
    so_du_hien_tai: 1050000000,
    trang_thai: 1,
    tg_tao: '2023-06-01T00:00:00Z',
    tg_cap_nhat: '2025-01-01T00:00:00Z'
  },
  {
    id: 'tk-5',
    ten_tai_khoan: 'Tài khoản cũ (Đã đóng)',
    so_tai_khoan: '123456789',
    ngan_hang: 'BIDV',
    ma_ngan_hang: '970418',
    chu_tai_khoan: 'CONG TY TNHH 5F',
    loai_tai_khoan: 'ngan_hang',
    so_du_dau: 0,
    tong_thu: 0,
    tong_chi: 0,
    so_du_cuoi: 0,
    so_du_hien_tai: 0,
    trang_thai: 0,
    tg_tao: '2022-01-01T00:00:00Z',
    tg_cap_nhat: '2023-12-31T00:00:00Z'
  },
];

// ==================== DANH MỤC TÀI CHÍNH (2 cấp: cha -> con, ví dụ Doanh thu -> Doanh thu bán lẻ, bán buôn) ====================
const ts = () => new Date().toISOString();
export const MOCK_DANH_MUC_TAI_CHINH: DanhMucTaiChinh[] = [
  // --- THU: Cấp 1 (cha) + cấp 2 (con) ---
  { id: 'dm-thu-1', ma_danh_muc: 'DT', ten_danh_muc: 'Doanh thu', loai: 'thu', id_cha: null, thu_tu: 1, mo_ta: 'Doanh thu bán hàng, dịch vụ', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-thu-1a', ma_danh_muc: 'DT-LE', ten_danh_muc: 'Doanh thu bán lẻ', loai: 'thu', id_cha: 'dm-thu-1', thu_tu: 1, mo_ta: 'Bán lẻ', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-thu-1b', ma_danh_muc: 'DT-BUON', ten_danh_muc: 'Doanh thu bán buôn', loai: 'thu', id_cha: 'dm-thu-1', thu_tu: 2, mo_ta: 'Bán buôn', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-thu-2', ma_danh_muc: 'DT-DV', ten_danh_muc: 'Doanh thu dịch vụ', loai: 'thu', id_cha: null, thu_tu: 2, mo_ta: 'Thu từ dịch vụ bảo trì, sửa chữa', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-thu-3', ma_danh_muc: 'DT-KHAC', ten_danh_muc: 'Thu nhập khác', loai: 'thu', id_cha: null, thu_tu: 3, mo_ta: 'Lãi tiết kiệm, thanh lý tài sản...', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-thu-4', ma_danh_muc: 'DT-TU', ten_danh_muc: 'Thu nợ khách hàng', loai: 'thu', id_cha: null, thu_tu: 4, mo_ta: 'Thu công nợ từ khách hàng', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  // --- CHI: Cấp 1 (cha) + cấp 2 (con) ---
  { id: 'dm-chi-1', ma_danh_muc: 'CP-HANG', ten_danh_muc: 'Chi mua hàng', loai: 'chi', id_cha: null, thu_tu: 1, mo_ta: 'Mua thiết bị, linh kiện từ NCC', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-1a', ma_danh_muc: 'CP-HANG-NVL', ten_danh_muc: 'Chi mua nguyên vật liệu', loai: 'chi', id_cha: 'dm-chi-1', thu_tu: 1, mo_ta: 'NVL phục vụ sản xuất', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-1b', ma_danh_muc: 'CP-HANG-CCDC', ten_danh_muc: 'Chi mua công cụ dụng cụ', loai: 'chi', id_cha: 'dm-chi-1', thu_tu: 2, mo_ta: 'Công cụ, dụng cụ', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-2', ma_danh_muc: 'CP-LUONG', ten_danh_muc: 'Chi lương nhân viên', loai: 'chi', id_cha: null, thu_tu: 2, mo_ta: 'Lương, thưởng, bảo hiểm', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-3', ma_danh_muc: 'CP-VP', ten_danh_muc: 'Chi phí văn phòng', loai: 'chi', id_cha: null, thu_tu: 3, mo_ta: 'Điện nước, internet, văn phòng phẩm', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-4', ma_danh_muc: 'CP-THUE', ten_danh_muc: 'Chi tiền thuê mặt bằng', loai: 'chi', id_cha: null, thu_tu: 4, mo_ta: 'Thuê văn phòng, kho bãi', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-5', ma_danh_muc: 'CP-MKT', ten_danh_muc: 'Chi phí Marketing', loai: 'chi', id_cha: null, thu_tu: 5, mo_ta: 'Quảng cáo, khuyến mãi, sự kiện', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-6', ma_danh_muc: 'CP-VC', ten_danh_muc: 'Chi phí vận chuyển', loai: 'chi', id_cha: null, thu_tu: 6, mo_ta: 'Phí ship, giao hàng', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-7', ma_danh_muc: 'CP-THUE-NK', ten_danh_muc: 'Chi thuế & Phí', loai: 'chi', id_cha: null, thu_tu: 7, mo_ta: 'Thuế VAT, thuế TNDN, phí ngân hàng', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-8', ma_danh_muc: 'CP-KHAC', ten_danh_muc: 'Chi phí khác', loai: 'chi', id_cha: null, thu_tu: 8, mo_ta: 'Các khoản chi khác', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dm-chi-9', ma_danh_muc: 'CP-NCC', ten_danh_muc: 'Trả nợ nhà cung cấp', loai: 'chi', id_cha: null, thu_tu: 9, mo_ta: 'Thanh toán công nợ cho NCC', trang_thai: 1, tg_tao: ts(), tg_cap_nhat: ts() },
];

// ==================== ĐỀ XUẤT CHI PHÍ ====================
// Dữ liệu mock động theo ngày hệ thống: tháng hiện tại luôn có bản ghi; năm ngoái & năm nay đều có.
export const MOCK_DE_XUAT_CHI_PHI: DeXuatChiPhi[] = generateMockDeXuatChiPhi();

// ==================== GIAO DỊCH THU CHI ====================
export const MOCK_THU_CHI: ThuChi[] = [
  // Tháng 1/2025
  {
    id: 'gd-001',
    ma_giao_dich: 'TC-2025-001',
    ngay_giao_dich: '2025-01-05T09:30:00Z',
    so_tien: 85000000,
    loai: 'thu',
    id_tai_khoan: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    id_danh_muc: 'dm-thu-1',
    ten_danh_muc: 'Doanh thu bán hàng',
    noi_dung: 'Thu tiền bán 3 laptop Dell cho Công ty ABC',
    id_nhan_vien_thuc_hien: 'emp-010',
    ten_nhan_vien: 'Trịnh Thị Ngọc',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-002',
    ma_giao_dich: 'TC-2025-002',
    ngay_giao_dich: '2025-01-06T14:00:00Z',
    so_tien: 150000000,
    loai: 'chi',
    id_tai_khoan: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    id_danh_muc: 'dm-chi-1',
    ten_danh_muc: 'Chi mua hàng hóa',
    noi_dung: 'Thanh toán đơn hàng linh kiện cho Á Châu Tech',
    id_nhan_vien_thuc_hien: 'emp-011',
    ten_nhan_vien: 'Lý Văn Phú',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-003',
    ma_giao_dich: 'TC-2025-003',
    ngay_giao_dich: '2025-01-10T10:00:00Z',
    so_tien: 45000000,
    loai: 'thu',
    id_tai_khoan: 'tk-3',
    ten_tai_khoan: 'Techcombank - Công ty',
    id_danh_muc: 'dm-thu-2',
    ten_danh_muc: 'Doanh thu dịch vụ',
    noi_dung: 'Thu tiền dịch vụ bảo trì hệ thống IT - Q1/2025 từ Vingroup',
    id_nhan_vien_thuc_hien: 'emp-010',
    ten_nhan_vien: 'Trịnh Thị Ngọc',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-004',
    ma_giao_dich: 'TC-2025-004',
    ngay_giao_dich: '2025-01-12T11:30:00Z',
    so_tien: 120000000,
    loai: 'chi',
    id_tai_khoan: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    id_danh_muc: 'dm-chi-2',
    ten_danh_muc: 'Chi lương nhân viên',
    noi_dung: 'Chi lương tháng 12/2024 cho toàn bộ nhân viên',
    id_nhan_vien_thuc_hien: 'emp-010',
    ten_nhan_vien: 'Trịnh Thị Ngọc',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-005',
    ma_giao_dich: 'TC-2025-005',
    ngay_giao_dich: '2025-01-15T08:45:00Z',
    so_tien: 25000000,
    loai: 'chi',
    id_tai_khoan: 'tk-1',
    ten_tai_khoan: 'Quỹ tiền mặt',
    id_danh_muc: 'dm-chi-3',
    ten_danh_muc: 'Chi phí văn phòng',
    noi_dung: 'Thanh toán tiền điện, nước, internet tháng 12/2024',
    id_nhan_vien_thuc_hien: 'emp-011',
    ten_nhan_vien: 'Lý Văn Phú',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-006',
    ma_giao_dich: 'TC-2025-006',
    ngay_giao_dich: '2025-01-15T09:00:00Z',
    so_tien: 35000000,
    loai: 'chi',
    id_tai_khoan: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    id_danh_muc: 'dm-chi-4',
    ten_danh_muc: 'Chi tiền thuê mặt bằng',
    noi_dung: 'Thanh toán tiền thuê văn phòng tháng 01/2025',
    id_nhan_vien_thuc_hien: 'emp-010',
    ten_nhan_vien: 'Trịnh Thị Ngọc',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-007',
    ma_giao_dich: 'TC-2025-007',
    ngay_giao_dich: '2025-01-18T16:30:00Z',
    so_tien: 28000000,
    loai: 'thu',
    id_tai_khoan: 'tk-1',
    ten_tai_khoan: 'Quỹ tiền mặt',
    id_danh_muc: 'dm-thu-1',
    ten_danh_muc: 'Doanh thu bán hàng',
    noi_dung: 'Bán 1 laptop HP EliteBook - khách lẻ (tiền mặt)',
    id_nhan_vien_thuc_hien: 'emp-011',
    ten_nhan_vien: 'Lý Văn Phú',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-008',
    ma_giao_dich: 'TC-2025-008',
    ngay_giao_dich: '2025-01-20T10:15:00Z',
    so_tien: 15000000,
    loai: 'chi',
    id_tai_khoan: 'tk-3',
    ten_tai_khoan: 'Techcombank - Công ty',
    id_danh_muc: 'dm-chi-5',
    ten_danh_muc: 'Chi phí Marketing',
    noi_dung: 'Thanh toán chi phí quảng cáo Google Ads tháng 01/2025',
    id_nhan_vien_thuc_hien: 'emp-011',
    ten_nhan_vien: 'Lý Văn Phú',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-009',
    ma_giao_dich: 'TC-2025-009',
    ngay_giao_dich: '2025-01-22T14:00:00Z',
    so_tien: 50000000,
    phi_giao_dich: 11000,
    loai: 'chuyen_quy',
    id_tai_khoan: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    id_tai_khoan_dich: 'tk-1',
    ten_tai_khoan_dich: 'Quỹ tiền mặt',
    noi_dung: 'Rút tiền mặt bổ sung quỹ tiền mặt văn phòng',
    id_nhan_vien_thuc_hien: 'emp-010',
    ten_nhan_vien: 'Trịnh Thị Ngọc',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-010',
    ma_giao_dich: 'TC-2025-010',
    ngay_giao_dich: '2025-01-25T09:30:00Z',
    so_tien: 320000000,
    loai: 'thu',
    id_tai_khoan: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    id_danh_muc: 'dm-thu-4',
    ten_danh_muc: 'Thu nợ khách hàng',
    noi_dung: 'Thu công nợ từ Tập đoàn Vingroup - Đợt 1 Q1/2025',
    id_nhan_vien_thuc_hien: 'emp-010',
    ten_nhan_vien: 'Trịnh Thị Ngọc',
    trang_thai: 'hoan_thanh'
  },
  {
    id: 'gd-011',
    ma_giao_dich: 'TC-2025-011',
    ngay_giao_dich: '2025-01-28T11:00:00Z',
    so_tien: 85000000,
    loai: 'chi',
    id_tai_khoan: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    id_danh_muc: 'dm-chi-9',
    ten_danh_muc: 'Trả nợ nhà cung cấp',
    noi_dung: 'Thanh toán công nợ cho Dell Việt Nam - Đơn hàng tháng 12',
    id_nhan_vien_thuc_hien: 'emp-011',
    ten_nhan_vien: 'Lý Văn Phú',
    trang_thai: 'hoan_thanh'
  },
  // Giao dịch chờ duyệt
  {
    id: 'gd-012',
    ma_giao_dich: 'TC-2025-012',
    ngay_giao_dich: '2025-01-30T15:00:00Z',
    so_tien: 45000000,
    loai: 'chi',
    id_tai_khoan: 'tk-3',
    ten_tai_khoan: 'Techcombank - Công ty',
    id_danh_muc: 'dm-chi-1',
    ten_danh_muc: 'Chi mua hàng hóa',
    noi_dung: 'Đề xuất mua lô SSD Samsung 1TB - 18 chiếc',
    id_nhan_vien_thuc_hien: 'emp-015',
    ten_nhan_vien: 'Cao Văn Long',
    trang_thai: 'cho_duyet'
  },
  {
    id: 'gd-013',
    ma_giao_dich: 'TC-2025-013',
    ngay_giao_dich: '2025-01-30T16:30:00Z',
    so_tien: 8500000,
    loai: 'chi',
    id_tai_khoan: 'tk-1',
    ten_tai_khoan: 'Quỹ tiền mặt',
    id_danh_muc: 'dm-chi-8',
    ten_danh_muc: 'Chi phí khác',
    noi_dung: 'Đề xuất chi tiền tiếp khách đối tác - Dự án mới',
    id_nhan_vien_thuc_hien: 'emp-012',
    ten_nhan_vien: 'Đinh Công Vinh',
    trang_thai: 'cho_duyet'
  },
  // Giao dịch đã hủy
  {
    id: 'gd-014',
    ma_giao_dich: 'TC-2025-014',
    ngay_giao_dich: '2025-01-20T10:00:00Z',
    so_tien: 200000000,
    loai: 'chi',
    id_tai_khoan: 'tk-2',
    ten_tai_khoan: 'Vietcombank - Công ty',
    id_danh_muc: 'dm-chi-1',
    ten_danh_muc: 'Chi mua hàng hóa',
    noi_dung: 'ĐƠN HỦY - Mua lô laptop cho dự án (Khách hủy hợp đồng)',
    id_nhan_vien_thuc_hien: 'emp-015',
    ten_nhan_vien: 'Cao Văn Long',
    trang_thai: 'huy'
  },
];

// ==================== KẾ HOẠCH CHI PHÍ (1 bảng phẳng) ====================
const tsKhcp = () => new Date().toISOString();
const DEFAULT_DON_GIA = 1e6;

function row(
  id: string,
  nam: number,
  idPhong: string,
  tenPhong: string,
  idDm: string,
  tenDm: string,
  values: number[],
  moTa?: string,
  idNguoiTao?: string,
  tenNguoi?: string
): KeHoachChiPhi {
  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12] = values;
  const tong = values.reduce((a, b) => a + b, 0);
  const sl = (v: number) => (v > 0 ? Math.round(v / DEFAULT_DON_GIA) : 0);
  const thangSl = [sl(t1), sl(t2), sl(t3), sl(t4), sl(t5), sl(t6), sl(t7), sl(t8), sl(t9), sl(t10), sl(t11), sl(t12)];
  const tongSl = thangSl.reduce((a, b) => a + b, 0);
  return {
    id,
    nam,
    id_phong_ban: idPhong,
    ten_phong_ban: tenPhong,
    id_danh_muc: idDm,
    ten_danh_muc: tenDm,
    mo_ta: moTa,
    thang_1: t1,
    thang_2: t2,
    thang_3: t3,
    thang_4: t4,
    thang_5: t5,
    thang_6: t6,
    thang_7: t7,
    thang_8: t8,
    thang_9: t9,
    thang_10: t10,
    thang_11: t11,
    thang_12: t12,
    tong_nam: tong,
    tong_sl: tongSl,
    thang_1_so_luong: thangSl[0],
    thang_1_don_gia: DEFAULT_DON_GIA,
    thang_2_so_luong: thangSl[1],
    thang_2_don_gia: DEFAULT_DON_GIA,
    thang_3_so_luong: thangSl[2],
    thang_3_don_gia: DEFAULT_DON_GIA,
    thang_4_so_luong: thangSl[3],
    thang_4_don_gia: DEFAULT_DON_GIA,
    thang_5_so_luong: thangSl[4],
    thang_5_don_gia: DEFAULT_DON_GIA,
    thang_6_so_luong: thangSl[5],
    thang_6_don_gia: DEFAULT_DON_GIA,
    thang_7_so_luong: thangSl[6],
    thang_7_don_gia: DEFAULT_DON_GIA,
    thang_8_so_luong: thangSl[7],
    thang_8_don_gia: DEFAULT_DON_GIA,
    thang_9_so_luong: thangSl[8],
    thang_9_don_gia: DEFAULT_DON_GIA,
    thang_10_so_luong: thangSl[9],
    thang_10_don_gia: DEFAULT_DON_GIA,
    thang_11_so_luong: thangSl[10],
    thang_11_don_gia: DEFAULT_DON_GIA,
    thang_12_so_luong: thangSl[11],
    thang_12_don_gia: DEFAULT_DON_GIA,
    id_nguoi_tao: idNguoiTao,
    ten_nguoi_tao: tenNguoi,
    tg_tao: tsKhcp(),
    tg_cap_nhat: tsKhcp(),
  };
}

export const MOCK_KE_HOACH_CHI_PHI: KeHoachChiPhi[] = [
  // Năm 2025
  row('khcp-2025-1', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-1', 'Chi mua hàng', [180e6, 160e6, 200e6, 190e6, 170e6, 210e6, 185e6, 195e6, 205e6, 175e6, 165e6, 170e6], 'Mua NVL, CCDC phục vụ sản xuất', 'emp-001', 'Nguyễn Văn A'),
  row('khcp-2025-2', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-2', 'Chi lương nhân viên', [120e6, 120e6, 120e6, 120e6, 120e6, 120e6, 120e6, 120e6, 120e6, 120e6, 120e6, 140e6], 'Lương, thưởng, BHXH', 'emp-001', 'Nguyễn Văn A'),
  row('khcp-2025-3', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-3', 'Chi phí văn phòng', [25e6, 28e6, 26e6, 27e6, 25e6, 30e6, 28e6, 26e6, 27e6, 29e6, 28e6, 32e6], 'Điện, nước, internet, văn phòng phẩm', 'emp-001', 'Nguyễn Văn A'),
  row('khcp-2025-4', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-4', 'Chi tiền thuê mặt bằng', [35e6, 35e6, 35e6, 35e6, 35e6, 35e6, 35e6, 35e6, 35e6, 35e6, 35e6, 35e6], 'Thuê văn phòng, kho bãi', 'emp-001', 'Nguyễn Văn A'),
  row('khcp-2025-5', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-5', 'Chi phí Marketing', [20e6, 18e6, 25e6, 22e6, 15e6, 28e6, 20e6, 19e6, 24e6, 21e6, 23e6, 30e6], 'Quảng cáo, khuyến mãi, sự kiện', 'emp-001', 'Nguyễn Văn A'),
  row('khcp-2025-6', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-6', 'Chi phí vận chuyển', [12e6, 10e6, 14e6, 11e6, 13e6, 15e6, 12e6, 10e6, 14e6, 11e6, 13e6, 16e6], 'Phí ship, giao hàng', 'emp-001', 'Nguyễn Văn A'),
  row('khcp-2025-7', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-7', 'Chi thuế & Phí', [8e6, 8e6, 8e6, 8e6, 8e6, 8e6, 8e6, 8e6, 8e6, 8e6, 8e6, 12e6], 'Thuế VAT, phí ngân hàng', 'emp-001', 'Nguyễn Văn A'),
  row('khcp-2025-8', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-8', 'Chi phí khác', [5e6, 6e6, 5e6, 7e6, 5e6, 6e6, 5e6, 6e6, 7e6, 5e6, 6e6, 8e6], 'Chi phí phát sinh khác, dự phòng', 'emp-001', 'Nguyễn Văn A'),
  row('khcp-2025-9', 2025, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-9', 'Trả nợ nhà cung cấp', [80e6, 70e6, 90e6, 85e6, 75e6, 95e6, 88e6, 82e6, 78e6, 72e6, 68e6, 87e6], 'Thanh toán công nợ NCC', 'emp-001', 'Nguyễn Văn A'),
  // Năm 2026
  row('khcp-2026-1', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-1', 'Chi mua hàng', [190e6, 180e6, 210e6, 200e6, 185e6, 220e6, 195e6, 205e6, 215e6, 185e6, 175e6, 180e6], 'Mua NVL, CCDC năm 2026 theo kế hoạch mở rộng', 'emp-010', 'Trịnh Thị Ngọc'),
  row('khcp-2026-2', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-2', 'Chi lương nhân viên', [130e6, 130e6, 130e6, 130e6, 130e6, 130e6, 130e6, 130e6, 130e6, 130e6, 130e6, 150e6], 'Lương, thưởng, BHXH dự kiến tăng 8%', 'emp-010', 'Trịnh Thị Ngọc'),
  row('khcp-2026-3', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-3', 'Chi phí văn phòng', [28e6, 30e6, 28e6, 29e6, 27e6, 32e6, 30e6, 28e6, 29e6, 31e6, 30e6, 35e6], 'Điện, nước, internet, văn phòng phẩm', 'emp-010', 'Trịnh Thị Ngọc'),
  row('khcp-2026-4', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-4', 'Chi tiền thuê mặt bằng', [36e6, 36e6, 36e6, 36e6, 36e6, 36e6, 36e6, 36e6, 36e6, 36e6, 36e6, 36e6], 'Thuê văn phòng, kho bãi (hợp đồng cố định)', 'emp-010', 'Trịnh Thị Ngọc'),
  row('khcp-2026-5', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-5', 'Chi phí Marketing', [22e6, 20e6, 28e6, 24e6, 18e6, 30e6, 22e6, 21e6, 26e6, 23e6, 25e6, 32e6], 'Quảng cáo, khuyến mãi, sự kiện năm 2026', 'emp-010', 'Trịnh Thị Ngọc'),
  row('khcp-2026-6', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-6', 'Chi phí vận chuyển', [14e6, 12e6, 16e6, 13e6, 15e6, 17e6, 14e6, 12e6, 16e6, 13e6, 15e6, 18e6], 'Phí ship, giao hàng theo đơn hàng', 'emp-010', 'Trịnh Thị Ngọc'),
  row('khcp-2026-7', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-7', 'Chi thuế & Phí', [9e6, 9e6, 9e6, 9e6, 9e6, 9e6, 9e6, 9e6, 9e6, 9e6, 9e6, 13e6], 'Thuế VAT, phí ngân hàng, phí pháp lý', 'emp-010', 'Trịnh Thị Ngọc'),
  row('khcp-2026-8', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-8', 'Chi phí khác', [6e6, 7e6, 6e6, 8e6, 6e6, 7e6, 6e6, 7e6, 8e6, 6e6, 7e6, 9e6], 'Dự phòng chi phí phát sinh', 'emp-010', 'Trịnh Thị Ngọc'),
  row('khcp-2026-9', 2026, 'dep-3', 'Phòng Tài chính - Kế toán', 'dm-chi-9', 'Trả nợ nhà cung cấp', [85e6, 75e6, 95e6, 90e6, 80e6, 100e6, 92e6, 86e6, 82e6, 76e6, 72e6, 90e6], 'Thanh toán công nợ NCC theo lịch đã cam kết', 'emp-010', 'Trịnh Thị Ngọc'),
];

// Helpers
export const getAccountName = (id: string): string => {
  return MOCK_TAI_KHOAN.find(tk => tk.id === id)?.ten_tai_khoan || 'Không xác định';
};

export const getCategoryName = (id: string): string => {
  return MOCK_DANH_MUC_TAI_CHINH.find(dm => dm.id === id)?.ten_danh_muc || 'Không xác định';
};

export const getTotalBalance = (): number => {
  return MOCK_TAI_KHOAN.filter(tk => tk.trang_thai === 1).reduce((sum, tk) => sum + tk.so_du_cuoi, 0);
};
