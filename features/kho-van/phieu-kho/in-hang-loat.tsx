/** In hàng loạt phiếu kho — cùng nội dung / mauKey với `PhieuKhoPreviewPage`. */
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { getPhieuKhoById } from './services/phieu-kho-service';
import type { PhieuKho } from './core/types';
import PhieuKhoPreviewContent from './components/PhieuKhoPreviewContent';

const mau: MauInHangLoat<PhieuKho> = {
  mauKey: 'phieu-kho',
  tieuDeKey: 'phieuKho.preview.title',
  macDinh: { kho: 'a4', huong: 'doc', leMm: 15 },
  duongDanVe: '/mua-hang/phieu-kho',
  taiNhieu: async (ids) => (await Promise.all(ids.map((id) => getPhieuKhoById(id)))).filter((p): p is PhieuKho => !!p),
  khoa: (p) => String(p.id),
  trangThai: (p) => [p.trang_thai],
  NoiDung: ({ duLieu }) => <PhieuKhoPreviewContent phieu={duLieu} />,
};

export default mau;
