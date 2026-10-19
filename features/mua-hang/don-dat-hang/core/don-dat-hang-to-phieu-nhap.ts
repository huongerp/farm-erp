import type { PhieuKhoFormValues } from '../../../kho-van/phieu-kho/core/schema';
import { ghepDongChon, type DongDaChon } from '../../../../lib/thuc-hien-tung-phan';
import type { DonDatHang } from './types';

/**
 * Điền sẵn phiếu NHẬP kho từ đơn đặt hàng. `dongChon` (popup chọn hàng, nhập từng phần): chỉ lấy
 * các hàng đó với SL lần này; đơn giá + ghi chú lấy theo dòng đơn.
 */
export function donDatHangToPhieuNhapPrefill(don: DonDatHang, dongChon: readonly DongDaChon[]): Partial<PhieuKhoFormValues> {
  return {
    id_don_dat_hang: don.id,
    ngay: (don.ngay_dat ?? '').slice(0, 10),
    kho_id: don.id_kho_nhan ?? '',
    id_nha_cung_cap: don.id_nha_cung_cap ?? null,
    mo_ta: don.so_po ? `Nhập theo đơn ${don.so_po}` : undefined,
    chi_tiet: ghepDongChon(don.chi_tiet, dongChon).map(({ dong, so_luong }) => ({
      id_hang_hoa: dong.id_hang_hoa,
      so_luong,
      don_gia: dong.don_gia,
      so_lot: '',
      ghi_chu: dong.ghi_chu ?? '',
    })),
  };
}
