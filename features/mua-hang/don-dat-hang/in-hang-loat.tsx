/** In hàng loạt đơn đặt hàng — cùng nội dung / mauKey / phạm vi xem với `DonDatHangPreviewPage`. */
import { useMemo } from 'react';
import type { MauInHangLoat } from '../../../components/shared/phieu-in/in-hang-loat';
import { getDonDatHangById } from './services/don-dat-hang-service';
import { useDonDatHangServerScope } from './hooks/use-don-dat-hang-view-scope';
import { donDatHangTrongPhamVi } from './utils/don-dat-hang-view-scope-filter';
import type { DonDatHang } from './core/types';
import DonDatHangPreviewContent from './components/DonDatHangPreviewContent';

const mau: MauInHangLoat<DonDatHang> = {
  mauKey: 'don-dat-hang',
  tieuDeKey: 'donDatHang.preview.title',
  macDinh: { kho: 'a4', huong: 'doc', leMm: 15 },
  moduleId: 'mua-hang/don-dat-hang',
  duongDanVe: '/mua-hang/don-dat-hang',
  taiNhieu: async (ids) => (await Promise.all(ids.map((id) => getDonDatHangById(id)))).filter((p): p is DonDatHang => !!p),
  khoa: (p) => String(p.id),
  trangThai: (p) => [p.trang_thai],
  // Trang đơn lẻ lọc theo phạm vi xem (farm / người đặt) — giữ đúng cổng đó.
  useLoc: () => {
    const { scope, isLoading } = useDonDatHangServerScope();
    return useMemo(() => (isLoading ? null : (d: DonDatHang) => donDatHangTrongPhamVi(d, scope)), [scope, isLoading]);
  },
  NoiDung: ({ duLieu }) => <DonDatHangPreviewContent po={duLieu} />,
};

export default mau;
