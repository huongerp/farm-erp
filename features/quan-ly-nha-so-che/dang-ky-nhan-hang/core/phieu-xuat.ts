/**
 * Phiếu xuất kho thành phẩm sinh từ cây hàng trên xe (migration 042, rpc_dknh_tao_phieu_xuat).
 *
 * KHÔNG tự đồng bộ: quét thêm / sửa / xoá cây sau khi đã tạo phiếu chỉ làm phiếu "cần cập nhật",
 * người dùng bấm "Cập nhật phiếu xuất" để ghi lại. Luật so khớp ở đây PHẢI giống
 * fn_dknh_tinh_lai_phieu_xuat (DB tính cột tinh_trang_phieu_xuat cho danh sách / chip lọc):
 * so TỔNG số thùng theo thành phẩm (id_hang_hoa của phiếu QC) giữa xe và dòng phiếu.
 */
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';
import type { DangKyNhanHangCt, TrangThaiDkNh } from './types';

/** DB: fp_farm_dang_ky_nhan_hang.tinh_trang_phieu_xuat (NULL = xe chưa có cây hàng). */
export const TINH_TRANG_PHIEU_XUAT = ['chua_tao', 'can_cap_nhat', 'da_tao', 'da_duyet'] as const;
export type TinhTrangPhieuXuat = (typeof TINH_TRANG_PHIEU_XUAT)[number];

export const TINH_TRANG_PHIEU_XUAT_SEMANTIC: Record<TinhTrangPhieuXuat, StatusBadgeSemantic> = {
  chua_tao: 'neutral',
  can_cap_nhat: 'rejected',
  da_tao: 'pending',
  da_duyet: 'success',
};

export type TrangThaiPhieuKho = 'Chờ duyệt' | 'Đã duyệt' | 'Không duyệt';

export interface DongPhieuXuat {
  id_hang_hoa: string;
  ten_hang_hoa: string | null;
  so_luong: number;
}

/** Phiếu xuất còn hiệu lực (≠ Không duyệt) gắn với xe. */
export interface PhieuXuatCuaXe {
  id: string;
  so_phieu: string;
  ngay: string;
  trang_thai: TrangThaiPhieuKho;
  kho_id: string;
  ten_kho: string | null;
  /** Luồng "Xin sửa" phiếu kho (migration 035). */
  trang_thai_sua: 'cho_cap' | 'da_cap' | null;
  id_nguoi_xin_sua: string | null;
  dong: DongPhieuXuat[];
}

export interface ChenhLechThanhPham {
  /** '' khi phiếu QC chưa chọn thành phẩm. */
  id_hang_hoa: string;
  ten_hang_hoa: string | null;
  /** 0 = chưa có trên phiếu. */
  so_luong_phieu: number;
  /** 0 = đã bỏ khỏi xe. */
  so_luong_xe: number;
}

/**
 * Các thành phẩm có tổng thùng trên xe khác trên phiếu. Rỗng = khớp.
 * Cây chưa có thành phẩm (id_hang_hoa null) luôn tính là lệch — phiếu không ghi được dòng đó.
 */
export function soLechPhieuXuat(cay: DangKyNhanHangCt[], dong: DongPhieuXuat[]): ChenhLechThanhPham[] {
  const map = new Map<string, ChenhLechThanhPham>();
  const lay = (id: string, ten: string | null) => {
    let r = map.get(id);
    if (!r) {
      r = { id_hang_hoa: id, ten_hang_hoa: ten, so_luong_phieu: 0, so_luong_xe: 0 };
      map.set(id, r);
    }
    if (!r.ten_hang_hoa && ten) r.ten_hang_hoa = ten;
    return r;
  };
  for (const c of cay) lay(c.id_hang_hoa ?? '', c.ten_hang_hoa ?? c.ma_hang_hoa).so_luong_xe += c.so_luong;
  for (const d of dong) lay(d.id_hang_hoa, d.ten_hang_hoa).so_luong_phieu += d.so_luong;

  return [...map.values()]
    .filter((r) => r.id_hang_hoa === '' || !bangNhau(r.so_luong_xe, r.so_luong_phieu))
    .sort((a, b) => (a.ten_hang_hoa ?? '').localeCompare(b.ten_hang_hoa ?? '', 'vi'));
}

/** numeric(18,4) ở DB — so tới 4 chữ số thập phân. */
function bangNhau(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.00005;
}

/** Cùng luật với cột DB — dùng ở chi tiết xe để hiện ngay sau khi quét, không chờ tải lại danh sách. */
export function tinhTrangPhieuXuat(
  cay: DangKyNhanHangCt[],
  phieu: PhieuXuatCuaXe | null
): TinhTrangPhieuXuat | null {
  if (!phieu) return cay.length > 0 ? 'chua_tao' : null;
  if (soLechPhieuXuat(cay, phieu.dong).length > 0) return 'can_cap_nhat';
  return phieu.trang_thai === 'Đã duyệt' ? 'da_duyet' : 'da_tao';
}

/**
 * Phiếu xuất đã duyệt thì khoá cây hàng trên xe — trừ cấp cao và người được cấp "Xin sửa"
 * phiếu kho đó. Khớp trigger fn_dknh_ct_khoa_phieu_xuat_duyet.
 */
export function khoaBoiPhieuXuat(
  phieu: PhieuXuatCuaXe | null,
  capCao: boolean,
  idNguoiDung: string | null
): boolean {
  if (!phieu || phieu.trang_thai !== 'Đã duyệt' || capCao) return false;
  const duocCap = phieu.trang_thai_sua === 'da_cap' && idNguoiDung != null && phieu.id_nguoi_xin_sua === idNguoiDung;
  return !duocCap;
}

/**
 * Nút "Tạo phiếu xuất kho" / "Cập nhật phiếu xuất": xe đã vào hoặc đã ra, có cây hàng, phiếu chưa bị khoá
 * (người thường vẫn tạo được sau khi xe ra — thủ kho thường làm lúc đó). RPC kiểm lại ở DB.
 */
export function coTheTaoPhieuXuat(tt: TrangThaiDkNh, soCay: number, khoa: boolean): boolean {
  return (tt === 'da_vao' || tt === 'da_ra') && soCay > 0 && !khoa;
}

export interface KhoLite {
  id: string;
  ten_kho: string;
  id_chi_nhanh: string | null;
}

/** Kho xuất được của xe = kho thuộc chi nhánh của xe (NSC fp2 có 2 kho → phải chọn). */
export function khoCuaChiNhanh<K extends KhoLite>(dsKho: K[], idChiNhanh: string): K[] {
  return dsKho.filter((k) => k.id_chi_nhanh === idChiNhanh);
}
