/**
 * Mock Data - Nhà cung cấp (Nhóm NCC, Danh sách NCC, Đánh giá)
 * Liên kết với thiết bị, đơn hàng
 */

import { SupplierGroup } from '../features/nha-cung-cap/nhom-nha-cung-cap/core/types';
import { Supplier, SupplierReview } from '../features/nha-cung-cap/danh-sach-nha-cung-cap/core/types';

// ==================== NHÓM NHÀ CUNG CẤP ====================
export const MOCK_SUPPLIER_GROUPS: SupplierGroup[] = [
  {
    id: 'sup-grp-1',
    ma_nhom: 'NCC-CNTT',
    ten_nhom: 'Linh kiện điện tử & CNTT',
    mo_ta: 'Nhà cung cấp thiết bị công nghệ thông tin, điện tử',
    so_luong_ncc: 4,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
  {
    id: 'sup-grp-2',
    ma_nhom: 'NCC-VPP',
    ten_nhom: 'Vật tư văn phòng',
    mo_ta: 'Văn phòng phẩm, giấy in, mực in, vật tư tiêu hao',
    so_luong_ncc: 2,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
  {
    id: 'sup-grp-3',
    ma_nhom: 'NCC-NOI',
    ten_nhom: 'Nội thất văn phòng',
    mo_ta: 'Bàn ghế, tủ, kệ văn phòng',
    so_luong_ncc: 2,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
  {
    id: 'sup-grp-4',
    ma_nhom: 'NCC-DV',
    ten_nhom: 'Dịch vụ bảo trì',
    mo_ta: 'Dịch vụ sửa chữa, bảo trì thiết bị',
    so_luong_ncc: 2,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
  {
    id: 'sup-grp-5',
    ma_nhom: 'NCC-DIEN',
    ten_nhom: 'Điện - Điện lạnh',
    mo_ta: 'Thiết bị điện, điều hòa, quạt',
    so_luong_ncc: 1,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
];

// ==================== NHÀ CUNG CẤP ====================
export const MOCK_SUPPLIERS: Supplier[] = [
  // Nhóm CNTT
  {
    id: 'sup-1',
    ma_ncc: 'NCC001',
    ten_ncc: 'Công ty TNHH Linh Kiện Điện Tử Á Châu',
    nguoi_lien_he: 'Trần Văn Tú',
    so_dien_thoai: '0988123456',
    email: 'sales@achau-tech.com',
    dia_chi: 'Số 45 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    id_nhom: 'sup-grp-1',
    ten_nhom: 'Linh kiện điện tử & CNTT',
    cong_no: 150000000,
    danh_gia: 4.5,
    trang_thai: 1,
    tg_tao: '2023-01-15T00:00:00Z'
  },
  {
    id: 'sup-2',
    ma_ncc: 'NCC002',
    ten_ncc: 'Công ty CP Phân Phối Dell Việt Nam',
    nguoi_lien_he: 'Nguyễn Hải Long',
    so_dien_thoai: '0912456789',
    email: 'partner@dell-vn.com',
    dia_chi: 'Tòa nhà Keangnam, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    id_nhom: 'sup-grp-1',
    ten_nhom: 'Linh kiện điện tử & CNTT',
    cong_no: 85000000,
    danh_gia: 4.8,
    trang_thai: 1,
    tg_tao: '2023-02-20T00:00:00Z'
  },
  {
    id: 'sup-3',
    ma_ncc: 'NCC003',
    ten_ncc: 'Công ty TNHH Máy Tính Phong Vũ',
    nguoi_lien_he: 'Lê Minh Đức',
    so_dien_thoai: '0909888777',
    email: 'b2b@phongvu.vn',
    dia_chi: 'Số 123 Lê Văn Việt, Quận 9, TP.HCM',
    id_nhom: 'sup-grp-1',
    ten_nhom: 'Linh kiện điện tử & CNTT',
    cong_no: 0,
    danh_gia: 4.2,
    trang_thai: 1,
    tg_tao: '2023-04-10T00:00:00Z'
  },
  {
    id: 'sup-4',
    ma_ncc: 'NCC004',
    ten_ncc: 'Công ty TNHH Cisco Systems Vietnam',
    nguoi_lien_he: 'David Nguyen',
    so_dien_thoai: '0283939393',
    email: 'enterprise@cisco.com.vn',
    dia_chi: 'Bitexco Financial Tower, Quận 1, TP.HCM',
    id_nhom: 'sup-grp-1',
    ten_nhom: 'Linh kiện điện tử & CNTT',
    cong_no: 45000000,
    danh_gia: 4.9,
    trang_thai: 1,
    tg_tao: '2022-06-15T00:00:00Z'
  },
  // Nhóm VPP
  {
    id: 'sup-5',
    ma_ncc: 'NCC005',
    ten_ncc: 'Công ty CP Văn Phòng Phẩm Hồng Hà',
    nguoi_lien_he: 'Phạm Thị Hoa',
    so_dien_thoai: '0909090909',
    email: 'sales@hongha.vn',
    dia_chi: 'Số 25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
    id_nhom: 'sup-grp-2',
    ten_nhom: 'Vật tư văn phòng',
    cong_no: 5000000,
    danh_gia: 4.0,
    trang_thai: 1,
    tg_tao: '2023-01-05T00:00:00Z'
  },
  {
    id: 'sup-6',
    ma_ncc: 'NCC006',
    ten_ncc: 'Đại lý Mực In Thành Đạt',
    nguoi_lien_he: 'Nguyễn Thành Đạt',
    so_dien_thoai: '0977666555',
    email: 'mucin.thanhdat@gmail.com',
    dia_chi: 'Số 88 Phố Huế, Hai Bà Trưng, Hà Nội',
    id_nhom: 'sup-grp-2',
    ten_nhom: 'Vật tư văn phòng',
    cong_no: 2500000,
    danh_gia: 3.8,
    trang_thai: 1,
    tg_tao: '2023-05-20T00:00:00Z'
  },
  // Nhóm Nội thất
  {
    id: 'sup-7',
    ma_ncc: 'NCC007',
    ten_ncc: 'Công ty Nội Thất Văn Phòng Hòa Phát',
    nguoi_lien_he: 'Trần Văn Hòa',
    so_dien_thoai: '0243838383',
    email: 'office@hoaphat-furniture.vn',
    dia_chi: 'KCN Phố Nối A, Văn Lâm, Hưng Yên',
    id_nhom: 'sup-grp-3',
    ten_nhom: 'Nội thất văn phòng',
    cong_no: 0,
    danh_gia: 4.3,
    trang_thai: 1,
    tg_tao: '2022-08-10T00:00:00Z'
  },
  {
    id: 'sup-8',
    ma_ncc: 'NCC008',
    ten_ncc: 'Công ty TNHH Nội Thất Xuân Hòa',
    nguoi_lien_he: 'Lê Xuân Trường',
    so_dien_thoai: '0918282828',
    email: 'contact@xuanhoa.com.vn',
    dia_chi: 'Số 15 Nguyễn Xiển, Thanh Xuân, Hà Nội',
    id_nhom: 'sup-grp-3',
    ten_nhom: 'Nội thất văn phòng',
    cong_no: 12000000,
    danh_gia: 4.1,
    trang_thai: 1,
    tg_tao: '2023-03-15T00:00:00Z'
  },
  // Nhóm Dịch vụ bảo trì
  {
    id: 'sup-9',
    ma_ncc: 'NCC009',
    ten_ncc: 'Trung tâm Bảo hành Dell Authorized',
    nguoi_lien_he: 'Vũ Minh Quang',
    so_dien_thoai: '1800599920',
    email: 'support@dell-authorized.vn',
    dia_chi: 'Số 68 Trần Duy Hưng, Cầu Giấy, Hà Nội',
    id_nhom: 'sup-grp-4',
    ten_nhom: 'Dịch vụ bảo trì',
    cong_no: 8500000,
    danh_gia: 4.7,
    trang_thai: 1,
    tg_tao: '2023-06-01T00:00:00Z'
  },
  {
    id: 'sup-10',
    ma_ncc: 'NCC010',
    ten_ncc: 'Dịch vụ Sửa chữa IT Pro',
    nguoi_lien_he: 'Đinh Văn Mạnh',
    so_dien_thoai: '0966123456',
    email: 'itpro.service@gmail.com',
    dia_chi: 'Số 200 Cầu Giấy, Cầu Giấy, Hà Nội',
    id_nhom: 'sup-grp-4',
    ten_nhom: 'Dịch vụ bảo trì',
    cong_no: 3200000,
    danh_gia: 4.0,
    trang_thai: 1,
    tg_tao: '2023-09-15T00:00:00Z'
  },
  // Nhóm Điện
  {
    id: 'sup-11',
    ma_ncc: 'NCC011',
    ten_ncc: 'Công ty Điện lạnh Daikin Việt Nam',
    nguoi_lien_he: 'Hoàng Thanh Sơn',
    so_dien_thoai: '0243636363',
    email: 'commercial@daikin.com.vn',
    dia_chi: 'Tòa nhà Lotte Center, Ba Đình, Hà Nội',
    id_nhom: 'sup-grp-5',
    ten_nhom: 'Điện - Điện lạnh',
    cong_no: 0,
    danh_gia: 4.6,
    trang_thai: 1,
    tg_tao: '2022-11-20T00:00:00Z'
  },
  // NCC ngừng hợp tác
  {
    id: 'sup-12',
    ma_ncc: 'NCC012',
    ten_ncc: 'Công ty TNHH Tin Học ABC (Đã ngừng)',
    nguoi_lien_he: 'Nguyễn Văn X',
    so_dien_thoai: '0901111222',
    email: 'abc.it@old.com',
    dia_chi: 'Quận Đống Đa, Hà Nội',
    id_nhom: 'sup-grp-1',
    ten_nhom: 'Linh kiện điện tử & CNTT',
    cong_no: 0,
    danh_gia: 2.5,
    trang_thai: 0, // Ngừng hợp tác
    tg_tao: '2022-01-01T00:00:00Z'
  },
];

// ==================== ĐÁNH GIÁ NHÀ CUNG CẤP ====================
export const MOCK_SUPPLIER_REVIEWS: SupplierReview[] = [
  // Đánh giá cho Á Châu (sup-1)
  {
    id: 'rv-001',
    id_ncc: 'sup-1',
    nguoi_danh_gia: 'Cao Văn Long',
    ngay_danh_gia: '2024-12-15T10:00:00Z',
    diem_gia_ca: 4,
    diem_chat_luong: 5,
    diem_ho_tro: 5,
    diem_trung_binh: 4.7,
    ghi_chu_gia_ca: 'Giá cạnh tranh so với thị trường',
    ghi_chu_chat_luong: 'Hàng chính hãng, đóng gói cẩn thận',
    ghi_chu_ho_tro: 'Phản hồi nhanh, hỗ trợ bảo hành tốt',
    ghi_chu_chung: 'Đối tác tin cậy, đã hợp tác nhiều năm'
  },
  {
    id: 'rv-002',
    id_ncc: 'sup-1',
    nguoi_danh_gia: 'Lê Hoàng Nam',
    ngay_danh_gia: '2024-10-20T09:30:00Z',
    diem_gia_ca: 4,
    diem_chat_luong: 4,
    diem_ho_tro: 5,
    diem_trung_binh: 4.3,
    ghi_chu_chat_luong: 'Một số lô hàng giao chậm 1-2 ngày',
    ghi_chu_ho_tro: 'Hỗ trợ kỹ thuật rất nhiệt tình',
    ghi_chu_chung: 'Tổng thể tốt, cần cải thiện thời gian giao hàng'
  },
  // Đánh giá cho Dell VN (sup-2)
  {
    id: 'rv-003',
    id_ncc: 'sup-2',
    nguoi_danh_gia: 'Phạm Minh Tuấn',
    ngay_danh_gia: '2024-11-10T14:00:00Z',
    diem_gia_ca: 5,
    diem_chat_luong: 5,
    diem_ho_tro: 5,
    diem_trung_binh: 5.0,
    ghi_chu_gia_ca: 'Chiết khấu đặc biệt cho khách hàng doanh nghiệp',
    ghi_chu_chat_luong: 'Sản phẩm chính hãng Dell, bảo hành toàn cầu',
    ghi_chu_ho_tro: 'Đường dây nóng 24/7, kỹ thuật viên đến tận nơi',
    ghi_chu_chung: 'Nhà cung cấp hàng đầu về laptop doanh nghiệp'
  },
  // Đánh giá cho Cisco (sup-4)
  {
    id: 'rv-004',
    id_ncc: 'sup-4',
    nguoi_danh_gia: 'Đặng Quốc Bảo',
    ngay_danh_gia: '2024-09-05T11:00:00Z',
    diem_gia_ca: 4,
    diem_chat_luong: 5,
    diem_ho_tro: 5,
    diem_trung_binh: 4.7,
    ghi_chu_gia_ca: 'Giá cao nhưng xứng đáng với chất lượng',
    ghi_chu_chat_luong: 'Thiết bị mạng enterprise đẳng cấp thế giới',
    ghi_chu_ho_tro: 'TAC support chuyên nghiệp, có SLA rõ ràng',
    ghi_chu_chung: 'Đầu tư một lần, sử dụng lâu dài'
  },
  // Đánh giá cho Hồng Hà (sup-5)
  {
    id: 'rv-005',
    id_ncc: 'sup-5',
    nguoi_danh_gia: 'Đỗ Thị Hằng',
    ngay_danh_gia: '2025-01-08T16:30:00Z',
    diem_gia_ca: 4,
    diem_chat_luong: 4,
    diem_ho_tro: 4,
    diem_trung_binh: 4.0,
    ghi_chu_gia_ca: 'Giá ổn định, có chiết khấu theo số lượng',
    ghi_chu_chat_luong: 'Hàng đạt tiêu chuẩn, đúng mẫu mã',
    ghi_chu_ho_tro: 'Giao hàng đúng hẹn, thái độ tốt',
    ghi_chu_chung: 'Đối tác văn phòng phẩm đáng tin cậy'
  },
  // Đánh giá cho Daikin (sup-11)
  {
    id: 'rv-006',
    id_ncc: 'sup-11',
    nguoi_danh_gia: 'Ngô Thanh Tùng',
    ngay_danh_gia: '2024-08-20T10:00:00Z',
    diem_gia_ca: 4,
    diem_chat_luong: 5,
    diem_ho_tro: 5,
    diem_trung_binh: 4.7,
    ghi_chu_gia_ca: 'Giá Daikin cao hơn các hãng khác ~15-20%',
    ghi_chu_chat_luong: 'Điều hòa tiết kiệm điện, bền bỉ',
    ghi_chu_ho_tro: 'Bảo hành 3 năm, có đội ngũ kỹ thuật riêng',
    ghi_chu_chung: 'Thương hiệu Nhật Bản uy tín'
  },
];

// Helpers
export const getSupplierGroupName = (id: string): string => {
  return MOCK_SUPPLIER_GROUPS.find(g => g.id === id)?.ten_nhom || 'Không xác định';
};

export const getSupplierName = (id: string): string => {
  return MOCK_SUPPLIERS.find(s => s.id === id)?.ten_ncc || 'Không xác định';
};

export const getSupplierReviewsBySupplier = (supplierId: string): SupplierReview[] => {
  return MOCK_SUPPLIER_REVIEWS.filter(r => r.id_ncc === supplierId)
    .sort((a, b) => new Date(b.ngay_danh_gia).getTime() - new Date(a.ngay_danh_gia).getTime());
};
