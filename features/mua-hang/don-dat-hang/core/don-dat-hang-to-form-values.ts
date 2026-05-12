import type { DonDatHang } from './types';
import type { DonDatHangFormValues } from './schema';

/** Map đơn đặt hàng → giá trị form (tạo/sửa/phê duyệt). */
export function donDatHangToFormValues(
  p: DonDatHang,
  trangThai: DonDatHang['trang_thai'],
  overrideGhiChu?: string
): DonDatHangFormValues {
  return {
    so_po: p.so_po,
    ngay_dat: p.ngay_dat,
    ngay_giao_dk: p.ngay_giao_dk,
    id_nha_cung_cap: p.id_nha_cung_cap,
    id_kho_nhan: p.id_kho_nhan ?? undefined,
    id_phieu_de_xuat_vat_tu: p.id_phieu_de_xuat_vat_tu ?? undefined,
    id_nguoi_dat: p.id_nguoi_dat,
    id_nguoi_duyet: p.id_nguoi_duyet ?? undefined,
    dieu_khoan_thanh_toan: p.dieu_khoan_thanh_toan ?? '',
    ghi_chu: overrideGhiChu !== undefined ? overrideGhiChu : (p.ghi_chu ?? ''),
    trang_thai: trangThai,
    chi_tiet: (p.chi_tiet ?? []).map((ct) => ({
      id_hang_hoa: ct.id_hang_hoa,
      phan_loai: ct.phan_loai ?? null,
      so_luong: ct.so_luong,
      don_gia: ct.don_gia,
      ghi_chu: ct.ghi_chu ?? '',
    })),
  };
}
