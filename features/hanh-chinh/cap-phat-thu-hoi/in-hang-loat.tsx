/** In hàng loạt phiếu cấp phát / thu hồi — cùng nội dung / mauKey với `PhieuCPTHPreviewPage`. */
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { getPhieuById } from './services/cap-phat-thu-hoi-service';
import type { PhieuCapPhatThuHoi } from './core/types';
import PhieuCPTHPreviewContent from './components/PhieuCPTHPreviewContent';

const mau: MauInHangLoat<PhieuCapPhatThuHoi> = {
  mauKey: 'cap-phat-thu-hoi',
  tieuDeKey: 'capPhatThuHoi.preview.title',
  macDinh: { kho: 'a4', huong: 'doc', leMm: 12 },
  duongDanVe: '/hanh-chinh/cap-phat-thu-hoi',
  taiNhieu: async (ids) =>
    (await Promise.all(ids.map((id) => getPhieuById(id)))).filter((p): p is PhieuCapPhatThuHoi => !!p),
  khoa: (p) => String(p.id),
  NoiDung: ({ duLieu }) => <PhieuCPTHPreviewContent phieu={duLieu} />,
};

export default mau;
