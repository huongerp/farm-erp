/** In hàng loạt nhật ký pha phèn — cùng nội dung / mauKey với `NhatKyPhaPhenPreviewPage`. */
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { getNkppById } from './services/nhat-ky-pha-phen-service';
import type { NhatKyPhaPhen } from './core/types';
import NhatKyPhaPhenPreviewContent from './components/preview/NhatKyPhaPhenPreviewContent';
import { MAC_DINH_IN_NKPP, MAU_IN_NKPP } from './components/preview/mac-dinh-in';

const mau: MauInHangLoat<NhatKyPhaPhen> = {
  mauKey: MAU_IN_NKPP,
  tieuDeKey: 'nkpp.preview.title',
  macDinh: MAC_DINH_IN_NKPP,
  moduleId: 'quan-ly-nha-so-che/nhat-ky-pha-phen',
  duongDanVe: '/quan-ly-nha-so-che/nhat-ky-pha-phen',
  taiNhieu: async (ids) =>
    (await Promise.all(ids.map((id) => getNkppById(id)))).filter((p): p is NhatKyPhaPhen => !!p),
  khoa: (p) => String(p.id),
  NoiDung: ({ duLieu }) => <NhatKyPhaPhenPreviewContent phieu={duLieu} />,
};

export default mau;
