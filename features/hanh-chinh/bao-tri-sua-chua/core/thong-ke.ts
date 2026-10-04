/**
 * Tổng hợp tab Thống kê phiếu bảo trì / sửa chữa — thuần, không phụ thuộc React.
 * Mọi nhóm đều có cả số phiếu lẫn tổng tiền; sắp giảm dần theo tổng tiền.
 */
import type { PhieuBaoTriSuaChua } from './types';

export interface NhomThongKe {
  id: string;
  ten: string;
  soPhieu: number;
  tongTien: number;
}

export interface ThangThongKe {
  /** yyyy-mm */
  thang: string;
  /** mm/yyyy */
  nhan: string;
  soPhieu: number;
  tongTien: number;
}

export interface TongQuanThongKe {
  soPhieu: number;
  tongTien: number;
  /** Tổng tiền các phiếu Đã duyệt. */
  tienDaDuyet: number;
  soChoDuyet: number;
  soTaiSan: number;
}

export interface ThongKePhieu {
  tongQuan: TongQuanThongKe;
  theoHangMuc: NhomThongKe[];
  theoTaiSan: NhomThongKe[];
  theoChiNhanh: NhomThongKe[];
  theoNhaCungCap: NhomThongKe[];
  theoThang: ThangThongKe[];
}

export interface TuyChonThongKe {
  /** Tên hạng mục khi phiếu chưa lưu tắt tên (tra danh mục / nhãn legacy). */
  tenHangMuc: (idHangMuc: string) => string;
  /** Nhãn cho nhóm trống (phiếu chưa có chi nhánh). */
  chuaCoChiNhanh: string;
  /** Nhãn cho phiếu không chọn nhà cung cấp. */
  khongCoNhaCungCap: string;
}

const tien = (p: PhieuBaoTriSuaChua) => Number(p.so_tien) || 0;

function cong(map: Map<string, NhomThongKe>, id: string, ten: string, soTien: number) {
  const cur = map.get(id) ?? { id, ten, soPhieu: 0, tongTien: 0 };
  cur.soPhieu += 1;
  cur.tongTien += soTien;
  map.set(id, cur);
}

const sapXep = (map: Map<string, NhomThongKe>) =>
  [...map.values()].sort((a, b) => b.tongTien - a.tongTien || b.soPhieu - a.soPhieu || a.ten.localeCompare(b.ten, 'vi'));

export function tinhThongKe(list: PhieuBaoTriSuaChua[], opts: TuyChonThongKe): ThongKePhieu {
  const hangMuc = new Map<string, NhomThongKe>();
  const taiSan = new Map<string, NhomThongKe>();
  const chiNhanh = new Map<string, NhomThongKe>();
  const ncc = new Map<string, NhomThongKe>();
  const thang = new Map<string, ThangThongKe>();
  let tongTien = 0;
  let tienDaDuyet = 0;
  let soChoDuyet = 0;

  for (const p of list) {
    const soTien = tien(p);
    tongTien += soTien;
    if (p.trang_thai === 'da_duyet') tienDaDuyet += soTien;
    if (p.trang_thai === 'cho_duyet') soChoDuyet += 1;

    cong(hangMuc, p.id_hang_muc, p.ten_hang_muc?.trim() || opts.tenHangMuc(p.id_hang_muc), soTien);
    if (p.id_tai_san) {
      const ten = [p.ma_tai_san, p.ten_tai_san].filter(Boolean).join(' – ') || p.id_tai_san;
      cong(taiSan, p.id_tai_san, ten, soTien);
    }
    cong(chiNhanh, p.id_chi_nhanh ?? '', p.ten_chi_nhanh?.trim() || opts.chuaCoChiNhanh, soTien);
    cong(ncc, p.id_nha_cung_cap ?? '', p.ten_nha_cung_cap?.trim() || opts.khongCoNhaCungCap, soTien);

    // Cột date ở DB (yyyy-mm-dd) — cắt chuỗi, không qua Date để khỏi lệch múi giờ.
    const key = /^\d{4}-\d{2}/.test(p.ngay) ? p.ngay.slice(0, 7) : '';
    if (key) {
      const cur = thang.get(key) ?? { thang: key, nhan: `${key.slice(5, 7)}/${key.slice(0, 4)}`, soPhieu: 0, tongTien: 0 };
      cur.soPhieu += 1;
      cur.tongTien += soTien;
      thang.set(key, cur);
    }
  }

  return {
    tongQuan: { soPhieu: list.length, tongTien, tienDaDuyet, soChoDuyet, soTaiSan: taiSan.size },
    theoHangMuc: sapXep(hangMuc),
    theoTaiSan: sapXep(taiSan),
    theoChiNhanh: sapXep(chiNhanh),
    theoNhaCungCap: sapXep(ncc),
    theoThang: [...thang.values()].sort((a, b) => a.thang.localeCompare(b.thang)),
  };
}
