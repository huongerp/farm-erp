/** In hàng loạt phiếu thanh toán đối tác — cùng nội dung / mauKey với `ThanhToanDoiTacPreviewPage`. */
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { getThanhToanDoiTacById } from './services/thanh-toan-doi-tac-service';
import type { ThanhToanDoiTac } from './core/types';
import ThanhToanDoiTacPreviewContent from './components/ThanhToanDoiTacPreviewContent';

const mau: MauInHangLoat<ThanhToanDoiTac> = {
  mauKey: 'thanh-toan-doi-tac',
  tieuDeKey: 'thanhToanDoiTac.preview.title',
  macDinh: { kho: 'a4', huong: 'doc', leMm: 12 },
  duongDanVe: '/mua-hang/thanh-toan-doi-tac',
  taiNhieu: async (ids) =>
    (await Promise.all(ids.map((id) => getThanhToanDoiTacById(id)))).filter((p): p is ThanhToanDoiTac => !!p),
  khoa: (p) => String(p.id),
  trangThai: (p) => [p.ma_trang_thai, p.ten_trang_thai],
  NoiDung: ({ duLieu }) => <ThanhToanDoiTacPreviewContent data={duLieu} />,
};

export default mau;
