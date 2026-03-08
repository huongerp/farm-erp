import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';
import { getHanhChinhGroups } from './hanh-chinh-menu';
import { getMuaHangGroups } from './mua-hang-menu';

/**
 * Gộp tất cả nhóm module từ các submenu hiển thị (Hành chính, Mua hàng).
 * Ẩn: Tài chính. Mua hàng gồm cả module quản lý kho (đã chuyển từ Kho vận).
 * Dùng cho tab "Đánh dấu" trên Trang chủ.
 */
export function getAllSubmenuGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const hanhChinh = getHanhChinhGroups(t, navigate);
  const muaHang = getMuaHangGroups(t, navigate);
  return [
    ...hanhChinh,
    ...muaHang,
  ];
}
