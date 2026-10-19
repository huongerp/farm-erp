import type { DeXuatMuaHang } from '../../de-xuat-mua-hang/core/types';
import type { PhieuKhoPTChiTietFormItem, PhieuKhoPTFormValues } from './schema';
import { getTodayISO } from '../../../../lib/utils';
import { ghepDongChon, type DongDaChon } from '../../../../lib/thuc-hien-tung-phan';

// Ngày theo múi giờ công ty — toISOString() là UTC, trước 7h sáng ra ngày hôm qua mà người
// thường không tự sửa được (ô ngày khoá, chỉ cấp cao đổi).
const today = () => getTodayISO();

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

/** Dòng phiếu kho nhập theo lựa chọn ở popup (nhập từng phần): SL lần này, ghi chú của dòng nguồn. */
export function mapDongChonToPhieuKhoPTLines(
  chiTiet: DeXuatMuaHang['chi_tiet'],
  dongChon: readonly DongDaChon[]
): PhieuKhoPTChiTietFormItem[] {
  return ghepDongChon(chiTiet, dongChon).map(({ dong, so_luong }) => ({
    id_hang_hoa: dong.id_hang_hoa,
    so_luong,
    don_gia: 0,
    so_lot: '',
    ghi_chu: dong.ghi_chu?.trim() || '',
  }));
}

/**
 * Điền sẵn phiếu kho NHẬP phân thuốc từ phiếu đề xuất mua hàng đã duyệt.
 * Kho nhập = nơi đề xuất; đơn giá để 0 cho người lập điền lại trước khi lưu.
 * `dongChon` (popup chọn hàng): chỉ lấy các hàng đó với SL lần này; bỏ trống → mọi dòng đủ SL.
 */
export function deXuatMuaHangToPhieuKhoPTPrefill(
  phieu: DeXuatMuaHang,
  dongChon?: readonly DongDaChon[]
): Partial<PhieuKhoPTFormValues> {
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
    chi_tiet: dongChon ? mapDongChonToPhieuKhoPTLines(phieu.chi_tiet, dongChon) : mapDeXuatChiTietToPhieuKhoPTLines(phieu.chi_tiet),
  };
}
