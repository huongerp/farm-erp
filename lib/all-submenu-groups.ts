import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';
import { getHanhChinhGroups } from './hanh-chinh-menu';
import { getNhanSuGroups } from './nhan-su-menu';
import { getKinhDoanhGroups } from './kinh-doanh-menu';
import { getMarketingGroups } from './marketing-menu';
import { getTaiChinhGroups } from './tai-chinh-menu';
import { getMuaHangGroups } from './mua-hang-menu';
import { getKhoVanGroups } from './kho-van-menu';
import { getDieuHanhGroups } from './dieu-hanh-menu';

/**
 * Gộp tất cả nhóm module từ 8 submenu (Hành chính, Nhân sự, Kinh doanh, Marketing, Tài chính, Mua hàng, Kho vận, Điều hành).
 * Dùng cho tab "Đánh dấu" trên Trang chủ.
 */
export function getAllSubmenuGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const hanhChinh = getHanhChinhGroups(t, navigate);
  const nhanSu = getNhanSuGroups(t, navigate);
  const kinhDoanh = getKinhDoanhGroups(t, navigate);
  const marketing = getMarketingGroups(t, navigate);
  const taiChinh = getTaiChinhGroups(t, navigate);
  const muaHang = getMuaHangGroups(t, navigate);
  const khoVan = getKhoVanGroups(t, navigate);
  const dieuHanh = getDieuHanhGroups(t, navigate);
  return [
    ...hanhChinh,
    ...nhanSu,
    ...kinhDoanh,
    ...marketing,
    ...taiChinh,
    ...muaHang,
    ...khoVan,
    ...dieuHanh,
  ];
}
