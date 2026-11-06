/** In hàng loạt phiếu hành chính — cùng nội dung / mauKey / cổng «chỉ in phiếu của mình» với `PhieuHanhChinhPreviewPage`. */
import { useMemo } from 'react';
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { useAuthStore } from '../../../store/useStore';
import { getAdminFormById } from './services/admin-form-service';
import { usePhieuHanhChinhViewScope } from './hooks/use-phieu-hanh-chinh-view-scope';
import { chonTabChoPhieu } from './core/deep-link';
import type { AdminFormRequest } from './core/types';
import PhieuHanhChinhPreview from './components/preview/PhieuHanhChinhPreview';

const mau: MauInHangLoat<AdminFormRequest> = {
  mauKey: 'phieu-hanh-chinh',
  tieuDeKey: 'adminForm.print.pageTitle',
  macDinh: { kho: 'a4', huong: 'doc', leMm: 15 },
  coChuGocPt: 12,
  moduleId: 'hanh-chinh/phieu-hanh-chinh',
  duongDanVe: '/hanh-chinh/phieu-hanh-chinh',
  taiNhieu: async (ids) =>
    (await Promise.all(ids.map((id) => getAdminFormById(id)))).filter((p): p is AdminFormRequest => !!p),
  khoa: (p) => String(p.id),
  trangThai: (p) => [p.trang_thai, p.trang_thai_quan_ly, p.trang_thai_hcns],
  // Bảng phiếu chưa có RLS theo người: giữ cổng giống trang đơn lẻ.
  useLoc: () => {
    const { viewAll, isLoading } = usePhieuHanhChinhViewScope();
    const currentUserId = useAuthStore((s) => s.user?.id ?? '');
    return useMemo(
      () =>
        isLoading
          ? null
          : (p: AdminFormRequest) => chonTabChoPhieu({ nguoiTaoId: p.nguoi_tao_id, currentUserId, viewAll }).tab !== null,
      [isLoading, viewAll, currentUserId]
    );
  },
  NoiDung: ({ duLieu }) => <PhieuHanhChinhPreview phieu={duLieu} />,
};

export default mau;
