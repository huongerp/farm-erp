/** In hàng loạt phiếu bảo trì / sửa chữa — cùng nội dung / mauKey / cổng xem với `PhieuBaoTriPreviewPage`. */
import { useMemo } from 'react';
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { useAuthStore } from '../../../store/useStore';
import { getPhieuBaoTriById } from './services/bao-tri-sua-chua-service';
import { useBaoTriSuaChuaViewScope } from './hooks/use-bao-tri-sua-chua-view-scope';
import { useTaiSanTomTat } from '../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import type { PhieuBaoTriSuaChua } from './core/types';
import PhieuBaoTriPreview from './components/preview/PhieuBaoTriPreview';

const mau: MauInHangLoat<PhieuBaoTriSuaChua> = {
  mauKey: 'phieu-bao-tri',
  tieuDeKey: 'baoTriSuaChua.print.pageTitle',
  macDinh: { kho: 'a4', huong: 'doc', leMm: 15 },
  coChuGocPt: 12,
  moduleId: 'hanh-chinh/chi-phi-tai-san',
  duongDanVe: '/hanh-chinh/chi-phi-tai-san',
  taiNhieu: async (ids) =>
    (await Promise.all(ids.map((id) => getPhieuBaoTriById(id)))).filter((p): p is PhieuBaoTriSuaChua => !!p),
  khoa: (p) => String(p.id),
  trangThai: (p) => [p.trang_thai],
  // Cổng xem khớp trang đơn lẻ: xem tất cả, phiếu do mình tạo, hoặc phiếu của tài sản mình đang giữ.
  useLoc: () => {
    const { viewAll, isLoading } = useBaoTriSuaChuaViewScope();
    const { data: taiSanList = [], isLoading: dangTaiTaiSan } = useTaiSanTomTat();
    const currentUserId = useAuthStore((s) => s.user?.id ?? '');
    return useMemo(() => {
      if (isLoading || dangTaiTaiSan) return null;
      return (phieu: PhieuBaoTriSuaChua) => {
        if (viewAll || String(phieu.id_nguoi_tao) === String(currentUserId)) return true;
        const taiSan = taiSanList.find((a) => String(a.id) === String(phieu.id_tai_san));
        return !!taiSan && String(taiSan.id_nhan_vien_dang_giu) === String(currentUserId);
      };
    }, [isLoading, dangTaiTaiSan, viewAll, taiSanList, currentUserId]);
  },
  NoiDung: ({ duLieu }) => <PhieuBaoTriPreview phieu={duLieu} />,
};

export default mau;
