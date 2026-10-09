import { TRANG_THAI_NV } from '../../../../lib/constants';

interface NhanVienRef {
  id: string | number;
  ho_ten?: string | null;
  ma_nhan_vien?: string | null;
  trang_thai?: string | null;
}

/** Option người phụ trách: chỉ nhân viên đang làm việc, tối đa 300 (dùng chung form + giao lại hàng loạt). */
export function buildEmployeeOptions(employees: NhanVienRef[]): { label: string; value: number }[] {
  return employees
    .filter((e) => e.trang_thai === TRANG_THAI_NV.DANG_LAM_VIEC)
    .slice(0, 300)
    .map((e) => {
      const numId = typeof e.id === 'number' ? e.id : parseInt(String(e.id).replace(/\D/g, ''), 10) || 0;
      const label = e.ho_ten ? `${e.ho_ten}${e.ma_nhan_vien ? ` (${e.ma_nhan_vien})` : ''}` : e.ma_nhan_vien || String(e.id);
      return { label, value: numId };
    })
    .filter((o) => o.value > 0);
}
