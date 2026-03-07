/**
 * Mock Data - Khách hàng (Nhóm KH, Danh sách KH)
 * Liên kết với nhân viên phụ trách, đơn hàng
 */

import { CustomerGroup } from '../features/khach-hang/nhom-khach-hang/core/types';
import { Customer } from '../features/khach-hang/danh-sach-khach-hang/core/types';

// ==================== NHÓM KHÁCH HÀNG ====================
export const MOCK_CUSTOMER_GROUPS: CustomerGroup[] = [
  {
    id: 'cg-1',
    ma_nhom: 'KH-VIP',
    ten_nhom: 'Khách hàng VIP',
    mo_ta: 'Khách hàng có doanh số trên 500 triệu/năm',
    so_luong_khach: 3,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
  {
    id: 'cg-2',
    ma_nhom: 'KH-DN',
    ten_nhom: 'Doanh nghiệp',
    mo_ta: 'Khách hàng là công ty, tổ chức',
    so_luong_khach: 8,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
  {
    id: 'cg-3',
    ma_nhom: 'KH-LE',
    ten_nhom: 'Khách lẻ',
    mo_ta: 'Khách hàng cá nhân, mua lẻ',
    so_luong_khach: 12,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
  {
    id: 'cg-4',
    ma_nhom: 'KH-DL',
    ten_nhom: 'Đại lý',
    mo_ta: 'Đại lý phân phối, bán buôn',
    so_luong_khach: 4,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
  {
    id: 'cg-5',
    ma_nhom: 'KH-GOV',
    ten_nhom: 'Cơ quan nhà nước',
    mo_ta: 'Các cơ quan, ban ngành nhà nước',
    so_luong_khach: 2,
    trang_thai: 1,
    tg_tao: '2023-01-01T00:00:00Z',
    tg_cap_nhat: '2024-01-15T00:00:00Z'
  },
];

// ==================== KHÁCH HÀNG ====================
export const MOCK_CUSTOMERS: Customer[] = [
  // VIP
  {
    id: 'cus-001',
    ma_kh: 'KH001',
    ho_ten: 'Công ty CP Đầu tư Phát triển Thành Công',
    so_dien_thoai: '0243838388',
    email: 'procurement@thanhcong-group.vn',
    dia_chi: 'Tầng 25, Tòa Landmark 72, Cầu Giấy, Hà Nội',
    id_nhom: 'cg-1',
    ten_nhom: 'Khách hàng VIP',
    tong_chi_tieu: 1250000000,
    lan_cuoi_mua: '2025-01-15T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2022-03-10T00:00:00Z',
    tg_cap_nhat: '2025-01-15T00:00:00Z'
  },
  {
    id: 'cus-002',
    ma_kh: 'KH002',
    ho_ten: 'Tập đoàn Vingroup',
    so_dien_thoai: '0243939393',
    email: 'it.procurement@vingroup.net',
    dia_chi: 'Tòa nhà Vinhomes Tower, Ba Đình, Hà Nội',
    id_nhom: 'cg-1',
    ten_nhom: 'Khách hàng VIP',
    tong_chi_tieu: 2850000000,
    lan_cuoi_mua: '2025-01-20T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2021-06-15T00:00:00Z',
    tg_cap_nhat: '2025-01-20T00:00:00Z'
  },
  {
    id: 'cus-003',
    ma_kh: 'KH003',
    ho_ten: 'Ngân hàng TMCP Techcombank',
    so_dien_thoai: '0246868686',
    email: 'vendor@techcombank.com.vn',
    dia_chi: 'Tầng 6, Techcombank Tower, Hoàn Kiếm, Hà Nội',
    id_nhom: 'cg-1',
    ten_nhom: 'Khách hàng VIP',
    tong_chi_tieu: 980000000,
    lan_cuoi_mua: '2024-12-28T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2022-01-20T00:00:00Z',
    tg_cap_nhat: '2024-12-28T00:00:00Z'
  },
  // Doanh nghiệp
  {
    id: 'cus-004',
    ma_kh: 'KH004',
    ho_ten: 'Công ty TNHH Phần mềm ABC',
    so_dien_thoai: '0909123456',
    email: 'admin@abc-software.vn',
    dia_chi: 'Số 88 Duy Tân, Cầu Giấy, Hà Nội',
    id_nhom: 'cg-2',
    ten_nhom: 'Doanh nghiệp',
    tong_chi_tieu: 125000000,
    lan_cuoi_mua: '2025-01-10T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2023-04-15T00:00:00Z',
    tg_cap_nhat: '2025-01-10T00:00:00Z'
  },
  {
    id: 'cus-005',
    ma_kh: 'KH005',
    ho_ten: 'Công ty CP Xây dựng Hòa Bình',
    so_dien_thoai: '0283838888',
    email: 'office@hbc.com.vn',
    dia_chi: 'Quận 3, TP. Hồ Chí Minh',
    id_nhom: 'cg-2',
    ten_nhom: 'Doanh nghiệp',
    tong_chi_tieu: 320000000,
    lan_cuoi_mua: '2024-11-20T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2022-08-10T00:00:00Z',
    tg_cap_nhat: '2024-11-20T00:00:00Z'
  },
  {
    id: 'cus-006',
    ma_kh: 'KH006',
    ho_ten: 'Công ty TNHH Thương mại Minh Phát',
    so_dien_thoai: '0912345678',
    email: 'minhphat.trading@gmail.com',
    dia_chi: 'Số 45 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    id_nhom: 'cg-2',
    ten_nhom: 'Doanh nghiệp',
    tong_chi_tieu: 85000000,
    lan_cuoi_mua: '2024-10-05T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2023-06-20T00:00:00Z',
    tg_cap_nhat: '2024-10-05T00:00:00Z'
  },
  {
    id: 'cus-007',
    ma_kh: 'KH007',
    ho_ten: 'Công ty TNHH Dịch vụ Du lịch Sao Việt',
    so_dien_thoai: '0905678901',
    email: 'info@saoviet-travel.vn',
    dia_chi: 'Quận Hải Châu, TP. Đà Nẵng',
    id_nhom: 'cg-2',
    ten_nhom: 'Doanh nghiệp',
    tong_chi_tieu: 65000000,
    lan_cuoi_mua: '2024-12-15T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2023-09-10T00:00:00Z',
    tg_cap_nhat: '2024-12-15T00:00:00Z'
  },
  // Khách lẻ
  {
    id: 'cus-008',
    ma_kh: 'KH008',
    ho_ten: 'Nguyễn Văn Hùng',
    so_dien_thoai: '0987654321',
    email: 'hungnv1985@gmail.com',
    dia_chi: 'Quận Đống Đa, Hà Nội',
    id_nhom: 'cg-3',
    ten_nhom: 'Khách lẻ',
    tong_chi_tieu: 15000000,
    lan_cuoi_mua: '2024-09-20T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2024-03-15T00:00:00Z',
    tg_cap_nhat: '2024-09-20T00:00:00Z'
  },
  {
    id: 'cus-009',
    ma_kh: 'KH009',
    ho_ten: 'Trần Thị Lan',
    so_dien_thoai: '0977888999',
    email: 'lantt.work@gmail.com',
    dia_chi: 'Quận Thanh Xuân, Hà Nội',
    id_nhom: 'cg-3',
    ten_nhom: 'Khách lẻ',
    tong_chi_tieu: 8500000,
    lan_cuoi_mua: '2024-11-10T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2024-05-20T00:00:00Z',
    tg_cap_nhat: '2024-11-10T00:00:00Z'
  },
  {
    id: 'cus-010',
    ma_kh: 'KH010',
    ho_ten: 'Lê Minh Tuấn',
    so_dien_thoai: '0916789012',
    email: 'tuanlm92@outlook.com',
    dia_chi: 'Quận Ba Đình, Hà Nội',
    id_nhom: 'cg-3',
    ten_nhom: 'Khách lẻ',
    tong_chi_tieu: 22000000,
    lan_cuoi_mua: '2025-01-05T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2023-11-10T00:00:00Z',
    tg_cap_nhat: '2025-01-05T00:00:00Z'
  },
  {
    id: 'cus-011',
    ma_kh: 'KH011',
    ho_ten: 'Phạm Thị Hương',
    so_dien_thoai: '0938456789',
    email: 'phamhuong.design@gmail.com',
    dia_chi: 'Quận 7, TP. Hồ Chí Minh',
    id_nhom: 'cg-3',
    ten_nhom: 'Khách lẻ',
    tong_chi_tieu: 35000000,
    lan_cuoi_mua: '2024-12-20T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2023-07-25T00:00:00Z',
    tg_cap_nhat: '2024-12-20T00:00:00Z'
  },
  // Đại lý
  {
    id: 'cus-012',
    ma_kh: 'KH012',
    ho_ten: 'Đại lý Tin học Số 1 Bắc Ninh',
    so_dien_thoai: '0222356789',
    email: 'tinhocso1.bn@gmail.com',
    dia_chi: 'TP. Bắc Ninh, Bắc Ninh',
    id_nhom: 'cg-4',
    ten_nhom: 'Đại lý',
    tong_chi_tieu: 450000000,
    lan_cuoi_mua: '2025-01-18T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2022-05-15T00:00:00Z',
    tg_cap_nhat: '2025-01-18T00:00:00Z'
  },
  {
    id: 'cus-013',
    ma_kh: 'KH013',
    ho_ten: 'Đại lý Vi tính Hải Phòng',
    so_dien_thoai: '0225888999',
    email: 'vitinhhaiphong@yahoo.com',
    dia_chi: 'Quận Ngô Quyền, Hải Phòng',
    id_nhom: 'cg-4',
    ten_nhom: 'Đại lý',
    tong_chi_tieu: 280000000,
    lan_cuoi_mua: '2024-12-30T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2023-01-20T00:00:00Z',
    tg_cap_nhat: '2024-12-30T00:00:00Z'
  },
  // Cơ quan nhà nước
  {
    id: 'cus-014',
    ma_kh: 'KH014',
    ho_ten: 'Sở Thông tin và Truyền thông Hà Nội',
    so_dien_thoai: '0243825656',
    email: 'vptttt.hn@mic.gov.vn',
    dia_chi: 'Số 185 Giảng Võ, Ba Đình, Hà Nội',
    id_nhom: 'cg-5',
    ten_nhom: 'Cơ quan nhà nước',
    tong_chi_tieu: 520000000,
    lan_cuoi_mua: '2024-11-25T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2022-04-10T00:00:00Z',
    tg_cap_nhat: '2024-11-25T00:00:00Z'
  },
  {
    id: 'cus-015',
    ma_kh: 'KH015',
    ho_ten: 'UBND Quận Cầu Giấy',
    so_dien_thoai: '0243765432',
    email: 'ubnd.caugiay@hanoi.gov.vn',
    dia_chi: 'Số 36 Cầu Giấy, Cầu Giấy, Hà Nội',
    id_nhom: 'cg-5',
    ten_nhom: 'Cơ quan nhà nước',
    tong_chi_tieu: 185000000,
    lan_cuoi_mua: '2024-10-15T00:00:00Z',
    trang_thai: 1,
    tg_tao: '2023-03-05T00:00:00Z',
    tg_cap_nhat: '2024-10-15T00:00:00Z'
  },
  // Khách hàng ngừng hợp tác
  {
    id: 'cus-016',
    ma_kh: 'KH016',
    ho_ten: 'Công ty TNHH XYZ (Đã đóng cửa)',
    so_dien_thoai: '0901234000',
    email: 'xyz.closed@old.com',
    dia_chi: 'Quận Hai Bà Trưng, Hà Nội',
    id_nhom: 'cg-2',
    ten_nhom: 'Doanh nghiệp',
    tong_chi_tieu: 45000000,
    lan_cuoi_mua: '2023-06-15T00:00:00Z',
    trang_thai: 0, // Ngừng giao dịch
    tg_tao: '2022-09-10T00:00:00Z',
    tg_cap_nhat: '2023-06-15T00:00:00Z'
  },
];

// Helpers
export const getCustomerGroupName = (id: string): string => {
  return MOCK_CUSTOMER_GROUPS.find(g => g.id === id)?.ten_nhom || 'Không xác định';
};

export const getCustomerName = (id: string): string => {
  return MOCK_CUSTOMERS.find(c => c.id === id)?.ho_ten || 'Không xác định';
};
