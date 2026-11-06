/**
 * In hàng loạt đề xuất mua hàng — cùng nội dung / mauKey với `DeXuatMuaHangPreviewPage`.
 * Hai biến thể kho dùng chung `mauKey` nhưng KHÁC khoá danh mục: `de-xuat-mua-hang` (Sơ chế) và
 * `de-xuat-mua-hang-phan-thuoc` (file `in-hang-loat-phan-thuoc.tsx`).
 */
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { KhoBienTheProvider } from '../kho-bien-the/KhoBienTheProvider';
import { khoModuleId, type KhoBienThe, BIEN_THE_SO_CHE } from '../kho-bien-the/bien-the';
import { getDeXuatMuaHangById } from './services/de-xuat-mua-hang-service';
import type { DeXuatMuaHang } from './core/types';
import DeXuatMuaHangPreviewContent from './components/DeXuatMuaHangPreviewContent';

export function taoMauDeXuatMuaHang(bt: KhoBienThe): MauInHangLoat<DeXuatMuaHang> {
  return {
    mauKey: 'de-xuat-mua-hang',
    tieuDeKey: 'deXuatMuaHang.preview.title',
    macDinh: { kho: 'a4', huong: 'doc', leMm: 15 },
    moduleId: khoModuleId(bt, 'de-xuat-mua-hang'),
    duongDanVe: `${bt.basePath}/de-xuat-mua-hang`,
    taiNhieu: async (ids) =>
      (await Promise.all(ids.map((id) => getDeXuatMuaHangById(bt, id)))).filter((p): p is DeXuatMuaHang => !!p),
    khoa: (p) => String(p.id),
    trangThai: (p) => [p.trang_thai],
    NoiDung: ({ duLieu }) => (
      <KhoBienTheProvider value={bt}>
        <DeXuatMuaHangPreviewContent phieu={duLieu} />
      </KhoBienTheProvider>
    ),
  };
}

export default taoMauDeXuatMuaHang(BIEN_THE_SO_CHE);
