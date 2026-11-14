/** In hàng loạt nhật ký pha thuốc phun cùi — cùng nội dung / mauKey với `NhatKyPhunCuiPreviewPage`. */
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { getNhatKyById } from './services/nhat-ky-phun-cui-service';
import type { NhatKyPhunCui } from './core/types';
import NhatKyPhunCuiPreviewContent from './components/preview/NhatKyPhunCuiPreviewContent';
import { MAC_DINH_IN_NKPC, MAU_IN_NKPC } from './components/preview/mac-dinh-in';

const mau: MauInHangLoat<NhatKyPhunCui> = {
  mauKey: MAU_IN_NKPC,
  tieuDeKey: 'nkpc.preview.title',
  macDinh: MAC_DINH_IN_NKPC,
  moduleId: 'quan-ly-nha-so-che/nhat-ky-phun-cui',
  duongDanVe: '/quan-ly-nha-so-che/nhat-ky-phun-cui',
  taiNhieu: async (ids) =>
    (await Promise.all(ids.map((id) => getNhatKyById(id)))).filter((p): p is NhatKyPhunCui => !!p),
  khoa: (p) => String(p.id),
  NoiDung: ({ duLieu }) => <NhatKyPhunCuiPreviewContent phieu={duLieu} />,
};

export default mau;
