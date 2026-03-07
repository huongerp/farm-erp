/**
 * Mock Data - Central Export
 * 
 * Tất cả dữ liệu mock được tổ chức theo module và có tính liên kết với nhau.
 * 
 * Cách sử dụng:
 * import { MOCK_EMPLOYEES, MOCK_DEVICES, getEmployeeName } from '@/mocks';
 * 
 * Hoặc import từ file cụ thể:
 * import { MOCK_EMPLOYEES } from '@/mocks/he-thong';
 */

// ==================== HỆ THỐNG ====================
export {
  MOCK_DEPARTMENTS,
  MOCK_POSITIONS,
  MOCK_JOB_LEVELS,
  MOCK_EMPLOYEES,
  getEmployeeName,
  getDepartmentName,
  MOCK_LOGIN_DEVICES,
  type Position,
  type JobLevel,
} from './he-thong';

// ==================== THIẾT BỊ ====================
export {
  MOCK_LOCATIONS,
  MOCK_ASSET_GROUPS,
  MOCK_DEVICES,
  MOCK_SPARE_PARTS,
  MOCK_MAINTENANCE_TICKETS,
  MOCK_MAINTENANCE_SCHEDULES,
  MOCK_AUDIT_TICKETS,
  MOCK_ASSET_HISTORY,
  getLocationName,
  getDeviceName,
  getAssetHistoryByDevice,
  getSchedulesByStatus,
  getUpcomingSchedules,
  type AssetGroup,
  type Device,
} from './thiet-bi';

// ==================== HÀNH CHÍNH ====================
export {
  MOCK_PAYROLL_WIFI_IPS,
  MOCK_PAYROLL_ADMIN_FORM_GROUPS,
  MOCK_ADMIN_FORMS,
} from './hanh-chinh';

// ==================== NHÂN SỰ ====================
export {
  MOCK_TRANG_THAI_UNG_VIEN,
  MOCK_KENH_TUYEN_DUNG,
  MOCK_MAU_PHAN_HOI,
} from './nhan-su';

// Các module sau đã bị xóa — không export để tránh lỗi import: nha-cung-cap, khach-hang, tai-chinh

// ==================== SUMMARY ====================
/**
 * Tóm tắt dữ liệu mock có trong hệ thống:
 * 
 * 1. HỆ THỐNG (he-thong.ts):
 *    - 10 Phòng ban (có cấu trúc cha-con)
 *    - 7 Chức vụ
 *    - 5 Cấp bậc
 *    - 20 Nhân viên (liên kết với phòng ban, chức vụ)
 * 
 * 2. THIẾT BỊ (thiet-bi.ts):
 *    - 15 Vị trí/Khu vực (có cấu trúc cha-con: Tầng > Phòng)
 *    - 10 Nhóm tài sản
 *    - 25 Thiết bị (Laptop, PC, Màn hình, Máy in, Máy chiếu, Thiết bị mạng)
 *    - 15 Linh kiện/Vật tư (RAM, SSD, Mực in, Phụ kiện)
 *    - 12 Phiếu bảo trì (sửa chữa, bảo dưỡng, thay thế, kiểm tra)
 *    - 10 Lịch bảo dưỡng định kỳ (tháng, quý, 6 tháng, năm)
 *    - 10 Phiếu kiểm kê (theo quý, cuối năm, đột xuất)
 *    - 26 Lịch sử luân chuyển (nhập kho, cấp phát, thu hồi, bảo trì)
 * 
 * 3. NHÀ CUNG CẤP (nha-cung-cap.ts):
 *    - 5 Nhóm NCC
 *    - 12 Nhà cung cấp (liên kết với nhóm)
 *    - 6 Đánh giá NCC
 * 
 * 4. KHÁCH HÀNG (khach-hang.ts):
 *    - 5 Nhóm khách hàng
 *    - 16 Khách hàng (liên kết với nhóm)
 * 
 * 5. TÀI CHÍNH (tai-chinh.ts):
 *    - 5 Tài khoản (tiền mặt, ngân hàng)
 *    - 13 Danh mục thu/chi
 *    - 14 Giao dịch thu chi (liên kết với tài khoản, danh mục, nhân viên)
 * 
 * CÁC LIÊN KẾT DỮ LIỆU:
 * - Thiết bị → Nhà cung cấp (ai cung cấp)
 * - Thiết bị → Nhân viên (ai đang sử dụng)
 * - Thiết bị → Vị trí (đặt ở đâu)
 * - Bảo trì → Thiết bị + Nhân viên + Linh kiện
 * - Lịch bảo dưỡng → Thiết bị + Nhân viên phụ trách
 * - Kiểm kê → Kho + Linh kiện + Nhân viên kiểm
 * - Luân chuyển → Thiết bị + Nhân viên liên quan
 * - Nhân viên → Phòng ban + Chức vụ
 * - Giao dịch → Tài khoản + Danh mục + Nhân viên
 * - Khách hàng / NCC → Nhóm tương ứng
 */
