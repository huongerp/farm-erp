import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';
import { getHanhChinhGroups } from './hanh-chinh-menu';
import { getMuaHangGroups } from './mua-hang-menu';
import { getQuanLyNhaSoCheGroups } from './quan-ly-nha-so-che-menu';
import { getTaiChinhGroups } from './tai-chinh-menu';

/**
 * Gộp tất cả nhóm module từ các submenu hiển thị (Hành chính, Mua hàng, Quản lý nhà sơ chế, Tài chính).
 * Mua hàng gồm cả module quản lý kho (đã chuyển từ Kho vận).
 * Dùng cho tab "Đánh dấu" trên Trang chủ.
 */
export function getAllSubmenuGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const hanhChinh = getHanhChinhGroups(t, navigate);
  const muaHang = getMuaHangGroups(t, navigate);
  const quanLyNhaSoChe = getQuanLyNhaSoCheGroups(t, navigate);
  const taiChinh = getTaiChinhGroups(t, navigate);
  return [
    ...hanhChinh,
    ...muaHang,
    ...quanLyNhaSoChe,
    ...taiChinh,
  ];
}
