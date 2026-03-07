import type { PayrollWifiIp, PayrollAdminFormGroup, PayrollPointGroup } from '../features/hanh-chinh/thiet-lap-cong-luong/core/types';
import type { AdminFormRequest } from '../features/hanh-chinh/phieu-hanh-chinh/core/types';
import type { DiemCongTruRecord } from '../features/hanh-chinh/diem-cong-tru/core/types';
import type { KpiTheoChucVu, ChamDiemKpiRecord, ChamDiemKpiChiTietItem } from '../features/hanh-chinh/cham-diem-kpi/core/types';
import type { LuongNhanVienConfig } from '../features/hanh-chinh/bang-luong/core/types';
import type { LoaiTaiLieu, TrangThaiTaiLieu, NhomTaiLieu } from '../features/hanh-chinh/thiet-lap-tai-lieu/core/types';
import type { TaiLieu } from '../features/hanh-chinh/tai-lieu/core/types';
import type { HoSo } from '../features/hanh-chinh/luu-tru-ho-so/core/types';
import type { AssetStorageLocation, AssetStatus, AssetGroup } from '../features/hanh-chinh/thiet-lap-tai-san/core/types';
import type { TaiSan } from '../features/hanh-chinh/danh-muc-tai-san/core/types';
import type { PhieuCapPhatThuHoi } from '../features/hanh-chinh/cap-phat-thu-hoi/core/types';
import type { PhieuBaoTriSuaChua } from '../features/hanh-chinh/bao-tri-sua-chua/core/types';

const toDateString = (date: Date) => date.toISOString().slice(0, 10);
const toIsoString = (date: Date) => date.toISOString();
const addDays = (base: Date, days: number) => new Date(base.getTime() + days * 86400000);

export const MOCK_PAYROLL_WIFI_IPS: PayrollWifiIp[] = [
  {
    id: 'wifi-1',
    id_chi_nhanh: 'branch-1',
    ten_chi_nhanh: 'Chi nhánh TP. Hồ Chí Minh',
    ip_wifi: '192.168.10.10',
    ghi_chu: 'Văn phòng tầng 3',
    trang_thai: 1,
    tg_tao: '2025-01-10T08:00:00Z',
    tg_cap_nhat: '2025-01-12T09:30:00Z',
  },
  {
    id: 'wifi-2',
    id_chi_nhanh: 'branch-1',
    ten_chi_nhanh: 'Chi nhánh TP. Hồ Chí Minh',
    ip_wifi: '192.168.10.11',
    ghi_chu: 'Khu sản xuất',
    trang_thai: 1,
    tg_tao: '2025-01-10T08:00:00Z',
    tg_cap_nhat: '2025-01-12T09:30:00Z',
  },
  {
    id: 'wifi-3',
    id_chi_nhanh: 'branch-2',
    ten_chi_nhanh: 'Chi nhánh Hà Nội',
    ip_wifi: '10.10.0.20',
    ghi_chu: 'Tầng 2 - phòng Nhân sự',
    trang_thai: 1,
    tg_tao: '2025-01-15T08:00:00Z',
    tg_cap_nhat: '2025-01-20T10:20:00Z',
  },
  {
    id: 'wifi-4',
    id_chi_nhanh: 'branch-2',
    ten_chi_nhanh: 'Chi nhánh Hà Nội',
    ip_wifi: '10.10.0.21',
    ghi_chu: 'Sảnh tiếp tân',
    trang_thai: 0,
    tg_tao: '2025-01-15T08:00:00Z',
    tg_cap_nhat: '2025-01-25T15:45:00Z',
  },
  {
    id: 'wifi-5',
    id_chi_nhanh: 'branch-3',
    ten_chi_nhanh: 'Chi nhánh Đà Nẵng',
    ip_wifi: '172.16.5.5',
    ghi_chu: 'Văn phòng chính',
    trang_thai: 1,
    tg_tao: '2025-02-02T08:00:00Z',
    tg_cap_nhat: '2025-02-05T09:00:00Z',
  },
];

export const MOCK_PAYROLL_ADMIN_FORM_GROUPS: PayrollAdminFormGroup[] = [
  {
    id: 'group-1',
    loai_phieu: 'late_early',
    so_luong_thang: 3,
    ghi_chu: 'Áp dụng cho toàn công ty',
    trang_thai: 1,
    tg_tao: '2025-01-05T08:00:00Z',
    tg_cap_nhat: '2025-01-15T09:30:00Z',
  },
  {
    id: 'group-2',
    loai_phieu: 'business_trip',
    so_luong_thang: 6,
    ghi_chu: 'Giới hạn theo cấp bậc',
    trang_thai: 1,
    tg_tao: '2025-01-06T08:00:00Z',
    tg_cap_nhat: '2025-01-20T10:20:00Z',
  },
  {
    id: 'group-3',
    loai_phieu: 'missed_checkin',
    so_luong_thang: 2,
    ghi_chu: 'Dùng cho trường hợp quên chấm công',
    trang_thai: 1,
    tg_tao: '2025-01-07T08:00:00Z',
    tg_cap_nhat: '2025-01-22T15:45:00Z',
  },
  {
    id: 'group-4',
    loai_phieu: 'overtime',
    so_luong_thang: 10,
    ghi_chu: 'Không giới hạn theo bộ phận',
    trang_thai: 1,
    tg_tao: '2025-01-08T08:00:00Z',
    tg_cap_nhat: '2025-01-25T11:00:00Z',
  },
  {
    id: 'group-5',
    loai_phieu: 'leave_unpaid',
    so_luong_thang: 2,
    ghi_chu: 'Không lương',
    trang_thai: 1,
    tg_tao: '2025-01-09T08:00:00Z',
    tg_cap_nhat: '2025-01-30T14:00:00Z',
  },
  {
    id: 'group-6',
    loai_phieu: 'leave_paid',
    so_luong_thang: 12,
    ghi_chu: 'Nghỉ phép năm',
    trang_thai: 1,
    tg_tao: '2025-01-10T08:00:00Z',
    tg_cap_nhat: '2025-02-01T09:10:00Z',
  },
];

/** Hạng mục điểm cộng/trừ (thiết lập trong Thiết lập công lương > Nhóm điểm cộng trừ) */
export const MOCK_PAYROLL_POINT_GROUPS: PayrollPointGroup[] = [
  { id: 'pg-1', ma: 'VUOT_KPI', ten: 'Hoàn thành vượt KPI', loai: 'cong', thu_tu: 1, ghi_chu: 'Đạt trên 100% chỉ tiêu', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-2', ma: 'SANG_KIEN', ten: 'Sáng kiến cải tiến', loai: 'cong', thu_tu: 2, ghi_chu: 'Đề xuất được áp dụng', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-3', ma: 'HO_TRO_DONG_NGHIEP', ten: 'Hỗ trợ đồng nghiệp', loai: 'cong', thu_tu: 3, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-4', ma: 'DAO_TAO_NOI_BO', ten: 'Đào tạo nội bộ', loai: 'cong', thu_tu: 4, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-5', ma: 'CHUYEN_CAN', ten: 'Chuyên cần (không đi trễ/về sớm)', loai: 'cong', thu_tu: 5, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-6', ma: 'TANG_CA_TU_NGUYEN', ten: 'Tự nguyện tăng ca', loai: 'cong', thu_tu: 6, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-7', ma: 'DAT_GIAI_THI_DUA', ten: 'Đạt giải thi đua', loai: 'cong', thu_tu: 7, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-8', ma: 'DI_MUON', ten: 'Đi muộn', loai: 'tru', thu_tu: 10, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-9', ma: 'VE_SOM', ten: 'Về sớm', loai: 'tru', thu_tu: 11, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-10', ma: 'VI_PHAM_NOI_QUY', ten: 'Vi phạm nội quy', loai: 'tru', thu_tu: 12, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-11', ma: 'SAI_SOT_CONG_VIEC', ten: 'Sai sót công việc', loai: 'tru', thu_tu: 13, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-12', ma: 'KHONG_HOAN_THANH_KPI', ten: 'Không hoàn thành KPI', loai: 'tru', thu_tu: 14, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-13', ma: 'NGHI_KHONG_PHEP', ten: 'Nghỉ không phép', loai: 'tru', thu_tu: 15, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'pg-14', ma: 'QUEN_CHAM_CONG', ten: 'Quên chấm công', loai: 'tru', thu_tu: 16, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Nơi lưu tài sản (Thiết lập tài sản) - liên kết Chi nhánh */
export const MOCK_ASSET_STORAGE_LOCATIONS: AssetStorageLocation[] = [
  { id: 'noi-luu-1', id_chi_nhanh: 'branch-1', ten_chi_nhanh: 'Chi nhánh TP. Hồ Chí Minh', ma_noi_luu: 'VP-HCM-T3', ten_noi_luu: 'Văn phòng tầng 3', ghi_chu: 'Khu vực hành chính', trang_thai: 1, tg_tao: '2025-01-10T08:00:00Z', tg_cap_nhat: '2025-01-12T09:30:00Z' },
  { id: 'noi-luu-2', id_chi_nhanh: 'branch-1', ten_chi_nhanh: 'Chi nhánh TP. Hồ Chí Minh', ma_noi_luu: 'KHO-HCM-01', ten_noi_luu: 'Kho tài sản 1', ghi_chu: 'Tầng hầm B1', trang_thai: 1, tg_tao: '2025-01-10T08:00:00Z', tg_cap_nhat: '2025-01-12T09:30:00Z' },
  { id: 'noi-luu-3', id_chi_nhanh: 'branch-2', ten_chi_nhanh: 'Chi nhánh Hà Nội', ma_noi_luu: 'VP-HN-T2', ten_noi_luu: 'Văn phòng tầng 2', ghi_chu: 'Phòng Nhân sự', trang_thai: 1, tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-20T10:20:00Z' },
  { id: 'noi-luu-4', id_chi_nhanh: 'branch-2', ten_chi_nhanh: 'Chi nhánh Hà Nội', ma_noi_luu: 'KHO-HN-01', ten_noi_luu: 'Kho thiết bị', trang_thai: 0, tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-25T15:45:00Z' },
  { id: 'noi-luu-5', id_chi_nhanh: 'branch-3', ten_chi_nhanh: 'Chi nhánh Đà Nẵng', ma_noi_luu: 'VP-DN', ten_noi_luu: 'Văn phòng chính', ghi_chu: 'Tòa nhà A', trang_thai: 1, tg_tao: '2025-02-02T08:00:00Z', tg_cap_nhat: '2025-02-05T09:00:00Z' },
];

/** Trạng thái tài sản (Thiết lập tài sản) */
export const MOCK_ASSET_STATUSES: AssetStatus[] = [
  { id: 'tt-1', ma: 'MOI', ten: 'Mới', thu_tu: 1, ghi_chu: 'Tài sản mới nhập', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tt-2', ma: 'DANG_SU_DUNG', ten: 'Đang sử dụng', thu_tu: 2, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tt-3', ma: 'BAO_TRI', ten: 'Bảo trì', thu_tu: 3, ghi_chu: 'Đang bảo trì/sửa chữa', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tt-4', ma: 'CAP_PHAT', ten: 'Đã cấp phát', thu_tu: 4, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tt-5', ma: 'THU_HOI', ten: 'Đã thu hồi', thu_tu: 5, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tt-6', ma: 'THANH_LY', ten: 'Thanh lý', thu_tu: 6, ghi_chu: 'Đã thanh lý', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'tt-7', ma: 'MAT_HONG', ten: 'Mất / Hỏng', thu_tu: 7, trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Nhóm tài sản chuyên nghiệp (Thiết lập tài sản) */
export const MOCK_ASSET_GROUPS: AssetGroup[] = [
  { id: 'nhom-1', ma: 'TBD_VAN_PHONG', ten: 'Thiết bị văn phòng', thu_tu: 1, ghi_chu: 'Máy tính, máy in, điều hòa...', trang_thai: 1, phuong_phap_khau_hao: 'duong_thang', ty_le_khau_hao: 20, so_nam_su_dung: 5, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'nhom-2', ma: 'TBD_CNTT', ten: 'Thiết bị CNTT', thu_tu: 2, ghi_chu: 'Server, laptop, màn hình', trang_thai: 1, phuong_phap_khau_hao: 'duong_thang', ty_le_khau_hao: 25, so_nam_su_dung: 4, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'nhom-3', ma: 'XE_CONG_TY', ten: 'Xe công ty', thu_tu: 3, trang_thai: 1, phuong_phap_khau_hao: 'duong_thang', ty_le_khau_hao: 16.67, so_nam_su_dung: 6, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'nhom-4', ma: 'NHA_XUONG', ten: 'Nhà xưởng - Cơ sở vật chất', thu_tu: 4, trang_thai: 1, phuong_phap_khau_hao: 'duong_thang', so_nam_su_dung: 20, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'nhom-5', ma: 'MAY_MOC', ten: 'Máy móc thiết bị sản xuất', thu_tu: 5, ghi_chu: 'Dây chuyền, máy công nghiệp', trang_thai: 1, phuong_phap_khau_hao: 'duong_thang', ty_le_khau_hao: 10, so_nam_su_dung: 10, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'nhom-6', ma: 'TB_CHUYEN_DUNG', ten: 'Thiết bị chuyên dùng', thu_tu: 6, trang_thai: 1, phuong_phap_khau_hao: 'so_du_giam_dan', ty_le_khau_hao: 25, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Ảnh mẫu cho tài sản (placeholder) */
const SAMPLE_ASSET_IMAGES = [
  'https://picsum.photos/seed/ts1/200/200',
  'https://picsum.photos/seed/ts2/200/200',
  'https://picsum.photos/seed/ts3/200/200',
  'https://picsum.photos/seed/ts4/200/200',
  'https://picsum.photos/seed/ts5/200/200',
  'https://picsum.photos/seed/ts6/200/200',
  'https://picsum.photos/seed/ts7/200/200',
];

/** Danh sách tài sản (Danh mục tài sản) */
export const MOCK_TAI_SAN: TaiSan[] = [
  { id: 'ts-1', ma_tai_san: 'TS-VP-001', ten_tai_san: 'Laptop Dell XPS 15', id_nhom: 'nhom-2', id_noi_luu: 'noi-luu-1', id_trang_thai: 'tt-4', id_nhan_vien_dang_giu: 'emp-000', ngay_nhap: '2024-06-01', nguyen_gia: 28000000, ngay_bat_dau_trich_khau_hao: '2024-06-01', gia_tri_con_lai: 23800000, khau_hao_luy_ke: 4200000, hinh_anh: SAMPLE_ASSET_IMAGES[0], ghi_chu: 'Cấp phát cho quản lý', trang_thai: 1, tg_tao: '2024-06-01T08:00:00Z', tg_cap_nhat: '2025-01-10T09:00:00Z' },
  { id: 'ts-2', ma_tai_san: 'TS-VP-002', ten_tai_san: 'Màn hình LG 27"', id_nhom: 'nhom-2', id_noi_luu: 'noi-luu-1', id_trang_thai: 'tt-4', id_nhan_vien_dang_giu: 'emp-000', ngay_nhap: '2024-05-15', nguyen_gia: 5500000, ngay_bat_dau_trich_khau_hao: '2024-05-15', gia_tri_con_lai: 4675000, khau_hao_luy_ke: 825000, hinh_anh: SAMPLE_ASSET_IMAGES[1], trang_thai: 1, tg_tao: '2024-05-15T08:00:00Z', tg_cap_nhat: '2025-01-10T09:00:00Z' },
  { id: 'ts-3', ma_tai_san: 'TS-VP-003', ten_tai_san: 'Máy in HP LaserJet', id_nhom: 'nhom-1', id_noi_luu: 'noi-luu-1', id_trang_thai: 'tt-2', ngay_nhap: '2023-10-01', nguyen_gia: 12000000, ngay_bat_dau_trich_khau_hao: '2023-10-01', gia_tri_con_lai: 9000000, khau_hao_luy_ke: 3000000, hinh_anh: SAMPLE_ASSET_IMAGES[2], ghi_chu: 'Dùng chung văn phòng', trang_thai: 1, tg_tao: '2023-10-01T08:00:00Z', tg_cap_nhat: '2025-01-12T10:00:00Z' },
  { id: 'ts-4', ma_tai_san: 'TS-VP-004', ten_tai_san: 'Điều hòa Daikin 2 HP', id_nhom: 'nhom-1', id_noi_luu: 'noi-luu-1', id_trang_thai: 'tt-2', ngay_nhap: '2023-03-01', nguyen_gia: 25000000, ngay_bat_dau_trich_khau_hao: '2023-03-01', gia_tri_con_lai: null, khau_hao_luy_ke: null, hinh_anh: SAMPLE_ASSET_IMAGES[3], trang_thai: 1, tg_tao: '2023-03-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ts-5', ma_tai_san: 'TS-KHO-001', ten_tai_san: 'Laptop dự phòng Acer', id_nhom: 'nhom-2', id_noi_luu: 'noi-luu-2', id_trang_thai: 'tt-1', ngay_nhap: '2024-09-01', nguyen_gia: 15000000, ngay_bat_dau_trich_khau_hao: '2024-09-01', gia_tri_con_lai: 15000000, khau_hao_luy_ke: 0, hinh_anh: SAMPLE_ASSET_IMAGES[4], trang_thai: 1, tg_tao: '2024-09-01T08:00:00Z', tg_cap_nhat: '2024-09-01T08:00:00Z' },
  { id: 'ts-6', ma_tai_san: 'TS-HN-001', ten_tai_san: 'Máy chiếu Epson', id_nhom: 'nhom-1', id_noi_luu: 'noi-luu-3', id_trang_thai: 'tt-2', ngay_nhap: '2024-01-15', nguyen_gia: 18000000, ngay_bat_dau_trich_khau_hao: '2024-01-15', gia_tri_con_lai: null, khau_hao_luy_ke: null, hinh_anh: SAMPLE_ASSET_IMAGES[5], trang_thai: 1, tg_tao: '2024-01-15T08:00:00Z', tg_cap_nhat: '2025-01-20T10:00:00Z' },
  { id: 'ts-7', ma_tai_san: 'TS-VP-005', ten_tai_san: 'Bàn làm việc văn phòng', id_nhom: 'nhom-1', id_noi_luu: 'noi-luu-1', id_trang_thai: 'tt-2', ngay_nhap: '2022-06-01', nguyen_gia: 3500000, ngay_bat_dau_trich_khau_hao: '2022-06-01', gia_tri_con_lai: null, khau_hao_luy_ke: null, hinh_anh: SAMPLE_ASSET_IMAGES[6], trang_thai: 1, tg_tao: '2022-06-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  ];

export const MOCK_PHIEU_CAP_PHAT_THU_HOI: PhieuCapPhatThuHoi[] = [
  {
    id: 'phieu-1',
    loai_phieu: 'cap_phat',
    id_tai_san: 'ts-5',
    ma_tai_san: 'TS-KHO-001',
    ten_tai_san: 'Laptop dự phòng Acer',
    id_noi_luu_truoc: 'noi-luu-2',
    ten_noi_luu_truoc: 'Kho VP HCM',
    id_noi_luu_sau: 'noi-luu-1',
    ten_noi_luu_sau: 'Văn phòng HCM',
    id_nguoi_giu_truoc: null,
    ten_nguoi_giu_truoc: null,
    ma_nguoi_giu_truoc: null,
    id_nguoi_giu_sau: 'emp-000',
    ten_nguoi_giu_sau: 'Nguyễn Văn A',
    ma_nguoi_giu_sau: 'NV001',
    ngay_thuc_hien: '2025-01-15',
    id_nguoi_thuc_hien: 'emp-000',
    ten_nguoi_thuc_hien: 'Nguyễn Văn A',
    ghi_chu: 'Cấp phát cho nhân viên mới',
    trang_thai: 1,
    tg_tao: '2025-01-15T08:00:00Z',
    tg_cap_nhat: '2025-01-15T08:00:00Z',
  },
  {
    id: 'phieu-2',
    loai_phieu: 'thu_hoi',
    id_tai_san: 'ts-1',
    ma_tai_san: 'TS-VP-001',
    ten_tai_san: 'Laptop Dell XPS 15',
    id_noi_luu_truoc: 'noi-luu-1',
    ten_noi_luu_truoc: 'Văn phòng HCM',
    id_noi_luu_sau: 'noi-luu-2',
    ten_noi_luu_sau: 'Kho VP HCM',
    id_nguoi_giu_truoc: 'emp-000',
    ten_nguoi_giu_truoc: 'Nguyễn Văn A',
    ma_nguoi_giu_truoc: 'NV001',
    id_nguoi_giu_sau: null,
    ten_nguoi_giu_sau: null,
    ma_nguoi_giu_sau: null,
    ngay_thuc_hien: '2025-01-20',
    id_nguoi_thuc_hien: 'emp-000',
    ten_nguoi_thuc_hien: 'Nguyễn Văn A',
    ghi_chu: 'Thu hồi khi nghỉ việc',
    trang_thai: 1,
    tg_tao: '2025-01-20T09:00:00Z',
    tg_cap_nhat: '2025-01-20T09:00:00Z',
  },
  {
    id: 'phieu-3',
    loai_phieu: 'luan_chuyen_vi_tri',
    id_tai_san: 'ts-6',
    ma_tai_san: 'TS-HN-001',
    ten_tai_san: 'Máy chiếu Epson',
    id_noi_luu_truoc: 'noi-luu-3',
    ten_noi_luu_truoc: 'Văn phòng HN',
    id_noi_luu_sau: 'noi-luu-1',
    ten_noi_luu_sau: 'Văn phòng HCM',
    id_nguoi_giu_truoc: null,
    ten_nguoi_giu_truoc: null,
    id_nguoi_giu_sau: null,
    ten_nguoi_giu_sau: null,
    ngay_thuc_hien: '2025-02-01',
    id_nguoi_thuc_hien: 'emp-000',
    ten_nguoi_thuc_hien: 'Nguyễn Văn A',
    ghi_chu: 'Chuyển máy chiếu về HCM',
    trang_thai: 1,
    tg_tao: '2025-02-01T10:00:00Z',
    tg_cap_nhat: '2025-02-01T10:00:00Z',
  },
  ];

/** Loại tài liệu (Thiết lập tài liệu) - áp dụng chung */
export const MOCK_LOAI_TAI_LIEU: LoaiTaiLieu[] = [
  { id: 'ltl-1', ma: 'CV', ten: 'Công văn', ghi_chu: 'Văn bản giao dịch', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ltl-2', ma: 'QD', ten: 'Quyết định', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ltl-3', ma: 'BC', ten: 'Báo cáo', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ltl-4', ma: 'HD', ten: 'Hợp đồng', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ltl-5', ma: 'TB', ten: 'Thông báo', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ltl-6', ma: 'TT', ten: 'Tờ trình', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ltl-7', ma: 'BB', ten: 'Biên bản', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ltl-8', ma: 'BCTH', ten: 'Báo cáo tài chính', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Trạng thái tài liệu (Thiết lập tài liệu) */
export const MOCK_TRANG_THAI_TAI_LIEU: TrangThaiTaiLieu[] = [
  { id: 'ttl-1', ma: 'NHAP', ten: 'Nháp', thu_tu: 1, mau: '#94a3b8', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttl-2', ma: 'CHO_DUYET', ten: 'Chờ duyệt', thu_tu: 2, mau: '#f59e0b', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttl-3', ma: 'DA_DUYET', ten: 'Đã duyệt', thu_tu: 3, mau: '#3b82f6', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttl-4', ma: 'DA_KY', ten: 'Đã ký', thu_tu: 4, mau: '#22c55e', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttl-5', ma: 'DA_GUI', ten: 'Đã gửi', thu_tu: 5, mau: '#6366f1', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttl-6', ma: 'LUU_TRU', ten: 'Lưu trữ', thu_tu: 6, mau: '#64748b', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ttl-7', ma: 'HUY', ten: 'Hủy', thu_tu: 7, mau: '#ef4444', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Nhóm tài liệu (Thiết lập tài liệu) */
export const MOCK_NHOM_TAI_LIEU: NhomTaiLieu[] = [
  { id: 'ntl-1', ma: 'VB_DEN', ten: 'Văn bản đến', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ntl-2', ma: 'VB_DI', ten: 'Văn bản đi', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ntl-3', ma: 'VB_NOI_BO', ten: 'Văn bản nội bộ', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ntl-4', ma: 'HD_NS', ten: 'Hồ sơ nhân sự', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
  { id: 'ntl-5', ma: 'HD_TC', ten: 'Hồ sơ tài chính', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-01T08:00:00Z' },
];

/** Map id phòng ban -> tên (dùng enrich tài liệu / hồ sơ) */
export const PHONG_BAN_NAMES: Record<string, string> = {
  'dep-0': 'Ban Giám đốc',
  'dep-1': 'Phòng Kỹ thuật',
  'dep-2': 'Phòng Nhân sự',
  'dep-3': 'Phòng Tài chính - Kế toán',
  'dep-4': 'Phòng Kinh doanh',
  'dep-5': 'Phòng Kho',
  'dep-6': 'Phòng Marketing',
  'dep-7': 'Phòng Hành chính',
  'dep-7-1': 'Nhóm Văn phòng',
  'dep-7-2': 'Nhóm Tổ chức sự kiện',
  'dep-1-1': 'Nhóm Phát triển phần mềm',
  'dep-1-2': 'Nhóm Hạ tầng IT',
};

/** Hồ sơ (Lưu trữ hồ sơ - con của Tài liệu, 1 tài liệu có nhiều hồ sơ) */
export const MOCK_HO_SO: HoSo[] = [
  { id: 'hs-1', id_tai_lieu: 'tl-1', ma_ho_so: 'HS-2025-01', ten_ho_so: 'Hồ sơ nhân sự quý I/2025', id_phong_ban: 'dep-2', thoi_han_luu_tru: '2030-12-31', mo_ta: 'Hợp đồng, quyết định nhân sự', trang_thai: 1, tg_tao: '2025-01-01T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'hs-2', id_tai_lieu: 'tl-2', ma_ho_so: 'HS-2025-02', ten_ho_so: 'Hồ sơ công văn đến/đi', id_phong_ban: 'dep-7', thoi_han_luu_tru: '2030-12-31', mo_ta: 'Công văn trao đổi với cơ quan nhà nước', trang_thai: 1, tg_tao: '2025-01-05T08:00:00Z', tg_cap_nhat: '2025-01-20T10:00:00Z' },
  { id: 'hs-3', id_tai_lieu: 'tl-1', ma_ho_so: 'HS-2024-12', ten_ho_so: 'Hồ sơ nội quy công ty', id_phong_ban: 'dep-7', mo_ta: 'Quyết định, thông báo nội quy', trang_thai: 1, tg_tao: '2024-12-01T08:00:00Z', tg_cap_nhat: '2025-01-10T09:00:00Z' },
  { id: 'hs-4', id_tai_lieu: 'tl-6', ma_ho_so: 'HS-2025-03', ten_ho_so: 'Hồ sơ dự án đầu tư', id_phong_ban: 'dep-1', thoi_han_luu_tru: '2035-12-31', mo_ta: 'Tờ trình, quyết định phê duyệt dự án', trang_thai: 1, tg_tao: '2025-02-01T08:00:00Z', tg_cap_nhat: '2025-02-05T14:00:00Z' },
  { id: 'hs-5', id_tai_lieu: 'tl-4', ma_ho_so: 'HS-2025-04', ten_ho_so: 'Hồ sơ đấu thầu', id_phong_ban: 'dep-4', thoi_han_luu_tru: '2032-06-30', mo_ta: 'Hồ sơ mời thầu, biên bản mở thầu', trang_thai: 1, tg_tao: '2025-02-10T08:00:00Z', tg_cap_nhat: '2025-02-12T11:00:00Z' },
];

/** Tài liệu / Văn bản (Danh sách tài liệu) */
export const MOCK_TAI_LIEU: TaiLieu[] = [
  { id: 'tl-1', ma_so: 'TL-2025-001', huong: 'noi_bo', id_loai: 'ltl-2', id_trang_thai: 'ttl-4', trich_yeu: 'Quyết định ban hành nội quy công ty', id_phong_ban: 'dep-7', ghi_chu: 'Lưu nội bộ', tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'tl-2', ma_so: 'TL-2025-002', huong: 'den', id_loai: 'ltl-1', id_trang_thai: 'ttl-4', trich_yeu: 'Công văn đề nghị cung cấp hồ sơ', so_den: '123/CV', ngay_den: '2025-01-10', noi_gui: 'Sở Kế hoạch và Đầu tư', id_phong_ban: 'dep-7', tg_tao: '2025-01-10T09:00:00Z', tg_cap_nhat: '2025-01-10T09:00:00Z' },
  { id: 'tl-3', ma_so: 'TL-2025-003', huong: 'di', id_loai: 'ltl-1', id_trang_thai: 'ttl-5', trich_yeu: 'Công văn trả lời đề nghị', so_di: '45/CV-UB', ngay_ky: '2025-01-12', noi_nhan: 'UBND quận 1', id_phong_ban: 'dep-7', tg_tao: '2025-01-12T14:00:00Z', tg_cap_nhat: '2025-01-12T14:00:00Z' },
  { id: 'tl-4', ma_so: 'TL-2025-004', huong: 'noi_bo', id_loai: 'ltl-3', id_trang_thai: 'ttl-2', trich_yeu: 'Báo cáo tổng kết tháng 1/2025', id_phong_ban: 'dep-7', tg_tao: '2025-02-01T08:00:00Z', tg_cap_nhat: '2025-02-01T08:00:00Z' },
  { id: 'tl-5', ma_so: 'TL-2025-005', huong: 'den', id_loai: 'ltl-1', id_trang_thai: 'ttl-3', trich_yeu: 'Công văn hướng dẫn thủ tục', so_den: '456/HD', ngay_den: '2025-01-20', noi_gui: 'Bộ Nội vụ', id_phong_ban: 'dep-7', tg_tao: '2025-01-20T10:00:00Z', tg_cap_nhat: '2025-01-20T10:00:00Z' },
  { id: 'tl-6', ma_so: 'TL-2025-006', huong: 'noi_bo', id_loai: 'ltl-6', id_trang_thai: 'ttl-2', trich_yeu: 'Tờ trình đề xuất mua sắm thiết bị văn phòng', id_phong_ban: 'dep-1', ghi_chu: 'Trình BGĐ phê duyệt', tg_tao: '2025-02-03T08:00:00Z', tg_cap_nhat: '2025-02-03T08:00:00Z' },
  { id: 'tl-7', ma_so: 'TL-2025-007', huong: 'noi_bo', id_loai: 'ltl-7', id_trang_thai: 'ttl-4', trich_yeu: 'Biên bản họp Hội đồng quản trị tháng 1/2025', id_phong_ban: 'dep-1', tg_tao: '2025-01-25T14:00:00Z', tg_cap_nhat: '2025-01-26T09:00:00Z' },
  { id: 'tl-8', ma_so: 'TL-2025-008', huong: 'di', id_loai: 'ltl-1', id_trang_thai: 'ttl-5', trich_yeu: 'Công văn mời họp giao ban quý I', so_di: '78/CV-HC', ngay_ky: '2025-02-05', noi_nhan: 'Các phòng ban', id_phong_ban: 'dep-7', tg_tao: '2025-02-05T08:00:00Z', tg_cap_nhat: '2025-02-05T08:00:00Z' },
  { id: 'tl-9', ma_so: 'TL-2025-009', huong: 'den', id_loai: 'ltl-5', id_trang_thai: 'ttl-4', trich_yeu: 'Thông báo lịch nghỉ Tết Nguyên đán 2025', so_den: '012/TB', ngay_den: '2025-01-08', noi_gui: 'Ban Giám đốc', id_phong_ban: 'dep-7', tg_tao: '2025-01-08T10:00:00Z', tg_cap_nhat: '2025-01-08T10:00:00Z' },
  { id: 'tl-10', ma_so: 'TL-2025-010', huong: 'noi_bo', id_loai: 'ltl-8', id_trang_thai: 'ttl-3', trich_yeu: 'Báo cáo tài chính quý IV/2024', id_phong_ban: 'dep-3', ghi_chu: 'Đã trình HĐQT', tg_tao: '2025-01-18T08:00:00Z', tg_cap_nhat: '2025-01-22T15:00:00Z' },
  { id: 'tl-11', ma_so: 'TL-2025-011', huong: 'di', id_loai: 'ltl-2', id_trang_thai: 'ttl-4', trich_yeu: 'Quyết định cử cán bộ đi công tác nước ngoài', so_di: '15/QĐ-HC', ngay_ky: '2025-02-01', noi_nhan: 'Phòng Nhân sự', id_phong_ban: 'dep-2', tg_tao: '2025-02-01T09:00:00Z', tg_cap_nhat: '2025-02-01T09:00:00Z' },
  { id: 'tl-12', ma_so: 'TL-2025-012', huong: 'den', id_loai: 'ltl-1', id_trang_thai: 'ttl-2', trich_yeu: 'Công văn yêu cầu báo cáo tình hình sử dụng ngân sách', so_den: '789/UBND', ngay_den: '2025-02-06', noi_gui: 'UBND thành phố', id_phong_ban: 'dep-7', tg_tao: '2025-02-06T11:00:00Z', tg_cap_nhat: '2025-02-06T11:00:00Z' },
  { id: 'tl-13', ma_so: 'TL-2024-013', huong: 'noi_bo', id_loai: 'ltl-4', id_trang_thai: 'ttl-6', trich_yeu: 'Hợp đồng lao động - Nguyễn Văn A', id_phong_ban: 'dep-2', tg_tao: '2024-11-15T08:00:00Z', tg_cap_nhat: '2024-11-20T10:00:00Z' },
  { id: 'tl-14', ma_so: 'TL-2025-014', huong: 'di', id_loai: 'ltl-3', id_trang_thai: 'ttl-5', trich_yeu: 'Báo cáo kết quả thực hiện kế hoạch năm 2024', so_di: '99/BC-NS', ngay_ky: '2025-01-28', noi_nhan: 'Cơ quan chủ quản', id_phong_ban: 'dep-2', tg_tao: '2025-01-28T14:00:00Z', tg_cap_nhat: '2025-01-28T14:00:00Z' },
  { id: 'tl-15', ma_so: 'TL-2025-015', huong: 'noi_bo', id_loai: 'ltl-5', id_trang_thai: 'ttl-4', trich_yeu: 'Thông báo triển khai phần mềm quản lý văn bản mới', id_phong_ban: 'dep-7', ghi_chu: 'Áp dụng từ 01/03/2025', tg_tao: '2025-02-10T08:00:00Z', tg_cap_nhat: '2025-02-10T08:00:00Z' },
  { id: 'tl-16', ma_so: 'TL-2024-016', huong: 'den', id_loai: 'ltl-1', id_trang_thai: 'ttl-6', trich_yeu: 'Công văn lưu trữ năm 2024', so_den: '999/LT', ngay_den: '2024-12-15', noi_gui: 'Văn thư trung ương', id_phong_ban: 'dep-7', tg_tao: '2024-12-15T08:00:00Z', tg_cap_nhat: '2024-12-20T10:00:00Z' },
  { id: 'tl-17', ma_so: 'TL-2023-001', huong: 'noi_bo', id_loai: 'ltl-2', id_trang_thai: 'ttl-6', trich_yeu: 'Quyết định lưu trữ lịch sử', id_phong_ban: 'dep-7', ghi_chu: 'Lưu trữ theo quy định', tg_tao: '2023-06-01T08:00:00Z', tg_cap_nhat: '2024-01-10T09:00:00Z' },
];

export const MOCK_DIEM_CONG_TRU: DiemCongTruRecord[] = [
  { id: 'dct-1', id_nhan_vien: 'emp-000', ten_nhan_vien: 'Lê Minh Công', ma_nhan_vien: 'NV000', nam: 2025, thang: 1, loai: 'cong', id_hang_muc: 'pg-1', ten_hang_muc: 'Hoàn thành vượt KPI', ma_hang_muc: 'VUOT_KPI', diem: 2, mo_ta: 'Đạt 120% chỉ tiêu quý', tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-15T08:00:00Z' },
  { id: 'dct-2', id_nhan_vien: 'emp-002', ten_nhan_vien: 'Lê Minh Quân', ma_nhan_vien: 'NV002', nam: 2025, thang: 1, loai: 'tru', id_hang_muc: 'pg-8', ten_hang_muc: 'Đi muộn', ma_hang_muc: 'DI_MUON', diem: 1, mo_ta: 'Đi muộn 15 phút ngày 10/01', tg_tao: '2025-01-11T09:00:00Z', tg_cap_nhat: '2025-01-11T09:00:00Z' },
  { id: 'dct-3', id_nhan_vien: 'emp-001', ten_nhan_vien: 'Nguyễn Văn Thành', ma_nhan_vien: 'NV001', nam: 2025, thang: 2, loai: 'cong', id_hang_muc: 'pg-5', ten_hang_muc: 'Chuyên cần (không đi trễ/về sớm)', ma_hang_muc: 'CHUYEN_CAN', diem: 1, tg_tao: '2025-02-01T08:00:00Z', tg_cap_nhat: '2025-02-01T08:00:00Z' },
];

/** Cấu hình lương theo nhân viên (mức tháng) - dùng cho Bảng lương */
export const MOCK_LUONG_NHAN_VIEN: LuongNhanVienConfig[] = [
  { id: 'lnv-000', id_nhan_vien: 'emp-000', luong_co_ban: 25_000_000, luong_kpi: 8_000_000, luong_trach_nhiem: 5_000_000, phu_cap: 2_000_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-001', id_nhan_vien: 'emp-001', luong_co_ban: 22_000_000, luong_kpi: 6_000_000, luong_trach_nhiem: 4_000_000, phu_cap: 1_500_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-002', id_nhan_vien: 'emp-002', luong_co_ban: 20_000_000, luong_kpi: 5_000_000, luong_trach_nhiem: 3_000_000, phu_cap: 1_200_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-003', id_nhan_vien: 'emp-003', luong_co_ban: 18_000_000, luong_kpi: 4_500_000, luong_trach_nhiem: 2_500_000, phu_cap: 1_000_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-004', id_nhan_vien: 'emp-004', luong_co_ban: 19_000_000, luong_kpi: 5_000_000, luong_trach_nhiem: 2_800_000, phu_cap: 1_100_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-005', id_nhan_vien: 'emp-005', luong_co_ban: 15_000_000, luong_kpi: 3_500_000, luong_trach_nhiem: 2_000_000, phu_cap: 800_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-006', id_nhan_vien: 'emp-006', luong_co_ban: 16_000_000, luong_kpi: 4_000_000, luong_trach_nhiem: 2_200_000, phu_cap: 900_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-007', id_nhan_vien: 'emp-007', luong_co_ban: 17_000_000, luong_kpi: 4_200_000, luong_trach_nhiem: 2_300_000, phu_cap: 950_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-008', id_nhan_vien: 'emp-008', luong_co_ban: 14_000_000, luong_kpi: 3_000_000, luong_trach_nhiem: 1_800_000, phu_cap: 700_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-009', id_nhan_vien: 'emp-009', luong_co_ban: 12_000_000, luong_kpi: 2_500_000, luong_trach_nhiem: 1_500_000, phu_cap: 600_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-010', id_nhan_vien: 'emp-010', luong_co_ban: 13_000_000, luong_kpi: 3_000_000, luong_trach_nhiem: 1_600_000, phu_cap: 650_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-011', id_nhan_vien: 'emp-011', luong_co_ban: 14_500_000, luong_kpi: 3_200_000, luong_trach_nhiem: 1_700_000, phu_cap: 680_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-012', id_nhan_vien: 'emp-012', luong_co_ban: 16_000_000, luong_kpi: 4_000_000, luong_trach_nhiem: 2_000_000, phu_cap: 850_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
  { id: 'lnv-019', id_nhan_vien: 'emp-019', luong_co_ban: 15_000_000, luong_kpi: 3_800_000, luong_trach_nhiem: 2_000_000, phu_cap: 750_000, tg_tao: '2025-01-01T00:00:00Z', tg_cap_nhat: '2025-01-01T00:00:00Z' },
];

/** Cộng trừ lương khác theo nhân viên + kỳ (tiền) - dùng cho Bảng lương */
export interface BangLuongCongTruRaw {
  id: string;
  id_nhan_vien: string;
  nam: number;
  thang: number;
  loai: 'cong' | 'tru';
  so_tien: number;
  ly_do?: string;
}
export const MOCK_BANG_LUONG_CONG_TRU: BangLuongCongTruRaw[] = [
  { id: 'blct-1', id_nhan_vien: 'emp-000', nam: 2025, thang: 1, loai: 'cong', so_tien: 500_000, ly_do: 'Thưởng dự án' },
  { id: 'blct-2', id_nhan_vien: 'emp-000', nam: 2025, thang: 2, loai: 'tru', so_tien: 200_000, ly_do: 'Tạm ứng' },
  { id: 'blct-3', id_nhan_vien: 'emp-002', nam: 2025, thang: 1, loai: 'tru', so_tien: 100_000, ly_do: 'Trừ đi muộn' },
  { id: 'blct-4', id_nhan_vien: 'emp-001', nam: 2025, thang: 2, loai: 'cong', so_tien: 300_000, ly_do: 'Thưởng chuyên cần' },
];

/** KPI giao theo chức vụ (liên kết Chức năng nhiệm vụ) */
const tsKpi = () => new Date().toISOString();
export const MOCK_KPI_THEO_CHUC_VU: KpiTheoChucVu[] = [
  { id: 'ktcv-1', id_chuc_vu: 'pos-14', id_chi_so: 'k1', ty_trong: 40, thu_tu: 1, loai: 'xuoi', muc_tieu: 100, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-2', id_chuc_vu: 'pos-14', id_chi_so: 'k2', ty_trong: 35, thu_tu: 2, loai: 'xuoi', muc_tieu: 100, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-3', id_chuc_vu: 'pos-14', id_chi_so: 'k3', ty_trong: 25, thu_tu: 3, loai: 'nguoc', muc_tieu: 10, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-4', id_chuc_vu: 'pos-70', id_chi_so: 'k23', ty_trong: 50, thu_tu: 1, loai: 'xuoi', muc_tieu: 100, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-5', id_chuc_vu: 'pos-70', id_chi_so: 'k24', ty_trong: 50, thu_tu: 2, loai: 'nguoc', muc_tieu: 5, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-6', id_chuc_vu: 'pos-73', id_chi_so: 'k23', ty_trong: 60, thu_tu: 1, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-7', id_chuc_vu: 'pos-73', id_chi_so: 'k24', ty_trong: 40, thu_tu: 2, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-8', id_chuc_vu: 'pos-1', id_chi_so: 'k27', ty_trong: 40, thu_tu: 1, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-9', id_chuc_vu: 'pos-1', id_chi_so: 'k28', ty_trong: 35, thu_tu: 2, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-10', id_chuc_vu: 'pos-1', id_chi_so: 'k29', ty_trong: 25, thu_tu: 3, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-11', id_chuc_vu: 'pos-22', id_chi_so: 'k8', ty_trong: 50, thu_tu: 1, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-12', id_chuc_vu: 'pos-22', id_chi_so: 'k9', ty_trong: 50, thu_tu: 2, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-13', id_chuc_vu: 'pos-32', id_chi_so: 'k12', ty_trong: 50, thu_tu: 1, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-14', id_chuc_vu: 'pos-32', id_chi_so: 'k13', ty_trong: 50, thu_tu: 2, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-15', id_chuc_vu: 'pos-43', id_chi_so: 'k15', ty_trong: 50, thu_tu: 1, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-16', id_chuc_vu: 'pos-43', id_chi_so: 'k16', ty_trong: 50, thu_tu: 2, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-17', id_chuc_vu: 'pos-72', id_chi_so: 'k23', ty_trong: 55, thu_tu: 1, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
  { id: 'ktcv-18', id_chuc_vu: 'pos-72', id_chi_so: 'k24', ty_trong: 45, thu_tu: 2, tg_tao: tsKpi(), tg_cap_nhat: tsKpi() },
];

export const MOCK_CHAM_DIEM_KPI_CHI_TIET: ChamDiemKpiChiTietItem[] = [
  { id: 'cdk-ct-1', id_cham_diem_kpi: 'cdk-1', id_chi_so: 'k23', ty_trong: 50, loai: 'xuoi', muc_tieu: 100, thuc_dat: 90, ty_le: 90, diem: 90, thu_tu: 1 },
  { id: 'cdk-ct-2', id_cham_diem_kpi: 'cdk-1', id_chi_so: 'k24', ty_trong: 50, loai: 'nguoc', muc_tieu: 5, thuc_dat: 2, ty_le: 60, diem: 60, thu_tu: 2 },
  { id: 'cdk-ct-3', id_cham_diem_kpi: 'cdk-2', id_chi_so: 'k1', ty_trong: 40, loai: 'xuoi', muc_tieu: 100, thuc_dat: 92, ty_le: 92, diem: 92, thu_tu: 1 },
  { id: 'cdk-ct-4', id_cham_diem_kpi: 'cdk-2', id_chi_so: 'k2', ty_trong: 35, loai: 'xuoi', muc_tieu: 100, thuc_dat: 85, ty_le: 85, diem: 85, thu_tu: 2 },
  { id: 'cdk-ct-5', id_cham_diem_kpi: 'cdk-2', id_chi_so: 'k3', ty_trong: 25, diem: 78, thu_tu: 3 },
  { id: 'cdk-ct-6', id_cham_diem_kpi: 'cdk-3', id_chi_so: 'k23', ty_trong: 60, loai: 'xuoi', muc_tieu: 95, thuc_dat: 82, ty_le: 86.3, diem: 86.3, thu_tu: 1 },
  { id: 'cdk-ct-7', id_cham_diem_kpi: 'cdk-3', id_chi_so: 'k24', ty_trong: 40, diem: 85, thu_tu: 2 },
  { id: 'cdk-ct-8', id_cham_diem_kpi: 'cdk-4', id_chi_so: 'k23', ty_trong: 50, diem: 88, thu_tu: 1 },
  { id: 'cdk-ct-9', id_cham_diem_kpi: 'cdk-4', id_chi_so: 'k24', ty_trong: 50, diem: 90, thu_tu: 2 },
  { id: 'cdk-ct-10', id_cham_diem_kpi: 'cdk-5', id_chi_so: 'k23', ty_trong: 50, diem: 85, thu_tu: 1 },
  { id: 'cdk-ct-11', id_cham_diem_kpi: 'cdk-5', id_chi_so: 'k24', ty_trong: 50, diem: 82, thu_tu: 2 },
  { id: 'cdk-ct-12', id_cham_diem_kpi: 'cdk-6', id_chi_so: 'k23', ty_trong: 60, diem: 90, thu_tu: 1 },
  { id: 'cdk-ct-13', id_cham_diem_kpi: 'cdk-6', id_chi_so: 'k24', ty_trong: 40, diem: 86, thu_tu: 2 },
  { id: 'cdk-ct-14', id_cham_diem_kpi: 'cdk-7', id_chi_so: 'k1', ty_trong: 40, diem: 88, thu_tu: 1 },
  { id: 'cdk-ct-15', id_cham_diem_kpi: 'cdk-7', id_chi_so: 'k2', ty_trong: 35, diem: 90, thu_tu: 2 },
  { id: 'cdk-ct-16', id_cham_diem_kpi: 'cdk-7', id_chi_so: 'k3', ty_trong: 25, diem: 85, thu_tu: 3 },
  { id: 'cdk-ct-17', id_cham_diem_kpi: 'cdk-8', id_chi_so: 'k1', ty_trong: 40, diem: 95, thu_tu: 1 },
  { id: 'cdk-ct-18', id_cham_diem_kpi: 'cdk-8', id_chi_so: 'k2', ty_trong: 35, diem: 92, thu_tu: 2 },
  { id: 'cdk-ct-19', id_cham_diem_kpi: 'cdk-8', id_chi_so: 'k3', ty_trong: 25, diem: 88, thu_tu: 3 },
  { id: 'cdk-ct-20', id_cham_diem_kpi: 'cdk-9', id_chi_so: 'k8', ty_trong: 50, diem: 85, thu_tu: 1 },
  { id: 'cdk-ct-21', id_cham_diem_kpi: 'cdk-9', id_chi_so: 'k9', ty_trong: 50, diem: 90, thu_tu: 2 },
  { id: 'cdk-ct-22', id_cham_diem_kpi: 'cdk-10', id_chi_so: 'k12', ty_trong: 50, diem: 98, thu_tu: 1 },
  { id: 'cdk-ct-23', id_cham_diem_kpi: 'cdk-10', id_chi_so: 'k13', ty_trong: 50, diem: 100, thu_tu: 2 },
  { id: 'cdk-ct-24', id_cham_diem_kpi: 'cdk-11', id_chi_so: 'k15', ty_trong: 50, diem: 72, thu_tu: 1 },
  { id: 'cdk-ct-25', id_cham_diem_kpi: 'cdk-11', id_chi_so: 'k16', ty_trong: 50, diem: 80, thu_tu: 2 },
  { id: 'cdk-ct-26', id_cham_diem_kpi: 'cdk-12', id_chi_so: 'k23', ty_trong: 55, diem: 92, thu_tu: 1 },
  { id: 'cdk-ct-27', id_cham_diem_kpi: 'cdk-12', id_chi_so: 'k24', ty_trong: 45, diem: 88, thu_tu: 2 },
];

export const MOCK_CHAM_DIEM_KPI: ChamDiemKpiRecord[] = [
  { id: 'cdk-1', id_nhan_vien: 'emp-000', ten_nhan_vien: 'Lê Minh Công', ma_nhan_vien: 'NV000', id_chuc_vu: 'pos-70', ten_chuc_vu: 'Trưởng Phòng Hành chính', id_phong_ban: 'dep-7', ten_phong_ban: 'Phòng Hành chính', nam: 2025, thang: 1, diem_kpi: 89, diem_cong_tru_net: 2, tong_kpi: 91, danh_gia: 'dat', tg_tao: '2025-01-20T08:00:00Z', tg_cap_nhat: '2025-01-20T08:00:00Z' },
  { id: 'cdk-2', id_nhan_vien: 'emp-002', ten_nhan_vien: 'Lê Minh Quân', ma_nhan_vien: 'NV002', id_chuc_vu: 'pos-14', ten_chuc_vu: 'Lập trình viên Senior', id_phong_ban: 'dep-7', ten_phong_ban: 'Phòng Hành chính', nam: 2025, thang: 1, diem_kpi: 86.55, diem_cong_tru_net: -1, tong_kpi: 85.55, danh_gia: 'dat', tg_tao: '2025-01-18T10:00:00Z', tg_cap_nhat: '2025-01-18T10:00:00Z' },
  { id: 'cdk-3', id_nhan_vien: 'emp-001', ten_nhan_vien: 'Nguyễn Văn Thành', ma_nhan_vien: 'NV001', id_chuc_vu: 'pos-70', ten_chuc_vu: 'Trưởng Phòng Hành chính', id_phong_ban: 'dep-7', ten_phong_ban: 'Phòng Hành chính', nam: 2025, thang: 2, diem_kpi: 83.2, diem_cong_tru_net: 1, tong_kpi: 84.2, danh_gia: 'khong_dat', tg_tao: '2025-02-05T08:00:00Z', tg_cap_nhat: '2025-02-05T08:00:00Z' },
  { id: 'cdk-4', id_nhan_vien: 'emp-000', ten_nhan_vien: 'Lê Minh Công', ma_nhan_vien: 'NV000', id_chuc_vu: 'pos-70', ten_chuc_vu: 'Trưởng Phòng Hành chính', id_phong_ban: 'dep-7', ten_phong_ban: 'Phòng Hành chính', nam: 2025, thang: 2, diem_kpi: 89, diem_cong_tru_net: 0, tong_kpi: 89, danh_gia: 'dat', tg_tao: '2025-02-10T09:00:00Z', tg_cap_nhat: '2025-02-10T09:00:00Z' },
  { id: 'cdk-5', id_nhan_vien: 'emp-000', ten_nhan_vien: 'Lê Minh Công', ma_nhan_vien: 'NV000', id_chuc_vu: 'pos-70', ten_chuc_vu: 'Trưởng Phòng Hành chính', id_phong_ban: 'dep-7', ten_phong_ban: 'Phòng Hành chính', nam: 2024, thang: 12, diem_kpi: 83.5, diem_cong_tru_net: 0, tong_kpi: 83.5, danh_gia: 'khong_dat', tg_tao: '2024-12-28T14:00:00Z', tg_cap_nhat: '2024-12-28T14:00:00Z' },
  { id: 'cdk-6', id_nhan_vien: 'emp-001', ten_nhan_vien: 'Nguyễn Văn Thành', ma_nhan_vien: 'NV001', id_chuc_vu: 'pos-73', ten_chuc_vu: 'Nhân viên Hành chính', id_phong_ban: 'dep-7', ten_phong_ban: 'Phòng Hành chính', nam: 2025, thang: 1, diem_kpi: 88.4, diem_cong_tru_net: 0, tong_kpi: 88.4, danh_gia: 'dat', tg_tao: '2025-01-22T11:00:00Z', tg_cap_nhat: '2025-01-22T11:00:00Z' },
  { id: 'cdk-7', id_nhan_vien: 'emp-003', ten_nhan_vien: 'Trần Thị Hồng', ma_nhan_vien: 'NV003', id_chuc_vu: 'pos-14', ten_chuc_vu: 'Lập trình viên Senior', id_phong_ban: 'dep-1', ten_phong_ban: 'Phòng Kỹ thuật', nam: 2025, thang: 1, diem_kpi: 87.95, diem_cong_tru_net: 0, tong_kpi: 87.95, danh_gia: 'dat', tg_tao: '2025-01-19T16:00:00Z', tg_cap_nhat: '2025-01-19T16:00:00Z' },
  { id: 'cdk-8', id_nhan_vien: 'emp-004', ten_nhan_vien: 'Phạm Minh Tuấn', ma_nhan_vien: 'NV004', id_chuc_vu: 'pos-14', ten_chuc_vu: 'Lập trình viên Senior', id_phong_ban: 'dep-1-1', ten_phong_ban: 'Nhóm Phát triển phần mềm', nam: 2025, thang: 1, diem_kpi: 92.15, diem_cong_tru_net: 0, tong_kpi: 92.15, danh_gia: 'dat', tg_tao: '2025-01-17T10:30:00Z', tg_cap_nhat: '2025-01-17T10:30:00Z' },
  { id: 'cdk-9', id_nhan_vien: 'emp-008', ten_nhan_vien: 'Bùi Thị Lan', ma_nhan_vien: 'NV008', id_chuc_vu: 'pos-22', ten_chuc_vu: 'Chuyên viên Tuyển dụng', id_phong_ban: 'dep-2', ten_phong_ban: 'Phòng Nhân sự', nam: 2025, thang: 1, diem_kpi: 87.5, diem_cong_tru_net: 0, tong_kpi: 87.5, danh_gia: 'dat', tg_tao: '2025-01-21T09:00:00Z', tg_cap_nhat: '2025-01-21T09:00:00Z' },
  { id: 'cdk-10', id_nhan_vien: 'emp-010', ten_nhan_vien: 'Trịnh Thị Ngọc', ma_nhan_vien: 'NV010', id_chuc_vu: 'pos-32', ten_chuc_vu: 'Kế toán viên', id_phong_ban: 'dep-3', ten_phong_ban: 'Phòng Tài chính - Kế toán', nam: 2025, thang: 1, diem_kpi: 99, diem_cong_tru_net: 0, tong_kpi: 99, danh_gia: 'dat', tg_tao: '2025-01-20T15:00:00Z', tg_cap_nhat: '2025-01-20T15:00:00Z' },
  { id: 'cdk-11', id_nhan_vien: 'emp-012', ten_nhan_vien: 'Đinh Công Vinh', ma_nhan_vien: 'NV012', id_chuc_vu: 'pos-43', ten_chuc_vu: 'Nhân viên Kinh doanh', id_phong_ban: 'dep-4', ten_phong_ban: 'Phòng Kinh doanh', nam: 2025, thang: 1, diem_kpi: 76, diem_cong_tru_net: 0, tong_kpi: 76, danh_gia: 'khong_dat', tg_tao: '2025-01-23T11:00:00Z', tg_cap_nhat: '2025-01-23T11:00:00Z' },
  { id: 'cdk-12', id_nhan_vien: 'emp-019', ten_nhan_vien: 'Lê Anh Dũng', ma_nhan_vien: 'NV019', id_chuc_vu: 'pos-72', ten_chuc_vu: 'Trưởng Nhóm Văn phòng', id_phong_ban: 'dep-7-1', ten_phong_ban: 'Nhóm Văn phòng', nam: 2025, thang: 1, diem_kpi: 90.2, diem_cong_tru_net: 0, tong_kpi: 90.2, danh_gia: 'dat', tg_tao: '2025-01-24T08:30:00Z', tg_cap_nhat: '2025-01-24T08:30:00Z' },
];

export const MOCK_ADMIN_FORMS: AdminFormRequest[] = [
  {
    id: 'form-1',
    loai_phieu: 'late_early',
    ca: 'morning',
    ngay: toDateString(addDays(new Date(), -6)),
    ly_do: 'Kẹt xe do mưa lớn',
    nguoi_tao_id: 'emp-000',
    ten_nguoi_tao: 'Lê Minh Công',
    id_phong_ban: 'dep-7',
    ten_phong_ban: 'Phòng Hành chính',
    quan_ly_id: 'emp-001',
    ten_quan_ly: 'Nguyễn Văn Thành',
    hcns_id: 'emp-003',
    ten_hcns: 'Trần Thị Hồng',
    trang_thai_quan_ly: 'approved',
    trang_thai_hcns: 'pending',
    trang_thai: 'manager_approved',
    tg_tao: toIsoString(addDays(new Date(), -6)),
    tg_cap_nhat: toIsoString(addDays(new Date(), -6)),
  },
  {
    id: 'form-2',
    loai_phieu: 'business_trip',
    ca: 'full',
    ngay: toDateString(addDays(new Date(), -3)),
    ly_do: 'Đi công tác khách hàng tại Bình Dương',
    nguoi_tao_id: 'emp-002',
    ten_nguoi_tao: 'Lê Minh Quân',
    id_phong_ban: 'dep-4',
    ten_phong_ban: 'Phòng Kinh doanh',
    quan_ly_id: 'emp-000',
    ten_quan_ly: 'Lê Minh Công',
    hcns_id: 'emp-003',
    ten_hcns: 'Trần Thị Hồng',
    trang_thai_quan_ly: 'pending',
    trang_thai_hcns: 'pending',
    trang_thai: 'pending',
    tg_tao: toIsoString(addDays(new Date(), -3)),
    tg_cap_nhat: toIsoString(addDays(new Date(), -3)),
  },
  {
    id: 'form-3',
    loai_phieu: 'missed_checkin',
    ca: 'afternoon',
    ngay: toDateString(addDays(new Date(), -10)),
    ly_do: 'Quên chấm công do thiết bị lỗi',
    nguoi_tao_id: 'emp-004',
    ten_nguoi_tao: 'Phạm Thu Trang',
    id_phong_ban: 'dep-2',
    ten_phong_ban: 'Phòng Nhân sự',
    quan_ly_id: 'emp-000',
    ten_quan_ly: 'Lê Minh Công',
    hcns_id: 'emp-003',
    ten_hcns: 'Trần Thị Hồng',
    trang_thai_quan_ly: 'approved',
    trang_thai_hcns: 'approved',
    trang_thai: 'approved',
    tg_tao: toIsoString(addDays(new Date(), -10)),
    tg_cap_nhat: toIsoString(addDays(new Date(), -9)),
  },
  {
    id: 'form-4',
    loai_phieu: 'overtime',
    ca: 'afternoon',
    ngay: toDateString(addDays(new Date(), -20)),
    ly_do: 'Tăng ca hoàn thành báo cáo',
    nguoi_tao_id: 'emp-000',
    ten_nguoi_tao: 'Lê Minh Công',
    id_phong_ban: 'dep-7',
    ten_phong_ban: 'Phòng Hành chính',
    quan_ly_id: 'emp-001',
    ten_quan_ly: 'Nguyễn Văn Thành',
    hcns_id: 'emp-003',
    ten_hcns: 'Trần Thị Hồng',
    trang_thai_quan_ly: 'rejected',
    trang_thai_hcns: 'pending',
    trang_thai: 'rejected',
    tg_tao: toIsoString(addDays(new Date(), -20)),
    tg_cap_nhat: toIsoString(addDays(new Date(), -19)),
  },
  {
    id: 'form-5',
    loai_phieu: 'leave_unpaid',
    ca: 'full',
    ngay: toDateString(addDays(new Date(), 2)),
    ly_do: 'Việc gia đình',
    nguoi_tao_id: 'emp-005',
    ten_nguoi_tao: 'Ngô Hoàng Nam',
    id_phong_ban: 'dep-1',
    ten_phong_ban: 'Phòng Kỹ thuật',
    quan_ly_id: 'emp-000',
    ten_quan_ly: 'Lê Minh Công',
    hcns_id: 'emp-003',
    ten_hcns: 'Trần Thị Hồng',
    trang_thai_quan_ly: 'pending',
    trang_thai_hcns: 'pending',
    trang_thai: 'pending',
    tg_tao: toIsoString(addDays(new Date(), -1)),
    tg_cap_nhat: toIsoString(addDays(new Date(), -1)),
  },
  {
    id: 'form-6',
    loai_phieu: 'leave_paid',
    ca: 'full',
    ngay: toDateString(addDays(new Date(), 5)),
    ly_do: 'Nghỉ phép năm',
    nguoi_tao_id: 'emp-000',
    ten_nguoi_tao: 'Lê Minh Công',
    id_phong_ban: 'dep-7',
    ten_phong_ban: 'Phòng Hành chính',
    quan_ly_id: 'emp-001',
    ten_quan_ly: 'Nguyễn Văn Thành',
    hcns_id: 'emp-003',
    ten_hcns: 'Trần Thị Hồng',
    trang_thai_quan_ly: 'approved',
    trang_thai_hcns: 'approved',
    trang_thai: 'approved',
    tg_tao: toIsoString(addDays(new Date(), -2)),
    tg_cap_nhat: toIsoString(addDays(new Date(), -1)),
  },
];

/** Phiếu bảo trì / sửa chữa – mock cho module Bảo trì sửa chữa */
export const MOCK_PHIEU_BAO_TRI_SUA_CHUA: PhieuBaoTriSuaChua[] = [
  {
    id: 'pbt-1',
    hang_muc: 'bao_tri',
    id_tai_san: 'ts-1',
    ma_tai_san: 'TS-VP-001',
    ten_tai_san: 'Laptop Dell XPS 15',
    ngay_yeu_cau: '2025-01-15',
    ngay_hen: '2025-01-20',
    ngay_bat_dau: null,
    ngay_hoan_thanh: '2025-01-19',
    mo_ta: 'Bảo trì định kỳ vệ sinh, kiểm tra phần cứng',
    ghi_chu: 'Đã hoàn thành đúng hạn',
    id_nguoi_tao: 'emp-000',
    ten_nguoi_tao: 'Lê Minh Công',
    id_nguoi_phu_trach: 'emp-001',
    ten_nguoi_phu_trach: 'Nguyễn Văn Thành',
    trang_thai: 1,
    tg_tao: '2025-01-15T08:00:00Z',
    tg_cap_nhat: '2025-01-19T14:00:00Z',
  },
  {
    id: 'pbt-2',
    hang_muc: 'sua_chua',
    id_tai_san: 'ts-3',
    ma_tai_san: 'TS-VP-003',
    ten_tai_san: 'Máy in HP LaserJet',
    ngay_yeu_cau: '2025-01-18',
    ngay_hen: '2025-01-25',
    ngay_bat_dau: '2025-01-22',
    ngay_hoan_thanh: null,
    mo_ta: 'Máy in kẹt giấy, báo lỗi in mờ',
    ghi_chu: null,
    id_nguoi_tao: 'emp-001',
    ten_nguoi_tao: 'Nguyễn Văn Thành',
    id_nguoi_phu_trach: 'emp-002',
    ten_nguoi_phu_trach: 'Lê Minh Quân',
    trang_thai: 0,
    tg_tao: '2025-01-18T09:00:00Z',
    tg_cap_nhat: '2025-01-22T10:00:00Z',
  },
  {
    id: 'pbt-3',
    hang_muc: 'bao_tri',
    id_tai_san: 'ts-4',
    ma_tai_san: 'TS-VP-004',
    ten_tai_san: 'Điều hòa Daikin 2 HP',
    ngay_yeu_cau: '2025-02-01',
    ngay_hen: '2025-02-10',
    ngay_bat_dau: null,
    ngay_hoan_thanh: null,
    mo_ta: 'Bảo dưỡng định kỳ vệ sinh lọc, nạp gas kiểm tra',
    ghi_chu: null,
    id_nguoi_tao: 'emp-000',
    ten_nguoi_tao: 'Lê Minh Công',
    id_nguoi_phu_trach: null,
    ten_nguoi_phu_trach: null,
    trang_thai: 0,
    tg_tao: '2025-02-01T08:00:00Z',
    tg_cap_nhat: '2025-02-01T08:00:00Z',
  },
];
