/**
 * In hàng loạt phiếu kho Nhà sơ chế / Phân thuốc — cùng nội dung / mauKey với `PhieuKhoPTPreviewPage`.
 * Hai biến thể dùng chung `mauKey` nhưng KHÁC khoá danh mục: `phieu-kho-pt` (Sơ chế) và
 * `phieu-kho-pt-phan-thuoc` (file `in-hang-loat-phan-thuoc.tsx`).
 */
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { KhoBienTheProvider } from '../kho-bien-the/KhoBienTheProvider';
import { khoModuleId, type KhoBienThe, BIEN_THE_SO_CHE } from '../kho-bien-the/bien-the';
import { getPhieuKhoPTById } from './services/phieu-kho-pt-service';
import type { PhieuKhoPT } from './core/types';
import PhieuKhoPTPreviewContent from './components/PhieuKhoPTPreviewContent';

export function taoMauPhieuKhoPT(bt: KhoBienThe): MauInHangLoat<PhieuKhoPT> {
  return {
    mauKey: 'phieu-kho-pt',
    tieuDeKey: 'phieuKhoPhanThuoc.preview.title',
    macDinh: { kho: 'a4', huong: 'doc', leMm: 15 },
    moduleId: khoModuleId(bt, 'phieu-kho-phan-thuoc'),
    duongDanVe: `${bt.basePath}/phieu-kho-phan-thuoc`,
    taiNhieu: async (ids) =>
      (await Promise.all(ids.map((id) => getPhieuKhoPTById(bt, id)))).filter((p): p is PhieuKhoPT => !!p),
    khoa: (p) => String(p.id),
    trangThai: (p) => [p.trang_thai],
    NoiDung: ({ duLieu }) => (
      <KhoBienTheProvider value={bt}>
        <PhieuKhoPTPreviewContent phieu={duLieu} bienThe={bt.key} />
      </KhoBienTheProvider>
    ),
  };
}

export default taoMauPhieuKhoPT(BIEN_THE_SO_CHE);
