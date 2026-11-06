/** In hàng loạt phiếu đề xuất vật tư — cùng nội dung / mauKey với `PhieuDeXuatVatTuPreviewPage`. */
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { getPhieuDeXuatVatTuById } from './services/phieu-de-xuat-vat-tu-service';
import type { PhieuDeXuatVatTu } from './core/types';
import PhieuDeXuatVatTuPreviewContent from './components/PhieuDeXuatVatTuPreviewContent';

const mau: MauInHangLoat<PhieuDeXuatVatTu> = {
  mauKey: 'phieu-de-xuat-vat-tu',
  tieuDeKey: 'phieuDeXuatVatTu.preview.title',
  macDinh: { kho: 'a4', huong: 'doc', leMm: 15 },
  duongDanVe: '/mua-hang/phieu-de-xuat-vat-tu',
  taiNhieu: async (ids) =>
    (await Promise.all(ids.map((id) => getPhieuDeXuatVatTuById(id)))).filter((p): p is PhieuDeXuatVatTu => !!p),
  khoa: (p) => String(p.id),
  trangThai: (p) => [p.trang_thai],
  NoiDung: ({ duLieu }) => <PhieuDeXuatVatTuPreviewContent phieu={duLieu} />,
};

export default mau;
