import type { Employee } from '../core/types';

/**
 * Khớp ô tìm kiếm danh sách nhân viên (dùng chung list + filter counts).
 */
export function employeeMatchesSearch(emp: Employee, term: string): boolean {
  if (!term) return true;
  const searchLower = term.toLowerCase();
  return (
    emp.ho_ten.toLowerCase().includes(searchLower) ||
    emp.ma_nhan_vien.toLowerCase().includes(searchLower) ||
    emp.email.toLowerCase().includes(searchLower) ||
    emp.so_dien_thoai.includes(searchLower) ||
    !!(emp.ten_chuc_vu && emp.ten_chuc_vu.toLowerCase().includes(searchLower)) ||
    !!(emp.ten_phong_ban && emp.ten_phong_ban.toLowerCase().includes(searchLower)) ||
    !!(emp.ten_chi_nhanh && emp.ten_chi_nhanh.toLowerCase().includes(searchLower))
  );
}
