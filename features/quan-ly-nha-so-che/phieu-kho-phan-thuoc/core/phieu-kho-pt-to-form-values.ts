import type { DeXuatMuaHang } from '../../de-xuat-mua-hang/core/types';
import type { PhieuKhoPTChiTietFormItem, PhieuKhoPTFormValues } from './schema';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Dòng phiếu kho nhập từ dòng đề xuất mua hàng.
 * Bỏ dòng số lượng <= 0 vì bảng chi tiết phiếu kho có CHECK (so_luong > 0).
 */
export function mapDeXuatChiTietToPhieuKhoPTLines(
  chiTiet: DeXuatMuaHang['chi_tiet']
): PhieuKhoPTChiTietFormItem[] {
  return (chiTiet ?? [])
    .filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0)
    .map((ct) => ({
      id_hang_hoa: ct.id_hang_hoa,
      so_luong: Number(ct.so_luong),
      don_gia: 0,
      so_lot: '',
      ghi_chu: ct.ghi_chu?.trim() || '',
    }));
}

/**
 * Điền sẵn phiếu kho NHẬP phân thuốc từ phiếu đề xuất mua hàng đã duyệt.
 * Kho nhập = nơi đề xuất; đơn giá để 0 cho người lập điền lại trước khi lưu.
 */
export function deXuatMuaHangToPhieuKhoPTPrefill(phieu: DeXuatMuaHang): Partial<PhieuKhoPTFormValues> {
  return {
    loai: 'nhập',
    ngay: today(),
    kho_id: phieu.id_noi_de_xuat,
    kho_den_id: null,
    trang_thai: 'Chờ duyệt',
    mo_ta: phieu.ghi_chu?.trim()
      ? `Theo đề xuất ${phieu.so_phieu} — ${phieu.ghi_chu.trim()}`
      : `Theo đề xuất ${phieu.so_phieu}`,
    id_de_xuat_mua_hang: phieu.id,
    so_phieu_de_xuat: phieu.so_phieu,
    chi_tiet: mapDeXuatChiTietToPhieuKhoPTLines(phieu.chi_tiet),
  };
}
